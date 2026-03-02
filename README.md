# LegalSphere: Cloud-Native Legal Management Platform

LegalSphere is a distributed legal management platform designed for modern law organizations, featuring secure document workflows, intelligent case classification, and AI-powered lawyer matching.

## Features

- **Asynchronous Case Submission**: Utilizes Kafka for a non-blocking, message-driven case submission workflow.
- **AI-Powered Case Classification**: Employs a fine-tuned Facebook Legal BERT model from HuggingFace to automatically classify cases.
- **Intelligent Lawyer Matching**: Matches cases with the most suitable lawyers based on their expertise and availability.
- **Document Management**: Integrates with AWS S3 for secure and scalable document storage.
- **Real-Time Notifications**: Keeps users informed with real-time updates on case status via Kafka.
- **Admin Dashboard**: A comprehensive dashboard for managing cases, users, and system settings.
- **Client Dashboard**: An intuitive interface for clients to submit new cases and track their progress.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS
- **Backend**: Flask, Python, Kafka, MongoDB
- **AI**: HuggingFace Transformers (MoritzLaurer/deberta-v3-large-zeroshot-v2.0)
- **Infrastructure**: MongoDB, Kafka, Supabase (Postgres), Cloudinary

## Architecture

LegalSphere is built on a distributed, event-driven architecture that ensures scalability and resilience.

1. **Frontend (Next.js)**: The client-facing application that allows users to submit and manage cases.
2. **Backend (Flask)**: A RESTful API that handles business logic, user authentication, and communication with other services.
3. **Kafka**: A distributed messaging system that decouples the frontend from the backend, enabling asynchronous communication.
4. **Case Processor**: A background service that consumes case submissions from Kafka, performs AI-powered analysis, and matches cases with lawyers.
5. **MongoDB**: The primary database for storing case data, notifications, chat, and other application state.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.9 or higher)

### Required Services

- **MongoDB** (local or cloud)
- **Kafka** (local broker or managed Kafka)
- **Supabase** (used for user/lawyer data)
- **Cloudinary** (used for profile images and chat attachments)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/legalsphere.git
   cd legalsphere
   ```

2. **Set up environment variables**:

   Create a `.env` file in `backend/Flask_Backend/.env` (this repo does not include a root `.env.example`).

   Minimum variables used by the backend:
   ```env
   # Backend
   FRONTEND_URL=http://localhost:3000
   JWT_SECRET_KEY=your-secret-key
   JWT_EXPIRES_HOURS=24

   # MongoDB (used for cases, notifications, chat)
   MONGODB_URI=mongodb://localhost:27017/legal_sphere

   # Kafka
   KAFKA_BOOTSTRAP_SERVERS=127.0.0.1:9092
   KAFKA_CONSUMER_GROUP_ID=notification-processors
   KAFKA_CASE_NOTIFICATIONS_TOPIC=case-notifications
   KAFKA_LAWYER_ASSIGNMENTS_TOPIC=lawyer-assignments
   KAFKA_LAWYER_RESPONSES_TOPIC=lawyer-responses
   KAFKA_CASE_CONNECTIONS_TOPIC=case-connections
   KAFKA_ADMIN_REASSIGNMENTS_TOPIC=admin-reassignments

   # If using managed Kafka with TLS/mTLS, configure the protocol.
   # The backend supports: SSL (mTLS) and SASL_SSL.
   KAFKA_SECURITY_PROTOCOL=SSL
   # KAFKA_SECURITY_PROTOCOL=SASL_SSL
   # KAFKA_SASL_MECHANISM=SCRAM-SHA-256
   # KAFKA_USERNAME=...
   # KAFKA_PASSWORD=...

   # Supabase (required for authentication + user/lawyer data)
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_KEY=YOUR_SUPABASE_ANON_OR_SERVICE_KEY

   # Cloudinary (required for profile images + file uploads)
   CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   ```

3. **Install frontend dependencies**:
   ```bash
   cd legal_sphere
   npm install
   ```

4. **Install backend dependencies**:
   ```bash
   cd ../backend/Flask_Backend
   pip install -r requirements.txt
   ```

5. **Kafka topics**:

   Topics used by the lawyer assignment workflow are documented in `backend/Flask_Backend/KAFKA_WORKFLOW.md`.

### Running the Application

1. **Start the backend server**:
   ```bash
   cd backend/Flask_Backend
   python app.py
   ```

2. **Start the frontend server** (in a new terminal):
   ```bash
   cd legal_sphere
   npm run dev
   ```

## Application Access

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

## Project Structure

```
legalsphere/
├── legal_sphere/           # Next.js Frontend
│   ├── app/               # App router pages
│   ├── components/        # Reusable React components
│   └── ...
├── backend/
│   └── Flask_Backend/     # Flask Backend
│       ├── routes/        # API endpoints
│       ├── db/            # DB adapters (MongoDB + Supabase)
│       ├── kafka_config.py # Kafka configuration
│       ├── notification_processor.py # Kafka consumer(s)
│       ├── lawyer_workflow_processors.py
│       ├── mongodb_client.py
│       ├── ca.pem
│       ├── service.cert
│       └── service.key
└── README.md            # This file
```

## Development Workflow

### Local Development

This repo runs the Next.js frontend and Flask backend locally. Infrastructure dependencies (MongoDB/Kafka/Supabase/Cloudinary) can be local or managed.

### Notes

- The backend loads environment variables via `python-dotenv` (see `backend/Flask_Backend/config.py`).
- Kafka TLS/mTLS files are expected at `backend/Flask_Backend/ca.pem`, `service.cert`, `service.key` when `KAFKA_SECURITY_PROTOCOL=SSL`.

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Check `MONGODB_URI`
   - Ensure MongoDB is reachable from the backend

2. **Kafka Connection Error**:
   - Verify `KAFKA_BOOTSTRAP_SERVERS`
   - If using SSL/mTLS, confirm `ca.pem`, `service.cert`, `service.key` are present
   - If using `SASL_SSL`, confirm `KAFKA_USERNAME` / `KAFKA_PASSWORD`

3. **Frontend Build Issues**:
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version (requires v18+)

4. **Backend Import Errors**:
   - Activate Python virtual environment
   - Install requirements: `pip install -r requirements.txt`

5. **Supabase / Cloudinary Errors**:
   - Ensure `SUPABASE_URL` and `SUPABASE_KEY` are set
   - Ensure `CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` are set

### Debug Mode

Enable debug logging by setting:
```env
FLASK_DEBUG=True
LOG_LEVEL=DEBUG
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in this repository
- Check the troubleshooting section above
- Review the environment variable list in the Getting Started section
