# Epic 5: Frontend Core ✅

**Status**: Complete
**Goal**: React app with auth, dashboard, and coach selection

**Labels**: `phase-1`, `phase-3`, `frontend`

---

## Tasks

### Task 5.1: React App Scaffolding ✅
- [x] Set up React + Vite + TypeScript in `apps/frontend/`
- [x] Install dependencies:
  - `react-router-dom` (routing)
  - `tailwindcss` (styling)
  - `socket.io-client` (WebSocket)
- [x] Configure Tailwind with custom theme (Cupid colors, fonts)
- [x] Set up folder structure (pages, components, hooks, services)

---

### Task 5.2: Authentication Flow ✅
- [x] Create `LoginPage` (HomePage) component
- [x] Add "Sign in with Google" button
- [x] Handle OAuth redirect callback
- [x] Create `useAuth` pattern with getCurrentUser
- [x] Implement route protection (redirect to / if not logged in)
- [x] Persist auth state on refresh (session cookies)

---

### Task 5.3: Main Dashboard ✅
- [x] Create `DashboardPage` component
- [x] Show welcome message with user name
- [x] Display current coach (avatar + name + colors)
- [x] Show "Choose a Coach" prompt if none selected
- [x] Show quick stats (sessions, credits)
- [x] Add quick action cards (Start Session, Browse Coaches)
- [x] Show recent sessions placeholder

---

### Task 5.4: Coach Selection Page ✅
- [x] Create `CoachesPage` component
- [x] Fetch coaches from `/api/coaches`
- [x] Display coach cards with:
  - Gradient avatar with emoji
  - Name and tagline
  - Rating and session count
  - Sample phrase
- [x] Highlight currently selected coach
- [x] Call `PATCH /api/user/coach` on selection
- [x] Show selection confirmation

---

### Task 5.5: Settings Page ✅
- [x] Create `SettingsPage` component (placeholder)
- [x] Profile section layout
- [x] Preferences section layout
- [x] Device pairing section layout
- [x] Account section (logout, delete)

---

### Task 5.6: Sessions Page ✅
- [x] Create `SessionsPage` component
- [x] Empty state with CTA
- [x] List layout ready for data

---

### Task 5.7: Navigation & Layout ✅
- [x] Create `AppShell` component (mobile container)
- [x] Create `BottomNav` component (4 tabs)
- [x] Create `FloatingActionButton` component
- [x] Mobile-first responsive layout
- [x] Active route highlighting

---

## Design System Applied

- **Colors**: cupid (pink), gold, marble
- **Typography**: Playfair Display (headings), Inter (body)
- **Components**: btn-primary, btn-secondary, btn-ghost, card, card-elevated
- **Spacing**: Mobile-safe with pb-safe for bottom nav
