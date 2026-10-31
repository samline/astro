# Project state

## Identity and tools

- Project: {{NAME}}
- Created from @samline/astro {{VERSION}}.
- Astro dependency: {{ASTRO}}
- Package manager: {{INSTALL}}
- Script runner: {{RUN}}
- Runtime: {{RUNTIME}}
- Deployment target: {{DEPLOYMENT}}
- Initial output: SSG. {{ISLANDS}}

Use package.json, astro.config.mjs, the environment example, and README.md as the
source of truth when tools or deployment settings change. This project evolves
independently of the generator and starts at its own version 0.0.1.

## Base capabilities

- Page -> layout -> section -> reusable component ownership.
- Folder-based components, modular dictionaries and typed routeNames.
- Shared path/routeName/localizedPaths for metadata and language navigation;
  Link/Button named destinations with optional active child-route matching.
- SEO, robots, sitemap, Tailwind CSS 4 and local Fontsource fonts.
- Public resource folders and portable agent context.

{{INTEGRATIONS}}

## Commands

- {{INSTALL}} install
- {{RUN}} run dev
- {{RUN}} run check:i18n
- {{RUN}} run check
- {{RUN}} run verify
- {{RUN}} run build
