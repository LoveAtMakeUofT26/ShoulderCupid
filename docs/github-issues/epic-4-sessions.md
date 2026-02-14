# Epic 4: Session Management & Reports

**Goal**: Track sessions, save transcripts, generate reports

**Labels**: `phase-2`, `phase-3`, `backend`, `frontend`

---

## Tasks

### Task 4.1: Session Lifecycle API
- [ ] Implement `POST /api/sessions/start`
  - Create new session document
  - Accept `coachId`
  - Return `sessionId`
  - Initialize empty transcript array
- [ ] Implement `POST /api/sessions/:id/end`
  - Set `endedAt` timestamp
  - Trigger report generation
  - Return session summary
- [ ] Implement `GET /api/sessions` (user's sessions, paginated)
- [ ] Implement `GET /api/sessions/:id` (full session detail)

**Acceptance Criteria**: Sessions can be created, ended, and retrieved

---

### Task 4.2: Real-Time Transcript Storage
- [ ] Create transcript entry schema:
```typescript
{
  timestamp: Date,
  speaker: 'user' | 'target' | 'coach',
  text: string,
  emotion?: string,
  heart_rate?: number,
  distance?: number
}
```
- [ ] Implement `POST /api/sessions/:id/transcript`
- [ ] Append entries in real-time during session
- [ ] Support bulk append for batched updates

**Acceptance Criteria**: Transcript entries are saved as conversation happens

---

### Task 4.3: Emotion Timeline Tracking
- [ ] Store emotion readings with timestamps
- [ ] Create timeline schema:
```typescript
{
  timestamp: Date,
  emotion: string,
  confidence: number,
  distance_cm: number
}
```
- [ ] Aggregate emotion data for charts
- [ ] Flag "uncomfortable" moments in timeline

**Acceptance Criteria**: Emotion changes are tracked throughout session

---

### Task 4.4: Post-Session Report Generation
- [ ] Create `services/reportGenerator.ts`
- [ ] On session end, send full context to Gemini:
  - Full transcript
  - Emotion timeline
  - Key moments (escalations, breakthroughs)
  - Coach notes accumulated during session
- [ ] Generate structured report:
```typescript
{
  summary: string,           // 2-3 sentence overview
  whatWorked: string[],      // successful moments
  improvements: string[],    // areas to work on
  emotionAnalysis: string,   // how target felt overall
  nextSteps: string[],       // recommendations
  rating: number             // 1-10 success score
}
```
- [ ] Save report to session document

**Acceptance Criteria**: AI-generated report is created when session ends

---

### Task 4.5: Session History UI (React)
- [ ] Create `SessionHistoryPage` component
- [ ] Fetch sessions from `/api/sessions`
- [ ] Display as card grid or table:
  - Date/time
  - Coach used
  - Duration
  - Success rating
  - Target emotion summary (emoji)
- [ ] Add pagination
- [ ] Add filters (by coach, by date range)
- [ ] Link to session detail

**Acceptance Criteria**: Users can browse past sessions

---

### Task 4.6: Session Report UI (React)
- [ ] Create `SessionReportPage` component
- [ ] Display full transcript with timestamps
- [ ] Show emotion timeline chart (line graph over time)
- [ ] Display AI-generated report sections
- [ ] Highlight escalation moments (red markers)
- [ ] Add "Export as PDF" button
- [ ] Add "Share" functionality (optional)

**Acceptance Criteria**: Users can view detailed post-session analysis

---
