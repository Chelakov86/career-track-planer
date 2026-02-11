# CLAUDE.md - AI Assistant Guide

**Last Updated:** 2026-02-11 | **Version:** 0.1.0 | **Codebase:** ~4,299 lines TypeScript/TSX

## Project Overview

**CareerTrack Planer** - React SPA for job search management with:
- Kanban job application tracker with drag-and-drop
- Interview rounds tracking per job
- Application timeline visualization
- Daily schedule planning (time-blocked productivity system)
- AI coaching (Google Gemini integration via serverless API)
- Analytics dashboard
- Bilingual support (EN/DE)

**Tech Stack:** React 18 + TypeScript 5 + Vite 6 + Supabase + Tailwind CSS (CDN) + React Router 7

**Key Characteristics:**
- Backend-as-a-Service (Supabase)
- Type-safe, responsive, mobile-first
- Optimistic updates with rollback
- Playwright E2E testing
- Vercel serverless API for secure Gemini integration

---

## Project Structure

```
src/
├── components/              # 12 React components
│   ├── JobBoard.tsx         # Main Kanban board (1,150 lines - largest)
│   ├── JobModal.tsx         # Add/Edit/View job + interview rounds (392 lines)
│   ├── TimelineView.tsx     # Application timeline visualization (317 lines)
│   ├── JobCard.tsx          # Draggable card (257 lines)
│   ├── ScheduleView.tsx     # Daily planner (173 lines)
│   ├── InterviewRoundItem.tsx # Interview round editor (165 lines)
│   ├── Sidebar.tsx          # Desktop/mobile nav (132 lines)
│   ├── LoginPage.tsx        # Auth UI (96 lines)
│   ├── Dashboard.tsx        # Analytics (74 lines)
│   ├── DeleteConfirmModal.tsx # Confirm delete (61 lines)
│   ├── Layout.tsx           # Main wrapper (49 lines)
│   └── Header.tsx           # Mobile header (46 lines)
├── contexts/
│   ├── AuthContext.tsx       # User auth state (104 lines)
│   └── ThemeContext.tsx      # Light/dark theme (47 lines)
├── hooks/
│   ├── useJobs.ts           # Job CRUD + optimistic updates (205 lines)
│   └── useInterviewRounds.ts # Interview round CRUD (170 lines)
├── lib/
│   ├── supabase.ts          # Supabase client init (12 lines)
│   ├── csvExport.ts         # CSV export utilities (61 lines)
│   └── calendar.ts          # Google Calendar URL builder (38 lines)
├── services/
│   └── geminiService.ts     # AI integration (82 lines)
├── App.tsx                  # Root + routing (101 lines)
├── main.tsx                 # Entry point (17 lines)
├── types.ts                 # All TypeScript types (81 lines)
└── constants.ts             # Translations + schedules (468 lines)

api/                         # Vercel serverless functions
├── gemini.ts                # Server-side Gemini API handler
└── utils/
    └── validation.ts        # API parameter validation (whitelist)

e2e/                         # Playwright E2E tests
├── auth.setup.ts            # Auth session setup
├── authenticated.spec.ts    # Authenticated user tests
├── calendar.unit.spec.ts    # Calendar URL tests
└── unauthenticated.spec.ts  # Login page tests

migrations/                  # 5 SQL migration files
├── add_interview_rounds.sql
├── add_interview_times.sql
├── add_link_column.sql
├── add_meeting_link_to_interview_rounds.sql
└── remove_role_type_column.sql

playwright.config.ts         # E2E test config
vercel.json                  # Deployment config (SPA routing)
vite.config.ts               # Build config (port 3000)
```

**Path Alias:** `@/` → `/src/` (configured in vite.config.ts + tsconfig.json)

---

## Environment Setup

```bash
# .env.local (or .env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SITE_URL=http://localhost:3000

# Server-side only (no VITE_ prefix - used by api/gemini.ts)
GEMINI_API_KEY=your_gemini_api_key

# E2E testing only
VITE_TEST_USER_EMAIL=test@playwright.test
VITE_TEST_USER_PASSWORD=your_test_password
```

**Important:** Client-side env vars require `VITE_` prefix. The Gemini API key is server-side only for security.

**Scripts:**
```bash
npm install            # Install dependencies
npm run dev            # Dev server (localhost:3000)
npm run build          # Production build (TypeScript check)
npm run preview        # Preview build
npm run test:e2e       # Run Playwright E2E tests (headless)
npm run test:e2e:ui    # Run E2E tests with Playwright UI
npm run test:e2e:headed # Run E2E tests with visible browser
```

---

## Architecture

### State Management (Multi-Layer)

1. **Global Context** (React Context API)
   - `AuthContext` - User auth, login/logout, loading state
   - `ThemeContext` - Light/dark mode, localStorage persistence

2. **Custom Hooks**
   - `useJobs` - Job CRUD with optimistic updates & rollback
   - `useInterviewRounds` - Interview round CRUD with optimistic updates & rollback

3. **Local State** (`useState`)
   - Form data, UI toggles, filters, drag-and-drop state

**Data Flow:** `Supabase DB → useJobs/useInterviewRounds → App.tsx → Components`

### Key Patterns

**Optimistic Updates:**
```typescript
// 1. Update UI immediately
const tempId = crypto.randomUUID();
setJobs(prev => [{ ...job, id: tempId }, ...prev]);

// 2. Sync with DB
const { data, error } = await supabase.from('jobs').insert(dbJob);

// 3. Handle error (rollback)
if (error) setJobs(prev => prev.filter(j => j.id !== tempId));
else setJobs(prev => prev.map(j => j.id === tempId ? { ...j, id: data.id } : j));
```

**Routes (Protected):**
```tsx
/         → JobBoard (default)
/timeline → TimelineView
/schedule → ScheduleView
/stats    → Dashboard
*         → Navigate to /
```
All routes require authentication and are wrapped in Layout.

### Server-Side API (api/)

The Gemini API key is kept server-side via Vercel serverless functions:
- `api/gemini.ts` - Handles AI requests, validates config via whitelist
- `api/utils/validation.ts` - Whitelist-based parameter validation
- Client calls `/api/gemini` POST endpoint from `geminiService.ts`

---

## Coding Conventions

### Naming
- **Components:** PascalCase (`JobBoard.tsx`)
- **Hooks:** camelCase + `use` prefix (`useJobs`)
- **Types/Interfaces:** PascalCase (`JobApplication`)
- **Enums:** PascalCase + SCREAMING_SNAKE_CASE values (`ApplicationStatus.RESEARCH`)
- **Constants:** SCREAMING_SNAKE_CASE (`TRANSLATIONS`)
- **Functions:** camelCase (`addJob`)

### TypeScript Types (src/types.ts)

```typescript
export type Language = 'en' | 'de';
export type InterviewRoundStatus = 'scheduled' | 'completed' | 'awaiting_feedback';
export type TimelineEventType = 'job_added' | 'status_changed' | 'interview_scheduled'
  | 'interview_completed' | 'interview_feedback';

export enum ApplicationStatus {
  RESEARCH = 'RESEARCH',
  TO_APPLY = 'TO_APPLY',
  APPLIED = 'APPLIED',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED'
}

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  location: string;
  status: ApplicationStatus;
  dateAdded: string;          // ISO YYYY-MM-DD
  lastUpdated: string;        // ISO YYYY-MM-DD
  notes: string;
  salary?: string;
  link?: string;
  interviewRounds?: InterviewRound[];
}

export interface InterviewRound {
  id: string;
  jobId: string;
  roundName: string;
  interviewDate: string;      // ISO YYYY-MM-DD
  startTime?: string;         // HH:MM (TIME)
  endTime?: string;           // HH:MM (TIME)
  status: InterviewRoundStatus;
  notes?: string;
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  jobId: string;
  company: string;
  position: string;
  eventType: TimelineEventType;
  eventDate: string;
  description: string;
  metadata?: Record<string, unknown>;
}
```

### Database <-> UI Mapping

**CRITICAL:** Always map between snake_case (DB) and camelCase (UI) in hooks:
```typescript
// useJobs.ts - DB → UI
dateAdded: job.date_added
lastUpdated: job.last_updated

// useJobs.ts - UI → DB
date_added: job.dateAdded
last_updated: job.lastUpdated

// useInterviewRounds.ts - DB → UI
jobId: round.job_id
roundName: round.round_name
interviewDate: round.interview_date
startTime: round.start_time
endTime: round.end_time
meetingLink: round.meeting_link
createdAt: round.created_at
updatedAt: round.updated_at
```

### Styling (Tailwind CSS)

**Dark Mode Pattern:**
```tsx
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
```

**Responsive:**
```tsx
className="flex-col md:flex-row"  // Mobile stacked, desktop row
className="hidden md:block"        // Desktop only
className="md:hidden"              // Mobile only
```

**Color System:**
- Primary: `indigo-600`, `indigo-500`
- Status: `gray-500` (Research), `blue-500` (To Apply), `yellow-500` (Applied), `purple-500` (Interview), `green-500` (Offer), `red-500` (Rejected)

### Error Handling

```typescript
// User-facing errors
if (error) {
  console.error('Error adding job:', error);
  alert('Failed to save job. Please try again.');
}

// Rollback pattern
const previousJobs = [...jobs];
setJobs(prev => prev.filter(j => j.id !== id));
const { error } = await supabase.from('jobs').delete().eq('id', id);
if (error) setJobs(previousJobs);  // Revert
```

---

## Database Schema

### Jobs Table
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL,
  date_added DATE NOT NULL,
  last_updated DATE NOT NULL,
  notes TEXT,
  salary TEXT,
  link TEXT
);

CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_date_added ON jobs(date_added DESC);
```

### Interview Rounds Table
```sql
CREATE TABLE interview_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  round_name TEXT NOT NULL,
  interview_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  meeting_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interview_rounds_job_id ON interview_rounds(job_id);
CREATE INDEX idx_interview_rounds_user_id ON interview_rounds(user_id);
CREATE INDEX idx_interview_rounds_date ON interview_rounds(interview_date);
CREATE INDEX idx_interview_rounds_start_time ON interview_rounds(start_time);
```

**Row Level Security (RLS):** Both tables enforce `user_id = auth.uid()` for all operations.

**Apply Migrations:** Supabase Dashboard -> SQL Editor -> Paste -> Execute

---

## Key Features

### 1. Authentication
- Google OAuth + Magic Link email
- `AuthContext` manages state
- Supabase handles tokens/sessions

### 2. Job Board (JobBoard.tsx - 1,150 lines)
**Kanban:** Research -> To Apply -> Applied -> Interview -> Offer -> Rejected

**Drag & Drop:**
- Mouse (desktop) + Touch (mobile, 300ms long-press)
- Auto-scroll near edges
- Visual feedback

**Filters:**
- Multi-status checkboxes
- Text search (company, position, notes, location)
- Date ranges (dateAdded, lastUpdated)

**Sorting:** 9 options (date newest/oldest, company A-Z/Z-A, position A-Z/Z-A, status order)

**Export:** CSV with UTF-8 BOM (Excel compatibility) via `lib/csvExport.ts`

### 3. Interview Rounds
- Per-job interview tracking (scheduled / completed / awaiting_feedback)
- Round name, date, start/end times
- Meeting link storage
- Notes per round
- Add to Google Calendar (via `lib/calendar.ts`)
- Managed via `useInterviewRounds` hook
- UI in JobModal.tsx + InterviewRoundItem.tsx

### 4. Timeline View (TimelineView.tsx)
- Chronological visualization of job lifecycle events
- Event types: job_added, status_changed, interview_scheduled, interview_completed, interview_feedback
- Filterable by event type
- Search functionality

### 5. Daily Schedule Planner (ScheduleView.tsx)
- Pre-configured time blocks (09:00-15:00)
- 6 categories: Research, Deep Work, Break, Learning, Network, Admin
- Bilingual (EN/DE)
- AI "Get Focus" button (Gemini-powered task suggestions)

### 6. Analytics Dashboard (Dashboard.tsx)
- Summary cards (total apps, active pipeline, interviews)
- Application funnel (horizontal bar chart - Recharts)
- Role distribution (donut chart)

### 7. Internationalization (i18n)
- Custom system (no library)
- Translations in `constants.ts` -> `TRANSLATIONS` object
- Top-level keys: `login`, `nav`, `schedule`, `board`, `dashboard`, `modal`, `timeline`, `interviewRound`, `errors`, `categories`
- Usage: `const t = TRANSLATIONS[language]`

### 8. Dark Mode
- `ThemeContext` + Tailwind `dark:` classes
- localStorage persistence (`career_track_theme`)
- System preference detection

### 9. AI Integration (Gemini)
- `generateTaskAdvice()` - Actionable tasks for schedule time blocks
- `analyzeJobDescription()` - Job posting analysis (match score, keywords, red flags)
- Server-side API handler at `api/gemini.ts` (keeps API key secure)
- Uses `gemini-3-flash-preview` model

---

## Testing

### E2E Tests (Playwright)

**Configuration** (`playwright.config.ts`):
- Base URL: `http://localhost:3000`
- Auto-starts dev server via `npm run dev`
- Chromium browser
- Session state stored in `e2e/.auth/user.json`
- Retries: 0 (local), 2 (CI)

**Test Files:**
| File | Tests | Purpose |
|------|-------|---------|
| `auth.setup.ts` | Setup | Creates authenticated session |
| `authenticated.spec.ts` | 6 | Authenticated user flows (board, nav) |
| `calendar.unit.spec.ts` | 5 | Google Calendar URL edge cases |
| `unauthenticated.spec.ts` | 2 | Login page for unauthenticated users |

**Running:**
```bash
npm run test:e2e          # Headless
npm run test:e2e:ui       # With Playwright UI
npm run test:e2e:headed   # With visible browser
```

---

## Common Tasks

### Add Component
1. Create `src/components/NewComponent.tsx` (PascalCase)
2. Add translations to `constants.ts` (EN + DE)
3. Import in parent component

### Add Route
1. Create component
2. Add route to `App.tsx` inside `<Routes>`
3. Add nav link to `Sidebar.tsx` + `Header.tsx`
4. Add translations

### Modify Database Schema
1. Create `migrations/descriptive_name.sql`
2. Apply in Supabase Dashboard
3. Update `types.ts` interface
4. Update relevant hook mapping (snake_case <-> camelCase)

### Add Translations
```typescript
// constants.ts
TRANSLATIONS = {
  en: { myFeature: { title: 'My Feature' } },
  de: { myFeature: { title: 'Meine Funktion' } }
}
```

### Add AI Feature
1. Add method to `geminiService.ts`
2. Use model `gemini-3-flash-preview`
3. Call via `/api/gemini` POST endpoint
4. Handle errors gracefully (return fallback message)

---

## Critical Principles for AI Assistants

### NON-NEGOTIABLE

1. **Always check auth:** `if (!user) return;` before all Supabase calls
2. **Preserve snake_case <-> camelCase mapping** in hooks (`useJobs.ts`, `useInterviewRounds.ts`)
3. **Every user-facing string needs EN + DE translations** in `constants.ts`
4. **Every styled element needs dark mode:** `bg-white dark:bg-gray-800`
5. **Type safety:** No `any` types (define in `types.ts`)
6. **Responsive design:** Mobile-first, test at < 768px, 768-1024px, > 1024px
7. **Optimistic updates:** UI first -> DB sync -> rollback on error

### Common Pitfalls

1. **Date format:** Always ISO `YYYY-MM-DD` via `new Date().toISOString().split('T')[0]`
2. **Drag-and-drop:** Handle both mouse AND touch events
3. **Don't add dependencies lightly** - justify bundle impact
4. **Don't modify `index.html`** without reason (Tailwind CDN intentional)
5. **Component size:** Split if > 500 lines (JobBoard at 1,150 is already over limit)
6. **Gemini API key:** Must stay server-side only (in `api/gemini.ts`), never expose via `VITE_` prefix
7. **Interview rounds cascade:** Deleting a job cascades to delete its interview rounds (DB-level)

### When Modifying

**JobBoard.tsx (1,150 lines):**
- Should be split into sub-components if adding features
- Maintain filter/sort state consistency
- Preserve drag-and-drop functionality (mouse + touch)

**useJobs.ts / useInterviewRounds.ts:**
- Test optimistic updates thoroughly
- Ensure rollback logic works
- Keep DB <-> UI mapping consistent

**Adding New Features:**
1. Add translations first (prevents forgetting)
2. Implement dark mode from start
3. Test on mobile before "done"
4. Run `npm run build` for TypeScript check
5. Update this CLAUDE.md if new conventions

### Performance

**Current:** CDN Tailwind (~50KB), no code splitting, React.memo on JobCard

**Optimize When:**
- JobBoard > 100 jobs (virtualize)
- Bundle > 500KB (code split)
- Re-renders noticeable (memoize more components)

---

## Quick Reference

### File Paths
| Purpose | Path |
|---------|------|
| Main App | `src/App.tsx` |
| Types | `src/types.ts` |
| Translations | `src/constants.ts` |
| Auth | `src/contexts/AuthContext.tsx` |
| Theme | `src/contexts/ThemeContext.tsx` |
| Job CRUD | `src/hooks/useJobs.ts` |
| Interview CRUD | `src/hooks/useInterviewRounds.ts` |
| Supabase | `src/lib/supabase.ts` |
| CSV Export | `src/lib/csvExport.ts` |
| Calendar Utils | `src/lib/calendar.ts` |
| AI Service | `src/services/geminiService.ts` |
| Gemini API | `api/gemini.ts` |
| API Validation | `api/utils/validation.ts` |
| Main Board | `src/components/JobBoard.tsx` |
| Timeline | `src/components/TimelineView.tsx` |
| Interview Editor | `src/components/InterviewRoundItem.tsx` |

### Code Snippets

**Auth Check:**
```typescript
const { user } = useAuth();
if (!user) return;
```

**Translations:**
```typescript
const t = TRANSLATIONS[language];
<button>{t.board.addJob}</button>
```

**Theme Toggle:**
```typescript
const { theme, toggleTheme } = useTheme();
<button onClick={toggleTheme}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</button>
```

**Date Format:**
```typescript
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
```

---

## Dependencies

### Production
| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3.1 | UI framework |
| react-dom | 18.3.1 | DOM rendering |
| react-router-dom | ^7.12.0 | Client-side routing |
| @supabase/supabase-js | ^2.90.1 | Backend-as-a-Service |
| @google/genai | ^1.0.0 | Google Gemini AI client |
| lucide-react | 0.344.0 | Icon library |
| recharts | 2.12.7 | Charts library |

### Development
| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^6.2.0 | Build tool |
| @vitejs/plugin-react | ^5.0.0 | React plugin for Vite |
| typescript | ~5.8.2 | Type checking |
| @playwright/test | ^1.58.2 | E2E testing |
| @vercel/node | ^5.5.22 | Serverless function types |
| dotenv | ^17.2.4 | Environment variables |

---

## Deployment (Vercel)

1. Connect GitHub repo to Vercel
2. Set env vars:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_URL`
   - `GEMINI_API_KEY` (server-side, no VITE_ prefix)
3. Auto-deploys on push to `main`
4. Preview deployments for PRs

**Build output:** `dist/` (configured via `vercel.json` for SPA routing)

---

## Git Workflow

**Branches:** `feature/name`, `bugfix/description`, `hotfix/fix`

**Commits:** Conventional (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)

**Before Committing:**
- [ ] Test light + dark modes
- [ ] Verify EN + DE translations
- [ ] Check mobile + desktop responsive
- [ ] Run `npm run build` (TypeScript check)
- [ ] Run `npm run test:e2e` if touching core flows
- [ ] Review console errors

---

## Changelog

**2026-02-11:** Major update - documented interview rounds, timeline view, Playwright testing, serverless API, new lib utilities, updated line counts and structure
**2026-02-02:** Condensed CLAUDE.md from 1,485 -> ~500 lines while preserving all critical info
**2026-01-15:** Initial comprehensive documentation created

---

**Note:** Update this file when adding new conventions or architectural changes. This is the source of truth for AI assistants.
