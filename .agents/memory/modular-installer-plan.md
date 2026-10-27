# Modular installer contract

The modular installer is implemented. packages/cli/README.md owns the public
commands; this document records composition and source-preservation rules.

## Feature composition

The root is the maintained catalog. Explicit allowlists generate the template;
create/add share the feature registry, payload transforms and configuration edits.
Each recipe owns files, dependencies, dictionary domains, environment examples,
scripts, prerequisites and compatibility. Omitted integrations leave none of
their unrelated files, imports, dependencies or domains in a generated project.

- Forms includes @samline/forms and @samline/formatter; Fields is optional.
- Mail includes its contact Action. Independent Actions has a harmless example.
- Content selects local/API/Strapi/Shopify/other and build/live timing separately.
  Emit only the selected source's example; distinct named collections coexist.
- Remote sources stay inactive until configured. Other services receive an
  explicit REST/GraphQL scaffold rather than claimed native support.
- Auth external/OAuth omits database dependencies/migrations; owned mode includes
  setup without running migrations.
- Interactive creation offers Welcome; minimal selection omits demo chrome.
  Later addition preserves the current homepage and requires compatible slots.

Installed, configured and enabled are separate states. Server Actions, live
collections and local auth require an adapter; build-time local content does not.
CAPTCHA verification requires a backend even when its widget appears in SSG.
Static and unsupported Workers SMTP/database selections retain clearly inactive
examples with activation instructions. Adding an Action never activates an
unconfigured transport. Preserve index.ts.example for inactive registration.

## Locale scaffolding

Initial presets are en-us, es-mx and es-es. Emit selected locales/domains only;
put shared type contracts under the selected default locale. Custom initial
locales use empty text. A Spanish-only project needs no hidden English files.

Later locale additions inspect current dictionaries and contracts, including
custom keys/domains, arrays, tuples and index composition. Preserve type contracts
and nontext data; create empty translatable leaves without replacing existing
translations, copying preset copy or generating CMS entries/slugs. A new locale
index composes its own domain files. Report mismatched keys, dynamic expressions,
unresolved spreads and ambiguous types before writing.

Analyze syntax without importing or executing project modules. Validate tags,
native display names and direction; reject path-like values and aliases.
Incomplete locales stay out of routes, sitemap, alternate links and selectors.
check:i18n validates active translations; deliberate empty keys use explicit
optionalTranslationKeys policy. Adding a feature never activates a draft locale.
Localized API destinations follow src/i18n/localized-content.md.

## Tools and metadata

The Node CLI supports npm/pnpm/Bun dependencies independently of Node/Bun scripts.
Explicit missing tools fail before writes; unattended creation follows a
recognized launcher, otherwise npm when available. Later additions inspect the
current manifest/scripts rather than restoring stale metadata. Cloudflare tools
execute with Node. Bun-managed Vercel dependencies require Bun >=1.4.

package.json samlineAstro records schema/recipe versions, selected features,
locales and installation state. It is not runtime configuration or permission
to overwrite source. Parser-independent package preflight uses a dependency-light
registry; TypeScript syntax analysis supports configuration/dictionary edits.

## Conflicts and recovery

Preflight supported Astro/recipe versions, paths, symlinks, dependency versions,
configuration structures and registration conflicts. Preserve custom code,
imports, exports and middleware through targeted syntax-aware edits. Occupied
keys, ambiguous bindings and unsupported layouts produce specific conflicts.
Never replace a whole customized layout or reformat an existing application.

Plan before applying, capture source bytes to detect concurrent changes and
restore installer-owned writes on caught filesystem failure. Dependency
installation is a separate failure boundary: report applied files and retry
instructions without claiming rollback of package-manager side effects.

No remove, automatic source update, automatic legacy-project adoption,
auth-provider migration, CMS provisioning or machine translation is provided.
Recipes do not install globals, call providers, migrate databases or deploy.

## Maintenance checks

Use existing regression checks for selected/omitted payloads, create/add parity,
repeated addition, no-write conflicts, rollback, current-tool preservation,
locale shapes and source/provider separation. Exercise actual packed-CLI output
for relevant changes. Keep portable guidance and license notices in the archive;
exclude website and repository-only context. Local checks do not establish live
provider connectivity or production deployment.
