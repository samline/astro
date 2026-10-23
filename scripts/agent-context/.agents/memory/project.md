# Project state

## Identity and tools

- Project: {{NAME}}
- Created from Astro Kit {{VERSION}}.
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
- Folder-based components with English API documentation.
- Modular locale/domain dictionaries with en-us active and en-mx prepared.
- SEO, robots, sitemap, social metadata, and structured data.
- Tailwind CSS 4, local Fontsource fonts, and light/dark theme controls.
- Optional GTM consent and an ldrs-based PageLoader.
- Public img, docs, and video directories for uncompiled resources.
- Bundled skills with source metadata in skills-lock.json.

## Commands

- {{INSTALL}} install
- {{RUN}} run dev
- {{RUN}} run check:i18n
- {{RUN}} run check
- {{RUN}} run verify
- {{RUN}} run build

## Project-specific state

No project-specific implementation decisions or validation results have been
recorded yet. Add them as work is performed. Installing the base does not mean
it has been deployed or that real analytics, credentials, or provider behavior
have been validated.
