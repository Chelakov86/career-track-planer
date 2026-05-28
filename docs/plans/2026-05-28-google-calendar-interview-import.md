# Google Calendar Interview Import Implementation Plan

**Goal:** Allow users to manually import timed Google Calendar events into a job's interview rounds from the existing job modal.

**User Story:** As a job seeker, I want to select interview events from my Google Calendars and attach them to a job card, so I do not need to manually re-enter the interview date, time, title, meeting link, and notes.

**Architecture:** Manual, user-initiated import flow. The frontend requests Google Calendar access only when the user starts an import. Calendar data is fetched through Vercel serverless API routes using a temporary Google provider token. Imported events are stored as regular interview rounds with Google Calendar source metadata for duplicate prevention. No provider tokens are stored.

**Tech Stack:** React 18, TypeScript, Vite, Supabase Auth, Supabase Postgres, Vercel serverless functions, Google Calendar API.

---

## Product Decisions

- Import is manual, not automatic sync.
- Calendar permission is requested only from `Import from Google Calendar` / `Connect Google Calendar`.
- The import UI lives inside `JobModal` edit mode, in the existing `Interview Rounds` section.
- Multiple Google Calendars are supported, including shared calendars such as Family calendars.
- Selected calendar IDs are remembered in `localStorage`.
- The event search range is from the start of today through the next 90 days, including events that already happened earlier today.
- Only timed events are shown. All-day events are excluded.
- Default filtering shows interview-like events plus events that match the current job's company or position.
- A `Show all` toggle reveals all timed events from the selected calendars.
- Imported rounds keep the Google Calendar event title exactly as the round name.
- Google event descriptions are stripped to plain text before display or import.
- Importing does not change the job status.
- After import, the modal stays open and the new interview round is visible.
- Google provider tokens are not stored in the database.
- The same Google event cannot be imported twice into the same job.
- The same Google event may be imported into a different job; a warning can be added later.

---

## Functional Requirements

1. Add an `Import from Google Calendar` button inside the edit-mode interview section.
2. If Calendar access is missing, show `Connect Google Calendar`.
3. Request `https://www.googleapis.com/auth/calendar.readonly` only when connecting/importing.
4. Support users signed in with Google and users signed in by magic link.
5. For magic-link users, use Supabase Google identity linking instead of replacing the current account.
6. Before OAuth redirect, store pending import state in `sessionStorage`.
7. After OAuth redirect, return to the board, reopen the same job modal in edit mode, expand interview rounds, and resume the import picker.
8. List available Google Calendars through a serverless API route.
9. Let users select multiple calendars and remember selected calendar IDs locally.
10. List timed events from selected calendars for today through the next 90 days.
11. Exclude all-day events from the API response or frontend picker.
12. Normalize selected calendar events into `InterviewRound` fields.
13. Store Google Calendar source metadata for duplicate prevention.
14. Disable event rows already imported into the current job.
15. Show reconnect prompts for missing, expired, or unauthorized Calendar access.
16. Include EN and DE translations for all user-facing strings.
17. Preserve dark mode and responsive behavior.

---

## Data Model

Add source metadata columns to `interview_rounds`:

```sql
ALTER TABLE interview_rounds
ADD COLUMN source_provider TEXT,
ADD COLUMN source_calendar_id TEXT,
ADD COLUMN source_event_id TEXT,
ADD COLUMN source_event_url TEXT;
```

Add a partial unique index to prevent duplicate Google event imports per job:

```sql
CREATE UNIQUE INDEX idx_interview_rounds_google_event_per_job
ON interview_rounds(job_id, source_provider, source_calendar_id, source_event_id)
WHERE source_provider = 'google_calendar';
```

Update `InterviewRound` in `src/types.ts`:

```typescript
sourceProvider?: 'google_calendar';
sourceCalendarId?: string;
sourceEventId?: string;
sourceEventUrl?: string;
```

Update DB/UI mapping in `src/hooks/useInterviewRounds.ts`:

- `source_provider` <-> `sourceProvider`
- `source_calendar_id` <-> `sourceCalendarId`
- `source_event_id` <-> `sourceEventId`
- `source_event_url` <-> `sourceEventUrl`

---

## Google Event Mapping

When importing a selected Google Calendar event:

| Google Calendar field | Interview round field |
| --- | --- |
| `summary` | `roundName` |
| `start.dateTime` | `interviewDate`, `startTime` |
| `end.dateTime` | `endTime` |
| Google Meet / conference entry point / URL-like location | `meetingLink` |
| plain-text `description` | `notes` |
| selected calendar ID | `sourceCalendarId` |
| event ID | `sourceEventId` |
| event HTML link | `sourceEventUrl` |
| static value | `sourceProvider: 'google_calendar'` |
| static value | `status: 'scheduled'` |

All-day events with `start.date` and no `start.dateTime` must be excluded.

Description handling:

- Strip HTML tags.
- Decode common HTML entities.
- Collapse excessive whitespace.
- Keep imported notes plain text only.

Meeting link extraction priority:

1. Google conference entry point URI.
2. Hangout/Google Meet link.
3. First URL found in `location`.
4. First URL found in plain-text `description`.

---

## API Design

### `POST /api/calendar/calendars`

Lists calendars available to the authenticated Google account.

Request body:

```json
{
  "providerToken": "temporary-google-provider-token"
}
```

Response:

```json
{
  "calendars": [
    {
      "id": "primary",
      "summary": "Vlad",
      "primary": true,
      "backgroundColor": "#4285f4"
    }
  ]
}
```

### `POST /api/calendar/events`

Lists normalized timed events from selected calendars.

Request body:

```json
{
  "providerToken": "temporary-google-provider-token",
  "calendarIds": ["primary", "family-calendar-id"],
  "job": {
    "company": "Acme",
    "position": "Frontend Engineer"
  }
}
```

Response:

```json
{
  "events": [
    {
      "id": "event-id",
      "calendarId": "primary",
      "calendarSummary": "Vlad",
      "summary": "Technical Interview - Acme",
      "description": "Plain text notes",
      "start": "2026-06-04T14:00:00+02:00",
      "end": "2026-06-04T15:00:00+02:00",
      "interviewDate": "2026-06-04",
      "startTime": "14:00",
      "endTime": "15:00",
      "meetingLink": "https://meet.google.com/abc-defg-hij",
      "htmlLink": "https://calendar.google.com/calendar/event?eid=...",
      "isInterviewLike": true,
      "isJobMatch": true
    }
  ]
}
```

Error handling:

- Missing token: return `401` with `code: "calendar_not_connected"`.
- Google `401` / `403`: return reconnect-oriented error.
- Calendar API disabled or scope missing: return setup-oriented error.
- Invalid calendar IDs or request payload: return `400`.

---

## OAuth And Resume Flow

1. User opens an existing job in edit mode.
2. User expands `Interview Rounds`.
3. User clicks `Import from Google Calendar`.
4. If no usable Google provider token is available:
   - Store pending state in `sessionStorage`:

```json
{
  "jobId": "job-id",
  "resumeImport": true
}
```

5. Start Google OAuth / identity linking with Calendar readonly scope.
6. Google redirects back to the app.
7. App reads pending state.
8. Board opens the matching job modal in edit mode.
9. Modal expands `Interview Rounds` and opens the import picker.
10. User selects calendars and imports an event.

For magic-link users:

- Use Supabase `linkIdentity({ provider: 'google' })` with Calendar scope.
- Manual identity linking may need to be enabled in Supabase Auth settings.
- If linking is unavailable, show a setup message.

---

## UI Design

Location:

- `src/components/JobModal.tsx`
- Edit mode only.
- Inside the existing `Interview Rounds` section, near the manual `Add Interview Round` button.

Picker states:

- Connect required.
- Loading calendars.
- Calendar selection.
- Loading events.
- Filtered event list.
- Empty filtered result.
- Show all events.
- Already imported event.
- Reconnect required.
- API/setup error.

Event row content:

- Date and time range.
- Event title.
- Calendar name.
- Meeting/link indicator.
- One-line plain-text description preview.
- `Matched job` marker when matching company or position.
- `Already imported` disabled state when source metadata matches an existing round for this job.

Calendar selection:

- Multiple checkboxes.
- Default to `primary` on first use.
- Persist user-selected calendar IDs in `localStorage`.

Suggested localStorage key:

```text
career_track_google_calendar_ids
```

Suggested sessionStorage key:

```text
career_track_pending_calendar_import
```

---

## Interview Keyword Filter

Default filtered list should include events matching interview-like terms or the current job's company/position.

English terms:

- `interview`
- `screen`
- `technical`
- `recruiter`
- `hiring`
- `hr`
- `onsite`
- `on-site`
- `final`
- `coding`
- `assessment`

German terms:

- `vorstellung`
- `vorstellungsgespräch`
- `gespräch`
- `bewerbung`
- `bewerbungsgespräch`
- `interview`
- `kennenlernen`

The `Show all` toggle should reveal every timed event from the selected calendars in the date range.

---

## Implementation Tasks

### Task 1: Database And Types

Files:

- Add: `migrations/add_google_calendar_source_to_interview_rounds.sql`
- Modify: `src/types.ts`
- Modify: `src/hooks/useInterviewRounds.ts`
- Modify: `src/hooks/useJobs.ts`

Steps:

1. Add migration for source columns and unique index.
2. Update `InterviewRound` type with optional source fields.
3. Update `useInterviewRounds` snake_case/camelCase mapping.
4. Update `useJobs` interview-round mapping so job cards receive source fields.
5. Ensure optimistic updates preserve source fields.

### Task 2: Calendar Normalization Utility

Files:

- Add: `api/utils/googleCalendar.ts`
- Add or modify focused tests under `e2e/` or a suitable unit-test location.

Steps:

1. Define input types for Google Calendar API events.
2. Add `stripHtmlToText`.
3. Add `extractMeetingLink`.
4. Add `normalizeGoogleCalendarEvent`.
5. Exclude all-day events.
6. Compute `interviewDate`, `startTime`, and `endTime`.
7. Mark `isInterviewLike` and `isJobMatch`.
8. Add focused tests for timed event mapping, all-day exclusion, link extraction, HTML stripping, and keyword/job matching.

### Task 3: Serverless Calendar API

Files:

- Add: `api/calendar/calendars.ts`
- Add: `api/calendar/events.ts`
- Modify: `api/utils/validation.ts` if shared validation helpers are useful.

Steps:

1. Validate request bodies.
2. Call `https://www.googleapis.com/calendar/v3/users/me/calendarList`.
3. Call `https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events` for each selected calendar.
4. Use `timeMin` as start of today.
5. Use `timeMax` as end of the day 90 days from today.
6. Set `singleEvents=true`, `orderBy=startTime`, and `showDeleted=false`.
7. Normalize and merge event results.
8. Sort events by start time ascending.
9. Return reconnect/setup errors with specific error codes.

### Task 4: Calendar Connect Flow

Files:

- Modify: `src/contexts/AuthContext.tsx`
- Possibly add: `src/lib/googleCalendarAuth.ts`
- Modify: `src/components/JobBoard.tsx`
- Modify: `src/components/JobModal.tsx`

Steps:

1. Add helper to request Calendar readonly scope.
2. Use Google OAuth for existing Google sessions.
3. Use Supabase `linkIdentity` for magic-link sessions.
4. Store pending import state before redirect.
5. On board mount, check pending import state and matching jobs.
6. Reopen modal in edit mode with interview section expanded and import picker active.
7. Clear pending state after successful resume.

### Task 5: Import Picker UI

Files:

- Add: `src/components/GoogleCalendarImportPicker.tsx`
- Modify: `src/components/JobModal.tsx`
- Modify: `src/constants.ts`

Steps:

1. Add the picker component.
2. Fetch calendars after connect.
3. Read and write selected calendar IDs from `localStorage`.
4. Fetch events for selected calendars.
5. Show filtered events by default.
6. Add `Show all` toggle.
7. Detect already imported events using existing rounds source fields.
8. Disable duplicate imports for the current job.
9. On import, call `addRound` with normalized event data.
10. Keep modal open and show the imported round.
11. Trigger `onDataChanged` so the job card refreshes.

### Task 6: Translations And UX States

Files:

- Modify: `src/constants.ts`

Add EN and DE strings for:

- Import from Google Calendar.
- Connect Google Calendar.
- Reconnect Google Calendar.
- Select calendars.
- Show all events.
- Show matching events.
- No calendar events found.
- Already imported.
- Matched job.
- Loading calendars.
- Loading events.
- Calendar access expired.
- Calendar setup required.
- Import event.
- Import failed.

### Task 7: Verification

Commands:

```bash
npm run build
npm run test:e2e
```

Manual checks:

- Google login user can connect Calendar.
- Magic-link user can link Google identity if Supabase setting allows it.
- Multiple calendars can be selected and remembered.
- Primary calendar is selected by default on first use.
- Family/shared calendar events can be listed when selected.
- Only timed events appear.
- Events from earlier today are included.
- Events beyond 90 days are excluded.
- Default filter includes interview-like and job-matching events.
- `Show all` reveals non-matching timed events.
- Import creates an interview round.
- Modal stays open after import.
- Job card shows the imported interview after modal close/refetch.
- Same event cannot be imported twice into the same job.
- Job status remains unchanged.
- Dark mode works.
- Mobile layout remains usable.
- EN and DE strings are complete.

---

## Non-Goals

- Background Google Calendar sync.
- Editing Google Calendar events from the app.
- Storing Google access or refresh tokens.
- Auto-moving jobs to the `INTERVIEW` column.
- Importing all-day events.
- Full calendar UI.
- Calendar conflict detection.
- Reminder/notification management.

---

## Risks And Mitigations

**Risk:** Supabase provider token is unavailable after redirect.

**Mitigation:** Show reconnect prompt and keep pending import state until the user cancels or reconnects successfully.

**Risk:** Magic-link users cannot link Google identity because manual linking is disabled.

**Mitigation:** Show a specific setup message and document the Supabase Auth setting.

**Risk:** Calendar event descriptions contain unsafe HTML.

**Mitigation:** Strip HTML and store plain text only.

**Risk:** Duplicate imports create noisy interview rounds.

**Mitigation:** Store Google source metadata and enforce a partial unique index per job.

**Risk:** Shared calendars create too much noise.

**Mitigation:** Require explicit calendar selection and remember selected calendars locally.

**Risk:** Provider token expires during import.

**Mitigation:** Treat Google `401` / `403` as reconnect-required states.

---

## Definition Of Done

- Database migration exists and documents source metadata fields.
- Types and hooks preserve source metadata through DB/UI mapping.
- Serverless API lists calendars and normalized timed events.
- Import picker works inside `JobModal` edit mode.
- OAuth resume reopens the same job modal and import picker.
- Multiple selected calendars are remembered locally.
- Duplicate imports into the same job are blocked.
- User-facing strings exist in EN and DE.
- Focused normalization tests pass.
- `npm run build` passes.
- Manual smoke test confirms import flow works end to end.
