#!/usr/bin/env python3
"""
Kafka setup script for LegalSphere
This script creates the necessary Kafka topics for the application
"""

import os
import sys
import logging
from kafka import KafkaAdminClient
from kafka.admin import NewTopic
from kafka.errors import TopicAlreadyExistsError, KafkaError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_kafka_topics():
    """Create Kafka topics for LegalSphere"""
    
    # Configuration
    bootstrap_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
    
    # Topics to create
    topics = [
        NewTopic(
            name='case-notifications',
            num_partitions=2,
            replication_factor=1,
            topic_configs={
                'retention.ms': '259200000',  # 3 days
                'cleanup.policy': 'delete'
            }
        )
    ]
    
    try:
        # Create admin client
        admin_client = KafkaAdminClient(
            bootstrap_servers=bootstrap_servers,
            client_id='legal_sphere_setup'
        )
        
        logger.info(f"Connecting to Kafka at {bootstrap_servers}")
        
        # Create topics
        fs = admin_client.create_topics(topics, validate_only=False)
        
        for topic, f in fs.items():
            try:
                f.result()  # The result itself is a TopicMetadata object
                logger.info(f"Topic '{topic}' created successfully")
            except TopicAlreadyExistsError:
                logger.warning(f"Topic '{topic}' already exists")
            except Exception as e:
                logger.error(f"Failed to create topic '{topic}': {e}")
        
        logger.info("Kafka setup completed")
        
    except KafkaError as e:
        logger.error(f"Failed to connect to Kafka: {e}")
        logger.error("Make sure Kafka is running and accessible")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False
    finally:
        if 'admin_client' in locals():
            admin_client.close()
    
    return True

def check_kafka_connection():
    """Check if Kafka is accessible"""
    try:
        bootstrap_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
        admin_client = KafkaAdminClient(
            bootstrap_servers=bootstrap_servers,
            client_id='legal_sphere_check',
            request_timeout_ms=5000
        )
        
        # Try to list topics to verify connection
        topics = admin_client.list_topics()
        logger.info(f"Kafka connection successful. Existing topics: {topics}")
        admin_client.close()
        return True
        
    except Exception as e:
        logger.error(f"Cannot connect to Kafka: {e}")
        return False

if __name__ == "__main__":
    print("LegalSphere Kafka Setup")
    print("=" * 40)
    
    # Check Kafka connection first
    if not check_kafka_connection():
        print("\n❌ Kafka is not accessible. Please ensure:")
        print("   1. Kafka is running (use docker-compose up -d)")
        print("   2. KAFKA_BOOTSTRAP_SERVERS is correctly set")
        print("   3. Network connectivity to Kafka server")
        sys.exit(1)
    
    print("\n✅ Kafka connection successful")
    
    # Create topics
    if create_kafka_topics():
        print("\n✅ Kafka setup completed successfully!")
        print("\nNext steps:")
        print("   1. Start the Flask backend: python app.py")
        print("   2. Submit a case through the frontend")
        print("   3. Check logs for Kafka message processing")
    else:
        print("\n❌ Kafka setup failed!")
        sys.exit(1)
