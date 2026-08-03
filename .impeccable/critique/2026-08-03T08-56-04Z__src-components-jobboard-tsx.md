---
target: Job Board (src/components/JobBoard.tsx)
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 4
p2_count: 2
timestamp: 2026-08-03T08-56-04Z
slug: src-components-jobboard-tsx
---
# Design Critique — CareerTrack Planer Job Board (`src/components/JobBoard.tsx`, route `/`)

## Design Health Score — 27/40 (Good foundation, weak spots)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Drag highlight, pulsing drop target, filter chips, count badges — state is never silently wrong |
| 2 | Match System / Real World | 3 | Kanban + status vocabulary native; "Excel Export" button downloads a CSV |
| 3 | User Control and Freedom | 3 | Modals exit cleanly; zero undo for status moves — a mis-drag to REJECTED is one-way |
| 4 | Consistency and Standards | 3 | Tokens consistent; edit/delete icons invisible until hover while every other control is visible |
| 5 | Error Prevention | 3 | Good delete confirm; nothing guards an accidental drop, Save disables without explanation |
| 6 | Recognition Rather Than Recall | 3 | Column counts persist; search/sort hides behind a collapsed panel |
| 7 | Flexibility and Efficiency | 2 | Next-status chevron is a real accelerator; no keyboard DnD, no bulk triage, no duplicate |
| 8 | Aesthetic and Minimalist Design | 2 | 258px cards with ~9 zones each; toolbar + panel ≈ 18 controls; "compact" claim unmet |
| 9 | Error Recovery | 2 | Failed saves roll back silently — console.error only, no message, no toast, no undo |
| 10 | Help and Documentation | 2 | No onboarding, no drag hint on mobile, title-attribute tooltips only |
| **Total** | | **27/40** | **Acceptable-Good** |

## Design Specificity Verdict

**LLM assessment (unanchored, before detector):** Partially grounded — roughly 60/40. The skin is a mission log; the skeleton is a generic kanban. A CRM or support-ticket board could ship this surface with a find-and-replace of copy. What is genuinely product-specific: the empty-column mission voice ("Jedes Nein bringt dich näher ans Ja."), the "wirklich unwiderruflich löschen" delete confirm, the drag choreography (airborne tilt, primary ring, heavy shadow — the only expressive object), the glass FAB. Two choices dilute the stated doctrine ("Events are Facts"): the REJECTED column is dimmed (`opacity-60 grayscale-[0.5]`, `JobBoard.tsx:1075`) — an editorialization absent from DESIGN.md — and the most important record-keeping actions are hover-only.

**Deterministic scan:** CLI found 5 findings — all false positives or pre-existing unrelated: `border-l-4` is the documented 4px status accent (DESIGN.md:193), the two 9px sizes are the documented micro fact-tag exception (DESIGN.md:163), and both color hits live on the Stats page (Dashboard.tsx), not the board. Net: the CLI found zero real problems on the board surface — everything that matters is drift the scanner structurally cannot see. Browser evidence (computed styles, WCAG math, focus probes) found the real issues: 5 measured contrast failures, ghost buttons invisible under keyboard focus, a malformed `focus:ring-primary/50/60` class, and filled mobile columns violating DESIGN.md:248.

**Visual overlays:** No user-visible overlay — no native browser tool in this session; fallback signal used (Playwright computed-style + geometry probes at 1440/390, light+dark, authenticated German session, plus screenshots in `/tmp/opencode/shots/`).

## Overall Impression

A genuinely well-made kanban with one signature interaction (the drag), warm copy, and disciplined tokens — sitting inside a product whose deeper idea (an honest, append-only record) the surface keeps apologizing for. The single biggest opportunity: make the record the star — which means un-dimming REJECTED, un-hiding the actions, and shrinking the card so 68 entries stop looking like a wall of identical dossiers.

## What's Working

1. **The drag system is crafted, not bolted on.** Column flash + 2px primary dashed border on drop hover, the airborne ghost per the shadow state-machine, edge auto-scroll, 5px move-threshold separating click from drag, touch long-press with vibration. The most product-specific interaction in the app.
2. **Filter state is never silently wrong.** Active-filter chips with individual × removal, per-column count badges, "Zeige 70 von 70", toolbar badge counting active filter groups — the user always knows why they see what they see.
3. **The mission voice is real copy, not decoration.** Empty-state silhouettes and "wirklich unwiderruflich löschen" could not be lifted into another product unchanged.

## Priority Issues

**P0 — Hover-only actions are invisible where hover doesn't exist.** Card edit/delete icons are `opacity-0 group-hover:opacity-100` (`JobCard.tsx:155-165`). On touch (390px verified) they never render — deleting on mobile means blind-tapping an invisible icon; the view modal has no delete button. On desktop, a Tab-key user lands on an invisible button: `opacity: 0` persists after focus, no `focus-visible` treatment, in both themes.
- *Fix:* reveal icons permanently on touch devices (`sm:hidden`/`sm:flex` split) or add delete to the view modal; add `focus-visible:opacity-100` + ring to the ghost buttons.
- *Suggested command:* `$impeccable adapt src/components/JobCard.tsx` · `$impeccable audit`

**P1 — Card density collapses the log.** A card measures 258px desktop / 237px mobile with ~9 zones (salary tag, notes, interviews toggle, view button, footer) visible at rest. The Research column holds 68 of them — a ~17,500px scroll of identical dossiers. DESIGN.md promises "compact cards"; the density bump at 2xl is cosmetic, not structural.
- *Fix:* at-rest card ≈ 2 rows (title/company + one meta line); move notes/salary/rounds behind the view layer.
- *Suggested command:* `$impeccable distill src/components/JobCard.tsx`

**P1 — At 1440px the two most important columns are off-screen.** Measured: scroll container 1120px vs 1760px content — only 4 of 6 columns visible, no edge fade, no scroll hint. OFFER (the win) and REJECTED (the record) are invisible at rest on a standard desktop.
- *Fix:* drop the `2xl:min-w-[300px]` floor at lg/xl or default `showEmptyColumns` off; add an edge-fade affordance.
- *Suggested command:* `$impeccable layout src/components/JobBoard.tsx`

**P1 — Five measured contrast failures on the fact tags.** Footer timestamp `text-slate-400` on white = 2.56:1 (dark 3.07:1); salary tag emerald-600 on emerald-50 = 3.58:1; remote tag primary-on-primary/10 in dark = 2.41:1 (the same combo as nav-active — system-wide); empty-column copy ≈ 1.5–1.9:1 effective. All need 4.5:1.
- *Fix:* darken light-mode Field Grey usage on cards, use 700-level tints on pills, stop opacity-dimming empty-state text.
- *Suggested command:* `$impeccable audit` → `$impeccable polish`

**P1 — The board is rendered twice in the DOM.** Desktop and mobile boards both mount every card (138 `.job-card` nodes for 70 jobs). Screen readers traverse everything twice; a 300-application search means 600 nodes.
- *Fix:* one board, responsive restyling per breakpoint.
- *Suggested command:* `$impeccable adapt src/components/JobBoard.tsx`

**P2 — REJECTED is dimmed, not recorded.** `opacity-60 grayscale-[0.5]` contradicts PRODUCT.md ("Events are Facts") and DESIGN.md's closed-status-set rule. Combined with no undo and no acknowledgment, marking a rejection is the one gesture that reads as shame instead of record.
- *Fix:* remove the dimming; keep the red pill; add a lightweight "recorded" confirm with Undo.
- *Suggested command:* `$impeccable polish` · `$impeccable harden`

**P2 — Search hides behind the collapsed panel; three decision points exceed 4 options.** Search — the core retrieval tool at 70+ jobs — is inside the Filter panel, not at rest. Sort = 8 flat options; status filter = 6 chips; JobModal status = 6 options. Mobile also renders all six sections including zero-count ones (the "hide empty columns" toggle is desktop-only).
- *Fix:* put search on the toolbar; group sort (e.g. Newest / Oldest / A–Z); hide zero-count sections on mobile.
- *Suggested command:* `$impeccable distill` · `$impeccable layout`

## Persona Red Flags

**Alex (power user, 100+ applications):** The 68-item Research wall with 258px identical cards defeats the triage the board exists for — no visual prioritization, no bulk action, no keyboard shortcuts, search buried in a panel. Hover icons cost a hover-target trip per action. Alex hits the ceiling around 100 cards.

**Sam (accessibility):** Every card is read twice (dual DOM). Ghost edit/delete buttons stay invisible under keyboard focus — Sam tabs onto an invisible control with no ring. Filter chips lack `aria-pressed`; modals have no focus trap/restore; DnD has no keyboard equivalent; the only non-drag path to REJECTED (Edit modal's select) is undiscoverable. Contrast fails on 5 micro-text combinations.

**Casey (distracted mobile):** The primary gesture is a 300ms long-press nobody is told about; the 280px drag ghost covers ~72% of the 390px screen, hiding the drop target. Tap-to-view opens a modal accidentally; the next-status chevron is 16px (needs 44). Deleting requires blind-tapping an invisible icon. Five statuses start collapsed behind accordions.

## Minor Observations

- "Excel Export" (DE) exports CSV; EN honestly says "Export CSV".
- Malformed class `focus:ring-primary/50/60` on the search input → ring silently falls back to blue-500, violating the One Signal Rule.
- Dead animation classes under the CDN setup (`animate-in fade-in zoom-in`, `animate-fadeIn`, `custom-scrollbar`) — modals pop, dropdowns don't animate.
- Card top row reserves ~46px for two permanently-invisible icons, even on touch.
- Filter/sort state is component-local and unmounts on route change — search is lost navigating away and back.
- Two different reset verbs: "Alle Filter zurücksetzen" vs "Alle Filter löschen".
- The chevron skips REJECTED (INTERVIEW → OFFER); the only non-drag path to Rejected is the Edit modal.
- Delete confirm never mentions interview rounds are cascade-deleted.
- `SearchX` doubles as "no results" and empty-column icon — two meanings, one glyph.
- Sticky column headers hardcode `bg-[#f6f6f8]/80` / `dark:bg-[#101622]/90` instead of tokens.
- Mobile columns use filled backgrounds — direct violation of DESIGN.md:248 ("columns stay transparent").
- Sidebar theme toggle has no focus indicator (black 1px ≈ 1.15:1 on slate-800).

## Questions to Consider

1. REJECTED is dimmed to 60% and greyscaled. If the event log is the product's truth-telling heart, whose decision is it to make the record quieter at the exact moment it records a no?
2. Every card at rest is a 258px dossier. What if a card were a single line and the dossier opened only when a job needs attention — what would the 68-card column say about the search then?
3. At 1440px only 4 of 6 columns are visible. Is a horizontal pipeline really the right metaphor for a one-person log — or is this secretly a filterable list with a status gutter, which the app already half-owns?
4. On mobile, the least common act (view details) is one tap while the most common act (record progress) is a hidden long-press. What if drag were the fallback, not the primary gesture?
