# service/chat_service.py
# Mongo chats + Supabase users (FINAL CORRECT VERSION)

from bson import ObjectId
from db.chats import Chat
from db.supabase_obj import SupabaseObject


def _oid(v) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    return ObjectId(str(v))


class ChatService:

    def __init__(self):
        self.sb = SupabaseObject().get_supabase_client()

    # -------------------------
    # Supabase User Fetch
    # -------------------------
    def _get_user_from_supabase(self, user_id: int):
        """
        Fetch user from Supabase public.users
        """
        try:
            res = (
                self.sb
                .table("users")
                .select("id, name, img_url")
                .eq("id", int(user_id))
                .single()
                .execute()
            )

            return res.data if res.data else None

        except Exception as e:
            print("❌ Supabase user fetch error:", e)
            return None

    # -------------------------
    # List Chats
    # -------------------------
    def list_chats(self, user_id: int, role: str):

        if role not in ["client", "lawyer"]:
            return {"Success": False, "Message": "Only client/lawyer can use chat"}

        user_id = int(user_id)
        chats = Chat.list_for_user(user_id=user_id, role=role) or []

        result = []

        for c in chats:
            chat_oid = c.get("_id")

            # determine other side
            if role == "lawyer":
                other_id = c.get("client_id")
            else:
                other_id = c.get("lawyer_id")

            # 🔥 Fetch from Supabase
            other_user = self._get_user_from_supabase(other_id)

            # Cleared-before logic
            state = Chat.get_user_state(chat_oid, user_id) or {}
            cleared_before = state.get("cleared_before")

            last = Chat.get_latest_message_after(chat_oid, after_ts=cleared_before)

            if not last:
                last_message = ""
                last_time = None
            else:
                if last.get("deleted_at"):
                    last_message = "Message deleted"
                else:
                    txt = last.get("message")
                    att = last.get("attachment_url")
                    last_message = txt if txt else ("Attachment" if att else "")
                last_time = last.get("sent_at")

            result.append({
                "id": str(chat_oid),
                "client_id": c.get("client_id"),
                "lawyer_id": c.get("lawyer_id"),
                "other_user_name": (other_user or {}).get("name"),
                "other_user_avatar": (other_user or {}).get("img_url"),
                "last_message": last_message,
                "last_message_time": last_time,
            })

        return {"Success": True, "Data": result}

    # -------------------------
    # Ensure Member
    # -------------------------
    def ensure_member(self, chat_id, user_id: int):

        user_id = int(user_id)

        try:
            chat = Chat.get_by_id(chat_id=_oid(chat_id))
        except Exception:
            return {"ok": False, "code": 404, "Message": "Chat not found"}

        if not chat:
            return {"ok": False, "code": 404, "Message": "Chat not found"}

        if int(chat.get("client_id")) != user_id and int(chat.get("lawyer_id")) != user_id:
            return {"ok": False, "code": 403, "Message": "Forbidden"}

        return {"ok": True, "chat": chat}

    # -------------------------
    # Create Chat
    # -------------------------
    def create_chat(self, client_id: int, lawyer_id: int):

        if not client_id or not lawyer_id:
            return {"Success": False, "Message": "client_id and lawyer_id are required"}

        chat = Chat.get_or_create(int(client_id), int(lawyer_id))

        if chat and chat.get("_id"):
            chat = dict(chat)
            chat["id"] = str(chat["_id"])
            chat.pop("_id", None)

        return {"Success": True, "Data": chat}

    # -------------------------
    # Delete Chat For Me
    # -------------------------
    def delete_chat_for_me(self, chat_id, user_id: int):

        user_id = int(user_id)

        guard = self.ensure_member(chat_id, user_id)
        if not guard["ok"]:
            return {"Success": False, "Message": guard["Message"], "code": guard["code"]}

        data = Chat.mark_deleted_for_me(chat_id=_oid(chat_id), user_id=user_id)

        return {
            "Success": True,
            "Data": {
                "chat_id": str(_oid(chat_id)),
                **(data or {})
            }
        }
