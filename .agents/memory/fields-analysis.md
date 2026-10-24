# Fields migration analysis

Analysis date: 2026-10-24. Status: analysis completed before migration; implementation completed in 7.16.0.
No Fields source, dependencies, reference repositories, or generated templates
were changed during this analysis. Findings are source review, not browser QA.

## Evidence and boundary

Reviewed Astro 5 src/components/Fields and EasyTrip
resources/views/components/form: shared shell, native controls, layout helpers,
phone/country/gender helpers, search, file, calendar, Stripe, autocomplete,
styles and runtime. Read relevant password/server-error regression tests and
the installed @samline/forms 2.7.2 README, options and lifecycle/error/submit docs.
EasyTrip imports form CSS and runtime globally through components.css/js.
EasyTrip repository instructions describe its implementation context only;
they do not govern Astro Kit. Both reference repositories remain read-only.

Graph discovery consumed all 65 matching EasyTrip form nodes. Coverage reported
partial Blade parsing in field/input/select; direct source reads covered those
files. Astro 5 Fields coverage was unavailable, so source reads were used.
Old scripts-bkup.ts is an obsolete backup and is not a migration source.
Official Astro scripts documentation and WAI labels/notifications were checked.
Remote SAM docs/repository could not be fetched; installed package documentation
was available. 2.7.2 is the inspected installed version, not a verified latest.

## What EasyTrip improves

- A shared field shell unifies label, required marker, prompt, help and states.
- Floating/basic presentation, compact sizing and accessory icons are consistent.
- Passwords never render old or explicit values; native attributes are retained.
- Checkboxes/radios remain focusable with sr-only, fixing old display:none inputs.
- Server error ownership is scoped to the submitted form, avoiding leakage between
  forms with identical field names; old values are restored for that form.
- @samline/forms replaces the old homemade controller with typed observation,
  value/error APIs, async submission state and cleanup.
- Autocomplete has debounce, cancellation and sequence guards against stale results.

## Issues to fix instead of copying

- Floating labels are opacity:0 until css-filled, even on focus. Preserve a real
  accessible label and keep the purpose visible during entry; placeholder is a hint.
- Prompt is described by the control, but help lacks a matching describedby ID.
  Associate instructions and actual error text, preserve caller describedby IDs,
  and show errors with aria-invalid rather than only color/icons.
- Filled state is not proof of valid data. Do not show success merely for nonempty.
- The wrapper is a label containing password/tooltip buttons; separate the label
  from accessory buttons. Tooltip tabindex=-1 prevents ordinary keyboard access.
- Wrapper/control attribute forwarding is mixed. Send native/event/scope attrs to
  the intended element exactly once and consume component props explicitly.
- Select reparses slot HTML and keys options by label: duplicate labels collide,
  option attributes/groups disappear, caller IDs are ignored, and falsey values
  affect placeholder selection. Use typed options with explicit selected values,
  optionally groups, rather than DOMDocument/parse5 parsing.
- Rich help/tooltip HTML assumes trusted input. Prefer escaped strings or explicit
  Astro slots; do not recreate arbitrary HTML injection APIs.
- File UI handles only the first filename; clear does not dispatch change. Support
  native multiple semantics, clear/reset synchronization and accessible names.
- Textarea disables resizing and relies on field-sizing. Keep vertical resizing
  and rows fallback; auto-growing can be optional progressive enhancement.
- Deep exclusion selectors and important overrides make sizing fragile. Use
  explicit variants/sizes, existing Tailwind tokens, rem and dark theme support.
- Avoid copying globals, Alpine factories/classes/this, full Font Awesome browser
  runtime, duplicated listeners or unconditional client bundles on unrelated pages.

## Proposed Astro Kit scope

Keep related pieces under src/components/Fields with English API docs and local
scripts/styles/types. Proposed primitives: Form, shared Field shell, Input,
Textarea, Select, Checkbox, Radio, File and semantic Fieldset/legend.
Input covers text/email/tel/url/number/search/password and native date/time types;
file and choices have their own semantics. Hidden input needs no styled wrapper.
Keep styling basic, preserve EasyTrip's rounded/floating visual direction and an
explicit basic variant, with compact sizing where useful. No domain defaults.

Each control should accept a translated label, native name/id/attributes,
required/disabled/readonly where applicable, value/checked, help and error text.
Generate an ID only when none is supplied. Keep label/control/help/error IDs
consistent; distinguish class for the control from wrapper styling. Preserve zero
and false deliberately, never restore passwords, and support repeated names.
Use native fieldset/legend for related choices, not a paragraph as a group label.

Use @samline/forms through ESM when a consumer needs its API; do not rebuild it
or create window.Forms/window.Fields. Its controller exposes css-filled/css-error
and aria-invalid plus state.errors via subscribe; Astro integration still needs
to render associated error text safely. Initial autoValidate defaults true in
2.7.2: choose deliberate timing to avoid showing errors on untouched forms.
Supply translated rule messages; array setErrors uses an English library fallback.
Native HTML constraints and library validators are separate mechanisms: do not
assume required/type/pattern automatically become controller schema rules.
Handle rejected submission promises in consumer code: controller settles pending
state but does not convert a transport rejection into a user-facing error.

Keep native form behavior without JS. Password visibility and file display are
progressive enhancements. Use processed Astro scripts, idempotent initialization,
cleanup for replaced forms, and an explicit mount API for dynamically inserted
markup. Do not require a client framework just for controls.

Form is transport-independent. The owning section connects Astro Actions,
endpoints or an external service and handles pending/success/failure state.
Existing contact Action is one documented consumer, not a hardwired dependency.
SSG can render all fields; handling submission requires the already documented
adapter-backed Action or an external backend for pure static hosting.

Do not impose EasyTrip's Mexico phone/country defaults, gender/catalog choices,
TAG regex, HERE response shape/events, Stripe integration or Cally/drawer calendar.
Native date uses ISO values; no YYYYMMDD product conversion or build-time today.
Autocomplete's cancellation pattern is useful, but a provider-independent
combobox is a separate substantial control rather than a copied location search.
No Alpine, Drawer, Cally, Tippy or formatter dependency is justified by basic
fields alone. Optional masks can be evaluated when actually needed.

## Validation required during implementation

Verify SSR/SSG output and no-JS behavior; label/help/error links and supplied IDs;
Select zero/duplicate labels/disabled options; native choice keyboard/focus/group
behavior; required/disabled/readonly; password show/hide/reset without prefill;
file clear/multiple/reset; repeat-name FormData; translated server errors scoped
to one form; submission pending/rejection; repeated mounting and Astro navigation
cleanup; dark theme and responsive styles. Use a local fixture, not a permanent
demo route. Run formatting, i18n, Astro types, focused tests, build and installer
packaging after implementation. No real mail/provider request is needed.

## Implemented result

The proposed native scope is implemented under src/components/Fields. A persistent
small label supplies the floating presentation; basic places it above the border.
File intentionally retains native filename/count rendering rather than duplicating
that state in an Alpine display. Native browser UI uses the browser's locale.
SAM 2.7.2 was installed through pnpm @latest. Form is plain HTML; the controller
is imported explicitly by the consuming section, and does not couple to Actions.
The README documents native method-shadowing names and lifecycle limits.

Verification: bun run verify passed 76 tests, i18n/formatting, Astro diagnostics
and SSG build. Local package generation succeeded. Temporary Chromium checks
covered no-JS markup, options/zero/multiple, password and file clear/reset,
keyboard choices, scoped escaped errors, async FormData/pending state, idempotent
mount/destruction and Astro before-swap, light/dark and mobile layout. No real
mail, upload backend or external provider was called; no deployment was made.
Temporary fixture routes were outside the project and removed after each run.
