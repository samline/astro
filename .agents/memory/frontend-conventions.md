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
  unique main landmark and mounts shared header/navigation/footer by default.
  Named slots are reserved for exceptional overrides.
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
The layout imports and mounts shared header/footer chrome by default.

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

## Compose document and site chrome explicitly

When building or reshaping a site's chrome, preserve separate owners for Main,
Head, Header, Navigation, NavItems and Footer. A separate header file alone does
not satisfy this boundary if it contains every navigation mode and controller.

- Main assembles html/body, head, the unique main landmark and global mounts.
  It imports and renders the site's shared Header (including navigation) and
  Footer by default. Ordinary pages pass metadata and content sections only;
  never require repeated header/footer imports or mounts in every route.
  Keep named header/footer slots only for intentional exceptional overrides,
  with the common components as fallback content. A head slot adds page metadata;
  a separate body-end slot accepts exceptional trailing UI without replacing the
  footer. Mount genuinely global panels/widgets once in the layout; keep
  route-specific controllers with their route's section.
- A layout-private Head owns the document head assembly and reuses SEO and
  installed head integrations. Forward the existing SEO props and head slot;
  render exactly one head. Keep body mounts outside it.
- Header assembles its private parts. Navigation owns the nav landmark and list;
  NavItems renders typed navigation entries, sharing the same data across real
  desktop/mobile/fallback variants without duplicating route or action logic.
- Mobile navigation/Drawer and announcement/Ticker bars have their own private
  components when present. Keep their markup, styles and lifecycle together;
  retain package-owned behavior and the header's positioning controller.
- Footer remains a separate owner. Extract substantial forms, link groups or
  other distinct responsibilities when useful, not every paragraph or icon.

Keep these private files with their existing owner, for example
src/layouts/Main/Head.astro and src/sections/SiteHeader/{Navigation,NavItems,
MobileNavigation,AnnouncementBar}.astro. Names are illustrative; reuse equivalent
existing owners and do not create empty wrappers or speculative variants. Shared
chrome stays outside main and is mounted by the layout itself; do not move it
into page composition, content sections or the reusable component catalog just
to split files.

On creation with the welcome feature, Main renders DemoHeader and DemoFooter
by default, including on new routes and errors. Minimal output intentionally has
no demo chrome. Adding welcome later preserves the existing Main/homepage and
uses a dedicated Demo layout to own that feature's chrome overrides. An existing
site's layout must own its production chrome, independent of the optional demo.
The compact starter keeps head assembly inside Main and simple demo items inside
Navigation. Treat those as starting implementations,
not a reason to grow a customized site's chrome into one file. These conventions
guide subsequent site work; they do not claim the seed already contains all of
the illustrative files, nor authorize an unrelated redesign or source update.

Before delivering a chrome change, inspect the actual imports and composition.
Verify ordinary routes contain no repeated shared header/footer composition and
that calling the layout alone renders its complete shared structure. Also verify
one head/main/header/footer, preserved SEO props and slots, shared typed item data,
active-link semantics and distinct desktop/mobile/no-JavaScript behavior. Moving
markup changes Astro CSS scope: check affected selectors, responsive styles,
Drawer focus/dismiss hooks, Ticker controls, reduced motion and owned cleanup.
Do not declare the decomposition complete solely because the build passes.

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

Route matching is independent of a link's visual variant. Use Link's opt-in
currentMatch for exact or segment-bounded descendant matching; explicit
aria-current remains caller-owned. Reuse its pure currentDestination resolver in
an existing browser navigation owner when needed, without introducing a global
controller. Keep localized home roots exact-only. Select the most specific
current entry per navigation set and use real translation relationships for
language changes, rather than inferring them from the active parent route.

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

## Incremental lists and return navigation

When a list mixes server-rendered and browser-added items, keep one markup owner
and shared formatting. For simple DOM cards, a native template rendered by that
component can provide cloneable markup; fill validated data with textContent and
appropriate attributes. Preserve Astro-scoped attributes, unique IDs, labels and
media geometry. Cloning does not copy event listeners or initialize client
components: use the existing owner's delegation or explicit setup/cleanup.
Do not build a second string renderer or add another endpoint solely to duplicate
the same card. Choose the transport for the actual response and consumer needs.

Prefer native history/BFCache behavior for list-detail navigation. If a project
needs to reconstruct paginated results, keep the enhancement with that list.
Store only bounded navigation intent with stable item identity, an allowlisted
query context and expiry; handle unavailable storage. Reuse retained DOM before
fetching, bound replay requests/time, and provide cancellation and retry behavior.
Restore by identity before falling back to position, coordinate focus without
extra scroll, and do not override user interaction. This is not a base-wide cache
or a reason to rewrite canonical URLs or enable filters a project does not have.

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

## Cards with variable-length content

For a card whose main link represents the whole item, its owner may draw the
focus-visible outline around the card using :has() on that link. Preserve the
native link as the tab stop and keep secondary controls independently focused;
do not add tabindex to the wrapper or nest interactive elements. Check the
outline's contrast and clipping on initial, appended and cloned cards, including
focus restored after returning from a detail page.

Keep this layout with the section or its private card. Comparable cards start
with the editorial stack at the top; vertically centering a whole variable-length
caption misaligns its first rows. A grouped attribution/action can consume the
remaining space with margin-block-start:auto. For stacked media/caption layouts,
use an intrinsic media row plus a remaining-space content row:

```css
.content-card {
  display: grid;
  grid-template-rows: auto 1fr;
  min-inline-size: 0;
}
.content-card__media {
  aspect-ratio: 4 / 3;
  overflow: clip;
  border-radius: var(--radius-card, 0.75rem);
}
.content-card__media img {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}
.content-card__caption {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
.content-card__attribution {
  margin-block-start: auto;
}
```

Partial CSS recipe: apply these classes to the owning card's media wrapper,
caption and attribution group. The parent grid/carousel establishes comparable
card heights. Preserve the existing crop/radius tokens and reserve media geometry
with intrinsic image dimensions or aspect-ratio. This recipe adds no global Card
component. Use text-wrap:balance selectively for editorial headings when useful.
Do not force fixed text heights, arbitrary minimum heights, line clamping or
shorter translated/provider text to conceal misalignment.

Review short/long headings and quotes, wrapped author/location, long button labels
and delayed provider content at 320, 390, 768 and 1440 CSS viewport widths. Check
starting rows, footer/action insets, image boundaries, keyboard focus, overflow
and 200% text zoom in both themes. For carousels also check the final-to-first
loop seam. Viewport dimensions are test inputs; authored fixed CSS lengths use
rem. Inputs and every text node do not need balanced wrapping.

## Optional reveal behavior

Reveal belongs to its section and stays opt-in. Natural HTML must remain visible
without JavaScript. Prepare only targets below the viewport on the first observer
report; initially visible or already-passed content stays natural. Use natural →
pending offscreen → playing → revealed, once per element, with no default delay
or stagger. A restrained starting point is opacity plus individual translate,
0.75rem over 600ms, starting 4rem before intersection.

Give each animated property one owner. Do not reveal ticker tracks,
Drawer-controlled panels, parallax targets or nested reveal ancestors with a
competing transform. Focus/hash navigation reveals immediately; reduced motion
exposes pending content and cancels playback even when changed mid-animation.
Restore natural styles and dispose owned observers/effects/listeners on
navigation/HMR; deliberately preserve BFCache state. Deferred Server Island
content needs an explicit mount/cleanup owner.

See the [complete section-owned reveal recipe](./reveal-recipe.md) and its
acceptance matrix before implementing this behavior.
