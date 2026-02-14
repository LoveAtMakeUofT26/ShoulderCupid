# Epic 7: Onboarding Flow

**Goal**: Multi-step onboarding for new users

**Labels**: `phase-3`, `frontend`, `ux`

---

## Tasks

### Task 7.1: Onboarding State Management
- [ ] Add `onboardingCompleted` flag to User model
- [ ] Create `useOnboarding` hook
- [ ] Redirect new users to onboarding flow
- [ ] Track current onboarding step
- [ ] Allow users to re-run onboarding from settings

**Acceptance Criteria**: New users are routed to onboarding

---

### Task 7.2: Step 1 - Welcome Screen
- [ ] Create `OnboardingWelcome` component
- [ ] Cupid branding + tagline
- [ ] Quick value proposition (3 bullet points):
  - Real-time coaching in your ear
  - AI reads the room for you
  - Get better at dating, one conversation at a time
- [ ] "Get Started" CTA button
- [ ] Skip option (not recommended)

**Acceptance Criteria**: Engaging welcome that explains the product

---

### Task 7.3: Step 2 - Profile Setup
- [ ] Create `OnboardingProfile` component
- [ ] Collect:
  - Display name
  - Age (optional)
  - Pronouns (optional)
  - Who you're interested in (men/women/everyone)
- [ ] Save to user profile
- [ ] Continue button

**Acceptance Criteria**: Basic profile information collected

---

### Task 7.4: Step 3 - Coaching Style Quiz
- [ ] Create `OnboardingQuiz` component
- [ ] 3-5 multiple choice questions:
  - "How do you usually feel approaching someone new?"
    - Confident / Nervous / Depends on the situation
  - "What's your biggest challenge?"
    - Starting conversations / Keeping them going / Knowing when to leave
  - "How direct do you want your coach to be?"
    - Very direct / Balanced / Gentle suggestions
  - "What's your goal?"
    - Get more dates / Build confidence / Have fun
- [ ] Calculate recommended coach based on answers
- [ ] Store quiz results in user preferences

**Acceptance Criteria**: Quiz personalizes the experience

---

### Task 7.5: Step 4 - Hardware Setup Guide
- [ ] Create `OnboardingHardware` component
- [ ] Visual guide for ESP32 setup:
  - Wearing the glasses
  - Connecting to WiFi
  - Pairing with account
- [ ] Interactive pairing flow
- [ ] Test camera (show preview)
- [ ] Test microphone (record and playback)
- [ ] Test speaker/earpiece (play sample audio)
- [ ] "Skip hardware setup" option (for later)

**Acceptance Criteria**: Users have working hardware or can skip for later

---

### Task 7.6: Step 5 - Coach Selection
- [ ] Create `OnboardingCoachSelect` component
- [ ] Show recommended coach (from quiz) highlighted
- [ ] Display all coach options with previews
- [ ] Play sample coaching audio for each
- [ ] Select and confirm coach

**Acceptance Criteria**: Users pick their coach with context

---

### Task 7.7: Step 6 - Practice Session
- [ ] Create `OnboardingPractice` component
- [ ] Simulated mini-session (no real hardware needed):
  - Show sample scenario text
  - Coach gives practice tips
  - User hears what coaching sounds like
- [ ] "I understand" confirmation
- [ ] Tips for first real session
- [ ] "Start your first session" or "Go to dashboard" options

**Acceptance Criteria**: Users understand the experience before real use

---

### Task 7.8: Onboarding Progress UI
- [ ] Create `OnboardingProgress` component
- [ ] Step indicator (1 of 6, 2 of 6, etc.)
- [ ] Progress bar
- [ ] Back button (where applicable)
- [ ] Step titles
- [ ] Estimated time remaining

**Acceptance Criteria**: Users know where they are in onboarding

---
