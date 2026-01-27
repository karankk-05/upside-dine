# First Time Setup - For Team Members

> **TL;DR**: Install Docker → Clone repo → Create branch → Run `docker-compose up --build` → You're done! ✅

---

## Step 1: Install Docker Desktop

**That's the only thing you need to install manually!**

- **macOS**: https://www.docker.com/products/docker-desktop
- **Windows**: https://www.docker.com/products/docker-desktop
- **Linux**: `sudo apt install docker.io docker-compose -y`

Verify installation:
```bash
docker --version
docker-compose --version
```

---

## Step 2: Clone the Repository

```bash
# Clone the repo
git clone <repository-url>
cd upside_dine
```

---

## Step 3: Create Your Branch

**⚠️ IMPORTANT: Never work directly on `main` branch!**

```bash
# Create your own branch
git checkout -b feature/yourname-feature-description

# Example:
git checkout -b feature/sarah-restaurant-list
```

---

## Step 4: Setup Environment Files

```bash
# Copy the example files (already configured for Docker!)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# ✅ No need to edit anything for basic development!
```

**Note:** If you need email OTP functionality, edit `backend/.env` and add your Gmail credentials.

---

## Step 5: Start Everything

```bash
# Build and start all services
docker-compose up --build

# This will:
# ✅ Start PostgreSQL database
# ✅ Start Redis cache  
# ✅ Start Django backend
# ✅ Start React frontend
# ✅ Start Celery workers
# ✅ Start Nginx proxy
```

**First time?** This will take 3-5 minutes to download and build everything. Grab a coffee! ☕

---

## Step 6: Initialize Database (First Time Only)

Open a **NEW terminal** window and run:

```bash
# Run database migrations
docker-compose exec backend python manage.py migrate

# Create admin user
docker-compose exec -it backend python manage.py createsuperuser
# Enter username, email, and password when prompted
```

---

## Step 7: Access the Application

Open your browser:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/
- **API Docs (Swagger)**: http://localhost:8000/api/schema/swagger-ui/

---

## ✅ You're All Set!

### Daily Workflow

```bash
# Morning: Start services
docker-compose up -d

# Code, code, code... 💻

# Check logs if needed
docker-compose logs -f backend
docker-compose logs -f frontend

# Evening: Stop services (optional - can leave running)
docker-compose down
```

### After Pulling New Code

```bash
# Pull latest changes
git pull origin main

# Restart with rebuild
docker-compose down
docker-compose up --build

# Run migrations (if there are new ones)
docker-compose exec backend python manage.py migrate
```

---

## 🔧 Common Issues

### "Port already in use"

```bash
docker-compose down
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
docker-compose up
```

### "Backend not starting"

```bash
# Check logs
docker-compose logs backend

# Restart
docker-compose restart backend
```

### "Fresh start needed"

```bash
# Remove everything and start fresh
docker-compose down -v
docker-compose up --build
docker-compose exec backend python manage.py migrate
```

---

## 📚 Next Steps

1. **Read [CONTRIBUTING.md](CONTRIBUTING.md)** - Git workflow and branching
2. **Read [QUICKSTART.md](QUICKSTART.md)** - Docker commands reference
3. **Start coding!** 🚀

---

## 💡 Key Points

✅ **Only Docker needed** - No Python, Node.js, PostgreSQL, or Redis installation required

✅ **Auto-reload** - Frontend changes reload automatically, backend may need `docker-compose restart backend`

✅ **Separate branches** - Always create your own branch from main

✅ **Pre-configured** - `.env.example` files are ready for Docker, just copy them

✅ **Team coordination** - Check what branches teammates are working on before starting

---

**Questions?** Check [CONTRIBUTING.md](CONTRIBUTING.md) or ask in team chat!
