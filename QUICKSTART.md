# Quick Start Guide

## Prerequisites

**You only need Docker!**

```bash
# Check Docker installation
docker --version
docker-compose --version
```

### Install Docker

**macOS:**
```bash
brew install --cask docker
# Or download from: https://www.docker.com/products/docker-desktop
```

**Ubuntu/Linux:**
```bash
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER
newgrp docker
```

**Windows:**
Download Docker Desktop from: https://www.docker.com/products/docker-desktop

---

## Setup (First Time Only)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd upside_dine
```

### 2. Configure Environment (Optional)

For basic development, **defaults work fine**. Only configure if you need email OTP:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env if needed:
# EMAIL_HOST_USER=your_email@gmail.com
# EMAIL_HOST_PASSWORD=your_gmail_app_password
```

### 3. Start Everything

```bash
docker-compose up --build
```

Wait for all services to start. You'll see logs from all containers.

### 4. Initialize Database (First Time Only)

Open a **new terminal** and run:

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create admin user
docker-compose exec backend python manage.py createsuperuser
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

---

## Running the Application

### Start Services

```bash
# Start all services (foreground - see logs)
docker-compose up

# Start all services (background - detached)
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
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery_worker
```

### Rebuild After Changes

```bash
# Rebuild when dependencies change
docker-compose up --build

# Rebuild specific service
docker-compose up --build backend
```

---

## Common Commands

### Docker Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild everything
docker-compose up --build

# Fresh start (deletes database!)
docker-compose down -v
docker-compose up --build

# Check service status
docker-compose ps

# Restart specific service
docker-compose restart backend
docker-compose restart celery_worker
```

### Django Commands

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create migrations
docker-compose exec backend python manage.py makemigrations

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Django shell
docker-compose exec backend python manage.py shell

# Run tests
docker-compose exec backend python manage.py test

# Collect static files
docker-compose exec backend python manage.py collectstatic

# Access backend shell
docker-compose exec backend bash
```

### Frontend Commands

```bash
# Install new npm package
docker-compose exec frontend npm install package-name

# Run tests
docker-compose exec frontend npm test

# Access frontend shell
docker-compose exec frontend sh
```

### Database Commands

```bash
# Access PostgreSQL shell
docker-compose exec db psql -U postgres -d upside_dine_db

# Backup database
docker-compose exec db pg_dump -U postgres upside_dine_db > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres upside_dine_db < backup.sql
```

---

## Daily Workflow

### Morning (Start Development)

```bash
cd upside_dine
docker-compose up -d  # Start in background
```

### While Coding

- Edit code in your IDE
- React changes auto-reload
- Backend changes: `docker-compose restart backend`
- View logs: `docker-compose logs -f`

### After Pulling New Code

```bash
git pull origin main
docker-compose up --build -d  # Rebuild with new changes
docker-compose exec backend python manage.py migrate  # Run migrations
```

### Before Committing

```bash
# Run tests
docker-compose exec backend python manage.py test
docker-compose exec frontend npm test

# Format code (if you have linters in containers)
docker-compose exec backend black .
```

### Evening (Optional)

```bash
docker-compose down  # Stop services
# Or just leave them running!
```

---

## Troubleshooting

### Port Already in Use

```bash
docker-compose down
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
docker-compose up
```

### Services Not Starting

```bash
# Check Docker is running
docker ps

# Clean restart
docker-compose down -v
docker-compose up --build
```

### Database Issues

```bash
# Fresh database (WARNING: Deletes all data!)
docker-compose down -v
docker-compose up --build
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### Backend Code Not Updating

```bash
# Restart backend
docker-compose restart backend

# Full rebuild
docker-compose up --build backend
```

### View Detailed Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f celery_worker
docker-compose logs -f frontend
```

### Clean Everything and Start Fresh

```bash
# Nuclear option - removes everything
docker-compose down -v
docker system prune -a --volumes
docker-compose up --build
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

---

## Tips

1. **Keep it running**: Use `docker-compose up -d` to run in background while you code.

2. **Logs**: Use `docker-compose logs -f service-name` to watch specific service logs.

3. **Fresh start**: `docker-compose down -v && docker-compose up --build` gives you a clean slate.

4. **Hot reload**: React has hot reload. Django needs `docker-compose restart backend` for most changes.

5. **Data persistence**: Database data persists between restarts (unless you use `-v` flag).

6. **Resource usage**: Docker Desktop settings let you limit CPU/RAM usage.

---

## Additional Resources

- [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md) - Even simpler guide
- [README.md](README.md) - Complete documentation
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Advanced setup options

---

**That's it! Everything you need is in Docker.** 🎉
