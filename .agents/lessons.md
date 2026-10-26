# Lessons and confirmed preferences

Only record user-confirmed conventions or concrete lessons from completed work.
This is project context, not a speculative improvement backlog.

## Source and architecture

- Build a new Astro 7 base; understand Astro 5's purpose and improve the approach rather than copying legacy code.
- Keep the working application at the root; do not recreate abandoned nested scaffolds or removed local dependency stores.
- Preserve page -> layout -> section -> component. No loose UI in route files.
- Reusable components live in their own folders with English README files and supporting scripts/styles.
- Section-specific content lives inside its section, not the reusable components directory.
- Group related pieces such as Theme Init/Switch and GTM Head/Consent together.
- Section owns semantics and vertical spacing; Box owns content width. Do not conflate them.
- Keep Box's narrow size for focused content and forms.

## Code and localization

- Use arrow functions by default; avoid classes and this. Use function only when required, such as Google's own Arguments queue.
- Every visitor-facing string belongs in the modular locale/domain dictionaries, including labels, alt text, metadata, and errors.
- Each domain has index.ts and types.ts; locale indexes compose modules rather than collecting all translations.
- Components read Astro.currentLocale themselves; pass locale only across isolated boundaries that need it, such as Server Islands.
- Prefer native Astro routing/i18n helpers; do not add custom routing for built-in behavior.
- en-mx is English for Mexico, not Spanish.

## Styling and documentation

- Tailwind configuration and variables belong in tailwind.css, not TypeScript or injected head variables.
- Keep only black/white/placeholder, status colors, and three accent families with light/dark variants.
- The main accent and head theme-color must agree.
- Use rem for authored CSS lengths and unitless zero; preserve intrinsic and library-required numeric dimensions.
- Fonts are local Fontsource imports. Extend Preflight without broad outline resets or transition: all.
- Demonstrate theme usage with Tailwind light:/dark: utilities in Welcome.
- Write developer docs and example comments in English. Keep the API docs next to the component and ship them with the generated project.
- Exclude component Markdown from Tailwind scanning so examples do not add unused CSS.

## Consent, themes, and loader

- Consent's delayed appearance is a performance choice: defer SDK/config/CSS on real interaction, without PageSpeed or bot special cases.
- Keep analytics and advertising consent independent. Rejection must update signals, not be a no-op.
- Dinkbit consent is the visual reference: bottom-center box, neutral buttons, preferences above reject/accept, dimmed background.
- Local fake-ID checks do not validate real production GTM or Google tags.
- Retain ldrs: its value is the ability to swap loading animations easily. Keep import, registration, and tag together.
- Remove PageLoader timer races and beforeunload dependence; preserve history cleanup, reduced motion, and a safety timeout.
- SkipLink was explicitly removed by the user. Do not silently reintroduce it.

## Tooling and delivery

- Maintain this repository with pnpm/Bun. Consumers choose npm, pnpm or Bun for dependencies and Node/Bun for scripts; this supersedes the old automatic pnpm/Bun preference. Docs show matching tabs, and later additions preserve the client’s choices.
- Keep the package major aligned with Astro's major, not its minor version.
- Do not publish to npm until the user authorizes it after the base is finished.
- Keep .agents as persistent project memory rather than relying on chat history or a size-limited graph note alone.
- Never claim a commit, deployment, publication, or validation that was not performed.

## Agent context in generated projects

- The user requires reusable skills and agent guidance to ship with the base.
- Generate a portable project seed with fresh memory, adapting package manager, runtime, and deployment; retain the kit's maintainer history separately.
- Preserve skill source metadata and supporting files. Skill guidance must respect project conventions and the user's authorized scope.

- Keep inactive Action registration as commented code so developers can enable it
  without recreating the entry point. Use index.ts.example while inactive; a
  commented-only index.ts causes a missing server export error in Astro 7.4.
  Activation requires renaming and uncommenting. Pure static builds must remain valid.

## Fields integration

- Declare Tailwind layer order in separately imported component CSS: Astro asset
  ordering can otherwise let Preflight override component padding and borders.
- SAM Forms observes child-list changes. Updating error element textContent on
  every subscription can loop; use a persistent Text node and change its data.
- Target disabled inputs/selects/textareas explicitly. A disabled placeholder or
  option must not make the entire select appear disabled through :has(:disabled).

## Helpers and branch adoption boundary

- Do not migrate helpers: the user will create individual packages later.
- Astro 5 is reference intent. Forms and input formatting belong to the SAM Forms
  and Formatter packages; do not revive the legacy raw/mask/phone/controller scripts.
- Keep component migrations paused. Adapt only branch capabilities useful to the
  SSG starter, with current Astro contracts and no product-specific auth defaults.

## Package identity

- The starter is now `@samline/astro`; reserve `@samline/astro-kit` for a different
  future integration. The executable is `samline-astro` so it does not conflict
  with the framework's `astro` binary. No npm publication is authorized.
- The current repository/workspace retains its existing astro-kit location;
  changing the package name does not authorize renaming a remote repository.

- Astro Action FormData conversion returns null for empty optional strings under
  wrappers/transforms. Normalize nullable optional phone, website and captchaToken
  to empty strings; test actual HTTP submissions rather than schema objects alone.

## Modular installer requirements

- Forms selection must install both @samline/forms and @samline/formatter; Fields
  is a separate template choice, not a prerequisite for using the packages.
- Mail always includes its contact Action example. Independent Actions and Content
  selections must include basic examples without unrelated services.
- Installer language presets are en-us, es-mx and es-es, plus custom locale entry
  in the wizard. This supersedes en-mx as a default offered second locale; the
  catalog now includes those three presets; the obsolete en-mx dictionary was
  removed during implementation.
- Selected features must be addable later; omitted integrations should not leave
  unnecessary files, dependencies, imports, environment or translation domains.

- Content Collections must ask whether data comes from local files, an API,
  Strapi, Shopify or another service; generate the selected provider's example.
  A remote source does not imply SSR; source and build/live timing are separate.
- Adding a language later must inspect the current dictionaries, including custom
  keys/domains, and create matching keys with empty translations. The user fills
  translations. Do not copy preset text, content entries, posts or products.
- Ticker is a user-authored reference for maintenance conventions, clear API
  ownership, executable examples and evidence discipline only. Its runtime,
  website architecture and runtime-only publication exclusions do not apply here.

- Keep package/agent catalog metadata dependency-light. Distribution validation
  must not require resolving the CLI parser through copied development symlinks.
- Later additions inspect current core script commands for Bun/Node; do not let
  creation-time metadata undo a deliberate project runtime change.
- Keep inactive transport registrations separate: adding a working basic Action
  must not accidentally enable SMTP contact on Workers.
- A new locale index must compose its own empty domain files; copying an index
  that points into another locale would silently reuse translated content.

## Distribution website

- Document the distribution's own installer, generated source, recipes and APIs;
  Astro remains responsible for its framework, integrations and official docs.
- Use the package-landing-docs/Ticker presentation without replacing the working
  starter at the root. Keep website build/dependency/distribution boundaries clear.
- Include a prominent curated personal-package section: Drawer and Ticker link
  to their websites; Forms links to the package until its landing is available.
  Add more packages only when the human requests them.
- Maintain .gitignore and .npmignore alongside allowlists. Website output,
  dependencies, reports and tooling stay out of generated projects; portable
  .agents intentionally remains in the starter distribution.

## Editorial identity and licensing

- The display name is Astro; identify our package/installer as @samline/astro.
  Do not invent the brand SAM Astro or imply framework ownership/endorsement.
- Review titles, section names, descriptions and examples as a complete reader
  journey on the landing, Examples, Docs and READMEs. Explain where a command
  runs, what it changes and how the developer continues. Avoid generic repeated
  reference descriptions or examples with hidden optional dependencies.
- READMEs and developer documentation are English. The root README should make
  the purpose, use, installed source and framework boundary clear immediately.
- Own source is MIT; retain upstream notices. The former upstream Bun skill was
  CC BY-NC and was removed rather than relabeled as unrestricted project source.

## Public release copy

- The human wants the landing, Examples, Docs, READMEs and changelogs to use the
  normal public installation flow without unpublished, coming-release or
  pending-publication notices. Do not reintroduce those banners.
- Local archive testing is a contributor workflow, not a consumer prerequisite.
- Editorial readiness does not establish an actual registry or hosting operation.
  Preserve dated operational evidence privately in maintainer memory; do not
  invent publication/deployment dates, successes or verification.
