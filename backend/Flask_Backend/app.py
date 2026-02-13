from flask import Flask
from flask_cors import CORS
from routes import register_routes
from notification_processor import start_notification_processor, stop_notification_processor
from lawyer_workflow_processors import start_all_processors, stop_all_processors
import atexit
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
register_routes(app)

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
    app.run(debug=True)
