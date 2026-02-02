# CLAUDE.md - AI Assistant Guide

**Last Updated:** 2026-02-02 | **Version:** 0.0.0 | **Codebase:** ~2,329 lines TypeScript/TSX

## Project Overview

**CareerTrack Planer** - React SPA for job search management (PM/QA roles) with:
- Daily schedule planning (time-blocked productivity system)
- Kanban job application tracker
- AI coaching (Google Gemini integration)
- Analytics dashboard
- Bilingual support (EN/DE)

**Tech Stack:** React 18 + TypeScript 5 + Vite 6 + Supabase + Tailwind CSS (CDN) + React Router 7

**Key Characteristics:**
- Backend-as-a-Service (Supabase)
- Type-safe, responsive, mobile-first
- Real-time data sync
- No testing infrastructure (manual testing only)

---

## Project Structure

```
src/
├── components/          # 10 React components
│   ├── JobBoard.tsx     # Main Kanban (769 lines - largest)
│   ├── JobModal.tsx     # Add/Edit/View job
│   ├── JobCard.tsx      # Draggable card
│   ├── Dashboard.tsx    # Analytics
│   ├── ScheduleView.tsx # Daily planner
│   ├── LoginPage.tsx    # Auth UI
│   ├── Layout.tsx       # Main wrapper
│   ├── Header.tsx       # Mobile nav
│   ├── Sidebar.tsx      # Desktop nav
│   └── DeleteConfirmModal.tsx
├── contexts/
│   ├── AuthContext.tsx  # User auth state
│   └── ThemeContext.tsx # Light/dark theme
├── hooks/
│   └── useJobs.ts       # Job CRUD + optimistic updates
├── lib/
│   └── supabase.ts      # Supabase client
├── services/
│   └── geminiService.ts # AI integration
├── App.tsx              # Root + routing
├── main.tsx             # Entry point
├── types.ts             # All TypeScript types
└── constants.ts         # Translations + schedules

migrations/              # SQL migrations
vercel.json             # Deployment config
vite.config.ts          # Build config (port 3000)
```

**Path Alias:** `@/` → `/src/` (configured in vite.config.ts + tsconfig.json)

---

## Environment Setup

```bash
# .env.local (or .env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SITE_URL=http://localhost:3000
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**Important:** All client-side env vars require `VITE_` prefix (Vite convention).

**Scripts:**
```bash
npm install      # Install dependencies
npm run dev      # Dev server (localhost:3000)
npm run build    # Production build
npm run preview  # Preview build
```

---

## Architecture

### State Management (Multi-Layer)

1. **Global Context** (React Context API)
   - `AuthContext` - User auth, login/logout, loading state
   - `ThemeContext` - Light/dark mode, localStorage persistence

2. **Custom Hooks**
   - `useJobs` - CRUD operations with optimistic updates & rollback on error

3. **Local State** (`useState`)
   - Form data, UI toggles, filters, drag-and-drop state

**Data Flow:** `Supabase DB → useJobs → App.tsx → Components`

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
/ → ScheduleView
/board → JobBoard
/stats → Dashboard
* → Navigate to /
```
All routes require authentication.

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
export type RoleFocus = 'PM' | 'QA' | 'General';
export type Language = 'en' | 'de';

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
  roleType: RoleFocus;
  dateAdded: string;      // ISO YYYY-MM-DD
  lastUpdated: string;    // ISO YYYY-MM-DD
  notes: string;
  salary?: string;
  link?: string;
}
```

### Database ↔ UI Mapping

**CRITICAL:** Always map between snake_case (DB) and camelCase (UI) in `useJobs.ts`:
```typescript
// DB → UI
roleType: job.role_type
dateAdded: job.date_added

// UI → DB
role_type: job.roleType
date_added: job.dateAdded
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
- Roles: `blue-500` (PM), `purple-500` (QA)

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
  role_type TEXT NOT NULL,
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

**Row Level Security (RLS):** Users can only access their own jobs (via `user_id` foreign key).

**Apply Migrations:** Supabase Dashboard → SQL Editor → Paste → Execute

---

## Key Features

### 1. Authentication
- Google OAuth + Magic Link email
- `AuthContext` manages state
- Supabase handles tokens/sessions

### 2. Daily Schedule Planner (ScheduleView.tsx)
- Pre-configured time blocks (09:00-15:00)
- 6 categories: Research, Deep Work, Break, Learning, Network, Admin
- Bilingual (EN/DE)
- Export to .ics (Google Calendar)
- AI "Get Focus" button

### 3. Job Board (JobBoard.tsx - 769 lines)
**Kanban:** Research → To Apply → Applied → Interview → Offer → Rejected

**Drag & Drop:**
- Mouse (desktop) + Touch (mobile, 300ms long-press)
- Auto-scroll near edges
- Visual feedback

**Filters:**
- Multi-status checkboxes
- Text search (company, position, notes, location)
- Date ranges (dateAdded, lastUpdated)

**Sorting:** 9 options (date newest/oldest, company A-Z/Z-A, position A-Z/Z-A, status order)

**Export:** CSV with UTF-8 BOM (Excel compatibility)

### 4. Analytics Dashboard (Dashboard.tsx)
- Summary cards (total apps, active pipeline, interviews)
- Application funnel (horizontal bar chart - Recharts)
- Role distribution (donut chart - PM vs QA)

### 5. Internationalization (i18n)
- Custom system (no library)
- Translations in `constants.ts` → `TRANSLATIONS` object
- Usage: `const t = TRANSLATIONS[language]`

### 6. Dark Mode
- `ThemeContext` + Tailwind `dark:` classes
- localStorage persistence (`career_track_theme`)
- System preference detection

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
1. Create `migrations/add_new_column.sql`
2. Apply in Supabase Dashboard
3. Update `types.ts` interface
4. Update `useJobs.ts` mapping (snake_case ↔ camelCase)

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
3. Handle errors gracefully (return fallback message)

---

## Critical Principles for AI Assistants

### 🔴 NON-NEGOTIABLE

1. **Always check auth:** `if (!user) return;` before all Supabase calls
2. **Preserve snake_case ↔ camelCase mapping** in `useJobs.ts`
3. **Every user-facing string needs EN + DE translations** in `constants.ts`
4. **Every styled element needs dark mode:** `bg-white dark:bg-gray-800`
5. **Type safety:** No `any` types (define in `types.ts`)
6. **Responsive design:** Mobile-first, test at < 768px, 768-1024px, > 1024px
7. **Optimistic updates:** UI first → DB sync → rollback on error

### ⚠️ Common Pitfalls

1. **Date format:** Always ISO `YYYY-MM-DD` via `new Date().toISOString().split('T')[0]`
2. **Drag-and-drop:** Handle both mouse AND touch events
3. **Don't add dependencies lightly** - justify bundle impact
4. **Don't modify `index.html`** without reason (Tailwind CDN intentional)
5. **Component size:** Split if > 500 lines (JobBoard at 769 is upper limit)

### 🛠️ When Modifying

**JobBoard.tsx:**
- Consider splitting into sub-components if adding features
- Maintain filter/sort state consistency
- Preserve drag-and-drop functionality

**useJobs.ts:**
- Test optimistic updates thoroughly
- Ensure rollback logic works
- Keep mapping consistent

**Adding New Features:**
1. Add translations first (prevents forgetting)
2. Implement dark mode from start
3. Test on mobile before "done"
4. Update this CLAUDE.md if new conventions

### 📊 Performance

**Current:** CDN Tailwind (~50KB), no code splitting, no memoization (not needed yet)

**Optimize When:**
- JobBoard > 100 jobs (virtualize)
- Bundle > 500KB (code split)
- Re-renders noticeable (memoize)

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
| Supabase | `src/lib/supabase.ts` |
| AI Service | `src/services/geminiService.ts` |
| Main Board | `src/components/JobBoard.tsx` |

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

## Deployment (Vercel)

1. Connect GitHub repo to Vercel
2. Set env vars (all with `VITE_` prefix):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_URL`
   - `VITE_GEMINI_API_KEY`
3. Auto-deploys on push to `main`
4. Preview deployments for PRs

**Build output:** `dist/` (configured via `vercel.json` for SPA routing)

---

## Git Workflow

**Branches:** `feature/name`, `bugfix/description`, `hotfix/fix`

**Commits:** Conventional (`feat:`, `fix:`, `docs:`, `refactor:`)

**Before Committing:**
- [ ] Test light + dark modes
- [ ] Verify EN + DE translations
- [ ] Check mobile + desktop responsive
- [ ] Run `npm run build` (TypeScript check)
- [ ] Review console errors

---

## Changelog

**2026-02-02:** Condensed CLAUDE.md from 1,485 → ~500 lines while preserving all critical info
**2026-01-15:** Initial comprehensive documentation created

---

**Note:** Update this file when adding new conventions or architectural changes. This is the source of truth for AI assistants.
