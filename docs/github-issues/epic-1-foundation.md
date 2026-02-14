# Epic 1: Backend Foundation ✅

**Status**: Complete
**Goal**: API server, database, and auth working

**Labels**: `phase-1`, `backend`, `infrastructure`

---

## Tasks

### Task 1.1: Backend API Skeleton (Express) ✅
- [x] Set up Express server in `apps/backend/`
- [x] Configure TypeScript + ESLint
- [x] Add CORS middleware
- [x] Create health check endpoint `GET /health`
- [x] Add request logging (morgan)
- [x] Configure environment variables

---

### Task 1.2: MongoDB Connection & Schemas ✅
- [x] Install Mongoose
- [x] Create database connection service
- [x] Define User schema (email, name, googleId, coachId, preferences)
- [x] Define Coach schema (name, personality, systemPrompt, voiceId, colors)
- [x] Define Session schema (userId, coachId, transcript[], emotionTimeline[])
- [x] Add connection retry logic

---

### Task 1.3: Google OAuth Implementation ✅
- [x] Install Passport.js + passport-google-oauth20
- [x] Create Google Cloud OAuth credentials
- [x] Implement `GET /api/auth/google` (redirect)
- [x] Implement `GET /api/auth/google/callback`
- [x] Create/update user in MongoDB on login
- [x] Set up express-session with MongoDB store
- [x] Implement `GET /api/auth/me` (current user with coach populated)
- [x] Implement `POST /api/auth/logout`

---

### Task 1.4: Coach CRUD API ✅
- [x] Implement `GET /api/coaches` (list all)
- [x] Implement `GET /api/coaches/:id` (get by ID)
- [x] Create database seed script with starter coaches:
  - "Smooth Operator" (confident, playful)
  - "Wingman Chad" (hype man, bro energy)
  - "Gentle Guide" (calm, supportive)
- [x] Add coach personality fields (tone, style, sample_phrases, colors)

---

### Task 1.5: User Profile & Settings API ✅
- [x] Implement `GET /api/user/profile`
- [x] Implement `PATCH /api/user/profile` (update name, preferences)
- [x] Implement `PATCH /api/user/coach` (select active coach)
- [x] Add user preferences schema (targetGender, comfortThreshold, coachingStyle)

---
