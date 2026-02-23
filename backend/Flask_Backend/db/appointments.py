"""
Appointments data access layer for Smart Chat Scheduling feature.
Handles all MongoDB operations for appointment proposals and scheduling.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional, List, Dict
from uuid import uuid4

from bson import ObjectId
from mongodb_client import get_db_collection


def _oid(v) -> ObjectId:
    """Convert string/ObjectId to ObjectId."""
    if isinstance(v, ObjectId):
        return v
    return ObjectId(str(v))


def _utc_now() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)


def _to_iso(dt: datetime) -> str:
    """Convert datetime to ISO 8601 string."""
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    return dt.isoformat()


class Appointment:
    """Data access layer for appointments collection."""
    
    appointments = get_db_collection("appointments")
    
    VALID_STATUSES = ["pending", "accepted", "declined", "completed"]
    VALID_LOCATION_TYPES = ["in-person", "virtual"]
    
    @staticmethod
    def create(
        case_id: str,
        client_id: str,
        lawyer_id: str,
        proposed_times: List[str],
        location_type: str = "virtual"
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new appointment proposal.
        
        Args:
            case_id: The case ID (string or ObjectId)
            client_id: The client user ID
            lawyer_id: The lawyer user ID
            proposed_times: Array of ISO timestamp strings for proposed times
            location_type: "in-person" or "virtual"
            
        Returns:
            The created appointment document or None if failed
        """
        try:
            # Validate location_type
            if location_type not in Appointment.VALID_LOCATION_TYPES:
                location_type = "virtual"
            
            appointment_doc = {
                "appointment_id": str(uuid4()),
                "case_id": str(case_id),
                "client_id": str(client_id),
                "lawyer_id": str(lawyer_id),
                "proposed_times": proposed_times,
                "agreed_time": None,
                "status": "pending",
                "waiting_for": "lawyer",
                "location_type": location_type,
                "created_at": _utc_now(),
                "updated_at": _utc_now(),
            }
            
            result = Appointment.appointments.insert_one(appointment_doc)
            
            if result.inserted_id:
                # Return the created document without MongoDB _id
                appointment_doc["_id"] = str(result.inserted_id)
                return appointment_doc
            return None
            
        except Exception as e:
            print(f"❌ Failed to create appointment: {e}")
            return None
    
    @staticmethod
    def get_by_id(appointment_id: str) -> Optional[Dict[str, Any]]:
        """Get appointment by appointment_id (UUID)."""
        try:
            return Appointment.appointments.find_one({"appointment_id": appointment_id})
        except Exception as e:
            print(f"❌ Failed to get appointment: {e}")
            return None
    
    @staticmethod
    def get_by_case_id(case_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get appointments by case_id.
        
        Args:
            case_id: The case ID
            status: Optional status filter
            
        Returns:
            List of appointment documents
        """
        try:
            query = {"case_id": str(case_id)}
            if status:
                query["status"] = status
            
            return list(Appointment.appointments.find(query).sort("created_at", -1))
        except Exception as e:
            print(f"❌ Failed to get appointments by case: {e}")
            return []
    
    @staticmethod
    def get_by_lawyer_id(lawyer_id: str, status: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get appointments for a lawyer.
        
        Args:
            lawyer_id: The lawyer user ID
            status: Optional status filter
            limit: Maximum number of results
            
        Returns:
            List of appointment documents
        """
        try:
            query = {"lawyer_id": str(lawyer_id)}
            if status:
                query["status"] = status
            
            return list(Appointment.appointments.find(query).sort("created_at", -1).limit(limit))
        except Exception as e:
            print(f"❌ Failed to get appointments by lawyer: {e}")
            return []
    
    @staticmethod
    def get_by_client_id(client_id: str, status: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get appointments for a client.
        
        Args:
            client_id: The client user ID
            status: Optional status filter
            limit: Maximum number of results
            
        Returns:
            List of appointment documents
        """
        try:
            query = {"client_id": str(client_id)}
            if status:
                query["status"] = status
            
            return list(Appointment.appointments.find(query).sort("created_at", -1).limit(limit))
        except Exception as e:
            print(f"❌ Failed to get appointments by client: {e}")
            return []
    
    @staticmethod
    def accept_appointment(appointment_id: str, agreed_time: str) -> bool:
        """
        Accept an appointment proposal.
        
        Args:
            appointment_id: The appointment UUID
            agreed_time: The agreed ISO timestamp
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = Appointment.appointments.update_one(
                {"appointment_id": appointment_id},
                {
                    "$set": {
                        "status": "accepted",
                        "agreed_time": agreed_time,
                        "updated_at": _utc_now(),
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"❌ Failed to accept appointment: {e}")
            return False
    
    @staticmethod
    def decline_appointment(appointment_id: str) -> bool:
        """
        Decline an appointment proposal.
        
        Args:
            appointment_id: The appointment UUID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = Appointment.appointments.update_one(
                {"appointment_id": appointment_id},
                {
                    "$set": {
                        "status": "declined",
                        "updated_at": _utc_now(),
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"❌ Failed to decline appointment: {e}")
            return False
    
    @staticmethod
    def propose_new_times(appointment_id: str, new_proposed_times: List[str], waiting_for: str = "client") -> bool:
        """
        Update appointment with new proposed times (lawyer or client proposing new times).
        
        Args:
            appointment_id: The appointment UUID
            new_proposed_times: Array of new ISO timestamp strings
            waiting_for: 'lawyer' or 'client', defaults to 'client'
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = Appointment.appointments.update_one(
                {"appointment_id": appointment_id},
                {
                    "$set": {
                        "proposed_times": new_proposed_times,
                        "status": "pending",  # Reset to pending for the other party to choose
                        "waiting_for": waiting_for,
                        "updated_at": _utc_now(),
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"❌ Failed to propose new times: {e}")
            return False
    
    @staticmethod
    def complete_appointment(appointment_id: str) -> bool:
        """
        Mark an appointment as completed.
        
        Args:
            appointment_id: The appointment UUID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = Appointment.appointments.update_one(
                {"appointment_id": appointment_id},
                {
                    "$set": {
                        "status": "completed",
                        "updated_at": _utc_now(),
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"❌ Failed to complete appointment: {e}")
            return False
    
    @staticmethod
    def get_upcoming_accepted(lawyer_id: Optional[str] = None, client_id: Optional[str] = None, 
                              limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get upcoming accepted appointments (for dashboard widgets).
        
        Args:
            lawyer_id: Optional lawyer filter
            client_id: Optional client filter
            limit: Maximum number of results
            
        Returns:
            List of upcoming accepted appointments sorted by agreed_time
        """
        try:
            query = {
                "status": "accepted",
                "agreed_time": {"$gte": _to_iso(_utc_now())}
            }
            
            if lawyer_id:
                query["lawyer_id"] = str(lawyer_id)
            if client_id:
                query["client_id"] = str(client_id)
            
            return list(
                Appointment.appointments.find(query)
                .sort("agreed_time", 1)
                .limit(limit)
            )
        except Exception as e:
            print(f"❌ Failed to get upcoming appointments: {e}")
            return []
    
    @staticmethod
    def serialize_for_response(doc: Dict[str, Any]) -> Dict[str, Any]:
        """
        Serialize MongoDB document for JSON response.
        Converts ObjectId and datetime to strings.
        """
        if not doc:
            return None
            
        serialized = {}
        for key, value in doc.items():
            if key == "_id":
                serialized["id"] = str(value)
            elif isinstance(value, ObjectId):
                serialized[key] = str(value)
            elif isinstance(value, datetime):
                serialized[key] = value.isoformat()
            else:
                serialized[key] = value
        return serialized
