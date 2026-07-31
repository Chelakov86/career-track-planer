# Agent Guide

## Project Boundaries

- This is a single Vite + React + TypeScript SPA. The browser entrypoint is `src/main.tsx`; `src/App.tsx` provides auth/theme context and owns the protected routes `/`, `/timeline`, `/schedule`, and `/stats`.
- `src/components/` contains UI, `src/contexts/` contains auth/theme state, `src/hooks/` contains Supabase CRUD, `src/lib/` contains client utilities, and `src/services/geminiService.ts` calls the AI API.
- `api/` contains Vercel serverless functions, `migrations/` contains manually applied Supabase SQL, and `e2e/` contains all Playwright tests. The `@/*` TypeScript/Vite alias resolves to `src/*`.

## Setup And Verification

- Requires Node.js 18+. Install with `npm install`.
- Create `.env.local` from `.env.example` for the app. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_SITE_URL` are browser variables; `GEMINI_API_KEY` must remain server-side and must never use a `VITE_` prefix.
- Run the app with `npm run dev`; Vite listens on port `3000` and `0.0.0.0`.
- `npm run build` runs only `vite build`; it is not a TypeScript check. Run `npx tsc --noEmit` separately when typechecking is needed.
- There are no configured lint or formatter scripts. Do not assume `npm run lint` or `npm run format` exists.
- Playwright starts `npm run dev` automatically and tests Chromium plus Pixel 5. Its config explicitly loads `.env`, not `.env.local`; put the Supabase URL/key and `VITE_TEST_USER_EMAIL`/`VITE_TEST_USER_PASSWORD` in `.env` or export them before running E2E tests.
- E2E setup signs into Supabase with that password-based test user and writes `e2e/.auth/user.json`; the test user and migrated Supabase project must exist before `npm run test:e2e`.
- Useful focused commands are `npx playwright test e2e/calendar.unit.spec.ts --project=chromium` and `npx playwright test e2e/<file>.spec.ts --project=chromium -g "<test name>"`.

## Data And API Invariants

- Supabase columns are snake_case while UI models are camelCase. Keep the mapping at the hook boundary (`src/hooks/useJobs.ts` and `src/hooks/useInterviewRounds.ts`); do not pass database field names through components.
- All Supabase access is user-scoped. Preserve the auth guard and `user_id` filtering/RLS assumptions when changing CRUD or adding queries.
- Job dates use `YYYY-MM-DD`; interview times use `HH:MM` (or the database `TIME` representation). Deleting a job cascades to its interview rounds in Supabase.
- Add schema changes as a new file in `migrations/` and apply SQL manually in the Supabase Dashboard SQL Editor; npm scripts do not run migrations. Create `interview_rounds` before applying migrations that add its columns, Google Calendar source fields, or its timestamp trigger.
- `/api/gemini` is the server-side boundary for Gemini. Keep `GEMINI_API_KEY` in server-side environment configuration only; client code should call the endpoint through `src/services/geminiService.ts`.

## UI Conventions

- User-facing copy belongs in `src/constants.ts` and must be added for both `en` and `de`; the app defaults to German.
- Tailwind is loaded from the CDN and configured in `index.html` with class-based dark mode; there is no Tailwind package/config pipeline to extend.
- Preserve responsive behavior and dark-mode variants when changing styled components, especially the drag-and-drop board in `src/components/JobBoard.tsx`.

## Agent Workflow References

- GitHub Issues are the project tracker; use `gh` according to `docs/agents/issue-tracker.md`.
- For triage labels use `docs/agents/triage-labels.md`. For domain/ADR guidance, follow `docs/agents/domain.md` and read `CONTEXT.md` or relevant `docs/adr/` files when they exist.
