# Changelog

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
