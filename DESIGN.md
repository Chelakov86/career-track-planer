---
name: CareerTrack Planer
description: A calm mission log for the job search — one blue signal, neutral canvases, facts on record.
colors:
  primary: "#135bec"
  primary-hover: "#1d4ed8"
  canvas-light: "#f6f6f8"
  canvas-dark: "#101622"
  surface-light: "#ffffff"
  surface-dark: "#0f172a"
  surface-nested-dark: "#1e293b"
  border-light: "#e5e7eb"
  border-dark: "#334155"
  text-primary-light: "#111827"
  text-primary-dark: "#ffffff"
  text-secondary-light: "#6b7280"
  text-secondary-dark: "#94a3b8"
  accent-applied: "#135bec"
  accent-interview: "#fbbf24"
  accent-offer: "#10b981"
  danger: "#dc2626"
  glass-fab: "rgba(19, 91, 236, 0.85)"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  micro:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 700
    letterSpacing: "0.05em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-light}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-primary-light}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface-light}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface-light}"
    rounded: "{rounded.xl}"
    padding: "12px"
  input-text:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-primary-light}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  nav-item-active:
    backgroundColor: "rgba(19, 91, 236, 0.1)"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  pill-status:
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: CareerTrack Planer

## Overview

**Creative North Star: "The Mission Log"**

CareerTrack Planer reads like the flight log of a job search: every application recorded, every transition entered once and never rewritten, every view a calm instrument panel reporting the facts. The system keeps its voice down so the record can speak. One committed blue — Signal Blue — carries every action, active state, and focus signal; everything else is neutral canvas, hairline borders, and small tinted pills that classify without shouting.

Density is honest and scannable: compact cards, 14px UI text, uppercase micro-tags for the facts that matter at a glance (salary, remote, counts). Surfaces are flat at rest and separated by borders, not blur or gradient. Depth arrives only as a consequence of interaction — a hovered card lifts, a dragged card tilts and casts a heavy shadow, the floating action button glows through frosted glass. Dark mode is not an inversion but a second uniform: Night Slate canvas, slate surfaces, the same Signal Blue.

**Key Characteristics:**
- One accent (Signal Blue #135bec) over neutral light/dark canvases; all other hue is semantic status.
- Inter only, weights 300–700; hierarchy by weight and size, never by font family.
- Flat-by-default surfaces with hairline borders; shadows escalate only with state.
- Gently curved corners: 8px controls, 12px cards, pills fully round.
- Status communicated by tinted pills (50/900 backgrounds, 600/300 text) and 4px left-edge accents.
- Bilingual EN/DE, dark mode, and responsive behavior on every component.

## Colors

A near-monochrome working palette with a single committed accent and a closed set of semantic status tints.

### Primary
- **Signal Blue** (#135bec): the one voice of action. Primary buttons, active navigation, focus rings, links, drag feedback, the CT logomark, and primary-tinted surfaces (`primary/10` light, `primary/20` dark). Hover deepens to #1d4ed8; the mobile FAB is its frosted form (rgba(19,91,236,0.85) over 12px blur).

### Neutral
- **Cool Paper** (#f6f6f8): light-mode canvas behind all surfaces.
- **Night Slate** (#101622): dark-mode canvas.
- **White / Slate 900** (#ffffff / #0f172a): card, modal, and sidebar surfaces.
- **Slate 800** (#1e293b): nested dark surfaces — inputs, dropdown menus, user chips.
- **Border Grey / Border Slate** (#e5e7eb / #334155): hairline borders; light mode also uses gray-100/gray-200 for internal dividers.
- **Ink / Chalk** (#111827 / #ffffff): primary text per mode.
- **Field Grey** (#6b7280 / #94a3b8): secondary text, meta lines, timestamps.

### Semantic Status (closed set)
- Gray = Research, Blue = To Apply, Yellow/Amber = Applied/Awaiting, Purple = Interview, Green/Emerald = Offer/Completed, Red = Rejected/Danger. Each appears as a tinted pill (bg *-50 light / *-900 at 20–40% dark, text *-600|700 light / *-300|400 dark) with an optional matching border. Card left-edge accents use primary (Applied), amber-400 (Interview), emerald-500 (Offer).
- **Company Avatars** use a fixed hash palette of eight 500-level hues (blue, emerald, purple, orange, pink, teal, cyan, rose) with a one-step-lighter border; assignment by first character of company name, stable per company.

### Named Rules
**The One Signal Rule.** Signal Blue is reserved for action, activation, and focus. If blue is present, the user can act there. Decorative blue is forbidden — use neutrals.
**The Closed Status Set Rule.** Status hue comes only from the six semantic families above. New features classify into the existing set rather than introducing new hues.

## Typography

**Body Font:** Inter (with sans-serif fallback) — the only family, weights 300–700.

**Character:** A single utilitarian grotesque that reads like logbook entries: calm at small sizes, decisive when bold. Hierarchy is created by weight and size alone.

### Hierarchy
- **Display** (700, 24px, 1.2): authentication title only — the largest text in the product.
- **Headline** (700, 18px, 1.3): sidebar brand, page-level titles.
- **Title** (700, 14px, 1.4): card titles, job positions, section names.
- **Body** (400–500, 14px, 1.5): default UI text — nav labels, inputs, buttons, descriptions.
- **Label** (500, 12px, 1.4): meta lines, timestamps, pills, helper text.
- **Micro** (700, 10px, tracking 0.05em, UPPERCASE): fact tags — salary, remote, status counts. The only place uppercase tracking belongs.

### Named Rules
**The Inter-Only Rule.** No second family, no display serif, no monospace accent. Weight does all the talking.
**The 14px Floor Rule.** Readable UI text never drops below 12px; 10px and 9px sizes exist only for uppercase micro-tags that carry one fact each.

## Layout

- **Shell:** fixed 256px left sidebar (`md:` and up) with brand header, nav, and a settings footer; below `md` the sidebar becomes an off-canvas slide-over (300ms ease-in-out) behind a compact mobile header.
- **Board:** horizontally scrolling status columns; cards stack with 16px gaps; empty columns show a dashed rounded-2xl drop silhouette.
- **Content pages (Timeline, Schedule, Stats):** single-column feeds of bordered cards, `space-y` stacking, generous page padding (16–24px).
- **Density bump at `2xl`:** card padding 12px→16px, avatars 32px→40px, view-details text 12px→14px. The log expands on wide monitors instead of stretching.
- **Spacing rhythm:** multiples of 4px; 8/12/16px inside components, 24/32px between regions.
- **Breakpoints:** Tailwind defaults — sm 640, md 768, lg 1024, xl 1280, 2xl 1536.

## Elevation & Depth

Flat by default. Hairline borders — not shadows — separate surfaces at rest. The shadow scale is a state machine: each level means something has changed (hover, overlay, drag, floating). The backdrop is the one ambient layer: black at 20% (light) / 50% (dark) with 4px blur behind modals.

### Shadow Vocabulary
- **Rest** (`0 1px 2px 0 rgb(0 0 0 / 0.05)`, shadow-sm): cards, buttons, sidebar chips at rest.
- **Hover** (`0 4px 6px -1px rgb(0 0 0 / 0.1)…`, shadow-md): cards under the pointer; login submit button.
- **Overlay** (`0 20px 25px -5px rgb(0 0 0 / 0.1)…`, shadow-xl): modals and dropdown menus.
- **Airborne** (`0 25px 50px -12px rgb(0 0 0 / 0.25)`, shadow-2xl): the dragged card ghost (with 3° rotation, 2px primary ring, 90% opacity) and the glass FAB.

### Named Rules
**The Depth Means State Rule.** A surface at rest never exceeds shadow-sm. If a shadow is heavier, the user must be able to answer why: hovering, dragging, or an overlay is open.

## Shapes

- **Controls** (buttons, inputs, nav items, toggles): gently curved edges (8px radius).
- **Cards and containers**: one step softer (12px radius); login card and small tiles use 8px.
- **Silhouettes**: empty states and drop placeholders use 16px; pills, count badges, status dots, and the FAB are fully round (9999px).
- **Micro-tags** use tight 4px corners — the sharpest shape in the system, marking raw data.
- **Borders:** 1px hairlines everywhere; 2px dashed borders signal "drop here" or "add here"; a 4px solid left edge marks a card's active status accent.
- **Logomark:** primary-filled square, 8px radius, white bold "CT".

## Components

### Buttons
Workhorse controls: flat, labeled, quietly confident.
- **Shape:** 8px radius, text-sm (14px) medium.
- **Primary:** Signal Blue fill, white text, 8/16px padding, shadow-sm; hover deepens to #1d4ed8; disabled at 50% opacity.
- **Secondary:** white/slate surface with hairline border and slate text; hover tints background gray-50.
- **Danger:** red-600 fill (red-500 in dark), white text.
- **Ghost icon buttons:** invisible until row hover (`opacity-0 group-hover:opacity-100`), slate icons that tint primary or red by intent.
- **Focus:** all interactive controls take `focus:ring-2 ring-primary/50`.

### Pills & Badges
The classification language of the log.
- **Style:** fully round, 12px or 10px text, tinted background from the closed status set with darker same-family text; optional 1px matching border.
- **Count badges:** 10px uppercase-style digits in neutral slate or status tint, fully round, docked to column headers.
- **Active filter chips:** primary/10 background with primary/30 border and primary text.

### Cards / Containers
The entry form of the log.
- **Corner Style:** 12px radius.
- **Background:** white / slate-800 (board cards) or slate-900 (page surfaces).
- **Shadow Strategy:** shadow-sm at rest, shadow-md on hover (see Elevation).
- **Border:** 1px gray-200 / slate-700; status accent optionally replaces the left edge (4px primary/amber/emerald).
- **Internal Padding:** 12px, 16px at `2xl`.
- **JobCard anatomy:** avatar tile → title (truncate) → company·location line → fact tags → optional notes (italic, 2-line clamp) → collapsible interview rounds (2px left rail) → full-width neutral view-details button that inverts to Signal Blue on hover → timestamp footer with next-status chevron.

### Inputs / Fields
- **Style:** 1px gray-300 / slate-600 stroke, white / slate-700 fill, 8px radius, 14px text.
- **Focus:** 2px Signal Blue ring at 50%, border goes transparent.
- **Read-only values:** gray-50 / slate-700-at-50% fill, no ring.

### Navigation
- **Sidebar items:** 14px medium, 12/16px padding, 8px radius. Active: primary/10 fill (primary/20 dark) + primary text; idle: gray-600 text, hover gray-50 fill.
- **Mobile:** slide-over sidebar with scrim; compact header bar with CT mark.
- **Language switcher:** segmented control in a bordered slate container; active segment primary/10 + primary text.

### Glass FAB (signature)
Mobile-only floating add button: frosted Signal Blue (85% opacity over 12px backdrop blur), fully round, shadow-2xl, hover scales to 105%, press compresses to 95%, white plus badge in a translucent circle. The single expressive object in the system.

## Do's and Don'ts

### Do:
- **Do** add dark-mode variants and both EN/DE strings for every new component — they are standing requirements, not follow-ups.
- **Do** keep surfaces flat at rest with hairline borders; reach for border before shadow.
- **Do** use the tinted-pill pattern (50/900 background, 600/300 text) for any new status or category.
- **Do** use `focus:ring-2 focus:ring-primary/50` focus treatment on all interactive controls.
- **Do** give immediate optimistic feedback for user actions, with rollback on error.
- **Do** keep Signal Blue for action and state only — its rarity is the point.

### Don't:
- **Don't** introduce gradients, glassmorphism (except the FAB), or heavy shadows on resting surfaces.
- **Don't** add new accent hues; classify into the closed status set.
- **Don't** use filled background colors for board columns — columns stay transparent over the canvas.
- **Don't** mix radii: 8px controls, 12px cards, pills round; 16px belongs to empty-state silhouettes only.
- **Don't** use uppercase + tracking anywhere except micro fact-tags.
- **Don't** ship a component that works in only one theme or one language.
