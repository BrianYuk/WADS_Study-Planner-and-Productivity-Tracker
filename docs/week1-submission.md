# Week 1 Submission – Architecture & Tech Stack

**Course:** COMP6703001 – Web Application Development and Security  
**Group:** [Your Group Name]  
**Submission Deadline:** 1 day before Week 2 Lab Session

---

## 1. Project Selection

**Domain:** Study Planner & Productivity Tracker (Option 10)  
**Application Name:** StudyPlanner AI

**Reason for selection:**  
Every student in our group faces the challenge of juggling multiple subjects, deadlines, and limited study time. Existing tools like Notion or Google Calendar require manual effort and offer no AI-driven guidance. StudyPlanner AI addresses this by combining intelligent task prioritization, burnout prevention, and adaptive scheduling into one coherent platform.

---

## 2. Architecture Decision: Modular Monolith

### What is it?
A single deployable application (one Next.js codebase + one PostgreSQL database) where internal concerns are separated into distinct modules — auth, tasks, sessions, goals, analytics, AI — each with their own routes, services, and data access patterns.

### Why not Microservices?
- Team size (3 people) doesn't justify orchestration overhead
- Single deployment is simpler to Docker-ize and CI/CD
- All features share the same database schema — no cross-service data sync needed
- Easier to debug and trace errors during development

### Why Modular Monolith over Simple Monolith?
- Clear separation of concerns (each feature is independently testable)
- Easier to split into microservices in the future if needed
- Enforces disciplined code organization for a team of 3

---

## 3. Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend | Next.js 14 (App Router) | SSR + CSR hybrid, file-based routing, React ecosystem |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, rapid UI development |
| Backend | Next.js API Routes (Node.js) | Co-located with frontend, same language, no CORS issues |
| ORM | Prisma | Type-safe database access, migration management |
| Database | PostgreSQL 16 | ACID compliance, strong JSON/array support, Prisma native |
| AI | OpenAI GPT-4o-mini API | Cost-efficient LLM, well-documented, JSON mode support |
| Auth | JWT (bcryptjs) + httpOnly cookies | Stateless, secure, industry standard |
| Validation | Zod | TypeScript-native schema validation |
| Testing | Jest + React Testing Library | Standard for Next.js projects |
| Containerization | Docker + Docker Compose | Required by course, production-grade |
| CI/CD | GitHub Actions | Automated test → build → deploy pipeline |
| DNS/SSL | Cloudflare | Free SSL, provided by lab instructor |

---

## 4. System Architecture Overview

```
Browser (Next.js React)
    │
    │ HTTPS
    ▼
Next.js App (Port 3000)
├── /app               ← React pages (SSR)
├── /app/api           ← REST API endpoints
│   ├── /auth          ← Authentication module
│   ├── /tasks         ← Task management module  
│   ├── /sessions      ← Study session module
│   ├── /goals         ← Goal tracking module
│   ├── /calendar      ← Calendar module
│   ├── /analytics     ← Analytics module
│   ├── /ai            ← AI features module
│   └── /notifications ← Notification module
│
├── /src/lib/db.ts     ← Prisma client (singleton)
├── /src/lib/auth.ts   ← JWT utilities
├── /src/lib/ai/       ← AI service functions
└── /src/middleware/   ← Auth, rate limit, sanitize
    │
    ▼
PostgreSQL DB (Port 5432)
    │
    ▼ (AI requests only)
OpenAI API (External)
```

---

## 5. Feature List (All Required Features for Option 10)

### Core Functional Features
1. ✅ Task and deadline management (create, edit, delete, status updates)
2. ✅ Calendar integration (events, scheduling, weekly view)
3. ✅ Study session timers (Pomodoro, deep work, with focus score)
4. ✅ Progress analytics dashboard (charts, streaks, subject breakdown)
5. ✅ Notifications and reminders (in-app, future: email/push)
6. ✅ User authentication and profile management

### AI Features (minimum 2)
1. ✅ **Smart Task Prioritization** — AI scores and ranks pending tasks
2. ✅ **Burnout & Overload Detection** — AI analyzes 7-day patterns, gives risk assessment + recommendations
3. ✅ **Study Schedule Optimization** — AI generates weekly plan (bonus 3rd feature)

### Security Features
1. ✅ Secure authentication (JWT, httpOnly cookies)
2. ✅ Role-based authorization (STUDENT vs ADMIN)
3. ✅ Input validation (Zod schemas) and output sanitization (XSS prevention)
4. ✅ Protection against SQL injection (Prisma parameterized queries)
5. ✅ Rate limiting on all endpoints (stricter on AI endpoints)
6. ✅ Secure API key handling (environment variables only)
7. ✅ Session management and timeout controls

---

## 6. Repository Setup

- GitHub Repository: `https://github.com/[your-org]/studyplanner-ai`
- Branch strategy:
  - `main` — production-ready code
  - `develop` — integration branch
  - `feature/*` — individual feature branches (e.g., `feature/task-crud`, `feature/ai-prioritize`)
  - `fix/*` — bug fix branches

---

*Prepared by Group [X] — Week 1*
