# Forms and formatting

Both @samline/forms and @samline/formatter are installed. Use their public APIs
in the section that owns the form, with translated validation/status messages.
Submission transport belongs to that section; native FormData is supported.

Fields is an optional set of Astro templates. If omitted, create native controls
or add the templates later with npx @samline/astro add fields. Neither package
requires the Fields folder. Read the installed package version/docs before
changing validation or formatting behavior; do not recreate their controllers.

For staged filters, distinguish applied URL criteria from draft control values.
Use native GET when sufficient; use the existing SAM prefill/reset/serialization
APIs when enhancements require them. Do not submit on every edit unless intended.
Resetting an unapplied draft should not reload results or erase unrelated saved
workflow state. If Fields is selected, its README details the draft/apply and
inserted-form lifecycle contract.
