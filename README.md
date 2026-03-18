<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CareerTrack Planer

A React single-page application for managing your job search — with a Kanban board, interview tracking, timeline visualization, daily schedule planning, AI coaching, and analytics.

**Tech Stack:** React 18 + TypeScript 5 + Vite 6 + Supabase + Tailwind CSS + React Router 7

---

## Features

- **Kanban Board** — Drag-and-drop job applications across stages: Research → To Apply → Applied → Interview → Offer → Rejected
- **Interview Rounds** — Track interview rounds per job (date, time, meeting link, status, notes)
- **Timeline View** — Chronological visualization of your application lifecycle
- **Daily Schedule Planner** — Time-blocked productivity system with 6 categories
- **AI Coaching** — Google Gemini integration for task suggestions and job description analysis
- **Analytics Dashboard** — Application funnel and role distribution charts
- **Bilingual** — English and German (DE) support
- **Dark Mode** — System preference detection + manual toggle

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [Supabase](https://supabase.com/) project
- A [Google Gemini API key](https://aistudio.google.com/)

---

## Local Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repo-url>
   cd career-track-planer
   npm install
   ```

2. **Configure environment variables** — create a `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SITE_URL=http://localhost:3000

   # Server-side only (no VITE_ prefix)
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Apply database migrations** — run the SQL files in `migrations/` via the Supabase Dashboard SQL Editor (in order).

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app runs at [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Production build (includes TypeScript check) |
| `npm run preview` | Preview the production build |
| `npm run test:e2e` | Run Playwright E2E tests (headless) |
| `npm run test:e2e:ui` | Run E2E tests with Playwright UI |
| `npm run test:e2e:headed` | Run E2E tests with visible browser |

---

## Database Setup

The app uses two tables in Supabase with Row Level Security (RLS) enforced per user:

- **`jobs`** — Job applications with status, company, position, location, salary, notes, and link
- **`interview_rounds`** — Interview rounds linked to jobs with dates, times, meeting links, and status

Apply all migration files from the `migrations/` folder via the Supabase SQL Editor.

---

## Deployment (Vercel)

1. Connect your GitHub repo to [Vercel](https://vercel.com/)
2. Set the following environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_URL`
   - `GEMINI_API_KEY` *(server-side, no `VITE_` prefix)*
3. Vercel auto-deploys on push to `main`

The `api/` folder contains Vercel serverless functions that keep the Gemini API key secure on the server side.

---

## Authentication

- Google OAuth
- Magic Link (email)

Auth is managed via Supabase and the `AuthContext`.

---

## Project Structure

```
src/
├── components/       # 12 React components (JobBoard, JobModal, Timeline, ...)
├── contexts/         # AuthContext, ThemeContext
├── hooks/            # useJobs, useInterviewRounds (CRUD + optimistic updates)
├── lib/              # supabase.ts, csvExport.ts, calendar.ts
├── services/         # geminiService.ts (AI integration)
├── types.ts          # TypeScript type definitions
└── constants.ts      # Translations (EN/DE) + schedule config

api/                  # Vercel serverless functions
├── gemini.ts         # Server-side Gemini API handler
└── utils/
    └── validation.ts # Whitelist-based parameter validation

e2e/                  # Playwright E2E tests
migrations/           # SQL migration files for Supabase
```

---

## License

MIT
