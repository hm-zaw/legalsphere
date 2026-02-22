"""
TypeScript interfaces for Smart Chat Scheduling feature.
Defines all data types for appointments and related Socket.IO events.
"""

from typing import TypedDict, List, Optional, Literal
from datetime import datetime


class AppointmentData(TypedDict):
    """Core appointment data structure matching MongoDB schema."""
    appointment_id: str
    case_id: str
    client_id: str
    lawyer_id: str
    proposed_times: List[str]
    agreed_time: Optional[str]
    status: Literal["pending", "accepted", "declined", "completed"]
    location_type: Literal["in-person", "virtual"]
    created_at: str
    updated_at: str


class AppointmentProposalPayload(TypedDict):
    """Payload for appointment_proposal Socket.IO event."""
    case_id: str
    client_id: str
    lawyer_id: str
    proposed_times: List[str]
    location_type: Literal["in-person", "virtual"]


class AppointmentResponsePayload(TypedDict):
    """Payload for appointment_response Socket.IO event."""
    appointment_id: str
    case_id: str
    response: Literal["accept", "decline", "propose_new"]
    agreed_time: Optional[str]
    new_proposed_times: Optional[List[str]]


class AppointmentNotificationPayload(TypedDict):
    """Payload for appointment notifications broadcast to clients."""
    appointment_id: str
    case_id: str
    client_id: str
    lawyer_id: str
    proposed_times: List[str]
    location_type: Literal["in-person", "virtual"]
    status: Literal["pending", "accepted", "declined", "completed"]
    agreed_time: Optional[str]
    responded_by: Optional[str]
    response: Optional[str]
    timestamp: str


# Export types for use in frontend
__all__ = [
    "AppointmentData",
    "AppointmentProposalPayload", 
    "AppointmentResponsePayload",
    "AppointmentNotificationPayload",
]
