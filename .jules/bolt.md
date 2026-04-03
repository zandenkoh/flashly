## 2026-04-02 - Native JavaScript Debounce Implementation
**Learning:** When writing performance optimizations like debouncing in a pure vanilla JavaScript environment without global lodash imports or predefined utils, use native inline `setTimeout` and `clearTimeout` to avoid `ReferenceError: debounce is not defined`.
**Action:** Verify the availability of utility functions (like `debounce`) within the specific scope before relying on them, or implement them explicitly using native `setTimeout` APIs.
