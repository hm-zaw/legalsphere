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

class NotificationProcessor:
    """Background processor for case notifications from Kafka"""
    
    def __init__(self):
        self.running = False
        self.consumer_thread = None
        
    def start(self):
        """Start the notification processor"""
        if self.running:
            logger.warning("Notification processor is already running")
            return
            
        self.running = True
        self.consumer_thread = threading.Thread(target=self._process_messages)
        self.consumer_thread.daemon = True
        self.consumer_thread.start()
        logger.info("Notification processor started")
    
    def stop(self):
        """Stop the notification processor"""
        self.running = False
        if self.consumer_thread:
            self.consumer_thread.join(timeout=10)
        logger.info("Notification processor stopped")
    
    def _process_messages(self):
        """Process messages from Kafka"""
        try:
            consumer = kafka_service.get_consumer(['case-notifications'])
            
            logger.info("Started consuming messages from 'case-notifications' topic")
            
            while self.running:
                try:
                    # Poll for messages with timeout (1.0 second)
                    msg = consumer.poll(1.0)
                    
                    if msg is None:
                        continue
                        
                    if msg.error():
                        if msg.error().code() == KafkaError._PARTITION_EOF:
                            # End of partition event
                            continue
                        else:
                            logger.error(f"Consumer error: {msg.error()}")
                            continue
                    
                    try:
                        # Log metadata about the consumed record
                        try:
                            logger.info(f"Consumed notification from {msg.topic()}:{msg.partition()} at offset {msg.offset()}")
                        except Exception:
                            pass
                        
                        self._process_notification_message(msg)
                    except Exception as e:
                        logger.error(f"Error processing notification message: {e}")
                        continue
                            
                except Exception as e:
                    logger.error(f"Error in consumer poll loop: {e}")
                    time.sleep(5)  # Wait before retrying
                    
        except Exception as e:
            logger.error(f"Fatal error in notification processor: {e}")
        finally:
            kafka_service.close()
    
    def _process_notification_message(self, message):
        """Process a single notification message"""
        try:
            # Extract notification data
            # confluent-kafka returns bytes, need to deserialize
            raw_value = message.value()
            if not raw_value:
                logger.warning("Received empty message value")
                return

            message_data = json.loads(raw_value.decode('utf-8'))
            notification_data = message_data.get('data', {})
            
            if not notification_data:
                logger.error("No notification data found in message")
                return
            
            # Key might be bytes
            kafka_key = message.key()
            if isinstance(kafka_key, bytes):
                kafka_key = kafka_key.decode('utf-8')

            logger.info(f"Processing notification message: {kafka_key}")
            
            # Store in MongoDB notifications collection
            collection = get_db_collection('notifications')
            
            # Create notification document
            notification_doc = {
                'clientId': notification_data.get('clientId'),
                'caseId': notification_data.get('caseId'),
                'notificationType': notification_data.get('notificationType'),
                'title': notification_data.get('title'),
                'message': notification_data.get('message'),
                'metadata': notification_data.get('metadata', {}),
                'read': False,
                'createdAt': datetime.utcnow().isoformat(),
                'kafkaTimestamp': message_data.get('timestamp'),
                'kafkaKey': kafka_key
            }
            
            result = collection.insert_one(notification_doc)
            notification_id = result.inserted_id
            
            logger.info(f"Notification {str(notification_id)} stored in database")
            
            # Also update the case status based on notification type
            if notification_data.get('notificationType') == 'case_rejected':
                self._update_case_rejection_status(notification_data)
            elif notification_data.get('notificationType') == 'case_assigned':
                self._update_case_assigned_status(notification_data)
            elif notification_data.get('notificationType') == 'case_accepted':
                self._update_case_accepted_status(notification_data)
            elif notification_data.get('notificationType') == 'case_denied':
                self._update_case_denied_status(notification_data)
            
            logger.info(f"Successfully processed notification {notification_id}")
            
        except Exception as e:
            logger.error(f"Error processing notification message: {e}")
    
    def _update_case_rejection_status(self, notification_data):
        """Update case status when rejection notification is processed"""
        try:
            case_id = notification_data.get('caseId')
            if not case_id:
                return
            
            collection = get_db_collection('case_requests')
            
            # Find the case by either id or _id
            
            # Try to find by string ID first, then by ObjectId
            case = None
            try:
                case = collection.find_one({'id': case_id})
            except:
                pass
            
            if not case:
                try:
                    case = collection.find_one({'_id': ObjectId(case_id)})
                except:
                    pass
            
            if case:
                # Update case with rejection information
                metadata = notification_data.get('metadata', {})
                collection.update_one(
                    {'_id': case['_id']},
                    {
                        '$set': {
                            'status': 'rejected',
                            'rejectionReason': metadata.get('rejectionReason', 'Rejected by administrator'),
                            'rejectedAt': metadata.get('rejectedAt', datetime.utcnow().isoformat()),
                            'notificationProcessed': True,
                            'notificationProcessedAt': datetime.utcnow().isoformat()
                        }
                    }
                )
                logger.info(f"Updated case {case_id} status to rejected")
            else:
                logger.warning(f"Case {case_id} not found for status update")
                
        except Exception as e:
            logger.error(f"Error updating case rejection status: {e}")

    def _update_case_assigned_status(self, notification_data):
        """Update case status when lawyer is assigned"""
        try:
            case_id = notification_data.get('caseId')
            if not case_id:
                return
            
            collection = get_db_collection('case_requests')
            
            # Find case helper
            case = self._find_case(collection, case_id)
            
            if case:
                metadata = notification_data.get('metadata', {})
                lawyer_id = metadata.get('lawyerId')
                lawyer_name = metadata.get('lawyerName')
                
                collection.update_one(
                    {'_id': case['_id']},
                    {
                        '$set': {
                            'status': 'lawyer_assigned',
                            'assignedLawyer': {
                                'id': lawyer_id,
                                'name': lawyer_name,
                                'assignedAt': datetime.utcnow().isoformat()
                            },
                            'assignedLawyerId': lawyer_id, # Top level for easier querying
                            'updatedAt': datetime.utcnow().isoformat()
                        }
                    }
                )
                logger.info(f"Updated case {case_id} status to lawyer_assigned (Lawyer: {lawyer_name})")
            else:
                logger.warning(f"Case {case_id} not found for assignment update")
        except Exception as e:
            logger.error(f"Error updating case assignment status: {e}")

    def _update_case_accepted_status(self, notification_data):
        """Update case status when lawyer accepts assignment"""
        try:
            case_id = notification_data.get('caseId')
            if not case_id:
                return
            
            collection = get_db_collection('case_requests')
            case = self._find_case(collection, case_id)
            
            if case:
                collection.update_one(
                    {'_id': case['_id']},
                    {
                        '$set': {
                            'status': 'active', # or 'in_progress'
                            'lawyerAcceptedAt': datetime.utcnow().isoformat(),
                            'updatedAt': datetime.utcnow().isoformat()
                        }
                    }
                )
                logger.info(f"Updated case {case_id} status to active (Accepted by lawyer)")
            else:
                logger.warning(f"Case {case_id} not found for acceptance update")
        except Exception as e:
            logger.error(f"Error updating case acceptance status: {e}")

    def _update_case_denied_status(self, notification_data):
        """Update case status when lawyer denies assignment"""
        try:
            case_id = notification_data.get('caseId')
            if not case_id:
                return
            
            collection = get_db_collection('case_requests')
            case = self._find_case(collection, case_id)
            
            if case:
                metadata = notification_data.get('metadata', {})
                lawyer_id = metadata.get('lawyerId')
                
                update_op = {
                    '$set': {
                        'status': 'pending_admin_review', # Return to admin pool
                        'assignedLawyer': None, # Clear current assignment
                        'assignedLawyerId': None,
                        'updatedAt': datetime.utcnow().isoformat()
                    }
                }
                
                # Add to denied list
                if lawyer_id:
                    update_op['$addToSet'] = {
                        'deniedLawyerIds': lawyer_id
                    }
                
                collection.update_one({'_id': case['_id']}, update_op)
                logger.info(f"Updated case {case_id} status to pending_admin_review (Denied by lawyer {lawyer_id})")
                
                # Create admin notification
                self._create_admin_notification(case, lawyer_id, metadata)
            else:
                logger.warning(f"Case {case_id} not found for denial update")
        except Exception as e:
            logger.error(f"Error updating case denial status: {e}")

    def _create_admin_notification(self, case, lawyer_id, metadata):
        """Create an admin notification when lawyer denies a case"""
        try:
            collection = get_db_collection('admin_notifications')
            
            # Get lawyer name if available
            lawyer_name = f"Lawyer {lawyer_id}"
            if hasattr(self, '_lawyers_cache') and lawyer_id in self._lawyers_cache:
                lawyer_name = self._lawyers_cache[lawyer_id].get('name', lawyer_name)
            
            notification = {
                'type': 'lawyer_denied_case',
                'title': 'Lawyer Declined Case Assignment',
                'message': f"{lawyer_name} has declined the case: {case.get('case', {}).get('title', case.get('id', 'Unknown'))}",
                'caseId': case.get('id') or str(case.get('_id')),
                'lawyerId': lawyer_id,
                'lawyerName': lawyer_name,
                'denialReason': metadata.get('denialReason', 'No reason provided'),
                'read': False,
                'createdAt': datetime.utcnow().isoformat()
            }
            
            collection.insert_one(notification)
            logger.info(f"Created admin notification for case denial: {case.get('id')}")
            
        except Exception as e:
            logger.error(f"Error creating admin notification: {e}")

    def _find_case(self, collection, case_id):
        """Helper to find case by id string or ObjectId"""
        try:
            return collection.find_one({'id': case_id})
        except:
            pass
        
        try:
            return collection.find_one({'_id': ObjectId(case_id)})
        except:
            return None

# Global notification processor instance
notification_processor = NotificationProcessor()

def start_notification_processor():
    """Start the notification processor service"""
    notification_processor.start()

def stop_notification_processor():
    """Stop the notification processor service"""
    notification_processor.stop()
