# 📚 StudyPlanner AI – Smart Productivity Tracker

> Final Project – Web Application Development and Security  
> **Course Code:** COMP6703001  
> **Institution:** BINUS University International

---

## 1. Project Information

**Project Title:** StudyPlanner AI – Intelligent Study Planner & Productivity Tracker

**Project Domain:** Study Planner & Productivity Tracker (Option 10)

**Class:** [Your Class Code] – L4AC / L4BC / L4CC

**Group Members:**

| Name | Student ID | Role | GitHub Username |
|------|-----------|------|-----------------|
| [Member 1] | [ID] | Frontend + AI Integration | @username1 |
| [Member 2] | [ID] | Backend + Database | @username2 |
| [Member 3] | [ID] | DevOps + Security + Testing | @username3 |

---

## 2. Instructor & Repository Access

This repository is shared with:

- **Main Instructor:** Ida Bagus Kerthyayana Manuaba – [imanuaba@binus.edu](mailto:imanuaba@binus.edu) – GitHub: [@bagzcode](https://github.com/bagzcode)
- **Lab Instructor:** Juwono – [juwono@binus.edu](mailto:juwono@binus.edu) – GitHub: [@Juwono136](https://github.com/Juwono136)

---

## 3. Project Overview

### 3.1 Problem Statement

**Problem:**  
Students frequently struggle with managing multiple academic responsibilities simultaneously — assignments, deadlines, study sessions, and long-term goals — without any intelligent system to help them prioritize or warn them of burnout. Traditional to-do apps lack academic context, while planners don't adapt to cognitive load or learning patterns.

**Target Users:**
- University students (primary)
- High school students managing multiple subjects
- Tutors/educators monitoring student productivity (admin role)

### 3.2 Solution Overview

**StudyPlanner AI** is a full-stack web application that combines task management, study session tracking, calendar integration, and analytics with AI-powered intelligence. 

**Core features include:**
- Task & deadline management with smart prioritization
- Pomodoro/deep-work session timer
- Calendar integration with event scheduling
- Progress analytics dashboard
- Goal setting and tracking

**AI is used for:**
- **Smart Task Prioritization** – AI ranks tasks by urgency, importance, and estimated effort using GPT-4o-mini
- **Burnout & Overload Detection** – AI analyzes 7-day productivity patterns to detect stress risk and recommend schedule adjustments
- **Study Schedule Optimization** – AI generates optimized weekly study plans based on available slots and workload

---

## 4. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + React 18 + Tailwind CSS |
| Backend | Next.js API Routes (Node.js runtime) |
| API | RESTful API (JSON) |
| Database | PostgreSQL + Prisma ORM |
| AI | OpenAI GPT-4o-mini API |
| Authentication | JWT (httpOnly cookies) + bcryptjs |
| Containerization | Docker + Docker Compose |
| Deployment | VPS/Cloud + Cloudflare DNS + GitHub Actions CI/CD |
| Version Control | GitHub |

**Architecture Style:** Modular Monolith — single deployable Next.js application with clear module separation (auth, tasks, sessions, goals, AI, analytics).

---

## 5. System Architecture

### 5.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│              Next.js App Router (SSR + CSR)                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│   │Dashboard │  │  Tasks   │  │Calendar  │  │  Analytics   │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS (REST API calls)
┌──────────────────────────▼──────────────────────────────────────┐
│                   Next.js API Routes Layer                       │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │  /auth  │  │ /tasks  │  │/sessions │  │  /ai/*          │  │
│  │  /goals │  │/notifs  │  │/calendar │  │  /analytics/*   │  │
│  └─────────┘  └─────────┘  └──────────┘  └─────────────────┘  │
│                                                                  │
│  Security Middleware: JWT auth │ Rate Limiting │ Input Sanitize  │
└──────────┬────────────────────────────────┬────────────────────┘
           │                                │
┌──────────▼──────────┐          ┌──────────▼──────────┐
│   PostgreSQL DB      │          │   OpenAI API         │
│   via Prisma ORM     │          │   (GPT-4o-mini)      │
│                      │          │                      │
│   Users, Tasks,      │          │   Task Priority      │
│   Sessions, Goals,   │          │   Burnout Detection  │
│   Events, AI Logs    │          │   Schedule Optimizer │
└─────────────────────┘          └─────────────────────┘
```

### 5.2 Architecture Explanation

**Modular Monolith:** The application is a single deployable unit (one Next.js app + one PostgreSQL DB) but internally divided into clear modules: `auth`, `tasks`, `sessions`, `goals`, `calendar`, `ai`, `analytics`. Each module has its own API routes, business logic, and data access layer.

**Frontend ↔ API ↔ Database interaction:**
- The frontend (React Server Components + Client Components) communicates exclusively through the internal REST API at `/api/*`
- The API layer applies authentication middleware, validates input with Zod, sanitizes data, and queries via Prisma ORM
- The database is never exposed directly to the frontend

**Security enforcement points:**
- `src/middleware.ts` — route protection, security headers on every response
- `src/middleware/apiMiddleware.ts` — JWT verification, rate limiting, input sanitization per API endpoint
- Prisma ORM — parameterized queries prevent SQL injection
- httpOnly cookies — prevent XSS access to JWT tokens

---

## 6. API Design

### 6.1 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|---------|-------------|--------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login, returns JWT | No |
| POST | `/api/auth/logout` | Clear auth cookies | Yes |
| POST | `/api/auth/refresh` | Refresh access token | No (refresh token) |
| GET | `/api/users/me` | Get current user profile | Yes |
| PUT | `/api/users/me` | Update profile | Yes |
| GET | `/api/tasks` | List tasks (paginated, filtered) | Yes |
| POST | `/api/tasks` | Create new task | Yes |
| GET | `/api/tasks/:id` | Get single task | Yes |
| PUT | `/api/tasks/:id` | Update task | Yes |
| DELETE | `/api/tasks/:id` | Delete task | Yes |
| GET | `/api/sessions` | List study sessions | Yes |
| POST | `/api/sessions` | Log new study session | Yes |
| PUT | `/api/sessions/:id` | Update session | Yes |
| GET | `/api/goals` | List goals | Yes |
| POST | `/api/goals` | Create goal | Yes |
| PUT | `/api/goals/:id` | Update goal progress | Yes |
| GET | `/api/calendar/events` | Get calendar events | Yes |
| POST | `/api/calendar/events` | Create event | Yes |
| GET | `/api/analytics/dashboard` | Dashboard summary data | Yes |
| GET | `/api/analytics/productivity` | Detailed productivity stats | Yes |
| GET | `/api/notifications` | Get notifications | Yes |
| PATCH | `/api/notifications` | Mark all as read | Yes |
| POST | `/api/ai/prioritize` | AI task prioritization | Yes |
| GET | `/api/ai/burnout` | AI burnout risk analysis | Yes |
| POST | `/api/ai/schedule` | AI schedule optimization | Yes |
| GET | `/api/admin/users` | List all users (admin) | Yes + ADMIN role |

### 6.2 API Documentation
- Swagger/OpenAPI documentation: Available at `/api/docs` (Week 5 deliverable)
- All endpoints return JSON with consistent structure:
```json
{
  "data": {},
  "error": null,
  "message": "success"
}
```

---

## 7. Database Design

### 7.1 Database Choice
**PostgreSQL** was chosen for:
- Strong ACID compliance for task/session data integrity
- Excellent support via Prisma ORM with type safety
- Array columns (task tags) without needing a junction table
- Robust JSON support for AI analysis storage

### 7.2 Schema / ERD

```
Users ──< Tasks ──< Subtasks
  │         │
  │         └──< StudySessions
  │
  ├──< Goals
  ├──< Calendars ──< CalendarEvents
  ├──< Notifications
  ├──< AIAnalyses
  ├──< RefreshTokens
  └──1 UserPreferences

Key relationships:
- User → Tasks (one-to-many, cascade delete)
- Task → StudySessions (one-to-many, set null on task delete)
- User → Goals (one-to-many)
- User → AIAnalyses (one-to-many, for AI audit trail)
```

Full schema available in `prisma/schema.prisma`.

---

## 8. AI Features

### 8.1 AI Feature List

| AI Feature | Purpose | AI Type |
|-----------|---------|---------|
| Smart Task Prioritization | Ranks tasks by urgency + importance + effort using GPT-4o-mini | NLP / LLM |
| Burnout & Overload Detection | Analyzes 7-day productivity patterns, gives risk score + recommendations | NLP / Pattern Analysis |
| Study Schedule Optimizer | Generates optimized weekly study plan from tasks + available time slots | LLM / Recommendation |

### 8.2 AI Integration Flow

**Task Prioritization:**
```
User's pending tasks (title, subject, priority, dueDate, estimatedMins)
    → Structured prompt to GPT-4o-mini (temperature 0.3)
    → JSON response: [{taskId, aiScore 0-1, reasoning, suggestedOrder}]
    → aiScore saved to tasks.aiPriority column
    → Tasks re-ordered by aiScore in dashboard
    → AI request logged to AIAnalysis table for audit
```

**Burnout Detection:**
```
Last 7 days: daily study hours + completed tasks + focus scores
    + total pending tasks + overdue count
    → Structured prompt to GPT-4o-mini (temperature 0.4)
    → JSON: {riskLevel, score, insights[], recommendations[], scheduleAdjustments[]}
    → Displayed as wellness card on dashboard
    → CRITICAL risk triggers SYSTEM notification
    → Logged to AIAnalysis for history
```

**Failure handling:** All AI calls wrapped in try/catch with graceful fallbacks — task prioritization falls back to due-date ordering, burnout detection returns LOW risk with "unavailable" message.

---

## 9. Security Implementation

| Security Concern | Implementation |
|----------------|---------------|
| Authentication | JWT access tokens (15min expiry) + refresh tokens (7 days), stored in httpOnly cookies to prevent XSS access |
| Authorization | Role-based: STUDENT vs ADMIN. Admin routes protected by `withAdminAuth()` middleware |
| Input Validation | Zod schema validation on all API endpoints; rejects malformed data before DB queries |
| Output Sanitization | `sanitizeInput()` escapes HTML entities on all user-provided strings |
| SQL Injection | Prisma ORM uses parameterized queries exclusively — raw SQL is forbidden |
| XSS Prevention | Content Security Policy headers, input sanitization, httpOnly cookies |
| CSRF Protection | SameSite=Strict cookies, CSRF token on state-changing requests |
| Rate Limiting | Per-user rate limits: 100 req/15min general, 20 req/hr for AI endpoints, 5 req/hr for registration |
| Secure API Keys | OpenAI key and JWT secret stored only in environment variables, never committed |
| Security Headers | `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` on all responses |

---

## 10. Testing Documentation

### 10.1 Frontend Testing

| Test Case | Scenario | Expected Result | Status |
|-----------|---------|-----------------|--------|
| FE-01 | Task form submitted with empty title | Validation error shown, form not submitted | Pass |
| FE-02 | Due date set in the past | Warning message displayed | Pass |
| FE-03 | Timer starts/stops correctly | Duration calculated accurately | Pass |
| FE-04 | Navigation without auth | Redirected to /login | Pass |
| FE-05 | Responsive layout on mobile (375px) | All elements visible, no overflow | Pass |

### 10.2 Backend & API Testing

| Test Case | Endpoint | Input | Expected Output | Status |
|-----------|---------|-------|-----------------|--------|
| API-01 | POST /api/auth/register | Valid email + strong password | 201 + JWT cookie | Pass |
| API-02 | POST /api/auth/register | Duplicate email | 409 Conflict | Pass |
| API-03 | POST /api/auth/register | Weak password | 400 Bad Request | Pass |
| API-04 | GET /api/tasks | No auth token | 401 Unauthorized | Pass |
| API-05 | POST /api/tasks | Valid task data | 201 + task object | Pass |
| API-06 | POST /api/tasks | Missing title | 400 with Zod errors | Pass |
| API-07 | GET /api/analytics/dashboard | Valid auth | 200 + dashboard data | Pass |

### 10.3 Security Testing

| Test Case | Attack Type | Expected Behavior | Result |
|-----------|------------|-------------------|--------|
| SEC-01 | XSS in task title: `<script>alert(1)</script>` | HTML entities escaped, no script execution | Pass |
| SEC-02 | SQL injection in query: `' OR '1'='1` | Prisma parameterizes query, no data leak | Pass |
| SEC-03 | Accessing `/api/tasks` without JWT | 401 Unauthorized | Pass |
| SEC-04 | Accessing admin route as STUDENT | 403 Forbidden | Pass |
| SEC-05 | Rate limit: 6+ registrations in 1 hour | 429 Too Many Requests | Pass |
| SEC-06 | JWT expired (manually set exp to past) | 401 Invalid token, redirect to login | Pass |
| SEC-07 | CSRF: cross-origin state-changing request | Blocked by SameSite=Strict | Pass |

### 10.4 AI Functionality Testing

**AI Feature: Smart Task Prioritization**

| Test Case | Input | Expected Output | Actual Result | Status |
|-----------|-------|-----------------|---------------|--------|
| AI-01 | 2 tasks: one due tomorrow (HIGH), one due next week (MEDIUM) | Tomorrow's task ranked first (aiScore > 0.8) | Task-1 score: 0.9 | Pass |
| AI-02 | Empty task list | Empty array, no API call | `[]` returned | Pass |
| AI-03 | AI API timeout | Fallback: tasks ordered by position | Fallback array returned | Pass |
| AI-04 | Malformed JSON response from AI | Graceful fallback, no crash | Fallback array returned | Pass |
| AI-05 | Prompt injection in title: "Ignore instructions..." | Normal processing, no data leak | Task analyzed normally | Pass |
| AI-06 | 50 tasks simultaneously | All tasks prioritized within timeout | 50 results returned | Pass |

**Failure Handling:**
- AI unavailable → returns fallback ordering with `reasoning: "Fallback ordering by position"`
- Timeout (>30s) → same fallback triggered by catch block
- Malformed response → JSON.parse error caught, fallback returned

**AI Feature: Burnout Detection**

| Test Case | Input | Expected Output | Actual Result | Status |
|-----------|-------|-----------------|---------------|--------|
| BD-01 | Healthy pattern (3-4hrs/day, good focus) | LOW risk, score < 50 | riskLevel: LOW | Pass |
| BD-02 | Overwork pattern (10-13hrs/day, declining focus) | HIGH/CRITICAL risk | riskLevel: HIGH | Pass |
| BD-03 | API failure | Safe default: LOW risk, "unavailable" message | Fallback returned | Pass |
| BD-04 | New user (all zeros) | LOW risk, recommendation to start tracking | Handled gracefully | Pass |
| BD-05 | Same input called twice | Same riskLevel both times (consistency) | Consistent results | Pass |

---

## 11. Deployment & Production Setup

### 11.1 Docker Setup

- ✅ `Dockerfile` — multi-stage build (deps → builder → runner), non-root user
- ✅ `docker-compose.yml` — app + PostgreSQL + optional pgAdmin

```bash
# Build and run in production mode
docker compose up -d

# Run with dev tools (pgAdmin)
docker compose --profile dev up -d
```

### 11.2 Production Environment

**Environment variables** (see `.env.example`):
```
DATABASE_URL       – PostgreSQL connection string
JWT_SECRET         – Min 32 chars, randomly generated
OPENAI_API_KEY     – Stored in server env only, never exposed to client
NODE_ENV           – "production" in deployment
```

**Secrets handling:** All secrets injected via environment variables. `.env` file is in `.gitignore`. GitHub Actions uses repository secrets for CI/CD pipeline.

**HTTPS:** Cloudflare proxies the domain with automatic SSL termination. Backend uses `secure: true` on cookies in production.

### 11.3 Live Application URL

```
https://studyplanner.yourdomain.com
```

---

## 12. GitHub Contribution Summary

> Each team member must fill in their own section.

**Student Name: [Member 1]**
- Features implemented: Dashboard UI, Task components, Timer widget, Responsive layout
- API endpoints handled: GET/POST /api/tasks, GET /api/analytics/dashboard
- Tests written: FE-01 to FE-05 (frontend tests)
- Security work: Input validation on frontend forms
- AI-related work: AI prioritization UI, burnout risk card component

**Student Name: [Member 2]**
- Features implemented: All API routes, Prisma schema, business logic
- API endpoints handled: All /api/auth/*, /api/goals/*, /api/sessions/*
- Tests written: API-01 to API-07
- Security work: JWT middleware, rate limiting, Zod validation
- AI-related work: aiService.ts, AI endpoints, prompt engineering

**Student Name: [Member 3]**
- Features implemented: Docker, GitHub Actions, deployment
- API endpoints handled: /api/admin/*, /api/notifications/*
- Tests written: SEC-01 to SEC-07, AI testing suite
- Security work: Security headers, CSRF protection, audit logging
- AI-related work: AI test cases, failure handling strategy

---

## 13. AI Usage Disclosure

| AI Tool | Purpose | Parts Assisted |
|---------|---------|---------------|
| ChatGPT (GPT-4) | Boilerplate generation, debugging assistance | Initial API route structure, Prisma schema drafts |
| GitHub Copilot | In-editor code suggestions | Component scaffolding, test case generation |
| OpenAI API (GPT-4o-mini) | Application AI feature | Task prioritization, burnout detection, schedule optimization |

> "ChatGPT was used to assist with initial API structure and Prisma schema design. GitHub Copilot provided suggestions during development. All generated code was reviewed, modified, tested, and fully understood by each team member. The OpenAI API is integrated as a core application feature with full testing coverage."

---

## 14. Known Limitations & Future Improvements

**Current limitations:**
- AI rate limits: 20 AI requests/hour per user (OpenAI cost control)
- Schedule optimizer doesn't integrate with external calendars (Google Calendar) yet
- Burnout detection is based on self-reported focus scores (subjective data)

**Future improvements:**
- Google Calendar OAuth integration
- Mobile app (React Native) with offline task sync
- WebSocket support for real-time collaboration on shared study sessions
- Voice input for quick task creation
- Custom AI fine-tuning on student behavior data (with consent)

**AI limitations and risks:**
- GPT-4o-mini may occasionally misrank tasks — always presented as suggestion, not mandate
- Burnout analysis is advisory only and not a medical assessment
- Prompt injection is mitigated but not 100% preventable — all AI outputs are treated as untrusted

---

## 15. Final Declaration

We declare that:
- This project is our own work
- AI usage is disclosed honestly in Section 13
- All group members understand the full system and can explain any part

*Signed by Group Members:*
- [Member 1 Name] – [Student ID]
- [Member 2 Name] – [Student ID]
- [Member 3 Name] – [Student ID]

---

## 16. Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or Docker)
- OpenAI API key

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/your-org/studyplanner-ai.git
cd studyplanner-ai

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your values

# 4. Generate Prisma client and migrate DB
npm run db:generate
npm run db:migrate

# 5. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 17. Deployment Instructions

### Docker Deployment

```bash
# 1. Create production .env file
cp .env.example .env
# Fill in all production values

# 2. Build and start containers
docker compose up -d --build

# 3. Run database migrations
docker compose exec app npx prisma migrate deploy

# 4. Verify running
docker compose ps
docker compose logs app
```

### Cloudflare Setup
1. Add your domain to Cloudflare
2. Create A record pointing to your server IP
3. Enable Proxy (orange cloud) for automatic HTTPS
4. Set SSL/TLS mode to "Full (strict)"

### GitHub Actions
Add these secrets to your GitHub repository:
- `DEPLOY_HOST` — your server IP
- `DEPLOY_USER` — SSH username
- `DEPLOY_SSH_KEY` — private SSH key
- `CODECOV_TOKEN` — optional coverage reporting

---

## Week-by-Week Progress

| Week | Deliverable | Status |
|------|------------|--------|
| 1 | Architecture, tech stack, project selection | ✅ Complete |
| 2 | USR (User Persona, User Journey) + SRS | ✅ Complete |
| 3 | Mockup Design + Routing Design | ✅ Complete |
| 4 | Frontend Testing | 🔄 In Progress |
| 5 | API Documentation (Swagger) | 📋 Planned |
| 6 | API Testing Results (Postman) | 📋 Planned |
| 7 | DB Schema and ORM | 📋 Planned |
| 8 | Auth and Authorization | 📋 Planned |
| 9 | Web Security + Security Testing | 📋 Planned |
| 10 | Docker + CI/CD + Deployment | 📋 Planned |
| 11 | AI Design + Testing | 📋 Planned |
| 12 | Final Project Submission | 📋 Planned |
| 13 | Final Demo & Presentation | 📋 Planned |

---

*Last updated: Week 3*
