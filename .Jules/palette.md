## 2024-05-18 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like `.clear-search-btn`, `.dropdown-btn`, `.modal-close`) often lack accessible names when implemented purely with SVG icons. This makes them invisible or confusing for screen reader users.
**Action:** Always ensure that any button containing only an icon has a descriptive `aria-label` attribute (e.g., `aria-label="Close modal"`).
## 2026-04-02 - Adding aria-labels to icon-only buttons
**Learning:** This application heavily relies on vanilla JS string interpolation to render dynamic content (e.g., in `script.js`). When adding accessibility attributes like `aria-label` to these dynamically generated elements, it's crucial to utilize existing sanitization functions like `escapeHtml()` to prevent XSS vulnerabilities, especially when incorporating user-generated content (like subject or deck names) into the attribute value.
**Action:** Always wrap dynamic data injected into HTML attributes with `escapeHtml()` when working within vanilla JS template literals in this codebase.
