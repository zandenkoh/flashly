## 2024-05-18 - Replacing `new Date()` Object Allocations in Array Sorting

**Learning:** Instantiating `new Date(str)` inside tight array sorting and filtering loops (`.sort()`, `.filter()`) creates significant object allocation and memory usage overhead. When scaling to many flashcards, parsing the ISO 8601 string repeatedly on every comparison is highly inefficient and creates easily avoidable performance bottlenecks.

**Action:** Always utilize simple string comparison operations (`localeCompare` or operators like `<`, `>`) directly on Supabase's standardized ISO 8601 timestamp strings rather than casting them to Date objects inside loops.
