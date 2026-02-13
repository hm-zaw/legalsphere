# LegalSphere Kafka Workflow Documentation

## Enhanced Lawyer Assignment Workflow

This document outlines the complete Kafka-based workflow for lawyer assignment, acceptance/rejection, client notifications, and admin case rejection in LegalSphere.

## Kafka Topics

### 1. `case-notifications` (Existing)
**Purpose**: General case notifications including admin rejections
**Producer**: Admin service (via `/api/admin/case-requests/<case_id>/reject`)
**Consumer**: NotificationProcessor
**Message Format**:
```json
{
  "clientId": "client@email.com",
  "caseId": "case_123",
  "notificationType": "case_rejected",
  "title": "Case Rejected",
  "message": "Your case \"Contract Review Case\" has been reviewed but unfortunately cannot be accepted at this time.",
  "metadata": {
    "rejectionReason": "Case complexity exceeds current capacity",
    "rejectedBy": "Admin User",
    "rejectedAt": "2024-01-01T12:00:00Z",
    "clientName": "Jane Doe",
    "caseTitle": "Contract Review Case"
  }
}
```

### 2. `lawyer-assignments`
**Purpose**: Triggered when admin analyzes a case and assigns a lawyer
**Producer**: Admin service (via `/api/admin/case-requests/<case_id>/assign`)
**Consumer**: LawyerAssignmentProcessor
**Message Format**:
```json
{
  "event_type": "lawyer_assignment",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "caseId": "case_123",
    "lawyerId": "lawyer_001",
    "lawyerName": "John Smith",
    "lawyerEmail": "john.smith@legalsphere.com",
    "caseTitle": "Contract Review Case",
    "clientId": "client@email.com",
    "clientName": "Jane Doe",
    "assignedBy": "Admin User",
    "assignedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 3. `lawyer-responses`
**Purpose**: Triggered when lawyer accepts or rejects a case assignment
**Producer**: Lawyer service (via `/api/lawyer/cases/<case_id>/accept` or `/reject`)
**Consumer**: LawyerResponseProcessor
**Message Format**:
```json
{
  "event_type": "lawyer_response",
  "timestamp": "2024-01-01T12:30:00Z",
  "data": {
    "caseId": "case_123",
    "lawyerId": "lawyer_001",
    "lawyerName": "John Smith",
    "lawyerEmail": "john.smith@legalsphere.com",
    "response": "accepted|rejected",
    "reason": "Optional rejection reason",
    "respondedAt": "2024-01-01T12:30:00Z"
  }
}
```

### 3. `case-connections`
**Purpose**: Triggered when lawyer accepts a case, establishing client-lawyer connection
**Producer**: Lawyer service (via `/api/lawyer/cases/<case_id>/accept`)
**Consumer**: CaseConnectionProcessor
**Message Format**:
```json
{
  "event_type": "case_connection",
  "timestamp": "2024-01-01T12:30:00Z",
  "data": {
    "caseId": "case_123",
    "lawyerId": "lawyer_001",
    "lawyerName": "John Smith",
    "lawyerEmail": "john.smith@legalsphere.com",
    "clientId": "client@email.com",
    "clientName": "Jane Doe",
    "caseTitle": "Contract Review Case",
    "connectedAt": "2024-01-01T12:30:00Z"
  }
}
```

### 4. `admin-reassignments`
**Purpose**: Triggered when lawyer rejects a case, notifying admin for reassignment
**Producer**: Lawyer service (via `/api/lawyer/cases/<case_id>/reject`)
**Consumer**: AdminReassignmentProcessor
**Message Format**:
```json
{
  "event_type": "admin_reassignment",
  "timestamp": "2024-01-01T12:30:00Z",
  "data": {
    "caseId": "case_123",
    "caseTitle": "Contract Review Case",
    "rejectedLawyerId": "lawyer_001",
    "rejectedLawyerName": "John Smith",
    "rejectionReason": "Case overload",
    "clientId": "client@email.com",
    "clientName": "Jane Doe",
    "requiresReassignment": true,
    "rejectedAt": "2024-01-01T12:30:00Z"
  }
}
```

## Complete Workflow

### Step 1: Admin Case Review

#### Option A: Admin Assigns Lawyer
1. **Admin Action**: POST `/api/admin/case-requests/<case_id>/assign`
   - Uses Facebook Legal BERT for case classification
   - Assigns lawyer to case
   - Updates case status to `lawyer_assigned`

2. **Kafka Message**: Published to `lawyer-assignments` topic
3. **Notification**: Stored in `lawyer_notifications` collection
4. **Dashboard Update**: Lawyer sees new case assignment notification

#### Option B: Admin Rejects Case (New)
1. **Admin Action**: PATCH `/api/admin/case-requests/<case_id>/reject`
   - Admin reviews case and determines it cannot be handled
   - Provides rejection reason
   - Updates case status to `rejected`

2. **Kafka Message**: Published to `case-notifications` topic
3. **Notification**: Stored in `notifications` collection for client
4. **Dashboard Update**: Client receives rejection notification

### Step 2: Lawyer Response (Accept/Reject)

#### Option A: Lawyer Accepts
1. **Lawyer Action**: POST `/api/lawyer/cases/<case_id>/accept`
2. **Database Update**: Case status changes to `active`
3. **Kafka Messages**:
   - Published to `lawyer-responses` (accept)
   - Published to `case-connections` (connection established)
4. **Notifications**:
   - Admin notified of acceptance
   - Client notified of lawyer assignment
   - Lawyer receives confirmation
5. **Dashboard Updates**:
   - Admin sees connection established
   - Client sees lawyer assigned
   - Lawyer sees case in active cases

#### Option B: Lawyer Rejects
1. **Lawyer Action**: POST `/api/lawyer/cases/<case_id>/reject`
2. **Database Update**: 
   - Case status changes to `pending_admin_review`
   - Lawyer added to `deniedLawyerIds` list
   - Assignment cleared
3. **Kafka Messages**:
   - Published to `lawyer-responses` (reject)
   - Published to `admin-reassignments` (reassignment needed)
4. **Notifications**:
   - Admin notified of rejection with reason
5. **Dashboard Updates**:
   - Admin sees case needs reassignment
   - Lawyer no longer sees case in assignments

### Step 3: Admin Reassignment (if needed)
1. **Admin Action**: POST `/api/admin/cases/<case_id>/reassign`
2. **Process**: Same as Step 1 with new lawyer
3. **Workflow**: Continues from Step 2

## API Endpoints

### Admin Endpoints
- `GET /api/admin/cases` - List all cases for admin review
- `POST /api/admin/cases/<case_id>/analyze` - Analyze case and assign lawyer
- `POST /api/admin/cases/<case_id>/reassign` - Reassign case to different lawyer
- `GET /api/admin/lawyers` - Get available lawyers for assignment
- `GET /api/admin/connections` - Get all active lawyer-client connections

### Lawyer Endpoints
- `GET /api/lawyer/assignments` - Get assigned cases (incoming/active/completed)
- `POST /api/lawyer/cases/<case_id>/accept` - Accept case assignment
- `POST /api/lawyer/cases/<case_id>/reject` - Reject case assignment
- `GET /api/lawyer/cases/<case_id>` - Get case details
- `GET /api/lawyer/dashboard` - Get lawyer dashboard summary

### Notification Endpoints
- `GET /api/notifications` - Get user notifications (role-based)
- `POST /api/notifications/<notification_id>/read` - Mark notification as read
- `POST /api/notifications/mark-all-read` - Mark all notifications as read
- `GET /api/notifications/unread-count` - Get unread notification count
- `GET /api/admin/notifications` - Get admin-specific notifications
- `GET /api/lawyer/notifications` - Get lawyer-specific notifications

## Database Collections

### Case Management
- `case_requests` - Main case documents with status and assignments

### Notifications
- `notifications` - General notifications (client-facing)
- `admin_notifications` - Admin-specific notifications
- `lawyer_notifications` - Lawyer-specific notifications

## Case Status Flow

```
pending_submission → pending_admin_review → lawyer_assigned → active → completed
                                      ↑              ↓
                                      └── pending_admin_review (rejected)
```

## Kafka Consumer Processors

### 1. LawyerAssignmentProcessor
- **Topic**: `lawyer-assignments`
- **Action**: Creates notifications for assigned lawyers
- **Storage**: `lawyer_notifications` collection

### 2. LawyerResponseProcessor
- **Topic**: `lawyer-responses`
- **Action**: Creates admin notifications for lawyer responses
- **Storage**: `admin_notifications` collection

### 3. CaseConnectionProcessor
- **Topic**: `case-connections`
- **Action**: Creates notifications for all parties when connection established
- **Storage**: Multiple notification collections

### 4. AdminReassignmentProcessor
- **Topic**: `admin-reassignments`
- **Action**: Creates admin notifications for reassignment needs
- **Storage**: `admin_notifications` collection

## Error Handling & Resilience

1. **Kafka Delivery**: All producers use delivery callbacks with error logging
2. **Consumer Errors**: Automatic retry with exponential backoff
3. **Database Errors**: Logged and don't stop consumer processing
4. **Message Validation**: All messages validated before processing

## Security

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Role-based access control (admin/lawyer/client)
3. **Data Validation**: Input validation on all endpoints
4. **Audit Trail**: All actions logged with timestamps and user info

## Monitoring & Logging

1. **Kafka Metrics**: Message production/consumption logged
2. **Processor Health**: Start/stop events logged
3. **Error Tracking**: Detailed error logging for debugging
4. **Performance**: Message processing times logged

## Frontend Integration

### Admin Dashboard
- Real-time notifications for lawyer responses
- Case reassignment alerts
- Connection status updates

### Lawyer Dashboard
- New case assignment notifications
- Case status updates
- Connection confirmations

### Client Dashboard
- Lawyer assignment notifications
- Case progress updates
- Connection establishment alerts

## Configuration

### Environment Variables
```bash
# Kafka Topics
KAFKA_LAWYER_ASSIGNMENTS_TOPIC=lawyer-assignments
KAFKA_LAWYER_RESPONSES_TOPIC=lawyer-responses
KAFKA_CASE_CONNECTIONS_TOPIC=case-connections
KAFKA_ADMIN_REASSIGNMENTS_TOPIC=admin-reassignments
```

### Docker Compose
Topics are automatically created by the Kafka setup script.

## Testing

### Unit Tests
- Test each processor independently
- Test API endpoints with mock data
- Test Kafka message formats

### Integration Tests
- Test complete workflow end-to-end
- Test error scenarios
- Test concurrent processing

### Load Testing
- Test high-volume message processing
- Test consumer scaling
- Test database performance under load

## Deployment

### Production Considerations
- Kafka consumer group management
- Database indexing for performance
- Monitoring and alerting setup
- Backup and recovery procedures

### Scaling
- Horizontal scaling of consumers
- Database sharding if needed
- Load balancing for API endpoints
