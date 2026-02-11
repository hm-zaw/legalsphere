#!/usr/bin/env python3
"""
Kafka setup script for LegalSphere
This script creates the necessary Kafka topics for the application
"""

import os
import sys
import logging
import ssl
from kafka import KafkaAdminClient
from kafka.admin import NewTopic
from kafka.errors import TopicAlreadyExistsError, KafkaError

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Try to load .env from project root
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    env_path = os.path.join(project_root, '..', '.env')
    load_dotenv(env_path)
    print(f"Loading .env from: {env_path}")
except ImportError:
    print("Warning: python-dotenv not installed. Install with: pip install python-dotenv")
    print("Attempting to use system environment variables...")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_kafka_topics():
    """Create Kafka topics for LegalSphere"""
    
    # Configuration
    bootstrap_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
    security_protocol = os.getenv('KAFKA_SECURITY_PROTOCOL', 'PLAINTEXT')
    sasl_mechanism = os.getenv('KAFKA_SASL_MECHANISM', 'PLAIN')
    sasl_username = os.getenv('KAFKA_USERNAME')
    sasl_password = os.getenv('KAFKA_PASSWORD')
    
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
        # Admin client configuration
        admin_config = {
            'bootstrap_servers': bootstrap_servers,
            'client_id': 'legal_sphere_setup'
        }
        
        # Add security configuration for cloud Kafka
        if security_protocol != 'PLAINTEXT':
            admin_config['security_protocol'] = security_protocol
            admin_config['sasl_mechanism'] = sasl_mechanism
            admin_config['sasl_plain_username'] = sasl_username
            admin_config['sasl_plain_password'] = sasl_password
            
            # Add SSL configuration for SASL_SSL
            if security_protocol == 'SASL_SSL':
                admin_config['ssl_check_hostname'] = False  # Disable hostname check for Aiven
                admin_config['ssl_cafile'] = None
                admin_config['ssl_certfile'] = None
                admin_config['ssl_keyfile'] = None
                # Create unverified SSL context for development
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                admin_config['ssl_context'] = ssl_context
                # Also disable SSL verification at protocol level
                admin_config['security_protocol'] = 'SASL_PLAINTEXT'  # Bypass SSL for development
        
        # Create admin client
        admin_client = KafkaAdminClient(**admin_config)
        
        logger.info(f"Connecting to Kafka at {bootstrap_servers}")
        if security_protocol != 'PLAINTEXT':
            logger.info(f"Using security protocol: {security_protocol}")
        
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
        security_protocol = os.getenv('KAFKA_SECURITY_PROTOCOL', 'PLAINTEXT')
        sasl_mechanism = os.getenv('KAFKA_SASL_MECHANISM', 'PLAIN')
        sasl_username = os.getenv('KAFKA_USERNAME')
        sasl_password = os.getenv('KAFKA_PASSWORD')
        
        # Admin client configuration
        admin_config = {
            'bootstrap_servers': bootstrap_servers,
            'client_id': 'legal_sphere_check',
            'request_timeout_ms': 5000
        }
        
        # Add security configuration for cloud Kafka
        if security_protocol != 'PLAINTEXT':
            admin_config['security_protocol'] = security_protocol
            admin_config['sasl_mechanism'] = sasl_mechanism
            admin_config['sasl_plain_username'] = sasl_username
            admin_config['sasl_plain_password'] = sasl_password
            
            # Add SSL configuration for SASL_SSL
            if security_protocol == 'SASL_SSL':
                admin_config['ssl_check_hostname'] = False  # Disable hostname check for Aiven
                admin_config['ssl_cafile'] = None
                admin_config['ssl_certfile'] = None
                admin_config['ssl_keyfile'] = None
                # Create unverified SSL context for development
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                admin_config['ssl_context'] = ssl_context
                # Also disable SSL verification at protocol level
                admin_config['security_protocol'] = 'SASL_PLAINTEXT'  # Bypass SSL for development
        
        admin_client = KafkaAdminClient(**admin_config)
        
        # Try to list topics to verify connection
        topics = admin_client.list_topics()
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
        print("   1. Kafka is running (for local development)")
        print("   2. Or cloud Kafka credentials are set in .env")
        print("   3. KAFKA_BOOTSTRAP_SERVERS is correctly set")
        print("   4. Network connectivity to Kafka server")
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
