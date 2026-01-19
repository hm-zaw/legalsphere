from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from service.user_service import User_Service

auth_bp = Blueprint("auth", __name__)
user_service = User_Service()

@auth_bp.route("/register", methods=["POST"])
def client_sign_up():
    data  = request.json
    return jsonify(user_service.add_new_client(name=data.get("name"), email=data.get("email"), password=data.get("password")))

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    return jsonify(user_service.authenticate_client(email=data.get("email"), password=data.get("password")))
    

