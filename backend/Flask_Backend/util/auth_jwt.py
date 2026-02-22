from functools import wraps
from flask import request, jsonify
import jwt
from datetime import datetime, timedelta, timezone
from config import Config

def create_token(user_id: int, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXPIRES_HOURS),
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")

def decode_token(token: str) -> dict:
    return jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])

def _get_bearer():
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth.split(" ", 1)[1].strip()
    return None

def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        
        if request.method == "OPTIONS":
            return ("", 200)

        token = _get_bearer()
        if not token:
            return jsonify({"Success": False, "Message": "Missing Bearer token"}), 401
        try:
            claims = decode_token(token)
        except Exception:
            return jsonify({"Success": False, "Message": "Invalid or expired token"}), 401

        request.user = {"id": int(claims.get("user_id", claims.get("id"))), "role": claims["role"]}
        return fn(*args, **kwargs)

    return wrapper
