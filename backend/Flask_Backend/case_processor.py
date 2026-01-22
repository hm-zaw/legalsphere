import threading
import time
import logging
from datetime import datetime
from kafka_config import kafka_service
from mongodb_client import get_db_collection
import requests
import json
import os

logger = logging.getLogger(__name__)

class CaseProcessor:
    """Background processor for case submissions from Kafka"""
    
    def __init__(self):
        self.running = False
        self.consumer_thread = None
        self.hf_api_key = os.getenv('HUGGINGFACE_API_KEY')
        self.hf_model_id = os.getenv('HF_MODEL_ID', 'bachminion/vi-legal-bert-finetuned')
        
    def start(self):
        """Start the case processor"""
        if self.running:
            logger.warning("Case processor is already running")
            return
            
        self.running = True
        self.consumer_thread = threading.Thread(target=self._process_messages)
        self.consumer_thread.daemon = True
        self.consumer_thread.start()
        logger.info("Case processor started")
    
    def stop(self):
        """Stop the case processor"""
        self.running = False
        if self.consumer_thread:
            self.consumer_thread.join(timeout=10)
        logger.info("Case processor stopped")
    
    def _process_messages(self):
        """Process messages from Kafka"""
        try:
            consumer = kafka_service.get_consumer(['case-submissions'])
            
            logger.info("Started consuming messages from 'case-submissions' topic")
            
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
                                    logger.info(f"Consumed message from {tp} at offset {message.offset}, key={message.key}")
                                except Exception:
                                    pass
                                self._process_case_message(message)
                            except Exception as e:
                                logger.error(f"Error processing message: {e}")
                                continue
                            
                except Exception as e:
                    logger.error(f"Error in consumer poll: {e}")
                    time.sleep(5)  # Wait before retrying
                    
        except Exception as e:
            logger.error(f"Fatal error in message processor: {e}")
        finally:
            kafka_service.close()
    
    def _process_case_message(self, message):
        """Process a single case submission message"""
        try:
            logger.info(f"Processing message: {message.key}")
            
            # Extract case data
            message_data = message.value
            case_data = message_data.get('data', {})
            
            if not case_data:
                logger.error("No case data found in message")
                return
            
            # Update status to processing
            case_data['status'] = 'processing'
            case_data['processedAt'] = datetime.utcnow().isoformat()
            
            # Store in MongoDB
            collection = get_db_collection('case_requests')
            result = collection.insert_one(case_data)
            case_id = result.inserted_id  # keep ObjectId for correct updates
            
            logger.info(f"Case {str(case_id)} stored in database")
            
            # Perform async analysis
            self._perform_case_analysis(case_data, case_id)
            
            # Send notification
            self._send_notification(case_data, case_id, 'case_submitted')
            
            logger.info(f"Successfully processed case {case_id}")
            
        except Exception as e:
            logger.error(f"Error processing case message: {e}")
            # Update status to failed
            try:
                case_data['status'] = 'processing_failed'
                case_data['error'] = str(e)
                case_data['failedAt'] = datetime.utcnow().isoformat()
                collection = get_db_collection('case_requests')
                collection.insert_one(case_data)
            except:
                pass
    
    def _perform_case_analysis(self, case_data, case_id):
        """Perform AI-based case analysis and lawyer matching"""
        try:
            # Extract case text for analysis
            case_text = self._extract_case_text(case_data)
            
            if not case_text:
                logger.warning(f"No case text available for analysis in case {case_id}")
                return
            
            # Perform classification
            predictions = self._classify_case(case_text)
            
            # Load lawyers and perform matching
            lawyers = self._load_lawyers()
            if lawyers:
                recommendations = self._match_lawyers(case_data, predictions, lawyers)
                
                # Store recommendations
                self._store_recommendations(case_id, predictions, recommendations)
            
            # Update case status
            collection = get_db_collection('case_requests')
            collection.update_one(
                {'_id': case_id},
                {
                    '$set': {
                        'status': 'analysis_completed',
                        'analyzedAt': datetime.utcnow().isoformat(),
                        'predictions': predictions
                    }
                }
            )
            
            logger.info(f"Case analysis completed for case {case_id}")
            
        except Exception as e:
            logger.error(f"Error performing case analysis for case {case_id}: {e}")
            # Update status to analysis_failed
            try:
                collection = get_db_collection('case_requests')
                collection.update_one(
                    {'_id': case_id},
                    {
                        '$set': {
                            'status': 'analysis_failed',
                            'analysisError': str(e),
                            'analysisFailedAt': datetime.utcnow().isoformat()
                        }
                    }
                )
            except:
                pass
    
    def _extract_case_text(self, case_data):
        """Extract text from case data for analysis"""
        try:
            case_info = case_data.get('case', {})
            title = case_info.get('title', '')
            description = case_info.get('description', '')
            category = case_info.get('category', '')
            
            return f"{title}. {description}. Category: {category}".strip()
        except Exception as e:
            logger.error(f"Error extracting case text: {e}")
            return ""
    
    def _classify_case(self, text):
        """Classify case using Hugging Face API or fallback to keywords"""
        try:
            if self.hf_api_key:
                return self._classify_with_huggingface(text)
            else:
                return self._classify_with_keywords(text)
        except Exception as e:
            logger.error(f"Error in case classification: {e}")
            return self._classify_with_keywords(text)
    
    def _classify_with_huggingface(self, text):
        """Classify case using Hugging Face API"""
        try:
            response = requests.post(
                f"https://api-inference.huggingface.co/models/{self.hf_model_id}",
                headers={
                    "Authorization": f"Bearer {self.hf_api_key}",
                    "Content-Type": "application/json",
                },
                json={"inputs": text},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    preds = data[0] if isinstance(data[0], list) else data
                    if isinstance(preds, list) and len(preds) > 0:
                        return [{"label": p.get("label", ""), "score": p.get("score", 0)} for p in preds[:5]]
            
            logger.warning("Hugging Face API failed, falling back to keywords")
            return self._classify_with_keywords(text)
            
        except Exception as e:
            logger.error(f"Hugging Face classification error: {e}")
            return self._classify_with_keywords(text)
    
    def _classify_with_keywords(self, text):
        """Fallback keyword-based classification"""
        # Simple keyword matching for common legal categories
        categories = [
            "Criminal Law", "Civil Law", "Family Law", "Business Law",
            "Property Law", "Labor Law", "Contract Law", "Tort Law"
        ]
        
        text_lower = text.lower()
        scores = []
        
        for category in categories:
            score = 0
            keywords = category.lower().split()
            for keyword in keywords:
                if keyword in text_lower:
                    score += 1
            if score > 0:
                scores.append({"label": category, "score": score / len(keywords)})
        
        return sorted(scores, key=lambda x: x["score"], reverse=True)[:5]
    
    def _load_lawyers(self):
        """Load lawyers data (placeholder - implement based on your data source)"""
        try:
            # This should be implemented based on your lawyers data source
            # For now, return empty list
            logger.info("Lawyer loading not implemented yet")
            return []
        except Exception as e:
            logger.error(f"Error loading lawyers: {e}")
            return []
    
    def _match_lawyers(self, case_data, predictions, lawyers):
        """Match case with suitable lawyers"""
        try:
            # This should implement your lawyer matching algorithm
            # For now, return empty list
            logger.info("Lawyer matching not implemented yet")
            return []
        except Exception as e:
            logger.error(f"Error matching lawyers: {e}")
            return []
    
    def _store_recommendations(self, case_id, predictions, recommendations):
        """Store case analysis recommendations"""
        try:
            collection = get_db_collection('case_recommendations')
            collection.insert_one({
                'caseId': case_id,
                'predictions': predictions,
                'recommendations': recommendations,
                'createdAt': datetime.utcnow().isoformat(),
                'status': 'pending_admin_review'
            })
            logger.info(f"Recommendations stored for case {case_id}")
        except Exception as e:
            logger.error(f"Error storing recommendations: {e}")
    
    def _send_notification(self, case_data, case_id, notification_type):
        """Send notification about case status"""
        try:
            notification = {
                'user_id': case_data.get('client', {}).get('email'),
                'case_id': case_id,
                'type': notification_type,
                'timestamp': datetime.utcnow().isoformat(),
                'data': {
                    'case_title': case_data.get('case', {}).get('title'),
                    'status': case_data.get('status'),
                    'client_email': case_data.get('client', {}).get('email')
                }
            }
            
            # Publish to Kafka notifications topic
            kafka_service.publish_notification(notification)
            
            logger.info(f"Notification sent for case {case_id}")
            
        except Exception as e:
            logger.error(f"Error sending notification: {e}")

# Global case processor instance
case_processor = CaseProcessor()

def start_case_processor():
    """Start the case processor service"""
    case_processor.start()

def stop_case_processor():
    """Stop the case processor service"""
    case_processor.stop()
