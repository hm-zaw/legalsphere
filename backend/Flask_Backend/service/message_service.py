# service/message_service.py  (MongoDB)

from datetime import datetime, timezone
from bson import ObjectId

from db.messages import Message
from db.chats import Chat
from service.chat_service import ChatService
from util.cloudinary_config import upload_any_file_to_cloudinary


def _now_dt() -> datetime:
    return datetime.now(timezone.utc)


def _oid(x) -> ObjectId:
    if isinstance(x, ObjectId):
        return x
    return ObjectId(str(x))


def _serialize_message(doc: dict) -> dict:
    """
    Convert Mongo message document to API shape.
      - _id -> id (string)
      - chat_id ObjectId -> string
      - datetimes -> ISO strings
    """
    if not doc:
        return doc

    d = dict(doc)

    if "_id" in d:
        d["id"] = str(d["_id"])
        d.pop("_id", None)

    if "chat_id" in d and isinstance(d["chat_id"], ObjectId):
        d["chat_id"] = str(d["chat_id"])

    # convert datetime fields
    for k, v in list(d.items()):
        if hasattr(v, "isoformat"):
            d[k] = v.isoformat()

    return d


class MessageService:
    def __init__(self):
        self.chat_service = ChatService()

    def list_messages(self, chat_id: str, after_ts: str | None = None):
        chat_oid = _oid(chat_id)
        rows = Message.list_for_chat(chat_id=chat_oid, after_ts=after_ts)
        return {"Success": True, "Data": [_serialize_message(r) for r in (rows or [])]}

    def send_message(self, chat_id: str, sender_id: int, text: str | None, file_storage):
        chat_oid = _oid(chat_id)
        sender_id = int(sender_id)

        clean_text = (text or "").strip()
        if not clean_text and not file_storage:
            return {"Success": False, "Message": "Message text or file is required"}

        attachment_url = None
        attachment_name = None
        attachment_public_id = None

        if file_storage:
            up = upload_any_file_to_cloudinary(file_storage)
            if not up.get("Success"):
                return {"Success": False, "Message": "Upload failed", "Error": up}

            attachment_url = up.get("secure_url")
            attachment_public_id = up.get("public_id")
            attachment_name = getattr(file_storage, "filename", None) or "attachment"

            fmt = up.get("format")
            if fmt and "." not in attachment_name:
                attachment_name = f"{attachment_name}.{fmt}"

        sent_at = _now_dt()

        inserted = Message.insert(
            chat_id=chat_oid,
            sender_id=sender_id,
            message=clean_text if clean_text else None,
            attachment_url=attachment_url,
            attachment_name=attachment_name,
            attachment_public_id=attachment_public_id,
            sent_at=sent_at,
        )

        preview = clean_text if clean_text else ("Attachment" if attachment_url else "")
        Chat.update_preview(chat_id=chat_oid, preview=preview, at_iso=sent_at)

        return {"Success": True, "Data": _serialize_message(inserted)}

    def mark_chat_read(self, chat_id: str, reader_id: int):
        chat_oid = _oid(chat_id)
        reader_id = int(reader_id)

        read_at = _now_dt()

        # ✅ important: only mark messages after cleared_before (delete-for-me logic)
        state = Chat.get_user_state(chat_id=chat_oid, user_id=reader_id) or {}
        cleared_before = state.get("cleared_before")

        updated_ids = Message.mark_chat_read(
            chat_id=chat_oid,
            reader_id=reader_id,
            read_at=read_at,
            after_ts=cleared_before,
        )

        return {
            "Success": True,
            "Data": {
                "chat_id": str(chat_oid),
                "message_ids": [str(x) for x in (updated_ids or [])],
                "read_at": read_at.isoformat(),
            },
        }

    def edit_message(self, message_id: str, editor_id: int, new_text: str):
        editor_id = int(editor_id)
        new_text = (new_text or "").strip()

        if not new_text:
            return {"Success": False, "Message": "text is required", "code": 400}

        msg = Message.get_by_id(message_id=_oid(message_id))
        if not msg:
            return {"Success": False, "Message": "Message not found", "code": 404}

        chat_oid = msg["chat_id"]

        guard = self.chat_service.ensure_member(str(chat_oid), editor_id)
        if not guard["ok"]:
            return {"Success": False, "Message": guard["Message"], "code": guard["code"]}

        if int(msg.get("sender_id")) != editor_id:
            return {"Success": False, "Message": "Only sender can edit this message", "code": 403}

        if msg.get("deleted_at"):
            return {"Success": False, "Message": "Cannot edit a deleted message", "code": 400}

        edited_at = _now_dt()

        updated = Message.update_text(
            message_id=_oid(message_id),
            sender_id=editor_id,
            new_text=new_text,
            edited_at=edited_at,
        )

        if not updated:
            return {"Success": False, "Message": "No changes applied", "code": 400}

        # Optional: if edited message was latest, refresh preview
        Chat.refresh_preview_from_latest(chat_id=chat_oid)

        return {"Success": True, "Data": _serialize_message(updated)}

    def delete_message(self, message_id: str, deleter_id: int):
        deleter_id = int(deleter_id)

        msg = Message.get_by_id(message_id=_oid(message_id))
        if not msg:
            return {"Success": False, "Message": "Message not found", "code": 404}

        chat_oid = msg["chat_id"]

        guard = self.chat_service.ensure_member(str(chat_oid), deleter_id)
        if not guard["ok"]:
            return {"Success": False, "Message": guard["Message"], "code": guard["code"]}

        if int(msg.get("sender_id")) != deleter_id:
            return {"Success": False, "Message": "Only sender can delete this message", "code": 403}

        if msg.get("deleted_at"):
            return {
                "Success": True,
                "Message": "Already deleted",
                "Data": {"id": str(_oid(message_id)), "chat_id": str(chat_oid)},
            }

        deleted_at = _now_dt()

        updated = Message.soft_delete(
            message_id=_oid(message_id),
            sender_id=deleter_id,
            deleted_at=deleted_at,
        )

        if not updated:
            return {"Success": False, "Message": "Failed to delete message", "code": 400}

        Chat.refresh_preview_from_latest(chat_id=chat_oid)

        return {"Success": True, "Data": _serialize_message(updated)}

    def get_message(self, message_id: str):
        msg = Message.get_by_id(message_id=_oid(message_id))
        return _serialize_message(msg) if msg else None
