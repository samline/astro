# Third-party notices

The original installer and starter source in `@samline/astro` are licensed under
MIT by Samuel Olvera (samline). The repository and CLI contain `LICENSE`;
generated projects retain that license in `licenses/samline-astro-MIT.txt`.
These terms cover the included original source, not a consumer's independently
authored application or upstream dependencies.

## Astro

This project uses [Astro](https://astro.build/), maintained by its respective
authors. Astro is MIT licensed, copyright (c) 2021 Fred K. Schott. The complete
upstream notice, including the notices for portions originating from SvelteKit
and Vite, is retained in [licenses/astro-MIT.txt](licenses/astro-MIT.txt).
Preserve it when distributing the included Astro starter assets or substantial
portions of upstream source.

Astro is installed as a dependency and retains its own license. Framework APIs,
rendering, integrations and their documentation belong to the Astro project.
This independent distribution does not claim affiliation or endorsement. Names
and logos identify their respective projects; the source license does not grant
additional trademark rights.

## Dependencies and assets

Packages installed through pnpm or npm retain the license and notice files in
their own distributions. The root license does not replace those terms.
In particular:

- Fontsource Inter is distributed under SIL Open Font License 1.1; retain its
  [license](licenses/inter-OFL.txt) when redistributing font files.
- Font Awesome Free uses separate licenses for icons (CC BY 4.0), fonts
  (SIL OFL 1.1) and code (MIT). The optional FaIcon component renders selected
  SVG icon data from Fonticons, Inc. Preserve its
  [license and attribution](licenses/fontawesome-free.txt); icon data has not
  been modified by this component. See the [upstream license](https://fontawesome.com/license/free).
- TypeScript, which the CLI uses as a dependency, retains its Apache-2.0 license.
- Selected optional integrations retain the licenses of their own packages.

## Bundled agent skills

Original project skills are covered by the project's MIT license. Third-party
skills keep their own terms and source provenance in `skills-lock.json` and
`.agents/skills/README.md`. Their licenses are not replaced by the root MIT
license. Preserve accompanying license files when copying or adapting them.

| Included skill source                                                                                      | License and retained notice                                                                                            |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [Addy Osmani's web-quality-skills](https://github.com/addyosmani/web-quality-skills)                       | [MIT](licenses/skills/addyosmani-web-quality-skills.txt)                                                               |
| [astrolicious/agent-skills](https://github.com/astrolicious/agent-skills)                                  | [Declared MIT; author metadata Astro Team](licenses/skills/astrolicious-agent-skills.txt)                              |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)                                    | [MIT as declared by its README](licenses/skills/vercel-labs-agent-skills.txt)                                          |
| [Anthropic's frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | [Apache-2.0](licenses/skills/anthropics-frontend-design.txt)                                                           |
| [Giuseppe Trisciuoglio's developer-kit](https://github.com/giuseppe-trisciuoglio/developer-kit)            | [MIT](licenses/skills/giuseppe-trisciuoglio-developer-kit.txt)                                                         |
| [Seth Hobson's agents](https://github.com/wshobson/agents)                                                 | [MIT](licenses/skills/wshobson-agents.txt)                                                                             |
| [Anthony Fu's skills](https://github.com/antfu/skills)                                                     | [MIT](licenses/skills/antfu-skills.txt)                                                                                |
| [DeusData's codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp)                          | [MIT](licenses/skills/DeusData-codebase-memory-mcp.txt); the local copy includes additional coverage/workflow guidance |
| [Antigravity's skills](https://github.com/sickn33/agentic-awesome-skills)                                  | [MIT](licenses/skills/sickn33-antigravity-awesome-skills.txt); repository-only backend guidance                        |

The upstream Bun skill from `midudev/autoskills` has a noncommercial license and
is excluded from this repository and distribution. Bun execution conventions
are documented in the original project guidance instead.

## Website-only source

The private website is excluded from the CLI and generated projects. Its
`website/TEMPLATE-LICENSE.md` retains the MIT license of the website template.
Local website fonts retain the adjacent SIL OFL files, with source versions
and asset details in `website/shared/assets/fonts/README.md`.
