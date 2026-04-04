
## 2026-04-02 - Redundant ARIA Labels
**Learning:** Adding `aria-label`s to buttons with explicitly written text (e.g., `Cancel` or `Done`) is redundant and unnecessary, as screen readers will natively read the button text.
**Action:** Only apply `aria-label` attributes to true icon-only or non-textual buttons.
## 2026-04-03 - Form Labels for Accessibility
**Learning:** Found an accessibility issue pattern specific to this app's components: forms in modals frequently had missing `for` attributes connecting the labels to inputs.
**Action:** Always verify that labels have a `for` attribute that points to the `id` of the respective input when making forms.
