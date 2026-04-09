# Week 3 Submission – Mockup Design & Routing

**Course:** COMP6703001  
**Submission Deadline:** 1 day before Week 4 Lab Session

---

## Part A: Routing Design

### Page Routes (Next.js App Router)

| Route | Page | Auth Required | Description |
|-------|------|--------------|-------------|
| `/` | Landing | No | Marketing page, login/register CTAs |
| `/login` | Login | No (redirect if authed) | Email + password form |
| `/register` | Register | No (redirect if authed) | Registration form |
| `/dashboard` | Dashboard | Yes | Main hub: tasks, AI insights, stats |
| `/tasks` | Tasks | Yes | Full task list with filters |
| `/tasks/new` | Create Task | Yes | Task creation form |
| `/tasks/[id]` | Task Detail | Yes | Task detail + subtasks |
| `/tasks/[id]/edit` | Edit Task | Yes | Edit task form |
| `/sessions` | Study Sessions | Yes | Timer + session history |
| `/calendar` | Calendar | Yes | Weekly/monthly calendar view |
| `/analytics` | Analytics | Yes | Charts, productivity trends |
| `/goals` | Goals | Yes | Goal list + progress |
| `/goals/new` | Create Goal | Yes | Goal creation form |
| `/settings` | Settings | Yes | Profile, preferences, notifications |
| `/admin` | Admin Panel | Yes (ADMIN only) | User management |

### API Routes (/api/*)

See README.md Section 6.1 for full API endpoint table.

---

## Part B: Mockup Design Description

> Actual high-fidelity mockup files: `/docs/mockups/` (Figma export)  
> Live interactive preview: See the HTML mockup artifact

### Design Direction: "Clean Focus" 

**Aesthetic:** Calm, focused productivity — deep navy background with warm amber accents. Inspired by nighttime study mode. Card-based layout, generous whitespace, subtle glassmorphism panels.

**Color Palette:**
- Background: `#0f1117` (near-black navy)
- Surface cards: `#1a1d2e` with subtle border
- Primary accent: `#f59e0b` (amber)
- Success: `#10b981` (emerald)
- Danger: `#ef4444` (red)  
- Text: `#e2e8f0` (light)
- Muted text: `#64748b`

**Typography:**
- Display: DM Sans (bold headings)
- Body: Inter
- Mono (timer, scores): JetBrains Mono

---

### Screen Designs:

#### 1. Dashboard (`/dashboard`)
- **Top bar:** App logo, notification bell (badge), user avatar
- **Left sidebar:** Navigation links with icons
- **Main area:**
  - Greeting card: "Good morning, Aditya 👋" + today's date
  - AI Insight banner: Burnout risk card (color-coded LOW/MEDIUM/HIGH/CRITICAL)
  - 4 stat cards: Today's study time, Tasks completed, Study streak, Weekly goal progress
  - Priority task list (AI-ranked top 5 tasks with "AI Pick" badge on top)
  - Quick-start timer button: "Start a session →"
  - Study streak calendar (GitHub-contribution style heatmap)

#### 2. Tasks Page (`/tasks`)
- Kanban board view with 3 columns: TODO | IN PROGRESS | COMPLETED
- Filter bar: Subject, Priority, Due date range
- "AI Prioritize" button (prominent, with AI icon)
- Each task card shows: title, subject badge, priority dot, due date, AI score bar
- Drag-and-drop reordering (manual override of AI order)

#### 3. Study Timer (`/sessions`)
- Large circular timer display (Pomodoro/deep work mode toggle)
- Task selector dropdown ("What are you working on?")
- Subject field
- Start/Pause/Stop buttons
- Below timer: today's completed sessions table
- Focus score slider appears when session ends

#### 4. Analytics (`/analytics`)
- Weekly study hours bar chart (recharts)
- Focus score trend line
- Subject breakdown donut chart
- Productivity heatmap (7x24 grid showing study patterns by day/hour)
- AI analysis history (expandable cards)

#### 5. Calendar (`/calendar`)
- Full calendar with month/week view toggle
- Tasks with due dates shown as event blocks
- Study sessions shown as colored blocks
- "Add event" button opens modal
- AI schedule overlay toggle (shows AI-suggested study slots)

---

*Prepared by Group [X] — Week 3*
