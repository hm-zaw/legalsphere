import threading
import time
import logging
import json
from datetime import datetime
from kafka_config import kafka_service
from mongodb_client import get_db_collection
from bson.objectid import ObjectId
from confluent_kafka import KafkaError

logger = logging.getLogger(__name__)

class LawyerAssignmentProcessor:
    """Background processor for lawyer assignment notifications"""
    
    def __init__(self):
        self.running = False
        self.consumer_thread = None
        
    def start(self):
        """Start the lawyer assignment processor"""
        if self.running:
            logger.warning("Lawyer assignment processor is already running")
            return
            
        self.running = True
        self.consumer_thread = threading.Thread(target=self._process_messages)
        self.consumer_thread.daemon = True
        self.consumer_thread.start()
        logger.info("Lawyer assignment processor started")
    
    def stop(self):
        """Stop the lawyer assignment processor"""
        self.running = False
        if self.consumer_thread:
            self.consumer_thread.join(timeout=10)
        logger.info("Lawyer assignment processor stopped")
    
    def _process_messages(self):
        """Process lawyer assignment messages from Kafka"""
        try:
            consumer = kafka_service.get_consumer(['lawyer-assignments'])
            
            logger.info("Started consuming messages from 'lawyer-assignments' topic")
            
            while self.running:
                try:
                    msg = consumer.poll(1.0)
                    
                    if msg is None:
                        continue
                        
                    if msg.error():
                        if msg.error().code() == KafkaError._PARTITION_EOF:
                            continue
                        else:
                            logger.error(f"Consumer error: {msg.error()}")
                            continue
                    
                    try:
                        logger.info(f"Consumed lawyer assignment from {msg.topic()}:{msg.partition()} at offset {msg.offset()}")
                        self._process_assignment_message(msg)
                    except Exception as e:
                        logger.error(f"Error processing lawyer assignment message: {e}")
                        continue
                            
                except Exception as e:
                    logger.error(f"Error in consumer poll loop: {e}")
                    time.sleep(5)
                    
        except Exception as e:
            logger.error(f"Fatal error in lawyer assignment processor: {e}")
        finally:
            consumer.close()
    
    def _process_assignment_message(self, message):
        """Process a single lawyer assignment message"""
        try:
            raw_value = message.value()
            if not raw_value:
                logger.warning("Received empty lawyer assignment message")
                return

            message_data = json.loads(raw_value.decode('utf-8'))
            assignment_data = message_data.get('data', {})
            
            if not assignment_data:
                logger.error("No assignment data found in message")
                return

            logger.info(f"Processing lawyer assignment: {assignment_data.get('caseId')} -> {assignment_data.get('lawyerName')}")
            
            # Store in lawyer notifications collection
            collection = get_db_collection('lawyer_notifications')
            
            notification_doc = {
                'lawyerId': assignment_data.get('lawyerId'),
                'lawyerEmail': assignment_data.get('lawyerEmail'),
                'caseId': assignment_data.get('caseId'),
                'caseTitle': assignment_data.get('caseTitle'),
                'clientId': assignment_data.get('clientId'),
                'clientName': assignment_data.get('clientName'),
                'assignedBy': assignment_data.get('assignedBy'),
                'assignedAt': assignment_data.get('assignedAt'),
                'notificationType': 'case_assignment',
                'read': False,
                'createdAt': datetime.utcnow().isoformat(),
                'kafkaTimestamp': message_data.get('timestamp')
            }
            
            result = collection.insert_one(notification_doc)
            logger.info(f"Lawyer assignment notification {str(result.inserted_id)} stored for lawyer {assignment_data.get('lawyerId')}")
            
        except Exception as e:
            logger.error(f"Error processing lawyer assignment message: {e}")

class LawyerResponseProcessor:
    """Background processor for lawyer accept/reject responses"""
    
    def __init__(self):
        self.running = False
        self.consumer_thread = None
        
    def start(self):
        """Start the lawyer response processor"""
        if self.running:
            logger.warning("Lawyer response processor is already running")
            return
            
        self.running = True
        self.consumer_thread = threading.Thread(target=self._process_messages)
        self.consumer_thread.daemon = True
        self.consumer_thread.start()
        logger.info("Lawyer response processor started")
    
    def stop(self):
        """Stop the lawyer response processor"""
        self.running = False
        if self.consumer_thread:
            self.consumer_thread.join(timeout=10)
        logger.info("Lawyer response processor stopped")
    
    def _process_messages(self):
        """Process lawyer response messages from Kafka"""
        try:
            consumer = kafka_service.get_consumer(['lawyer-responses'])
            
            logger.info("Started consuming messages from 'lawyer-responses' topic")
            
            while self.running:
                try:
                    msg = consumer.poll(1.0)
                    
                    if msg is None:
                        continue
                        
                    if msg.error():
                        if msg.error().code() == KafkaError._PARTITION_EOF:
                            continue
                        else:
                            logger.error(f"Consumer error: {msg.error()}")
                            continue
                    
                    try:
                        logger.info(f"Consumed lawyer response from {msg.topic()}:{msg.partition()} at offset {msg.offset()}")
                        self._process_response_message(msg)
                    except Exception as e:
                        logger.error(f"Error processing lawyer response message: {e}")
                        continue
                            
                except Exception as e:
                    logger.error(f"Error in consumer poll loop: {e}")
                    time.sleep(5)
                    
        except Exception as e:
            logger.error(f"Fatal error in lawyer response processor: {e}")
        finally:
            consumer.close()
    
    def _process_response_message(self, message):
        """Process a single lawyer response message"""
        try:
            raw_value = message.value()
            if not raw_value:
                logger.warning("Received empty lawyer response message")
                return

            message_data = json.loads(raw_value.decode('utf-8'))
            response_data = message_data.get('data', {})
            
            if not response_data:
                logger.error("No response data found in message")
                return

            logger.info(f"Processing lawyer response: {response_data.get('response')} for case {response_data.get('caseId')}")
            
            # Store in admin notifications collection
            collection = get_db_collection('admin_notifications')
            
            notification_doc = {
                'lawyerId': response_data.get('lawyerId'),
                'lawyerName': response_data.get('lawyerName'),
                'lawyerEmail': response_data.get('lawyerEmail'),
                'caseId': response_data.get('caseId'),
                'response': response_data.get('response'),
                'reason': response_data.get('reason'),
                'respondedAt': response_data.get('respondedAt'),
                'notificationType': 'lawyer_response',
                'read': False,
                'createdAt': datetime.utcnow().isoformat(),
                'kafkaTimestamp': message_data.get('timestamp')
            }
            
            result = collection.insert_one(notification_doc)
            logger.info(f"Lawyer response notification {str(result.inserted_id)} stored for admin")
            
        except Exception as e:
            logger.error(f"Error processing lawyer response message: {e}")

class CaseConnectionProcessor:
    """Background processor for case connection notifications"""
    
    def __init__(self):
        self.running = False
        self.consumer_thread = None
        
    def start(self):
        """Start the case connection processor"""
        if self.running:
            logger.warning("Case connection processor is already running")
            return
            
        self.running = True
        self.consumer_thread = threading.Thread(target=self._process_messages)
        self.consumer_thread.daemon = True
        self.consumer_thread.start()
        logger.info("Case connection processor started")
    
    def stop(self):
        """Stop the case connection processor"""
        self.running = False
        if self.consumer_thread:
            self.consumer_thread.join(timeout=10)
        logger.info("Case connection processor stopped")
    
    def _process_messages(self):
        """Process case connection messages from Kafka"""
        try:
            consumer = kafka_service.get_consumer(['case-connections'])
            
            logger.info("Started consuming messages from 'case-connections' topic")
            
            while self.running:
                try:
                    msg = consumer.poll(1.0)
                    
                    if msg is None:
                        continue
                        
                    if msg.error():
                        if msg.error().code() == KafkaError._PARTITION_EOF:
                            continue
                        else:
                            logger.error(f"Consumer error: {msg.error()}")
                            continue
                    
                    try:
                        logger.info(f"Consumed case connection from {msg.topic()}:{msg.partition()} at offset {msg.offset()}")
                        self._process_connection_message(msg)
                    except Exception as e:
                        logger.error(f"Error processing case connection message: {e}")
                        continue
                            
                except Exception as e:
                    logger.error(f"Error in consumer poll loop: {e}")
                    time.sleep(5)
                    
        except Exception as e:
            logger.error(f"Fatal error in case connection processor: {e}")
        finally:
            consumer.close()
    
    def _process_connection_message(self, message):
        """Process a single case connection message"""
        try:
            raw_value = message.value()
            if not raw_value:
                logger.warning("Received empty case connection message")
                return

            message_data = json.loads(raw_value.decode('utf-8'))
            connection_data = message_data.get('data', {})
            
            if not connection_data:
                logger.error("No connection data found in message")
                return

            logger.info(f"Processing case connection: {connection_data.get('caseId')} between {connection_data.get('clientName')} and {connection_data.get('lawyerName')}")
            
            # Store notifications for all parties
            notifications_collection = get_db_collection('notifications')
            
            # Admin notification
            admin_notification = {
                'caseId': connection_data.get('caseId'),
                'caseTitle': connection_data.get('caseTitle'),
                'lawyerId': connection_data.get('lawyerId'),
                'lawyerName': connection_data.get('lawyerName'),
                'clientId': connection_data.get('clientId'),
                'clientName': connection_data.get('clientName'),
                'connectedAt': connection_data.get('connectedAt'),
                'notificationType': 'case_connection_established',
                'targetRole': 'admin',
                'title': 'Case Connection Established',
                'message': f'{connection_data.get("lawyerName")} has accepted case {connection_data.get("caseTitle")} and is now connected with {connection_data.get("clientName")}',
                'read': False,
                'createdAt': datetime.utcnow().isoformat(),
                'kafkaTimestamp': message_data.get('timestamp')
            }
            
            notifications_collection.insert_one(admin_notification)
            
            # Client notification
            client_notification = {
                'clientId': connection_data.get('clientId'),
                'caseId': connection_data.get('caseId'),
                'caseTitle': connection_data.get('caseTitle'),
                'lawyerName': connection_data.get('lawyerName'),
                'connectedAt': connection_data.get('connectedAt'),
                'notificationType': 'lawyer_assigned',
                'targetRole': 'client',
                'title': 'Lawyer Assigned to Your Case',
                'message': f'{connection_data.get("lawyerName")} has been assigned to your case "{connection_data.get("caseTitle")}"',
                'read': False,
                'createdAt': datetime.utcnow().isoformat(),
                'kafkaTimestamp': message_data.get('timestamp')
            }
            
            notifications_collection.insert_one(client_notification)
            
            # Lawyer notification
            lawyer_notification = {
                'lawyerId': connection_data.get('lawyerId'),
                'caseId': connection_data.get('caseId'),
                'caseTitle': connection_data.get('caseTitle'),
                'clientName': connection_data.get('clientName'),
                'connectedAt': connection_data.get('connectedAt'),
                'notificationType': 'case_accepted',
                'targetRole': 'lawyer',
                'title': 'Case Accepted Successfully',
                'message': f'You have successfully accepted case "{connection_data.get("caseTitle")}" and are now connected with {connection_data.get("clientName")}',
                'read': False,
                'createdAt': datetime.utcnow().isoformat(),
                'kafkaTimestamp': message_data.get('timestamp')
            }
            
            notifications_collection.insert_one(lawyer_notification)
            
            logger.info(f"Case connection notifications stored for case {connection_data.get('caseId')}")
            
        except Exception as e:
            logger.error(f"Error processing case connection message: {e}")

class AdminReassignmentProcessor:
    """Background processor for admin reassignment notifications"""
    
    def __init__(self):
        self.running = False
        self.consumer_thread = None
        
    def start(self):
        """Start the admin reassignment processor"""
        if self.running:
            logger.warning("Admin reassignment processor is already running")
            return
            
        self.running = True
        self.consumer_thread = threading.Thread(target=self._process_messages)
        self.consumer_thread.daemon = True
        self.consumer_thread.start()
        logger.info("Admin reassignment processor started")
    
    def stop(self):
        """Stop the admin reassignment processor"""
        self.running = False
        if self.consumer_thread:
            self.consumer_thread.join(timeout=10)
        logger.info("Admin reassignment processor stopped")
    
    def _process_messages(self):
        """Process admin reassignment messages from Kafka"""
        try:
            consumer = kafka_service.get_consumer(['admin-reassignments'])
            
            logger.info("Started consuming messages from 'admin-reassignments' topic")
            
            while self.running:
                try:
                    msg = consumer.poll(1.0)
                    
                    if msg is None:
                        continue
                        
                    if msg.error():
                        if msg.error().code() == KafkaError._PARTITION_EOF:
                            continue
                        else:
                            logger.error(f"Consumer error: {msg.error()}")
                            continue
                    
                    try:
                        logger.info(f"Consumed admin reassignment from {msg.topic()}:{msg.partition()} at offset {msg.offset()}")
                        self._process_reassignment_message(msg)
                    except Exception as e:
                        logger.error(f"Error processing admin reassignment message: {e}")
                        continue
                            
                except Exception as e:
                    logger.error(f"Error in consumer poll loop: {e}")
                    time.sleep(5)
                    
        except Exception as e:
            logger.error(f"Fatal error in admin reassignment processor: {e}")
        finally:
            consumer.close()
    
    def _process_reassignment_message(self, message):
        """Process a single admin reassignment message"""
        try:
            raw_value = message.value()
            if not raw_value:
                logger.warning("Received empty admin reassignment message")
                return

            message_data = json.loads(raw_value.decode('utf-8'))
            reassignment_data = message_data.get('data', {})
            
            if not reassignment_data:
                logger.error("No reassignment data found in message")
                return

            logger.info(f"Processing admin reassignment for case {reassignment_data.get('caseId')} rejected by {reassignment_data.get('rejectedLawyerName')}")
            
            # Store in admin notifications collection
            collection = get_db_collection('admin_notifications')
            
            notification_doc = {
                'caseId': reassignment_data.get('caseId'),
                'caseTitle': reassignment_data.get('caseTitle'),
                'rejectedLawyerId': reassignment_data.get('rejectedLawyerId'),
                'rejectedLawyerName': reassignment_data.get('rejectedLawyerName'),
                'rejectionReason': reassignment_data.get('rejectionReason'),
                'clientId': reassignment_data.get('clientId'),
                'clientName': reassignment_data.get('clientName'),
                'requiresReassignment': reassignment_data.get('requiresReassignment', True),
                'rejectedAt': reassignment_data.get('rejectedAt'),
                'notificationType': 'lawyer_rejection',
                'targetRole': 'admin',
                'title': 'Lawyer Rejected Case Assignment',
                'message': f'{reassignment_data.get("rejectedLawyerName")} rejected case "{reassignment_data.get("caseTitle")}". Reason: {reassignment_data.get("rejectionReason")}',
                'read': False,
                'createdAt': datetime.utcnow().isoformat(),
                'kafkaTimestamp': message_data.get('timestamp')
            }
            
            result = collection.insert_one(notification_doc)
            logger.info(f"Admin reassignment notification {str(result.inserted_id)} stored")
            
        except Exception as e:
            logger.error(f"Error processing admin reassignment message: {e}")

# Global processor instances
lawyer_assignment_processor = LawyerAssignmentProcessor()
lawyer_response_processor = LawyerResponseProcessor()
case_connection_processor = CaseConnectionProcessor()
admin_reassignment_processor = AdminReassignmentProcessor()

def start_lawyer_assignment_processor():
    """Start the lawyer assignment processor service"""
    lawyer_assignment_processor.start()

def stop_lawyer_assignment_processor():
    """Stop the lawyer assignment processor service"""
    lawyer_assignment_processor.stop()

def start_lawyer_response_processor():
    """Start the lawyer response processor service"""
    lawyer_response_processor.start()

def stop_lawyer_response_processor():
    """Stop the lawyer response processor service"""
    lawyer_response_processor.stop()

def start_case_connection_processor():
    """Start the case connection processor service"""
    case_connection_processor.start()

def stop_case_connection_processor():
    """Stop the case connection processor service"""
    case_connection_processor.stop()

def start_admin_reassignment_processor():
    """Start the admin reassignment processor service"""
    admin_reassignment_processor.start()

def stop_admin_reassignment_processor():
    """Stop the admin reassignment processor service"""
    admin_reassignment_processor.stop()

def start_all_processors():
    """Start all new processors"""
    start_lawyer_assignment_processor()
    start_lawyer_response_processor()
    start_case_connection_processor()
    start_admin_reassignment_processor()
    logger.info("All lawyer workflow processors started")

def stop_all_processors():
    """Stop all new processors"""
    stop_lawyer_assignment_processor()
    stop_lawyer_response_processor()
    stop_case_connection_processor()
    stop_admin_reassignment_processor()
    logger.info("All lawyer workflow processors stopped")
