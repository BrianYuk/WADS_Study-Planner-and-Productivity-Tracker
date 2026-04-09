# Week 2 Submission – USR & SRS

**Course:** COMP6703001  
**Submission Deadline:** 1 day before Week 3 Lab Session

---

## Part A: User Specification Requirements (USR)

### A1. User Personas

---

#### Persona 1: Aditya – The Overwhelmed Junior

| Field | Detail |
|-------|--------|
| **Name** | Aditya Pratama |
| **Age** | 19 |
| **Role** | Second-year Computer Science student |
| **Tech Comfort** | High — uses smartphone and laptop daily |
| **Quote** | *"I have 6 subjects this semester and I keep forgetting which assignment is due when."* |

**Goals:**
- Track all deadlines in one place
- Know which task to work on next
- Avoid failing because he forgot something

**Pain Points:**
- Uses 3 different apps that don't talk to each other (Notion, WhatsApp reminders, phone calendar)
- Procrastinates on large tasks because he doesn't know how to break them down
- Studies 10+ hours during exam week, then crashes

**Behaviors:**
- Checks phone first thing in the morning
- Prefers visual dashboards over raw lists
- Responds well to gamification and progress bars

---

#### Persona 2: Siti – The Structured Planner

| Field | Detail |
|-------|--------|
| **Name** | Siti Rahayu |
| **Age** | 21 |
| **Role** | Final-year Business student, part-time intern |
| **Tech Comfort** | Medium — comfortable with web apps |
| **Quote** | *"I need to balance my internship, thesis, and 3 courses. I need something smart."* |

**Goals:**
- Optimize limited study time around work schedule
- Get AI suggestions for what to prioritize
- Track whether she's on track for semester goals

**Pain Points:**
- Available study slots are unpredictable (depends on work schedule)
- Doesn't trust herself to prioritize correctly under stress
- Burned out mid-semester last year without realizing it

**Behaviors:**
- Plans a week in advance every Sunday
- Wants data and charts to assess herself
- Takes AI suggestions seriously if explained with reasoning

---

#### Persona 3: Mr. Budi – The Admin/Educator

| Field | Detail |
|-------|--------|
| **Name** | Budi Santoso |
| **Age** | 35 |
| **Role** | Academic advisor / system administrator |
| **Tech Comfort** | Medium |

**Goals:**
- View aggregate usage statistics
- Manage system content and user accounts

**Pain Points:**
- No visibility into how students are using the tool

---

### A2. User Journey Maps

#### Journey 1: Aditya – "Getting today's tasks done"

```
Monday Morning
│
├── 1. OPEN APP (Dashboard)
│   └── Sees: "5 tasks due this week", burnout score: LOW ✅
│
├── 2. AI PRIORITIZE TASKS
│   └── Clicks "Let AI Prioritize" → AI returns ranked list
│       Top: "Data Structures Assignment" – due tomorrow, HIGH
│
├── 3. START STUDY SESSION
│   └── Selects task → clicks "Start Pomodoro Timer" (25 min)
│       Gets focus reminder notification
│
├── 4. LOG SESSION
│   └── Timer ends → prompted to log focus score (8/10)
│       Progress bar for today's goal updates
│
├── 5. MARK TASK COMPLETE
│   └── Task moved to COMPLETED, streak counter increments
│       Notification: "3-day study streak! 🔥"
│
└── Evening: Dashboard shows 2hr 30min studied, 2 tasks completed ✅
```

#### Journey 2: Siti – "Weekly planning session"

```
Sunday Evening
│
├── 1. OPEN CALENDAR VIEW
│   └── Sees upcoming week with blocked-out work hours
│
├── 2. ADD TASKS
│   └── Adds: Thesis Chapter 2, Marketing Quiz Prep, Internship Report
│
├── 3. REQUEST AI SCHEDULE
│   └── "Optimize my week" → AI considers tasks + free slots + priorities
│       AI returns: Mon 8-10 Thesis, Tue 7-9 Quiz Prep, etc.
│
├── 4. REVIEW BURNOUT CHECK
│   └── AI: "Your last 7 days show rising study hours. MEDIUM risk."
│       Recommendation: "Take Sunday afternoon off this week"
│
└── 5. SET WEEKLY GOALS
    └── Target: 20 study hours, 5 tasks completed
        Goal saved, progress tracked throughout week
```

---

## Part B: Software Requirements Specification (SRS)

### B1. Architecture Diagram

*(See `/docs/architecture-diagram.png` — insert diagram image here)*

```
[Client Browser]
      │ HTTPS
      ▼
[Next.js App — Port 3000]
│
├── [App Router Pages]
│   ├── / (Landing)
│   ├── /login, /register (Auth)
│   ├── /dashboard (Main hub)
│   ├── /tasks (Task management)
│   ├── /calendar (Calendar view)
│   ├── /sessions (Study timer)
│   ├── /analytics (Charts)
│   └── /settings (Profile/prefs)
│
├── [API Routes /api/*]
│   ├── auth module
│   ├── tasks module
│   ├── sessions module
│   ├── goals module
│   ├── ai module (→ OpenAI API)
│   └── analytics module
│
└── [Prisma ORM]
      │
      ▼
[PostgreSQL Database]
```

---

### B2. Use Case Diagram (Text Format)

**Actors:** Student, Admin, AI System (external)

**Student Use Cases:**
- UC-01: Register / Login / Logout
- UC-02: Manage Tasks (CRUD + status updates)
- UC-03: Log Study Sessions (start timer, record focus)
- UC-04: Set and Track Goals
- UC-05: View Calendar and Schedule Events
- UC-06: View Analytics Dashboard
- UC-07: Request AI Task Prioritization
- UC-08: View AI Burnout Analysis
- UC-09: Request AI Schedule Optimization
- UC-10: Manage Notifications
- UC-11: Update Profile and Preferences

**Admin Use Cases (extends Student):**
- UC-12: View All Users
- UC-13: Manage System Notifications

---

### B3. Activity Diagram – Task Prioritization Flow

```
Student opens Tasks page
        │
        ▼
System loads tasks from DB
        │
        ▼
Student clicks "AI Prioritize"
        │
        ▼
System checks rate limit (20/hr)
    ┌──────────────────────────┐
    │ Rate limit exceeded?     │
    └──────────────────────────┘
    No ↓               Yes → Return 429 error
        │
        ▼
Fetch pending tasks from DB
        │
        ▼
Send to OpenAI API with structured prompt
        │
    ┌──────────────────────────┐
    │ AI response OK?          │
    └──────────────────────────┘
    Yes ↓              No → Use fallback ordering
        │
        ▼
Parse JSON response
        │
        ▼
Save aiScore to each task in DB
        │
        ▼
Return sorted tasks to frontend
        │
        ▼
Dashboard re-renders with AI-ordered list
        │
        ▼
Log AIAnalysis record for audit
```

---

### B4. Class Diagram (Domain Model)

```
┌─────────────────────┐       ┌──────────────────────┐
│ User                │       │ Task                 │
├─────────────────────┤       ├──────────────────────┤
│ id: String (UUID)   │       │ id: String (UUID)    │
│ email: String       │1    * │ userId: String (FK)  │
│ name: String        │───────│ title: String        │
│ role: Role          │       │ priority: Priority   │
│ timezone: String    │       │ status: TaskStatus   │
│ createdAt: DateTime │       │ dueDate: DateTime?   │
└─────────────────────┘       │ aiPriority: Float?   │
         │ 1                  │ estimatedMins: Int?  │
         │                    └──────────────────────┘
         │ *                           │ 1
         │                             │ *
┌────────▼────────────┐       ┌────────▼─────────────┐
│ StudySession        │       │ Subtask              │
├─────────────────────┤       ├──────────────────────┤
│ id: String          │       │ id: String           │
│ userId: String (FK) │       │ taskId: String (FK)  │
│ taskId: String? FK  │       │ title: String        │
│ durationMins: Int?  │       │ completed: Boolean   │
│ focusScore: Int?    │       └──────────────────────┘
│ type: SessionType   │
└─────────────────────┘

┌─────────────────────┐       ┌──────────────────────┐
│ Goal                │       │ AIAnalysis           │
├─────────────────────┤       ├──────────────────────┤
│ id: String          │       │ id: String           │
│ userId: String (FK) │       │ userId: String (FK)  │
│ title: String       │       │ type: AIType         │
│ targetValue: Float  │       │ input: Json          │
│ currentValue: Float │       │ output: Json         │
│ type: GoalType      │       │ latencyMs: Int?      │
│ status: GoalStatus  │       │ createdAt: DateTime  │
└─────────────────────┘       └──────────────────────┘
```

---

*Prepared by Group [X] — Week 2*
