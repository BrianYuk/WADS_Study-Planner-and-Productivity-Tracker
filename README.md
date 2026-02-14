# Smart Study Planner & Productivity Tracker

## Course Information
- **Course Code:** COMP6703001  
- **Course Name:** Web Application Development and Security  
- **Institution:** BINUS University International  

---

## 1. Project Information

### Project Title
**Smart Study Planner & Productivity Tracker**

### Project Domain
Study Planner & Productivity Tracker

### Class
L4CC

### Group Members 

| Name | Student ID | Role | GitHub Username |
|------|-----------|------|----------------|
| Brian Yuktipada | 2802523004 |  | BrianYuk |
| William Ekapanna Rusmana | 2802523111 |  | WILLIAM-RUSMANA |
| Yifan Zhou | 2802572246 |  | yfz373 |

---

## 2. Instructor & Repository Access

This repository is shared with:

- **Instructor:** Ida Bagus Kerthyayana Manuaba  
  - Email: imanuba@binus.edu  
  - GitHub: bagscode  

- **Instructor Assistant:** Juwono  
  - Email: juwono@binus.edu  
  - GitHub: Juwono136  

---

## 3. Project Overview

### 3.1 Problem Statement

Many students face difficulties in managing their study schedules effectively due to poor task prioritization, lack of structured planning, and absence of productivity insights. Traditional planners rely heavily on manual input and do not adapt to dynamic academic workloads.

**Target Users:**
- University students  
- High school students  
- Independent learners  

---

### 3.2 Solution Overview

This project proposes a **web-based study planner and productivity tracker** that assists users in organizing tasks, scheduling study sessions, and receiving AI-generated study plans.

**Main Features:**
- Task and study session management  
- Deadline-based task prioritization  
- AI-generated study plans  
- Secure user authentication  

**Why This Solution Is Appropriate:**
- Reduces manual planning effort  
- Improves productivity through intelligent recommendations  
- Accessible via web browser  

**AI Usage:**
- Study plan generation  
- Task prioritization based on deadlines and workload  

---

## 4. Technology Stack 

| Layer | Technology |
|-------|------------|
| Frontend | Next.js |
| API Gateway | Node.js (Express) |
| Auth Service | Node.js (Express) |
| Task Service | Node.js (Express) |
| Planner Service | Node.js (Express) |
| Communication | REST API |
| Database (Auth) | PostgreSQL |
| Database (Task) | PostgreSQL |
| Database (Planner) | PostgreSQL |
| Containerization | Docker |
| Deployment (Frontend) | Vercel |
| Deployment (Services + DB) | Railway |
| Version Control | GitHub |

---

## 5. System Architecture

Microservices Architecture is used for the study planner & productivity tracker’s architecture because the application is designed to support scalable, modular, and independently deployable services focused on the following:

- User Authentication Service  
- Study Planning Service  
- Assignment Tracking Service  
- Notification Service  
- AI Recommendation Service  

Each feature is implemented as an independent microservice with its own backend logic and dedicated PostgreSQL database. These services communicate through REST APIs, ensuring separation of concerns and better maintainability.

---

### Conclusion on Microservices Architecture

Chosen because it is:

- Scalable — each service can scale independently based on demand  
- Modular — services can be developed, deployed, and maintained separately  
- Fault-Isolated — failure in one service does not affect the entire system  
- Flexible — allows future integration of new technologies or services  
- Suitable for long-term growth and feature expansion  


### 5.1 Architecture Diagram

---

## 6. API Design
### 6.1 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET |  |  | Y/N |
| POST |  |  | Y/N |
| PUT |  |  | Y/N |
| DELETE |  |  | Y/N |


### 6.2 API Documentation


---

## 7. Database Design 
### 7.1 Database Choice


### 7.2 Schema / Data Structure 

