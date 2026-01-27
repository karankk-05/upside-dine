# Upside Dine - Quick Start Guide

> **For Team Members**: Complete setup guide + Git workflow

---

## 🚀 First Time Setup

### 1. Install Docker Desktop

**Only dependency needed!**

- **Mac**: https://www.docker.com/products/docker-desktop
- **Windows**: https://www.docker.com/products/docker-desktop
- **Linux**: `sudo apt install docker.io docker-compose -y`

Verify: `docker --version && docker-compose --version`

### 2. Clone & Setup

```bash
# Clone repository
git clone https://github.com/karankk-05/upside-dine.git
cd upside_dine

# Create YOUR branch (NEVER use master/main!)
git checkout -b yourname-feature
# Example: git checkout -b sarah-restaurant-search

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# No need to edit - already configured!
```

### 3. Start Everything

```bash
# Build and start (first time takes 3-5 minutes)
docker-compose up --build

# In a NEW terminal, initialize database (first time only):
docker-compose exec backend python manage.py migrate
docker-compose exec -it backend python manage.py createsuperuser
```

### 4. Access App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin**: http://localhost:8000/admin/
- **API Docs**: http://localhost:8000/api/schema/swagger-ui/

✅ **Done!** Start coding!

---

## 📝 Daily Workflow

### Starting Environment
```bash
cd upside_dine
git checkout yourname-feature
git pull origin master  # Get latest from master
docker-compose up -d
```

### Coding
```bash
# Make changes...
# Backend auto-reloads on save
# Frontend auto-reloads on save

# View logs if needed
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Committing
```bash
git status
git add .
git commit -m "feat: describe what you did"
git push origin yourname-feature
```

### Creating Pull Request
1. Go to GitHub repository
2. Click "New Pull Request"
3. Compare: `yourname-feature` → `master`
4. Add description
5. Request review

### Closing Environment
```bash
docker-compose down  # Optional - can leave running
```

---

## 🌳 Git Workflow

### Branch Naming
- `yourname-featurename` - Your feature
- Examples: `sarah-auth`, `mike-search`, `alex-ui`

### Commit Messages
```bash
git commit -m "feat: add login page"
git commit -m "fix: resolve search bug"
git commit -m "refactor: improve code structure"
```

### Syncing with Master
```bash
# Update your branch with latest master
git checkout yourname-feature
git pull origin master

# If conflicts, resolve them then:
git add .
git commit -m "merge: resolve conflicts"
git push origin yourname-feature
```

### After PR is Merged
```bash
git checkout master
git pull origin master
git branch -d yourname-oldfeature  # Delete old branch
git checkout -b yourname-newfeature  # Start new work
```

---

## 🐳 Common Commands

### Start/Stop
```bash
docker-compose up -d           # Start in background
docker-compose down            # Stop all services
docker-compose restart backend # Restart specific service
```

### Logs
```bash
docker-compose logs -f         # All logs
docker-compose logs -f backend # Backend only
```

### Database
```bash
docker-compose exec backend python manage.py migrate      # Run migrations
docker-compose exec backend python manage.py makemigrations  # Create migrations
docker-compose exec backend python manage.py shell       # Django shell
```

### Fresh Start (if broken)
```bash
docker-compose down -v
docker-compose up --build
docker-compose exec backend python manage.py migrate
```

---

## 🔧 Troubleshooting

### Port in Use
```bash
docker-compose down
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

### Backend Not Starting
```bash
docker-compose logs backend  # Check error
docker-compose restart backend
```

### Changes Not Showing
- **Frontend**: Auto-reloads (just refresh browser)
- **Backend**: `docker-compose restart backend`

---

## 📋 Rules

✅ **DO:**
- Always create your own branch
- Pull from master daily
- Write clear commit messages
- Ask for code reviews
- Test before pushing

❌ **DON'T:**
- Never work on master/main branch
- Don't push directly to master
- Don't commit `.env` files
- Don't commit large files

---

**Need help?** Ask in team chat or check [README.md](README.md) for full docs!
