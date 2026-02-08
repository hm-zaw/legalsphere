from flask import Flask
from flask_cors import CORS
from routes import register_routes
from notification_processor import start_notification_processor, stop_notification_processor
import atexit
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
register_routes(app)

# Start the notification processor only
start_notification_processor()
logger.info("Notification processor started on application startup")

# Register cleanup function
atexit.register(lambda: [
    stop_notification_processor(),
    logger.info("Application shutting down")
])

if __name__ == "__main__":
    app.run(debug=True)
