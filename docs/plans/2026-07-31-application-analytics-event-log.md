# Application Analytics & Event Log Implementation Plan

**Goal:** Replace the Dashboard's "Applications Over Time" chart with analytics that answer "how many applications were added / applied / rejected, and how many interviews happened, per day / week / month over a selected period" — plus a "Rejections by interview stage" widget — all sourced from a new immutable application event log.

**User Story:** As a job seeker, I want to see my application activity (added, applied, rejected) and interviews broken down by day, week, or month over a period I choose, and see how many rejections arrived after 0, 1, 2, or 3+ interviews, so I can judge both my activity level and where my pipeline leaks.

**Architecture:** A new append-only `application_events` table records every job status transition, written exclusively by a Postgres trigger on `jobs` (no client write-path changes, log cannot diverge from the board). A one-time backfill synthesizes events for existing jobs, flagged `backfilled`. The frontend fetches events user-scoped through a new hook, computes buckets with pure functions in `src/lib/analytics.ts`, and renders them in a reworked `Dashboard` with recharts (already in the stack). Interview-over-time data is derived from the existing `interview_rounds.interview_date`, not from the log.

**Tech Stack:** React 18, TypeScript, Vite, Supabase Postgres (SQL migration applied manually), recharts, Tailwind (CDN), Playwright for tests.

**Domain references:** `CONTEXT.md` (Application Event, Event Log, Events are Facts, Grain, Selected Period, Backfilled Event, Rejection Depth) and `docs/adr/0001-application-event-log.md` govern the vocabulary and the decision.

---

## Product Decisions

Resolved via `/grill-with-docs` session on 2026-07-31:

- Events are **recorded**, not derived from current job state.
- An Application Event is a **generic status transition** `(job_id, from_status, to_status, occurred_on)`; `from_status = NULL` means creation, and only creation. No narrow `{added, applied, rejected}` enum.
- **Events are facts**: created-directly-in-APPLIED counts as added + applied on the same day; APPLIED → TO_APPLY does not erase the earlier applied event; REJECTED → APPLIED counts as a second applied event. No void/correction UI in this iteration.
- **Backfill**: synthesize events for existing jobs (same date heuristic `TimelineView` uses today), flag them `backfilled = true`.
- **Week = ISO 8601, Monday–Sunday** (app defaults to German). Month = calendar month. All dates are plain `DATE` in the user's local timezone.
- **Period selection**: presets (this week, last 4 weeks, last 8 weeks, last 3 months, this year, all time) + custom from–to range. **Grain is a separate manual toggle** (day/week/month), default week. Default view: last 8 weeks, weekly (mirrors today's chart).
- **Visualization**: one grouped bar chart, series = added / applied / rejected / interviews, with period-total chips. Grouped, not stacked (the sum of series is not a meaningful quantity).
- **Controls are local** to the new chart section. KPI cards, funnel, and recent activity stay all-time/current-state. The new chart **replaces** "Applications Over Time" (a strict superset of it).
- **Rejection Depth widget**: histogram of rejection events in the selected period, bucketed 0 / 1 / 2 / 3+ by rounds reached at rejection time. Grain does not apply; period does.
- **Interviews-over-time series** is derived from `interview_rounds.interview_date` (reschedules move the bar; deleting a round removes it). Interview rounds are not logged as events in this iteration.

---

## Functional Requirements

1. Every job creation writes a creation event (`from_status = NULL`, `occurred_on = date_added`).
2. Every actual status change writes a transition event (`occurred_on = CURRENT_DATE`); updates that don't change `status` write nothing.
3. Deleting a job cascades to its events (matches job → interview_rounds behavior).
4. Users only ever read their own events (RLS, `user_id` scoping) — per AGENTS.md data invariants.
5. Existing jobs are backfilled once, flagged `backfilled`.
6. `/stats` shows a grouped bar chart of added / applied / rejected / interviews per grain bucket over the selected period, with all buckets in the range present (zero-filled).
7. Period presets + custom range; grain toggle day/week/month; defaults: last 8 weeks, weekly.
8. Period-total chips per series.
9. Rejection Depth histogram (0/1/2/3+) scoped to the selected period.
10. KPI cards, funnel, and recent activity remain unchanged.
11. All new user-facing copy in `src/constants.ts`, EN + DE (app defaults to German) — per AGENTS.md.
12. Dark-mode variants and responsive behavior preserved — per AGENTS.md.

---

## Data Model

New migration `migrations/add_application_events.sql`, following existing migration style. Apply manually in the Supabase SQL Editor (per AGENTS.md).

> **Pre-flight check:** the `jobs` table predates `migrations/`. Verify in the Supabase dashboard that `jobs.status` is `TEXT` holding the enum values `RESEARCH|TO_APPLY|APPLIED|INTERVIEW|OFFER|REJECTED`, and list existing triggers on `jobs` (see `fix_interview_rounds_updated_at_trigger.sql` — trigger mix-ups on `jobs` have happened before). Adjust the CHECK constraints below if the actual type differs.

```sql
-- Application Events: immutable record of job status transitions.
-- from_status = NULL means creation, and only creation.
CREATE TABLE application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  from_status TEXT CHECK (from_status IN ('RESEARCH','TO_APPLY','APPLIED','INTERVIEW','OFFER','REJECTED')),
  to_status TEXT NOT NULL CHECK (to_status IN ('RESEARCH','TO_APPLY','APPLIED','INTERVIEW','OFFER','REJECTED')),
  occurred_on DATE NOT NULL,
  backfilled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_application_events_user_occurred ON application_events(user_id, occurred_on);
CREATE INDEX idx_application_events_job_id ON application_events(job_id);

-- RLS: read-only for the owning user. Clients never insert/update/delete —
-- only the trigger writes (SECURITY DEFINER, table owner bypasses RLS).
ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own application events"
  ON application_events FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger: creation + real status changes only.
CREATE OR REPLACE FUNCTION public.log_application_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO application_events (job_id, user_id, from_status, to_status, occurred_on)
    VALUES (NEW.id, NEW.user_id, NULL, NEW.status, NEW.date_added);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO application_events (job_id, user_id, from_status, to_status, occurred_on)
    VALUES (NEW.id, NEW.user_id, OLD.status, NEW.status, CURRENT_DATE);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_application_event_on_insert
  AFTER INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.log_application_event();

CREATE TRIGGER log_application_event_on_status_change
  AFTER UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.log_application_event();

-- Backfill: existing jobs (dates are best-effort, flagged backfilled).
-- 1. Creation events. Initial status unknown; assume RESEARCH so these
--    rows count as "added" only — never as "applied".
INSERT INTO application_events (job_id, user_id, from_status, to_status, occurred_on, backfilled)
SELECT id, user_id, NULL, 'RESEARCH', date_added, TRUE FROM jobs;

-- 2. Synthesized applied events (same heuristic TimelineView uses today).
INSERT INTO application_events (job_id, user_id, from_status, to_status, occurred_on, backfilled)
SELECT id, user_id, 'RESEARCH', 'APPLIED',
       CASE WHEN status = 'APPLIED' THEN last_updated ELSE date_added END,
       TRUE
FROM jobs
WHERE status IN ('APPLIED','INTERVIEW','OFFER','REJECTED');

-- 3. Synthesized rejected events.
INSERT INTO application_events (job_id, user_id, from_status, to_status, occurred_on, backfilled)
SELECT id, user_id, 'APPLIED', 'REJECTED', last_updated, TRUE
FROM jobs
WHERE status = 'REJECTED';
```

Notes:
- Backfilled transition rows get a **best-guess `from_status` (never NULL)** so `from_status IS NULL` remains a reliable "creation" predicate.
- `occurred_on` for creation uses `date_added` (user-visible "added" date, possibly user-set); for transitions `CURRENT_DATE` (when the change happened).
- A REJECTED job gets both a synthesized applied event (on `date_added`) and a synthesized rejected event (on `last_updated`); if equal, both land on the same day — acceptable.

Update `src/types.ts`:

```typescript
export interface ApplicationEvent {
  id: string;
  jobId: string;
  fromStatus: ApplicationStatus | null; // null = creation, and only creation
  toStatus: ApplicationStatus;
  occurredOn: string;  // YYYY-MM-DD
  backfilled: boolean;
}

export type Grain = 'day' | 'week' | 'month';

export type PeriodPreset =
  | 'this_week' | 'last_4_weeks' | 'last_8_weeks'
  | 'last_3_months' | 'this_year' | 'all_time' | 'custom';
```

---

## Analytics Logic

New module `src/lib/analytics.ts` — pure, date-string-based functions (no DB, no React), unit-tested via a Playwright unit spec following the `e2e/calendar.unit.spec.ts` pattern.

```typescript
export interface PeriodRange { from: string; to: string }  // YYYY-MM-DD, inclusive

export function resolvePeriod(preset: PeriodPreset, custom: PeriodRange | null, today: Date): PeriodRange

export function bucketKey(dateStr: string, grain: Grain): string
// day:   'YYYY-MM-DD'
// week:  'YYYY-MM-DD' of the ISO Monday of that week
// month: 'YYYY-MM'

export function bucketLabel(key: string, grain: Grain, language: Language): string

export function listBuckets(period: PeriodRange, grain: Grain): string[]
// every bucket key from period.from through period.to, so empty buckets render as zero

export interface ActivityBucket {
  bucket: string;
  added: number;
  applied: number;
  rejected: number;
  interviews: number;
}

export function buildActivitySeries(
  events: ApplicationEvent[],
  jobs: JobApplication[],        // for interview rounds
  period: PeriodRange,
  grain: Grain
): ActivityBucket[]
// added:      fromStatus === null
// applied:    toStatus === 'APPLIED'   (includes created-in-APPLIED rows)
// rejected:   toStatus === 'REJECTED'
// interviews: interview rounds with interviewDate in the bucket (any round status)
// events/rounds outside [from, to] are excluded

export interface RejectionDepth {
  zero: number; one: number; two: number; threePlus: number;
}

export function computeRejectionDepth(
  events: ApplicationEvent[],
  jobs: JobApplication[],
  period: PeriodRange
): RejectionDepth
// per rejection event in period: depth = rounds of that job with
// interviewDate <= event.occurredOn; bucketed 0 / 1 / 2 / 3+.
// Each rejection event counts (a re-applied-then-rejected job counts twice).
```

Rules worth pinning:
- ISO week Monday-start via local-date arithmetic (avoid `Date` timezone pitfalls: parse `YYYY-MM-DD` as local, not UTC).
- Period bounds are inclusive on both ends.
- `all_time` range = earliest event/round date … today.

---

## UI Design

`Dashboard.tsx` rework — replaces the "Applications Over Time" card only:

1. **Controls row** (above the chart card): period preset `<select>`; when `custom`, two `<input type="date">` (from/to); grain toggle (three buttons: Day / Week / Month). Mobile: stacks vertically.
2. **Activity chart card**: recharts `BarChart` (horizontal layout like today) with four `Bar` series and a `Legend`. Colors mirror the TimelineView event-pill palette for cross-view consistency: added `#135bec` (primary), applied `#6366f1` (indigo-500), interviews `#a855f7` (purple-500), rejected `#ef4444` (red-500). Tooltip lists all four values per bucket.
3. **Total chips**: four small stat chips (one per series) with period totals, placed under the controls row.
4. **Rejection Depth card**: placed in the currently empty grid cell next to Recent Activity (`Dashboard.tsx:151`). Four mini-stat blocks (0 / 1 / 2 / 3+) with counts; same period scope as the chart.
5. KPI cards, funnel chart, recent activity: untouched.
6. Dark-mode classes on every new element (`dark:bg-slate-800`, `dark:border-slate-700`, etc.), matching existing cards.

New `src/hooks/useApplicationEvents.ts`:
- Signature: `useApplicationEvents(user: User | null, jobs: JobApplication[])`.
- Fetches `application_events` for the user ordered by `occurred_on`; maps snake_case → camelCase at the hook boundary (per AGENTS.md).
- Refetches whenever `jobs` changes — every job mutation (add/edit/status/drag) already updates `jobs` state, so the chart stays fresh after the trigger writes new rows. Over-fetching is trivial at personal scale.

`App.tsx`: call the hook next to `useJobs`, pass `events` as a new prop to `Dashboard` (mirrors how `jobs` is passed).

New translation keys in `src/constants.ts` under `dashboard` (EN + DE): chart title, the four series names, grain labels, the seven period presets, custom-range labels, total-chip labels, Rejection Depth title + bucket labels + empty state.

---

## Implementation Tasks

1. **Migration**: write `migrations/add_application_events.sql` (table, indexes, RLS, trigger, backfill). Verify `jobs.status` type and existing `jobs` triggers first. Apply manually in Supabase; smoke-test with one manual status change and one job creation in the SQL editor.
2. **Types**: add `ApplicationEvent`, `Grain`, `PeriodPreset` to `src/types.ts`.
3. **Analytics module**: implement `src/lib/analytics.ts` per the contract above.
4. **Unit spec**: `e2e/analytics.unit.spec.ts` (Playwright, Chromium) covering: Monday-start bucketing (incl. Sunday → previous Monday), month bucketing, zero-filled buckets, period presets (fixed `today`), created-in-APPLIED counts as added+applied, re-application counts twice, Rejection Depth date boundary (round after rejection date not counted), `backfilled` rows counted like any other.
5. **Hook**: `src/hooks/useApplicationEvents.ts`.
6. **Wiring**: `App.tsx` passes `events` to `Dashboard`.
7. **Dashboard**: controls row, grouped bar chart + legend, total chips, Rejection Depth card; remove the old weekly `useMemo` area chart.
8. **Translations**: all new keys in EN + DE.
9. **Verification**: `npx tsc --noEmit`, `npm run build`, `npx playwright test e2e/analytics.unit.spec.ts --project=chromium`; manual smoke of `/stats` in both languages and dark mode; optional focused e2e smoke of the Dashboard page if the test user's data permits.

---

## Non-Goals

- Migrating `TimelineView` to the event log (requires logging interview-round events too — separate decision).
- A "void event" escape hatch for mis-drags.
- Conversion-rate / time-in-stage stats (the log makes these cheap later).
- A global period filter for the whole Dashboard (KPI cards, funnel stay as-is).
- Logging interview rounds as events; editing/deleting/backdating individual events.
- Changing any behavior of the board, modal, timeline, or schedule views.

---

## Risks And Mitigations

- **`jobs.status` column type unknown** (initial schema predates `migrations/`) → pre-flight check in Supabase before writing CHECK constraints; keep constraints as `TEXT` checks matching the enum values in `src/types.ts`.
- **Trigger mix-ups on `jobs` have happened before** (see `fix_interview_rounds_updated_at_trigger.sql`) → distinctly named function/triggers (`log_application_event*`); verify existing triggers in pre-flight; test with a manual status change after applying.
- **RLS silently blocking trigger writes** → trigger function is `SECURITY DEFINER` and owned by the migration runner (postgres role bypasses RLS); clients get SELECT-only policy. Smoke-test verifies rows appear.
- **Backfilled dates are approximations** → flagged `backfilled`, documented in CONTEXT.md/ADR; only pre-launch data is affected.
- **Huge ranges at day grain** (e.g. all-time daily) crowd the chart → accepted; personal data volume is small and recharts degrades gracefully. No auto-grain switching (manual grain is a deliberate product decision).
- **Events refetch on every `jobs` change** → a few extra small queries per mutation; trivial at this scale.

---

## Definition Of Done

- Migration applied; creating a job and changing a status each write exactly one correct event row (verified in Supabase).
- `/stats` shows the grouped bar chart with period presets, custom range, grain toggle, totals, and the Rejection Depth card; old area chart gone.
- Numbers honor Events are Facts (created-in-APPLIED, backward moves, re-application) and ISO Monday-start weeks.
- `npx tsc --noEmit` clean; `npm run build` passes; `e2e/analytics.unit.spec.ts` green on Chromium.
- All new copy in EN + DE; dark mode and mobile layout verified.
- `CONTEXT.md` and `docs/adr/0001-application-event-log.md` exist and match the shipped behavior.
