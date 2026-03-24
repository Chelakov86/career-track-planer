## 2026-03-24 - Focus Visible on Hover Actions
**Learning:** Buttons that are visually hidden until hovered (e.g., using opacity-0 and group-hover:opacity-100) become completely invisible focus traps for keyboard users navigating via Tab.
**Action:** Always append focus-visible:opacity-100 alongside standard focus rings (e.g., focus-visible:ring-2) to ensure these interactive elements are revealed when receiving keyboard focus.
