from flask import Flask
from flask_cors import CORS
from routes import register_routes
from case_processor import start_case_processor
import atexit
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
register_routes(app)

# Start the case processor
start_case_processor()
logger.info("Case processor started on application startup")

# Register cleanup function
atexit.register(lambda: logger.info("Application shutting down"))

if __name__ == "__main__":
    app.run(debug=True)
