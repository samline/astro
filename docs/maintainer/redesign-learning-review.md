# Redesign learning review

Maintainer evaluation of the Petland redesign retrospective supplied on
2026-11-03, reconciled against this distribution on 2026-11-04. The retrospective
is case evidence, not a starter specification. Its benchmark scores, private
integrations, editorial copy and client-specific settings are not imported here.
This review is repository-only; generated projects receive the useful contracts
in their existing documentation and portable skills.

## Decisions

| Candidate                                                        | Decision                                                                            | Owning change or reason                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native image packaging                                           | Accepted, narrowly for the reproduced Vercel profile                                | `astro.config.mjs`, `projectManifest` and `image-runtime.test.mjs`: explicit Sharp dependency and SSR externalization. Static and other adapters omit the workaround.                                                                                                |
| Image use across rendering boundaries                            | Accepted as guidance plus an executable fixture                                     | `src/assets/README.md`: imported metadata, remote authorization, SSG/SSR/island/template differences and deployed checks. Keep native Astro APIs; do not install another image wrapper.                                                                              |
| Mandate Image for every SVG/resource                             | Not adopted as a universal rule                                                     | An inline SVG or intentional stable untransformed resource is a valid native HTML use. Failed optimization is not a reason to replace the pipeline with manual derivatives.                                                                                          |
| Semantic dictionary ownership                                    | Accepted                                                                            | `src/i18n/README.md`, frontend contracts and samline-astro skill: shared controls/errors/actions keep semantic owners; page editorial data remains separate. No global string deduplicator.                                                                          |
| Locale route tables                                              | Already covered                                                                     | Per-locale routes.ts, shared names/types, missing translations and route inventory are implemented. Do not create another route registry.                                                                                                                            |
| Draft versus applied filters                                     | Accepted as an optional form contract                                               | Fields README documents native GET/SAM choices, explicit Apply, draft-only reset versus URL clearing, real result counts and independent workflow state.                                                                                                             |
| Subscriber feedback loop                                         | Existing core adapter already handles field errors safely; extend consumer guidance | Fields updates character data only when changed. Custom subscribers still need conditional DOM writes and owned cleanup. No Forms defect established.                                                                                                                |
| Require SAM for every GET form                                   | Not adopted                                                                         | Native GET is sufficient for many forms. Optional controller/Fields use follows actual interaction needs.                                                                                                                                                            |
| Modal focus/scroll/keyboard                                      | Accepted as QA and ownership guidance                                               | Frontend contracts and kickoff skill distinguish initial focus, actual scroll and physical keyboard evidence. Use installed package lifecycle APIs.                                                                                                                  |
| Consumer Drawer patch and fixed side-panel geometry              | Deferred, not copied                                                                | No generic current-version reproducer or verified upstream-equivalent review was completed here. Do not pin the starter to a consumer patch, autoFocus setting or 100svh side panel. The reported drawer issue #3 was not independently readable during this review. |
| PageLoader above native dialogs                                  | Deferred runtime change                                                             | The optional starter loader uses a fixed overlay. A native modal occupies the top layer. Covering it requires an explicit composition/focus regression, not a larger z-index or an untested popover retrofit.                                                        |
| Per-route SSG/SSR and one head/body result                       | Already documented; reinforced in project skill                                     | Keep SSG where appropriate, choose SSR when freshness/metadata/status require it, and share a validated read. Do not make the whole site SSR or enumerate live inventory during build.                                                                               |
| Actions as the only reader                                       | Not adopted                                                                         | Collections, Live Collections and Actions remain valid for their own contracts. The case's chosen transport is not a framework constraint.                                                                                                                           |
| Reveal and transform ownership                                   | Already covered                                                                     | The opt-in reveal recipe and existing tests cover initially visible content, focus, reduced motion, no-JS and cleanup. No default global animation runtime is added.                                                                                                 |
| Ticker/video pause semantics                                     | Retain package ownership                                                            | Do not copy another playback controller or a requirement for permanently looping media. Verify pause intent in the consuming integration when installed.                                                                                                             |
| Real assets, copy and responsive QA                              | Accepted as focused additions                                                       | Kickoff skill and frontend contracts cover embedded artwork, copy authority, styled-fragment whitespace and actual configured breakpoint boundaries. No global xs token or customer button arrangement is added.                                                     |
| FAQ/Collapse and media union                                     | Deferred optional example                                                           | Native details/summary and an explicit image/video content model are useful choices. They do not justify new core dependencies or the customer's exact card template.                                                                                                |
| Canonical versus preview media origin                            | Existing API, clarified and tested                                                  | SEO already accepts absolute HTTP(S) image.src. Document that explicit public origin independently from canonical identity. Do not invent a required environment variable or trust request Host.                                                                     |
| Managed-server diagnostics                                       | Already covered                                                                     | Existing owner/readiness/EPERM contracts remain; no duplicate lifecycle manager or blind lock deletion.                                                                                                                                                              |
| Manager, runner, platform and Function runtime                   | Already covered                                                                     | Preserve the selected tools and emitted runtime. The case's Node/Bun versions do not replace every consumer's choices.                                                                                                                                               |
| Memory reconciliation                                            | Existing maintenance rule retained                                                  | Update current contracts in place. Do not ship chronological reports or superseded instructions in portable .agents.                                                                                                                                                 |
| Taxonomy, simulated metrics, contact recipients and exact design | Excluded                                                                            | They are application/editorial contracts, not reusable starter defaults or evidence of real statistics.                                                                                                                                                              |

## Evidence and limits

The installed Astro 7.4.4 / Vercel 11.0.17 profile built successfully but a real
request to its built `/_image` endpoint failed with MissingSharp and HTTP 500.
Resolving Sharp explicitly and externalizing it produced HTTP 200 and WebP bytes.
The permanent regression builds a generated project, checks an SSG asset and
native template, then runs SSR and island image requests from a relocated Function.
The fixture installs the native dependency closure inside its own project before
building: symlinking that closure outside the fixture creates an artificial
nonportable tracing case and is not a substitute for a real installation.

This is local macOS arm64 / Bun evidence. It does not certify Vercel's Linux
runtime, every package manager/runtime combination, physical keyboard behavior or
accessibility. A target deployment must still verify native files and image
decoding. Dependency installation used the available pnpm 11.25.0; the declared
packageManager was preserved. Package source and lock checks do not establish a
different tool version was run.

The image and dictionary guidance was checked against current Astro APIs, the
installed form API, the current Fields adapter and the case's image-source/filter
implementations. Existing routing, reveal, server-operation and rendering contracts
were compared before adding rules. This is a bounded review, not a line-by-line
audit of all case source or an independent rerun of its deployed benchmarks.

No issue was posted and no dependency's upstream source was patched. Future
Drawer/loader or cross-platform image changes need a current minimal reproducer
and target-runtime verification. The generic lessons live with their owners;
this decision record does not itself install a recipe or authorize publication.
