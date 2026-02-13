#!/usr/bin/env python3
"""
Enhanced Kafka monitoring script - check topics, partitions, and real-time messages
"""
import sys
import os
import time
import json
from datetime import datetime
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from kafka_config import kafka_service
from confluent_kafka import KafkaException, Consumer, AdminClient

def create_missing_topics():
    """Create missing Kafka topics using existing configuration"""
    try:
        # Get producer config (same as consumer config)
        conf = kafka_service.config.get_common_config()
        
        # Create admin client manually
        from confluent_kafka import AdminClient
        admin_client = AdminClient(conf)
        
        # Topics to create
        topics_to_create = [
            'case-notifications',
            'lawyer-assignments', 
            'lawyer-responses',
            'case-connections',
            'admin-reassignments'
        ]
        
        print("🔍 Checking existing topics...")
        
        # Check existing topics
        try:
            metadata = admin_client.list_topics(timeout=10)
            existing_topics = [topic.topic for topic in metadata.topics]
            print(f"✅ Found existing topics: {existing_topics}")
        except Exception as e:
            print(f"⚠️  Could not list topics: {e}")
            existing_topics = []
        
        # Create missing topics
        for topic_name in topics_to_create:
            if topic_name not in existing_topics:
                try:
                    print(f"🔧 Creating topic: {topic_name}")
                    future = admin_client.create_topics([{
                        'topic': topic_name,
                        'num_partitions': 3,
                        'replication_factor': 2
                    }])
                    
                    # Wait for result
                    for topic, future in future.items():
                        try:
                            future.result(timeout=30)
                            print(f"✅ Topic '{topic_name}' created successfully")
                        except Exception as e:
                            print(f"❌ Failed to create topic '{topic_name}': {e}")
                            
                except Exception as e:
                    print(f"❌ Error creating topic '{topic_name}': {e}")
            else:
                print(f"✅ Topic '{topic_name}' already exists")
        
        print("🎉 Topic creation completed!")
        
    except Exception as e:
        print(f"💥 Fatal error: {e}")
        return 1
    
    return 0

def show_topic_status():
    """Display detailed topic status and partition info"""
    try:
        conf = kafka_service.config.get_common_config()
        admin_client = AdminClient(conf)
        
        print("\n📊 === KAFKA TOPIC STATUS ===")
        metadata = admin_client.list_topics(timeout=10)
        
        for topic_name in sorted(metadata.topics.keys()):
            topic = metadata.topics[topic_name]
            print(f"\n🔸 Topic: {topic_name}")
            
            # Get partition details
            try:
                cluster_metadata = admin_client.list_topics(topic=topic_name, timeout=10)
                for partition_id, partition in cluster_metadata.topics[topic_name].partitions.items():
                    leader = partition.leader
                    replicas = partition.replicas
                    isr = partition.isr
                    print(f"   ├─ Partition {partition_id}: Leader={leader}, Replicas={replicas}, ISR={isr}")
            except Exception as e:
                print(f"   ├─ Could not get partition details: {e}")
        
        print("\n" + "="*50)
        
    except Exception as e:
        print(f"❌ Error getting topic status: {e}")

def monitor_messages(topic_name, duration=30):
    """Monitor real-time messages from a specific topic"""
    try:
        conf = kafka_service.config.get_common_config()
        conf['group.id'] = f'monitor-{int(time.time())}'
        conf['auto.offset.reset'] = 'latest'
        conf['enable.auto.commit'] = False
        
        consumer = Consumer(conf)
        consumer.subscribe([topic_name])
        
        print(f"\n🔍 Monitoring messages from '{topic_name}' for {duration} seconds...")
        print("Press Ctrl+C to stop early\n")
        
        start_time = time.time()
        message_count = 0
        
        try:
            while time.time() - start_time < duration:
                msg = consumer.poll(1.0)
                
                if msg is None:
                    continue
                
                if msg.error():
                    print(f"⚠️  Consumer error: {msg.error()}")
                    continue
                
                message_count += 1
                timestamp = datetime.fromtimestamp(msg.timestamp()[1]/1000).strftime('%H:%M:%S')
                
                try:
                    message_data = json.loads(msg.value().decode('utf-8'))
                    print(f"[{timestamp}] 📨 Message #{message_count} (Partition {msg.partition()}, Offset {msg.offset()})")
                    print(f"   Key: {msg.key().decode('utf-8') if msg.key() else 'None'}")
                    
                    # Pretty print the message data
                    if isinstance(message_data, dict):
                        if 'data' in message_data:
                            print(f"   Type: {message_data.get('event_type', 'unknown')}")
                            print(f"   Client: {message_data['data'].get('clientId', 'unknown')}")
                            print(f"   Case: {message_data['data'].get('caseId', 'unknown')}")
                        else:
                            print(f"   Data: {json.dumps(message_data, indent=6)}")
                    else:
                        print(f"   Content: {message_data}")
                    print()
                    
                except (json.JSONDecodeError, UnicodeDecodeError) as e:
                    print(f"[{timestamp}] 📨 Raw message: {msg.value()}")
                    print()
                
        except KeyboardInterrupt:
            print("\n⏹️  Monitoring stopped by user")
        
        consumer.close()
        print(f"✅ Monitoring complete. Received {message_count} messages.")
        
    except Exception as e:
        print(f"❌ Error monitoring messages: {e}")

def interactive_menu():
    """Interactive menu for Kafka monitoring"""
    while True:
        print("\n🎛️  === KAFKA MONITORING MENU ===")
        print("1. Show topic status")
        print("2. Monitor case-notifications topic")
        print("3. Monitor lawyer-assignments topic") 
        print("4. Monitor lawyer-responses topic")
        print("5. Monitor case-connections topic")
        print("6. Monitor admin-reassignments topic")
        print("7. Create missing topics")
        print("0. Exit")
        
        choice = input("\nEnter your choice (0-7): ").strip()
        
        if choice == '0':
            print("👋 Goodbye!")
            break
        elif choice == '1':
            show_topic_status()
        elif choice == '2':
            monitor_messages('case-notifications')
        elif choice == '3':
            monitor_messages('lawyer-assignments')
        elif choice == '4':
            monitor_messages('lawyer-responses')
        elif choice == '5':
            monitor_messages('case-connections')
        elif choice == '6':
            monitor_messages('admin-reassignments')
        elif choice == '7':
            create_missing_topics()
        else:
            print("❌ Invalid choice. Please try again.")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--create-topics':
        print("🚀 Creating missing Kafka topics...")
        exit_code = create_missing_topics()
        sys.exit(exit_code)
    else:
        print("🎛️  Kafka Monitoring Tool")
        print("=" * 30)
        interactive_menu()
