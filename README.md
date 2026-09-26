# CodeSphere — Advanced Programming Learning & Assessment Portal

CodeSphere is a production-style, full-stack programming learning, coding practice, and assessment platform.

## 🚀 Key Features

1. **Authentication & User Roles**: Student and Admin roles, Registration, Login with Email or Username, Password verification, and 4-step Onboarding.
2. **Student Dashboard**: Live stats (enrolled languages, lessons completed, challenges solved, assessment attempts/passes, average score, streak counter, total learning time), Continue Learning progress, Daily Goal Target, and Recharts performance visualizations.
3. **Explore 14 Languages**: Python, Java, JavaScript, C, C++, C#, SQL, HTML, CSS, TypeScript, PHP, Go, Kotlin, Ruby with cards, search, category/difficulty filters.
4. **Structured Curriculum & Lessons**: Beginner, Intermediate, and Advanced courses, lesson reader, Monaco Editor "Try It Yourself" snippet runner, knowledge check quizzes, and explicit "Mark as Completed" progress persistence.
5. **Interactive Coding Practice**: Monaco Editor workbench, test cases, problem statements, hints, solution runner, and submission history drawer.
6. **10-Question Assessment & Retest Engine**: 
   - Exactly 10 multiple-choice questions, 1 mark per question, passing threshold = 7/10 (70%).
   - Server-side grading with answer key protection before submission.
   - **Retest Question Exclusion**: Failed retests algorithmically exclude questions served in previous attempt(s), drawing 10 fresh unused questions from the 420+ item question bank.
7. **Achievements & Opt-in Leaderboard**: Verified badge triggers and weekly rankings.
8. **Admin Portal**: Stats overview, Course & Lesson CRUD, Question Bank Manager with **Bulk CSV Question Import**, User Accounts Manager, and Audit Logs.

---

## 🛠️ Quick Start & Installation

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Seed Database
```bash
npm run seed
```
*Note: CodeSphere includes an embedded PostgreSQL engine (PGlite) that initializes automatically with zero setup required if no external PostgreSQL database URL is provided.*

### 3. Start Application
To run the backend API server and frontend application:

```bash
# Terminal 1: Backend (Server running on http://localhost:5000)
npm run dev:backend

# Terminal 2: Frontend (App running on http://localhost:3000)
npm run dev:frontend
```

---

## 🧪 Running Automated Tests

Run the Vitest integration test suite covering authentication, assessment 10-q/70% threshold, retest question exclusion, progress persistence, and admin authorization:

```bash
npm test
```

---

## 🔐 Default Demo Accounts

