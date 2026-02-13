from flask import Blueprint
from .auth import auth_bp
from .case_requests import case_requests_bp
from .admin import admin_bp
from .lawyer import lawyer_bp
from .notifications import notifications_bp

def register_routes(app):
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(case_requests_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(lawyer_bp)
    app.register_blueprint(notifications_bp)



