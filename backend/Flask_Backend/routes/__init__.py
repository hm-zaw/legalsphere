from flask import Blueprint
from .auth import auth_bp
from .case_requests import case_requests_bp

def register_routes(app):
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(case_requests_bp)



