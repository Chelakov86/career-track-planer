
## 2024-05-18 - Missing ARIA Labels and Focus Indicators on Icon-Only Buttons
**Learning:** Found a consistent pattern where icon-only buttons (like close modals, mobile menu toggles, and external links) lacked semantic `aria-label`s and visible keyboard focus indicators, negatively impacting screen reader and keyboard accessibility.
**Action:** Always add semantic `aria-label` (and `title` if appropriate) along with keyboard focus indicators (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`) to all icon-only interactive elements to ensure they are fully accessible.
