# Repository development

## Validate and test the installer

To work on this distribution itself, use pnpm for dependencies and Bun for
repository scripts. From a checkout:

```sh
pnpm install
bun run verify
bun run kit:pack
```

The current archive is `artifacts/samline-astro-7.28.0.tgz`. From the folder where
you want the test project, run the following with an absolute archive path:

```sh
npm exec --yes --package /absolute/path/to/astro/artifacts/samline-astro-7.28.0.tgz -- samline-astro my-site
```

The repository root is the maintained starter. `packages/cli/template` is
regenerated from explicit allowlists; edit the original source, then run
`bun run kit:prepare`. Never maintain the generated template by hand.

Root and CLI versions are `7.28.0`. Distribution releases stay on major 7 while
supporting Astro 7; minor versions evolve independently of Astro's minor number.
`bun run kit:version 7.x.y` advances both manifests for a future release.
Packaging, publishing and deployment are separate operations.

## Landing and documentation

The private [website workspace](website/README.md) contains the landing, Examples
and documentation site:

```sh
bun run site:install
bun run site:dev
bun run site:verify
```

Website source, tooling and dependencies are excluded from generated projects
and the CLI archive. Source component/integration READMEs feed the documentation
site, so API documentation stays beside its implementation.
