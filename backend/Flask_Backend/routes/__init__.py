from flask import Blueprint
from .auth import auth_bp
from .case_requests import case_requests_bp
from .admin import admin_bp
from .lawyer import lawyer_bp
from .notifications import notifications_bp
from .chat import chat_bp
from .appointments import appointments_bp
from .court_events import court_events_bp

def register_routes(app):
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(case_requests_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(lawyer_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(chat_bp, url_prefix="/api")
    app.register_blueprint(appointments_bp)
    app.register_blueprint(court_events_bp)



