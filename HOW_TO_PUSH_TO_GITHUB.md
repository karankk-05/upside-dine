# How to Push to GitHub

Follow these steps to push your Upside Dine repository to GitHub.

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. **Repository name**: `upside-dine` (or your preferred name)
3. **Description**: Restaurant reservation and dining experience platform
4. **Visibility**: Choose Private or Public
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

## Step 2: Push Your Code

GitHub will show you commands. Use these:

```bash
# Make sure you're in the project directory
cd /Users/karan/Documents/upside_dine

# Add GitHub as remote (replace with YOUR repo URL)
git remote add origin https://github.com/YOUR-USERNAME/upside-dine.git

# Push to GitHub
git push -u origin main
```

**Example:**
```bash
git remote add origin https://github.com/johndoe/upside-dine.git
git push -u origin main
```

## Step 3: Verify

Go to your GitHub repository URL and verify all files are there.

---

## For Team Members to Clone

Once pushed, share this with your team:

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/upside-dine.git
cd upside-dine

# Follow FIRST_TIME_SETUP.md from here
```

---

## Common Git Commands for Reference

### Check Status
```bash
git status              # See what's changed
git log --oneline -5    # See recent commits
git branch -a          # List all branches
```

### Create and Push a New Branch
```bash
# Create your feature branch
git checkout -b feature/your-name-feature

# Make changes, then commit
git add .
git commit -m "feat: describe your changes"

# Push your branch
git push origin feature/your-name-feature
```

### Pull Latest Changes
```bash
# Switch to main
git checkout main

# Pull updates
git pull origin main

# Switch back to your branch
git checkout feature/your-name-feature

# Merge main into your branch
git merge main
```

### If You Made Mistakes
```bash
# Undo last commit (keeps changes)
git reset --soft HEAD~1

# Discard all uncommitted changes (DANGEROUS!)
git reset --hard HEAD

# Remove a file from staging
git reset HEAD filename
```

---

## Protecting the Main Branch

Once on GitHub, set up branch protection:

1. Go to repository **Settings** → **Branches**
2. Click **Add branch protection rule**
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require pull request before merging
   - ✅ Require approvals (1-2 reviewers)
   - ✅ Dismiss stale pull request approvals
5. Click **Create**

This ensures:
- Nobody can push directly to `main`
- All changes go through Pull Requests
- Code is reviewed before merging

---

## Invite Team Members

1. Go to repository **Settings** → **Collaborators**
2. Click **Add people**
3. Enter GitHub usernames or emails
4. Send invitations

---

## After Pushing - Share With Team

Send this message to your team:

```
🎉 Upside Dine repository is ready!

📦 Repository: https://github.com/YOUR-USERNAME/upside-dine

📚 Setup Instructions:
1. Read FIRST_TIME_SETUP.md for initial setup
2. Read CONTRIBUTING.md for Git workflow
3. Always create a branch before working!

🐳 Super simple setup:
- Install Docker
- Clone repo
- Run `docker-compose up --build`
- You're ready to code!

Questions? Check the docs or ask in our chat!
```

---

**That's it!** Your repository is now ready for team collaboration! 🚀
