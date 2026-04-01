#!/bin/bash
# ─────────────────────────────────────────────────────────────────
#  StudyPlanner AI – GitHub Setup Script
#  Run this from inside the project directory: bash setup-github.sh
# ─────────────────────────────────────────────────────────────────

set -e

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   StudyPlanner AI – GitHub Repository Setup ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# ── Step 1: Check git is installed
if ! command -v git &> /dev/null; then
  echo "❌ Git not found. Please install Git first."
  exit 1
fi

# ── Step 2: Initialize git if not already
if [ ! -d ".git" ]; then
  echo "📁 Initializing git repository..."
  git init
  echo "✅ Git initialized"
else
  echo "✅ Git repository already exists"
fi

# ── Step 3: Configure git user (change these!)
echo ""
echo "📝 Configure git user (edit setup-github.sh to change):"
git config user.name "Your Name"
git config user.email "your-email@student.binus.ac.id"
echo "✅ Git user configured"

# ── Step 4: Create initial commit
echo ""
echo "📦 Staging all files..."
git add .
git status

echo ""
echo "💾 Creating initial commit..."
git commit -m "feat: initial project setup

- Next.js 14 App Router with TypeScript
- Prisma schema with PostgreSQL
- Modular monolith architecture
- REST API routes for auth, tasks, sessions, goals, AI, analytics
- JWT authentication with httpOnly cookies
- Input validation with Zod
- AI features: task prioritization, burnout detection, schedule optimization
- Docker + docker-compose.yml
- GitHub Actions CI/CD pipeline
- Jest test setup with AI feature tests
- Week 1-3 documentation"

echo "✅ Initial commit created"

# ── Step 5: Create develop branch
echo ""
echo "🌿 Creating develop branch..."
git checkout -b develop
git checkout main 2>/dev/null || git checkout -b main
echo "✅ main and develop branches ready"

# ── Step 6: Instructions for GitHub
echo ""
echo "─────────────────────────────────────────────────────"
echo "  📋 NEXT STEPS – Create GitHub Remote Repository"
echo "─────────────────────────────────────────────────────"
echo ""
echo "  1. Go to https://github.com/new"
echo "  2. Name your repo: studyplanner-ai"
echo "  3. Set to Private (or Public per instructor requirement)"
echo "  4. DO NOT initialize with README (you already have one)"
echo "  5. Click 'Create repository'"
echo ""
echo "  Then run these commands:"
echo ""
echo "  git remote add origin https://github.com/YOUR-USERNAME/studyplanner-ai.git"
echo "  git branch -M main"
echo "  git push -u origin main"
echo "  git checkout develop"
echo "  git push -u origin develop"
echo ""
echo "  6. Add instructor collaborators:"
echo "     - Go to Settings → Collaborators"  
echo "     - Add: bagzcode (Main Instructor)"
echo "     - Add: Juwono136 (Lab Instructor)"
echo ""
echo "  7. Set up branch protection on main:"
echo "     - Settings → Branches → Add rule"
echo "     - Require pull request reviews before merging"
echo ""
echo "─────────────────────────────────────────────────────"
echo "  🔑 GITHUB ACTIONS SECRETS (Settings → Secrets)"
echo "─────────────────────────────────────────────────────"
echo ""
echo "  Add these secrets for CI/CD:"
echo "  - DEPLOY_HOST       : Your server IP"
echo "  - DEPLOY_USER       : SSH username (e.g., ubuntu)"
echo "  - DEPLOY_SSH_KEY    : Your private SSH key"
echo "  - JWT_SECRET        : Min 32 char random string"
echo "  - OPENAI_API_KEY    : sk-..."
echo "  - POSTGRES_PASSWORD : Strong DB password"
echo ""
echo "─────────────────────────────────────────────────────"
echo "  📖 VSCODE RECOMMENDED EXTENSIONS"
echo "─────────────────────────────────────────────────────"
echo ""
echo "  Install these for best development experience:"
echo "  - GitLens (eamodio.gitlens)"
echo "  - GitHub Pull Requests (github.vscode-pull-request-github)"
echo "  - Prisma (prisma.prisma)"
echo "  - Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)"
echo "  - ESLint (dbaeumer.vscode-eslint)"
echo ""

echo "✅ Setup script complete!"
