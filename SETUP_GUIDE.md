# Manual Development Environment Setup Guide

> [!WARNING]
> **This is an ADVANCED guide for core developers who need manual control over services.**
> 
> **For normal development, use Docker instead!** See [QUICKSTART.md](QUICKSTART.md)
> 
> Only use this manual setup if you need to:
> - Debug specific services in isolation
> - Develop system-level features
> - Run services natively for performance profiling
> - Customize database configurations

---

This guide provides detailed instructions for manually setting up the Upside Dine development environment on a fresh machine without Docker.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Software Installation](#software-installation)
3. [Project Setup](#project-setup)
4. [Database Configuration](#database-configuration)
5. [Running the Application](#running-the-application)
6. [Verification](#verification)

---

## System Requirements

### Hardware
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: At least 10GB free space
- **Processor**: Modern multi-core processor (Intel i5 or Apple Silicon M1/M2+)

### Operating Systems Supported
- macOS 11 (Big Sur) or later
- Ubuntu 20.04 or later
- Windows 10/11 with WSL2

---

## Software Installation

### For macOS

#### 1. Install Homebrew (Package Manager)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, add Homebrew to your PATH (for Apple Silicon):

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

#### 2. Install Python 3.10+

```bash
brew install python@3.10
python3 --version  # Verify installation
```

#### 3. Install Node.js 18+

```bash
brew install node@18
node --version  # Verify installation
npm --version
```

#### 4. Install PostgreSQL 14

```bash
brew install postgresql@14
brew services start postgresql@14

# Verify installation
psql --version
```

#### 5. Install Redis

```bash
brew install redis
brew services start redis

# Verify installation
redis-cli ping  # Should return PONG
```

#### 6. Install Docker (Optional - for containerized development)

```bash
brew install --cask docker
# After installation, open Docker Desktop from Applications
```

#### 7. Install Git (if not already installed)

```bash
brew install git
git --version
```

---

### For Ubuntu/Debian Linux

#### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. Install Python 3.10+

```bash
sudo apt install python3.10 python3.10-venv python3-pip -y
python3 --version
```

#### 3. Install Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
node --version
npm --version
```

#### 4. Install PostgreSQL 14

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
psql --version
```

#### 5. Install Redis

```bash
sudo apt install redis-server -y
sudo systemctl start redis
sudo systemctl enable redis

# Verify
redis-cli ping  # Should return PONG
```

#### 6. Install Docker (Optional)

```bash
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER  # Add your user to docker group
newgrp docker  # Activate changes
```

#### 7. Install Git

```bash
sudo apt install git -y
git --version
```

---

### For Windows (WSL2)

#### 1. Install WSL2

Open PowerShell as Administrator:

```powershell
wsl --install
```

Restart your computer and set up Ubuntu.

#### 2. Follow Ubuntu Instructions

Once WSL2 is set up with Ubuntu, follow the Ubuntu/Debian instructions above inside your WSL2 terminal.

---

## Project Setup

### 1. Clone the Repository

```bash
cd ~/Documents  # or your preferred directory
git clone <repository-url>
cd upside_dine
```

### 2. Backend Setup

#### Create Python Virtual Environment

```bash
cd backend
python3 -m venv venv
```

#### Activate Virtual Environment

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows (WSL2):**
```bash
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

#### Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This will install Django, DRF, Celery, and all other backend dependencies.

#### Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your preferred text editor:

```bash
nano .env  # or vim, code, etc.
```

**Important variables to update:**

```env
SECRET_KEY=your-secret-key-here  # Generate with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
DEBUG=True
DATABASE_NAME=upside_dine_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password  # Set your own password
DATABASE_HOST=localhost
DATABASE_PORT=5432
EMAIL_HOST_USER=your_email@gmail.com  # For OTP emails
EMAIL_HOST_PASSWORD=your_app_password  # Gmail app password
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

This will install React, React Router, Axios, and all frontend dependencies.

#### Configure Frontend Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000/ws
REACT_APP_ENV=development
```

---

## Database Configuration

### 1. Create PostgreSQL Database

#### Start PostgreSQL Interactive Terminal

**macOS:**
```bash
psql postgres
```

**Ubuntu/Linux:**
```bash
sudo -u postgres psql
```

#### Create Database and User

```sql
CREATE DATABASE upside_dine_db;
CREATE USER upside_user WITH PASSWORD 'your_secure_password';
ALTER ROLE upside_user SET client_encoding TO 'utf8';
ALTER ROLE upside_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE upside_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE upside_dine_db TO upside_user;
\q  -- Exit psql
```

### 2. Run Database Migrations

```bash
cd backend
source venv/bin/activate  # If not already activated
python manage.py makemigrations
python manage.py migrate
```

### 3. Create Superuser

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account.

### 4. Load Sample Data (Optional)

If sample data fixtures are available:

```bash
python manage.py loaddata fixtures/sample_data.json
```

---

## Running the Application

> [!TIP]
> **Recommended**: Use Docker instead of manual mode. See [QUICKSTART.md](QUICKSTART.md)

### Docker Mode (RECOMMENDED - Much Easier!)

```bash
docker-compose up --build
```

Or in detached mode:

```bash
docker-compose up -d
```

See [QUICKSTART.md](QUICKSTART.md) for full Docker workflow.

---

### Manual Mode (4 Terminal Windows Required)

**Only use this if you specifically need to debug individual services.**

#### Terminal 1: Django Backend

```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

Backend will run at: **http://localhost:8000**

#### Terminal 2: Celery Worker (Background Tasks)

```bash
cd backend
source venv/bin/activate
celery -A config worker -l info
```

#### Terminal 3: Celery Beat (Task Scheduler)

```bash
cd backend
source venv/bin/activate
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

#### Terminal 4: React Frontend

```bash
cd frontend
npm start
```

Frontend will run at: **http://localhost:3000**

---

## Verification

### 1. Check All Services Are Running

**Backend API:**
- Open: http://localhost:8000/api/
- You should see the API root

**Admin Panel:**
- Open: http://localhost:8000/admin/
- Login with your superuser credentials

**Frontend:**
- Open: http://localhost:3000
- You should see the Upside Dine homepage

**Redis:**
```bash
redis-cli ping  # Should return PONG
```

**PostgreSQL:**
```bash
psql -U upside_user -d upside_dine_db -c "SELECT version();"
```

### 2. Test API Endpoints

```bash
# Test a simple API endpoint
curl http://localhost:8000/api/

# Test authentication (if implemented)
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 3. Check Logs

All services should be running without errors. Check terminal windows for any error messages.

---

## Next Steps

1. **Read the Documentation**: Check `README.md` for detailed project information
2. **Review the Code**: Familiarize yourself with the project structure
3. **Create a Branch**: Always work on feature branches
4. **Run Tests**: Before making changes, ensure all tests pass
5. **Follow Coding Standards**: Use provided linting and formatting tools

---

## Common Issues and Solutions

### Issue: Port Already in Use

**Solution:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Issue: PostgreSQL Connection Error

**Solution:**
```bash
# macOS
brew services restart postgresql@14

# Linux
sudo systemctl restart postgresql

# Verify it's running
psql --version
psql postgres -c "SELECT version();"
```

### Issue: Redis Connection Error

**Solution:**
```bash
# macOS
brew services restart redis

# Linux
sudo systemctl restart redis

# Verify
redis-cli ping
```

### Issue: Permission Denied (Linux)

**Solution:**
```bash
# Add your user to sudo group if needed
sudo usermod -aG sudo $USER

# For Docker
sudo usermod -aG docker $USER
newgrp docker
```

### Issue: pip install fails

**Solution:**
```bash
# Upgrade pip
pip install --upgrade pip

# Clear cache
pip cache purge

# Try again
pip install -r requirements.txt
```

### Issue: npm install fails

**Solution:**
```bash
# Clear cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## Development Tools (Recommended)

### Code Editors
- **Visual Studio Code** (Recommended)
  - Extensions: Python, ESLint, Prettier, Docker
- **PyCharm Professional** (for Django)
- **WebStorm** (for React)

### Database Tools
- **pgAdmin** - PostgreSQL GUI
- **DBeaver** - Universal database tool
- **TablePlus** - Modern database GUI

### API Testing
- **Postman** - API testing platform
- **Insomnia** - REST client
- **HTTPie** - Command-line HTTP client

### Terminal Enhancements
- **iTerm2** (macOS) - Better terminal
- **Oh My Zsh** - Zsh configuration
- **tmux** - Terminal multiplexer

---

## Getting Help

- **Documentation**: See `README.md` and `QUICKSTART.md`
- **Django Docs**: https://docs.djangoproject.com/
- **React Docs**: https://react.dev/
- **Team Chat**: [Your team communication channel]
- **Issue Tracker**: [Your issue tracking system]

---

## Security Notes

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use strong passwords** for database and admin accounts
3. **Enable 2FA** on your email for OTP functionality
4. **Keep dependencies updated** - Run `pip list --outdated` and `npm outdated` regularly
5. **Use HTTPS** in production - Never use HTTP for sensitive data

---

**Happy Coding! 🚀**
