import threading
import time
import logging
from datetime import datetime
from kafka_config import kafka_service
from mongodb_client import get_db_collection
from bson.objectid import ObjectId

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
                    # Poll for messages with timeout
                    message_batch = consumer.poll(timeout_ms=1000)
                    
                    if not message_batch:
                        continue
                    
                    for topic_partition, messages in message_batch.items():
                        for message in messages:
                            try:
                                # Log metadata about the consumed record
                                try:
                                    tp = f"{topic_partition.topic}:{topic_partition.partition}"
                                    logger.info(f"Consumed notification from {tp} at offset {message.offset}, key={message.key}")
                                except Exception:
                                    pass
                                self._process_notification_message(message)
                            except Exception as e:
                                logger.error(f"Error processing notification message: {e}")
                                continue
                            
                except Exception as e:
                    logger.error(f"Error in consumer poll: {e}")
                    time.sleep(5)  # Wait before retrying
                    
        except Exception as e:
            logger.error(f"Fatal error in notification processor: {e}")
        finally:
            kafka_service.close()
    
    def _process_notification_message(self, message):
        """Process a single notification message"""
        try:
            logger.info(f"Processing notification message: {message.key}")
            
            # Extract notification data
            message_data = message.value
            notification_data = message_data.get('data', {})
            
            if not notification_data:
                logger.error("No notification data found in message")
                return
            
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
                'kafkaKey': message.key
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
            # from bson.objectid import ObjectId (Moved to top)
            
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
            else:
                logger.warning(f"Case {case_id} not found for denial update")
        except Exception as e:
            logger.error(f"Error updating case denial status: {e}")

    def _find_case(self, collection, case_id):
        """Helper to find case by id string or ObjectId"""
        # from bson.objectid import ObjectId (Moved to top)
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
