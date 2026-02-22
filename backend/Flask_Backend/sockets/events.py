
from __future__ import annotations

from flask import request, session as sio_session
from flask_socketio import join_room, disconnect, emit
from bson import ObjectId

from util.auth_jwt import decode_token
from db.chats import Chat


def _oid(v) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    return ObjectId(str(v))


def register_socket_events(socketio):

    @socketio.on("connect")
    def on_connect(auth):
        """
        Client must connect with:
          io(SOCKET_BASE, { auth: { token } })
        """
        token = (auth or {}).get("token") if isinstance(auth, dict) else None
        if not token:
            print("❌ connect: no token")
            return False  # refuse connection cleanly

        try:
            claims = decode_token(token)

            # adjust key based on your JWT payload
            user_id = claims.get("user_id") or claims.get("id") or claims.get("sub")
            user_id = int(user_id)

            sio_session["user_id"] = user_id

            print("✅ socket connected user:", user_id, "sid:", request.sid)
            emit("connected", {"Success": True, "sid": request.sid})
            return True
        except Exception as e:
            print("❌ connect invalid token:", e)
            return False

    @socketio.on("join_chat")
    def on_join_chat(data):
        """
        Client emits:
          socket.emit("join_chat", { chat_id: "<mongo_object_id>" })
        """
        raw_chat_id = (data or {}).get("chat_id")
        if not raw_chat_id:
            print("❌ join_chat missing chat_id")
            return

        user_id = sio_session.get("user_id")
        if not user_id:
            print("❌ join_chat: no user_id in session")
            disconnect()
            return

        # chat_id is Mongo ObjectId string
        try:
            chat_oid = _oid(raw_chat_id)
        except Exception:
            print("❌ join_chat invalid chat_id:", raw_chat_id)
            return

        chat = Chat.get_by_id(chat_oid)
        if not chat:
            print("❌ join_chat: chat not found", raw_chat_id)
            return

        try:
            client_id = int(chat.get("client_id"))
            lawyer_id = int(chat.get("lawyer_id"))
        except Exception:
            print("❌ join_chat: chat missing client_id/lawyer_id")
            disconnect()
            return

        if client_id != int(user_id) and lawyer_id != int(user_id):
            print("❌ join_chat: forbidden user", user_id, "chat", raw_chat_id)
            disconnect()
            return

        room = f"chat:{str(chat_oid)}"
        join_room(room)

        print(f"✅ user {user_id} joined {room} sid={request.sid}")
        emit("joined_chat", {"chat_id": str(chat_oid), "room": room})

    @socketio.on("disconnect")
    def on_disconnect():
        print("⚠️ SOCKET DISCONNECTED", request.sid)
