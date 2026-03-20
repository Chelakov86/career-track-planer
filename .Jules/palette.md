## 2026-03-20 - Missing Keyboard Focus on Icon Buttons
**Learning:** Icon-only utility buttons (like the theme toggle, mobile menu, and logout) often lack keyboard focus indicators, making them inaccessible for keyboard users who cannot see which element is currently focused.
**Action:** Always add explicit focus-visible classes (like focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none) when creating or modifying icon-only buttons to ensure clear keyboard navigability.
