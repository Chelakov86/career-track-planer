# Career Track Planner

A personal job-search tracker: a kanban board of job applications, interview rounds per application, a timeline, and analytics over the search.

## Language

**Job Application**:
A single tracked opportunity (company + position) that moves through the pipeline. The central entity of the app.
_Avoid_: job posting, vacancy, card

**Application Status**:
The current pipeline state of a Job Application: RESEARCH, TO_APPLY, APPLIED, INTERVIEW, OFFER, or REJECTED. Mutable; says nothing about history.
_Avoid_: stage, phase, column

**Application Event**:
An immutable record of one status transition of a Job Application: `(job, from_status, to_status, occurred_on)`. A `from_status` of NULL means creation, and only creation. Analytics counts Application Events, never current state.
_Avoid_: activity, history entry, log line

**Event Log**:
The complete, append-only collection of Application Events. The single source of truth for "what happened when".
_Avoid_: history table, audit trail

**Events are Facts**:
The counting rule for analytics: events are counted as they literally happened. Backward moves (APPLIED → TO_APPLY) do not erase earlier events; a re-application is a second APPLIED event; past-period numbers never change retroactively.

**Grain**:
The time resolution of an analytics view: Day, Week, or Month. A Week is ISO 8601 (Monday–Sunday); a Month is a calendar month; all in the user's local timezone.
_Avoid_: bucket size, interval

**Selected Period**:
The inclusive date range an analytics view covers, chosen via presets (this week, last 4/8 weeks, last 3 months, this year, all time) or a custom from–to range.
_Avoid_: filter, timeframe

**Backfilled Event**:
An Application Event synthesized once from a pre-existing Job Application's `dateAdded`/`lastUpdated`, flagged `backfilled`. Its dates are best-effort approximations; only `dateAdded`-based dates are trustworthy.
_Avoid_: imported event, legacy event

**Interview Round**:
One interview appointment belonging to a Job Application, with a date and a status (scheduled, completed, awaiting_feedback). Not an Application Status transition.
_Avoid_: interview event, meeting

**Rejection Depth**:
The number of Interview Rounds a Job Application had reached at the time of a rejection (rounds dated on or before the rejection's `occurred_on`). Bucketed as 0 / 1 / 2 / 3+.
_Avoid_: interview stage, rounds count
