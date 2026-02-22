# db/messages.py  (MongoDB)

from datetime import datetime, timezone
from typing import Optional, Any, List
from bson import ObjectId
from mongodb_client import get_db_collection


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _to_dt(v: Any) -> Optional[datetime]:
    """
    Accept datetime or ISO string, return tz-aware UTC datetime.
    """
    if v is None:
        return None
    if isinstance(v, datetime):
        return v if v.tzinfo else v.replace(tzinfo=timezone.utc)

    try:
        s = str(v).strip().replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None


class Message:
    col = get_db_collection("messages")

    @staticmethod
    def list_for_chat(chat_id: ObjectId, after_ts: str | None = None) -> List[dict]:
        q = {"chat_id": chat_id}

        dt = _to_dt(after_ts) if after_ts else None
        if dt:
            q["sent_at"] = {"$gt": dt}

        return list(Message.col.find(q).sort([("sent_at", 1), ("_id", 1)]))

    @staticmethod
    def insert(
        chat_id: ObjectId,
        sender_id: int,
        message: Optional[str],
        attachment_url: Optional[str],
        attachment_name: Optional[str],
        attachment_public_id: Optional[str],
        sent_at: Any,
    ) -> dict:
        sent_dt = _to_dt(sent_at) or _utc_now()

        doc = {
            "chat_id": chat_id,
            "sender_id": int(sender_id),
            "message": message,
            "attachment_url": attachment_url,
            "attachment_name": attachment_name,
            "attachment_public_id": attachment_public_id,
            "read_at": None,
            "sent_at": sent_dt,
            "edited_at": None,
            "deleted_at": None,
        }

        res = Message.col.insert_one(doc)
        return Message.col.find_one({"_id": res.inserted_id})

    @staticmethod
    def get_by_id(message_id: ObjectId) -> Optional[dict]:
        return Message.col.find_one({"_id": message_id})

    @staticmethod
    def update_text(message_id: ObjectId, sender_id: int, new_text: str, edited_at: Any) -> Optional[dict]:
        edited_dt = _to_dt(edited_at) or _utc_now()

        res = Message.col.find_one_and_update(
            {
                "_id": message_id,
                "sender_id": int(sender_id),
                "deleted_at": None,
            },
            {"$set": {"message": new_text, "edited_at": edited_dt}},
            return_document=True,
        )
        return res

    @staticmethod
    def soft_delete(message_id: ObjectId, sender_id: int, deleted_at: Any) -> Optional[dict]:
        deleted_dt = _to_dt(deleted_at) or _utc_now()

        res = Message.col.find_one_and_update(
            {
                "_id": message_id,
                "sender_id": int(sender_id),
                "deleted_at": None,
            },
            {"$set": {
                "message": None,
                "attachment_url": None,
                "attachment_name": None,
                "attachment_public_id": None,
                "deleted_at": deleted_dt,
            }},
            return_document=True,
        )
        return res

    @staticmethod
    def mark_chat_read(
        chat_id: ObjectId,
        reader_id: int,
        read_at: Any,
        after_ts: Any = None,
    ) -> List[ObjectId]:
        """
        Marks messages as read where:
          - chat_id matches
          - sender_id != reader_id
          - read_at is null
          - deleted_at is null (optional, but good)
          - and sent_at > after_ts if provided (delete-for-me)
        Returns list of updated _id.
        """
        read_dt = _to_dt(read_at) or _utc_now()
        q = {
            "chat_id": chat_id,
            "sender_id": {"$ne": int(reader_id)},
            "read_at": None,
        }

        cb = _to_dt(after_ts) if after_ts else None
        if cb:
            q["sent_at"] = {"$gt": cb}

        ids = [r["_id"] for r in Message.col.find(q, {"_id": 1})]
        if not ids:
            return []

        Message.col.update_many(
            {"_id": {"$in": ids}},
            {"$set": {"read_at": read_dt}},
        )
        return ids
