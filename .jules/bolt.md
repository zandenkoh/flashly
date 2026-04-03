## 2024-05-18 - Replacing `new Date()` Object Allocations in Array Sorting

**Learning:** Instantiating `new Date(str)` inside tight array sorting and filtering loops (`.sort()`, `.filter()`) creates significant object allocation and memory usage overhead. When scaling to many flashcards, parsing the ISO 8601 string repeatedly on every comparison is highly inefficient and creates easily avoidable performance bottlenecks.

**Action:** Always utilize simple string comparison operations (`localeCompare` or operators like `<`, `>`) directly on Supabase's standardized ISO 8601 timestamp strings rather than casting them to Date objects inside loops.
## 2026-04-02 - Native JavaScript Debounce Implementation
**Learning:** When writing performance optimizations like debouncing in a pure vanilla JavaScript environment without global lodash imports or predefined utils, use native inline `setTimeout` and `clearTimeout` to avoid `ReferenceError: debounce is not defined`.
**Action:** Verify the availability of utility functions (like `debounce`) within the specific scope before relying on them, or implement them explicitly using native `setTimeout` APIs.
