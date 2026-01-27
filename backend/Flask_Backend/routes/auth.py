from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from service.user_service import User_Service
from kafka_config import kafka_service
import jwt
import os
from functools import wraps

auth_bp = Blueprint("auth", __name__)
user_service = User_Service()

def admin_required(f):
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
            
            if decoded.get('role') != 'admin':
                return jsonify({"Error": "Admin access required"}), 403
                
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"Error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"Error": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"Error": f"Authentication error: {str(e)}"}), 401
    
    return decorated_function

@auth_bp.route("/register", methods=["POST"])
def client_sign_up():
    data  = request.json
    return jsonify(user_service.add_new_client(name=data.get("name"), email=data.get("email"), password=data.get("password")))

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    result = user_service.authenticate_client(email=data.get("email"), password=data.get("password"))
    
    if result.get("Success"):
        # Generate JWT token
        user_data = result.get("User Data", {})
        
        token_payload = {
            'email': user_data.get('email'),
            'role': user_data.get('role'),
            'name': user_data.get('name')
        }
        
        secret_key = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
        token = jwt.encode(token_payload, secret_key, algorithm='HS256')
        
        # Add token to response
        result['token'] = token
        
        # Store token in result for frontend
        if user_data.get('role') == 'admin':
            result['adminToken'] = token
        else:
            result['userToken'] = token
    
    return jsonify(result)

@auth_bp.route("/admin/get-lawyers", methods=["GET"])
@admin_required
def get_lawyers():
    try:
        lawyers = user_service.get_all_lawyers()
        return jsonify({"Success": True, "Lawyers": lawyers}), 200
    except Exception as e:
        return jsonify({"Success": False, "Message": str(e)}), 500


@auth_bp.route("/admin/create-lawyer", methods=["POST"])
@admin_required
def admin_create_lawyer():
    data = request.json
    
    # Validate required fields
    required_fields = ["name", "email", "password"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"Error": f"{field} is required"}), 400
    
    # Create lawyer with role="lawyer"
    result = user_service.add_new_lawyer(
        name=data.get("name"), 
        email=data.get("email"), 
        password=data.get("password"),
        specialization=data.get("specialization"),
        experience=data.get("experience"),
        availability=data.get("availability"),
        case_history_summary=data.get("case_history_summary"),
        phone=data.get("phone"),
        barNumber=data.get("barNumber")
    )
    
    if result.get("Success"):
        # Publish lawyer creation event to Kafka
        try:
            lawyer_data = {
                "name": data.get("name"),
                "email": data.get("email"),
                "specialization": data.get("specialization"),
                "experience": data.get("experience"),
                "availability": data.get("availability"),
                "case_history_summary": data.get("case_history_summary"),
                "phone": data.get("phone"),
                "barNumber": data.get("barNumber"),
                "role": "lawyer",
                "created_at": result.get("created_at", ""),
                "user_id": result.get("user_id", "")
            }
            
            # Create a new topic for user management events or use existing
            notification_message = {
                'event_type': 'lawyer_created',
                'timestamp': result.get("created_at", ""),
                'data': lawyer_data
            }
            
            # Use the notification topic for lawyer creation events
            kafka_service.publish_notification(notification_message)
            
        except Exception as kafka_error:
            # Log Kafka error but don't fail the request
            print(f"Kafka publish failed: {kafka_error}")
        
        return jsonify(result), 201
    else:
        return jsonify(result), 400
    

