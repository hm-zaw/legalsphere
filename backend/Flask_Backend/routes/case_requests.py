from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
import os
import jwt
from functools import wraps
from mongodb_client import get_db_collection

case_requests_bp = Blueprint('case_requests', __name__)

def token_required(f):
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

@case_requests_bp.route('/api/case-requests', methods=['POST'])
def create_case_request():
    """Handle case request submission and publish to Kafka"""
    try:
        # Get the case request data
        case_data = request.get_json()
        
        if not case_data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['client', 'case']
        for field in required_fields:
            if field not in case_data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Add metadata
        case_data.update({
            'id': str(uuid.uuid4()),
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat(),
            'status': 'pending_submission',
            'source': 'web_form'
        })
        
        # Store directly in MongoDB
        try:
            collection = get_db_collection('case_requests')
            result = collection.insert_one(case_data)
            case_data['_id'] = str(result.inserted_id)
            return jsonify({
                'id': case_data['id'],
                'message': 'Case submitted successfully',
                'status': 'submitted'
            }), 201
        except Exception as db_error:
            return jsonify({'error': f'Failed to process case: {str(db_error)}'}), 500
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@case_requests_bp.route('/api/case-requests/<case_id>', methods=['GET'])
def get_case_request(case_id):
    """Get case request by ID"""
    try:
        collection = get_db_collection('case_requests')
        case = collection.find_one({'id': case_id})
        
        if not case:
            return jsonify({'error': 'Case not found'}), 404
        
        # Convert ObjectId to string
        if '_id' in case:
            case['_id'] = str(case['_id'])
        
        return jsonify(case), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@case_requests_bp.route('/api/case-requests', methods=['GET'])
def list_case_requests():
    """List all case requests with pagination"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        status = request.args.get('status', None)
        
        collection = get_db_collection('case_requests')
        
        # Build query
        query = {}
        if status:
            query['status'] = status
        
        # Get total count
        total = collection.count_documents(query)
        
        # Get paginated results
        skip = (page - 1) * limit
        cases = list(collection.find(query)
                    .sort('createdAt', -1)
                    .skip(skip)
                    .limit(limit))
        
        # Convert ObjectId to string
        for case in cases:
            if '_id' in case:
                case['_id'] = str(case['_id'])
        
        return jsonify({
            'cases': cases,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@case_requests_bp.route('/api/my-cases', methods=['GET'])
@token_required
def get_user_cases():
    """Get cases for the logged-in user"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        status = request.args.get('status', None)
        
        collection = get_db_collection('case_requests')
        
        # Build query for user-specific cases
        query = {'client.email': request.user_email}
        
        # Add status filter if provided
        if status:
            if status == 'pending':
                query['status'] = {'$in': ['pending_submission', 'pending_admin_review']}
            elif status == 'active':
                query['status'] = {'$nin': ['completed', 'rejected']}
            elif status == 'completed':
                query['status'] = 'completed'
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
        
        # Convert ObjectId to string and format cases for frontend
        formatted_cases = []
        for case in cases:
            if '_id' in case:
                case['_id'] = str(case['_id'])
            
            # Format case for frontend consumption
            formatted_case = {
                'id': case.get('id', ''),
                'title': case.get('case', {}).get('title', 'Untitled Case'),
                'category': case.get('case', {}).get('category', 'General'),
                'status': _format_status(case.get('status', 'pending')),
                'priority': case.get('case', {}).get('urgency', 'Normal'),
                'progress': _calculate_progress(case.get('status', 'pending')),
                'submittedDate': _format_date(case.get('createdAt')),
                'lastUpdated': _format_relative_time(case.get('updatedAt')),
                'lawyer': _get_lawyer_info(case),
                'amount': 'N/A',  # Amount not in current structure
                'description': case.get('case', {}).get('description', ''),
                'client': case.get('client', {}),
                'createdAt': case.get('createdAt'),
                'updatedAt': case.get('updatedAt'),
                'incidentDate': case.get('case', {}).get('incidentDate', ''),
                'consultation': case.get('consultation', {}),
                'documents': case.get('documents', []),
                'predictions': case.get('predictions', [])
            }
            formatted_cases.append(formatted_case)
        
        return jsonify({
            'cases': formatted_cases,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

def _format_status(status):
    """Format backend status to frontend-friendly status"""
    status_mapping = {
        'pending_submission': 'Pending Submission',
        'pending_admin_review': 'Pending Review',
        'under_review': 'Under Review',
        'lawyer_assigned': 'Lawyer Assigned',
        'in_progress': 'In Progress',
        'document_required': 'Document Required',
        'completed': 'Completed',
        'rejected': 'Rejected',
        'analysis_completed': 'Analysis Completed',
        'processed': 'Processed',
        'analyzed': 'Analyzed'
    }
    return status_mapping.get(status, 'Pending')

def _calculate_progress(status):
    """Calculate progress percentage based on status"""
    progress_mapping = {
        'pending_submission': 10,
        'pending_admin_review': 20,
        'under_review': 30,
        'lawyer_assigned': 50,
        'in_progress': 70,
        'document_required': 45,
        'completed': 100,
        'rejected': 0,
        'analysis_completed': 40,
        'processed': 25,
        'analyzed': 35
    }
    return progress_mapping.get(status, 10)

def _format_date(date_string):
    """Format ISO date to readable format"""
    try:
        if not date_string:
            return "Unknown"
        # Handle Z timezone properly
        if date_string.endswith('Z'):
            date_string = date_string[:-1] + '+00:00'
        date = datetime.fromisoformat(date_string)
        return date.strftime('%b %d, %Y')
    except Exception as e:
        print(f"Date formatting error: {e}")
        return "Unknown"

def _format_relative_time(date_string):
    """Format ISO date to relative time"""
    try:
        if not date_string:
            return "Unknown"
        # Handle Z timezone properly
        if date_string.endswith('Z'):
            date_string = date_string[:-1] + '+00:00'
        date = datetime.fromisoformat(date_string)
        now = datetime.utcnow()
        
        # Make both timezone-aware or both naive
        if date.tzinfo is not None:
            now = datetime.utcnow().replace(tzinfo=date.tzinfo)
        
        diff = now - date
        
        if diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours}h ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes}m ago"
        else:
            return "Just now"
    except Exception as e:
        print(f"Date formatting error: {e}")
        return "Unknown"

def _get_lawyer_info(case):
    """Get lawyer information from case"""
    lawyer = case.get('assignedLawyer')
    if lawyer:
        return f"{lawyer.get('name', 'Unknown')}, Esq."
    return "Pending Assignment"

@case_requests_bp.route('/api/debug/cases', methods=['GET'])
def debug_cases():
    """Debug endpoint to inspect raw case data"""
    try:
        collection = get_db_collection('case_requests')
        cases = list(collection.find({}).limit(1))
        
        if cases:
            case = cases[0]
            # Convert ObjectId to string
            if '_id' in case:
                case['_id'] = str(case['_id'])
            return jsonify({
                'raw_case': case,
                'case_title': case.get('case', {}).get('title'),
                'created_at': case.get('createdAt'),
                'updated_at': case.get('updatedAt'),
                'status': case.get('status')
            })
        else:
            return jsonify({'message': 'No cases found'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
