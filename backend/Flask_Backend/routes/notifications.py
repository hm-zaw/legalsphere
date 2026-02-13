from flask import Blueprint, request, jsonify
from datetime import datetime
import os
import jwt
from functools import wraps
from mongodb_client import get_db_collection

notifications_bp = Blueprint('notifications', __name__)

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
            request.user_id = decoded.get('id')
                
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"Error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"Error": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"Error": f"Authentication error: {str(e)}"}), 401
    
    return decorated_function

@notifications_bp.route('/api/notifications', methods=['GET'])
@token_required
def get_user_notifications():
    """Get notifications for the logged-in user based on their role"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        unread_only = request.args.get('unread', 'false').lower() == 'true'
        
        # Determine collection and query based on user role
        if request.user_role == 'admin':
            collection = get_db_collection('admin_notifications')
            query = {}
        elif request.user_role == 'lawyer':
            collection = get_db_collection('lawyer_notifications')
            query = {'lawyerId': request.user_id}
        else:  # client
            collection = get_db_collection('notifications')
            query = {'clientId': request.user_email}
        
        # Add unread filter if requested
        if unread_only:
            query['read'] = False
        
        # Get total count
        total = collection.count_documents(query)
        
        # Get paginated results
        skip = (page - 1) * limit
        notifications = list(collection.find(query)
                             .sort('createdAt', -1)
                             .skip(skip)
                             .limit(limit))
        
        # Format notifications
        formatted_notifications = []
        for notification in notifications:
            if '_id' in notification:
                notification['_id'] = str(notification['_id'])
            
            formatted_notification = {
                'id': notification.get('_id'),
                'title': notification.get('title', 'New Notification'),
                'message': notification.get('message', ''),
                'type': notification.get('notificationType', 'general'),
                'read': notification.get('read', False),
                'createdAt': notification.get('createdAt'),
                'data': {
                    'caseId': notification.get('caseId'),
                    'caseTitle': notification.get('caseTitle'),
                    'lawyerName': notification.get('lawyerName'),
                    'clientName': notification.get('clientName')
                }
            }
            formatted_notifications.append(formatted_notification)
        
        return jsonify({
            'notifications': formatted_notifications,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@notifications_bp.route('/api/notifications/<notification_id>/read', methods=['POST'])
@token_required
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        # Determine collection based on user role
        if request.user_role == 'admin':
            collection = get_db_collection('admin_notifications')
        elif request.user_role == 'lawyer':
            collection = get_db_collection('lawyer_notifications')
        else:  # client
            collection = get_db_collection('notifications')
        
        # Update notification
        result = collection.update_one(
            {'_id': notification_id},
            {'$set': {'read': True, 'readAt': datetime.utcnow().isoformat()}}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Notification not found'}), 404
        
        return jsonify({'message': 'Notification marked as read'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@notifications_bp.route('/api/notifications/mark-all-read', methods=['POST'])
@token_required
def mark_all_notifications_read():
    """Mark all notifications as read for the user"""
    try:
        # Determine collection and query based on user role
        if request.user_role == 'admin':
            collection = get_db_collection('admin_notifications')
            query = {}
        elif request.user_role == 'lawyer':
            collection = get_db_collection('lawyer_notifications')
            query = {'lawyerId': request.user_id}
        else:  # client
            collection = get_db_collection('notifications')
            query = {'clientId': request.user_email}
        
        # Update all unread notifications
        result = collection.update_many(
            {**query, 'read': False},
            {'$set': {'read': True, 'readAt': datetime.utcnow().isoformat()}}
        )
        
        return jsonify({
            'message': f'Marked {result.modified_count} notifications as read'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@notifications_bp.route('/api/notifications/unread-count', methods=['GET'])
@token_required
def get_unread_count():
    """Get count of unread notifications for the user"""
    try:
        # Determine collection and query based on user role
        if request.user_role == 'admin':
            collection = get_db_collection('admin_notifications')
            query = {'read': False}
        elif request.user_role == 'lawyer':
            collection = get_db_collection('lawyer_notifications')
            query = {'lawyerId': request.user_id, 'read': False}
        else:  # client
            collection = get_db_collection('notifications')
            query = {'clientId': request.user_email, 'read': False}
        
        count = collection.count_documents(query)
        
        return jsonify({'unreadCount': count}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@notifications_bp.route('/api/admin/notifications', methods=['GET'])
@token_required
def get_admin_notifications():
    """Get all admin notifications (admin only)"""
    try:
        if request.user_role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        notification_type = request.args.get('type', None)
        
        collection = get_db_collection('admin_notifications')
        
        # Build query
        query = {}
        if notification_type:
            query['notificationType'] = notification_type
        
        # Get total count
        total = collection.count_documents(query)
        
        # Get paginated results
        skip = (page - 1) * limit
        notifications = list(collection.find(query)
                             .sort('createdAt', -1)
                             .skip(skip)
                             .limit(limit))
        
        # Format notifications
        formatted_notifications = []
        for notification in notifications:
            if '_id' in notification:
                notification['_id'] = str(notification['_id'])
            
            formatted_notification = {
                'id': notification.get('_id'),
                'title': notification.get('title', 'New Admin Notification'),
                'message': notification.get('message', ''),
                'type': notification.get('notificationType', 'general'),
                'read': notification.get('read', False),
                'createdAt': notification.get('createdAt'),
                'data': {
                    'caseId': notification.get('caseId'),
                    'caseTitle': notification.get('caseTitle'),
                    'lawyerName': notification.get('lawyerName'),
                    'clientName': notification.get('clientName'),
                    'response': notification.get('response'),
                    'reason': notification.get('reason')
                }
            }
            formatted_notifications.append(formatted_notification)
        
        return jsonify({
            'notifications': formatted_notifications,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@notifications_bp.route('/api/lawyer/notifications', methods=['GET'])
@token_required
def get_lawyer_notifications():
    """Get all lawyer notifications (lawyer only)"""
    try:
        if request.user_role != 'lawyer':
            return jsonify({'error': 'Lawyer access required'}), 403
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        collection = get_db_collection('lawyer_notifications')
        
        # Get lawyer's notifications
        query = {'lawyerId': request.user_id}
        
        # Get total count
        total = collection.count_documents(query)
        
        # Get paginated results
        skip = (page - 1) * limit
        notifications = list(collection.find(query)
                             .sort('createdAt', -1)
                             .skip(skip)
                             .limit(limit))
        
        # Format notifications
        formatted_notifications = []
        for notification in notifications:
            if '_id' in notification:
                notification['_id'] = str(notification['_id'])
            
            formatted_notification = {
                'id': notification.get('_id'),
                'title': 'New Case Assignment',
                'message': f'You have been assigned to case: {notification.get("caseTitle", "Untitled Case")}',
                'type': notification.get('notificationType', 'case_assignment'),
                'read': notification.get('read', False),
                'createdAt': notification.get('createdAt'),
                'data': {
                    'caseId': notification.get('caseId'),
                    'caseTitle': notification.get('caseTitle'),
                    'clientName': notification.get('clientName'),
                    'assignedBy': notification.get('assignedBy'),
                    'assignedAt': notification.get('assignedAt')
                }
            }
            formatted_notifications.append(formatted_notification)
        
        return jsonify({
            'notifications': formatted_notifications,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
