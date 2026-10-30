# Release @samline/astro

The current version is **7.22.1**, targeting Astro 7. Use this workflow for npm
releases and GitHub Pages deployments. Keep the package major aligned with
Astro’s major; the package minor and patch versions evolve independently.

## Validate the release

This maintainer repository installs dependencies with pnpm and runs scripts with
Bun. Generated projects choose their own tools.

```sh
pnpm install --frozen-lockfile
pnpm --dir website install --frozen-lockfile
bun run verify
bun run site:verify
bun run --cwd website check:release
bun run kit:pack
```

Inspect the actual archive printed by `kit:pack`. It must contain the CLI,
selected starter source, portable agent context, English component docs and
license notices. Website source, maintainer history, secrets, dependencies and
build output must stay outside the package. Execute create/add/locale operations
from that archive in a disposable project before release.

The version command `bun run kit:version 7.x.y` synchronizes root and CLI versions;
review website metadata, current examples and both changelogs for the same release.
Do not rewrite historical validation records as if they covered a new archive.

## Review publication without publishing

```sh
npm publish ./artifacts/samline-astro-7.22.1.tgz --dry-run --access public
```

A successful dry run validates packaging, not npm account permissions, scope
ownership or registry availability. Before an authorized publication, verify the
account's access to the `samline` scope and npm's current authentication/2FA
requirements. Never commit credentials. See npm's
[publish documentation](https://docs.npmjs.com/cli/v11/commands/npm-publish/) and
[scoped public packages guide](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/).

Only after explicit publication authorization, publish the reviewed archive with
`npm publish ./artifacts/samline-astro-7.22.1.tgz --access public`. Confirm the
registry version and integrity afterward. A published version cannot be reused.
Keep public documentation written as the standard installation and usage flow.
Do not add publication-pending banners or make local tarball testing a prerequisite
for consumers. Record release verification in the release description.

## Deploy the website separately

The adapted website is indexable (`site.template=false`). Its combined static
artifact is
`website/landing/dist` with base `/astro/`. The **Verify and deploy package
website** workflow verifies and deploys that artifact to GitHub Pages on every
push to `main`. It also supports manual runs through `workflow_dispatch`.
Configure GitHub Pages to use GitHub Actions. Confirm the deployed commit,
routes, search, assets and canonical URLs;
a queued workflow is not deployment evidence.

Report deployment verification and remaining limitations in the release or change
description. Keep project memory focused on current technical contracts.
