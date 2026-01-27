# Documentation Guide

This document explains what each documentation file is for and which one to read.

## For Team Members (Getting Started)

### 🚀 [QUICKSTART.md](QUICKSTART.md)
**Start here!** The simplest guide for all developers.

- **For**: All developers joining the project
- **Purpose**: Get up and running with Docker in minutes
- **What it covers**: Docker installation, starting the app, common commands, daily workflow
- **Time to setup**: 10-15 minutes

### 📘 [README.md](README.md)
Complete project documentation.

- **For**: All developers
- **Purpose**: Comprehensive project overview and documentation
- **What it covers**: Tech stack, architecture, setup, deployment, full reference
- **Use when**: You need detailed information about the project

---

## For Core Developers (Advanced)

### ⚙️ [SETUP_GUIDE.md](SETUP_GUIDE.md)
**Advanced manual setup** (not needed for normal development).

- **For**: Core developers who need manual control
- **Purpose**: Manual installation without Docker
- **What it covers**: Installing PostgreSQL, Redis, Python, running 4 terminals
- **Use when**: You need to debug individual services or customize system configs

---

## Which Documentation Should I Use?

```
┌─────────────────────────────────────────┐
│  Just want to start coding?            │
│  New team member?                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │   QUICKSTART.md    │ ← Start here!
         └────────────────────┘


┌─────────────────────────────────────────┐
│  Want to understand the project?        │
│  Need deployment instructions?          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │     README.md      │
         └────────────────────┘


┌─────────────────────────────────────────┐
│  Need to debug individual services?     │
│  Developing database features?          │
│  Performance profiling?                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  SETUP_GUIDE.md    │ ← Advanced only
         └────────────────────┘
```

---

## Quick Comparison

| Documentation | Audience | Setup Method | Complexity | Time |
|--------------|----------|--------------|------------|------|
| **QUICKSTART.md** | All team members | Docker only | ⭐ Easy | 10 min |
| **README.md** | All developers | Docker first | ⭐⭐ Medium | Full docs |
| **SETUP_GUIDE.md** | Core developers | Manual (advanced) | ⭐⭐⭐⭐ Hard | 1-2 hours |

---

## Recommended Reading Order

1. **Day 1**: Read [QUICKSTART.md](QUICKSTART.md) and get your environment running
2. **Day 2-3**: Skim [README.md](README.md) to understand the project architecture
3. **Ongoing**: Bookmark [QUICKSTART.md](QUICKSTART.md) for daily reference
4. **If needed**: Only read [SETUP_GUIDE.md](SETUP_GUIDE.md) if you need manual setup

---

## Key Takeaways

✅ **Use Docker for everything** - It's the easiest and recommended way

✅ **QUICKSTART.md** - Your starting point for setup and daily commands

✅ **SETUP_GUIDE.md** - Only for advanced debugging, not normal development

✅ **One command to start**: `docker-compose up --build`

---

## Questions?

- **Setup issues?** Check [QUICKSTART.md](QUICKSTART.md) → Troubleshooting section
- **Docker questions?** See [QUICKSTART.md](QUICKSTART.md)
- **Architecture questions?** See [README.md](README.md)
- **Manual setup?** See [SETUP_GUIDE.md](SETUP_GUIDE.md)
