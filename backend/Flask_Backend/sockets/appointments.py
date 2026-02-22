"""
Socket.IO event handlers for Smart Chat Scheduling feature.
Handles appointment_proposal and appointment_response events.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict

from flask import request, session as sio_session
from flask_socketio import emit, join_room

from db.appointments import Appointment
from util.auth_jwt import decode_token

logger = logging.getLogger(__name__)

# Kafka topic for appointment scheduled events
APPOINTMENT_SCHEDULED_TOPIC = "appointment-scheduled"


def _get_kafka_service():
    """Lazy import to avoid circular dependencies."""
    try:
        from kafka_config import kafka_service
        return kafka_service
    except ImportError:
        logger.warning("Kafka service not available")
        return None


def _publish_to_kafka(topic: str, message: Dict[str, Any]) -> bool:
    """
    Publish message to Kafka topic (non-blocking).
    Returns True if published successfully, False otherwise.
    """
    try:
        kafka_service = _get_kafka_service()
        if not kafka_service:
            logger.warning(f"Cannot publish to {topic}: Kafka service unavailable")
            return False

        producer = kafka_service.get_producer()
        if not producer:
            logger.warning(f"Cannot publish to {topic}: Kafka producer unavailable")
            return False

        import json

        json_value = json.dumps(message).encode("utf-8")

        def delivery_report(err, msg):
            if err is not None:
                logger.error(f"Message delivery to {topic} failed: {err}")
            else:
                logger.debug(f"Message delivered to {msg.topic()} [{msg.partition()}]")

        producer.produce(
            topic=topic,
            value=json_value,
            callback=delivery_report
        )

        # Non-blocking flush - don't wait for confirmation
        producer.poll(0)
        return True

    except Exception as e:
        logger.error(f"Failed to publish to Kafka topic {topic}: {e}")
        return False


def register_appointment_socket_events(socketio):
    """Register appointment-related Socket.IO event handlers."""

    @socketio.on("appointment_proposal")
    def on_appointment_proposal(data):
        """
        Handle appointment proposal from client.
        Client emits: {
            case_id: str,
            client_id: str,
            lawyer_id: str,
            proposed_times: [str],
            location_type: "virtual" | "in-person",
            chat_id: str
        }
        """
        try:
            # Extract required fields
            case_id = data.get("case_id")
            client_id = data.get("client_id")
            lawyer_id = data.get("lawyer_id")
            proposed_times = data.get("proposed_times", [])
            location_type = data.get("location_type", "virtual")
            chat_id = data.get("chat_id")

            # Validate required fields
            if not all([case_id, client_id, lawyer_id, proposed_times]):
                emit("appointment_error", {
                    "error": "Missing required fields: case_id, client_id, lawyer_id, proposed_times"
                })
                return {"success": False, "error": "Missing required fields"}

            # Validate proposed_times is a non-empty list
            if not isinstance(proposed_times, list) or len(proposed_times) == 0:
                emit("appointment_error", {
                    "error": "proposed_times must be a non-empty array"
                })
                return {"success": False, "error": "Invalid proposed_times"}

            # Create appointment in MongoDB
            appointment = Appointment.create(
                case_id=case_id,
                client_id=client_id,
                lawyer_id=lawyer_id,
                proposed_times=proposed_times,
                location_type=location_type
            )

            if not appointment:
                emit("appointment_error", {
                    "error": "Failed to create appointment in database"
                })
                return {"success": False, "error": "Database error"}

            # Prepare notification payload
            notification = {
                "appointment_id": appointment["appointment_id"],
                "case_id": case_id,
                "client_id": client_id,
                "lawyer_id": lawyer_id,
                "proposed_times": proposed_times,
                "location_type": location_type,
                "status": "pending",
                "agreed_time": None,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            # Broadcast to case-specific room
            room = f"chat:{chat_id}" if chat_id else f"case:{case_id}"
            join_room(room)
            emit("appointment_notification", notification, room=room)

            logger.info(f"✅ Appointment proposal created: {appointment['appointment_id']}")

            return {"success": True, "appointment_id": appointment["appointment_id"]}

        except Exception as e:
            logger.error(f"❌ Error handling appointment_proposal: {e}")
            emit("appointment_error", {"error": "Internal server error"})
            return {"success": False, "error": "Internal server error"}

    @socketio.on("appointment_response")
    def on_appointment_response(data):
        """
        Handle lawyer's response to appointment proposal.
        Client emits: {
            appointment_id: str,
            case_id: str,
            response: "accept" | "decline" | "propose_new",
            agreed_time: str (optional, required for accept),
            new_proposed_times: [str] (optional, required for propose_new)
        }
        """
        try:
            appointment_id = data.get("appointment_id")
            case_id = data.get("case_id")
            response = data.get("response")
            agreed_time = data.get("agreed_time")
            new_proposed_times = data.get("new_proposed_times", [])

            # Validate required fields
            if not all([appointment_id, case_id, response]):
                emit("appointment_error", {
                    "error": "Missing required fields: appointment_id, case_id, response"
                })
                return {"success": False, "error": "Missing required fields"}

            # Validate response type
            valid_responses = ["accept", "decline", "propose_new"]
            if response not in valid_responses:
                emit("appointment_error", {
                    "error": f"Invalid response. Must be one of: {valid_responses}"
                })
                return {"success": False, "error": "Invalid response type"}

            # Get user ID from session
            user_id = sio_session.get("user_id")

            # Handle different response types
            success = False
            updated_appointment = None

            if response == "accept":
                if not agreed_time:
                    emit("appointment_error", {
                        "error": "agreed_time is required when accepting"
                    })
                    return {"success": False, "error": "Missing agreed_time"}

                success = Appointment.accept_appointment(appointment_id, agreed_time)

                if success:
                    # Publish to Kafka for background processing
                    kafka_message = {
                        "event_type": "appointment_scheduled",
                        "appointment_id": appointment_id,
                        "case_id": case_id,
                        "agreed_time": agreed_time,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }

                    # Non-blocking Kafka publish
                    kafka_published = _publish_to_kafka(APPOINTMENT_SCHEDULED_TOPIC, kafka_message)
                    if not kafka_published:
                        logger.warning(f"Failed to publish to Kafka, but appointment was accepted")

            elif response == "decline":
                success = Appointment.decline_appointment(appointment_id)

            elif response == "propose_new":
                if not new_proposed_times or len(new_proposed_times) == 0:
                    emit("appointment_error", {
                        "error": "new_proposed_times is required when proposing new times"
                    })
                    return {"success": False, "error": "Missing new_proposed_times"}

                success = Appointment.propose_new_times(appointment_id, new_proposed_times)

            if not success:
                emit("appointment_error", {"error": "Failed to update appointment"})
                return {"success": False, "error": "Database update failed"}

            # Get updated appointment for notification
            updated_appointment = Appointment.get_by_id(appointment_id)
            serialized = Appointment.serialize_for_response(updated_appointment)

            # Prepare notification payload
            notification = {
                "appointment_id": appointment_id,
                "case_id": case_id,
                "status": serialized.get("status") if serialized else response,
                "agreed_time": agreed_time if response == "accept" else None,
                "proposed_times": new_proposed_times if response == "propose_new" else (serialized.get("proposed_times") if serialized else []),
                "response": response,
                "responded_by": str(user_id) if user_id else None,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            # Broadcast update to case-specific room
            room = f"case:{case_id}"
            emit("appointment_updated", notification, room=room)

            logger.info(f"✅ Appointment {appointment_id} {response}ed by user {user_id}")

            return {"success": True}

        except Exception as e:
            logger.error(f"❌ Error handling appointment_response: {e}")
            emit("appointment_error", {"error": "Internal server error"})
            return {"success": False, "error": "Internal server error"}

    @socketio.on("get_appointments")
    def on_get_appointments(data):
        """
        Get appointments for a user.
        Client emits: {
            user_id: str,
            role: "client" | "lawyer",
            status: str (optional)
        }
        """
        try:
            user_id = data.get("user_id")
            role = data.get("role")
            status = data.get("status")

            if not user_id or not role:
                return {"success": False, "error": "Missing user_id or role"}

            if role == "client":
                appointments = Appointment.get_by_client_id(user_id, status)
            elif role == "lawyer":
                appointments = Appointment.get_by_lawyer_id(user_id, status)
            else:
                return {"success": False, "error": "Invalid role"}

            # Serialize appointments for JSON response
            serialized_appointments = [
                Appointment.serialize_for_response(apt) for apt in appointments
            ]

            return {"success": True, "appointments": serialized_appointments}

        except Exception as e:
            logger.error(f"❌ Error handling get_appointments: {e}")
            return {"success": False, "error": "Internal server error"}
