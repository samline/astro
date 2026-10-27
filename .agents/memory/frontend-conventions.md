# Frontend conventions

Read alongside AGENTS.md and engineering-contract.md for UI ownership,
styling, lifecycle and developer examples.

## Vocabulary for design analysis

Use these definitions when evaluating a design and inventorying its blocks and
components. They describe responsibilities, not just file extensions: an Astro
component file can implement a layout, a section or a smaller UI component.

- **Page:** composes one route's view through a layout and ordered sections. It
  owns route/data logic and metadata; its entry stays focused on composition.
- **Layout:** the shared document structure, including the head, common
  navigation/footer and the place where page content is rendered. It owns the
  unique main landmark and provides slots for appropriate shared chrome.
- **Section or block:** a complete content or application unit with a recognizable
  purpose, such as Hero, Services, Testimonials or Contact. It composes content
  and smaller components to serve that purpose. A different background, color,
  spacing or viewport boundary alone does not establish a new section. A section
  may be reused across pages without becoming a lower-level component.
- **Reusable component:** a UI piece with a clear responsibility and a deliberate
  API that supports use across sections or layouts. Examples include Button,
  Card and Accordion. It can be static or interactive; JavaScript, visual size
  and repeated appearance are not requirements for being a component. Reuse must
  have a credible purpose rather than speculative props for unknown consumers.
- **Section-private component:** a piece worth extracting for meaningful
  structure, repetition, behavior or lifecycle whose responsibility depends on
  its section. Keep it inside that section's folder. Repeated cards inside one
  block do not automatically belong in the reusable component catalog.
- **Internal element:** a heading, paragraph, icon or container that can remain
  in the owning markup. Not every visible element needs a new component; use an
  existing primitive where appropriate and justify any additional extraction.

A design block does not automatically require an HTML `<section>` element.
Choose semantics from the content and document hierarchy. The existing `Section`
primitive supplies section semantics and vertical rhythm; `Box` supplies width
and gutters. Neither replaces the domain block that composes its actual content.
Shared header/footer chrome retains its layout-slot ownership.

## Turn a design into an inventory

Identify the page structure and complete blocks first, then inspect their child
pieces. Name each block by its purpose, describe its responsibility and preserve
the hierarchy. Review existing sections, components, slots and variants before
proposing new files. Distinguish an existing piece to reuse/adapt from a new
extraction, and justify why each extracted piece deserves its own owner.

For each proposed piece, record its name, classification, responsibility,
contained/reused pieces and proposed location. Include its parent when the
relationship is not obvious. Classify shared UI by responsibility and API rather
than appearance alone: two similar cards can have different owners, while the
same component may support visual variants through the existing styling system.

Illustrative inventory, not a declaration of installed features:

| Piece       | Classification     | Responsibility             | Contains or reuses                 | Proposed location                         |
| ----------- | ------------------ | -------------------------- | ---------------------------------- | ----------------------------------------- |
| Services    | Section            | Present available services | ServiceCard, existing H and Button | `src/sections/Services/index.astro`       |
| ServiceCard | Section-private    | Present one service        | Icon, heading and description      | `src/sections/Services/ServiceCard.astro` |
| Button      | Reusable component | Act or navigate            | Label and optional icon            | Existing `src/components/Button/`         |

Mark behavior, states, responsive changes or reuse that cannot be confirmed from
the supplied design as assumptions or unresolved details. A screenshot alone does
not establish a carousel, accordion, backend or interaction contract. An inventory
request produces an analysis; it does not itself authorize implementing every
proposed piece.

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
utility strings by purpose in a `class:list` array rather than one long `class`
string. Separate layout/display, dimensions/spacing, typography, color/decoration
and interaction/motion into readable entries as applicable; keep responsive/state
variants with their relevant group. Use complete literal utility names, object
entries for conditional classes and a separate entry for the caller's class.
Do not synthesize partial utility names or assume array order resolves conflicting
utilities. Even a single static class can use `class:list={['component-root']}`.
Use scoped component CSS when it expresses owned behavior/layout more clearly;
do not scatter new config variables into TypeScript or the document head.
The package website has its own approved shared theme; do not overwrite it with
the starter palette or mix its primitives into generated consumer source.

Use rem for authored fixed lengths and unitless zero. Use logical properties
where appropriate. Preserve approved Box widths, gutters, tokens and font loading.
Responsive changes follow the content: grids/flex may change shape, headings and
controls wrap, code scrolls in its own region. Test 320–1440, both themes and 200%
text. Never hide document overflow or shrink the typography to mask a problem.
Keep keyboard focus visible, native semantics, reduced-motion paths and readable
no-JavaScript content. The current base does not include a SkipLink component.

Keep owned `<style>` and processed `<script>` blocks in the `.astro` component
that needs them, alongside its markup. Extract substantial or genuinely shared
logic/styles into supporting files in the owning feature folder and import them
there. Do not add empty blocks to static primitives. Shared theme tokens and
document-wide responsibilities retain their existing owners. Use global styles
or inline scripts only when the integration actually requires that boundary.
Astro scopes component CSS, but a processed script does not automatically scope
its DOM queries or execute separately for every rendered instance.

## Behavior belongs to the instance

Author arrows, closures and direct calls. Avoid classes and this unless a real
external API requires a documented exception. Scope queries to the owning root;
keep repeated instances independent. Initialization must be idempotent; cleanup
releases exactly the listeners, observers, requests, timers and controllers owned
by the instance. Preserve persisted pagehide behavior where needed. Do not
initialize a global framework from every child or copy another package's mount
helper merely because it exists in a reference project.

Use a small setup function per root with state held in its closure and explicit
cleanup. Repeated setup on an already mounted root must not duplicate listeners,
observers, timers, DOM or package controllers. Repeated cleanup must be harmless;
after cleanup, a supported remount must create a fresh working instance. Keep
the exact controller returned by a package and destroy that owner directly.
Cleanup also restores application-owned state such as `aria-expanded`; do not
assume a package's destroy method emits the application's state callbacks.

Use the owner's existing lifecycle for inserted/removed DOM and Astro navigation;
register shared lifecycle hooks once. Where dynamic mounting applies, handle
removal and reinsertion in the same mutation batch, releasing old side effects
before setup runs again. Preserve controllers on persisted `pagehide` when needed
for back/forward restoration; dispose on real departure. Abort owned listeners
and pending work where possible, clear timers and observers, and prevent late
async completions from updating a disposed or replacement instance. Verify
independent instances, repeated mount/cleanup and supported remount paths when
changing interactive behavior. Use the existing lifecycle owner instead of introducing a parallel mount helper.

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
