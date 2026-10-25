# Forms and formatting

Both @samline/forms and @samline/formatter are installed. Use their public APIs
in the section that owns the form, with translated validation/status messages.
Submission transport belongs to that section; native FormData is supported.

Fields is an optional set of Astro templates. If omitted, create native controls
or add the templates later with npx @samline/astro add fields. Neither package
requires the Fields folder. Read the installed package version/docs before
changing validation or formatting behavior; do not recreate their controllers.
