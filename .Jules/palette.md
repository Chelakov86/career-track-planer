## 2026-03-26 - Invisible Focus Traps on Hover States
**Learning:** Opacity-based hover states (e.g. `opacity-0 group-hover:opacity-100`) create invisible focus traps for keyboard users navigating via Tab. Although the element gains focus, it remains visually hidden (`opacity-0`), making it impossible for the user to know where their focus is.
**Action:** Always append `focus-visible:opacity-100` alongside clear focus indicators (like `focus-visible:ring-2`) to ensure the element becomes visible and distinctly outlined when focused via keyboard.
