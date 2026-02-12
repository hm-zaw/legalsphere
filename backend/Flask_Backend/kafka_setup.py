import os
import logging
from confluent_kafka.admin import AdminClient, NewTopic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_kafka_topics():
    """Create Kafka topics using confluent-kafka AdminClient"""
    
    # 1. Load Configuration (Matching your working SSL setup)
    bootstrap_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', '').strip('"')
    security_protocol = os.getenv('KAFKA_SECURITY_PROTOCOL', 'SSL')
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    ca_path = os.path.join(current_dir, 'ca.pem').replace('\\', '/')
    cert_path = os.path.join(current_dir, 'service.cert').replace('\\', '/')
    key_path = os.path.join(current_dir, 'service.key').replace('\\', '/')

    conf = {
        'bootstrap.servers': bootstrap_servers,
        'security.protocol': security_protocol,
        'ssl.ca.location': ca_path,
        'ssl.endpoint.identification.algorithm': 'https',
    }

    # Add mTLS certificates if they exist (Required for Aiven SSL)
    if security_protocol == 'SSL' and os.path.exists(cert_path):
        conf.update({
            'ssl.certificate.location': cert_path,
            'ssl.key.location': key_path,
        })
    # Add SASL if configured
    elif security_protocol == 'SASL_SSL':
        conf.update({
            'sasl.mechanism': os.getenv('KAFKA_SASL_MECHANISM', 'SCRAM-SHA-256'),
            'sasl.username': os.getenv('KAFKA_USERNAME'),
            'sasl.password': os.getenv('KAFKA_PASSWORD'),
        })

    # 2. Initialize AdminClient
    try:
        admin_client = AdminClient(conf)
        
        # 3. Define the topic
        new_topics = [
            NewTopic(
                topic='case-notifications',
                num_partitions=2,
                replication_factor=1,
                config={
                    'retention.ms': '259200000',  # 3 days
                    'cleanup.policy': 'delete'
                }
            )
        ]

        # 4. Execute creation
        logger.info(f"Connecting to Kafka at {bootstrap_servers}...")
        fs = admin_client.create_topics(new_topics)

        # Wait for each operation to finish
        for topic, f in fs.items():
            try:
                f.result()  # The result itself is None on success
                logger.info(f"✅ Topic '{topic}' created successfully")
            except Exception as e:
                if "TOPIC_ALREADY_EXISTS" in str(e):
                    logger.warning(f"⚠️ Topic '{topic}' already exists")
                else:
                    logger.error(f"❌ Failed to create topic '{topic}': {e}")

    except Exception as e:
        logger.error(f"Fatal error during Kafka setup: {e}")

if __name__ == "__main__":
    print("LegalSphere Kafka Setup (Confluent-Kafka Edition)")
    print("=" * 45)
    create_kafka_topics()