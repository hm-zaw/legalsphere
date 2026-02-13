#!/usr/bin/env python3
"""
Script to create Kafka topics in Aiven
"""
from confluent_kafka import AdminClient
import os
from dotenv import load_dotenv

load_dotenv()

def create_topics():
    """Create all required Kafka topics"""
    
    # Kafka configuration
    conf = {
        'bootstrap.servers': os.getenv('KAFKA_BOOTSTRAP_SERVERS'),
        'security.protocol': os.getenv('KAFKA_SECURITY_PROTOCOL', 'SSL'),
        'ssl.ca.location': 'ca.pem',
        'ssl.certificate.location': 'service.cert',
        'ssl.key.location': 'service.key',
        'ssl.endpoint.identification.algorithm': 'https',
    }
    
    # Add SASL if using SASL_SSL
    if os.getenv('KAFKA_SECURITY_PROTOCOL') == 'SASL_SSL':
        conf.update({
            'sasl.mechanisms': os.getenv('KAFKA_SASL_MECHANISM', 'SCRAM-SHA-256'),
            'sasl.username': os.getenv('KAFKA_USERNAME'),
            'sasl.password': os.getenv('KAFKA_PASSWORD'),
        })
    
    admin_client = AdminClient(conf)
    
    # Topics to create
    topics = [
        'case-notifications',
        'lawyer-assignments', 
        'lawyer-responses',
        'case-connections',
        'admin-reassignments'
    ]
    
    # Create topics
    for topic_name in topics:
        try:
            # Check if topic exists
            metadata = admin_client.list_topics(timeout=10)
            if topic_name in metadata.topics:
                print(f"✅ Topic '{topic_name}' already exists")
                continue
            
            # Create new topic
            new_topic = admin_client.create_topics([{
                'topic': topic_name,
                'num_partitions': 3,
                'replication_factor': 2,
                'config': {
                    'retention.ms': '604800000',  # 7 days
                    'cleanup.policy': 'delete'
                }
            }])
            
            # Wait for creation
            for topic, future in new_topic.items():
                try:
                    future.result(timeout=30)
                    print(f"✅ Topic '{topic}' created successfully")
                except Exception as e:
                    print(f"❌ Failed to create topic '{topic}': {e}")
                    
        except Exception as e:
            print(f"❌ Error with topic '{topic_name}': {e}")

if __name__ == '__main__':
    print("🚀 Creating Kafka topics in Aiven...")
    create_topics()
    print("✅ Topic creation completed!")
