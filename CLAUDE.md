# CLAUDE.md - AI Assistant Guide for CareerTrack Planer

**Last Updated:** 2026-01-15
**Project Version:** 0.0.0
**Codebase Size:** ~2,329 lines of TypeScript/TSX

This document provides comprehensive guidance for AI assistants working on the CareerTrack Planer codebase. It covers architecture, conventions, workflows, and best practices.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Codebase Structure](#codebase-structure)
3. [Technology Stack](#technology-stack)
4. [Development Workflow](#development-workflow)
5. [Architecture & Patterns](#architecture--patterns)
6. [Coding Conventions](#coding-conventions)
7. [Database Schema](#database-schema)
8. [Key Features](#key-features)
9. [Common Tasks](#common-tasks)
10. [Testing Strategy](#testing-strategy)
11. [Deployment](#deployment)
12. [Important Notes for AI Assistants](#important-notes-for-ai-assistants)

---

## Project Overview

### What is CareerTrack Planer?

CareerTrack Planer is a **React-based web application** designed to help job seekers (primarily in PM/QA roles) manage their job search process. It combines:

- **Daily Schedule Planning** - Time-blocked productivity system for job seekers
- **Job Application Tracker** - Kanban-style board for managing applications
- **AI-Powered Coaching** - Google Gemini integration for personalized career advice
- **Analytics Dashboard** - Visual insights into application pipeline

### Target Users
- Job seekers focusing on Product Manager (PM) or Quality Assurance (QA) roles
- Users who want structured daily schedules combined with application tracking
- Bilingual users (English/German support)

### Key Characteristics
- **Single Page Application (SPA)** with React Router
- **Backend-as-a-Service** architecture using Supabase
- **Type-safe** with full TypeScript coverage
- **Responsive design** - mobile-first approach
- **Real-time data sync** via Supabase
- **No testing infrastructure** (manual testing only)

---

## Codebase Structure

```
/home/user/career-track-planer/
├── src/                           # Source code (2,329 lines)
│   ├── components/                # React components (10 files)
│   │   ├── Dashboard.tsx          # Analytics dashboard
│   │   ├── DeleteConfirmModal.tsx # Confirmation dialog
│   │   ├── Header.tsx             # Mobile header navigation
│   │   ├── JobBoard.tsx           # Main Kanban board (769 lines - largest)
│   │   ├── JobCard.tsx            # Draggable job card
│   │   ├── JobModal.tsx           # Add/Edit/View job modal
│   │   ├── Layout.tsx             # Main layout wrapper
│   │   ├── LoginPage.tsx          # Authentication page
│   │   ├── ScheduleView.tsx       # Daily schedule planner
│   │   └── Sidebar.tsx            # Desktop sidebar navigation
│   │
│   ├── contexts/                  # React Context providers
│   │   ├── AuthContext.tsx        # User authentication state
│   │   └── ThemeContext.tsx       # Light/dark theme toggle
│   │
│   ├── hooks/                     # Custom React hooks
│   │   └── useJobs.ts             # Job CRUD operations
│   │
│   ├── lib/                       # External library configs
│   │   └── supabase.ts            # Supabase client setup
│   │
│   ├── services/                  # External service integrations
│   │   └── geminiService.ts       # Google Gemini AI integration
│   │
│   ├── App.tsx                    # Root component with routing
│   ├── main.tsx                   # Application entry point
│   ├── types.ts                   # TypeScript type definitions
│   ├── constants.ts               # Translations, schedules, mock data
│   └── vite-env.d.ts              # Vite environment types
│
├── migrations/                    # Database migrations
│   └── add_link_column.sql        # Adds job link column
│
├── index.html                     # HTML entry point (Tailwind CDN)
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite build configuration
├── vercel.json                    # Vercel deployment config
├── metadata.json                  # App metadata
├── .env.example                   # Environment variable template
└── README.md                      # Basic setup instructions
```

### Component Organization

**Presentation Components** (UI-focused):
- `DeleteConfirmModal` - Reusable confirmation dialog
- `Header` - Mobile-only header with hamburger menu
- `Sidebar` - Desktop navigation panel
- `Layout` - Wrapper that combines Header + Sidebar + content

**Feature Components** (Business logic):
- `LoginPage` - Authentication UI (Google OAuth + Magic Link)
- `ScheduleView` - Daily schedule with AI integration
- `JobBoard` - Complex Kanban board with filtering, sorting, drag-and-drop
- `JobCard` - Individual draggable job card
- `JobModal` - Form for creating/editing/viewing jobs
- `Dashboard` - Analytics with charts (Recharts)

**Container Components**:
- `App.tsx` - Root component with routing and global state

---

## Technology Stack

### Core Framework
- **React 18.3.1** - UI library (function components + hooks)
- **TypeScript 5.8.2** - Type-safe JavaScript
- **Vite 6.2.0** - Build tool and dev server (port 3000)

### Routing
- **React Router DOM 7.12.0** - Client-side routing (BrowserRouter)

### Backend/Database
- **Supabase (@supabase/supabase-js 2.90.1)** - Backend-as-a-Service
  - PostgreSQL database with Row Level Security (RLS)
  - Authentication (Google OAuth, Magic Link email)
  - Real-time data synchronization

### AI Integration
- **Google GenAI 1.0.0** (@google/genai) - Gemini AI integration
  - Model: `gemini-3-flash-preview`
  - Used for: Task-specific career advice, job description analysis

### UI Libraries
- **Lucide React 0.344.0** - Icon library
- **Recharts 2.12.7** - Charts and data visualization
- **Tailwind CSS** (via CDN) - Utility-first CSS framework

### Build Tools
- **@vitejs/plugin-react 5.0.0** - Vite React plugin
- **@types/node 22.14.0** - Node.js type definitions

### Deployment
- **Vercel** - Deployment platform (configured via vercel.json)

---

## Development Workflow

### Prerequisites
- **Node.js** (version not specified, use latest LTS)
- **npm** (comes with Node.js)
- **Supabase account** (for database and auth)
- **Google Gemini API key** (for AI features)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd career-track-planer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file (or `.env`) with:
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SITE_URL=http://localhost:3000
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

   **Important Notes:**
   - `VITE_` prefix required for all client-side environment variables (Vite convention)
   - All variables with `VITE_` prefix are automatically injected at build time
   - See `.env.example` for template

4. **Set up Supabase database**

   Run migrations in Supabase SQL Editor:
   ```sql
   -- Create jobs table (initial schema not in repo, inferred from code)
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
     salary TEXT
   );

   -- Run migration to add link column
   -- See: migrations/add_link_column.sql
   ALTER TABLE jobs ADD COLUMN IF NOT EXISTS link TEXT;
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```
   Access at: `http://localhost:3000`

### Available Scripts

```bash
npm run dev      # Start Vite dev server (port 3000)
npm run build    # Build for production
npm run preview  # Preview production build locally
```

**Note:** No test, lint, or format scripts configured.

### Development Server Configuration
- **Port:** 3000 (configured in `vite.config.ts`)
- **Host:** 0.0.0.0 (allows network access)
- **Hot Module Replacement (HMR):** Enabled by default

### Path Aliases
The project uses `@/` as an alias for `/src/`:

```typescript
// Instead of:
import { useJobs } from '../../../hooks/useJobs';

// Use:
import { useJobs } from '@/hooks/useJobs';
```

Configured in:
- `vite.config.ts` - `resolve.alias`
- `tsconfig.json` - `compilerOptions.paths`

---

## Architecture & Patterns

### State Management Architecture

The application uses a **multi-layer state management** approach:

#### 1. Global State (React Context API)

**AuthContext** (`/home/user/career-track-planer/src/contexts/AuthContext.tsx`):
- Manages user authentication state
- Provides: `user`, `loginWithGoogle()`, `loginWithEmail()`, `logout()`, `isLoading`
- Syncs with Supabase auth via `onAuthStateChange` listener
- Maps Supabase user to simplified `User` type

**ThemeContext** (`/home/user/career-track-planer/src/contexts/ThemeContext.tsx`):
- Manages light/dark mode toggle
- Persists to `localStorage` key: `career_track_theme`
- Respects system preferences on first load
- Provides: `theme`, `toggleTheme()`

#### 2. Custom Hooks (Shared Logic)

**useJobs** (`/home/user/career-track-planer/src/hooks/useJobs.ts`):
- Fetches jobs from Supabase on user login
- Provides CRUD operations: `addJob`, `editJob`, `updateStatus`, `deleteJob`
- **Optimistic updates** - UI updates immediately, then syncs with DB
- **Rollback on error** - reverts optimistic updates if DB operation fails
- **Data mapping** - Converts snake_case (DB) ↔ camelCase (UI)

#### 3. Component State (Local)

Uses `useState` for:
- Form data (inputs, selections)
- UI toggles (modals, dropdowns, menus)
- Filter/sort state
- Drag-and-drop state
- Loading states

#### 4. Data Flow

```
Supabase DB → useJobs hook → App.tsx → JobBoard → JobCard
                ↓
         AuthContext (user)
                ↓
         All components
```

**Key Principle:** Data flows down, events bubble up.

### Component Patterns

#### Composition Pattern
```tsx
<Layout>  {/* Wrapper */}
  <Sidebar />  {/* Desktop nav */}
  <Header />   {/* Mobile nav */}
  <main>
    {/* Page content */}
  </main>
</Layout>
```

#### Controlled Components
All form inputs are controlled (value + onChange):
```tsx
<input
  type="text"
  value={formData.company}
  onChange={(e) => setFormData({...formData, company: e.target.value})}
/>
```

#### Modal Modes
JobModal supports multiple modes:
- `'add'` - Create new job
- `'edit'` - Edit existing job
- `'view'` - Read-only view

#### Optimistic Updates Pattern
```typescript
const addJob = async (job: JobApplication) => {
  // 1. Optimistic update (immediate UI feedback)
  const tempId = crypto.randomUUID();
  setJobs(prev => [{ ...job, id: tempId }, ...prev]);

  // 2. Database operation
  const { data, error } = await supabase.from('jobs').insert(dbJob);

  // 3. Handle result
  if (error) {
    // Rollback on error
    setJobs(prev => prev.filter(j => j.id !== tempId));
  } else {
    // Replace temp ID with real ID
    setJobs(prev => prev.map(j => j.id === tempId ? { ...j, id: data.id } : j));
  }
};
```

### Routing Architecture

**Route Structure:**
```tsx
<BrowserRouter>
  <App>
    {!user ? <LoginPage /> : (
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ScheduleView />} />
          <Route path="/board" element={<JobBoard />} />
          <Route path="/stats" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    )}
  </App>
</BrowserRouter>
```

**Protected Routes:**
- All routes require authentication
- Unauthenticated users see `LoginPage`
- No nested routes or dynamic parameters

### Data Persistence

**Remote (Supabase PostgreSQL):**
- Jobs table with user isolation (`user_id` foreign key)
- Real-time sync via Supabase client
- Row Level Security (RLS) enforced

**Local (localStorage):**
- Theme preference: `career_track_theme`
- Legacy jobs key (cleaned on logout): `career_track_jobs`

**Session (Supabase Auth):**
- Automatic token management
- Auto-refresh on auth state changes

---

## Coding Conventions

### TypeScript Conventions

#### Naming Conventions
- **Components:** PascalCase (e.g., `JobBoard.tsx`, `DeleteConfirmModal.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useJobs`, `useAuth`)
- **Types/Interfaces:** PascalCase (e.g., `JobApplication`, `User`)
- **Enums:** PascalCase with SCREAMING_SNAKE_CASE values
  ```typescript
  export enum ApplicationStatus {
    RESEARCH = 'RESEARCH',
    TO_APPLY = 'TO_APPLY',
    APPLIED = 'APPLIED'
  }
  ```
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `MOCK_JOBS`, `TRANSLATIONS`)
- **Functions:** camelCase (e.g., `addJob`, `loginWithGoogle`)

#### Type Definitions
All types defined in `/home/user/career-track-planer/src/types.ts`:

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

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  location: string;
  status: ApplicationStatus;
  roleType: RoleFocus;
  dateAdded: string;      // ISO date string (YYYY-MM-DD)
  lastUpdated: string;    // ISO date string (YYYY-MM-DD)
  notes: string;
  salary?: string;        // Optional
  link?: string;          // Optional, added via migration
}

export interface ScheduleBlock {
  id: string;
  startTime: string;      // HH:MM format
  endTime: string;        // HH:MM format
  title: string;
  description: string;
  category: 'Research' | 'Deep Work' | 'Break' | 'Learning' | 'Network' | 'Admin';
  isFixed: boolean;
}
```

#### Type Safety
- **No `any` types** - Use proper typing throughout
- **Strict TypeScript** - `experimentalDecorators: true` for future use
- **Explicit return types** - Not enforced but recommended for complex functions

### Database ↔ UI Mapping

The codebase uses different naming conventions for database vs UI:

**Database (snake_case):**
```sql
user_id, role_type, date_added, last_updated
```

**UI (camelCase):**
```typescript
userId, roleType, dateAdded, lastUpdated
```

**Mapping happens in `useJobs.ts`:**
```typescript
// DB → UI
const mappedJobs: JobApplication[] = data.map((job: any) => ({
  id: job.id,
  company: job.company,
  roleType: job.role_type,       // snake_case → camelCase
  dateAdded: job.date_added,
  lastUpdated: job.last_updated,
  // ...
}));

// UI → DB
const dbJob = {
  user_id: user.id,
  role_type: job.roleType,        // camelCase → snake_case
  date_added: job.dateAdded,
  last_updated: job.lastUpdated,
  // ...
};
```

### React Conventions

#### Component Structure
```tsx
// 1. Imports
import React from 'react';
import { ComponentProps } from '../types';
import { useCustomHook } from '../hooks/useCustomHook';

// 2. Component definition
export const MyComponent: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 3. Hooks (always at top, same order)
  const [state, setState] = useState();
  const { data } = useCustomHook();

  // 4. Event handlers
  const handleClick = () => {
    // ...
  };

  // 5. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

#### Hook Usage Rules
- **Always at top level** - Never inside conditions/loops
- **Consistent order** - Same hooks in same order across renders
- **Exhaustive dependencies** - Include all used values in dependency arrays

#### Props vs Context
- **Props** - For component-specific data (company, position, etc.)
- **Context** - For cross-cutting concerns (user, theme)

### Styling Conventions

#### Tailwind CSS Patterns

**Utility-First Approach:**
```tsx
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
```

**Responsive Design:**
```tsx
<div className="flex-col md:flex-row"> {/* Mobile stacked, desktop row */}
<div className="hidden md:block">      {/* Desktop only */}
<div className="md:hidden">            {/* Mobile only */}
```

**Dark Mode:**
```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
```

**Conditional Classes:**
```tsx
<button className={`px-4 py-2 rounded-lg ${
  isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
}`}>
```

#### Color System
- **Primary:** `indigo-600`, `indigo-500` (buttons, links)
- **Status Colors:**
  - Research: `gray-500`
  - To Apply: `blue-500`
  - Applied: `yellow-500`
  - Interview: `purple-500`
  - Offer: `green-500`
  - Rejected: `red-500`
- **Role Types:**
  - PM: `blue-500`
  - QA: `purple-500`

#### Custom Scrollbar
Defined in `index.html`:
```css
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #f1f1f1; }
::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
```

### Error Handling Conventions

**User-Facing Errors:**
```typescript
if (error) {
  console.error('Error adding job:', error);
  alert('Failed to save job. Please try again.');  // Simple alerts for now
}
```

**Silent Errors (logged only):**
```typescript
if (error) {
  console.error('Error updating status:', error);
  // No alert - non-critical operation
}
```

**Rollback on Error:**
```typescript
const previousJobs = [...jobs];
setJobs(prev => prev.filter(j => j.id !== id));

const { error } = await supabase.from('jobs').delete().eq('id', id);

if (error) {
  console.error('Error deleting job:', error);
  setJobs(previousJobs);  // Revert optimistic update
}
```

---

## Database Schema

### Jobs Table

**Table Name:** `jobs`

**Schema:**
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL,  -- ApplicationStatus enum values
  role_type TEXT NOT NULL,  -- 'PM' | 'QA' | 'General'
  date_added DATE NOT NULL,
  last_updated DATE NOT NULL,
  notes TEXT,
  salary TEXT,
  link TEXT  -- Added via migration
);

-- Indexes (assumed, not in repo)
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_date_added ON jobs(date_added DESC);
```

**Columns:**
- `id` - UUID primary key (auto-generated)
- `user_id` - Foreign key to `auth.users` (Supabase managed)
- `company` - Company name (required)
- `position` - Job title/position (required)
- `location` - Job location (required)
- `status` - Application status (enum: RESEARCH, TO_APPLY, APPLIED, INTERVIEW, OFFER, REJECTED)
- `role_type` - Role focus (PM, QA, General)
- `date_added` - Date job was added to tracker
- `last_updated` - Auto-updated on status/edit changes
- `notes` - Free-text notes (optional)
- `salary` - Salary information (optional)
- `link` - URL to job posting (optional, added via migration)

**Row Level Security (RLS):**
Assumed to be configured (not in repo):
```sql
-- Users can only access their own jobs
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs"
  ON jobs FOR DELETE
  USING (auth.uid() = user_id);
```

### Migrations

**Location:** `/home/user/career-track-planer/migrations/`

**Migration: `add_link_column.sql`**
```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS link TEXT;
COMMENT ON COLUMN jobs.link IS 'URL link to the job posting';
```

**How to Apply Migrations:**
1. Open Supabase Dashboard → SQL Editor
2. Paste migration SQL
3. Execute

---

## Key Features

### 1. Authentication System

**Providers:**
- **Google OAuth** - One-click login via Google account
- **Magic Link** - Email-based passwordless authentication

**Implementation:**
- `AuthContext` manages auth state globally
- `LoginPage` component provides UI
- Supabase handles token management, session persistence

**Auth Flow:**
```
User clicks "Login with Google"
  → supabase.auth.signInWithOAuth({ provider: 'google' })
  → Redirect to Google consent screen
  → Google redirects back with token
  → onAuthStateChange fires
  → User state updated in AuthContext
  → App re-renders with authenticated routes
```

### 2. Daily Schedule Planner

**Location:** `/home/user/career-track-planer/src/components/ScheduleView.tsx`

**Features:**
- Pre-configured time blocks (09:00-15:00)
- 6 categories: Research, Deep Work, Break, Learning, Network, Admin
- Bilingual schedules (EN/DE)
- Export to Google Calendar (.ics files)
- AI-powered "Get Focus" button for task suggestions

**Schedule Data:**
```typescript
// Defined in constants.ts
const SCHEDULE_EN: ScheduleBlock[] = [
  { id: '1', startTime: '09:00', endTime: '10:30', title: 'Research Companies', ... },
  // ...
];
```

**AI Integration:**
```typescript
// Generate advice for a specific time block
const advice = await generateTaskAdvice(block, userFocus, language);
```

### 3. Job Application Tracker (Kanban Board)

**Location:** `/home/user/career-track-planer/src/components/JobBoard.tsx` (769 lines)

**Core Features:**

**A. Kanban Columns (6 statuses):**
```
Research → To Apply → Applied → Interview → Offer → Rejected
```

**B. Drag-and-Drop:**
- Mouse drag (desktop)
- Touch drag with long-press (mobile, 300ms delay)
- Auto-scroll when dragging near edges
- Visual feedback (ghost element, pulse animation on drop zones)

**Implementation:**
```typescript
// Drag handlers
onMouseDown={handleMouseDown}
onTouchStart={handleTouchStart}
onMouseMove={handleMouseMove}
onTouchMove={handleTouchMove}
onMouseUp={handleDrop}
onTouchEnd={handleDrop}
```

**C. Advanced Filtering:**
- Multi-status filter (checkboxes)
- Text search (company, position, notes, location)
- Date range filters (dateAdded, lastUpdated)
- Collapsible filter panel

**Filter Logic:**
```typescript
const filteredJobs = jobs.filter(job => {
  // Status filter
  if (filters.status.length > 0 && !filters.status.includes(job.status)) {
    return false;
  }
  // Search filter
  if (filters.search && !jobMatchesSearch(job, filters.search)) {
    return false;
  }
  // Date filters
  if (filters.dateAddedFrom && job.dateAdded < filters.dateAddedFrom) {
    return false;
  }
  // ...
  return true;
});
```

**D. Sorting (9 options):**
- Date added (newest/oldest)
- Last updated (newest/oldest)
- Company (A-Z, Z-A)
- Position (A-Z, Z-A)
- Status order

**E. Data Export:**
- CSV export with UTF-8 BOM (Excel compatibility)
- Filename includes date: `job-applications-YYYY-MM-DD.csv`
- All fields included

### 4. Analytics Dashboard

**Location:** `/home/user/career-track-planer/src/components/Dashboard.tsx`

**Visualizations:**
- **Summary Cards:** Total applications, active pipeline, interviews
- **Application Funnel:** Horizontal bar chart (Recharts)
- **Role Distribution:** Donut chart (PM vs QA)

**Chart Configuration:**
```tsx
<BarChart data={statusData} layout="horizontal">
  <XAxis type="number" stroke={theme === 'dark' ? '#9ca3af' : '#374151'} />
  <YAxis type="category" dataKey="name" />
  <Bar dataKey="value" fill="#6366f1" />
</BarChart>
```

### 5. Internationalization (i18n)

**Languages:** English, German

**Implementation:** Custom i18n system (no library)

**Translation Storage:** `/home/user/career-track-planer/src/constants.ts`
```typescript
export const TRANSLATIONS = {
  en: { /* 200+ keys */ },
  de: { /* 200+ keys */ }
};
```

**Usage:**
```typescript
const t = TRANSLATIONS[language];
<h2>{t.board.title}</h2>
```

**Coverage:**
- All UI text (buttons, labels, placeholders)
- Status labels
- Error messages
- Schedule content (separate EN/DE versions)

### 6. Dark Mode

**Implementation:** `ThemeContext` + Tailwind's `dark:` classes

**Toggle Behavior:**
```typescript
const toggleTheme = () => {
  const newTheme = theme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  localStorage.setItem('career_track_theme', newTheme);

  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};
```

**System Preference Detection:**
```typescript
const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches
  ? 'dark' : 'light';
```

---

## Common Tasks

### Adding a New Component

1. **Create component file:**
   ```tsx
   // src/components/NewComponent.tsx
   import React from 'react';
   import { Language } from '@/types';
   import { TRANSLATIONS } from '@/constants';

   interface NewComponentProps {
     language: Language;
     // ...other props
   }

   export const NewComponent: React.FC<NewComponentProps> = ({ language }) => {
     const t = TRANSLATIONS[language];

     return (
       <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
         <h2 className="text-xl font-semibold">{t.newSection.title}</h2>
       </div>
     );
   };
   ```

2. **Add translations to `constants.ts`:**
   ```typescript
   export const TRANSLATIONS = {
     en: {
       // ...existing
       newSection: {
         title: 'New Section',
         // ...
       }
     },
     de: {
       // ...existing
       newSection: {
         title: 'Neuer Abschnitt',
         // ...
       }
     }
   };
   ```

3. **Import and use in parent component:**
   ```tsx
   import { NewComponent } from './components/NewComponent';

   <NewComponent language={language} />
   ```

### Adding a New Route

1. **Create component** (see above)

2. **Add route to `App.tsx`:**
   ```tsx
   <Routes>
     <Route element={<Layout />}>
       <Route path="/" element={<ScheduleView />} />
       <Route path="/board" element={<JobBoard />} />
       <Route path="/stats" element={<Dashboard />} />
       <Route path="/new-page" element={<NewComponent language={language} />} />
       <Route path="*" element={<Navigate to="/" replace />} />
     </Route>
   </Routes>
   ```

3. **Add navigation link to `Sidebar.tsx` and `Header.tsx`:**
   ```tsx
   <NavLink
     to="/new-page"
     className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
       isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : ''
     }`}
   >
     <NewIcon className="w-5 h-5" />
     <span>{t.nav.newPage}</span>
   </NavLink>
   ```

4. **Add translations for nav link.**

### Modifying Database Schema

1. **Create migration file:**
   ```bash
   touch migrations/add_new_column.sql
   ```

2. **Write SQL:**
   ```sql
   -- Migration: Add new_column to jobs table
   ALTER TABLE jobs ADD COLUMN IF NOT EXISTS new_column TEXT;
   COMMENT ON COLUMN jobs.new_column IS 'Description of column';
   ```

3. **Apply in Supabase:**
   - Open Supabase Dashboard → SQL Editor
   - Paste and execute migration

4. **Update TypeScript types:**
   ```typescript
   // src/types.ts
   export interface JobApplication {
     // ...existing fields
     newColumn?: string;  // Add new field
   }
   ```

5. **Update useJobs mapping:**
   ```typescript
   // useJobs.ts - DB → UI mapping
   const mappedJobs: JobApplication[] = data.map((job: any) => ({
     // ...existing
     newColumn: job.new_column,  // snake_case → camelCase
   }));

   // useJobs.ts - UI → DB mapping
   const dbJob = {
     // ...existing
     new_column: job.newColumn,  // camelCase → snake_case
   };
   ```

### Adding New Translations

1. **Add keys to `TRANSLATIONS` object:**
   ```typescript
   // src/constants.ts
   export const TRANSLATIONS = {
     en: {
       // ...existing
       myNewFeature: {
         title: 'My New Feature',
         description: 'This is a new feature',
         button: 'Click Me'
       }
     },
     de: {
       // ...existing
       myNewFeature: {
         title: 'Meine neue Funktion',
         description: 'Dies ist eine neue Funktion',
         button: 'Klick mich'
       }
     }
   };
   ```

2. **Use in components:**
   ```tsx
   const t = TRANSLATIONS[language];
   <h2>{t.myNewFeature.title}</h2>
   ```

### Adding a Supabase Query

1. **Create function in `useJobs.ts` or new hook:**
   ```typescript
   const fetchJobsByStatus = async (status: ApplicationStatus) => {
     if (!user) return [];

     const { data, error } = await supabase
       .from('jobs')
       .select('*')
       .eq('user_id', user.id)
       .eq('status', status)
       .order('date_added', { ascending: false });

     if (error) {
       console.error('Error fetching jobs by status:', error);
       return [];
     }

     // Map snake_case → camelCase
     return data.map((job: any) => ({
       id: job.id,
       company: job.company,
       // ...rest of mapping
     }));
   };
   ```

2. **Use in component:**
   ```tsx
   const { fetchJobsByStatus } = useJobs(user);
   const interviewJobs = await fetchJobsByStatus(ApplicationStatus.INTERVIEW);
   ```

### Integrating a New AI Feature

1. **Add method to `geminiService.ts`:**
   ```typescript
   export const generateNewFeature = async (input: string): Promise<string> => {
     try {
       const prompt = `Your prompt here with ${input}`;

       const result = await genAI
         .getGenerativeModel({ model: 'gemini-3-flash-preview' })
         .generateContent(prompt);

       return result.response.text();
     } catch (error) {
       console.error('Error generating feature:', error);
       return 'Sorry, I encountered an error. Please try again.';
     }
   };
   ```

2. **Use in component:**
   ```tsx
   const [aiResponse, setAiResponse] = useState('');
   const [loading, setLoading] = useState(false);

   const handleGenerate = async () => {
     setLoading(true);
     const response = await generateNewFeature(userInput);
     setAiResponse(response);
     setLoading(false);
   };
   ```

---

## Testing Strategy

**Current Status:** No testing infrastructure

**Manual Testing Checklist:**
- [ ] Authentication (Google OAuth, Magic Link)
- [ ] CRUD operations on jobs
- [ ] Drag-and-drop functionality
- [ ] Filtering and sorting
- [ ] Dark mode toggle
- [ ] Language switching
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Export functionality (CSV, iCal)
- [ ] AI features (task advice, job analysis)

**Recommended Testing Setup (Future):**

1. **Install Vitest:**
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom
   ```

2. **Add test script:**
   ```json
   "scripts": {
     "test": "vitest",
     "test:ui": "vitest --ui"
   }
   ```

3. **Priority test targets:**
   - `useJobs` hook (CRUD operations, optimistic updates)
   - Filter/sort logic in `JobBoard`
   - Date formatting utilities
   - Authentication flows

---

## Deployment

### Vercel Deployment

**Configuration:** `/home/user/career-track-planer/vercel.json`
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures all routes are handled by the SPA (React Router).

### Deployment Steps

1. **Connect to Vercel:**
   - Push code to GitHub
   - Import repository in Vercel dashboard

2. **Configure environment variables in Vercel:**
   ```
   VITE_SUPABASE_URL=<your_url>
   VITE_SUPABASE_ANON_KEY=<your_key>
   VITE_SITE_URL=<your_vercel_url>
   VITE_GEMINI_API_KEY=<your_api_key>
   ```

   **Important:** All variables must use the `VITE_` prefix to be accessible in the client-side application.

3. **Deploy:**
   - Vercel auto-deploys on every push to main branch
   - Preview deployments for pull requests

4. **Verify:**
   - Check authentication redirects work
   - Test all features in production

### Build Output
```bash
npm run build
# Outputs to: dist/
# - dist/index.html
# - dist/assets/*.js (bundled code)
# - dist/assets/*.css (if any)
```

---

## Important Notes for AI Assistants

### Critical Principles

1. **Never Skip Authentication Checks**
   - All database operations require `user.id`
   - Always check `if (!user) return;` before Supabase calls

2. **Maintain Optimistic Updates**
   - Update UI immediately for better UX
   - Always provide rollback logic for errors
   - See `useJobs.ts` for reference patterns

3. **Preserve snake_case ↔ camelCase Mapping**
   - Database uses snake_case (`role_type`, `date_added`)
   - UI uses camelCase (`roleType`, `dateAdded`)
   - Always map when reading/writing to Supabase

4. **Follow Tailwind Dark Mode Pattern**
   - Every styled element needs both light and dark variants
   - Pattern: `bg-white dark:bg-gray-800 text-gray-900 dark:text-white`
   - Test in both themes

5. **Translations are Non-Negotiable**
   - Every user-facing string must have EN and DE versions
   - Add to `TRANSLATIONS` object in `constants.ts`
   - Never hardcode English-only text

6. **Type Safety First**
   - No `any` types unless absolutely necessary
   - Define interfaces in `types.ts`
   - Use enums for fixed value sets (e.g., `ApplicationStatus`)

7. **Responsive Design is Required**
   - Mobile-first approach
   - Test at breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
   - Use Tailwind responsive prefixes: `md:`, `lg:`

### Common Pitfalls to Avoid

1. **Don't Forget Date Formatting**
   ```typescript
   // Always use ISO date format for consistency
   const today = new Date().toISOString().split('T')[0];  // YYYY-MM-DD
   ```

2. **Don't Break Drag-and-Drop**
   - Touch events require `touchstart`, `touchmove`, `touchend`
   - Mouse events require `mousedown`, `mousemove`, `mouseup`
   - Always handle both for cross-device compatibility

3. **Don't Skip Error Handling**
   ```typescript
   // Always log errors and provide user feedback
   if (error) {
     console.error('Error description:', error);
     alert('User-friendly message');  // Or use a toast library
   }
   ```

4. **Don't Modify `index.html` Without Reason**
   - Tailwind config is inline (intentional for CDN usage)
   - Font loading is optimized
   - Only change if absolutely necessary

5. **Don't Add Dependencies Lightly**
   - Current bundle is lean
   - Justify new dependencies (why not built-in solution?)
   - Check bundle size impact

### Code Modification Guidelines

**When Modifying JobBoard.tsx:**
- This is the largest component (769 lines)
- Consider splitting into smaller components if adding features
- Maintain filter/sort state consistency
- Preserve drag-and-drop functionality

**When Modifying useJobs.ts:**
- Test optimistic updates thoroughly
- Ensure rollback logic works for all operations
- Keep snake_case ↔ camelCase mapping consistent

**When Adding New Features:**
1. Check if existing patterns can be reused
2. Add translations first (prevents forgetting)
3. Implement dark mode from the start
4. Test on mobile before considering "done"
5. Update this CLAUDE.md file if adding new conventions

### Performance Considerations

**Current Performance Characteristics:**
- CDN Tailwind adds ~50KB initial load (acceptable trade-off)
- No code splitting (single bundle)
- No memoization (React.memo, useMemo) - not needed yet
- Optimistic updates make app feel fast

**When to Optimize:**
- If JobBoard gets > 100 jobs, consider virtualization
- If bundle exceeds 500KB, implement code splitting
- If re-renders become noticeable, add memoization

### Security Checklist

When adding new features, verify:
- [ ] Environment variables use `VITE_` prefix for client-side access
- [ ] User input is sanitized (React auto-escapes JSX)
- [ ] External links use `rel="noopener noreferrer"`
- [ ] Supabase RLS policies isolate user data
- [ ] No sensitive data logged to console in production

### Debugging Tips

**Supabase Issues:**
```typescript
// Enable verbose logging
const { data, error } = await supabase.from('jobs').select('*');
console.log('Supabase response:', { data, error });
```

**Authentication Issues:**
```typescript
// Check current session
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);
```

**Rendering Issues:**
```typescript
// Add debug output
console.log('Rendering JobBoard with', jobs.length, 'jobs');
console.log('Filters:', filters);
console.log('Sorted jobs:', sortedJobs);
```

### File Size Guidelines

**When to Split Components:**
- Over 300 lines → Consider extracting sub-components
- Over 500 lines → Strongly recommend splitting
- JobBoard (769 lines) is at the upper limit

**Example Split for JobBoard:**
```
JobBoard.tsx (main)
  ├── JobBoardFilters.tsx (filter panel)
  ├── JobBoardToolbar.tsx (sort, export buttons)
  ├── JobBoardColumn.tsx (single Kanban column)
  └── JobBoardCard.tsx (already split as JobCard.tsx)
```

### Git Workflow

**Branch Naming:**
- Feature: `feature/feature-name`
- Bugfix: `bugfix/bug-description`
- Hotfix: `hotfix/critical-fix`

**Commit Messages:**
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Examples:
  - `feat: add dark mode support to Dashboard`
  - `fix: resolve drag-and-drop issue on mobile`
  - `docs: update CLAUDE.md with new patterns`

**Before Committing:**
- [ ] Test in both light and dark modes
- [ ] Verify EN and DE translations
- [ ] Check responsive design (mobile/desktop)
- [ ] Ensure TypeScript compiles (`npm run build`)
- [ ] Review console for errors/warnings

---

## Quick Reference

### File Locations (Quick Access)

| Purpose | File Path |
|---------|-----------|
| Main App | `/home/user/career-track-planer/src/App.tsx` |
| Types | `/home/user/career-track-planer/src/types.ts` |
| Translations | `/home/user/career-track-planer/src/constants.ts` |
| Auth Logic | `/home/user/career-track-planer/src/contexts/AuthContext.tsx` |
| Theme Logic | `/home/user/career-track-planer/src/contexts/ThemeContext.tsx` |
| Job CRUD | `/home/user/career-track-planer/src/hooks/useJobs.ts` |
| Supabase Config | `/home/user/career-track-planer/src/lib/supabase.ts` |
| AI Service | `/home/user/career-track-planer/src/services/geminiService.ts` |
| Main Board | `/home/user/career-track-planer/src/components/JobBoard.tsx` |
| Vite Config | `/home/user/career-track-planer/vite.config.ts` |
| TS Config | `/home/user/career-track-planer/tsconfig.json` |

### Environment Variables

```bash
# All environment variables require VITE_ prefix for client-side access
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SITE_URL=http://localhost:3000
VITE_GEMINI_API_KEY=your-gemini-key
```

### Key Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Useful Code Snippets

**Get Current User:**
```typescript
const { user } = useAuth();
if (!user) return;  // Always check before DB operations
```

**Get Translations:**
```typescript
const t = TRANSLATIONS[language];
<button>{t.board.addJob}</button>
```

**Toggle Theme:**
```typescript
const { theme, toggleTheme } = useTheme();
<button onClick={toggleTheme}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</button>
```

**Optimistic Update Pattern:**
```typescript
// 1. Update UI
setData(prev => [...prev, newItem]);

// 2. Sync with DB
const { error } = await supabase.from('table').insert(newItem);

// 3. Handle error
if (error) {
  setData(prev => prev.filter(item => item.id !== newItem.id));
}
```

---

## Changelog

### 2026-01-15
- Initial CLAUDE.md creation
- Comprehensive codebase analysis
- Documented all patterns and conventions
- Added common tasks and troubleshooting guides
- Fixed Gemini API configuration to use standard Vite environment variables (VITE_GEMINI_API_KEY)
- Updated vite.config.ts to remove custom define block (now uses standard Vite env injection)
- Corrected all documentation to reflect proper VITE_ prefix usage

---

## Contributing

When making significant architectural changes:
1. Update this CLAUDE.md file
2. Add examples to relevant sections
3. Update Quick Reference if adding new files/patterns
4. Keep "Last Updated" date current

This document is the source of truth for AI assistants. Keep it accurate and comprehensive.
