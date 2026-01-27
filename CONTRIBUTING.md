# Contributing to Upside Dine

This guide will help you set up your development environment and contribute to the project.

## 🚀 Quick Start for New Team Members

### 1. Prerequisites

Install **Docker Desktop** only:
- **macOS**: https://www.docker.com/products/docker-desktop
- **Windows**: https://www.docker.com/products/docker-desktop  
- **Linux**: `sudo apt install docker.io docker-compose`

### 2. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd upside_dine

# Create your own branch (IMPORTANT!)
git checkout -b feature/your-name-feature-description
# Example: git checkout -b feature/john-user-authentication

# Copy environment files (already configured for Docker!)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start everything
docker-compose up --build

# In a NEW terminal, initialize database (first time only)
docker-compose exec backend python manage.py migrate
docker-compose exec -it backend python manage.py createsuperuser
```

### 3. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/
- **API Docs**: http://localhost:8000/api/schema/swagger-ui/

---

## 📝 Git Workflow

### Creating a New Branch

**ALWAYS work on a separate branch, never on `main`!**

```bash
# Make sure you're on main
git checkout main

# Pull latest changes
git pull origin main

# Create your feature branch
git checkout -b feature/your-name-feature-description
```

**Branch Naming Convention:**
- `feature/name-description` - For new features
- `bugfix/name-description` - For bug fixes
- `hotfix/name-description` - For urgent fixes
- `docs/name-description` - For documentation updates

**Examples:**
```bash
git checkout -b feature/sarah-restaurant-search
git checkout -b bugfix/mike-login-validation
git checkout -b docs/alex-api-documentation
```

### Daily Workflow

```bash
# 1. Start your work day
git checkout your-branch-name
git pull origin main  # Get latest changes from main
docker-compose up -d

# 2. Make your changes
# ... code, code, code ...

# 3. Check what changed
git status
git diff

# 4. Stage and commit
git add .
git commit -m "feat: add restaurant search functionality"

# 5. Push to your branch
git push origin your-branch-name
```

### Commit Message Convention

Use clear, descriptive commit messages:

```bash
# Format: <type>: <description>

git commit -m "feat: add user profile page"
git commit -m "fix: resolve login redirect issue"
git commit -m "docs: update API documentation"
git commit -m "refactor: improve database queries"
git commit -m "test: add unit tests for authentication"
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### Creating a Pull Request

```bash
# 1. Make sure all your changes are committed
git status  # Should show "working tree clean"

# 2. Push your branch
git push origin your-branch-name

# 3. Go to GitHub and create a Pull Request
# - Compare your-branch-name → main
# - Add description of what you changed
# - Request review from team members
```

### Syncing with Main Branch

```bash
# Get latest changes from main into your branch
git checkout your-branch-name
git pull origin main

# If there are conflicts, resolve them and commit
git add .
git commit -m "merge: resolve conflicts with main"
git push origin your-branch-name
```

---

## 🐳 Docker Commands

### Daily Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs -f backend  # Specific service

# Stop all services
docker-compose down

# Restart a service
docker-compose restart backend
```

### Database Commands

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create migrations
docker-compose exec backend python manage.py makemigrations

# Django shell
docker-compose exec backend python manage.py shell
```

### Fresh Start (if something breaks)

```bash
# Nuclear option - removes everything
docker-compose down -v
docker-compose up --build

# Re-initialize
docker-compose exec backend python manage.py migrate
docker-compose exec -it backend python manage.py createsuperuser
```

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
docker-compose down
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
docker-compose up
```

### Backend Not Starting

```bash
# Check logs
docker-compose logs backend

# Common fix: restart
docker-compose restart backend

# Nuclear option
docker-compose down -v
docker-compose up --build
```

### Code Changes Not Reflecting

```bash
# For backend changes
docker-compose restart backend

# For frontend (auto-reloads usually)
# If not, restart:
docker-compose restart frontend
```

### Database Issues

```bash
# View database
docker-compose exec db psql -U postgres -d upside_dine_db

# Fresh database (WARNING: deletes all data!)
docker-compose down -v
docker-compose up -d
docker-compose exec backend python manage.py migrate
```

---

## 📚 Additional Resources

- **Quick Reference**: See [QUICKSTART.md](QUICKSTART.md)
- **Full Documentation**: See [README.md](README.md)
- **Setup Guide**: See [DOCS_GUIDE.md](DOCS_GUIDE.md)

---

## ✅ Before Creating a Pull Request

- [ ] Code runs without errors
- [ ] Tests pass: `docker-compose exec backend python manage.py test`
- [ ] Frontend builds: `docker-compose exec frontend npm run build`
- [ ] Committed all changes
- [ ] Wrote clear commit messages
- [ ] Branch is up to date with main
- [ ] Added/updated documentation if needed

---

## 💡 Tips

1. **Always pull from main** before starting new work
2. **Create small, focused PRs** - easier to review
3. **Test locally** before pushing
4. **Ask for help** in team chat if stuck
5. **Keep Docker running** in background while coding
6. **Use meaningful branch names** so others know what you're working on

---

**Need Help?** Ask in the team chat or check the documentation!
