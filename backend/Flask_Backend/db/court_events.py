"""
Court events data access layer.
Handles all MongoDB operations for dictated court dates, deadlines, and hearings.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from bson import ObjectId
from mongodb_client import get_db_collection


class CourtEvent:
    """Data access layer for court_events collection."""

    court_events = get_db_collection("court_events")

    VALID_EVENT_TYPES = {"hearing", "trial_date", "deadline"}

    @staticmethod
    def _normalize_iso(value: Any) -> str:
        if value is None:
            return None
        if isinstance(value, str):
            return value
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value)

    @staticmethod
    def create(
        case_id: str,
        lawyer_id: str,
        client_id: str,
        title: str,
        event_type: str,
        scheduled_at: Any,
        location: str = "",
        notes: str = "",
    ) -> Dict[str, Any]:
        if not case_id or not lawyer_id or not client_id:
            raise ValueError("case_id, lawyer_id, client_id are required")
        if not title:
            raise ValueError("title is required")
        if event_type not in CourtEvent.VALID_EVENT_TYPES:
            raise ValueError("Invalid event_type")
        if not scheduled_at:
            raise ValueError("scheduled_at is required")

        now_iso = datetime.utcnow().isoformat()
        doc: Dict[str, Any] = {
            "id": str(uuid4()),
            "case_id": str(case_id),
            "lawyer_id": str(lawyer_id),
            "client_id": str(client_id),
            "title": str(title),
            "event_type": str(event_type),
            "scheduled_at": CourtEvent._normalize_iso(scheduled_at),
            "location": str(location or ""),
            "notes": str(notes or ""),
            "created_at": now_iso,
            "updated_at": now_iso,
        }

        result = CourtEvent.court_events.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        return doc

    @staticmethod
    def list_by_case_id(case_id: str) -> List[Dict[str, Any]]:
        return list(
            CourtEvent.court_events.find({"case_id": str(case_id)}).sort(
                "scheduled_at", 1
            )
        )

    @staticmethod
    def list_by_lawyer_between(
        lawyer_id: str, start_date: str, end_date: str
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {
            "lawyer_id": str(lawyer_id),
            "scheduled_at": {"$gte": str(start_date), "$lte": str(end_date)},
        }
        return list(CourtEvent.court_events.find(query).sort("scheduled_at", 1))

    @staticmethod
    def serialize_for_response(doc: Dict[str, Any]) -> Dict[str, Any]:
        if not doc:
            return None

        serialized: Dict[str, Any] = {}
        for key, value in doc.items():
            if key == "_id":
                serialized["_id"] = str(value)
            elif isinstance(value, ObjectId):
                serialized[key] = str(value)
            else:
                serialized[key] = value
        return serialized
