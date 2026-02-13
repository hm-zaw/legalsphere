#!/usr/bin/env python3
"""
Create Kafka topics with correct Aiven configuration (2 partitions max)
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from kafka_config import kafka_service
from confluent_kafka import KafkaException
import json

def create_missing_topics():
    """Create missing Kafka topics using AdminClient API with Aiven limits"""
    try:
        # Get producer config (same as consumer config)
        conf = kafka_service.config.get_common_config()
        
        # Create admin client
        from confluent_kafka.admin import AdminClient, NewTopic
        admin_client = AdminClient(conf)
        print("✅ AdminClient created successfully")
        
        # Topics to create with Aiven-compatible settings
        topics_to_create = [
            'lawyer-assignments', 
            'lawyer-responses',
            'case-connections',
            'admin-reassignments'
        ]
        
        print("🔍 Checking existing topics...")
        
        # Check existing topics
        try:
            metadata = admin_client.list_topics(timeout=10)
            existing_topics = list(metadata.topics.keys())
            print(f"✅ Found existing topics: {existing_topics}")
        except Exception as e:
            print(f"⚠️  Could not list topics: {e}")
            existing_topics = []
        
        # Create missing topics with Aiven-compatible settings
        created_count = 0
        for topic_name in topics_to_create:
            if topic_name not in existing_topics:
                try:
                    print(f"🔧 Creating topic: {topic_name}")
                    
                    # Create topic with Aiven limits (2 partitions max, 1 replication factor)
                    new_topic = NewTopic(
                        topic=topic_name,
                        num_partitions=2,  # Aiven limit: max 2 partitions
                        replication_factor=1  # Aiven standard
                    )
                    
                    # Create topic
                    future_dict = admin_client.create_topics([new_topic])
                    
                    # Wait for result
                    for topic, future in future_dict.items():
                        try:
                            result = future.result(timeout=30)
                            print(f"✅ Topic '{topic_name}' created successfully")
                            created_count += 1
                        except Exception as e:
                            print(f"❌ Failed to create topic '{topic_name}': {e}")
                            
                except Exception as e:
                    print(f"❌ Error creating topic '{topic_name}': {e}")
            else:
                print(f"✅ Topic '{topic_name}' already exists")
        
        # Verify final state
        print("\n🔍 Verifying final topic list...")
        try:
            metadata = admin_client.list_topics(timeout=10)
            final_topics = list(metadata.topics.keys())
            print(f"✅ Final topics: {final_topics}")
            print(f"📊 Created {created_count} new topics")
            
            # Show topic details
            for topic_name in final_topics:
                if topic_name != '__consumer_offsets':
                    try:
                        topic_metadata = metadata.topics[topic_name]
                        partitions = list(topic_metadata.partitions.keys())
                        print(f"   📋 {topic_name}: {len(partitions)} partitions")
                    except:
                        print(f"   📋 {topic_name}: (partition info unavailable)")
                        
        except Exception as e:
            print(f"⚠️  Could not verify final topics: {e}")
        
        print("🎉 Topic creation completed!")
        return 0
        
    except Exception as e:
        print(f"💥 Fatal error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    print("🚀 Creating missing Kafka topics...")
    exit_code = create_missing_topics()
    sys.exit(exit_code)
