# CareerTrack Planer

A React single-page application for managing your job search, with a Kanban board, interview tracking, Google Calendar import, a timeline, daily schedule planning, AI coaching, and analytics.

**Tech stack:** React 18, TypeScript 5, Vite 6, Supabase, React Router 7, Recharts, and Tailwind CSS (loaded from the CDN).

---

## Features

- **Kanban board** — Move Job Applications between Research, To Apply, Applied, Interview, Offer, and Rejected; export applications as CSV.
- **Interview Rounds** — Track dates, start/end times, meeting links, status, and notes for each Job Application.
- **Google Calendar import** — Manually select timed events from multiple calendars and attach them as Interview Rounds, with duplicate prevention per application.
- **Timeline** — View application milestones and interview appointments chronologically.
- **Daily schedule** — Follow a predefined schedule, get Gemini task suggestions, export it as `.ics`, or add individual blocks to Google Calendar.
- **Analytics** — View added, applied, rejected, and interview counts by day, week, or month; choose preset or custom periods and inspect rejection depth and the related applications.
- **Responsive UI** — Desktop, tablet, and mobile layouts, with light, dark, and system themes.
- **Bilingual** — German by default, with English available throughout the app.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [Supabase](https://supabase.com/) project with the existing `jobs` schema (see [Database setup](#database-setup))
- A Google Gemini API key for AI coaching (optional for the rest of the app)
- A configured Google OAuth provider for Google sign-in and Calendar import

---

## Local Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repo-url>
   cd career-track-planer
   npm install
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   Replace the placeholder values:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SITE_URL=http://localhost:3000

   # Server-side only (no VITE_ prefix)
   GEMINI_API_KEY=your_gemini_api_key
   ```

   The `VITE_` variables are exposed to the browser. Keep `GEMINI_API_KEY` server-side with no `VITE_` prefix. The test credentials in the example are only needed for Playwright.

3. **Prepare Supabase** — follow [Database setup](#database-setup) and [Authentication](#authentication) below.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app runs at [http://localhost:3000](http://localhost:3000).

### Local API routes

`npm run dev` starts Vite and serves the SPA. The Vite configuration has no API proxy or serverless runtime, so Gemini coaching and Google Calendar import require a runtime that serves `api/` as well. `npm run preview` also serves only the frontend build.

For the full app locally, use [Vercel CLI's `vercel dev`](https://vercel.com/docs/cli/dev) from the repository root with the environment variables configured. Follow its project setup prompts and use the URL it reports; set `VITE_SITE_URL` and the Supabase auth redirect configuration to match that URL.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build the SPA into `dist/` with Vite |
| `npx tsc --noEmit` | Run TypeScript checks separately |
| `npm run preview` | Preview the production build |
| `npm run test:e2e` | Run Playwright E2E tests (headless) |
| `npm run test:e2e:ui` | Run E2E tests with Playwright UI |
| `npm run test:e2e:headed` | Run E2E tests with visible browser |

There are no configured lint or formatter scripts. `npm run build` does not run TypeScript checks.

---

## Database Setup

The app uses three user-scoped tables in Supabase:

- **`jobs`** — Job applications with status, company, position, location, salary, notes, and link
- **`interview_rounds`** — Interview rounds linked to jobs with dates, times, meeting links, and status
- **`application_events`** — An event log of application creation and status changes, written by database triggers and read by analytics

The repository contains incremental migrations, **not a complete database bootstrap**: there is no migration that creates the initial `jobs` table or its RLS policies. Start from an existing project/schema with `jobs.id`, `user_id`, `company`, `position`, `location`, `status`, `date_added`, `last_updated`, `notes`, and `salary`. Application Status values are `RESEARCH`, `TO_APPLY`, `APPLIED`, `INTERVIEW`, `OFFER`, and `REJECTED`; the event-log migration expects `status` to be `TEXT`. Preserve per-user RLS on `jobs`.

Run pending SQL files manually in the Supabase Dashboard SQL Editor. The filenames are not chronological; the following order satisfies their dependencies:

1. [`add_link_column.sql`](migrations/add_link_column.sql)
2. [`remove_role_type_column.sql`](migrations/remove_role_type_column.sql)
3. [`add_interview_rounds.sql`](migrations/add_interview_rounds.sql)
4. [`add_interview_times.sql`](migrations/add_interview_times.sql)
5. [`add_meeting_link_to_interview_rounds.sql`](migrations/add_meeting_link_to_interview_rounds.sql)
6. [`add_google_calendar_source_to_interview_rounds.sql`](migrations/add_google_calendar_source_to_interview_rounds.sql)
7. [`fix_interview_rounds_updated_at_trigger.sql`](migrations/fix_interview_rounds_updated_at_trigger.sql)
8. [`add_job_updated_at.sql`](migrations/add_job_updated_at.sql)
9. [`fix_job_updated_at_round_scope.sql`](migrations/fix_job_updated_at_round_scope.sql)
10. [`add_application_events.sql`](migrations/add_application_events.sql)
11. [`fix_application_event_local_date.sql`](migrations/fix_application_event_local_date.sql)
12. [`fix_application_event_same_day_local_date.sql`](migrations/fix_application_event_same_day_local_date.sql)
13. [`fix_application_event_date_validation.sql`](migrations/fix_application_event_date_validation.sql)

Check what has already been applied before running a file: some migrations are not safe to rerun. npm scripts do not apply migrations. Deleting a Job Application cascades to its Interview Rounds and Application Events.

Analytics counts status transitions from the event log, so moving an application back and applying again records another application event. Existing applications receive best-effort backfilled events when the event-log migration runs. Interview counts use Interview Round dates; the timeline still derives milestones from application fields and rounds. See the [event-log decision](docs/adr/0001-application-event-log.md) for details.

---

## Authentication

The app supports Google OAuth and email magic links through Supabase Auth. All four app routes (`/`, `/timeline`, `/schedule`, and `/stats`) require a signed-in user.

Configure the Google provider for Google sign-in and enable email auth for magic links. Set the Supabase Site URL and allowed redirect URLs for your local and deployed app; `VITE_SITE_URL` is used for email and Calendar connection redirects. See [Supabase redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls).

Calendar import requests the `https://www.googleapis.com/auth/calendar.readonly` scope when the user connects Calendar. Enable the Google Calendar API for the Google OAuth project. For magic-link users, the app uses Supabase identity linking to connect Google, which requires manual identity linking to be enabled. Import copies selected events into Interview Rounds; subsequent Calendar edits are not synchronized automatically.

---

## Testing

Playwright runs desktop Chromium, a tablet viewport (`768×1024`), and a Pixel 5 mobile profile. It starts `npm run dev` automatically.

1. Create a dedicated password-based test user in the migrated Supabase project.
2. Put these values in `.env` or export them in your shell:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_TEST_USER_EMAIL=your_test_user_email
   VITE_TEST_USER_PASSWORD=your_test_user_password
   ```

   Playwright explicitly loads `.env`, not `.env.local`. Use the same Supabase project for the app and the test setup.

3. Install the browser and run the suite:

   ```bash
   npx playwright install chromium
   npm run test:e2e
   ```

The setup project signs in with the test credentials and writes `e2e/.auth/user.json`. Test credentials and generated auth state should remain uncommitted. Tests create and delete application data, so use a dedicated test account.

Focused runs:

```bash
npx playwright test e2e/calendar.unit.spec.ts --project=chromium
npx playwright test e2e/job-card-responsive.spec.ts --project=tablet
```

These commands also run the authentication setup dependency. See [Testing](docs/agents/testing.md) for responsive targets.

---

## Deployment (Vercel)

1. Connect your GitHub repo to [Vercel](https://vercel.com/)
2. Set the following environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_URL`
   - `GEMINI_API_KEY` *(server-side, no `VITE_` prefix)*
3. Set `VITE_SITE_URL` to your deployed app URL and update Supabase auth redirects.
4. Use `npm run build` as the build command and `dist` as the output directory. Configure the Git integration's production branch for automatic deployments.

Vercel serves the functions in `api/`: `/api/gemini`, `/api/calendar/calendars`, and `/api/calendar/events`. The rewrite in `vercel.json` sends other routes to `index.html` so SPA deep links work.

---

## Project Structure

```
src/
├── main.tsx          # Browser entrypoint
├── App.tsx           # Auth/theme providers and protected routes
├── components/       # Board, job modal, timeline, schedule, analytics, Calendar import
├── contexts/         # Auth and theme state
├── hooks/            # User-scoped jobs, Interview Rounds, and Application Events
├── lib/              # Supabase client, analytics, dates, CSV, and Calendar utilities
├── services/         # Gemini client calling /api/gemini
├── types.ts          # UI models
└── constants.ts      # English/German translations and schedule definitions
api/
├── gemini.ts         # Server-side Gemini handler
├── calendar/         # Google Calendar list and event handlers
└── utils/            # Request validation and Calendar normalization
e2e/                  # Playwright browser, API, and utility tests
migrations/           # Manually applied incremental SQL migrations
docs/                 # Agent workflow, design plans, and architecture decisions
CONTEXT.md            # Domain vocabulary
```

The `@/*` alias resolves to `src/*`. Hooks map snake_case database columns to camelCase UI models.

GitHub Issues are the project tracker; see the [issue workflow](docs/agents/issue-tracker.md). Domain terms are defined in [CONTEXT.md](CONTEXT.md).

---

## License

MIT
