# db/chats.py  (Mongo chats/messages/state + Supabase users profile)

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional, List, Dict

from bson import ObjectId
from mongodb_client import get_db_collection


def _oid(v) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    return ObjectId(str(v))


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _to_dt(v: Any) -> Optional[datetime]:
    """
    Convert stored values to datetime (tz-aware).
    Accepts datetime or ISO string.
    """
    if v is None:
        return None
    if isinstance(v, datetime):
        return v if v.tzinfo else v.replace(tzinfo=timezone.utc)

    try:
        s = str(v).strip()
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        dt = datetime.fromisoformat(s)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None


class Chat:
    # -------------------------
    # Mongo collections
    # -------------------------
    chats = get_db_collection("chats")
    messages = get_db_collection("messages")
    state = get_db_collection("chat_user_state")

    # -------------------------
    # Supabase users schema
    # -------------------------
    USER_TABLE = "users"
    USER_NAME_COL = "name"

    # IMPORTANT:
    # Your column might be "img_url" OR "img" (your screenshot shows "img ...").
    # We'll detect safely in get_user_profile().
    USER_AVATAR_COL = "img_url"  # default attempt
    USER_AVATAR_FALLBACK_COL = "img"  # fallback attempt

    # -------------------------
    # Basic
    # -------------------------
    @staticmethod
    def get_by_id(chat_id) -> Optional[dict]:
        try:
            return Chat.chats.find_one({"_id": _oid(chat_id)})
        except Exception:
            return None

    @staticmethod
    def get_or_create(client_id: int, lawyer_id: int) -> dict:
        client_id = int(client_id)
        lawyer_id = int(lawyer_id)

        chat = Chat.chats.find_one({"client_id": client_id, "lawyer_id": lawyer_id})
        if chat:
            return chat

        now = _utc_now()
        ins = Chat.chats.insert_one(
            {
                "client_id": client_id,
                "lawyer_id": lawyer_id,
                "last_message": "",
                "last_message_time": None,
                "created_at": now,
            }
        )
        return Chat.chats.find_one({"_id": ins.inserted_id})

    # -------------------------
    # User profile (Supabase)
    # -------------------------
    @staticmethod
    def get_user_profile(sb, user_id: int) -> Optional[dict]:
        """
        Fetch user display info from Supabase public.users.
        Returns: {"id": int, "name": str, "img_url"/"img": str|null}
        """
        if user_id is None:
            return None

        uid = int(user_id)

        # Try avatar as img_url first
        cols1 = f"id,{Chat.USER_NAME_COL},{Chat.USER_AVATAR_COL}"
        try:
            res = sb.table(Chat.USER_TABLE).select(cols1).eq("id", uid).limit(1).execute()
            rows = getattr(res, "data", None) or []
            if rows:
                return rows[0]
        except Exception:
            pass

        # Fallback: avatar column might be "img"
        cols2 = f"id,{Chat.USER_NAME_COL},{Chat.USER_AVATAR_FALLBACK_COL}"
        try:
            res = sb.table(Chat.USER_TABLE).select(cols2).eq("id", uid).limit(1).execute()
            rows = getattr(res, "data", None) or []
            if rows:
                return rows[0]
        except Exception:
            pass

        # If even name column differs, at least try id + name only
        cols3 = f"id,{Chat.USER_NAME_COL}"
        try:
            res = sb.table(Chat.USER_TABLE).select(cols3).eq("id", uid).limit(1).execute()
            rows = getattr(res, "data", None) or []
            return rows[0] if rows else None
        except Exception:
            return None

    @staticmethod
    def extract_avatar(user_row: Optional[dict]) -> Optional[str]:
        """
        Reads avatar from either img_url or img
        """
        if not user_row:
            return None
        return (
            user_row.get(Chat.USER_AVATAR_COL)
            or user_row.get(Chat.USER_AVATAR_FALLBACK_COL)
            or None
        )

    # -------------------------
    # Per-user state (Mongo)
    # -------------------------
    @staticmethod
    def get_user_state(chat_id, user_id: int) -> Optional[dict]:
        try:
            return Chat.state.find_one(
                {"chat_id": _oid(chat_id), "user_id": int(user_id)}
            )
        except Exception:
            return None

    @staticmethod
    def mark_deleted_for_me(chat_id, user_id: int) -> dict:
        now = _utc_now()
        Chat.state.update_one(
            {"chat_id": _oid(chat_id), "user_id": int(user_id)},
            {"$set": {"hidden_at": now, "cleared_before": now}},
            upsert=True,
        )
        return {"hidden_at": now, "cleared_before": now}

    # -------------------------
    # Latest message helpers (Mongo)
    # -------------------------
    @staticmethod
    def get_latest_message_after(chat_id, after_ts: Optional[Any] = None) -> Optional[dict]:
        chat_oid = _oid(chat_id)
        q: Dict[str, Any] = {"chat_id": chat_oid}

        dt = _to_dt(after_ts) if after_ts else None
        if dt:
            q["sent_at"] = {"$gt": dt}

        return Chat.messages.find_one(q, sort=[("sent_at", -1), ("_id", -1)])

    # -------------------------
    # List chats (Mongo delete-for-me logic)
    # -------------------------
    @staticmethod
    def list_for_user(user_id: int, role: str) -> List[dict]:
        """
        Hide chats where this user deleted it.
        Reappear ONLY when OTHER user sends a new message AFTER cleared_before.
        """
        user_id = int(user_id)

        if role == "client":
            base = {"client_id": user_id}
        elif role == "lawyer":
            base = {"lawyer_id": user_id}
        else:
            return []

        chats = list(Chat.chats.find(base).sort([("last_message_time", -1), ("_id", -1)]))
        if not chats:
            return []

        visible: List[dict] = []
        for c in chats:
            cid = c["_id"]
            st = Chat.get_user_state(cid, user_id)

            if st and st.get("hidden_at"):
                cleared_before = _to_dt(st.get("cleared_before"))
                if not cleared_before:
                    continue

                # must have message from other user after cleared_before
                exists = Chat.messages.find_one(
                    {
                        "chat_id": cid,
                        "sender_id": {"$ne": user_id},
                        "sent_at": {"$gt": cleared_before},
                    }
                )
                if not exists:
                    continue

            visible.append(c)

        return visible

    # -------------------------
    # Preview update (Mongo)
    # -------------------------
    @staticmethod
    def update_preview(chat_id, preview: str, at_iso: Any) -> None:
        Chat.chats.update_one(
            {"_id": _oid(chat_id)},
            {
                "$set": {
                    "last_message": preview,
                    "last_message_time": _to_dt(at_iso) or _utc_now(),
                }
            },
        )

    @staticmethod
    def refresh_preview_from_latest(chat_id) -> None:
        """
        Optional helper: recompute last_message/last_message_time from latest message.
        Useful after deleting a message.
        """
        last = Chat.get_latest_message_after(chat_id, after_ts=None)
        if not last:
            Chat.chats.update_one(
                {"_id": _oid(chat_id)},
                {"$set": {"last_message": "", "last_message_time": None}},
            )
            return

        if last.get("deleted_at"):
            preview = "Message deleted"
        else:
            txt = last.get("message")
            att = last.get("attachment_url")
            preview = txt if txt else ("Attachment" if att else "")

        Chat.update_preview(chat_id, preview, last.get("sent_at") or _utc_now())
