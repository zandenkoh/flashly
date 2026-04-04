
## 2026-04-02 - Redundant ARIA Labels
**Learning:** Adding `aria-label`s to buttons with explicitly written text (e.g., `Cancel` or `Done`) is redundant and unnecessary, as screen readers will natively read the button text.
**Action:** Only apply `aria-label` attributes to true icon-only or non-textual buttons.

## 2024-04-02 - WCAG 2.5.3 Label in Name Anti-pattern
**Learning:** Found multiple text buttons (e.g., "Cancel", "Done") with `aria-label` attributes that completely override their visible text (e.g., `aria-label="Cancel and close modal"`). This is a WCAG 2.5.3 (Label in Name) violation, as voice dictation users expect to say the visible text to activate the control, and screen reader users hear a confusing mismatch. Adding `aria-label` to buttons with explicitly written text is redundant and an accessibility anti-pattern.
**Action:** Removed conflicting `aria-label` attributes from text-based buttons to restore functionality for voice dictation software and ensure the visible label is correctly read by screen readers. Only apply `aria-label` to true icon-only or non-textual buttons going forward.
## 2026-04-03 - Form Labels for Accessibility
**Learning:** Found an accessibility issue pattern specific to this app's components: forms in modals frequently had missing `for` attributes connecting the labels to inputs.
**Action:** Always verify that labels have a `for` attribute that points to the `id` of the respective input when making forms.
