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
- Modular locale/domain dictionaries with en-us active and en-mx prepared; Main
  can expose selected public domains as inert JSON for section browser scripts.
- SEO, robots, sitemap, social metadata, and structured data.
- A localized local Content Collection, optional API/Strapi build loaders, Live
  Collection and unregistered API Actions; see src/content/README.md.
- Tailwind CSS 4, local Fontsource fonts, and light/dark theme controls.
- Optional GTM consent and an ldrs-based PageLoader.
- Disabled-by-default SMTP service under src/server/mail with localized templates;
  request-time delivery needs server execution and configured credentials.
- Native reusable Fields with local API docs, SAM Forms/Formatter integration,
  password/file enhancements, and transport-independent submission.
- Contact Action demo under src/actions/contact; registration depends on the
  deployment profile. Read its README before connecting a form.
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
