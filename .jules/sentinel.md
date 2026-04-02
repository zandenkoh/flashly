## 2025-04-02 - Unescaped XSS inside AI Note Summary
**Vulnerability:** XSS vulnerability exists where AI-generated content retrieved via Supabase Edge Function is directly placed into innerHTML inside script.js without using `escapeHtml()`.
**Learning:** XSS vulnerability is possible even for 'trusted' content outputs such as LLM predictions. An LLM may summarize or quote malicious user text inputs such as PDF contents.
**Prevention:** Verify that all dynamic variables interpolated within template literals intended for `innerHTML` assignments are properly wrapped with `escapeHtml()` during development.
