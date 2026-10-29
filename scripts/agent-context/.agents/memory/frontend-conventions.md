# Frontend conventions

Use the current project's requirements and source as the starting point. These
inherited conventions describe ownership; adapt them when the project owner
explicitly changes the contract.

## Put code with its owner

- A page selects its layout, sections, route data and metadata. Keep content UI,
  styling and browser controllers in the owning section.
- The layout owns the document, head, main landmark and shared structural slots.
- A section owns a complete block and its private children. Keep those children
  in the section folder; extraction alone does not make them reusable.
- A reusable component owns its folder, public API, supporting files and English
  README. Components do not import sections or layouts.
- Section supplies semantics, anchors and vertical rhythm. Box supplies centered
  width and gutters. Neither is a generic styled card.

## Compose document and site chrome explicitly

When building or reshaping a site's chrome, preserve separate owners for Main,
Head, Header, Navigation, NavItems and Footer. A separate header file alone does
not satisfy this boundary if it contains every navigation mode and controller.

- Main assembles html/body, the unique main landmark, global mounts and named
  head/header/footer slots. Keep page-specific content in sections.
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
chrome stays outside main through the layout slots; do not move it into content
sections or the global reusable component catalog just to split files.

The compact generated starter currently keeps head assembly inside Main and
simple demo items inside Navigation. Treat those as starting implementations,
not a reason to grow a customized site's chrome into one file. These conventions
guide subsequent site work; they do not claim the seed already contains all of
the illustrative files, nor authorize an unrelated redesign or source update.

Before delivering a chrome change, inspect the actual imports and composition.
Verify one head/main, preserved SEO props and slots, shared typed item data,
active-link semantics and distinct desktop/mobile/no-JavaScript behavior. Moving
markup changes Astro CSS scope: check affected selectors, responsive styles,
Drawer focus/dismiss hooks, Ticker controls, reduced motion and owned cleanup.
Do not declare the decomposition complete solely because the build passes.

## Keep APIs small and explicit

Use native HTML, typed attributes and slots. Consume custom props before
forwarding native attributes, and preserve Astro scope attributes. Reuse existing
primitives before creating wrappers, barrels or alternate APIs. Use arrow
functions by default; use another form only when an actual API requires it.

Regular Astro components read Astro.currentLocale. Pass locale explicitly across
isolated requests such as Server Islands. Keep stable IDs and destination paths
separate from translated labels. Mark the active navigation link from the actual
route and set aria-current="page"; the home URL must not match every other route.

## Copy, data and styling

Every visitor string, including metadata, labels, errors and loading text, belongs
in typed locale/domain dictionaries. Each domain owns index.ts and types.ts.
API/CMS editorial data is validated at its boundary and rendered as content;
it is separate from reusable site UI. Resolve translated records through real
relationships instead of replacing a locale prefix on a slug.

Tailwind's configuration and visual tokens live in src/styles/tailwind.css.
Follow existing tokens, complete utility names and responsive variants. Use rem
for authored CSS lengths and unitless zero; preserve native asset dimensions and
library-required numeric values. Keep focus visible and respect reduced motion.
Document a token change when it also requires a concrete head theme-color value.

## Behavior and examples

Keep form state, validation and formatting in the selected Forms/Formatter
packages, rather than adding competing controllers. Keep section-specific
submission logic with the form. Browser code owns its listeners and cleanup,
works with multiple instances, and handles navigation without duplicate mounts.

A complete component example states its required feature, exact imports, owning
section path, dictionary keys, expected behavior and next step. Mark partial
snippets as partial. Installing an optional feature does not prove credentials,
provider connectivity, authorization or production behavior.

Update the owning README and persistent project memory as APIs or conventions
change. Verify the affected behavior using the project's actual scripts; report
what was checked and the remaining limits.

## Cards with variable-length content

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
