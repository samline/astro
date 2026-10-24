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

- Install with pnpm and run scripts with Bun; the standalone generator has independent npm/Node fallbacks.
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
