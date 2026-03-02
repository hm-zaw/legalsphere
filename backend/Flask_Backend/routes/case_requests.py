from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
import os
import jwt
from functools import wraps
from mongodb_client import get_db_collection

from kafka_config import kafka_service
from db.court_events import CourtEvent
from .lawyer import lawyer_token_required

case_requests_bp = Blueprint('case_requests', __name__)


ALLOWED_CASE_STAGES = {
    'discovery',
    'pleadings',
    'pre_trial',
    'trial',
    'settlement',
    'appeal',
}


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

        if 'caseStage' in case_data and case_data['caseStage'] is not None:
            if case_data['caseStage'] not in ALLOWED_CASE_STAGES:
                return jsonify({'error': 'Invalid caseStage'}), 400
        else:
            case_data['caseStage'] = 'discovery'
        
        # Append proxy_filer if it exists
        if 'proxy_filer' in case_data and case_data['proxy_filer']:
            pass # Keep it intact as it's already in case_data

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


@case_requests_bp.route('/api/lawyer/cases/<case_id>/stage', methods=['PATCH'])
@lawyer_token_required
def update_case_stage(case_id):
    try:
        payload = request.get_json() or {}
        new_stage = payload.get('caseStage')

        if new_stage not in ALLOWED_CASE_STAGES:
            return jsonify({'error': 'Invalid caseStage'}), 400

        collection = get_db_collection('case_requests')

        case = collection.find_one({'id': case_id})
        if not case:
            from bson import ObjectId
            try:
                case = collection.find_one({'_id': ObjectId(case_id)})
            except Exception:
                case = None

        if not case:
            return jsonify({'error': 'Case not found'}), 404

        case_lawyer_id = str(case.get('assignedLawyerId', ''))
        user_id = str(getattr(request, 'user_id', ''))
        if case_lawyer_id != user_id:
            return jsonify({'error': 'Case not assigned to you'}), 403

        now_iso = datetime.utcnow().isoformat()
        collection.update_one(
            {'_id': case['_id']},
            {'$set': {'caseStage': new_stage, 'updatedAt': now_iso}}
        )

        try:
            client_id = (case.get('client', {}) or {}).get('email')
            case_title = case.get('case', {}).get('title', 'Untitled Case')

            notification_payload = {
                'clientId': client_id,
                'caseId': case.get('id') or str(case.get('_id')),
                'notificationType': 'case_stage_updated',
                'title': 'Case Stage Updated',
                'message': f'Your case "{case_title}" moved to stage: {new_stage}.',
                'metadata': {
                    'caseStage': new_stage,
                    'updatedByLawyerId': user_id,
                    'updatedByLawyerName': getattr(request, 'user_name', None),
                    'updatedAt': now_iso,
                },
                'timestamp': now_iso,
                'user_id': client_id,
            }
            kafka_service.publish_notification(notification_payload)
        except Exception:
            pass

        return jsonify({'success': True, 'caseId': case.get('id') or str(case.get('_id')), 'caseStage': new_stage}), 200

    except Exception as e:
        return jsonify({'success': False, 'error': f'Internal server error: {str(e)}'}), 500


@case_requests_bp.route('/api/cases/<case_id>/court-events', methods=['GET'])
@token_required
def get_case_court_events(case_id):
    try:
        if getattr(request, 'user_role', None) != 'client':
            return jsonify({'error': 'Client access required'}), 403

        case_col = get_db_collection('case_requests')
        case = case_col.find_one({'id': case_id})
        if not case:
            return jsonify({'error': 'Case not found'}), 404

        if (case.get('client', {}) or {}).get('email') != getattr(request, 'user_email', None):
            return jsonify({'error': 'Access denied'}), 403

        events = CourtEvent.list_by_case_id(case_id)
        serialized = [CourtEvent.serialize_for_response(ev) for ev in events]

        return jsonify({'success': True, 'events': serialized, 'count': len(serialized)}), 200

    except Exception as e:
        return jsonify({'success': False, 'error': f'Internal server error: {str(e)}'}), 500


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


## NOTE: The `/api/lawyer/cases` GET route was removed from this file.
## It conflicted with the authenticated version in lawyer.py which properly
## extracts lawyer ID from JWT and handles status='all' correctly.


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
                query['status'] = {'$in': ['pending_submission',
                                           'pending_admin_review', 'lawyer_assigned']}
            elif status == 'active':
                query['status'] = {
                    '$nin': ['completed', 'rejected', 'pending_submission']}
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
                'lawyerDetails': case.get('assignedLawyer'),
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
        'lawyer_assigned': 'Lawyer Reviewing',  # Changed for client visibility
        'active': 'Active',
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
        'lawyer_assigned': 45,
        'active': 50,
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
    status = case.get('status')
    if lawyer:
        if status in ['active', 'in_progress', 'completed']:
            return f"{lawyer.get('name', 'Unknown')}, Esq."
        else:
            return "Assigning..."  # Don't reveal name until accepted
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


@case_requests_bp.route('/api/case-requests/<case_id>/notes', methods=['POST'])
@token_required
def add_case_note(case_id):
    """Add a note to an existing case request"""
    try:
        payload = request.get_json() or {}
        content = payload.get('content')
        is_private = bool(payload.get('isPrivate', False))

        if not content:
            return jsonify({'error': 'Note content is required'}), 400

        collection = get_db_collection('case_requests')
        case = collection.find_one({'id': case_id})
        if not case:
            return jsonify({'error': 'Case not found'}), 404

        note = {
            'id': str(uuid.uuid4()),
            'content': content,
            'createdAt': datetime.utcnow().isoformat(),
            'createdBy': getattr(request, 'user_name', 'Unknown'),
            'isPrivate': is_private,
        }

        # Push the note and update timestamp
        collection.update_one({'id': case_id}, {'$push': {'notes': note}, '$set': {
                              'updatedAt': datetime.utcnow().isoformat()}})

        return jsonify({'note': note}), 201
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@case_requests_bp.route('/api/case-requests/<case_id>/documents', methods=['POST'])
@token_required
def upload_case_document(case_id):
    """Upload a document to an existing case request"""
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({'error': 'Request body is required'}), 400
        
        document = payload.get('document')
        if not document:
            return jsonify({'error': 'Document data is required'}), 400
        
        # Validate required document fields
        required_fields = ['key', 'name', 'size', 'type', 'uploadedAt']
        for field in required_fields:
            if field not in document:
                return jsonify({'error': f'Document {field} is required'}), 400
        
        collection = get_db_collection('case_requests')
        
        # Try to find case by id first, then by _id
        case = collection.find_one({'id': case_id})
        if not case:
            # Try with ObjectId
            from bson import ObjectId
            try:
                case = collection.find_one({'_id': ObjectId(case_id)})
            except:
                case = None
        
        if not case:
            return jsonify({'error': 'Case not found'}), 404
        
        # Add document metadata
        document_with_metadata = {
            'id': str(uuid.uuid4()),
            'key': document['key'],
            'name': document['name'],
            'size': document['size'],
            'type': document['type'],
            'uploadedAt': document['uploadedAt'],
            'uploadedBy': document.get('uploadedBy', getattr(request, 'user_name', 'Unknown')),
            'caseId': str(case.get('_id', case_id)),
        }
        
        # Push the document and update timestamp
        collection.update_one(
            {'_id': case['_id']}, 
            {
                '$push': {'documents': document_with_metadata}, 
                '$set': {'updatedAt': datetime.utcnow().isoformat()}
            }
        )
        
        return jsonify({'document': document_with_metadata}), 201
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@case_requests_bp.route('/api/cases/<case_id>/documents', methods=['POST'])
@token_required
def upload_case_document_v2(case_id):
    """Upload a document to an existing case (alternative endpoint)"""
    return upload_case_document(case_id)


@case_requests_bp.route('/api/users/<user_id>', methods=['GET'])
@token_required
def get_user_by_id(user_id):
    """Get user details by ID"""
    try:
        collection = get_db_collection('users')
        
        # Try to find user by ID (string or ObjectId)
        from bson import ObjectId
        try:
            user = collection.find_one({'_id': ObjectId(user_id)})
        except:
            user = collection.find_one({'id': user_id})
        
        if not user:
            # Try to find by email if user_id looks like an email
            if '@' in user_id:
                user = collection.find_one({'email': user_id})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Convert ObjectId to string and remove sensitive data
        user_data = {
            'id': str(user.get('_id', user.get('id', user_id))),
            'name': user.get('name', 'Unknown'),
            'email': user.get('email', ''),
            'role': user.get('role', ''),
        }
        
        return jsonify({'user': user_data}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@case_requests_bp.route('/api/client/cases/<case_id>/request-change', methods=['POST'])
@token_required
def client_request_lawyer_change(case_id):
    """Client requests a change of lawyer"""
    try:
        # Check client auth
        if getattr(request, 'user_role', None) != 'client':
            return jsonify({'error': 'Client access required'}), 403

        payload = request.get_json() or {}
        reason = payload.get('reason')

        if not reason:
            return jsonify({'error': 'Reason is required'}), 400

        collection = get_db_collection('case_requests')
        
        # Try to find case
        from bson import ObjectId
        try:
            case = collection.find_one({'_id': ObjectId(case_id)})
        except:
            case = collection.find_one({'id': case_id})
            
        if not case:
            return jsonify({'error': 'Case not found'}), 404

        # Validate case belongs to the calling client
        client_email = (case.get('client', {}) or {}).get('email')
        if client_email != getattr(request, 'user_email', None):
            return jsonify({'error': 'Access denied'}), 403

        now_iso = datetime.utcnow().isoformat()
        
        # Update case document
        collection.update_one(
            {'_id': case['_id']},
            {
                '$set': {
                    'reassignmentRequest': {
                        'requestedAt': now_iso,
                        'reason': reason,
                        'status': 'pending'
                    },
                    'updatedAt': now_iso
                }
            }
        )

        # Publish Kafka notification to admin
        try:
            notification_data = {
                'event_type': 'reassignment_requested',
                'timestamp': now_iso,
                'data': {
                    'caseId': str(case.get('_id')),
                    'clientEmail': client_email,
                    'reason': reason
                }
            }
            # Use publish_admin_reassignment as the admin notifications channel
            kafka_service.publish_admin_reassignment(notification_data)
        except Exception as kafka_e:
            import logging
            logging.error(f"Kafka error in client_request_lawyer_change: {kafka_e}")

        return jsonify({'message': 'Lawyer change request submitted', 'status': 'pending'}), 200

    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
