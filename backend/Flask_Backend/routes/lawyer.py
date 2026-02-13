from flask import Blueprint, request, jsonify
from datetime import datetime
import os
import jwt
from functools import wraps
from mongodb_client import get_db_collection
from kafka_config import kafka_service

lawyer_bp = Blueprint('lawyer', __name__)

def lawyer_token_required(f):
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
            
            # Verify lawyer role
            if decoded.get('role') != 'lawyer':
                return jsonify({"Error": "Lawyer access required"}), 403
            
            # Add user info to request context
            request.user_email = decoded.get('email')
            request.user_name = decoded.get('name')
            request.user_role = decoded.get('role')
            request.user_id = decoded.get('id')  # Lawyer ID
                
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"Error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"Error": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"Error": f"Authentication error: {str(e)}"}), 401
    
    return decorated_function

@lawyer_bp.route('/api/lawyer/assignments', methods=['GET'])
@lawyer_token_required
def get_lawyer_assignments():
    """Get cases assigned to the logged-in lawyer"""
    try:
        status = request.args.get('status', 'incoming')
        
        collection = get_db_collection('case_requests')
        
        # Build query for lawyer-specific cases
        query = {'assignedLawyerId': request.user_id}
        
        # Filter by status
        if status == 'incoming':
            query['status'] = 'lawyer_assigned'
        elif status == 'active':
            query['status'] = {'$in': ['active', 'in_progress']}
        elif status == 'completed':
            query['status'] = 'completed'
        
        cases = list(collection.find(query).sort('createdAt', -1))
        
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
                'priority': case.get('case', {}).get('urgency', 'Normal'),
                'status': case.get('status', 'pending'),
                'client': case.get('client', {}),
                'assignedAt': case.get('assignedLawyer', {}).get('assignedAt'),
                'createdAt': case.get('createdAt'),
                'updatedAt': case.get('updatedAt'),
                'documents': case.get('documents', []),
                'analysis': case.get('analysis', {})
            }
            formatted_cases.append(formatted_case)
            
        return jsonify({'cases': formatted_cases}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@lawyer_bp.route('/api/lawyer/cases/<case_id>/accept', methods=['POST'])
@lawyer_token_required
def accept_case(case_id):
    """Accept a case assignment"""
    try:
        collection = get_db_collection('case_requests')
        
        # Find the case
        case = collection.find_one({'id': case_id})
        if not case:
            return jsonify({'error': 'Case not found'}), 404
        
        # Verify this case is assigned to the current lawyer
        if case.get('assignedLawyerId') != request.user_id:
            return jsonify({'error': 'Case not assigned to you'}), 403
        
        # Verify case is in lawyer_assigned status
        if case.get('status') != 'lawyer_assigned':
            return jsonify({'error': 'Case cannot be accepted in current status'}), 400
        
        # Update case status
        collection.update_one(
            {'_id': case['_id']},
            {
                '$set': {
                    'status': 'active',
                    'lawyerAcceptedAt': datetime.utcnow().isoformat(),
                    'lawyerAcceptedBy': request.user_name,
                    'updatedAt': datetime.utcnow().isoformat()
                }
            }
        )
        
        # Publish lawyer response to Kafka
        response_data = {
            'caseId': case_id,
            'lawyerId': request.user_id,
            'lawyerName': request.user_name,
            'lawyerEmail': request.user_email,
            'response': 'accepted',
            'respondedAt': datetime.utcnow().isoformat(),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        kafka_service.publish_lawyer_response(response_data)
        
        # Publish case connection notification
        connection_data = {
            'caseId': case_id,
            'lawyerId': request.user_id,
            'lawyerName': request.user_name,
            'lawyerEmail': request.user_email,
            'clientId': case.get('client', {}).get('email'),
            'clientName': case.get('client', {}).get('name'),
            'caseTitle': case.get('case', {}).get('title', 'Untitled Case'),
            'connectedAt': datetime.utcnow().isoformat(),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        kafka_service.publish_case_connection(connection_data)
        
        return jsonify({
            'message': 'Case accepted successfully',
            'caseId': case_id,
            'status': 'active'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@lawyer_bp.route('/api/lawyer/cases/<case_id>/reject', methods=['POST'])
@lawyer_token_required
def reject_case(case_id):
    """Reject a case assignment"""
    try:
        rejection_data = request.get_json() or {}
        rejection_reason = rejection_data.get('reason', 'Case rejected by lawyer')
        
        collection = get_db_collection('case_requests')
        
        # Find the case
        case = collection.find_one({'id': case_id})
        if not case:
            return jsonify({'error': 'Case not found'}), 404
        
        # Verify this case is assigned to the current lawyer
        if case.get('assignedLawyerId') != request.user_id:
            return jsonify({'error': 'Case not assigned to you'}), 403
        
        # Verify case is in lawyer_assigned status
        if case.get('status') != 'lawyer_assigned':
            return jsonify({'error': 'Case cannot be rejected in current status'}), 400
        
        # Update case status and clear assignment
        update_data = {
            'status': 'pending_admin_review',
            'assignedLawyer': None,
            'assignedLawyerId': None,
            'lawyerRejectedAt': datetime.utcnow().isoformat(),
            'lawyerRejectedBy': request.user_name,
            'rejectionReason': rejection_reason,
            'updatedAt': datetime.utcnow().isoformat()
        }
        
        # Add lawyer to denied list
        update_op = {
            '$set': update_data,
            '$addToSet': {
                'deniedLawyerIds': request.user_id
            }
        }
        
        collection.update_one({'_id': case['_id']}, update_op)
        
        # Publish lawyer response to Kafka
        response_data = {
            'caseId': case_id,
            'lawyerId': request.user_id,
            'lawyerName': request.user_name,
            'lawyerEmail': request.user_email,
            'response': 'rejected',
            'reason': rejection_reason,
            'respondedAt': datetime.utcnow().isoformat(),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        kafka_service.publish_lawyer_response(response_data)
        
        # Publish admin reassignment notification
        reassignment_data = {
            'caseId': case_id,
            'caseTitle': case.get('case', {}).get('title', 'Untitled Case'),
            'rejectedLawyerId': request.user_id,
            'rejectedLawyerName': request.user_name,
            'rejectionReason': rejection_reason,
            'clientId': case.get('client', {}).get('email'),
            'clientName': case.get('client', {}).get('name'),
            'requiresReassignment': True,
            'rejectedAt': datetime.utcnow().isoformat(),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        kafka_service.publish_admin_reassignment(reassignment_data)
        
        return jsonify({
            'message': 'Case rejected successfully',
            'caseId': case_id,
            'status': 'pending_admin_review'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@lawyer_bp.route('/api/lawyer/cases/<case_id>', methods=['GET'])
@lawyer_token_required
def get_lawyer_case_details(case_id):
    """Get detailed information about a specific case"""
    try:
        collection = get_db_collection('case_requests')
        
        # Find the case
        case = collection.find_one({'id': case_id})
        if not case:
            return jsonify({'error': 'Case not found'}), 404
        
        # Verify this case is assigned to the current lawyer
        if case.get('assignedLawyerId') != request.user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Convert ObjectId to string
        if '_id' in case:
            case['_id'] = str(case['_id'])
        
        # Format case details
        case_details = {
            'id': case.get('id', ''),
            '_id': case.get('_id'),
            'title': case.get('case', {}).get('title', 'Untitled Case'),
            'description': case.get('case', {}).get('description', ''),
            'category': case.get('case', {}).get('category', 'General'),
            'urgency': case.get('case', {}).get('urgency', 'Normal'),
            'incidentDate': case.get('case', {}).get('incidentDate', ''),
            'status': case.get('status', 'pending'),
            'client': case.get('client', {}),
            'assignedAt': case.get('assignedLawyer', {}).get('assignedAt'),
            'createdAt': case.get('createdAt'),
            'updatedAt': case.get('updatedAt'),
            'documents': case.get('documents', []),
            'analysis': case.get('analysis', {}),
            'predictions': case.get('predictions', [])
        }
        
        return jsonify(case_details), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@lawyer_bp.route('/api/lawyer/dashboard', methods=['GET'])
@lawyer_token_required
def get_lawyer_dashboard():
    """Get dashboard summary for the lawyer"""
    try:
        collection = get_db_collection('case_requests')
        
        # Get case counts by status
        incoming_count = collection.count_documents({
            'assignedLawyerId': request.user_id,
            'status': 'lawyer_assigned'
        })
        
        active_count = collection.count_documents({
            'assignedLawyerId': request.user_id,
            'status': {'$in': ['active', 'in_progress']}
        })
        
        completed_count = collection.count_documents({
            'assignedLawyerId': request.user_id,
            'status': 'completed'
        })
        
        # Get recent cases
        recent_cases = list(collection.find({'assignedLawyerId': request.user_id})
                           .sort('updatedAt', -1)
                           .limit(5))
        
        formatted_recent = []
        for case in recent_cases:
            if '_id' in case:
                case['_id'] = str(case['_id'])
            
            formatted_case = {
                'id': case.get('id', ''),
                'title': case.get('case', {}).get('title', 'Untitled Case'),
                'status': case.get('status', 'pending'),
                'clientName': case.get('client', {}).get('name', 'Unknown'),
                'updatedAt': case.get('updatedAt')
            }
            formatted_recent.append(formatted_case)
        
        dashboard_data = {
            'summary': {
                'incomingCases': incoming_count,
                'activeCases': active_count,
                'completedCases': completed_count,
                'totalCases': incoming_count + active_count + completed_count
            },
            'recentCases': formatted_recent
        }
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
