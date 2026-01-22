from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

class MongoDBClient:
    """MongoDB client for database operations"""
    
    def __init__(self):
        self.mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/legal_sphere')
        self.client = None
        self.db = None
        
    def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(self.mongo_uri)
            # Test the connection
            self.client.admin.command('ping')
            self.db = self.client.get_database()
            logger.info("Connected to MongoDB successfully")
            return True
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error connecting to MongoDB: {e}")
            return False
    
    def get_database(self):
        """Get database instance"""
        if self.db is None:
            if not self.connect():
                raise Exception("Failed to connect to database")
        return self.db
    
    def get_collection(self, collection_name):
        """Get collection instance"""
        db = self.get_database()
        return db[collection_name]
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

# Global MongoDB client instance
mongodb_client = MongoDBClient()

def get_db():
    """Get database instance"""
    return mongodb_client.get_database()

def get_db_collection(collection_name):
    """Get collection instance"""
    return mongodb_client.get_collection(collection_name)
