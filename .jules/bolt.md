## 2026-04-02 - Optimize daily review count queries
**Learning:** Identical and conditional network queries to the database were discovered.
**Action:** Use cached sizes of local sets to replace network calls where possible and conditionally invoke queries.
## 2025-04-02 - Eliminated Redundant Supabase Query in loadTodayView
**Learning:** The application was making duplicate identical queries to the `study_logs` table during `loadTodayView()` to count today's studied cards while separately fetching them for the `studiedTodayIds` set. Fetching identical network data twice blocks rendering and increases frontend SPA load time unnecessarily.
**Action:** Removed the redundant `getGlobalCompletedTodayCount()` network call in `loadTodayView()` and computed the count locally from `studiedTodayIds.size`, halving the network requests for this critical dashboard loading path.
## 2024-05-24 - Eliminate Redundant Database Query for Today's Studied Cards
**Learning:** Found a specific anti-pattern where a dedicated function (`getGlobalCompletedTodayCount()`) was fetching data (the count of unique studied cards today) from the database, while immediately below it, the codebase was fetching the exact same data again (`logsToday`) to compute a set of IDs (`studiedTodayIds`). This caused two sequential database queries where one was sufficient.
**Action:** When a function computes a count from a database query, ensure the same data isn't being fetched nearby for other purposes. In `loadTodayView`, compute `reviewedTodayCount` from `studiedTodayIds.size` instead of making a separate call.
## 2024-05-24 - Redundant DB queries for global daily review limit
**Learning:** Flashcard study sessions enforce a global daily review limit by counting unique `card_id` entries in the `study_logs` table for the current date. This count was being queried via `getGlobalCompletedTodayCount()` while the exact same data was fetched subsequently via `logsToday` to create a `studiedTodayIds` Set.
**Action:** Compute the completed today count locally from the size of the `studiedTodayIds` Set derived from the `logsToday` fetch result, eliminating the redundant network query and speeding up `loadTodayView()` and `startStudySession()`.
## 2025-01-20 - Redundant Database Query Optimization
**Learning:** In the `loadTodayView` function, a redundant query `getGlobalCompletedTodayCount()` was fetching `study_logs` simply to get the count of unique cards studied today. A few lines later, the exact same query structure was performed to construct `studiedTodayIds` Set, to find specific cards studied. The duplicate query causes unneeded database load and slows down the critical path of the dashboard rendering.
**Action:** Removed the redundant `getGlobalCompletedTodayCount()` query and computed the count using the `.size` of the `studiedTodayIds` Set derived from the already-required `logsToday` fetch result. This saves an entire network request and ensures accuracy by reusing the same data snapshot.
## 2024-05-24 - Redundant Database Queries for Simple Counts
**Learning:** Found an anti-pattern in `script.js` where `getGlobalCompletedTodayCount()` performed a completely separate Supabase query to get the exact same count that could be derived locally from `studiedTodayIds.size`, which was fetched right after. This duplicate query effectively doubled the latency and network overhead for that specific operation on the main dashboard load.
**Action:** When querying for both a list of items and their count on the same criteria, always fetch the list and use `.length` or `.size` to derive the count locally instead of making an additional `count` query.
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
