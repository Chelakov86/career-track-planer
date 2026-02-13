# Full App Redesign — Stitch Design Language

**Date:** 2026-02-13
**Status:** Approved
**Scope:** All pages (Login, Timeline, Schedule, Stats, Modals)
**Reference:** Board page (already redesigned with Stitch)
**Approach:** Generate Stitch designs at desktop size for each page (new project), implement one by one

---

## Design Tokens (from Board page)

| Token | Light | Dark |
|-------|-------|------|
| Primary | `#135bec` | `#135bec` |
| Background | `#f6f6f8` | `#101622` |
| Card/Surface | `white` | `slate-900` |
| Border | `gray-200` | `slate-800` |
| Text primary | `gray-900` | `white` |
| Text secondary | `gray-500` | `gray-400` |
| Font | Inter (300-700) | Inter (300-700) |
| Radius | `rounded-lg` (12px) | same |
| Active nav | `primary/10` bg + `primary` text | `primary/20` bg |
| Avatars | Hash-based color palette (blue, emerald, purple, orange, pink, teal, cyan, rose) | same |

**Shared patterns:**
- Clean white/dark cards with subtle borders (`shadow-sm`, no heavy shadows)
- Airy layouts with transparent backgrounds (no colored column fills)
- Floating action buttons (glass-fab style) where applicable
- Consistent header: bold title + subtitle left, action buttons right
- Sidebar unchanged (already matches)

---

## Page Designs

### 1. Timeline (layout rethink)

**Current:** Vertical timeline rail with colored border event cards, date headers, left border line with dots.

**Redesign:**
- **Header:** Match Board pattern — bold title + subtitle left, filter/search controls inline right (toolbar, not stacked)
- **Layout:** Drop vertical border-line timeline. Use card-based feed grouped by date with subtle date dividers (sticky labels)
- **Event cards:** White/dark surface cards (matching JobCard):
  - Small colored icon badge on the left (not full-color border)
  - Company avatar (hash-based color system from JobCard)
  - Event type as subtle pill tag (Board status tag style)
  - Time range and calendar button as secondary info
- **Filters:** Always-visible pill filters in header toolbar (like Board's filter/sort dropdowns), not toggle-to-reveal
- **Empty state:** Cleaner, matching Board's airy feel

### 2. Schedule (layout rethink)

**Current:** Vertical timeline rail with time block cards along a left border, header in a white card wrapper.

**Redesign:**
- **Header:** Match Board pattern — bold title + subtitle left, "Export All" button right. No wrapping card, clean inline layout
- **Layout:** Drop timeline rail. Stacked card list with no connecting line, consistent spacing between cards
- **Time block cards:** White/dark surface cards (matching JobCard):
  - Time range as prominent left-aligned mono label (no background badge)
  - Category as small colored pill tag (Board status tag style)
  - Category icon inline with block title
  - Description as secondary text
  - Action buttons right-aligned: outlined for Calendar, filled primary for AI Focus
  - AI advice panel uses `primary/10` tinted background with card border radius (not nested card)
- **Visual rhythm:** Sequential order + time labels convey progression (no dots or rails)

### 3. Stats/Dashboard (layout rethink)

**Current:** 3 stat cards + 1 horizontal bar chart. Very minimal (74 lines). Bar chart uses wrong color (`#6366f1` instead of `#135bec`).

**Redesign:**
- **Header:** Add Board-style header — bold "Statistics" title + subtitle left
- **Stat cards:** Keep 3-card grid, align styling:
  - Card surface: `white`/`slate-900`, `border-gray-200`/`border-slate-800`
  - Icon backgrounds from Board avatar palette
  - Add subtle secondary metric (e.g., "3 this week")
- **Funnel chart:** Update bar color to primary `#135bec`. Same card surface styling
- **New section — two-column layout on desktop:**
  - Left: "Applications over time" line/area chart (weekly activity)
  - Right: "Recent activity" compact feed (last 5-10 events)
  - Stacks on mobile
- **Overall:** Proper dashboard density, Board's card and color language throughout

### 4. Login (visual only)

**Current:** Centered card, CT logo, email input, magic link button, language switcher. Clean but disconnected from new design language.

**Redesign (no layout changes):**
- Background: `background-light`/`background-dark` tokens
- Card: `white`/`slate-900`, `border-gray-200`/`border-slate-800`, `rounded-lg` (not `rounded-2xl`), `shadow-sm` (not `shadow-xl`)
- Logo: `rounded-lg` to match sidebar logo
- Input: Board search input style (`rounded-lg`, `border-gray-300`/`slate-600`, `focus:ring-primary/50`)
- Button: Board primary button style (`bg-primary`, `rounded-lg`)
- Language switcher: Match sidebar's pill toggle (`primary/10` active state)
- Footer text: `gray-500`/`gray-400`
- Tighter spacing, less padding

### 5. Modals (alignment only)

**JobModal + DeleteConfirmModal — small fixes:**
- Border colors: `border-gray-100`/`border-slate-700` -> `border-gray-200`/`border-slate-800`
- Card radius: `rounded-xl` -> `rounded-lg`
- Header/footer: transparent with bottom/top border (drop colored backgrounds)
- Backdrop: keep as-is (`bg-black/20 dark:bg-black/50 backdrop-blur-sm`)
- Form inputs: already correct, no changes
- Interview round status pills: already correct, no changes

---

## Implementation Order

1. Create Stitch project (Desktop) and generate designs for: Timeline, Schedule, Stats, Login
2. Implement page by page, approving each Stitch design before coding:
   - Timeline
   - Schedule
   - Stats/Dashboard
   - Login
   - Modals (no Stitch needed, code directly)
3. Verify dark mode, responsive, and bilingual for each page before moving to the next

---

## Out of Scope

- Sidebar redesign (already matches)
- Header component (mobile, already matches)
- Functional changes to existing features
- New routes or pages
- Database changes
