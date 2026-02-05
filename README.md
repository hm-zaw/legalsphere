# LegalSphere: Distributed Legal Management Platform

LegalSphere is a distributed legal management platform designed for modern law organizations, featuring secure document workflows, intelligent case classification, and AI-powered lawyer matching.

## ✨ Features

- **Asynchronous Case Submission**: Utilizes Kafka for a non-blocking, message-driven case submission workflow.
- **AI-Powered Case Classification**: Employs a fine-tuned Vietnamese Legal BERT model from HuggingFace to automatically classify cases.
- **Intelligent Lawyer Matching**: Matches cases with the most suitable lawyers based on their expertise and availability.
- **Document Management**: Integrates with AWS S3 for secure and scalable document storage.
- **Real-Time Notifications**: Keeps users informed with real-time updates on case status via Kafka.
- **Admin Dashboard**: A comprehensive dashboard for managing cases, users, and system settings.
- **Client Dashboard**: An intuitive interface for clients to submit new cases and track their progress.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS
- **Backend**: Flask, Python, Kafka, MongoDB
- **AI**: HuggingFace Transformers (Vietnamese Legal BERT)
- **Infrastructure**: Docker, Kafka, MongoDB

## 🏛️ Architecture

LegalSphere is built on a distributed, event-driven architecture that ensures scalability and resilience.

1.  **Frontend (Next.js)**: The client-facing application that allows users to submit and manage cases.
2.  **Backend (Flask)**: A RESTful API that handles business logic, user authentication, and communication with other services.
3.  **Kafka**: A distributed messaging system that decouples the frontend from the backend, enabling asynchronous communication.
4.  **Case Processor**: A background service that consumes case submissions from Kafka, performs AI-powered analysis, and matches cases with lawyers.
5.  **MongoDB**: The primary database for storing case data, user information, and other application state.

## 🚀 Getting Started

### Prerequisites

- Docker
- Docker Compose
- Node.js (v18 or higher)
- Python (v3.9 or higher)

### Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/your-username/legalsphere.git
    cd legalsphere
    ```

2.  **Start the infrastructure**:

    ```bash
    docker-compose up -d
    ```

3.  **Install frontend dependencies**:

    ```bash
    cd frontend
    npm install
    ```

4.  **Install backend dependencies**:

    ```bash
    cd ../backend
    pip install -r requirements.txt
    ```

### Running the Application

1.  **Start the backend server**:

    ```bash
    cd backend
    flask run
    ```

2.  **Start the frontend server**:

    ```bash
    cd ../frontend
    npm run dev
    ```

##  usage

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:5000](http://localhost:5000)
- **Kafka UI**: [http://localhost:8080](http://localhost:8080)
