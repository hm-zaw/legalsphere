import os
import json
import logging
from confluent_kafka import Producer, Consumer, KafkaError, KafkaException
from dotenv import load_dotenv

# Ensure env vars are loaded
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KafkaConfig:
    """Kafka configuration and connection management using confluent-kafka"""
    
    def __init__(self):
        self.bootstrap_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', '127.0.0.1:9092').strip('"')
        self.case_notifications_topic = os.getenv('KAFKA_CASE_NOTIFICATIONS_TOPIC', 'case-notifications')
        # New topics for lawyer assignment workflow
        self.lawyer_assignments_topic = os.getenv('KAFKA_LAWYER_ASSIGNMENTS_TOPIC', 'lawyer-assignments')
        self.lawyer_responses_topic = os.getenv('KAFKA_LAWYER_RESPONSES_TOPIC', 'lawyer-responses')
        self.case_connections_topic = os.getenv('KAFKA_CASE_CONNECTIONS_TOPIC', 'case-connections')
        self.admin_reassignments_topic = os.getenv('KAFKA_ADMIN_REASSIGNMENTS_TOPIC', 'admin-reassignments')
        self.group_id = os.getenv('KAFKA_CONSUMER_GROUP_ID', 'notification-processors')
        
        # CHANGED: Default to 'SSL' for Aiven mTLS
        self.security_protocol = os.getenv('KAFKA_SECURITY_PROTOCOL', 'SSL')
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # Path formatting for Windows/librdkafka
        self.ca_path = os.path.join(current_dir, 'ca.pem').replace('\\', '/')
        self.cert_path = os.path.join(current_dir, 'service.cert').replace('\\', '/')
        self.key_path = os.path.join(current_dir, 'service.key').replace('\\', '/')

    def get_common_config(self):
        conf = {'bootstrap.servers': self.bootstrap_servers}
        
        if self.security_protocol == 'SSL':
            conf.update({
                'security.protocol': 'SSL',
                'ssl.ca.location': self.ca_path,
                'ssl.certificate.location': self.cert_path,
                'ssl.key.location': self.key_path,
                # Required for Aiven SNI routing
                'ssl.endpoint.identification.algorithm': 'https',
            })
        elif self.security_protocol == 'SASL_SSL':
            conf.update({
                'security.protocol': 'SASL_SSL',
                'sasl.mechanism': os.getenv('KAFKA_SASL_MECHANISM', 'SCRAM-SHA-256'),
                'sasl.username': os.getenv('KAFKA_USERNAME'),
                'sasl.password': os.getenv('KAFKA_PASSWORD'),
                'ssl.ca.location': self.ca_path,
                'ssl.endpoint.identification.algorithm': 'https',
            })
        
        return conf

    def get_producer_config(self):
        conf = self.get_common_config()
        conf.update({'client.id': 'flask-producer', 'acks': 'all'})
        return conf
    
    def get_consumer_config(self):
        """Get Kafka consumer configuration"""
        conf = self.get_common_config()
        conf.update({
            'group.id': self.group_id,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': True
        })
        return conf

class KafkaService:
    """Kafka service for producing and consuming messages"""
    
    def __init__(self):
        self.config = KafkaConfig()
        self.producer = None
        # Consumer is typically created on demand or in a separate thread/process
        
    def get_producer(self):
        if self.producer is None:
            try:
                producer_config = self.config.get_producer_config()
                self.producer = Producer(producer_config)
                logger.info("Kafka producer created successfully")
            except Exception as e:
                logger.error(f"Failed to create Kafka producer: {e}")
        return self.producer
    
    def get_consumer(self, topics=None):
        """
        Create and return a new Kafka consumer using confluent-kafka.
        Note: The caller is responsible for polling the consumer.
        """
        try:
            consumer_config = self.config.get_consumer_config()
            consumer = Consumer(consumer_config)
            
            if topics:
                if isinstance(topics, str):
                    topics = [topics]
                consumer.subscribe(topics)
                logger.info(f"Kafka consumer created and subscribed to topics: {topics}")
            
            return consumer
        except Exception as e:
            logger.error(f"Failed to create Kafka consumer: {e}")
            raise

    def publish_notification(self, notification_data):
        try:
            producer = self.get_producer()
            if not producer:
                return False

            message = {
                'event_type': 'case_notification',
                'timestamp': notification_data.get('timestamp'),
                'data': notification_data
            }
            
            user_id = notification_data.get('user_id', 'unknown')
            
            # confluent-kafka uses callback for delivery reports
            def delivery_report(err, msg):
                if err is not None:
                    logger.error(f"Message delivery failed: {err}")
                else:
                    logger.debug(f"Message delivered to {msg.topic()} [{msg.partition()}]")

            # Produce message
            # Note: value and key must be bytes (or serialized)
            json_value = json.dumps(message).encode('utf-8')
            key_value = str(user_id).encode('utf-8') if user_id else None

            producer.produce(
                topic=self.config.case_notifications_topic,
                key=key_value,
                value=json_value,
                callback=delivery_report
            )
            
            # Flush to ensure delivery (sync) - typically unnecessary for high throughput but good for critical single messages
            producer.flush(timeout=5)
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish notification: {e}")
            return False

    def publish_lawyer_assignment(self, assignment_data):
        """Publish lawyer assignment notification"""
        try:
            producer = self.get_producer()
            if not producer:
                return False

            message = {
                'event_type': 'lawyer_assignment',
                'timestamp': assignment_data.get('timestamp'),
                'data': assignment_data
            }
            
            lawyer_id = assignment_data.get('lawyerId', 'unknown')
            
            def delivery_report(err, msg):
                if err is not None:
                    logger.error(f"Lawyer assignment delivery failed: {err}")
                else:
                    logger.debug(f"Lawyer assignment delivered to {msg.topic()} [{msg.partition()}]")

            json_value = json.dumps(message).encode('utf-8')
            key_value = str(lawyer_id).encode('utf-8') if lawyer_id else None

            producer.produce(
                topic=self.config.lawyer_assignments_topic,
                key=key_value,
                value=json_value,
                callback=delivery_report
            )
            
            producer.flush(timeout=5)
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish lawyer assignment: {e}")
            return False

    def publish_lawyer_response(self, response_data):
        """Publish lawyer accept/reject response"""
        try:
            producer = self.get_producer()
            if not producer:
                return False

            message = {
                'event_type': 'lawyer_response',
                'timestamp': response_data.get('timestamp'),
                'data': response_data
            }
            
            case_id = response_data.get('caseId', 'unknown')
            
            def delivery_report(err, msg):
                if err is not None:
                    logger.error(f"Lawyer response delivery failed: {err}")
                else:
                    logger.debug(f"Lawyer response delivered to {msg.topic()} [{msg.partition()}]")

            json_value = json.dumps(message).encode('utf-8')
            key_value = str(case_id).encode('utf-8') if case_id else None

            producer.produce(
                topic=self.config.lawyer_responses_topic,
                key=key_value,
                value=json_value,
                callback=delivery_report
            )
            
            producer.flush(timeout=5)
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish lawyer response: {e}")
            return False

    def publish_case_connection(self, connection_data):
        """Publish case connection notification when lawyer accepts"""
        try:
            producer = self.get_producer()
            if not producer:
                return False

            message = {
                'event_type': 'case_connection',
                'timestamp': connection_data.get('timestamp'),
                'data': connection_data
            }
            
            case_id = connection_data.get('caseId', 'unknown')
            
            def delivery_report(err, msg):
                if err is not None:
                    logger.error(f"Case connection delivery failed: {err}")
                else:
                    logger.debug(f"Case connection delivered to {msg.topic()} [{msg.partition()}]")

            json_value = json.dumps(message).encode('utf-8')
            key_value = str(case_id).encode('utf-8') if case_id else None

            producer.produce(
                topic=self.config.case_connections_topic,
                key=key_value,
                value=json_value,
                callback=delivery_report
            )
            
            producer.flush(timeout=5)
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish case connection: {e}")
            return False

    def publish_admin_reassignment(self, reassignment_data):
        """Publish admin reassignment notification when lawyer rejects"""
        try:
            producer = self.get_producer()
            if not producer:
                return False

            message = {
                'event_type': 'admin_reassignment',
                'timestamp': reassignment_data.get('timestamp'),
                'data': reassignment_data
            }
            
            admin_id = reassignment_data.get('adminId', 'admin')
            
            def delivery_report(err, msg):
                if err is not None:
                    logger.error(f"Admin reassignment delivery failed: {err}")
                else:
                    logger.debug(f"Admin reassignment delivered to {msg.topic()} [{msg.partition()}]")

            json_value = json.dumps(message).encode('utf-8')
            key_value = str(admin_id).encode('utf-8') if admin_id else None

            producer.produce(
                topic=self.config.admin_reassignments_topic,
                key=key_value,
                value=json_value,
                callback=delivery_report
            )
            
            producer.flush(timeout=5)
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish admin reassignment: {e}")
            return False
    
    def close(self):
        if self.producer:
            self.producer.flush()
            # Producer doesn't have close() in confluent-kafka, it handles cleanup
            pass
        # Consumer close happens in the consumer loop code usually

# Global Kafka service instance
kafka_service = KafkaService()
