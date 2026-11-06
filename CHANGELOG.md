# Changelog

## 7.28.0-beta.0

Beta release published under the `beta` dist-tag; `latest` stays on 7.27.1.

- Add the opt-in `impeccable` integration: a pinned `impeccable` devDependency,
  a `design:detect` script, Impeccable's runtime-state .gitignore block and
  portable agent rules that keep its proposals inside dictionaries, ownership,
  tokens and reduced motion. Creation omits frontend-design when selected.
- The kit never copies Impeccable skills, runs its installer, configures hooks or
  seeds PRODUCT.md/DESIGN.md; users run `npx impeccable install` and
  `/impeccable init` themselves.
- Document how agents complete Impeccable's DESIGN.md type sizes from the CSS,
  keep observed and derived tokens apart, and treat its critique and shape
  verdicts as contract fidelity only.
- Accept `<major.minor.patch>-beta.<n>` in kit:version, ranking a stable release
  above its betas.
- Projects created with this beta cannot run `add` from 7.27.1 or older, which
  do not know the `impeccable` integration.

## 7.27.1

- Tighten the finish criteria in the conventions and skills: result indicators
  must reflect real outcomes, state sequences and the user's actual width are
  checked, demos state what they show and what is simulated, review verdicts name
  their scope, and captures are labelled.
- Add an editorial rule for technical portfolio copy: concrete explanations
  instead of interchangeable slogans.

## 7.27.0

- Generated projects expose their skills to Claude Code: the installer creates a
  `.claude/skills` symlink to `.agents/skills` (a junction on Windows, a copy with
  a notice when the platform refuses links), keeping a single skill library.
- The portable agent context states that skills are created and edited only in
  `.agents/skills/` and that `.claude` stays tracked.

## 7.26.0

- Theme native control accents, the text caret, link underline offset, paragraph
  wrapping and table numerals from the starter's base styles.
- Add a rendered-result checklist (contrast, type measure/scale, states, locale
  stress, browser surfaces, depth/motion, provisional fonts) with a fix triage
  order to the frontend conventions and the samline-astro finish step.
- Add the advisory `check:design` source scan (root and generated projects) for
  gradient text, one-sided accent borders, zero-offset glows, ping/bounce
  indicators, justified text and crushed tracking, with reasoned
  `design-ignore` exceptions and an opt-in `--strict` mode.
- Add a development-only pseudo-locale (`PUBLIC_I18N_PSEUDO=true`) that brackets,
  accents and lengthens dictionary copy in `astro dev` to stress layouts and
  reveal text outside dictionaries; builds are never transformed.
- The kickoff design inventory records product context first: evidence on hand
  (approved proof and explicit absences) and each page's mode (persuade, operate,
  read, experience), plus a provisional-font check; the prompt asks for both.

## 7.25.1

- Override @vercel/nft glob to 14.0.3 (minimatch 11) for root and generated Vercel
  projects, resolving GHSA-3g3m-2fjr-6pw4 and GHSA-g3hv-75wg-m249.

## 7.25.0

- Adapt the bundled Codebase Memory skill with CLI availability checks, explicit
  installation consent and required graph-first codebase inspection when installed.
- Add its standalone licensed ZIP to agent-workflow downloads, generated context
  and archive/browser validation without bundling or auto-installing an executable.

- Fix reproduced Vercel request-time Image failures by installing Sharp explicitly
  and externalizing it for native dependency tracing; leave other profiles unchanged.
- Test static, SSR, island and template images with a relocated generated Function.
- Ship an image-boundary guide and clarify semantic dictionary ownership, staged
  filter state, preview social assets and focused design/interaction QA.
- Refine the portable project/kickoff skills and retain maintainer learning decisions
  separately from generated project context.
- Keep the content-integration dev server in the foreground with --ignore-lock so
  agent-detected auto-backgrounding cannot leave orphaned servers on its port.

## 7.24.0

- Move editable named-page URLs into each locale's dictionaries/<locale>/routes.ts table,
  with shared names/types, explicit null availability and one import registry.
- Scaffold route keys without invented URLs when adding languages; preserve
  existing tables and register optional demo routes transactionally.
- Reuse the tables for demo navigation and expose routeEntries for public-page
  inventories; document navigation, real URLs, sitemap boundaries and dynamic content.

## 7.23.0

- Add optional exact/descendant route matching to Link with a shared pure resolver,
  localized home handling and explicit overrides, without a client controller.
- Include a typed routeNames catalog and shared path/routeName/localizedPaths
  resolution for Main, SEO and LanguagePicker; Link/Button accept named destinations.
- Forward page route identity to the default header; omit missing translations and
  fail clearly for missing current destinations. Preserve existing href/path APIs.
- Document three-language translated paths, Astro route generation, real CMS
  translation maps and per-route rendering choices in English.
- Expand reusable guidance for card focus and incremental list ownership.

## 7.22.1

- Update the maintained starter and website to Astro 7.4.4 and refresh their
  installed official Astro integrations through the official upgrade tool.
- Align the generated Vercel deployment profile with adapter 11.0.17.
- Synchronize lockfiles, release metadata and local archive examples.

## 7.22.0

- Include the optional samline-project-kickoff skill, English project brief and
  design inventory contract in every new project's portable .agents directory.
- Document setup, design review, staged implementation and agent continuity,
  with explicit authorization for publishing upstream issues and external work.
- Generate a copyable prompt and standalone skill ZIP from the same maintained
  source used by the installer; retain the skill license and supporting files.
- Verify packed-project skill integrity and browser copying/download behavior.

## 7.21.5

- Clean up maintainer and portable architecture guidance while retaining the
  layout-owned chrome defaults and exceptional slot contract.
- Synchronize release metadata and local archive examples for publication.

## 7.21.4

- Render the selected site's shared header/navigation and footer from Main by
  default, so ordinary routes and errors only supply metadata and content.
- Retain header/footer slots for exceptional overrides and add a separate
  body-end slot for trailing UI.
- Preserve existing layouts and homepages when adding the optional demo later;
  its dedicated Demo layout owns the feature's chrome overrides.
- Align portable memory, project skills and demo documentation with layout-owned
  defaults; verify new routes, errors, overrides and custom-layout preservation.

## 7.21.3

- Make document and site chrome ownership explicit in maintainer memory, portable
  project guidance and the generated-project skill: Main, Head, Header,
  Navigation, NavItems and Footer, with private mobile menus and announcement bars.
- Require composition and behavior checks when extracting chrome, including SEO,
  slots, Astro CSS scope, accessible navigation and package-owned lifecycle.
- Clarify that the compact demo is a starting implementation; this guidance
  update does not refactor starter source or update existing generated sites.

## 7.21.2

- Ship an opt-in, section-owned reveal recipe with focus/hash handling, reduced
  motion, navigation/HMR cleanup and deliberate BFCache preservation.
- Document dependency-update server ownership, restart and HTTP-readiness checks
  using each generated project's selected package manager and runtime.
- Add responsive card guidance for variable-length content and its review matrix.
- Include the recipes and conventions in portable agent context, and check the
  copied reveal source through regression tests and real Astro compilation.

## 7.21.1

- Preserve explicit Button submit/reset types after forwarded attributes.
- Add reusable text/navigation interaction states to Button and Link.
- Add native GET, contextual reset and dynamically inserted form recipes.
- Document validated parent-query context and private/no-store island responses.

## 7.21.0

- Add the optional two-page starter demo with header, active navigation and footer.
- Let consumers choose npm, pnpm or Bun and their Node/Bun script runtime.
- Document components with complete checked usage examples and source-specific guides.
- Add portable frontend conventions and original project/maintainer skills.
- Correct registration conflicts and comment-safe configuration edits.
- Retain original/upstream licenses and scoped Vercel transitive dependency fixes.
- Prepare the landing, Examples and Docs with expanded FAQs, consistent credits
  and refined personal-package illustrations.

## 7.20.0

- Add the modular project wizard and later `add`, `locale add` and `status` commands.
- Select source-specific Content Collection examples and optional integrations.
- Scaffold new languages from current dictionary keys with empty translations.
