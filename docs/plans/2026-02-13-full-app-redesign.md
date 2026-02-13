# Full App Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign all app pages (Timeline, Schedule, Stats, Login, Modals) to match the Board page's Stitch design language.

**Architecture:** Each page is redesigned independently using Stitch-generated desktop mockups as reference, then implemented by updating existing component files. No new routes, no database changes, no new dependencies. The Board page's design tokens (primary `#135bec`, Inter font, `rounded-lg`, clean white/dark cards with subtle borders) are the foundation.

**Tech Stack:** React 18, TypeScript, Tailwind CSS (CDN), Recharts (for new Dashboard charts), Stitch (for design generation)

**Stitch Project:** Create new Desktop project, generate one screen per page, approve before coding.

---

### Task 1: Create Stitch Project and Generate Timeline Design

**Step 1: Create a new Desktop Stitch project**

Use `mcp__stitch__create_project` with title "CareerTrack Redesign - Desktop".

**Step 2: Generate Timeline screen**

Use `mcp__stitch__generate_screen_from_text` with `deviceType: "DESKTOP"` and prompt:

> "A desktop application timeline page for a job search tracker app called CareerTrack. Clean, modern design using Inter font. Color scheme: primary blue #135bec, background #f6f6f8, white cards with subtle gray-200 borders and shadow-sm. No sidebar (it's separate).
>
> Header area: Bold 'Application Timeline' title with subtitle '12 all events' on the left. On the right, an inline toolbar with: a search input (gray border, search icon), and always-visible filter pills for event types (Job Added, Interview Scheduled, Interview Completed, Awaiting Feedback) as small rounded pill buttons.
>
> Below the header: Events grouped by date. Each date has a subtle sticky label divider (e.g., 'February 13, 2026'). Under each date, event cards in a vertical list. Each event card is a white card with border-gray-200 and rounded-lg containing: a small colored icon badge on the left (blue for job added, purple for interview scheduled, green for completed, yellow for feedback), a company avatar circle with the company initial, the event description as bold text, event type as a subtle pill tag, and time range with a small calendar button for scheduled interviews. Cards have consistent spacing, no connecting timeline rail or dots."

**Step 3: Review the generated design with user before proceeding**

---

### Task 2: Implement Timeline Redesign

**Files:**
- Modify: `src/components/TimelineView.tsx` (rewrite JSX, keep all logic)

**Step 1: Replace `getEventColor` with three new helpers**

Remove `getEventColor` function. Add `getIconColor` (icon badge bg), `getEventPillColor` (pill tag), `getEventLabel` (text label):

```tsx
const getIconColor = (type: TimelineEventType) => {
  switch (type) {
    case 'job_added': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    case 'interview_scheduled': return 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
    case 'interview_completed': return 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    case 'interview_feedback': return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
    default: return 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400';
  }
};

const getEventPillColor = (type: TimelineEventType) => {
  switch (type) {
    case 'job_added': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'interview_scheduled': return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
    case 'interview_completed': return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'interview_feedback': return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    default: return 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300';
  }
};

const getEventLabel = (type: TimelineEventType) => {
  switch (type) {
    case 'job_added': return t.timeline.eventTypes.jobAdded;
    case 'interview_scheduled': return t.timeline.eventTypes.interviewScheduled;
    case 'interview_completed': return t.timeline.eventTypes.interviewCompleted;
    case 'interview_feedback': return t.timeline.eventTypes.awaitingFeedback;
    default: return '';
  }
};
```

**Step 2: Rewrite the return JSX**

Replace the entire return block. Key changes:
- Header: Board-style inline layout (title+subtitle left, search right)
- Filters: Always-visible pill buttons (no toggle), with clear button
- Events: White/dark cards with icon badge, pill tag, no timeline rail/dots
- Empty state: Simpler, lighter icon

Remove `Filter` from lucide imports (no longer needed). Remove `showFilters` state variable.

**Step 3: Build and verify**

Run: `npm run build`
Expected: No TypeScript errors.

**Step 4: Visual verification**

Check: light/dark mode, mobile/desktop responsive, EN/DE translations.

**Step 5: Commit**

```bash
git add src/components/TimelineView.tsx
git commit -m "refactor: redesign Timeline page to match Stitch design language"
```

---

### Task 3: Generate Stitch Design for Schedule Page

**Step 1: Generate Schedule screen in same Stitch project**

Use `mcp__stitch__generate_screen_from_text` with `deviceType: "DESKTOP"` and prompt:

> "A desktop daily schedule planner page for a job search tracker called CareerTrack. Clean, modern design using Inter font. Color scheme: primary blue #135bec, background #f6f6f8, white cards with subtle gray-200 borders. No sidebar.
>
> Header area: Bold 'Daily Schedule' title with subtitle 'Structured blocks for maximum productivity' on the left. On the right, an 'Export All' outlined button with download icon.
>
> Below: A vertical stack of white schedule cards with consistent 12px gap, no connecting timeline rail or dots. Each card has: a monospace time range label '09:00 - 10:00' on the top-left, a small colored category pill tag next to it (e.g., 'Research' in blue, 'Deep Work' in orange, 'Break' in green), a bold title with category icon, description text below, and two action buttons right-aligned: an outlined 'Calendar' button and a filled primary 'Get Focus' button with sparkle icon. Cards are rounded-lg with border-gray-200."

**Step 2: Review and approve with user**

---

### Task 4: Implement Schedule Redesign

**Files:**
- Modify: `src/components/ScheduleView.tsx` (rewrite JSX, keep logic)

**Step 1: Rewrite the return JSX**

Key changes:
- Header: Remove wrapping card. Board-style inline layout (title+subtitle left, export button right)
- Cards: Drop `border-l-2` timeline rail, dots, and `relative pl-6` positioning. Flat card stack with `space-y-3`
- Each card: `bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700`
- Time label: plain `font-mono text-xs text-gray-500` (no background badge)
- Category pill: colored `rounded-full` tag
- AI advice: `bg-primary/5 dark:bg-primary/10` with `border-primary/20` (not nested card look)
- Action buttons: outlined Calendar, filled primary Focus

**Step 2: Clean up imports**

Remove `Calendar` (keep `CalendarPlus`), remove `Clock` if unused.

**Step 3: Build and verify**

Run: `npm run build`

**Step 4: Visual verification**

Light/dark, mobile/desktop, EN/DE, test AI Focus button still works.

**Step 5: Commit**

```bash
git add src/components/ScheduleView.tsx
git commit -m "refactor: redesign Schedule page to match Stitch design language"
```

---

### Task 5: Generate Stitch Design for Stats/Dashboard Page

**Step 1: Generate Stats screen**

Use `mcp__stitch__generate_screen_from_text` with `deviceType: "DESKTOP"` and prompt:

> "A desktop analytics dashboard page for a job search tracker called CareerTrack. Clean, modern design using Inter font. Color scheme: primary blue #135bec, background #f6f6f8, white cards with subtle gray-200 borders. No sidebar.
>
> Header: Bold 'Statistics' title with subtitle 'Track your job search progress' on the left.
>
> Row 1: Three stat cards in a grid. Each white card with rounded-lg and border-gray-200. Contains: a colored icon in a tinted circle (blue for Total Applications '24', green for Active Pipeline '12', purple for Interviews '5'). Each has a secondary metric '3 this week' in gray text.
>
> Row 2: Two-column layout. Left: 'Application Funnel' horizontal bar chart in a white card, bars colored #135bec. Right: 'Applications Over Time' area chart showing weekly counts.
>
> Row 3: Left column empty or continuation. Right: 'Recent Activity' compact feed showing last 5 events as small rows with colored icon dot, description text, and relative time."

**Step 2: Review and approve with user**

---

### Task 6: Implement Stats/Dashboard Redesign

**Files:**
- Modify: `src/constants.ts` (new translation keys)
- Modify: `src/components/Dashboard.tsx` (significant expansion)

**Step 1: Add new translation keys to `src/constants.ts`**

Add to English `dashboard` object:
```typescript
title: "Statistics",
subtitle: "Track your job search progress",
thisWeek: "this week",
applicationsOverTime: "Applications Over Time",
recentActivity: "Recent Activity",
noActivity: "No recent activity"
```

Add to German `dashboard` object:
```typescript
title: "Statistik",
subtitle: "Verfolge deinen Bewerbungsfortschritt",
thisWeek: "diese Woche",
applicationsOverTime: "Bewerbungen im Zeitverlauf",
recentActivity: "Letzte Aktivitäten",
noActivity: "Keine Aktivitäten"
```

**Step 2: Rewrite Dashboard component**

Key additions:
- Board-style header (title + subtitle)
- Stat cards: update borders to `border-gray-200`/`border-slate-800`, add `thisWeekCount` secondary metric
- Fix bar chart color: `#6366f1` -> `#135bec`
- Fix bar chart border: `border-gray-100` -> `border-gray-200`, `dark:border-slate-700` -> `dark:border-slate-800`
- New: `AreaChart` from Recharts for "Applications Over Time" (group jobs by ISO week)
- New: "Recent Activity" feed (derive from jobs + interview rounds, sort by date desc, limit 5)
- Layout: `grid grid-cols-1 lg:grid-cols-2 gap-6` for charts row

Key computed data:
- `thisWeekCount`: jobs where `dateAdded` >= 7 days ago
- `weeklyData`: group jobs by week, compute count per week for area chart
- `recentActivity`: merge job-added events + interview events, sort desc, take 5

**Step 3: Build and verify**

Run: `npm run build`

**Step 4: Visual verification**

Check: stat cards, both charts render, activity feed shows events, dark mode, mobile stacking, EN/DE.

**Step 5: Commit**

```bash
git add src/components/Dashboard.tsx src/constants.ts
git commit -m "refactor: redesign Stats dashboard with richer layout and Stitch design tokens"
```

---

### Task 7: Generate Stitch Design for Login Page

**Step 1: Generate Login screen**

Use `mcp__stitch__generate_screen_from_text` with `deviceType: "DESKTOP"` and prompt:

> "A desktop login page for a job search tracker called CareerTrack. Background #f6f6f8. Centered white card with rounded-lg, border-gray-200, and shadow-sm. Contains: 'CT' logo in a blue #135bec rounded-lg square, bold 'Welcome Back' title, 'Sign in to continue your career journey' subtitle, email input with rounded-lg border, primary blue #135bec 'Send Magic Link' button with rounded-lg, small 'Secured by Supabase Auth' text, EN/DE language toggle pill, footer 'Protected by CareerTrack Security' in gray-500."

**Step 2: Review and approve with user**

---

### Task 8: Implement Login Redesign

**Files:**
- Modify: `src/components/LoginPage.tsx` (class name changes only)

**Step 1: Update class names throughout**

All changes are styling-only, no logic changes:
- Outer: `bg-gray-50` -> `bg-background-light`, `dark:bg-slate-900` -> `dark:bg-background-dark`
- Card: `rounded-2xl` -> `rounded-lg`, `shadow-xl` -> `shadow-sm`, `border-gray-100` -> `border-gray-200`, `dark:border-slate-700` -> `dark:border-slate-800`, `dark:bg-slate-800` -> `dark:bg-slate-900`
- Logo: `rounded-2xl` -> `rounded-lg`
- Input: `rounded-xl` -> `rounded-lg`
- Button: `rounded-xl` -> `rounded-lg`
- Success box: `rounded-xl` -> `rounded-lg`
- Language toggle: match sidebar's `primary/10` active pattern
- Footer border: `border-gray-100` -> `border-gray-200`, `dark:border-slate-700` -> `dark:border-slate-800`

**Step 2: Build and verify**

Run: `npm run build`

**Step 3: Visual verification**

Light/dark, mobile/desktop, EN/DE, magic link success state.

**Step 4: Commit**

```bash
git add src/components/LoginPage.tsx
git commit -m "refactor: align Login page styling with Stitch design tokens"
```

---

### Task 9: Implement Modal Alignment

**Files:**
- Modify: `src/components/JobModal.tsx`
- Modify: `src/components/DeleteConfirmModal.tsx`

**Step 1: Update JobModal**

In `src/components/JobModal.tsx`:
- Line 176 card: `rounded-xl` -> `rounded-lg`, `border-gray-100` -> `border-gray-200`, `dark:border-slate-700` -> `dark:border-slate-800`
- Line 177 header: `border-gray-100` -> `border-gray-200`, `dark:border-slate-700` -> `dark:border-slate-800`, remove `bg-gray-50 dark:bg-gray-850`
- Line 352 footer: `border-gray-100` -> `border-gray-200`, `dark:border-slate-700` -> `dark:border-slate-800`, remove `bg-gray-50 dark:bg-gray-850`

**Step 2: Update DeleteConfirmModal**

In `src/components/DeleteConfirmModal.tsx`:
- Line 24 card: `rounded-xl` -> `rounded-lg`, `border-gray-100` -> `border-gray-200`, `dark:border-slate-700` -> `dark:border-slate-800`

**Step 3: Build and verify**

Run: `npm run build`

**Step 4: Visual verification**

Open job modal (view/edit/add) and delete modal. Check light/dark.

**Step 5: Commit**

```bash
git add src/components/JobModal.tsx src/components/DeleteConfirmModal.tsx
git commit -m "refactor: align modal borders and radius with Stitch design tokens"
```

---

### Task 10: Run E2E Tests and Final Verification

**Step 1: Run E2E tests**

Run: `npm run test:e2e`
Expected: All tests pass (no functional changes).

**Step 2: Run build check**

Run: `npm run build`
Expected: Clean build.

**Step 3: Manual verification checklist**

- [ ] Board — unchanged, still works
- [ ] Timeline — card layout, visible filters, dark mode, mobile, EN/DE
- [ ] Schedule — card stack, no rail, dark mode, mobile, EN/DE, AI Focus works
- [ ] Stats — header, stat cards, two charts, activity feed, dark mode, mobile, EN/DE
- [ ] Login — aligned tokens, dark mode, mobile, EN/DE
- [ ] JobModal — borders/radius, view/edit/add modes, dark mode
- [ ] DeleteConfirmModal — borders/radius, dark mode

**Step 4: Fix any issues found, commit**

```bash
git add -A
git commit -m "fix: address visual inconsistencies from redesign review"
```
