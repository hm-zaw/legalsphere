# LegalSphere: Cloud-Native Legal Management Platform

LegalSphere is a distributed legal management platform designed for modern law organizations, featuring secure document workflows, intelligent case classification, and AI-powered lawyer matching.

## ✨ Features

- **Asynchronous Case Submission**: Utilizes Kafka for a non-blocking, message-driven case submission workflow.
- **AI-Powered Case Classification**: Employs a fine-tuned Facebook Legal BERT model from HuggingFace to automatically classify cases.
- **Intelligent Lawyer Matching**: Matches cases with the most suitable lawyers based on their expertise and availability.
- **Document Management**: Integrates with AWS S3 for secure and scalable document storage.
- **Real-Time Notifications**: Keeps users informed with real-time updates on case status via Kafka.
- **Admin Dashboard**: A comprehensive dashboard for managing cases, users, and system settings.
- **Client Dashboard**: An intuitive interface for clients to submit new cases and track their progress.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS
- **Backend**: Flask, Python, Kafka, MongoDB
- **AI**: HuggingFace Transformers (Vietnamese Legal BERT)
- **Infrastructure**: MongoDB Atlas, Aiven Kafka (Cloud-Native)

## 🏛️ Architecture

LegalSphere is built on a distributed, event-driven architecture that ensures scalability and resilience.

1. **Frontend (Next.js)**: The client-facing application that allows users to submit and manage cases.
2. **Backend (Flask)**: A RESTful API that handles business logic, user authentication, and communication with other services.
3. **Kafka (Aiven Cloud)**: A distributed messaging system that decouples the frontend from the backend, enabling asynchronous communication.
4. **Case Processor**: A background service that consumes case submissions from Kafka, performs AI-powered analysis, and matches cases with lawyers.
5. **MongoDB (Atlas)**: The primary database for storing case data, user information, and other application state.

## 🚀 Getting Started (Cloud-Native)

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.9 or higher)
- MongoDB Atlas Account (Free Tier)
- Aiven Account (Free Tier Kafka)

### Cloud Services Setup

#### 1. MongoDB Atlas Setup
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 sandbox)
3. Create a database user with password
4. Add your IP to IP Access List (use `0.0.0.0/0` for development)
5. Get connection string from **Connect → Drivers**

#### 2. Aiven Kafka Setup
1. Create a free account at [Aiven](https://aiven.io/)
2. Create Apache Kafka service (free tier available)
3. Get Service URI and credentials from **Overview** tab
4. Note: Default port is usually `25368` for Kafka
5. Security protocol is typically `SASL_SSL` with `SCRAM-SHA-256`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/legalsphere.git
   cd legalsphere
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your cloud service credentials:
   ```env
   # MongoDB Atlas
   MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/legal_sphere"
   
   # Aiven Kafka
   KAFKA_BOOTSTRAP_SERVERS="<aiven-service-uri>:25368"
   KAFKA_USERNAME="avnadmin"
   KAFKA_PASSWORD="<aiven-password>"
   KAFKA_SECURITY_PROTOCOL="SASL_SSL"
   KAFKA_SASL_MECHANISM="SCRAM-SHA-256"
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

5. **Set up Kafka topics** (one-time setup):
   ```bash
   cd ../backend/Flask_Backend
   python kafka_setup.py
   ```

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

## 🌐 Application Access

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **MongoDB Atlas**: [Atlas Dashboard](https://cloud.mongodb.com/)
- **Aiven Kafka**: [Aiven Console](https://console.aiven.io/)

## 📁 Project Structure

```
legalsphere/
├── legal_sphere/           # Next.js Frontend
│   ├── app/               # App router pages
│   ├── components/        # Reusable React components
│   ├── lib/              # Utility functions (including Kafka client)
│   └── hooks/            # Custom React hooks
├── backend/
│   └── Flask_Backend/     # Flask Backend
│       ├── routes/        # API endpoints
│       ├── db/           # Database models and connections
│       ├── kafka_config.py    # Kafka configuration
│       ├── notification_processor.py  # Background consumer
│       └── kafka_setup.py    # Topic setup script
├── .env.example          # Environment variables template
└── README.md            # This file
```

## 🔧 Development Workflow

### Local Development with Cloud Services

The application is designed to run natively on your machine while connecting to cloud services:

1. **No Docker required** - All infrastructure runs in the cloud
2. **Zero local dependencies** - Just Node.js and Python
3. **Secure connections** - All communications use SSL/TLS
4. **Clone and run** - Perfect for team development

### Environment Variables

Key environment variables for cloud operation:

```env
# Database
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/legal_sphere"

# Kafka
KAFKA_BOOTSTRAP_SERVERS="kafka-service.aivencloud.com:25368"
KAFKA_USERNAME="avnadmin"
KAFKA_PASSWORD="your-password"
KAFKA_SECURITY_PROTOCOL="SASL_SSL"
KAFKA_SASL_MECHANISM="SCRAM-SHA-256"

# Application
FLASK_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Verify IP Access List includes your IP or `0.0.0.0/0`
   - Check username/password in connection string
   - Ensure database user has read/write permissions

2. **Kafka Connection Error**:
   - Verify service URI and port are correct
   - Check SASL credentials (username/password)
   - Ensure security protocol matches Aiven configuration

3. **Frontend Build Issues**:
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version (requires v18+)

4. **Backend Import Errors**:
   - Activate Python virtual environment
   - Install requirements: `pip install -r requirements.txt`

### Debug Mode

Enable debug logging by setting:
```env
FLASK_DEBUG=True
LOG_LEVEL=DEBUG
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Check the troubleshooting section above
- Review the `.env.example` file for configuration options
