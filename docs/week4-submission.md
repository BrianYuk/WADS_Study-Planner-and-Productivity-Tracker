# Week 4 Submission – Frontend & Unit Testing

**Course:** COMP6703001 – Web Application Development and Security  
**Submission Deadline:** 1 day before Week 5 Lab Session

---

## Overview

This week covers **frontend component testing** and **unit testing** for StudyPlanner AI. Tests are written using **Jest** and **React Testing Library**, following the AAA pattern (Arrange, Act, Assert).

---

## Test Files

| File | Coverage Area | Tests |
|------|--------------|-------|
| `tests/frontend/LandingPage.test.tsx` | Landing page rendering & links | 8 |
| `tests/frontend/LoginPage.test.tsx` | Login form, validation, API | 15 |
| `tests/frontend/RegisterPage.test.tsx` | Register form, validation, strength | 15 |
| `tests/frontend/DashboardPage.test.tsx` | Dashboard, navigation, timer, settings | 27 |
| `tests/unit/auth.test.ts` | Auth utilities, sanitization, rate limiting | 11 |
| `tests/unit/aiFeatures.test.ts` | AI prioritization & burnout detection | 11 |
| **Total** | | **87 tests** |

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run only frontend tests
npx jest tests/frontend

# Run only unit tests
npx jest tests/unit

# Watch mode (re-runs on file save)
npm run test:watch
```

---

## Test Categories

### Frontend Tests (React Testing Library)

#### Landing Page (`LA-01` to `LA-08`)
Tests that the marketing page renders correctly with all CTAs, feature cards, stats, and navigation links.

#### Login Page (`LP-01` to `LP-15`)
- **Rendering:** All form elements present
- **Validation:** Empty fields, invalid email, missing password
- **Interactions:** Password toggle, demo credentials autofill
- **API Integration:** Loading state, successful redirect, error display, network failure

#### Register Page (`RP-01` to `RP-15`)
- **Rendering:** All form fields, checkbox, submit button
- **Validation:** Short name, invalid email, weak password, mismatched passwords, missing terms
- **Password Strength:** Weak/Fair/Good/Strong indicator, match indicator
- **API Integration:** Success redirect, duplicate email error

#### Dashboard Page (`DB-01` to `DB-27`)
- **Rendering:** Greeting, AI banner, stat cards, sidebar, topbar
- **Navigation:** All 6 sections accessible via sidebar
- **Timer:** Default 25:00, mode switching (Deep Work/Break), start/pause/reset
- **Tasks:** Kanban columns visible
- **Goals:** Progress bars, new goal form open/close
- **Settings:** Profile tab default, tab switching, danger zone

---

### Unit Tests

#### Auth Utilities (`auth.test.ts`)
- `isValidPassword` — accepts strong, rejects weak/missing requirements
- `hashPassword` / `comparePassword` — bcrypt round-trip verification
- `sanitizeInput` — XSS stripping, HTML entity escaping, SQL injection handling
- `checkRateLimit` — allows within limit, blocks over limit, independent keys

#### AI Features (`aiFeatures.test.ts`)
- Task prioritization — valid input, empty list, AI timeout, malformed JSON, prompt injection, large list
- Burnout detection — healthy/overworked patterns, AI failure fallback, new user edge case, consistency

---

## Test Design Principles

1. **Isolation** — each test is independent, `beforeEach` clears all mocks
2. **Mocking** — Next.js router, fetch API, and OpenAI are mocked to avoid real network calls
3. **User-centric** — frontend tests use `userEvent` to simulate real user interactions
4. **Edge cases** — empty inputs, network failures, AI failures, and malformed responses all tested
5. **AAA Pattern** — Arrange (setup), Act (interaction), Assert (expectation)

---

## Coverage Targets

| Area | Target |
|------|--------|
| Frontend pages | ≥ 80% |
| Auth utilities | 100% |
| AI service | ≥ 90% |
| API middleware | ≥ 85% |

---

*Prepared by Group [X] — Week 4*
