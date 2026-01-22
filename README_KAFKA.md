# Kafka Integration for LegalSphere

This document explains the Kafka integration implemented for the LegalSphere distributed programming project.

## Architecture Overview

The Kafka integration transforms the case submission process from a synchronous to an asynchronous, distributed system:

```
Frontend (Next.js) → Flask API → Kafka Producer → "case-submissions" topic
                                                     ↓
                                            Background Consumer → MongoDB + AI Analysis
                                                     ↓
                                            "case-notifications" topic → Notification Service
```

## Benefits of Kafka Integration

1. **Decoupling**: Case submission is independent from processing
2. **Scalability**: Handle submission spikes without blocking users
3. **Reliability**: Messages persist even if processing fails
4. **Async Processing**: Lawyer matching and AI analysis happen in background
5. **Load Distribution**: Multiple consumers can process cases in parallel

## Setup Instructions

### 1. Start Kafka and MongoDB

```bash
# Start the infrastructure services
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 2. Setup Kafka Topics

```bash
cd backend/Flask_Backend

# Create environment file
cp .env.example .env

# Run Kafka setup script
python kafka_setup.py
```

### 3. Start the Flask Backend

```bash
cd backend/Flask_Backend

# Install dependencies (if not already done)
pip install -r requirements.txt

# Start the Flask application
python app.py
```

### 4. Start the Frontend

```bash
cd legal_sphere

# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

## Kafka Topics

### case-submissions
- **Purpose**: Receives new case submissions from the frontend
- **Partitions**: 3 (for parallel processing)
- **Retention**: 7 days
- **Message Format**:
```json
{
  "event_type": "case_submission",
  "timestamp": "2024-01-20T10:30:00Z",
  "data": {
    "id": "uuid",
    "client": {...},
    "case": {...},
    "documents": [...],
    "status": "pending_submission"
  }
}
```

### case-notifications
- **Purpose**: Sends notifications about case status updates
- **Partitions**: 2
- **Retention**: 3 days
- **Message Format**:
```json
{
  "event_type": "case_notification",
  "timestamp": "2024-01-20T10:35:00Z",
  "data": {
    "user_id": "client@example.com",
    "case_id": "uuid",
    "type": "case_submitted",
    "case_title": "Legal Case Title"
  }
}
```

## Environment Variables

Create a `.env` file in `backend/Flask_Backend/` with:

```env
# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_CASE_SUBMISSIONS_TOPIC=case-submissions
KAFKA_CASE_NOTIFICATIONS_TOPIC=case-notifications
KAFKA_CONSUMER_GROUP_ID=case-processors

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/legal_sphere

# Hugging Face Configuration (Optional)
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
HF_MODEL_ID=bachminion/vi-legal-bert-finetuned
```

## Monitoring

### Kafka UI
Access the Kafka UI at http://localhost:8080 to:
- Monitor topics and messages
- View consumer groups
- Track message throughput

### Logs
Monitor the Flask application logs to see:
- Kafka message production
- Case processing status
- Error handling

## Testing the Integration

1. **Submit a Case**: Use the frontend to submit a new case
2. **Check Kafka UI**: Verify messages appear in `case-submissions` topic
3. **Monitor Logs**: Watch the Flask logs for processing messages
4. **Check MongoDB**: Verify cases are stored after processing

## File Structure

```
backend/Flask_Backend/
├── kafka_config.py          # Kafka producer/consumer configuration
├── case_processor.py        # Background case processing worker
├── routes/
│   └── case_requests.py     # API routes with Kafka integration
├── mongodb_client.py        # MongoDB connection management
├── kafka_setup.py          # Kafka topic setup script
└── .env.example            # Environment variables template

legal_sphere/app/api/
└── case-requests/
    └── route.js            # Frontend API route (unchanged)
```

## Error Handling

The system includes comprehensive error handling:

1. **Kafka Failures**: Falls back to direct MongoDB storage
2. **Processing Failures**: Updates case status with error details
3. **Connection Issues**: Automatic retry with exponential backoff
4. **Message Validation**: Validates message format before processing

## Scaling the System

To scale the system:

1. **Multiple Consumers**: Run multiple instances of the case processor
2. **Increase Partitions**: Add more partitions to topics for parallel processing
3. **Consumer Groups**: Use different consumer groups for different processing stages

## Troubleshooting

### Kafka Connection Issues
- Verify Kafka is running: `docker-compose ps`
- Check bootstrap servers configuration
- Ensure network connectivity

### Message Processing Issues
- Check Flask application logs
- Verify consumer group offsets
- Monitor topic lag in Kafka UI

### MongoDB Connection Issues
- Verify MongoDB is running
- Check connection string
- Ensure database permissions

## Next Steps

Potential enhancements:

1. **Dead Letter Queue**: Handle failed messages
2. **Message Schema**: Use Avro/Protobuf for message serialization
3. **Monitoring**: Add Prometheus metrics
4. **Tracing**: Implement distributed tracing
5. **Additional Topics**: Add more event types for different workflows
