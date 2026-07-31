# Analytics from an immutable application event log

**Status**: accepted

The analytics section needs counts of applications added, applied, and rejected per day/week/month over a selected period — but a job only stores `date_added` (trustworthy) and `last_updated` (overwritten by any edit, including notes/salary changes), so "when was this applied?" is unknowable from current state. We decided to record history instead of deriving it: an append-only `application_events` table where each row is one status transition `(job_id, from_status, to_status, occurred_on)`, with `from_status = NULL` meaning creation. Rows are written by a Postgres trigger on `jobs` (insert + status change), so the log can never diverge from the board and no client write path can forget to log. Analytics counts events as they literally happened ("events are facts"): backward moves don't erase earlier events, re-applications count twice, past periods never change retroactively. Existing jobs get a one-time backfill synthesized from `date_added`/`last_updated`, flagged `backfilled = true` because those dates are approximations. Analytics weeks are ISO 8601 (Monday-start), matching the app's German default.

## Considered Options

- **Derive events from current job fields** (as `TimelineView` does) — rejected: applied dates are approximate, and historical charts silently change when a user edits unrelated fields.
- **Dedicated `applied_date` / `rejected_date` columns** — rejected: accurate going forward for exactly two event types, but no re-applications, no interview/offer extensibility, and every future event type needs another column.

## Consequences

- A mis-drag (e.g. accidental APPLIED → TO_APPLY → APPLIED) pollutes the stats until a manual "void event" escape hatch is built (deferred).
- `TimelineView` still derives events heuristically; migrating it to the log additionally requires logging interview-round events (rounds are not status transitions) and is a separate, deferred piece of work.
- Backfilled rows make pre-launch charts immediately useful, but their applied/rejected dates are best-effort; the `backfilled` flag keeps that distinguishable.
