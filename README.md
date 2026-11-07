# @samline/astro

An Astro project starter and interactive installer by samline. Start with a
configured Astro 7 project, choose the integrations you need, and keep the
generated source in your own repository.

The base is designed for **static pages with optional Server Islands**. Vercel is
the default deployment target; static hosting, Netlify, Cloudflare Workers and a
custom Node server are also available. Astro provides the framework and rendering
APIs. This package provides project configuration, reusable components and
integration examples built around it.

[Demo](https://samline.github.io/astro/) ·
[Examples](https://samline.github.io/astro/examples/) ·
[Documentation](https://samline.github.io/astro/docs/) ·
[Changelog](CHANGELOG.md)

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Capabilities](#capabilities)
- [API at a glance](#api-at-a-glance)
- [Documentation](#documentation)
- [Changelog](#changelog)
- [AI agent skill](#ai-agent-skill)
- [License](#license)

## Installation

This branch includes the optional Impeccable beta integration. Select the beta
channel for that feature and for later additions to a project using it:

```sh
npx @samline/astro@beta my-site --yes --features impeccable
```

The standard commands below select the stable channel. Publishing this beta uses
`--tag beta` and does not move `latest`.

<a id="create-a-project"></a>

Requires Node.js 22.23.4 or newer to run the installer. Run one of these commands
from the folder that will contain your new project:

With npm:

```sh
npx @samline/astro@latest my-site
```

With pnpm:

```sh
pnpm dlx @samline/astro@latest my-site
```

With Bun:

```sh
bunx @samline/astro@latest my-site
```

The wizard asks for a project folder, deployment target, languages and optional
integrations. Language presets are `en-us`, `es-mx` and `es-es`; you can enter
another language. Only selected integrations and their dependencies are included.

Choose **npm, pnpm or Bun for dependencies** and **Node.js or Bun for scripts**.
The wizard lists available tools. Use `--package-manager` and `--runtime` to make
those choices in unattended commands. Selected tools must already be installed;
the installer never installs global tools. Bun dependency management with the
Vercel profile requires Bun 1.4.0 or newer.

For a minimal, noninteractive static project:

```sh
npx @samline/astro@latest my-site --minimal --deploy static --locale en-us
```

Pure static hosting has no server runtime. Server Islands, active Actions and
server authentication require a compatible adapter. All deployment profiles
retain `output: 'static'`; individual server consumers opt into request-time work.

## Quick start

After creation, enter the generated project:

```sh
cd my-site
```

Use the commands printed by the installer for your selected tools:

| Task                         | npm              | pnpm          | Bun              |
| ---------------------------- | ---------------- | ------------- | ---------------- |
| Start the development server | `npm run dev`    | `pnpm dev`    | `bun run dev`    |
| Check and build the project  | `npm run verify` | `pnpm verify` | `bun run verify` |
| Build for deployment         | `npm run build`  | `pnpm build`  | `bun run build`  |

The `dev` command starts a background Astro server and prints its local URL.
Open that URL to see your generated homepage. The interactive wizard selects the
Welcome demo by default; a minimal project starts with the core homepage.
Edit the page composition in `src/pages`, its content blocks in `src/sections`
and visitor-facing copy in `src/i18n/dictionaries`.

## Capabilities

<a id="what-the-base-provides"></a>

Every project starts with Astro and strict TypeScript, Tailwind CSS 4, local
Fontsource typography, SEO metadata, robots and sitemap configuration, modular
translation dictionaries, layout primitives and a minimal home/404 page. Public
`img`, `docs` and `video` folders hold resources that do not need compilation.
Portable `.agents` guidance and relevant skills are included for future work.

| Optional integration | What it adds                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Themes               | Theme initialization, a light/dark switch and a client API.                                                                |
| Authentication       | Better Auth integration for external identities, OAuth/OIDC or project-owned users.                                        |
| CAPTCHA              | Turnstile or reCAPTCHA rendering and server verification.                                                                  |
| GTM                  | Deferred Google Tag Manager loading and cookie preferences.                                                                |
| Language picker      | A reusable control for the project's active languages.                                                                     |
| Forms                | `@samline/forms` and `@samline/formatter`; Fields templates are a separate choice.                                         |
| Fields               | Native Astro form controls with labels, help, errors and optional Forms enhancements.                                      |
| Actions              | A basic validated Astro Action example.                                                                                    |
| Content Collections  | A selected local/API/Strapi/Shopify/custom source and a read example, with build or live loading where supported.          |
| SMTP mail            | A private mail service and contact Action example.                                                                         |
| PageLoader           | An optional loading overlay with swappable ldrs animations.                                                                |
| Font Awesome         | An SVG icon component and selected free icon packages.                                                                     |
| Impeccable (beta)    | The pinned `impeccable` CLI, a `design:detect` script and agent rules; you install its skills and hooks yourself.          |
| Welcome              | A two-page demo with header, active navigation, welcome content and footer; selected by default in the interactive wizard. |

Forms and Formatter use npm's `latest` tag when first installed, including new
major versions. Their APIs can change across majors; read the installed package's
documentation. A project's lockfile fixes its current resolution, so use the
selected package manager's update command to refresh an existing installation.
Later additions never silently replace a project's explicit dependency versions.

Selected pnpm projects exempt only Forms and Formatter from the release-age delay
so a fresh latest release is eligible immediately. Other dependencies retain the
manager's policy. Lockfiles still hold installed versions until explicitly updated.

Integrations include source and setup instructions. Add your own credentials,
provider mappings and application UI as required. Installing an integration does
not connect it to a live service or deploy the project.

### Named and translated routes

Every language has `src/i18n/dictionaries/<locale>/routes.ts` listing stable page
names and actual locale-free paths. Declare shared names in `src/config/routes.ts`;
edit URLs in the locale tables and use null for unavailable translations. Link and
Button accept `routeName` instead of `href`; optional `currentMatch` handles exact
pages or segment-bounded children. Main, SEO and LanguagePicker share `path`,
`routeName` or an actual `localizedPaths` map for translated content. Main forwards
that context to its default header; custom headers must forward it explicitly.
Missing translations are omitted. `routeEntries(locale)` exposes the named page
inventory for navigation or an HTML sitemap. Astro still owns page generation.
See [localized routes](./src/i18n/localized-content.md) for complete examples and
[Link](./src/components/Link/README.md) for active navigation behavior.

### Work with the generated source

Pages select a layout and compose domain sections; sections use reusable
components and keep their private children beside them:

```text
src/
├── pages/                 Routes, data and page metadata
├── layouts/Main.astro     Document, shared head/header/footer and main landmark
├── sections/              Page sections and their private children
├── components/            Reusable components, each with its own README
├── i18n/dictionaries/     Language/domain translations and types
├── styles/                Global CSS and Tailwind tokens
└── server/                Selected server integrations
```

Each component README documents imports, props, examples and behavior. Read the
[frontend conventions](website/docs/src/content/docs/guides/conventions.md) and
root `AGENTS.md` before extending the base. Visitor-facing text belongs in typed
dictionaries; developer documentation is in English.

For framework behavior, use [Astro's official docs](https://docs.astro.build/).
Our documentation covers what this distribution configures and exposes.

### Keep a project updated

Astro has an official upgrade tool. Preview its changes first:

```sh
pnpm dlx @astrojs/upgrade --dry-run
```

Follow the [update guide](website/docs/src/content/docs/guides/updating.mdx) for
Astro, integrations and other dependencies. A new generator version does not
replace source already copied into a project. There is currently no automatic
base-source update command; `add` installs missing integrations.

### Dependency updates and server readiness

From the project root, identify who owns the current server and record its launch
flags and local URL before changing installed dependencies. Ordinary source edits
use HMR. If an agent owns the background server, stop that instance with the
selected runner's `run astro dev stop`, update/install with the selected manager,
and restart using its original command and flags. A foreground server belongs to
its terminal/supervisor; stop and restart through that owner. Obtain authorization
before interrupting a user-owned session.

For this repository's default background server:

```sh
bun run astro dev stop
pnpm install
bun run dev
```

Use the actual project tools in generated projects. After restarting, inspect
logs and request the exact printed URL with `curl --fail --show-error <local-url>`
(replace the placeholder), or open it in a browser and confirm the intended page
loads. A live PID, a manager record, a TCP listener and a successful HTTP response
are different signals. A port in use does not establish project identity.

If startup reports an existing server but HTTP fails, inspect the launch owner's
logs, PID command and working directory from an environment allowed to inspect
processes. Restricted PID probes can return EPERM; in the installed Astro version,
status can then classify a healthy record as stale and remove it. Do not assume
status is read-only under restricted process visibility. Once visibility is
adequate, use status/logs together with an actual HTTP request. Confirm process
identity before any termination; do not start with --force, delete/rebuild lock
metadata or kill an unrelated listener. Preserve the lock and diagnose the owner
when identity cannot be established. Dependency installation need not modify
package.json; restarting after every build is unnecessary.

## API at a glance

The installer provides commands and selected source, rather than a browser runtime API.

| API                                             | Purpose                                                      |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `npx @samline/astro@latest <directory>`         | Create a project with the selected tools and integrations.   |
| `npx @samline/astro@latest add [feature]`       | Add an integration to a compatible generated project.        |
| `npx @samline/astro@latest status`              | Inspect the installed project configuration.                 |
| `npx @samline/astro@latest locale add <locale>` | Scaffold empty translations from the project's current keys. |

### Entrypoints

| Entrypoint                             | When to use                                                             |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `@samline/astro` CLI                   | Run the Node-compatible generator through npx, pnpm dlx or bunx.        |
| Generated `src/` and component READMEs | Import the actual selected components and customize their owned source. |

### Add integrations later

Run these commands **inside a project created by this installer**:

```sh
npx @samline/astro@latest add
npx @samline/astro@latest add fields
npx @samline/astro@latest add auth --auth-mode external
npx @samline/astro@latest add content --source local --collection articles
npx @samline/astro@latest status
```

`add fields` also installs Forms and Formatter. `add mail` always includes its
contact Action. Existing custom code is preserved; unsupported edits or name/file
conflicts stop the operation before writes. Use `--dry-run` to inspect an addition
or `--no-install` to prepare source without installing dependencies.

To prepare another language from the project's current dictionary keys:

```sh
npx @samline/astro@latest locale add es-mx
```

The new dictionaries contain **empty translations**. Fill them before activating
the language in `src/i18n/config.ts`. Adding a language does not duplicate posts,
translate CMS content or guess the translated URL of a record.

See the [CLI reference](packages/cli/README.md) for feature flags, compatibility,
conflicts and recovery.

## Documentation

Read the [documentation](https://samline.github.io/astro/docs/) for the full guides and installer contracts, and explore [working examples](https://samline.github.io/astro/examples/) with commands, generated files and next steps.

| Guide                                                                       | What it covers                                     |
| --------------------------------------------------------------------------- | -------------------------------------------------- |
| [Getting started](website/docs/src/content/docs/getting-started.mdx)        | Installation, project choices and first steps.     |
| [CLI reference](packages/cli/README.md)                                     | Commands, flags, compatibility and recovery.       |
| [Components](src/components/README.md)                                      | Installed component APIs and examples.             |
| [Frontend conventions](website/docs/src/content/docs/guides/conventions.md) | Page, section and component ownership.             |
| [Update guide](website/docs/src/content/docs/guides/updating.mdx)           | Dependency upgrades and copied-source maintenance. |
| [Astro documentation](https://docs.astro.build/)                            | Framework APIs, rendering and routing.             |

<a id="repository-development"></a>

For repository development, website maintenance and local archive checks, read
[CONTRIBUTING.md](CONTRIBUTING.md).

## Changelog

Read [CHANGELOG.md](CHANGELOG.md) or the [published changelog](https://samline.github.io/astro/docs/changelog/) for release history and explicitly marked breaking and behavior changes. Review the notes before upgrading.

## AI agent skill

<a id="ai-agent-skills"></a>

Generated projects include the original
[samline-astro skill](.agents/skills/samline-astro/SKILL.md), portable frontend
conventions and fresh project memory. Agents can use them to follow the installed
features, translated UI and section ownership without importing maintainer history.

For design-led projects, the bundled
[samline-project-kickoff skill](.agents/skills/samline-project-kickoff/SKILL.md)
provides setup, design inventory and staged handoff guidance. Start with its
[English kickoff prompt](.agents/skills/samline-project-kickoff/references/kickoff-prompt.md).
The [agent workflow guide](website/docs/src/content/docs/guides/agent-workflows.mdx)
explains invocation, standalone downloads and the bundled skills.

The [maintainer skill](.agents/skills/samline-astro-maintainer/SKILL.md) describes
the CLI, package and website workflow in this repository. It is excluded from
generated projects. Bundled third-party skills retain their own licenses.

Skills are discovered differently by each agent. Follow its supported project or user skill directory; a repository source link alone does not install or activate a skill. The [workflow guide](https://samline.github.io/astro/docs/guides/agent-workflows/) provides the matching standalone downloads.

## License

Original source is MIT licensed under [LICENSE](LICENSE), copyright Samuel Olvera (samline).
Astro and other upstream projects retain their own licenses and notices; see
[third-party notices](THIRD_PARTY_NOTICES.md). Keep these notices when distributing
included source. Astro names and marks identify the framework; this is an
independent project and does not claim Astro endorsement.
