## 2024-05-17 - Missing accessible names on icon-only buttons in modals
**Learning:** Found a pattern of missing `aria-label` and keyboard focus (`focus-visible`) styles on icon-only buttons (e.g., Close, External Link) in core components like `JobModal.tsx`.
**Action:** When adding or reviewing modals, ensure all icon-only buttons have an accessible name (`aria-label` matching the `title`) and clear keyboard navigation styles (`focus-visible:ring-2 focus-visible:ring-primary/50`).
