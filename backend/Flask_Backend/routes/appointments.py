"""
REST API routes for Smart Chat Scheduling feature.
Provides endpoints for fetching appointments.
"""

from flask import Blueprint, request, jsonify
from db.appointments import Appointment
import logging

logger = logging.getLogger(__name__)

# Create blueprint
appointments_bp = Blueprint("appointments", __name__, url_prefix="/api/appointments")


@appointments_bp.route("/upcoming", methods=["GET"])
def get_upcoming_appointments():
    """
    Get upcoming accepted appointments for a user.
    
    Query params:
        userId: str - The user ID
        role: str - "lawyer" | "client" | "admin"
        limit: int - Maximum number of results (default: 10)
    
    Returns:
        {
            success: bool,
            appointments: [AppointmentData]
        }
    """
    try:
        user_id = request.args.get("userId")
        role = request.args.get("role")
        limit = request.args.get("limit", 10, type=int)

        if not user_id or not role:
            return jsonify({
                "success": False,
                "error": "Missing required parameters: userId, role"
            }), 400

        if role not in ["lawyer", "client", "admin"]:
            return jsonify({
                "success": False,
                "error": "Invalid role. Must be: lawyer, client, or admin"
            }), 400

        # Get upcoming accepted appointments
        appointments = Appointment.get_upcoming_accepted(
            lawyer_id=user_id if role == "lawyer" else None,
            client_id=user_id if role == "client" else None,
            limit=limit
        )

        # Serialize appointments for JSON response
        serialized_appointments = [
            Appointment.serialize_for_response(apt) for apt in appointments
        ]

        return jsonify({
            "success": True,
            "appointments": serialized_appointments,
            "count": len(serialized_appointments)
        })

    except Exception as e:
        logger.error(f"❌ Error fetching upcoming appointments: {e}")
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500


@appointments_bp.route("/case/<case_id>", methods=["GET"])
def get_case_appointments(case_id):
    """
    Get all appointments for a specific case.
    
    Query params:
        status: str (optional) - Filter by status
    
    Returns:
        {
            success: bool,
            appointments: [AppointmentData]
        }
    """
    try:
        status = request.args.get("status")

        appointments = Appointment.get_by_case_id(case_id, status)

        # Serialize appointments for JSON response
        serialized_appointments = [
            Appointment.serialize_for_response(apt) for apt in appointments
        ]

        return jsonify({
            "success": True,
            "appointments": serialized_appointments,
            "count": len(serialized_appointments)
        })

    except Exception as e:
        logger.error(f"❌ Error fetching case appointments: {e}")
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500


@appointments_bp.route("/<appointment_id>", methods=["GET"])
def get_appointment(appointment_id):
    """
    Get a single appointment by ID.
    
    Returns:
        {
            success: bool,
            appointment: AppointmentData | null
        }
    """
    try:
        appointment = Appointment.get_by_id(appointment_id)

        if not appointment:
            return jsonify({
                "success": False,
                "error": "Appointment not found"
            }), 404

        return jsonify({
            "success": True,
            "appointment": Appointment.serialize_for_response(appointment)
        })

    except Exception as e:
        logger.error(f"❌ Error fetching appointment: {e}")
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500


def register_appointment_routes(app):
    """Register appointment routes with the Flask app."""
    app.register_blueprint(appointments_bp)
    logger.info("✅ Appointment routes registered")
