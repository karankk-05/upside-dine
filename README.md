# Upside Dine

A comprehensive restaurant reservation and dining experience platform built with Django, React, and modern web technologies.

## ⚡ Quick Start

**New team member?** → See **[QUICKSTART.md](QUICKSTART.md)** - Complete setup + Git workflow

**Advanced setup?** → See **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Manual installation without Docker

**TL;DR:**
```bash
git clone <repo-url>
cd upside_dine
git checkout -b yourname-feature
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker-compose up --build
docker-compose exec backend python manage.py migrate
docker-compose exec -it backend python manage.py createsuperuser
# Open http://localhost:3000
```

---

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [System Requirements](#system-requirements)
- [Project Structure](#project-structure)
- [Development Environment Setup](#development-environment-setup)
  - [Prerequisites Installation](#prerequisites-installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Redis Setup](#redis-setup)
  - [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Upside Dine is a modern restaurant reservation platform that provides seamless dining experiences through intelligent booking systems, real-time notifications, and personalized recommendations.

## 🛠️ Technology Stack

### Backend
- **Django 5.0+** - Web framework
- **Django REST Framework** - REST API
- **Django Channels** - WebSocket support for real-time features
- **Celery** - Asynchronous task queue
- **FastAPI** - ML microservice
- **PostgreSQL** - Primary database
- **Redis** - Cache and message broker

### Frontend
- **React 18+** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **WebSocket** - Real-time communication

### Infrastructure
- **Nginx** - Reverse proxy and static file serving
- **Docker & Docker Compose** - Containerization
- **Gunicorn** - WSGI HTTP server
- **Daphne** - ASGI server for Django Channels

## 💻 System Requirements

### Minimum Requirements
- **OS**: macOS 11+, Ubuntu 20.04+, Windows 10+ (with WSL2)
- **RAM**: 8GB (16GB recommended for Docker)
- **Storage**: 10GB free space
- **CPU**: 2 cores (4 cores recommended)

### Software Requirements
- **Docker Desktop**: 20.10+ (includes Docker Compose)
- **Git**: 2.30+

That's it! Everything else (Python, Node.js, PostgreSQL, Redis) runs inside Docker containers.

## 📁 Project Structure

```
upside_dine/
├── backend/                 # Django backend
│   ├── config/             # Django settings
│   ├── apps/               # Django applications
│   │   ├── users/         # User management
│   │   ├── restaurants/   # Restaurant management
│   │   ├── bookings/      # Reservation system
│   │   ├── reviews/       # Review & rating system
│   │   └── notifications/ # Notification system
│   ├── api/               # API endpoints
│   ├── ml_service/        # FastAPI ML service
│   ├── requirements.txt   # Python dependencies
│   └── manage.py          # Django CLI
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── hooks/       # Custom hooks
│   │   ├── utils/       # Utility functions
│   │   └── App.jsx      # Main app component
│   ├── public/          # Static assets
│   └── package.json     # Node dependencies
├── nginx/               # Nginx configuration
├── docker/              # Docker configurations
├── docs/                # Documentation
├── .gitignore          # Git ignore rules
├── docker-compose.yml  # Docker compose config
└── README.md           # This file
```

## 🚀 Development Environment Setup

### Prerequisites

You need **Docker Desktop** installed. That's it!

#### Install Docker

**macOS:**
```bash
brew install --cask docker
# Or download from: https://www.docker.com/products/docker-desktop
```

**Ubuntu/Linux:**
```bash
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
newgrp docker
```

**Windows:**
Download Docker Desktop from: https://www.docker.com/products/docker-desktop

Verify installation:
```bash
docker --version
docker-compose --version
```

### Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd upside_dine
```

2. **Configure Environment (Optional):**

For basic development, defaults work fine. Only configure if you need email OTP:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env with your email if needed
```

3. **Start everything:**
```bash
docker-compose up --build
```

4. **Initialize database (first time only):**

In a new terminal:
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

5. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Admin Panel: http://localhost:8000/admin/

## 🏃 Running the Application

### Start Services

```bash
# Start all services (see logs)
docker-compose up

# Start in background
docker-compose up -d
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove database (fresh start)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Common Commands

```bash
# Rebuild after code changes
docker-compose up --build

# Run Django commands
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py shell
docker-compose exec backend python manage.py test

# Run frontend commands
docker-compose exec frontend npm install package-name
docker-compose exec frontend npm test

# Restart specific service
docker-compose restart backend

# Check service status
docker-compose ps
```

## 🔐 Environment Variables

### Backend (.env)

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_NAME=upside_dine_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Email (for OTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

# JWT Settings
JWT_SECRET_KEY=your-jwt-secret
JWT_ACCESS_TOKEN_LIFETIME=30  # minutes
JWT_REFRESH_TOKEN_LIFETIME=7  # days

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# ML Service
ML_SERVICE_URL=http://localhost:8001
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000/ws
REACT_APP_ENV=development
```

## 👨‍💻 Development Workflow

### Git Workflow

1. **Create a new branch**:
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes and commit**:
```bash
git add .
git commit -m "Description of changes"
```

3. **Push to remote**:
```bash
git push origin feature/your-feature-name
```

4. **Create pull request** on GitHub/GitLab

### Code Quality

**Backend (Python)**:
```bash
# Run linting
flake8 .

# Run type checking
mypy .

# Format code
black .
```

**Frontend (JavaScript)**:
```bash
# Run linting
npm run lint

# Format code
npm run format
```

## 🧪 Testing

### Run Tests

```bash
# Backend tests
docker-compose exec backend python manage.py test

# Frontend tests
docker-compose exec frontend npm test

# Backend tests with coverage
docker-compose exec backend coverage run --source='.' manage.py test
docker-compose exec backend coverage report

# Frontend tests with coverage
docker-compose exec frontend npm test -- --coverage
```

### Linting and Formatting

```bash
# Backend
docker-compose exec backend black .
docker-compose exec backend flake8 .

# Frontend
docker-compose exec frontend npm run lint
docker-compose exec frontend npm run format
```

## 🚢 Deployment

### Production Checklist

- [ ] Set `DEBUG=False` in backend `.env`
- [ ] Update `ALLOWED_HOSTS` with production domain
- [ ] Set strong `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure email service (SendGrid, AWS SES, etc.)
- [ ] Set up monitoring (Sentry, New Relic, etc.)
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Update CORS settings
- [ ] Collect static files: `python manage.py collectstatic`

## 🔧 Troubleshooting

### Docker Issues

**Ports already in use:**
```bash
docker-compose down
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
docker-compose up
```

**Services not starting:**
```bash
# Check Docker is running
docker ps

# Clean restart
docker-compose down -v
docker-compose up --build
```

**Database issues:**
```bash
# Fresh start (WARNING: Deletes all data!)
docker-compose down -v
docker-compose up --build
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

**Code changes not reflecting:**
```bash
# Restart specific service
docker-compose restart backend

# Or rebuild
docker-compose up --build backend
```

**View detailed logs:**
```bash
docker-compose logs -f backend
docker-compose logs -f celery_worker
docker-compose logs -f frontend
```

## 📚 Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Celery Documentation](https://docs.celeryq.dev/)
- [Docker Documentation](https://docs.docker.com/)

## 👥 Team

Developed by **HiveMinds**

## 📄 License

[Add your license here]

---

For questions or support, please contact [your-email@example.com]
