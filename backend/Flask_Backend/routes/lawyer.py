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
        print(f"DEBUG: lawyer_token_required - Received token: {token}")
        
        if not token:
            print("DEBUG: No Authorization header found")
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
            
            print(f"DEBUG: Lawyer auth - Email: {request.user_email}, Name: {request.user_name}, ID: {request.user_id}")
                
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"Error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"Error": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"Error": f"Authentication error: {str(e)}"}), 401
    
    return decorated_function

@lawyer_bp.route('/api/lawyer/cases', methods=['GET'])
@lawyer_token_required
def get_lawyer_cases():
    """Get cases assigned to the logged-in lawyer (alias for assignments)"""
    print(f"DEBUG: get_lawyer_cases called - User ID: {request.user_id}")
    return get_lawyer_assignments()

@lawyer_bp.route('/api/lawyer/assignments', methods=['GET'])
@lawyer_token_required
def get_lawyer_assignments():
    """Get cases assigned to the logged-in lawyer"""
    try:
        status = request.args.get('status', 'incoming')
        
        print(f"DEBUG: get_lawyer_assignments - User ID: {request.user_id}, Status: {status}")
        
        # Check if user_id is available
        if not request.user_id:
            print(f"DEBUG: No user_id found in token - returning 401")
            return jsonify({"Error": "Invalid authentication - user ID missing"}), 401
            
        collection = get_db_collection('case_requests')
        
        # Build query for lawyer-specific cases
        # Handle both string and number types for assignedLawyerId
        lawyer_id = str(request.user_id)
        query = {'assignedLawyerId': {'$in': [lawyer_id, int(lawyer_id) if lawyer_id.isdigit() else lawyer_id]}}
        
        print(f"DEBUG: MongoDB Query: {query}")
        
        # Filter by status
        if status == 'incoming':
            query['status'] = 'lawyer_assigned'
        elif status == 'active':
            query['status'] = {'$in': ['active', 'in_progress']}
        elif status == 'completed':
            query['status'] = 'completed'
        
        print(f"DEBUG: Final Query: {query}")
        
        cases = list(collection.find(query).sort('createdAt', -1))
        
        print(f"DEBUG: Found {len(cases)} cases")
        
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
            
        print(f"DEBUG: Returning {len(formatted_cases)} formatted cases")
        return jsonify({'cases': formatted_cases}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@lawyer_bp.route('/api/lawyer/cases/<case_id>/respond', methods=['POST'])
@lawyer_token_required
def respond_to_case_request(case_id):
    """Respond to a case request (accept or deny)"""
    try:
        print(f"DEBUG: respond_to_case_request called for case_id: {case_id}")
        print(f"DEBUG: User ID from token: {request.user_id}")
        
        response_data = request.get_json()
        print(f"DEBUG: Request data: {response_data}")
        
        status = response_data.get('status')  # 'accepted' or 'denied'
        lawyer_id = response_data.get('lawyerId', request.user_id)
        
        print(f"DEBUG: Status: {status}, Lawyer ID: {lawyer_id}")
        
        if status not in ['accepted', 'denied']:
            return jsonify({'error': 'Invalid status. Must be "accepted" or "denied"'}), 400
        
        if status == 'accepted':
            # Call the accept case logic
            return accept_case(case_id)
        else:
            # Call the reject case logic
            return reject_case(case_id)
            
    except Exception as e:
        print(f"DEBUG: Exception in respond_to_case_request: {str(e)}")
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
        case_lawyer_id = str(case.get('assignedLawyerId', ''))
        user_id = str(request.user_id)
        
        if case_lawyer_id != user_id:
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

@lawyer_bp.route('/api/lawyer/debug/show-cases', methods=['GET'])
@lawyer_token_required
def debug_show_cases():
    """Debug endpoint to show all cases"""
    try:
        collection = get_db_collection('case_requests')
        
        # Get all cases
        cases = list(collection.find({}).limit(10))
        
        case_info = []
        for case in cases:
            case_info.append({
                'id': case.get('id'),
                '_id': str(case.get('_id')),
                'assignedLawyerId': case.get('assignedLawyerId'),
                'status': case.get('status'),
                'assignedLawyer': case.get('assignedLawyer')
            })
        
        return jsonify({
            'cases': case_info,
            'total_cases': len(case_info)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@lawyer_bp.route('/api/lawyer/debug/fix-assignment', methods=['POST'])
@lawyer_token_required
def debug_fix_assignment():
    """Debug endpoint to fix case assignment for testing"""
    try:
        collection = get_db_collection('case_requests')
        
        # Find cases assigned to wrong lawyer IDs 
        cases_to_fix = list(collection.find({
            '$or': [
                {'id': 'cfc39f27-0f19-4827-ac22-d517f34a8581'},  # Fix the specific case
                {'assignedLawyerId': 1, 'assignedLawyer.name': 'U Win Min Htet'},
                {'assignedLawyerId': 16, 'assignedLawyer.name': 'U Win Min Htet'},
                {'id': '182d2349-c8e3-46f5-bcbc-0aade233a2c1'}  # Fix the specific case
            ]
        }))
        
        fixed_cases = []
        for case in cases_to_fix:
            # Determine correct lawyer ID based on lawyer name
            lawyer_name = case.get('assignedLawyer', {}).get('name', '')
            correct_lawyer_id = None
            
            if 'U Win Min Htet' in lawyer_name:
                correct_lawyer_id = 31
            elif 'U Kyaw Swar' in lawyer_name:
                correct_lawyer_id = 39
            else:
                # Skip if we can't determine the correct lawyer
                continue
            
            # Update to correct lawyer ID
            result = collection.update_one(
                {'_id': case['_id']},
                {
                    '$set': {
                        'assignedLawyerId': correct_lawyer_id,
                        'assignedLawyer': {
                            'id': correct_lawyer_id,
                            'name': lawyer_name,
                            'assignedAt': case.get('assignedLawyer', {}).get('assignedAt', datetime.utcnow().isoformat())
                        },
                        'updatedAt': datetime.utcnow().isoformat()
                    }
                }
            )
            
            if result.modified_count > 0:
                fixed_cases.append({
                    'case_id': case.get('id', case.get('_id')),
                    'lawyer_name': lawyer_name,
                    'old_id': case.get('assignedLawyerId'),
                    'new_id': correct_lawyer_id
                })
        
        return jsonify({
            'message': f'Fixed {len(fixed_cases)} cases',
            'fixed_cases': fixed_cases
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@lawyer_bp.route('/api/lawyer/cases/<case_id>/reject', methods=['POST'])
@lawyer_token_required
def reject_case(case_id):
    """Reject a case assignment"""
    try:
        print(f"DEBUG: reject_case called for case_id: {case_id}")
        print(f"DEBUG: User ID: {request.user_id}")
        
        rejection_data = request.get_json() or {}
        rejection_reason = rejection_data.get('reason', 'Case rejected by lawyer')
        
        collection = get_db_collection('case_requests')
        
        # Find the case
        print(f"DEBUG: Looking for case with id: {case_id}")
        case = collection.find_one({'id': case_id})
        if not case:
            print(f"DEBUG: Case not found with id field, trying _id field")
            case = collection.find_one({'_id': case_id})
            if not case:
                print(f"DEBUG: Case not found with _id either")
                return jsonify({'error': 'Case not found'}), 404
        
        print(f"DEBUG: Found case: {case.get('id', case.get('_id'))}")
        print(f"DEBUG: Case assignedLawyerId: {case.get('assignedLawyerId')}")
        print(f"DEBUG: Case status: {case.get('status')}")
        
        # Verify this case is assigned to the current lawyer
        case_lawyer_id = str(case.get('assignedLawyerId', ''))
        user_id = str(request.user_id)
        
        print(f"DEBUG: Case assignedLawyerId (as string): {case_lawyer_id}")
        print(f"DEBUG: User ID (as string): {user_id}")
        
        if case_lawyer_id != user_id:
            print(f"DEBUG: Case not assigned to current lawyer. Expected: {user_id}, Got: {case_lawyer_id}")
            return jsonify({'error': 'Case not assigned to you'}), 403
        
        # Verify case is in lawyer_assigned status
        if case.get('status') != 'lawyer_assigned':
            print(f"DEBUG: Case not in lawyer_assigned status. Current status: {case.get('status')}")
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
        
        print(f"DEBUG: Adding lawyer {request.user_id} to deniedLawyerIds for case {case_id}")
        print(f"DEBUG: Update operation: {update_op}")
        
        result = collection.update_one({'_id': case['_id']}, update_op)
        print(f"DEBUG: Update result - modified: {result.modified_count}, matched: {result.matched_count}")
        
        # Verify the update
        updated_case = collection.find_one({'_id': case['_id']})
        print(f"DEBUG: After update, deniedLawyerIds: {updated_case.get('deniedLawyerIds')}")
        
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
