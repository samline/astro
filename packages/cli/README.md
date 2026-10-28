# @samline/astro installer

Creates Astro 7 projects from the maintained base and adds optional integrations
later.
The CLI runs on Node and uses the TypeScript parser for static dictionary analysis
and targeted configuration edits. It does not require Bun or pnpm to start.

[Website](https://samline.github.io/astro/) ·
[Examples](https://samline.github.io/astro/examples/) ·
[Documentation](https://samline.github.io/astro/docs/) ·
[Changelog](CHANGELOG.md)

## Create a project

Run from the folder that will contain your new project:

```sh
npx @samline/astro my-site
```

The wizard asks for languages, deployment and optional integrations. Supplying a
folder/deployment does not bypass the remaining questions. Built-in initial
languages are en-us, es-mx and es-es; custom tags accept a native name/direction.

The interactive selection defaults to `welcome`: a starter demo with a header,
navigation, footer, homepage and `/demo` page. Press Enter to keep it, choose other
integrations by name/number, or enter `none` for the core only. Include `welcome`
in your selection if you want it alongside other features. `--minimal` and
unattended `--yes` without features keep the core homepage without demo sections.

```sh
npx @samline/astro my-site --minimal --deploy vercel --locale es-mx
npx @samline/astro my-site --yes --deploy vercel --features forms,fields,mail
npx @samline/astro my-site --yes --deploy static --features content --source local
npx @samline/astro shop --yes --deploy vercel --features content --source shopify --collection products
```

Optional features: themes, auth, captcha, gtm (including CookieConsent),
language-picker, forms, fields, actions, content, mail, pageloader, faicon, welcome.
Core includes Astro/TypeScript, Tailwind, local typography, SEO/robots/sitemap,
layout/section primitives, a minimal homepage and NotFound, resource folders,
selected-language dictionaries and portable agent guidance/skills.

Forms always installs @samline/forms and @samline/formatter. Fields is a separate
Astro template choice. Mail always includes the contact Action; it does not force
Forms, Fields or CAPTCHA. Explicit Actions includes an independent basic example.

## Choose project tools

```sh
npx @samline/astro my-site --package-manager npm --runtime node
pnpm dlx @samline/astro my-site --package-manager pnpm --runtime node
bunx @samline/astro my-site --package-manager bun --runtime bun
```

The selected tools must already be installed. Bun dependency management with
the Vercel profile requires Bun 1.4.0 or newer for scoped dependency overrides.

Installation manager and script runtime are independent. For example,
`--package-manager npm --runtime bun` uses npm dependencies and Bun execution.
The generated manifest, install guard, README, lockfile and provider commands
follow the selection. Switching tools in an existing project is a deliberate
project change, not an effect of adding an integration.

## Add to an existing generated project

Run from the project or provide --cwd:

```sh
npx @samline/astro add
npx @samline/astro add fields
npx @samline/astro add themes gtm
npx @samline/astro add auth --auth-mode external
npx @samline/astro add captcha --captcha-provider turnstile
npx @samline/astro add content --source strapi --collection articles --content-mode build
npx @samline/astro add content --source api --protocol rest --collection news --content-mode live
npx @samline/astro add mail --dry-run
npx @samline/astro status
```

Both create and add use the same feature payloads and configuration operations.
Repeated additions are no-ops; different named collections can coexist. Layout,
Action, middleware and dictionary edits preserve unrelated source. A conflicting
file or unsupported custom export stops the operation before writing anything.
No --force overwrites, automatic Astro upgrades, provider changes or database
migrations are performed. Older projects without modular metadata require an
explicit manual adoption/review; add does not guess their installed capabilities.

Themes, GTM and PageLoader receive layout mounts. Reusable controls such as
Theme Switch, LanguagePicker, Fields and Captcha are available to compose in the
owning section; add does not invent a header or replace a custom homepage.
Selected theme/language controls appear in the demo header on initial creation.
Adding `welcome` later supplies its sections and `/demo` route while preserving
your existing homepage. Read `src/sections/Welcome/README.md` to compose the demo
header, footer and homepage explicitly.
Adding the demo requires one static `header` slot and one static `footer` slot
in Main around its main content. Older or customized layouts without these slots
need a deliberate layout edit first; the installer reports the missing slot and
changes no files rather than silently rendering an incomplete demo.

## Add languages

```sh
npx @samline/astro locale add es-es
npx @samline/astro locale add fr-fr --locale-name Français
npx @samline/astro locale add ar --locale-name العربية --direction rtl
```

Later additions inspect current dictionaries, including custom domains/keys,
and create corresponding keys with empty translations. The user supplies the
translations. No preset text, content entries, pages, products or guessed slugs
are copied. Existing values are preserved. Type/shape drift and dynamic values
need explicit review; the CLI never executes dictionary modules to inspect them.

New locales stay out of the active list in src/i18n/config.ts until completed.
Fill required copy and language labels, check formatting/types, then add the code
to that list deliberately. Review provider locale maps and actual translated URL
relationships before publishing. Locale inventory, direction and typed access
are prepared; RTL styling and provider translations are project responsibilities.

## Content sources

Choose local files, a generic REST/GraphQL API, Strapi 5, Shopify Storefront, or
another named custom service. Each source includes its schema, loader/query,
configuration and a read example. Only that source's files are installed.
Build-time remote collections can remain SSG; Live Collections need an adapter.

```sh
npx @samline/astro add content --source other --service "Custom CMS" --protocol graphql --collection stories
```

Remote examples remain unregistered until endpoints/credentials/schema and locale
mapping are configured. Their README and registration example explain activation.
No CMS/store is contacted during installation. Shopify starts with a read-only
products query, not Admin API, checkout or account infrastructure. Other services
get an explicit custom scaffold, not an invented native integration.

## Compatibility and recovery

Choose npm, pnpm or Bun for installation and Node.js or Bun for scripts. The
wizard lists available tools; `--package-manager` and `--runtime` set explicit
choices without questions. Missing explicit tools produce an error, never a
silent switch. Without tool flags, unattended creation follows its launcher
when recognized, otherwise npm; Bun launchers default to Bun scripts. Add preserves the existing
project's manager, lockfile and runtime. Never install global tools silently.
Cloudflare's Astro/Wrangler execution retains its Node compatibility setting.

Actions/auth/SMTP execution need a compatible backend. For pure static hosting,
choose an adapter or explicitly use --scaffold for inactive source examples.
SMTP and owned PostgreSQL on Workers require a verified project-specific transport;
the installer only provides inactive scaffolding there. Public pages remain SSG.

--dry-run reports planned paths without changing the project. --no-install applies
files and reports dependency/format follow-up commands. --yes uses explicit flags
and minimal defaults; noninteractive ambiguous feature choices fail visibly.
Cancellation before application makes no changes. Files are preflighted and
installer-owned writes are rolled back on application failure. If package install
fails afterward, files remain and a retry command is reported; arbitrary package
scripts cannot be rolled back by this CLI.

Installed, configured and validated are different states. Status reports file
and locale state; it never prints secret environment contents or claims provider
connectivity. Follow each installed README before enabling real operations.

## Local distribution checks

From the repository root:

```sh
bun run verify
bun run kit:pack
npm exec --yes --package ./artifacts/samline-astro-7.21.1.tgz -- samline-astro my-site --minimal --deploy static --no-install
```

The root is the source of truth. packages/cli/template is generated by the
allowlist; never edit it manually. Selection copies only declared core/feature
paths. Maintainer memory is excluded; selected portable skills and fresh agent
context are included. Test the actual tarball and consumer generation/add flows.

## Updates and documentation

The generated source belongs to its project. Executing a newer generator can
create a new project or add a missing feature; it does not merge changes into
previously copied files. Use Astro's official upgrade tool for Astro and its
official integrations, starting with `pnpm dlx @astrojs/upgrade --dry-run`.
See [Astro's upgrade guide](https://docs.astro.build/en/upgrade-astro/) for version
selection and migrations. There is currently no base-source update command.

This reference documents our installer. Framework behavior is documented by
[Astro](https://docs.astro.build/); installed component and integration READMEs
document the source supplied by this distribution.

## License

Original installer and starter source is MIT licensed. The CLI archive includes
`LICENSE`, `THIRD_PARTY_NOTICES.md` and the retained upstream notices in `licenses/`.
Generated projects retain original-source and upstream notices without choosing
a license for the consumer's own application. Dependencies and bundled skills
keep their respective terms.
