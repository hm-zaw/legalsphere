from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
import os
from kafka_config import kafka_service
from mongodb_client import get_db_collection

case_requests_bp = Blueprint('case_requests', __name__)

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
        
        # Publish to Kafka for async processing
        success = kafka_service.publish_case_submission(case_data)
        
        if not success:
            # Fallback: store directly in database if Kafka fails
            try:
                collection = get_db_collection('case_requests')
                result = collection.insert_one(case_data)
                case_data['_id'] = str(result.inserted_id)
                return jsonify({
                    'id': case_data['id'],
                    'message': 'Case submitted successfully (direct storage)',
                    'status': 'submitted'
                }), 201
            except Exception as db_error:
                return jsonify({'error': f'Failed to process case: {str(db_error)}'}), 500
        
        # Return immediate response to client
        return jsonify({
            'id': case_data['id'],
            'message': 'Case submitted successfully',
            'status': 'submitted'
        }), 201
        
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
