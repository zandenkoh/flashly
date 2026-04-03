## 2024-11-20 - DOM XSS in Note and Profile Views
**Vulnerability:** Several dynamically rendered UI components (like `note-list`, `note-detail`, `similar-notes`, and `user-profile`) injected user-controlled fields (`note.title`, `note.category`, `note.type`, `note.subject`, `note.url`, and `profile.username`) into `innerHTML` strings without proper sanitization. This allows for Cross-Site Scripting (XSS).
**Learning:** Even though an `escapeHtml()` function exists in the codebase, it is easy to forget to use it when constructing template literals for DOM insertion, especially for nested or less common models like Notes.
**Prevention:** Always wrap variables representing user input with `escapeHtml()` when interpolating them into HTML strings that will be passed to `innerHTML`.
## 2025-04-02 - Unescaped XSS inside AI Note Summary
**Vulnerability:** XSS vulnerability exists where AI-generated content retrieved via Supabase Edge Function is directly placed into innerHTML inside script.js without using `escapeHtml()`.
**Learning:** XSS vulnerability is possible even for 'trusted' content outputs such as LLM predictions. An LLM may summarize or quote malicious user text inputs such as PDF contents.
**Prevention:** Verify that all dynamic variables interpolated within template literals intended for `innerHTML` assignments are properly wrapped with `escapeHtml()` during development.
## 2025-02-14 - HTML sanitization missing for string interpolation within innerHTML
**Vulnerability:** Several areas in `script.js` (specifically `renderNotes`, `openNote`, `renderSimilarNotes`) failed to sanitize user-generated data (e.g. `note.title`, `note.category`, `note.subject`, `note.type`) using the `escapeHtml` function before interpolating them into HTML structures via template literals.
**Learning:** This repo relies heavily on assigning template literals to `innerHTML` dynamically for performance and templating simplicity. However, string interpolation does not automatically escape HTML, which led to a Cross-Site Scripting (XSS) vulnerability when user-controlled database fields were accessed and injected directly into the DOM.
**Prevention:** Always verify that every interpolated variable containing user-generated content is wrapped in `escapeHtml()` when updating `innerHTML`, or prefer using safer APIs like `textContent` where applicable.
## 2024-04-02 - Pervasive XSS Risks via Template Literals
**Vulnerability:** User-generated content (like note titles, subjects, URLs, categories, etc.) was directly inserted into the DOM using template literals via `innerHTML` and `textContent` assignments in `script.js` without sanitization.
**Learning:** Even though an `escapeHtml()` function exists in the codebase, it was inconsistently applied, particularly in the components related to rendering "Notes" and "Similar Notes" and extracting properties like `note.title`, `note.url`, etc.
**Prevention:** Always consistently use `escapeHtml()` for ALL dynamic data interpolation within template literals that are assigned to `innerHTML` or rendered as text/attributes to prevent XSS. Regular audits of `innerHTML` assignments using regex are useful.
