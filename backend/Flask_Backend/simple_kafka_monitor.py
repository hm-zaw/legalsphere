#!/usr/bin/env python3
"""
Simple Kafka monitoring script - monitor messages from topics
"""
import sys
import os
import time
import json
from datetime import datetime
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from kafka_config import kafka_service
from confluent_kafka import Consumer, KafkaException

def monitor_messages(topic_name, duration=30):
    """Monitor real-time messages from a specific topic"""
    try:
        conf = kafka_service.config.get_common_config()
        conf['group.id'] = f'monitor-{int(time.time())}'
        conf['auto.offset.reset'] = 'earliest'
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
                            if 'notificationType' in message_data['data']:
                                print(f"   Notification: {message_data['data']['notificationType']}")
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
        print("\n🎛️  === KAFKA MESSAGE MONITOR ===")
        print("1. Monitor case-notifications (rejections, assignments)")
        print("2. Monitor lawyer-assignments (new assignments)")
        print("3. Monitor lawyer-responses (accept/deny)")
        print("4. Monitor case-connections (client-lawyer connections)")
        print("5. Monitor admin-reassignments (admin reassignments)")
        print("0. Exit")
        
        choice = input("\nEnter your choice (0-5): ").strip()
        
        if choice == '0':
            print("👋 Goodbye!")
            break
        elif choice == '1':
            monitor_messages('case-notifications')
        elif choice == '2':
            monitor_messages('lawyer-assignments')
        elif choice == '3':
            monitor_messages('lawyer-responses')
        elif choice == '4':
            monitor_messages('case-connections')
        elif choice == '5':
            monitor_messages('admin-reassignments')
        else:
            print("❌ Invalid choice. Please try again.")

if __name__ == '__main__':
    print("🎛️  Simple Kafka Message Monitor")
    print("=" * 35)
    print("This tool lets you watch Kafka messages in real-time")
    print("Perfect for testing the rejection flow!")
    interactive_menu()
