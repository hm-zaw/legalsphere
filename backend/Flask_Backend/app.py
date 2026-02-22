from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from routes import register_routes
from notification_processor import start_notification_processor, stop_notification_processor
from lawyer_workflow_processors import start_all_processors, stop_all_processors
from config import Config
from sockets.events import register_socket_events
import atexit
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config["SECRET_KEY"] = Config.SECRET_KEY
CORS(app)
register_routes(app)

# SocketIO setup
socketio = SocketIO(
    app,
    cors_allowed_origins=Config.SOCKET_CORS.split(","),
    async_mode="threading",
    logger=True,
    engineio_logger=True,
)
register_socket_events(socketio)
app.extensions["socketio"] = socketio

# Start all processors
start_notification_processor()
start_all_processors()
logger.info("All Kafka processors started on application startup")

# Register cleanup function
atexit.register(lambda: [
    stop_notification_processor(),
    stop_all_processors(),
    logger.info("Application shutting down")
])

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True, use_reloader=False)
