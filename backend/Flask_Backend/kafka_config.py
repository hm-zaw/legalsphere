import os
from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import KafkaError
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KafkaConfig:
    """Kafka configuration and connection management"""
    
    def __init__(self):
        self.bootstrap_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', '127.0.0.1:9092')
        logger.info(f"Kafka bootstrap servers: {self.bootstrap_servers}")
        self.case_notifications_topic = os.getenv('KAFKA_CASE_NOTIFICATIONS_TOPIC', 'case-notifications')
        self.group_id = os.getenv('KAFKA_CONSUMER_GROUP_ID', 'notification-processors')
        
    def get_producer_config(self):
        """Get Kafka producer configuration"""
        return {
            'bootstrap_servers': self.bootstrap_servers,
            'value_serializer': lambda v: json.dumps(v).encode('utf-8'),
            'key_serializer': lambda k: k.encode('utf-8') if k else None,
            'acks': 'all',  # Wait for all replicas to acknowledge
            'retries': 3,
            'retry_backoff_ms': 100,
            'batch_size': 16384,
            'linger_ms': 10,
            'buffer_memory': 33554432,
        }
    
    def get_consumer_config(self):
        """Get Kafka consumer configuration"""
        return {
            'bootstrap_servers': self.bootstrap_servers,
            'group_id': self.group_id,
            'value_deserializer': lambda m: json.loads(m.decode('utf-8')),
            'key_deserializer': lambda k: k.decode('utf-8') if k else None,
            'auto_offset_reset': 'earliest',
            'enable_auto_commit': True,
            'auto_commit_interval_ms': 1000,
            'session_timeout_ms': 10000,
            'heartbeat_interval_ms': 3000,
            'request_timeout_ms': 30000,
            'reconnect_backoff_ms': 1000,
            'retry_backoff_ms': 100,
        }

class KafkaService:
    """Kafka service for producing and consuming messages"""
    
    def __init__(self):
        self.config = KafkaConfig()
        self.producer = None
        self.consumer = None
        
    def get_producer(self):
        """Get or create Kafka producer"""
        if self.producer is None:
            try:
                producer_config = self.config.get_producer_config()
                self.producer = KafkaProducer(**producer_config)
                logger.info("Kafka producer created successfully")
            except Exception as e:
                logger.error(f"Failed to create Kafka producer: {e}")
                raise
        return self.producer
    
    def get_consumer(self, topics=None):
        """Get or create Kafka consumer"""
        if self.consumer is None:
            try:
                consumer_config = self.config.get_consumer_config()
                self.consumer = KafkaConsumer(**consumer_config)
                if topics:
                    if isinstance(topics, str):
                        topics = [topics]
                    self.consumer.subscribe(topics)
                logger.info(f"Kafka consumer created and subscribed to topics: {topics}")
            except Exception as e:
                logger.error(f"Failed to create Kafka consumer: {e}")
                raise
        return self.consumer
    
    def publish_notification(self, notification_data):
        """Publish notification to Kafka topic"""
        try:
            producer = self.get_producer()
            
            message = {
                'event_type': 'case_notification',
                'timestamp': notification_data.get('timestamp'),
                'data': notification_data
            }
            
            # Use user ID as key for partitioning
            user_id = notification_data.get('user_id', 'unknown')
            
            future = producer.send(
                topic=self.config.case_notifications_topic,
                key=user_id,
                value=message
            )
            
            record_metadata = future.get(timeout=10)
            
            logger.info(f"Notification published to Kafka: "
                       f"Topic: {record_metadata.topic}, "
                       f"Partition: {record_metadata.partition}, "
                       f"Offset: {record_metadata.offset}")
            
            return True
            
        except KafkaError as e:
            logger.error(f"Failed to publish notification: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error publishing notification: {e}")
            return False
    
    def close(self):
        """Close Kafka connections"""
        if self.producer:
            self.producer.close()
            logger.info("Kafka producer closed")
        if self.consumer:
            self.consumer.close()
            logger.info("Kafka consumer closed")

# Global Kafka service instance
kafka_service = KafkaService()
