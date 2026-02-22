from flask import Blueprint, request, jsonify, current_app, Response, stream_with_context
from util.auth_jwt import require_auth
from service.chat_service import ChatService
from service.message_service import MessageService
import requests
from db.chats import Chat

chat_bp = Blueprint("chat", __name__)
chat_service = ChatService()
message_service = MessageService()


# ----------------------------
# ✅ CORS helpers (fix preflight)
# ----------------------------
def _corsify(resp):
    origin = request.headers.get("Origin")
    allow_origin = origin if origin in ["http://localhost:9002", "http://127.0.0.1:9002"] else origin

    resp.headers["Access-Control-Allow-Origin"] = allow_origin or "*"
    resp.headers["Vary"] = "Origin"
    resp.headers["Access-Control-Allow-Credentials"] = "true"
    resp.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
    return resp


@chat_bp.after_request
def add_cors_headers(resp):
    return _corsify(resp)


@chat_bp.route("/<path:_path>", methods=["OPTIONS"])
def options_any(_path):
    return _corsify(Response(status=204))


# ----------------------------
# Routes
# ----------------------------
@chat_bp.get("/chats")
@require_auth
def list_chats():
    me = request.user
    res = chat_service.list_chats(me["id"], me["role"])
    return jsonify(res), (200 if res.get("Success") else 400)


@chat_bp.get("/chats/<chat_id>/messages")
@require_auth
def list_messages(chat_id: str):
    """
    ✅ Mongo version:
    - chat_id is ObjectId string
    - respects chat_user_state.cleared_before (delete-for-me)
    """
    me = request.user

    guard = chat_service.ensure_member(chat_id, me["id"])
    if not guard["ok"]:
        return jsonify({"Success": False, "Message": guard["Message"]}), guard["code"]

    # ✅ get cleared_before for this user (Mongo)
    state = Chat.get_user_state(chat_id, me["id"]) or {}
    after_ts = state.get("cleared_before")

    return jsonify(message_service.list_messages(chat_id, after_ts=after_ts)), 200


@chat_bp.post("/chats/<chat_id>/messages")
@require_auth
def send_message(chat_id: str):
    me = request.user

    guard = chat_service.ensure_member(chat_id, me["id"])
    if not guard["ok"]:
        return jsonify({"Success": False, "Message": guard["Message"]}), guard["code"]

    if request.is_json:
        data = request.get_json(silent=True) or {}
        text = data.get("text")
        file = None
    else:
        text = request.form.get("text")
        file = request.files.get("file")

    res = message_service.send_message(chat_id, me["id"], text, file)
    if not res.get("Success"):
        return jsonify(res), 400

    socketio = current_app.extensions.get("socketio")
    if socketio:
        socketio.emit("new_message", res["Data"], room=f"chat:{chat_id}")

    return jsonify(res), 200


@chat_bp.post("/chats")
@require_auth
def create_chat():
    """
    ✅ Create or get existing chat.
    Mongo will return chat id as string.
    """
    me = request.user
    data = request.get_json(silent=True) or {}

    role = me.get("role")
    me_id = int(me.get("id"))

    if role == "client":
        client_id = me_id
        lawyer_id = data.get("lawyer_id")
        if not lawyer_id:
            return jsonify({"Success": False, "Message": "lawyer_id is required"}), 400

    elif role == "lawyer":
        lawyer_id = me_id
        client_id = data.get("client_id")
        if not client_id:
            return jsonify({"Success": False, "Message": "client_id is required"}), 400

    elif role == "admin":
        client_id = data.get("client_id")
        lawyer_id = data.get("lawyer_id")
        if not client_id or not lawyer_id:
            return jsonify({"Success": False, "Message": "client_id and lawyer_id are required"}), 400

    else:
        return jsonify({"Success": False, "Message": "Invalid role"}), 403

    res = chat_service.create_chat(client_id=int(client_id), lawyer_id=int(lawyer_id))
    return jsonify(res), (200 if res.get("Success") else 400)


@chat_bp.post("/messages/<message_id>/read")
@require_auth
def mark_one_message_read(message_id: str):
    me = request.user

    res = message_service.mark_message_read(message_id=message_id, reader_id=me["id"])
    if not res.get("Success"):
        return jsonify(res), res.get("code", 400)

    socketio = current_app.extensions.get("socketio")
    if socketio:
        socketio.emit("message_read", res["Data"], room=f"chat:{res['Data']['chat_id']}")

    return jsonify(res), 200


@chat_bp.route("/messages/<message_id>/edit", methods=["POST", "PATCH"])
@require_auth
def edit_message(message_id: str):
    me = request.user
    data = request.get_json(silent=True) or {}
    new_text = (data.get("text") or "").strip()

    res = message_service.edit_message(message_id=message_id, editor_id=me["id"], new_text=new_text)
    if not res.get("Success"):
        return jsonify(res), res.get("code", 400)

    socketio = current_app.extensions.get("socketio")
    if socketio:
        socketio.emit("message_edited", res["Data"], room=f"chat:{res['Data']['chat_id']}")

    return jsonify(res), 200


@chat_bp.route("/messages/<message_id>/delete", methods=["POST", "DELETE"])
@require_auth
def delete_message(message_id: str):
    me = request.user

    res = message_service.delete_message(message_id=message_id, deleter_id=me["id"])
    if not res.get("Success"):
        return jsonify(res), res.get("code", 400)

    socketio = current_app.extensions.get("socketio")
    if socketio:
        socketio.emit("message_deleted", res["Data"], room=f"chat:{res['Data']['chat_id']}")

    return jsonify(res), 200


@chat_bp.post("/chats/<chat_id>/read")
@require_auth
def mark_chat_read(chat_id: str):
    me = request.user

    guard = chat_service.ensure_member(chat_id, me["id"])
    if not guard["ok"]:
        return jsonify({"Success": False, "Message": guard["Message"]}), guard["code"]

    res = message_service.mark_chat_read(chat_id=chat_id, reader_id=me["id"])
    if not res.get("Success"):
        return jsonify(res), 400

    socketio = current_app.extensions.get("socketio")
    if socketio:
        socketio.emit("chat_read", res["Data"], to=f"chat:{chat_id}")

    return jsonify(res), 200


@chat_bp.get("/messages/<message_id>/attachment")
@require_auth
def download_attachment(message_id: str):
    me = request.user

    msg = message_service.get_message(message_id)
    if not msg:
        return jsonify({"Success": False, "Message": "Message not found"}), 404

    url = msg.get("attachment_url")
    if not url:
        return jsonify({"Success": False, "Message": "No attachment"}), 400

    chat_id = msg["chat_id"]

    guard = chat_service.ensure_member(chat_id, me["id"])
    if not guard["ok"]:
        return jsonify({"Success": False, "Message": guard["Message"]}), guard["code"]

    filename = msg.get("attachment_name") or "attachment"

    r = requests.get(url, stream=True, timeout=30)
    if r.status_code >= 400:
        return jsonify({"Success": False, "Message": "Failed to fetch attachment"}), 502

    content_type = r.headers.get("Content-Type") or "application/octet-stream"

    resp = Response(
        stream_with_context(r.iter_content(chunk_size=1024 * 64)),
        content_type=content_type,
    )
    resp.headers["Content-Disposition"] = f'attachment; filename="{filename}"'
    resp.headers["X-Content-Type-Options"] = "nosniff"
    return resp


@chat_bp.post("/chats/<chat_id>/delete_for_me")
@require_auth
def delete_chat_for_me(chat_id: str):
    me = request.user

    guard = chat_service.ensure_member(chat_id, me["id"])
    if not guard["ok"]:
        return jsonify({"Success": False, "Message": guard["Message"]}), guard["code"]

    res = chat_service.delete_chat_for_me(chat_id, me["id"])
    if not res.get("Success"):
        return jsonify(res), res.get("code", 400)

    return jsonify(res), 200
