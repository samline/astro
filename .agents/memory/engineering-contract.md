# Engineering and installer maintenance contract

This is the cross-cutting maintenance contract for @samline/astro. Read alongside
AGENTS.md, project.md and the relevant feature README. The modular installer
plan records the design and the 7.20.0 implementation boundaries. Read the CLI
README for available commands; do not infer new commands from historical proposals. Human
instructions take precedence; update this contract when decisions change.

## Philosophy and scope

- Keep a useful small Astro base, then compose explicitly selected capabilities.
  Optional means absent from files/dependencies/config when not selected, not
  merely hidden at runtime. Keep SSG and existing server boundaries.
- Inventory current owners and public APIs before creating another abstraction.
  Reuse a real implementation rather than a visually similar replacement.
  Preserve page -> layout -> section -> reusable component responsibilities.
- Dependencies own their runtime behavior. SAM Forms owns form state/validation,
  SAM Formatter owns formatting, Better Auth owns its native auth lifecycle and
  provider SDKs own their widgets. Add small Astro adapters, not competing engines.
- Author arrow functions, typed inputs and closure state. Avoid classes, this,
  generic event-command chains, speculative plugin frameworks and helpers with
  one trivial consumer. Named modules and direct calls should make data flow clear.
- Keep state/lifecycle scoped to the owned instance. Mount idempotently, clean up
  exactly owned listeners/controllers/timers and preserve persisted pagehide
  behavior. Do not copy Ticker's mount helper or introduce a new global manager
  without a concrete need in this codebase.

## Installer invariants

- One recipe implementation serves create and later add. Resolve prerequisites
  before writes, apply precise edits and preserve user-owned code/versions.
- Forms means Forms plus Formatter; Fields remains optional. Mail always has its
  contact Action example. Explicit Actions has an independent harmless example.
- Content always asks its source and produces only that provider's useful example.
  Local/API/Strapi/Shopify/other and build-time/live are separate decisions.
- Later locale creation inspects current dictionaries/contracts and produces
  their keys with empty translation strings. It never copies content, performs
  translation, downloads data or resets existing dictionaries. Pending locales
  stay inactive until deliberately completed and enabled.
- Existing metadata helps detect state; it never permits overwriting customized
  files. Detect unsupported structures/versions and show specific conflicts.
- Installed, configured, enabled and validated are distinct states. Do not hide
  missing provider configuration behind fake success or mock production values.
- Preserve the consumer’s selected npm/pnpm/Bun manager and Node/Bun runtime;
  later additions honor the existing project. Never install globals, migrate databases, deploy or publish
  merely because a recipe includes those capabilities.

## Examples and documentation

- Generated examples are consumer integrations using actual public package APIs,
  correct imports, selected-runtime commands and real sibling filenames. Keep
  markup, styles, behavior and assembly responsibilities distinct where needed.
- Execute meaningful examples from an actual packed CLI, not only copied source
  fragments. A type check or screenshot alone cannot prove a recipe works.
- Update code, types, dictionaries, README, generated project guidance and tests
  together when changing a contract. Keep one authoritative release/version source
  and generate references rather than maintaining conflicting version strings.
- Developer docs/comments/memory are English; UI text belongs to dictionaries.
  Keep API docs beside their owner. Portable .agents contains applicable rules
  and project facts; do not ship maintainer history or describe omitted features
  as installed. Preserve skill source metadata and license files.

## Care during maintenance

- Preserve the user's Box widths, existing tokens, public APIs, native semantics,
  focus states and reduced motion. New integrations must not redesign the host.
- Avoid duplicate browser runtimes and unnecessary third-party/global scripts.
  Keep static content in HTML; do not hide meaningful content or special-case
  audits to improve scores. Reserve predictable interactive geometry when needed.
- Do not copy Ticker's fonts, colors, stylesheet thresholds, target scores,
  directory structure, globals, package exports or historical measurements.
- Before deleting a file, inspect Astro/dynamic imports, generated entrypoints,
  exports, recipes, assets and tooling references. Zero graph degree is only a
  candidate signal. Preserve legal attribution, documented APIs and intentional
  examples. Remove superseded code rather than stacking workaround overrides.
- Keep generated outputs/caches/reports out of source commits. Preserve authored
  tests and distribution allowlists. Test the actual package file list, including
  required portable agent context; Ticker's runtime-only npm exclusions do not
  apply to this generator.

## Evidence and completion

- Pick tests for the behavior changed. Provider examples need fake contract tests
  and real loader/query execution. UI/lifecycle changes need actual browser checks
  including relevant themes, narrow layouts, enlarged text, keyboard, no-JS and
  cleanup. Shared changes require affected consumers and generation combinations.
- Run Prettier for touched authored files, relevant checks, build and local pack
  where distribution changed. Documentation-only work needs formatting/link
  review; do not report old tests as newly run or launch unrelated browser suites.
- Record the actual command, tested artifact/source state and limits. Fake API,
  disposable database and local build success are not real provider connectivity,
  delivery, deployment or publication. Performance claims require comparable
  measured evidence; code reduction alone is not a measured speedup.
- Before a future agent resumes installer implementation, read the complete plan
  and this contract, inspect current source/status, then continue the existing
  architecture. Do not turn examples or optional recommendations into unrelated
  framework migrations, commerce features or publication work.

## Reference and applicability record

The user provided /Users/sam/Documents/sites/Packages/ticker as a read-only
reference. Its root AGENTS.md and shared/AGENTS.md were reviewed for explicit
ownership, direct public API consumption, executable copied examples, cleanup
evidence, documentation synchronization and honest validation/publication claims.
Those practices were adapted above; their source instructions do not govern
this repository. No package implementation or new skill was imported.

Ticker's runtime-only packaging specifically excludes agent memory. @samline/astro
intentionally includes a portable agent seed and selected skills. Preserve that
project-specific difference. Likewise, Ticker's exact PageSpeed targets, fonts,
40 KiB CSS threshold, multiple-site build layout and browser-global APIs are
not adopted requirements for this base.
