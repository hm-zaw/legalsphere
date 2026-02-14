# LegalSphere System Documentation

## Overview
LegalSphere is a distributed legal management platform designed for modern law organizations, featuring secure document workflows, intelligent case classification, and AI-powered lawyer matching.

## Architecture Overview

### System Components

#### 1. Frontend (Next.js 16 + React 19 + TypeScript)
- **Location**: `legal_sphere/` directory
- **Technology Stack**: Next.js 16, React 19, TypeScript, TailwindCSS, shadcn/ui
- **Key Features**:
  - Client dashboard for case submission and tracking
  - Admin dashboard for case and user management
  - Lawyer dashboard with case management tools
  - Real-time notifications and updates
  - Responsive design with modern UI components

#### 2. Backend (Flask + Python)
- **Location**: `backend/Flask_Backend/` directory
- **Technology Stack**: Flask, Python, Kafka, MongoDB
- **Key Components**:
  - RESTful API endpoints
  - Kafka message processing
  - MongoDB data persistence
  - AI model integration
  - Authentication and authorization

#### 3. Message Queue (Apache Kafka)
- **Provider**: Aiven Cloud (or local Docker setup)
- **Topics**:
  - `case-notifications`: General case status updates
  - `lawyer-assignments`: Lawyer assignment notifications
  - `lawyer-responses`: Lawyer accept/reject responses
  - `case-connections`: Case connection establishment
  - `admin-reassignments`: Admin reassignment notifications

#### 4. Database (MongoDB Atlas)
- **Provider**: MongoDB Atlas Cloud
- **Collections**:
  - `case_requests`: Case data and metadata
  - `notifications`: User notifications
  - `lawyer_notifications`: Lawyer-specific notifications
  - `admin_notifications`: Admin notifications
  - `users`: User accounts and profiles

## Core Workflows

### 1. Case Submission Workflow

```
Client (Frontend) → API Endpoint → MongoDB Storage → Kafka Message → Background Processors
```

**Detailed Flow**:
1. **Client submits case** via Next.js frontend form
2. **API receives request** at `/api/case-requests` (POST)
3. **Case stored in MongoDB** with initial status `pending_submission`
4. **Kafka message published** to relevant topics for async processing
5. **Background processors** handle AI analysis and lawyer matching

### 2. AI-Powered Case Classification

**Model**: DeBERTa-v3-large-zeroshot-v2.0 (HuggingFace)
**Purpose**: Automatic case categorization and lawyer matching

**Process**:
1. Case text extracted from submission
2. AI model analyzes content for legal categories
3. Classification results stored with case data
4. Lawyer matching algorithm assigns suitable lawyers

### 3. Lawyer Assignment Workflow

```
Admin Assignment → Kafka Notification → Lawyer Dashboard → Lawyer Response → Status Update
```

**Steps**:
1. **Admin assigns lawyer** via admin dashboard
2. **Kafka message** sent to `lawyer-assignments` topic
3. **Lawyer receives notification** in dashboard
4. **Lawyer accepts/rejects** assignment
5. **Response published** to `lawyer-responses` topic
6. **Status updated** in MongoDB and notifications sent

### 4. Notification System

**Multi-channel notifications**:
- **Client notifications**: Case status updates, lawyer assignments
- **Lawyer notifications**: New case assignments, client responses
- **Admin notifications**: Lawyer responses, reassignment requests

**Implementation**:
- Kafka-based async messaging
- MongoDB notification storage
- Real-time frontend updates via polling

## Data Models

### Case Request Structure
```json
{
  "id": "uuid",
  "client": {
    "name": "Client Name",
    "email": "client@example.com",
    "phone": "phone_number"
  },
  "case": {
    "title": "Case Title",
    "description": "Case Description",
    "category": "Legal Category",
    "urgency": "Normal/High/Urgent",
    "incidentDate": "YYYY-MM-DD"
  },
  "status": "pending_submission|pending_admin_review|lawyer_assigned|active|completed|rejected",
  "assignedLawyer": {
    "id": "lawyer_id",
    "name": "Lawyer Name",
    "assignedAt": "timestamp"
  },
  "documents": [],
  "predictions": [],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### User Structure
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "client|lawyer|admin",
  "profile": {
    "specializations": [],
    "experience": "years",
    "availability": true/false
  }
}
```

## API Endpoints

### Case Management
- `POST /api/case-requests` - Submit new case
- `GET /api/case-requests/<case_id>` - Get case details
- `GET /api/case-requests` - List cases (with pagination)
- `GET /api/my-cases` - Get user's cases (authenticated)

### Lawyer Management
- `GET /api/lawyer/cases` - Get lawyer's assigned cases
- `POST /api/lawyer/respond` - Accept/reject case assignment

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/<id>/read` - Mark notification as read

## Background Processors

### 1. Notification Processor
- **File**: `notification_processor.py`
- **Topic**: `case-notifications`
- **Purpose**: Process general case notifications and update MongoDB

### 2. Lawyer Assignment Processor
- **File**: `lawyer_workflow_processors.py`
- **Topic**: `lawyer-assignments`
- **Purpose**: Handle lawyer assignment notifications

### 3. Lawyer Response Processor
- **File**: `lawyer_workflow_processors.py`
- **Topic**: `lawyer-responses`
- **Purpose**: Process lawyer accept/reject responses

### 4. Case Connection Processor
- **File**: `lawyer_workflow_processors.py`
- **Topic**: `case-connections`
- **Purpose**: Handle successful lawyer-client connections

### 5. Admin Reassignment Processor
- **File**: `lawyer_workflow_processors.py`
- **Topic**: `admin-reassignments`
- **Purpose**: Process lawyer rejection and reassignment requests

## Security & Authentication

### JWT-based Authentication
- **Token-based** authentication for API access
- **Role-based** access control (client/lawyer/admin)
- **Middleware** decorators for protected routes

### Data Security
- **MongoDB Atlas** with encryption at rest
- **Kafka SSL/TLS** encryption for message transport
- **Environment variables** for sensitive configuration

## AI Integration

### HuggingFace Model Integration
- **Model**: DeBERTa-v3-large-zeroshot-v2.0
- **Purpose**: Zero-shot classification of legal cases
- **API**: HuggingFace Inference API
- **Processing**: Automated categorization on case submission

### Lawyer Matching Algorithm
- **Specialization matching** based on AI classification
- **Availability filtering** for active lawyers
- **Workload balancing** for fair distribution

## Deployment Architecture

### Cloud-Native Setup
- **Frontend**: Vercel/Netlify deployment
- **Backend**: Heroku/AWS deployment
- **Database**: MongoDB Atlas (cloud-hosted)
- **Message Queue**: Aiven Kafka (cloud-hosted)

### Environment Configuration
```env
# Database
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/legal_sphere"

# Kafka
KAFKA_BOOTSTRAP_SERVERS="kafka-service.aivencloud.com:25368"
KAFKA_USERNAME="avnadmin"
KAFKA_PASSWORD="password"
KAFKA_SECURITY_PROTOCOL="SASL_SSL"

# AI/ML
HF_TOKEN="huggingface_api_token"
HF_MODEL_ID="MoritzLaurer/deberta-v3-large-zeroshot-v2.0"

# Authentication
JWT_SECRET_KEY="jwt_secret_key"
```

## Monitoring & Logging

### Application Logging
- **Structured logging** with Python logging module
- **Kafka message logging** for debugging
- **Error tracking** with detailed stack traces

### Performance Monitoring
- **MongoDB query performance** tracking
- **Kafka consumer lag** monitoring
- **API response time** measurement

## Scalability Considerations

### Horizontal Scaling
- **Stateless API** design for multiple instances
- **Kafka partitioning** for message distribution
- **MongoDB sharding** for data distribution

### Performance Optimization
- **Database indexing** on frequently queried fields
- **Kafka consumer groups** for parallel processing
- **Frontend caching** for static assets

## Development Workflow

### Local Development
1. **Clone repository** and install dependencies
2. **Set up environment variables** with cloud service credentials
3. **Run backend** (`python app.py`)
4. **Run frontend** (`npm run dev`)
5. **Access applications** at localhost:3000 (frontend) and localhost:5000 (backend)

### Testing
- **Unit tests** for backend logic
- **Integration tests** for API endpoints
- **AI model testing** with sample data
- **End-to-end tests** for complete workflows

## Future Enhancements

### Planned Features
- **Video consultation** integration
- **Document signing** with digital signatures
- **Payment processing** integration
- **Mobile applications** (iOS/Android)
- **Advanced analytics** and reporting

### Technical Improvements
- **GraphQL API** for efficient data fetching
- **WebSocket integration** for real-time updates
- **Microservices architecture** decomposition
- **Advanced AI models** for legal research

## Troubleshooting

### Common Issues
1. **MongoDB connection errors** - Check IP whitelist and credentials
2. **Kafka connection issues** - Verify security protocol and certificates
3. **AI model failures** - Check HuggingFace API token and rate limits
4. **Authentication problems** - Verify JWT secret and token expiration

### Debug Mode
```env
FLASK_DEBUG=True
LOG_LEVEL=DEBUG
```

This documentation provides a comprehensive overview of the LegalSphere system architecture, workflows, and implementation details for discussion with AI assistants like Gemini.
