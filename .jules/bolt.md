## 2026-04-02 - Redundant Network Queries for Daily Review Count
**Learning:** Found an instance where the same database query was performed twice consecutively (calling `getGlobalCompletedTodayCount()` and then manually querying `study_logs` for today's logs) to calculate the daily review count and filter due cards.
**Action:** Reused the result of the `logsToday` query to compute `reviewedTodayCount` via `studiedTodayIds.size`, eliminating a redundant network request and reducing load time.
