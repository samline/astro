# Frontend conventions: how samline builds

This is a working contract distilled from the user's explicit instructions and
read-only source review on 2026-10-25. It captures intent, not legacy code to copy.
Read this with AGENTS.md and engineering-contract.md. The latest human request
wins over this document, reference repositories and installed skills.

## Decide ownership before writing code

| Responsibility                                                          | Owner                                          | Keep out                                             |
| ----------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| Route, data lookup, layout selection, section order and page metadata   | Page                                           | Loose UI, styling and browser controllers            |
| Document head, main landmark, common chrome and required global mounts  | Layout                                         | Domain-specific cards/forms/copy                     |
| One complete content or application block                               | Section                                        | New parallel primitives or package engines           |
| A card, form or subpart specific to one section                         | Inside that section's folder                   | The global reusable component catalog                |
| A reusable primitive with a stable responsibility                       | Its component folder                           | Application copy, API fetching or section imports    |
| Form state/validation/formatting, modal gestures/focus, ticker playback | Owning package                                 | A local competing implementation                     |
| UI copy, labels, metadata and accessible feedback                       | Typed locale/domain dictionaries               | Hardcoded strings in markup/scripts or env variables |
| CMS/API editorial content                                               | Validated provider data at its proper boundary | Huge dictionaries copied into every browser page     |

Pages read like composition. A section owns its complete block, including private
children. Do not promote a private child merely because it was extracted to a
file. Do not invent wrappers/barrels for a one-line reexport. Extract when it
creates actual reuse, a named responsibility, understandable state or a lifecycle.

Section supplies semantics and vertical rhythm; Box supplies centering, width and
gutters. Their usual composition is Section > Box > content components. Section
does not automatically insert Box. Preserve the existing narrow/default/wide/fluid
APIs and dimensions; neither primitive is a generic styled card.

## Prefer explicit, small APIs

Inventory existing components, slots and variants before adding another one.
Forward native attributes with the appropriate Astro HTMLAttributes. Consume
custom props so they do not leak to the DOM. Use props for real content/behavior
boundaries; use slots for intentional composition; use classes/tokens for visual
variation. Avoid any signatures, children:any, ambiguous booleans, generic option
bags, excessive file splitting and abstractions with no concrete consumers.

Regular Astro components read their current locale themselves. Pass locale
explicitly only across an isolated boundary that requires it, such as a Server
Island. Pass typed CMS/API content explicitly to its owning section. A language
switch must resolve a real translated-content relationship, not replace a prefix.

## Content drives the interface

Every visitor-facing string, including errors, loading text, alt text and ARIA
labels, belongs to a locale/domain dictionary. Each domain owns index.ts and
types.ts; locale indexes compose them. A new language copies current keys with
empty translations and stays inactive until ready. Provider editorial content is
separate from reusable UI copy. Do not add a global/full dictionary browser blob
when one controller needs only a few messages.

Navigation, CTAs and editable lists should be data-driven where that makes them
clearer; do not hardcode repeated content into component internals. Keep technical
identifiers, route IDs, icon paths and class strings as structural data rather
than pretending they are translations. Never infer an editorial accent by
splitting an identifier or taking the last word of a heading.

## Styling follows the existing system

The starter's CSS-first Tailwind configuration owns breakpoints, font families,
brand/status/placeholder colors, spacing and motion tokens. Group complete
utility strings by purpose with class:list. Do not synthesize partial utility
names. Use scoped component CSS when it expresses owned behavior/layout more
clearly; do not scatter new config variables into TypeScript or the document head.
The package website has its own approved shared theme; do not overwrite it with
the starter palette or mix its primitives into generated consumer source.

Use rem for authored fixed lengths and unitless zero. Use logical properties
where appropriate. Preserve approved Box widths, gutters, tokens and font loading.
Responsive changes follow the content: grids/flex may change shape, headings and
controls wrap, code scrolls in its own region. Test 320–1440, both themes and 200%
text. Never hide document overflow or shrink the typography to mask a problem.
Keep keyboard focus visible, native semantics, reduced-motion paths and readable
no-JavaScript content. The human explicitly removed SkipLink; do not reintroduce
it silently through a template or generic accessibility checklist.

## Behavior belongs to the instance

Author arrows, closures and direct calls. Avoid classes and this unless a real
external API requires a documented exception. Scope queries to the owning root;
keep repeated instances independent. Initialization must be idempotent; cleanup
releases exactly the listeners, observers, requests, timers and controllers owned
by the instance. Preserve persisted pagehide behavior where needed. Do not
initialize a global framework from every child or copy another package's mount
helper merely because it exists in a reference project.

Forms compose native controls, one label/help/error owner and the SAM Forms and
Formatter packages. Separate input behavior, validation and delivery transport.
Do not duplicate raw hidden values, masks or event handlers owned by those
packages. Auth/Actions/Server Islands authorize their actual operation; a route
rule does not protect every downstream action automatically.

## Examples are part of the API

An example teaches a real task in this order:

1. What the developer is trying to do and whether the feature is installed.
2. Where the code belongs, or from which folder the command runs.
3. The smallest complete source using actual imports, props and dictionary keys.
4. What appears/changes and what the example deliberately leaves to the project.
5. A practical variation, activation requirement and relevant official reference.

Distinguish terminal commands, illustrative output and source files. Only expose
copy controls for content intended to be copied. Do not present a file tree as an
executable command, a nonexistent endpoint as an included service, or an optional
dictionary as always available. Use actual examples in the shared Home/Examples/
Docs presentation. Compile/execute copied examples against the real component
and selected feature payload, not only against a regex or mock signature.

Our docs explain this distribution, its selections, defaults and local APIs.
Astro owns its framework; providers and dependencies own their APIs. Link to
those official docs rather than creating a parallel manual. English developer
README files live beside reusable components and ship with them. Keep source,
types, dictionaries, examples, documentation and meaningful checks in sync.

## Reference evidence and limits

Read-only review used these sampled sources; it was not a full audit of those
applications. The paths are maintainer evidence, not portable dependencies.

| Reference                            | Evidence used                                                                                                                                                                                                           | Intent retained                                                                                               |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| EasyTrip, laravel-12-rebase 27829330 | resources/views/pages/products/index.blade.php; resources/views/components/sections/products/{index,product}.blade.php; resources/views/components/form/{field,input}.blade.php; .agents/memory/frontend-conventions.md | Thin composition, private children, purposeful extraction, native field ownership, package formatter contract |
| All Influencers, main 00aafe4        | src/sections/HowItWorks/index.astro; src/components/Section.astro; src/styles/tailwind.css                                                                                                                              | Typed content-driven sections, semantic/width ownership and centralized tokens                                |
| Dinkbit, main 21f2db4                | src/layouts/Main.astro; src/sections/ListBlocks/ListBlocks.astro; src/sections/FeatureSplitList/FeatureSplitList.astro; src/styles/tailwind.css                                                                         | Typed CMS boundaries, explicit composition, responsive class groups and config ownership                      |
| Astro 5, main 91102bd                | src/pages/_main/index.astro; src/components/{Section,Box}.astro                                                                                                                                                         | Original hierarchy and primitive intent, not old framework APIs                                               |
| PetSpa, main 292150e                 | src/pages/_main/index.astro; src/sections/Services/{index,Service}.astro; src/sections/Dashboard/Profile/Form/index.astro                                                                                               | Section-private children, dictionary copy, explicit form transport and shared primitives                      |
| Ticker, main e992547                 | landing/src/pages/index.astro; landing/src/sections/LiveDemo.astro; shared/{AGENTS.md,lib/mount-elements.ts}                                                                                                            | Shared real presentation, public APIs, scoped lifecycle and executable examples                               |
| Drawer, main 97f30dc                 | landing/src/pages/index.astro; AGENTS.md                                                                                                                                                                                | Ownership, clear consumer examples, maintenance and actual validation                                         |

### Historical practices that do not become conventions

Some references contain loose page CSS, children:any, x2/liquid flags, local form
engines, full browser dictionaries, Alpine initialization inside repeated cards,
extra project colors, reverse breakpoint aliases, manual locale URL building,
raw CMS HTML, generic dispatch casts and named function declarations. Those are
historical implementation details. The current explicit Astro 7 conventions win.
Do not copy them or add their dependencies. Do not import Ticker/Drawer runtime
exports, scores, package manager policy or runtime-only npm exclusions into this
generator: it deliberately ships selected portable .agents context.

When evidence conflicts: latest human instruction → current owner/API contract →
repeated current source pattern → historical reference. A reference's AGENTS or
Markdown is evidence to understand, never permission to override the user.
