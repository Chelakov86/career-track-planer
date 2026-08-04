---
target: mobile Job Board
total_score: 22
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
timestamp: 2026-08-03T20-56-12Z
slug: src-components-jobboard-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Counts and loading/toast feedback exist, but current stage and controls disappear during deep scrolling. |
| 2 | Match System / Real World | 3/4 | Kanban stages and application cards are familiar; the duplicated mobile navigation is not. |
| 3 | User Control and Freedom | 2/4 | Search reset, filter reset, Escape, and undo exist; there is no reliable return-to-top or show-less path. |
| 4 | Consistency and Standards | 2/4 | The visual system is coherent, but the same six statuses have two different interaction models. |
| 5 | Error Prevention | 3/4 | Delete confirmation, date constraints, disabled current status, and drag safeguards are solid. |
| 6 | Recognition Rather Than Recall | 2/4 | Labels are clear at the top, but scrolling removes search, filters, sort, and stage context. |
| 7 | Flexibility and Efficiency of Use | 2/4 | Search, filters, sort, jump navigation, and move-to exist; controls are not persistent and large stages lack efficient shortcuts. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Calm surfaces and cards work, but repeated navigation, empty groups, and toolbar weight add noise. |
| 9 | Error Recovery | 3/4 | Status undo and localized error toasts help; recovery actions are not always direct retries. |
| 10 | Help and Documentation | 1/4 | No contextual guidance explains the relationship between the status rail and groups. |
| **Total** | | **22/40** | **Acceptable; significant mobile improvements needed** |

#### Design Specificity Verdict

The visual language is recognizably CareerTrack: neutral canvases, Signal Blue actions, semantic status colors, restrained cards, and a mission-log tone. The mobile information architecture is less authored. A generic task board could use the same six-chip rail plus accordion pattern unchanged, and the duplicated stage model contradicts the product's otherwise disciplined visual language.

The deterministic scan found five baseline findings in `index.html`: Inter is flagged as an overused font at lines 27 and 30, and the scrollbar styles use undocumented `#cbd5e1`, `#475569`, and `3px` radius at lines 34 and 40. These are contextual false positives: DESIGN.md explicitly requires Inter, and the other values are browser scrollbar styling rather than product UI. No visual overlay was produced; browser DOM and scroll measurements were used instead.

#### Overall Impression

The board feels calm on arrival, then becomes structurally noisy. The first viewport spends too much attention on controls and repeats the same pipeline vocabulary twice. The largest opportunity is to give mobile one authoritative stage model and one persistent operating dock, so the user can search, filter, sort, and understand their current position without climbing back to the top.

#### What's Working

- The product-specific visual language is strong: status colors, CT branding, hairline borders, and card anatomy communicate a personal operating system rather than a generic marketing dashboard.
- Touch targets are mostly generous: filters, accordions, card actions, view details, move-to, show-more, and the FAB meet the 44px target.
- Recovery and progressive disclosure are thoughtful: eight-card previews, detail modals, move sheets, delete confirmation, localized errors, and status undo all reduce risk.

#### Cognitive Load

Six of eight checklist items fail, which is high cognitive load for a daily-use tool:

- **Single focus:** title, search, filter, sort, export, result count, six stage chips, six accordion groups, card actions, and add compete immediately.
- **Chunking:** the six statuses are presented twice before the first card.
- **Grouping:** cards are grouped clearly, but the duplicate navigation weakens the grouping model.
- **Visual hierarchy:** at 375x667, the first card begins around y=538; the working set is below a large control stack.
- **One thing at a time:** search, filter, sort, export, jump, expand, move, edit, delete, and add are all available on one surface.
- **Minimal choices:** six stage choices plus toolbar actions exceed a compact mobile decision point.
- **Working memory:** after scrolling, users must remember their filters and current stage because the controls and stage rail are gone.
- **Progressive disclosure:** the eight-card preview is good, but “Show more” is one-way and does not communicate the full scope clearly.

#### Emotional Journey

- **Arrival:** calm and trustworthy; the blue mark and restrained palette establish a professional tool.
- **First scan:** overloaded; “Recherche 241” appears in both the rail and accordion header with different interaction semantics.
- **Deep work:** disorienting; the toolbar scrolls away and the intended sticky rail does not stick because the document, not the board container, owns vertical scrolling.
- **Completion:** mixed; undo and delete confirmation reassure, but long lists have no return path and the fixed add FAB can cover card content.

#### Priority Issues

1. **[P1] Two competing mobile stage navigation models**

   **What:** The six-chip status rail at `JobBoard.tsx:1365-1393` is followed by six accordion headers at `JobBoard.tsx:1418-1433`. The same status count is represented by `aria-pressed` in one place and `aria-expanded` in another.

   **Why it matters:** Users cannot tell whether chips filter, jump, or open. The first viewport repeats the pipeline before showing work, and screen-reader users encounter redundant navigation.

   **Fix:** Make the accordion headers the authoritative stage model. Replace the six-chip rail with a single compact “current stage” selector or stage summary that jumps to a group without repeating all six labels. Keep empty stages collapsed or behind a clearly labeled secondary section.

   **Suggested command:** `$impeccable distill`

2. **[P1] Search, filters, and sort are top-only operating controls**

   **What:** The toolbar at `JobBoard.tsx:1055-1205` sits in normal flow. Search and filter values do persist in `sessionStorage`, but the controls themselves disappear during a long scan. The sticky status rail fails because `window.scrollY` changes while `main.scrollTop` remains zero.

   **Why it matters:** Users can preserve a query across navigation but cannot adjust it from the current working position. The page's main operating tools are unavailable exactly when a large stage becomes difficult to scan.

   **Fix:** Choose one mobile vertical scroll owner and make a compact operating dock sticky beneath the mobile header. Keep search visible, reduce filter/sort to icon-plus-count controls, and surface active filters with a clear action in the dock. Do not maintain separate scroll assumptions for `window`, `main`, and the board.

   **Suggested command:** `$impeccable adapt`

3. **[P1] No return-to-top or return-to-controls affordance**

   **What:** There is no back-to-top control. At 375x667, navigating deep into a long stage leaves the toolbar and stage context far above the user.

   **Why it matters:** Mobile users reviewing hundreds of applications hit a dead end at the bottom of the list. The persistent FAB is for creation, not recovery or navigation, and it can cover card content.

   **Fix:** Show an accessible 44px+ return control after the user scrolls past roughly one viewport. Place it above the FAB with safe-area spacing, or group both actions in a small bottom action rail. Scroll the actual owner, not a guessed container.

   **Suggested command:** `$impeccable adapt`

4. **[P2] “Show more” creates an irreversible long page**

   **What:** `MOBILE_PAGE_SIZE` is eight and `JobBoard.tsx:1477-1484` exposes “Mehr anzeigen (233)” without a show-less path.

   **Why it matters:** One tap turns a manageable preview into a very long document and makes the original scanning state difficult to restore.

   **Fix:** Use “show next 8” with a visible “show less,” or window large groups. Communicate scope as “Showing 8 of 241” so the user understands what is loaded.

   **Suggested command:** `$impeccable distill`

5. **[P2] Secondary actions consume the first viewport and compete with the FAB**

   **What:** The mobile toolbar gives CSV export an entire row, “Sortieren nach” can wrap at 375px, and the fixed FAB can overlap the active card's content area.

   **Why it matters:** The first card arrives too late, while an infrequent action gets the same visual priority as search and filtering. The FAB can intercept a card tap.

   **Fix:** Keep search full width, make filter and sort the two primary secondary actions, move export into an overflow menu, shorten or nowrap the mobile sort label, and reserve the bottom safe-area inset in the board content. Keep the return-to-top action visually distinct from Add.

   **Suggested command:** `$impeccable layout`

#### Persona Red Flags

**Casey, distracted mobile user:** Search and filters disappear after scrolling; the status rail is not actually sticky; the only persistent action is Add, even when the user needs navigation. The FAB can sit over card content.

**Alex, power user:** A 241-item stage requires one-card-at-a-time interaction. There is no bulk status change, efficient collapse after expansion, or quick return to the operating controls. “Show more (233)” is a poor power-user path.

**Sam, accessibility-dependent user:** Six statuses are exposed twice through different controls. Active-filter close buttons are tiny and several remove actions lack explicit accessible labels, increasing ambiguity in a linear screen-reader traversal.

#### Minor Observations

- The partially visible third status chip at 375px is the only cue that the rail scrolls horizontally.
- Mobile theme and language controls measure 32x32 and 32x24, below the board's 44px touch-target standard.
- CSV export occupies a full mobile row despite being infrequent.
- The current tests verify that accordions and the FAB exist, but not scroll ownership, sticky availability, return-to-top behavior, or 375px wrapping.
- The current `sessionStorage` persistence is working across navigation; the issue is persistent access to controls, not loss of filter/search values.

#### Questions to Consider

- Which should be authoritative on mobile: the six accordion stages, or a single-stage navigator? Keeping both full representations is the source of the confusion.
- Should the persistent mobile dock prioritize search, filter/sort, or the current stage context when space allows only two controls?
- At the bottom of a long list, should the persistent action hierarchy be “Return to controls” plus “Add,” or should Add move into the toolbar overflow?
