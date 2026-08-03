# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The owner and sole user, running an active personal job search. No other audiences, no roles or permissions model. Used on desktop and mobile browsers during the daily search routine.

## Product Purpose

A personal job-search operating system: one place to run the entire search — a kanban board of Job Applications, Interview Rounds per application, a chronological Timeline, a daily Schedule planner, and Analytics over the search. Success is a polished, reliable personal tool that holds up through a real job search and is maintained long-term.

## Positioning

The search is treated as an event-sourced record: every status transition is an immutable Application Event in an append-only Event Log ("Events are Facts"). Analytics count what literally happened — backward moves never erase earlier events, and past-period numbers never change retroactively. A spreadsheet or Notion template cannot truthfully claim its history was never edited; this tool can.

## Operating Context

- Used daily during an active job search; the Schedule view is the daily execution ritual (time-blocked day, AI focus advice).
- Data lives in the owner's personal Supabase project (RLS user-scoped); auth via Google OAuth or email magic link.
- Interview appointments can be imported from Google Calendar (`api/calendar/*`, `GoogleCalendarImportPicker`).
- AI features call Google Gemini through the server-side `/api/gemini` endpoint (`GEMINI_API_KEY` stays server-side, never a `VITE_` variable).
- Deployed on Vercel; Supabase migrations are applied manually via the SQL editor from `migrations/`.

## Capabilities and Constraints

- Routes: `/` JobBoard (drag-and-drop across the six Application Statuses RESEARCH, TO_APPLY, APPLIED, INTERVIEW, OFFER, REJECTED), `/timeline`, `/schedule`, `/stats`; LoginPage gates the app.
- Interview Rounds per application (date, time, meeting link, status scheduled/completed/awaiting_feedback, notes); deleting a job cascades to its rounds.
- Timeline events are computed from jobs and rounds, not stored; analytics are computed from the Event Log.
- Analytics vocabulary is fixed: Grain (Day/Week/Month, ISO weeks), Selected Period presets, Rejection Depth buckets (0/1/2/3+), Backfilled Events flagged as approximations. Domain terms in `CONTEXT.md` are binding; avoid the listed synonyms.
- Schedule planner with six categories and CSV export (`src/lib/csvExport.ts`).
- Bilingual EN/DE with German as the default; all user-facing copy lives in `src/constants.ts` and must be added for both languages.
- Dark mode: system preference detection plus manual toggle, class-based.
- Tech: React 18 + TypeScript + Vite 6 + React Router 7; Tailwind loaded from the CDN and configured in `index.html` (no Tailwind build pipeline to extend); Recharts for charts; Supabase columns are snake_case, UI models camelCase, mapping only at hook boundaries.
- Optimistic updates with rollback are the standing interaction pattern.
- Job dates use `YYYY-MM-DD`; interview times use `HH:MM`.
- All Supabase access stays user-scoped (`user_id` filtering + RLS).
- Verification: `npx tsc --noEmit` for types, Playwright E2E (`npm run test:e2e`); no lint/format scripts exist.

## Brand Commitments

- Name: CareerTrack Planer.
- Bilingual EN/DE is mandatory; German is the default language.
- Responsive behavior and dark-mode variants are standing requirements on every styled component.

## Evidence on Hand

- `README.md` — feature list, setup, deployment.
- `CONTEXT.md` — domain glossary (Job Application, Application Event, Event Log, Grain, Selected Period, Interview Round, Rejection Depth, ...).
- `docs/adr/0001-application-event-log.md` — the event-log decision.
- `docs/plans/` — approved plans: full-app redesign "Stitch design language" (2026-02-13), Google Calendar interview import, application analytics event log.
- `DESIGN_SUGGESTIONS.md` — Stitch-generated design variants for Login and Job Board.
- `e2e/` — Playwright coverage of board, calendar import, analytics.
- Absences future work must not fabricate: no other users, no testimonials, no case studies, no pricing, no public marketing claims. This is a personal tool.

## Product Principles

1. One hub for the whole search — board, interviews, timeline, schedule, and analytics belong in a single coherent flow; never push the user back to scattered spreadsheets.
2. Events are facts — history is append-only; analytics report what literally happened and never rewrite past periods.
3. The search is a daily practice — the schedule turns intention into concrete daily time blocks.
4. Personal but production-grade — a one-user tool held to shipped-product standards: bilingual, dark mode, responsive, tested.
5. Fast and trustworthy — immediate optimistic interactions, errors in the user's language, and the user's data staying in their own Supabase project.
