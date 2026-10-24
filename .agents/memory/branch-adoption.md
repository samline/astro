# Selected branch integrations

Version: 7.17.0. Date: 2026-10-24.

## Analysis and plan

User rejected helper migration (future independent packages), required SAM Forms
and Formatter, and authorized selective improvement of other useful branch ideas.
The preceding helpers-branches-review.md supplies source evidence. No component
migration, standalone helper, auth provider or global SSR switch is authorized by
this implementation plan. Existing capability already implemented is reused.

Selected changes:

1. Install current registry SAM packages through pnpm. Keep the existing Astro
   Fields bridge, and use package-owned formatting/state/mirrors/cursor behavior.
2. Strengthen existing server/content-api contracts rather than importing the
   experiment's overpermissive response normalizer and fetch wrappers.
3. Implement the Astro LiveLoader factory idea within content/live, with separate
   source/output validation, stable unique IDs, full-context forwarding and
   explicit empty/missing/failure semantics. Reuse it for the current post example.
4. Adapt the client dictionary idea through the existing Main layout: opt-in
   public domains as safe inert JSON, no Base64/global cache/new helper.
5. Document all callable APIs and boundaries in English, update the portable
   project seed and verify distribution. Keep all integration examples optional.

## Rejected experiment details

No helper utilities, duplicate masks/regex/phone files, React/Alpine integration,
custom route registry, auth-astro account flows, role taxonomy, membership or
loyalty models. The current starter has no verified identity authority; unknown
roles and client-updated JWT privileges must not be accepted. The experiment's
HTTP success coercion, random IDs and swallowed loader errors are not retained.

## Evidence so far

SAM Forms 2.7.2 and Formatter 2.0.3 were resolved with pnpm @latest. Temporary
Chromium checked the actual package integration: initial prefills, phone/date/
numeral display and raw values, typed input and setValue, single mirror on rebind,
accessible field errors, raw/display FormData, reset, destroy and remount. No
legacy script was used, no backend was called, and fixture files are temporary.

Focused API tests cover all added verbs, false bodies, repeated query values,
204 validation, cancelled streams, declared and actual body limits, failed HTTP
with a success payload and business failure with HTTP 200. Live factory tests
cover mapping/stripping, context forwarding, empty/missing and all failure cases.
SSG i18n tests cover opt-out, domain deduplication, locale differences and inert
handling of </script> plus Unicode copy. Final validation: bun run verify passed 80 tests, i18n/Prettier, clean Astro/TS
diagnostics and the SSG build. bun run kit:pack produced and validated the local
7.17.0 archive with the new integration/docs and SAM dependency. Package tests
cover distribution and the generated pure-static profile. No real API/mail,
deployment, npm publication, commit or push was performed for this request.

## Fields file responsibility explanation

The user asked why Fieldset/Choice and supporting TS files exist. Clarify that
these are design choices from the Fields implementation, not Astro requirements:
Field shares label/help/error markup; Choice shares native checkbox/radio markup;
Fieldset provides native grouped-field semantics. types owns shared contracts,
attributes connects IDs/ARIA, enhancements owns password/file behavior, and
scripts bridges SAM state to Astro UI/lifecycle. SAM packages own validation and
formatting. Checkbox/Radio entry wrappers are convenience, with an acknowledged
file-count/readability tradeoff. This question did not request another refactor.

## Cleanup before commit

Reviewed pending integration files and distribution scope, removed the obsolete
ignored 7.16.0 archive, normalized the public locale type import, and ran the
repository-wide formatter/checks. Manual browser hooks and test routes are not
part of application source. Existing examples and maintainer review documents
remain deliberate context. A subsequent explicit request authorizes investigating
and migrating a selectable reCAPTCHA/Cloudflare Turnstile integration after this
cleanup commit; other component migrations remain paused.
