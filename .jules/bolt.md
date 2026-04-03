## 2025-01-20 - Redundant Database Queries for Aggregations
**Learning:** Found a pattern where `getGlobalCompletedTodayCount()` was making a redundant network request to fetch and count today's study logs, while the very next lines of code fetched the exact same data (`logsToday`) for a different purpose (`studiedTodayIds` Set).
**Action:** When computing aggregates like counts, check if the raw data is already being fetched or can be fetched once and processed locally to eliminate duplicate network requests.
## 2026-04-02 - Redundant Network Queries for Daily Review Count
**Learning:** Found an instance where the same database query was performed twice consecutively (calling `getGlobalCompletedTodayCount()` and then manually querying `study_logs` for today's logs) to calculate the daily review count and filter due cards.
**Action:** Reused the result of the `logsToday` query to compute `reviewedTodayCount` via `studiedTodayIds.size`, eliminating a redundant network request and reducing load time.
## 2024-05-24 - Remove Redundant Network Query for Daily Review Limit
**Learning:** The global daily review limit in flashcard study sessions requires counting unique card reviews for the current date. The application was performing two separate identical database queries in the dashboard load: one inside `getGlobalCompletedTodayCount()` and another when generating the `studiedTodayIds` Set.
**Action:** Compute the completed review count locally from the size of the existing `studiedTodayIds` Set, which eliminates the redundant network query and improves dashboard load times.
## 2025-01-20 - Removed Duplicated DB Queries in Study Setup
**Learning:** The application was making redundant database requests to the `study_logs` table. `getGlobalCompletedTodayCount()` was called to count unique `card_id`s for the daily limit, and then another identical query was issued to fetch `studiedTodayIds` for filtering algorithm candidates.
**Action:** Removed `getGlobalCompletedTodayCount()` entirely. Hoisted the `logsToday` fetch earlier in the flow for both `loadTodayView()` and `startStudySession()` and reused `studiedTodayIds.size` to derive the global completed limit without an extra network call.
## 2024-05-18 - Replacing `new Date()` Object Allocations in Array Sorting

**Learning:** Instantiating `new Date(str)` inside tight array sorting and filtering loops (`.sort()`, `.filter()`) creates significant object allocation and memory usage overhead. When scaling to many flashcards, parsing the ISO 8601 string repeatedly on every comparison is highly inefficient and creates easily avoidable performance bottlenecks.

**Action:** Always utilize simple string comparison operations (`localeCompare` or operators like `<`, `>`) directly on Supabase's standardized ISO 8601 timestamp strings rather than casting them to Date objects inside loops.
## 2026-04-02 - Native JavaScript Debounce Implementation
**Learning:** When writing performance optimizations like debouncing in a pure vanilla JavaScript environment without global lodash imports or predefined utils, use native inline `setTimeout` and `clearTimeout` to avoid `ReferenceError: debounce is not defined`.
**Action:** Verify the availability of utility functions (like `debounce`) within the specific scope before relying on them, or implement them explicitly using native `setTimeout` APIs.
