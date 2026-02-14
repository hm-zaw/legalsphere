from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
import os
import jwt
import logging
from functools import wraps
from mongodb_client import get_db_collection
from kafka_config import kafka_service

# Configure logger
logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__)

def admin_token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"Error": "Authorization token is missing"}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            secret_key = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
            decoded = jwt.decode(token, secret_key, algorithms=['HS256'])
            
            # Verify admin role
            if decoded.get('role') != 'admin':
                return jsonify({"Error": "Admin access required"}), 403
            
            # Add user info to request context
            request.user_email = decoded.get('email')
            request.user_name = decoded.get('name')
            request.user_role = decoded.get('role')
                
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"Error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"Error": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"Error": f"Authentication error: {str(e)}"}), 401
    
    return decorated_function

@admin_bp.route('/api/admin/case-requests', methods=['GET'])
@admin_token_required
def get_admin_cases():
    """Get all cases for admin review"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        status = request.args.get('status', None)
        
        collection = get_db_collection('case_requests')
        
        # Build query
        query = {}
        if status:
            if status == 'pending':
                query['status'] = {'$in': ['pending_submission', 'pending_admin_review']}
            elif status == 'assigned':
                query['status'] = 'lawyer_assigned'
            elif status == 'active':
                query['status'] = {'$in': ['active', 'in_progress']}
            else:
                query['status'] = status
        
        # Get total count
        total = collection.count_documents(query)
        
        # Get paginated results
        skip = (page - 1) * limit
        cases = list(collection.find(query)
                    .sort('createdAt', -1)
                    .skip(skip)
                    .limit(limit))
        
        # Convert ObjectId to string and format cases
        formatted_cases = []
        for case in cases:
            if '_id' in case:
                case['_id'] = str(case['_id'])
            
            formatted_case = {
                'id': case.get('id', ''),
                '_id': case.get('_id'),
                'title': case.get('case', {}).get('title', 'Untitled Case'),
                'description': case.get('case', {}).get('description', ''),
                'category': case.get('case', {}).get('category', 'General'),
                'status': case.get('status', 'pending'),
                'priority': case.get('case', {}).get('urgency', 'Normal'),
                'client': {
                    'fullName': case.get('client', {}).get('name', 'Unknown Client'),
                    'email': case.get('client', {}).get('email', ''),
                    'phone': case.get('client', {}).get('phone', '')
                },
                'assignedLawyer': case.get('assignedLawyer'),
                'assignedLawyerId': case.get('assignedLawyerId'),
                'createdAt': case.get('createdAt'),
                'updatedAt': case.get('updatedAt'),
                'documents': case.get('documents', []),
                'predictions': case.get('predictions', []),
                'deniedLawyerIds': case.get('deniedLawyerIds', []),
                'case': case.get('case', {})
            }
            formatted_cases.append(formatted_case)
            
        # Return in format expected by frontend
        return jsonify({
            'items': formatted_cases,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@admin_bp.route('/api/admin/classify-case', methods=['POST'])
@admin_token_required
def classify_case():
    """Classify case using Facebook Legal BERT and suggest lawyers"""
    try:
        classification_data = request.get_json()
        
        if not classification_data:
            return jsonify({'error': 'No classification data provided'}), 400
        
        case_info = classification_data.get('case', {})
        excluded_lawyers = classification_data.get('excludedLawyerIds', [])
        
        title = case_info.get('title', '')
        description = case_info.get('description', '')
        
        if not title and not description:
            return jsonify({'error': 'Provide case.title or case.description'}), 400
        
        # Combine title and description for classification
        text = '. '.join(filter(None, [title, description]))
        
        # Call Facebook Legal BERT via HuggingFace
        predictions = _classify_with_huggingface(text)
        
        if not predictions:
            return jsonify({'error': 'AI classification failed - no results returned'}), 502
        
        # Load lawyers from database (mock for now, replace with actual DB call)
        lawyers = _get_lawyers_from_database(excluded_lawyers)
        
        # Score and rank lawyers based on specialization match
        top_lawyers = _score_and_rank_lawyers(lawyers, predictions)
        
        result = {
            'predictions': predictions,
            'topLawyers': top_lawyers,
            'classification': predictions[0]['label'] if predictions else 'General'
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

def _classify_with_huggingface(text):
    """Classify text using Facebook Legal BERT model"""
    try:
        import requests
        import os
        
        api_key = os.getenv('HF_TOKEN') or os.getenv('HUGGINGFACE_API_KEY')
        model = os.getenv('HF_MODEL_ID', 'MoritzLaurer/deberta-v3-large-zeroshot-v2.0')
        
        if not api_key:
            logger.warning("No HuggingFace API key found, using fallback classification")
            return _fallback_classification(text)
        
        # Comprehensive case types for legal classification
        case_types = [
            "Contract Dispute", "Breach of Contract", "Fraud", "Theft", "Assault", "Battery",
            "Property Dispute", "Real Estate Dispute", "Contract Drafting", "Lease Agreement",
            "Divorce", "Child Custody", "Child Support", "Personal Injury", "Medical Malpractice",
            "Trademark Infringement", "Copyright Infringement", "Patent Dispute", "Employment Dispute",
            "Wrongful Termination", "Corporate Law", "Business Formation", "Mergers and Acquisitions",
            "Bankruptcy", "Immigration", "Environmental Law", "Civil Rights", "Administrative Law"
        ]
        
        response = requests.post(
            f'https://router.huggingface.co/hf-inference/models/{model}',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'inputs': text,
                'parameters': {
                    'candidate_labels': case_types[:20],  # Limit to top 20 categories
                },
            },
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Handle different response formats from BART model
            if isinstance(result, list) and len(result) > 0:
                first_item = result[0]
                if hasattr(first_item, 'label') and hasattr(first_item, 'score'):
                    return result
                elif hasattr(first_item, 'labels') and hasattr(first_item, 'scores'):
                    return [
                        {'label': label, 'score': score}
                        for label, score in zip(first_item.labels, first_item.scores)
                    ]
            
            elif hasattr(result, 'labels') and hasattr(result, 'scores'):
                return [
                    {'label': label, 'score': score}
                    for label, score in zip(result.labels, result.scores)
                ]
        
        logger.warning(f"HuggingFace API failed with status {response.status_code}")
        return _fallback_classification(text)
        
    except Exception as e:
        logger.error(f"HuggingFace classification error: {e}")
        return _fallback_classification(text)

def _fallback_classification(text):
    """Fallback classification when AI service is unavailable"""
    # Simple keyword-based classification as fallback
    keywords_to_category = {
        'contract': 'Contract Dispute',
        'breach': 'Breach of Contract',
        'divorce': 'Divorce',
        'custody': 'Child Custody',
        'injury': 'Personal Injury',
        'medical': 'Medical Malpractice',
        'employment': 'Employment Dispute',
        'corporate': 'Corporate Law',
        'property': 'Property Dispute',
        'trademark': 'Trademark Infringement',
        'copyright': 'Copyright Infringement',
        'patent': 'Patent Dispute'
    }
    
    text_lower = text.lower()
    for keyword, category in keywords_to_category.items():
        if keyword in text_lower:
            return [{'label': category, 'score': 0.8}]
    
    return [{'label': 'General Legal Matter', 'score': 0.5}]

def _get_lawyers_from_database(excluded_lawyers):
    """Get lawyers from database (mock implementation)"""
    # This should be replaced with actual database call
    all_lawyers = [
        {
            'lawyer_id': 'lawyer_001',
            'lawyer_name': 'John Smith',
            'lawyer_email': 'john.smith@legalsphere.com',
            'specializations': ['Corporate Law', 'Contract Law'],
            'case_types': ['Corporate Law', 'Contract Law', 'M&A'],
            'years_experience': 8,
            'success_rate': 0.92,
            'availability_score': 0.8,
            'case_history_summary': 'Specialized in corporate contracts and M&A deals with high success rate.',
            'email': 'john.smith@legalsphere.com',
            'phone': '+1-555-0101',
            'barNumber': 'BAR001'
        },
        {
            'lawyer_id': 'lawyer_002',
            'lawyer_name': 'Sarah Johnson',
            'lawyer_email': 'sarah.johnson@legalsphere.com',
            'specializations': ['Contract Law', 'Commercial Litigation'],
            'case_types': ['Contract Law', 'Commercial Litigation', 'Employment Law'],
            'years_experience': 6,
            'success_rate': 0.88,
            'availability_score': 0.9,
            'case_history_summary': 'Expert in contract disputes and commercial litigation with proven track record.',
            'email': 'sarah.johnson@legalsphere.com',
            'phone': '+1-555-0102',
            'barNumber': 'BAR002'
        },
        {
            'lawyer_id': 'lawyer_003',
            'lawyer_name': 'Michael Chen',
            'lawyer_email': 'michael.chen@legalsphere.com',
            'specializations': ['Corporate Law', 'Intellectual Property'],
            'case_types': ['Corporate Law', 'IP Law', 'Technology Law'],
            'years_experience': 10,
            'success_rate': 0.95,
            'availability_score': 0.7,
            'case_history_summary': 'Senior corporate attorney with expertise in technology and IP matters.',
            'email': 'michael.chen@legalsphere.com',
            'phone': '+1-555-0103',
            'barNumber': 'BAR003'
        }
    ]
    
    # Filter out excluded lawyers
    return [lawyer for lawyer in all_lawyers if lawyer['lawyer_id'] not in excluded_lawyers]

def _score_and_rank_lawyers(lawyers, predictions):
    """Score and rank lawyers based on specialization match and performance"""
    # Map case types to specializations
    specialization_map = {
        'Contract Dispute': ['Corporate Law', 'Contract Law'],
        'Breach of Contract': ['Corporate Law', 'Contract Law'],
        'Corporate Law': ['Corporate Law'],
        'Business Formation': ['Corporate Law'],
        'Mergers and Acquisitions': ['Corporate Law'],
        'Employment Dispute': ['Employment Law'],
        'Wrongful Termination': ['Employment Law'],
        'Personal Injury': ['Personal Injury'],
        'Medical Malpractice': ['Medical Malpractice'],
        'Property Dispute': ['Property Law', 'Real Estate Law'],
        'Real Estate Dispute': ['Property Law', 'Real Estate Law'],
        'Trademark Infringement': ['Intellectual Property'],
        'Copyright Infringement': ['Intellectual Property'],
        'Patent Dispute': ['Intellectual Property'],
        'Divorce': ['Family Law'],
        'Child Custody': ['Family Law']
    }
    
    # Get top predictions
    top_predictions = predictions[:5]
    
    # Score each lawyer
    scored_lawyers = []
    for lawyer in lawyers:
        lawyer_specializations = lawyer.get('specializations', [])
        
        # Calculate match score based on specialization overlap
        match_score = 0
        for prediction in top_predictions:
            mapped_specs = specialization_map.get(prediction['label'], [])
            overlap = set(lawyer_specializations) & set(mapped_specs)
            if overlap:
                # Base score is prediction confidence, boosted by specialization match
                boost = 1 + 0.25 * (len(overlap) - 1)  # Bonus for multiple matching specializations
                match_score += prediction['score'] * boost
        
        # Cap match score to avoid domination
        match_score = min(match_score, 1.5)
        
        # Performance score based on experience and success rate
        perf_score = (
            0.5 * lawyer.get('success_rate', 0.85) +
            0.2 * lawyer.get('availability_score', 0.8) +
            0.3 * min(1.0, lawyer.get('years_experience', 5) / 20)
        )
        
        # Total score: 75% specialization match, 25% performance
        total_score = 0.75 * (match_score / 1.5) + 0.25 * perf_score
        
        scored_lawyers.append({
            **lawyer,
            'matchScore': match_score,
            'total': total_score
        })
    
    # Sort by total score and return top 5
    scored_lawyers.sort(key=lambda x: x['total'], reverse=True)
    return scored_lawyers[:5]

@admin_bp.route('/api/admin/case-requests/<case_id>/assign', methods=['POST'])
@admin_token_required
def assign_case(case_id):
    """Assign lawyer to case (existing endpoint)"""
    try:
        assignment_data = request.get_json()
        
        if not assignment_data or not assignment_data.get('lawyerId'):
            return jsonify({'error': 'Lawyer ID is required'}), 400
        
        collection = get_db_collection('case_requests')
        
        # Find the case
        case = collection.find_one({'id': case_id})
        if not case:
            return jsonify({'error': 'Case not found'}), 404
        
        # Update case with lawyer assignment
        lawyer_info = {
            'id': assignment_data.get('lawyerId'),
            'name': assignment_data.get('lawyerName'),
            'assignedAt': datetime.utcnow().isoformat()
        }
        
        collection.update_one(
            {'_id': case['_id']},
            {
                '$set': {
                    'status': 'lawyer_assigned',
                    'assignedLawyer': lawyer_info,
                    'assignedLawyerId': assignment_data.get('lawyerId'),
                    'updatedAt': datetime.utcnow().isoformat()
                }
            }
        )
        
        # Publish lawyer assignment to Kafka
        assignment_data_kafka = {
            'caseId': case_id,
            'lawyerId': assignment_data.get('lawyerId'),
            'lawyerName': assignment_data.get('lawyerName'),
            'lawyerEmail': assignment_data.get('lawyerEmail', f"{assignment_data.get('lawyerName', '').lower().replace(' ', '.')}@legalsphere.com"),
            'caseTitle': case.get('case', {}).get('title', 'Untitled Case'),
            'clientId': case.get('client', {}).get('email'),
            'clientName': case.get('client', {}).get('name'),
            'assignedBy': request.user_name,
            'assignedAt': datetime.utcnow().isoformat(),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        kafka_service.publish_lawyer_assignment(assignment_data_kafka)
        
        return jsonify({
            'message': 'Case assigned successfully',
            'caseId': case_id,
            'lawyerAssignment': lawyer_info
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@admin_bp.route('/api/admin/case-requests/<case_id>/reject', methods=['PATCH'])
@admin_token_required
def reject_case(case_id):
    """Reject case and notify client via Kafka"""
    try:
        rejection_data = request.get_json() or {}
        rejection_reason = rejection_data.get('rejectionReason', 'Case rejected by administrator')
        
        collection = get_db_collection('case_requests')
        
        # Find the case
        case = collection.find_one({'id': case_id})
        if not case:
            return jsonify({'error': 'Case not found'}), 404
        
        # Update case status
        collection.update_one(
            {'_id': case['_id']},
            {
                '$set': {
                    'status': 'rejected',
                    'rejectionReason': rejection_reason,
                    'rejectedAt': datetime.utcnow().isoformat(),
                    'rejectedBy': request.user_name,
                    'updatedAt': datetime.utcnow().isoformat()
                }
            }
        )
        
        # Publish case rejection to Kafka for client notification
        # Use existing case_notifications topic for client notifications
        kafka_service.publish_case_notification({
            'clientId': case.get('client', {}).get('email'),
            'caseId': case_id,
            'notificationType': 'case_rejected',
            'title': 'Case Rejected',
            'message': f'Your case "{case.get("case", {}).get("title", "Untitled Case")}" has been reviewed but unfortunately cannot be accepted at this time.',
            'metadata': {
                'rejectionReason': rejection_reason,
                'rejectedBy': request.user_name,
                'rejectedAt': datetime.utcnow().isoformat(),
                'clientName': case.get('client', {}).get('name'),
                'caseTitle': case.get('case', {}).get('title', 'Untitled Case')
            }
        })
        
        return jsonify({
            'message': 'Case rejected successfully and client notified',
            'caseId': case_id,
            'status': 'rejected'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@admin_bp.route('/api/admin/get-lawyers', methods=['GET'])
@admin_token_required
def get_available_lawyers():
    """Get list of available lawyers for assignment (existing endpoint)"""
    try:
        # This would typically come from a users collection or service
        # For now, returning mock data structure
        lawyers = [
            {
                'id': 'lawyer_001',
                'name': 'John Smith',
                'email': 'john.smith@legalsphere.com',
                'specialization': ['Corporate Law', 'Contract Law'],
                'active': True,
                'currentCases': 3,
                'years_experience': 8,
                'success_rate': 0.92
            },
            {
                'id': 'lawyer_002', 
                'name': 'Sarah Johnson',
                'email': 'sarah.johnson@legalsphere.com',
                'specialization': ['Family Law', 'Estate Planning'],
                'active': True,
                'currentCases': 2,
                'years_experience': 6,
                'success_rate': 0.88
            },
            {
                'id': 'lawyer_003',
                'name': 'Michael Chen',
                'email': 'michael.chen@legalsphere.com',
                'specialization': ['Intellectual Property', 'Technology Law'],
                'active': True,
                'currentCases': 4,
                'years_experience': 10,
                'success_rate': 0.95
            }
        ]
        
        return jsonify(lawyers), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@admin_bp.route('/api/admin/connections', methods=['GET'])
@admin_token_required
def get_case_connections():
    """Get all active lawyer-client connections"""
    try:
        collection = get_db_collection('case_requests')
        
        # Find cases with active connections
        query = {
            'status': {'$in': ['active', 'in_progress']},
            'assignedLawyerId': {'$exists': True}
        }
        
        cases = list(collection.find(query).sort('updatedAt', -1))
        
        connections = []
        for case in cases:
            if '_id' in case:
                case['_id'] = str(case['_id'])
            
            connection = {
                'caseId': case.get('id'),
                'caseTitle': case.get('case', {}).get('title', 'Untitled Case'),
                'client': case.get('client', {}),
                'lawyer': case.get('assignedLawyer', {}),
                'status': case.get('status'),
                'connectedAt': case.get('assignedLawyer', {}).get('assignedAt'),
                'updatedAt': case.get('updatedAt')
            }
            connections.append(connection)
        
        return jsonify({'connections': connections}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
