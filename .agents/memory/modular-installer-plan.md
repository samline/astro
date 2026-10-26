# Modular installer plan

Status: implemented in 7.20.0 after the user authorized execution. See project.md
for validation evidence and the CLI README for the current public command contract.
Date: 2026-10-25. Baseline: b95e186, package 7.19.0, Astro ^7.4.2.

## Objective and confirmed requirements

Create a small usable project through a guided installer, then allow missing
integrations to be added later through the same recipes. Unselected integrations
must contribute no source, dependencies, imports, environment declarations,
dictionary domains, scripts or documentation implying they are present.

- Forms always installs both @samline/forms and @samline/formatter.
- After selecting Forms, ask whether to include the Fields template. Declining
  Fields still installs both packages. Adding Fields later brings both packages.
- Mail always includes the contact Action example and its translations/docs.
- Actions and Content Collections each include a basic independent example.
- Content selection always asks the source: local files, a generic API, Strapi,
  Shopify or another service. Install only the selected source and its example.
- Adding a locale later inspects current project dictionaries and contracts;
  create matching keys with empty translations. Do not copy content or translate.
- Default-language choices are en-us, es-mx, es-es and a custom language entered
  in the wizard. en-mx is not a Spanish alias and is not a default preset.
- Preserve arrow functions, simple named modules, English developer docs,
  modular translations, page -> layout -> section -> component and consumer-selected npm/pnpm/Bun dependencies
  with Node/Bun scripts (latest 2026-10-26 tooling decision). Keep SSG and existing security boundaries.
- The subsequent user request authorized implementation and cleanup. No commit,
  push, npm publication, deployment or real database migration is authorized by
  this implementation request.

The implementation must also follow [the engineering contract](./engineering-contract.md).
Ticker informed maintenance conventions only; its source, UI and runtime are not
part of the installer architecture. Later user corrections in this plan supersede
the earlier proposal to copy translated text into newly added locales.

## Baseline findings before implementation (7.19.0)

- scripts/prepare-package.mjs distributes all src and the root manifest.
- packages/cli/lib/cli.mjs prompts for directory/deployment only. Supplying both
  currently bypasses all questions; the new wizard must still ask missing choices.
- project.mjs copies every template entry and root dependency, and unconditionally
  emits auth:migrate. This must become explicit composition by selected features.
- deployment.mjs edits exact source strings and slices the environment starting
  at an SMTP heading. These assumptions cannot support independent integrations.
- Main imports Theme, GTM and PageLoader unconditionally; Welcome imports both
  LanguagePicker and ThemeSwitch. Optional mounting must be generated coherently.
- Global styles and shared components contain theme assumptions. The theme-free
  core must have a complete light presentation without theme client code.
- Dictionary composition and types reference every domain and en-us contracts;
  removing features or selecting only Spanish currently leaves missing imports.
- Contact imports CAPTCHA directly. Mail without CAPTCHA needs a valid independent
  Action, while adding CAPTCHA later must integrate without replacing custom logic.
- Auth settings imports pg unconditionally. Separate the database-specific setup
  so external/OAuth projects do not need PostgreSQL packages/migration tooling.
- Actions currently means contact plus an optional remote content demo. A generic
  Actions example must not require SMTP, authentication or a configured API.
- Collection examples currently bundle local, remote/Strapi and live variants.
  A local collection must work without the remote client, secrets or live setup.
- The portable .agents seed describes features whether selected or not. Render
  installed-feature context rather than copying these unconditional statements.

Graph lookup/coverage was checked, and material findings were verified against
current source. Graph results alone are not an exhaustive dependency proof.

## Core and feature boundaries

Keep Astro/TypeScript, Tailwind/normalize, Fontsource baseline, SEO/robots/sitemap,
public resource folders, layout/section primitives, Link/Button/H, minimal Welcome
and NotFound, single-language dictionaries, formatter/lint tooling and portable
agent guidance in core. Tooling Prettier is distinct from @samline/formatter.

| Feature ID      | Installation contract                                                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| themes          | Theme Init/Switch, theme config/types, required style hooks and dictionary domain; no implicit theme runtime in core.                                                             |
| auth            | Better Auth server/browser facade, guards, route, docs and selected-mode configuration; pg/types/migration only for database mode. No automatic migrations or signup.             |
| captcha         | Provider choice: Turnstile or reCAPTCHA v2; widget, verifier, lifecycle/docs and dictionary. No implicit Mail or Fields dependency.                                               |
| gtm             | GTM plus CookieConsent as one feature, with SDK dependency, config, head/body hooks, types and translations. No ID means no tracking/consent UI.                                  |
| language-picker | Selector and its labels only when requested; locale support itself stays in core. Defaults off with one locale.                                                                   |
| forms           | Both SAM packages plus concise package usage docs; no Fields folder unless requested.                                                                                             |
| fields          | Existing reusable Fields templates/docs; requires forms, and therefore formatter. No mail/auth/CAPTCHA requirement.                                                               |
| actions         | An exported, validated, harmless example with translated feedback and usage docs. No mail, external API or auth requirement.                                                      |
| content         | Ask source (local/API/Strapi/Shopify/other), then loading mode; include only its schema, loader/query, configuration and basic example.                                           |
| mail            | SMTP service/templates, dependency/types/env, contact Action with validation/honeypot/origin checks and usage docs. Requires Actions infrastructure; always includes its example. |

Distinguish required infrastructure from optional demos: Mail can install the
Actions registration and contact example without also inserting an unrelated
generic Action. Selecting Actions explicitly adds its independent basic example.
No Action needs SAM Forms: native FormData remains supported.

CAPTCHA hooks into a selected contact example when both features are installed.
Without Mail, it provides its own verification usage example. Adding CAPTCHA to
customized contact logic requires a precise merge or a reviewable conflict,
never replacement of the whole Action. Similarly, Mail added after CAPTCHA must
compose the verification step before delivery.

## Additional optional integrations included in 7.20.0

The approved plan also included these independently selectable integrations:

- PageLoader: optional component plus ldrs and layout mount. Its runtime and
  dependency are avoidable on many sites; retain ldrs when selected.
- FaIcon: optional component plus Font Awesome packages, which many sites replace
  with a different icon set. Keep existing server SVG behavior when selected.
- Remote content/API examples are now a confirmed requirement: Content asks for
  local/API/Strapi/Shopify/other and only installs the chosen source recipe. Live
  remains an explicit loading-mode choice, not an automatic dependency.
- Welcome/demo content: optional minimal starter presentation; preserve a valid
  homepage with layout/section composition when the fuller demo is omitted.

Avoid adding questions for every primitive, Tailwind token, font weight or SEO
field. Keep the core useful. Portable .agents remains included as the user
previously required; installed-feature guidance is conditional.

## Wizard flow

1. Destination/name and default language; locale choice appears early.
2. Optional additional languages and whether a selector is wanted. Selecting
   multiple locales does not force a LanguagePicker component.
3. Deployment (Vercel default) and optional production site origin.
4. A grouped optional-feature selection; no optional feature preselected in the
   minimal path. Ask feature-specific follow-ups only for selected modules.
5. Forms -> ask Fields. Auth -> external/database/OAuth. CAPTCHA -> provider.
   Content -> always ask local/API/Strapi/Shopify/other, collection name and
   build-time/live mode. Local/build-time is the suggested minimal choice, not
   permission to skip the source question. Other service -> name and protocol.
6. Resolve dependencies and runtime compatibility, showing why each implied
   capability is included. Mail implies an Action/server requirement, not Forms.
7. Present the concrete file/dependency/configuration summary. Create/apply it,
   optionally install packages, format and report actionable next steps.

Cancellation before application performs no writes. Noninteractive commands
accept explicit flags and deterministic minimal defaults, with an explicit
--minimal/--yes path; ambiguous configuration must not open a prompt in CI.
Secrets are not required to scaffold or copied into project metadata. Report
configuration still needed without pretending a real provider was connected.

## Command contract

Implemented public commands (npm examples require publication; use the local
tarball or CLI entry while developing):

```sh
npx @samline/astro my-site
npx @samline/astro add
npx @samline/astro add auth
npx @samline/astro add forms
npx @samline/astro add fields
npx @samline/astro add mail
npx @samline/astro add content --source shopify --collection products
npx @samline/astro locale add es-mx
npx @samline/astro status
npx @samline/astro add gtm --dry-run
```

The add wizard offers missing integrations and missing suboptions such as Fields.
Repeated additions are idempotent; they are not automatic upgrades/reinstallations.
Explicit configuration changes need their own reviewed plan. --no-install works
for create/add and reports the exact follow-up command. status distinguishes
installed, configuration required, and detected missing/inconsistent files.

Preserve an existing project's package manager, lockfile and chosen runtime.
Only creation asks for available npm/pnpm/Bun managers and Node/Bun runtimes.
Explicit choices are preserved; unattended defaults follow the recognized launcher
or npm when available. Do not silently replace an existing adapter or switch SSG to SSR.

## Content source selection and examples

Source/provider and loading time are independent choices. API/Strapi/Shopify
content may be fetched during SSG build without a server adapter; only live
request-time access requires one. Do not infer SSR from a remote source.

| Source        | Generated starting point                                                                                                                               | Excluded by default                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Local         | glob/file loader, Zod schema, small local sample and getCollection/getEntry usage.                                                                     | Remote client, API secrets and live config.                                    |
| Generic API   | Explicit REST/GraphQL protocol choice, bounded transport, expected response schema, mapping, stable IDs, pagination and query example.                 | Guessed API contract, arbitrary URL relay, other provider SDKs.                |
| Strapi        | Strapi 5 source recipe, explicit content-type endpoint, documentId/locale mapping, draft/publication policy, pagination and schema example.            | Strapi server installation, admin APIs, unrelated content types.               |
| Shopify       | Storefront GraphQL read-only products example, selected supported API version, explicit store/context settings, cursor pagination, schema and mapping. | Admin API, cart/checkout, orders, payments, accounts or a whole storefront UI. |
| Other service | Service name, known supported recipe if available; otherwise a clearly labeled custom REST/GraphQL source scaffold with explicit mapping points.       | Claims of native support or invented service endpoints/SDK behavior.           |

The initial first-class recipes are local, generic API, Strapi and Shopify.
Other service is extensibility through the documented custom source boundary,
not a promise to support every service. Verify the real provider's official
contract/version before implementing it. SDKs are installed only when they
materially simplify that chosen integration; do not install all provider clients.
Do not add a universal CMS model or turn a source recipe into a commerce package.

Each selected source includes its collection definition, schema, loader/query,
expected response fixture, environment names, read example and README explaining
configuration and activation. Examples use public APIs and real relative/import
paths. Shared request logic is included once only if a selected recipe needs it.
Provider UI/editorial data is distinct from the site's UI dictionaries.

Build-time and live recipes preserve atomic validation, stable IDs, publication
filtering and explicit locale/translation identity. Handle actual pagination,
bounded requests and cancellation. A GraphQL HTTP 200 with errors is not a valid
successful snapshot. Rate-limit/schema/network failure must not masquerade as
an empty collection. No secrets become serialized entries or client props.
Shopify language/market context and Strapi locale mapping are explicit provider
mappings, not a blind substitution of an application language code.

Remote examples are scaffolded without contacting stores/CMSs during install.
Without configuration, show installed/configuration-required status and keep
remote registration explicitly inactive; document exact enablement steps.
When enabled, missing settings or fetch/schema errors fail visibly rather than
falling back to fake/local content. No live customer data is bundled as a fixture.

Collections can coexist. Adding a second source uses an explicit unique collection
name and merges exports; it does not replace the first source or its schema/data.
Re-adding the same source/collection is a no-op unless an explicit change is
requested. A duplicate name with a different source is a conflict before writes.
Source metadata is per collection, not a single global provider switch.

## Locale generation

Initial creation offers en-us, es-mx and es-es with prepared translations for the
selected base/feature domains. Only selected locales/domains are emitted. A custom
initial language gets the same structural scaffold with empty translation strings;
no copied source-language text or machine translation is invented. Explain that
its translations must be supplied before treating it as a complete public site.

Adding a language later is a different operation from initial preset selection.
Even when the new tag is a built-in preset, inspect the current project; do not
copy the release's old preset values or sample content into the project.

1. Inventory existing locales, domain folders, nested keys, types, arrays/tuples,
   interpolation requirements and actual composition. Include custom project
   domains/keys and exclude features absent from this project.
2. Derive shape from current authoritative domain contracts and current source
   dictionaries. Compare other available dictionaries for drift. If they disagree
   on keys or types, report the exact mismatch before generating an ambiguous
   scaffold; never silently discard keys or invent a union contract.
3. Create the same locale/domain/index.ts and types.ts layout. Preserve all
   nested keys and structural array/tuple positions; translatable string leaves
   are empty strings. Preserve explicit nontext data/schema constraints instead
   of coercing everything to strings. Report ambiguous nonliteral values.
4. Reuse current type contracts; do not copy large duplicate interfaces or
   require an unselected English dictionary directory. For initial generation,
   domain contracts live under the selected default locale; other locales
   reexport them through their own types.ts.
5. Update locale inventory/composition without changing existing values,
   default language, URLs or provider data. Do not create pages, collection
   entries, posts, products, sample data or translated slugs in locale add.
6. Record translation-pending status outside visitor copy. A new unfinished
   language is available as a draft, not enabled for routes, sitemap, alternate
   URLs or LanguagePicker. Document explicit activation through locale config
   once required translations are filled and their validation passes.

Existing translated values are never overwritten, even on repeated execution.
Do not use source-language fallback to disguise empty translations, insert key
names/TODO markers as visible strings, or automatically call a translation API.
Known intentionally empty keys need explicit validation policy; do not require
all strings to be nonempty blindly. Numeric/literal discriminants and other
technical values are structural data, not missing visitor translations.

Use syntax/type analysis of supported dictionary declarations; do not import or
evaluate arbitrary project modules to discover their keys. Computed keys,
function-valued translations, unresolved spreads or dynamic composition outside
the supported contract must yield a specific diagnostic/review path rather than
silent omission or a claim of complete extraction. Never rewrite other locales
just to make generation easier.

Locale inputs collect a validated tag, native display name and text direction.
Normalize tags for routes/directories, reject invalid/path-like values and
aliases, and keep metadata separate from translated content. New integration
keys use built-in translations only during initial preset generation; on later
additions fill existing custom/pending locale gaps with empty structural entries
and record them, preserving current translations. Never activate a draft locale
because a feature was added. Custom direction does not promise full RTL styling.

Keep native Astro i18n, html lang/dir, SEO metadata and labels coherent for active
locales. A Spanish-only project must not need hidden en-us files. Preserve the
default unprefixed route policy unless explicitly changed. Existing localized
content guidance controls API/CMS route equivalence; locale addition does not
create guessed translated URLs or fetch provider content.

## Server and activation compatibility

Actions, local auth and SMTP contact execution require a server adapter; local
build-time collections do not. Live collections require an adapter. A CAPTCHA
widget can live in SSG but token verification always needs a backend.

On a pure-static selection, show the dependent server features before writing:
choose an adapter, omit the feature, or explicitly scaffold its inactive example.
Never report an inactive example as a working endpoint. Static mail scaffolding
still includes its contact Action as .example, with exact activation steps.
On supported adapters, register requested examples without imposing global SSR.

SMTP and database connectivity depend on the actual runtime/provider. The current
Nodemailer SMTP path is not validated for Workers; do not silently register an
unsupported contact Action there. Offer compatible deployment or explicit inactive
scaffolding. Likewise, validate the database-mode connection strategy for the
selected target rather than assuming pg works on every platform.

Installed/configured/enabled are distinct. Builds without real credentials must
remain valid where the feature can be dormant; invoking an unconfigured protected
operation fails safely. No fake production secrets, migrations or provider calls
are performed by the wizard. Never lower auth/CAPTCHA checks to make scaffolds run.

## Simple implementation structure

Retain the root as the maintained feature source and full integration workspace.
Produce separate core/feature distribution payloads from explicit ownership lists;
never hand-maintain a second source tree or copy everything then prune by guesses.

Keep CLI argument handling, questions, dependency resolution, and filesystem
application separate. Use a small registry and one clear recipe per feature,
with shared operations only where multiple recipes need them. Avoid plugin class
hierarchies, an event bus, a custom template language or a universal codemod engine.

Each recipe declares files, package dependencies, dictionary domains, env schema
and examples, scripts, shared-config edits, prerequisites and compatibility.
Creation and later addition use the same resolved plan and application code.
Environment fragments and Action exports compose structurally, not through
heading-based slicing or global regex replacement.

Record nonsecret schema version, generator/recipe versions, selections, locales
and installation state in the existing package.json samlineAstro namespace.
Track file fingerprints only where necessary for safe later edits; do not turn
metadata into a second runtime configuration or claim ownership of user files.
Metadata alone must never authorize overwrites or prove a feature works.

## Safe addition and recovery

Preflight Astro major, project metadata, dependency versions, paths/symlinks,
expected config structure and conflicts before writing. A newer CLI must reject
unsupported recipe/project combinations rather than silently upgrading Astro.
Projects predating modular metadata need explicit adoption with detected facts
and a reviewed plan; do not guess their installed features or overwrite them.

Use targeted syntax-aware edits to known exports/imports and Astro frontmatter,
preserving unrelated code and middleware/Action registrations. New projects use
known composition boundaries. When an existing custom structure cannot be
modified safely, report the exact conflict and proposed patch before applying.
Do not use destructive force, replace whole layouts or format the whole existing
application during add; format only files owned/changed by that operation.

Prepare the full plan and detect conflicts first. Stage writes and retain enough
original data to recover installer-owned changes if application fails. Dependency
install failures are different: report files applied, dependency install pending
and retry commands; do not promise rollback of arbitrary package-manager scripts.
No partially failed installation is marked successfully complete.

## Implementation sequence

1. Define core/feature ownership and dependency contracts; update the packaging
   allowlist and test absence of unselected features before changing prompts.
2. Decouple shared source boundaries: layout mounts, themes, dictionaries, auth
   mode imports, contact/CAPTCHA composition and independent basic examples.
3. Implement initial locale presets and current-project blank dictionary
   scaffolding, then selective dictionary emission and draft activation rules.
4. Implement the shared dependency planner, recipe application and metadata.
5. Build the create wizard and noninteractive flags on the same planner.
6. Implement add/status/locale add, safe merges, dry-run and recovery behavior.
7. Render selected-feature README/.agents guidance, audit distribution and source,
   apply Prettier, run validation and package a local tarball. No npm publication.

Root and CLI versions are coordinated at 7.20.0. Astro remains ^7.4.2 and the
package remains unpublished. Existing projects never upgrade automatically.

## Acceptance and verification

- Minimal project builds and has none of the omitted feature packages, folders,
  imports, dictionary types, env variables, scripts or misleading documentation.
- Each feature builds alone where supported and includes its usable basic example
  or clearly identified inactive example for an explicitly selected static scaffold.
- Forms without Fields has both packages and no Fields folder; later Fields works.
- Mail always has contact; Actions without Mail sends no email and needs no API.
- Local Content works fully offline and does not bring remote/live/Strapi files.
- Auth external/OAuth has no pg/migration script; owned mode includes both setup
  and migration instructions without running migrations.
- Provider secrets remain server-only. Auth/permission, CAPTCHA verification,
  GTM consent and localized routing keep the existing meaningful regression tests.
- Cover all deployment/tool combinations for generated manifests, then actual
  builds for minimal and representative feature combinations. Test dependency
  pairs/orderings rather than attempting every possible subset blindly.
- Create minimal -> add features -> build; repeated add produces no extra diff.
  Test Mail/CAPTCHA in both orders, Forms/Fields, custom middleware/Actions,
  edited layout, deleted Welcome, custom locales, conflicts, cancellation,
  non-TTY execution, --no-install, --dry-run and dependency-install failure.
- Validate Spanish-only output without a hidden English contract directory.
  Later locale additions preserve current custom keys, produce empty text leaves,
  preserve array/tuple shape, add no content and create no active empty routes.
- Test each content source and build/live distinction, provider pagination and
  errors (including GraphQL errors), unique collection names, no credentials at
  install, and adding a second provider without replacing the first.
- Validate real packed-CLI create/add flows locally with both Node and Bun
  execution choices. Do not infer deployed provider behavior from local mocks.

## Primary references

- https://shopify.dev/docs/api/storefront/latest (choose a supported explicit
  version when implementing; latest is documentation, not a production pin).
- https://docs.strapi.io/cms/api/rest

- https://docs.astro.build/en/guides/actions/
- https://docs.astro.build/en/guides/internationalization/
- https://docs.astro.build/en/guides/content-collections/
- Existing feature docs remain the contract for implementation-specific security
  and lifecycle behavior. Verify provider/adapter specifics at implementation time.

## Implementation notes and current boundaries

The maintained root remains the full feature catalog. prepare-package builds the
explicit allowlisted catalog; create copies only declared core/selected paths
into staging, then applies the generated project. add uses the same registry,
payload transforms and configuration operations. The TypeScript parser is an
explicit CLI dependency; its shared static dictionary reader also powers the
generated project's active-translation check. The distribution preflight remains
independent of that parser through the dependency-light registry.

Added languages validate local dictionary composition instead of copying an
index that might import another locale. String-literal constraints, dynamic
values, unresolved object spreads and mismatched keys require explicit review.
Optional controls are composed by the project; add does not replace a customized
homepage/header. Inactive Action registrations are never implicitly promoted by
adding another Action. Existing core script commands determine runtime selection
for later operations; old metadata does not override a deliberate Node migration.

No remove, automatic upgrade, legacy-project adoption, auth-provider migration,
CMS provisioning, machine translation or universal third-party connector was
implemented. Other services receive a clearly labeled REST/GraphQL scaffold.
Remote collection registration and real credentials are deliberate project setup.
