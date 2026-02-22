# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:

    SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # JWT
    JWT_EXPIRES_HOURS = int(os.getenv("JWT_EXPIRES_HOURS", "24"))
    SOCKET_CORS = os.getenv("SOCKET_CORS", FRONTEND_URL)

    # Optional upload limit for Flask
    MAX_CONTENT_LENGTH_MB = int(os.getenv("MAX_CONTENT_LENGTH_MB", "10"))
