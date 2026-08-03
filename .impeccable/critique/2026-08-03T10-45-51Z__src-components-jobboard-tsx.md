---
target: Job Board (src/components/JobBoard.tsx)
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 5
timestamp: 2026-08-03T10-45-51Z
slug: src-components-jobboard-tsx
---
# Design Critique - CareerTrack Planer Job Board (`src/components/JobBoard.tsx`, route `/`)

## Design Health Score - 25/40

The previous snapshot scored 27/40. This is not a like-for-like regression: the prior live state had about 70 applications, while this run had 180 applications, including 171 in Research. The lower score exposes high-volume behavior that the previous dataset did not exercise.

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Counts, rollback, errors, Undo, and no-results feedback work; slow saves have no pending indicator |
| 2 | Match System / Real World | 3 | Pipeline vocabulary is understandable, but generic tracker copy and hard-coded `Drop Here` weaken the Mission Log voice |
| 3 | User Control and Freedom | 2 | Status moves have Undo and forms have Escape; filters, sort, filter sheets, and delete do not consistently close with Escape |
| 4 | Consistency and Standards | 3 | Visual tokens are cohesive, but focus behavior and temporary-surface dismissal remain inconsistent |
| 5 | Error Prevention | 2 | Delete confirmation and disabled Save help; date presets silently create incorrect ranges and date bounds are not validated |
| 6 | Recognition Rather Than Recall | 3 | Counts, filters, and next-stage labels help; the card root is not keyboard-focusable and actions are still icon-only |
| 7 | Flexibility and Efficiency | 2 | Search, sort, filters, drag, and CSV export exist; no shortcuts, bulk actions, or direct move-to-target action |
| 8 | Aesthetic and Minimalist Design | 3 | Desktop is calm and disciplined; mobile becomes a repetitive 36,622px card tunnel |
| 9 | Error Recovery | 3 | Status rollback and localized errors work; errors are generic, transient, and offer no Retry action |
| 10 | Help and Documentation | 1 | No contextual explanation for drag behavior, status semantics, or the event-log model |
| **Total** | | **25/40** | **Acceptable; significant high-volume and mobile work remains** |

## Design Specificity Verdict

**Visually authored, behaviorally conventional.** Signal Blue, neutral surfaces, semantic tints, avatar palette, status accents, and 2xl dossier expansion make the board recognizably CareerTrack Planer. It is not a generic dashboard skin.

The core information model still reads like a conventional Kanban board: generic tracker copy, six standard columns, generic `Details anzeigen`, and no visible Application Event or "Events are Facts" cue. The Mission Log identity is strongest in styling and recovery feedback, weaker in behavior and language.

**Deterministic scan:** 11 findings: 5 warnings and 6 advisories across 6 rules. No real design-system defects were found in the current target. The `border-l-4` status accent and 9px micro-tags are documented DESIGN.md exceptions. Inter-only font findings are mandated. Google Calendar provider color and scrollbar styling are unrelated/pre-existing. The gray-on-color finding is a static class-pair false positive after the disabled-hover state was corrected.

**Browser evidence:** Fresh authenticated Chromium contexts at 1440x900 and 1920x900 light, plus 390x844 light and dark. Normal loads had no page errors; the only console warning was the intentional Tailwind CDN production warning. No user-visible overlay was available because no native browser presentation tool was exposed; Playwright computed-style, geometry, keyboard, and touch probes were used instead.

## Overall Impression

The recent passes fixed the obvious structural problems: one responsive board instead of two, real 1920px fitting, scroll fades, full-weight REJECTED, status Undo, localized error rollback, focus trapping, toolbar search, grouped sort, and corrected primary fact contrast. The next ceiling is scale: with 171 Research applications, mobile is still a long list rather than a usable daily work queue. The single biggest opportunity is to make mobile status-first and give every move a reliable explicit target.

## What's Working

1. **The visual system is disciplined and specific.** One action blue, neutral canvases, hairline separation, semantic status tints, and the Mission Log copy create a coherent product surface.
2. **Responsive composition is genuinely adapted.** At 1920px all six columns fit and fades disappear; at 1440px overflow is signaled; mobile uses stacked status sections rather than a clipped horizontal board.
3. **Status recovery is trustworthy.** Optimistic movement, localized rollback errors, and the six-second Undo toast preserve confidence in a high-stakes state transition.

## Priority Issues

**P1 - Mobile becomes a 36,622px Research tunnel.** With 171 Research applications, the first expanded section contains a very long uninterrupted card list. A user cannot meaningfully scan the pipeline or reach later statuses after opening the section.
- **Why it matters:** This is the dominant failure in the observed real-data state and directly undermines the daily-use workflow.
- **Fix:** Make mobile status-first: keep a compact six-status navigator visible, open one selected status, cap the initial list with `Show more`, and paginate or virtualize large lists. Preserve direct jumps to Interview, Offer, and Rejected.
- **Suggested command:** `$impeccable adapt` or `$impeccable optimize`

**P1 - Mobile moving is still not a reliable cross-section action.** Card actions measured 30x30px on touch; the next-status chevron measured 32x32px. Touch drag locks body scrolling, while auto-scroll only handles horizontal movement. With vertically stacked sections, dragging a Research card to Interview is not a viable primary gesture.
- **Why it matters:** Casey cannot reliably record progress, and Sam has undersized controls even though the actions are now exposed.
- **Fix:** Add an accessible `Move to...` action that opens a six-status target sheet. Keep drag as an enhancement. Make touch targets at least 44x44px.
- **Suggested command:** `$impeccable adapt`

**P1 - Date presets silently produce the wrong range.** The switch expects `last7` and `last30` at `JobBoard.tsx:562-590`, while the UI calls `last7Days` and `last30Days` at the preset buttons. Live verification showed `Letzte 7 Tage` producing only `2026-08-03` to `2026-08-03`.
- **Why it matters:** Users trust the filter result as a record of their search activity; a silently wrong range is a misleading state.
- **Fix:** Align the preset keys and switch cases, add tests for expected ranges, label From/To inputs explicitly, and validate that From is not after To.
- **Suggested command:** `$impeccable harden`

**P1 - Temporary-surface semantics and Escape behavior are incomplete.** The main modal and delete confirmation trap focus and restore it, but omit `role="dialog"` and `aria-modal="true"`. The filter sheet has no focus trap; Escape leaves it open. Delete, filter, and sort temporary surfaces do not share a consistent Escape contract.
- **Why it matters:** Screen readers do not receive dialog context, and keyboard users can fall behind an open surface or become unsure where focus moved.
- **Fix:** Use a shared dialog/sheet primitive with `role="dialog"`, `aria-modal`, labelled headings, labelled close buttons, focus trapping, Escape close, and focus restoration.
- **Suggested command:** `$impeccable harden`

**P1 - Focus indicator contrast remains below the non-text threshold.** The visible theme-toggle focus ring measured 2.24:1 in light mode and 1.68:1 in dark mode against its surrounding surface, below the 3:1 target. Interview and Offer count pills also measured approximately 2.86:1 and 3.32:1 in the light render.
- **Why it matters:** Keyboard users can lose their location, and status counts are harder to read precisely when the board is dense.
- **Fix:** Use an opaque or higher-contrast focus ring with a visible offset, and darken the Interview/Offer count text or adjust their tinted backgrounds to meet 3:1 for non-text and 4.5:1 for normal text.
- **Suggested command:** `$impeccable polish`

## Cognitive Load

| Checklist | Result | Observation |
|---|---|---|
| Single focus | Fail | Five toolbar actions compete with the board; the mobile FAB overlays the lower card area |
| Chunking | Fail | Six statuses are intrinsic, but 171 cards form one uninterrupted mobile group |
| Grouping | Pass | Status sections, card anatomy, and dashed empty states are visually clear |
| Visual hierarchy | Pass with caveat | Desktop hierarchy is strong; mobile count and list length dominate the task |
| One thing at a time | Fail | Cards expose edit, delete, details, next status, and drag behavior simultaneously |
| Minimal choices | Fail | Toolbar has 5 controls; filters expose 6 statuses plus dates and presets; sort exposes 8 options |
| Working memory | Pass | Job context and active filters remain visible |
| Progressive disclosure | Pass with caveat | Notes and rounds are hidden below 2xl/mobile, but the card list itself is not progressively limited |

**Four checklist failures.** Decision points over four options: toolbar actions; six status chips plus date controls; eight sort options; card edit/delete/details/next-status/drag; and the long mobile Research list.

## Emotional Journey

- **Entry:** Calm, legible, and visually trustworthy, but the generic title/subtitle do not establish the event-fact model.
- **Scanning:** Desktop is satisfying at 1920px. At 1440px, the right fade makes horizontal overflow understandable, but only about four columns are visible at once.
- **Status move:** Optimistic movement plus a company-specific Undo toast is the strongest new peak.
- **Failure:** Rollback and localized feedback reassure, but there is no pending state and no Retry action.
- **Rejection:** Full visual weight now supports the product doctrine better; the board still shows current state and timestamp, not the rejection event or history.
- **Delete cascade:** The confirmation names the job and warns about interview-round deletion. It has no recovery window, no exact round count, and ignores Escape.
- **Save:** The card appearing is the only success confirmation.
- **Empty states:** Dashed drop silhouettes are clear and supportive, though motivational copy is less factual than the Mission Log premise.
- **Peak-end:** Status movement ends well; delete and save end abruptly.

## Persona Red Flags

**Alex (Power User):** No keyboard shortcuts, bulk selection, or batch status changes. At 180 applications, keyboard traversal becomes hundreds of controls. Moving is drag or sequential next-stage only; there is no direct target selection. Date presets can silently return the wrong range.

**Sam (Accessibility-Dependent User):** `.job-card` is a non-focusable `div` with no keyboard equivalent for its click behavior. Desktop edit/delete targets are 22px and mobile targets 30px. The main modal lacks dialog semantics; the filter sheet lacks a focus trap. Interview and Offer count pills fail normal-text contrast in the light theme.

**Casey (Distracted Mobile User):** The first expanded status contains 171 cards and creates a roughly 36k-pixel scroll region. Touch drag locks page scrolling and cannot vertically auto-scroll to distant statuses. The FAB occupies the bottom-right card area. Filter state and accordion state are not persisted across interruption or reload.

## Minor Observations

- Browser title is `CareerTrack Scheduler`, not CareerTrack Planer: `index.html:5`.
- Filter and sort menus ignore Escape.
- Date inputs lack explicit label associations.
- `Drop Here` remains hard-coded English at `JobBoard.tsx:1259-1262`.
- The board has no visible cue for immutable Application Event history.
- Initial job loading has no JobBoard loading state; `useJobs.loading` is not passed through `App.tsx`.
- The subtitle is approximately 4.48:1 against the light canvas, just below the normal-text AA target.
- 2xl notes and interview details improve context but can make wide-screen cards tall for rapid scanning.
- The Tailwind CDN production warning remains intentional per project constraints.

## Questions to Consider

1. If Events are Facts, why does the board expose only current status and a generic timestamp instead of one compact event-history cue?
2. Is mobile really a board, or should it be a status-first work queue with an explicit move target?
3. Should permanent deletion be the primary action when interview rounds and historical trust are attached to the application?
4. What would the fastest trustworthy workflow look like for moving 20 applications from Research to To Apply?
