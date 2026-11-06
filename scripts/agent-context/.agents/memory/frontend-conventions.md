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

## Keep APIs small and explicit

Use native HTML, typed attributes and slots. Consume custom props before
forwarding native attributes, and preserve Astro scope attributes. Reuse existing
primitives before creating wrappers, barrels or alternate APIs. Use arrow
functions by default; use another form only when an actual API requires it.

Regular Astro components read Astro.currentLocale. Pass locale explicitly across
isolated requests such as Server Islands. Keep stable IDs and destination paths
separate from translated labels. Mark the active navigation link from the actual
route. Link's optional currentMatch supports exact and segment-bounded descendant
matching independently of appearance; exact pages use aria-current="page" and
ancestor locations use "location". Keep localized home roots exact-only and
preserve caller-supplied overrides. Reuse Link/current's pure resolver from an
existing browser owner when needed, without adding a global navigation manager.
Prefer the most specific current entry within one navigation set. Language
changes need an explicit equivalent destination, not just an active parent path.

## Copy, data and styling

Shared fields/errors/actions/navigation copy belongs to semantic dictionary
owners; page editorial text stays with its page. Reuse keys by meaning, not merely
matching words. Keep dictionaries statically inspectable for locale tooling.
For staged filters, URL state is applied and control state is draft. Use native
GET or existing form APIs; draft reset should not trigger unnecessary navigation
or erase unrelated workflow state. Read the installed Fields README if selected.

Before adding decoration, inspect the original artwork for embedded text/numbers.
Test real long labels and visible whitespace across styled fragments at 320px and
the actual configured breakpoint boundaries; do not assume an xs token exists.

Choose modal initial focus for its task without opening an unwanted text keyboard.
Keep focus containment and package-owned cleanup. Check close/Escape/backdrop and
nested focus return against actual scroll positions. A z-index cannot out-rank a
native top-layer dialog, and viewport simulation is not physical keyboard evidence.
For runtime images, follow src/assets/README.md and verify the built/deployed
endpoint separately from static build output.

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

## Verify the rendered result

Before calling UI work finished, check the rendered page at 320px and at each
configured breakpoint. Code that intends a result is not evidence of it.

- Contrast: body and placeholder text at least 4.5:1; large text and control
  boundaries at least 3:1, in every theme and state. On colored surfaces derive
  secondary text from that surface or the foreground, not a generic gray.
- Type: body measure about 65-75ch; at least a 1.25x size step between heading
  and body roles; letter-spacing no tighter than -0.04em; more space above a
  heading than below it; no justified body text.
- States: hover, focus-visible, active, disabled, loading, empty, error and
  success exist wherever the control or data can reach them, with dictionary
  copy. Controls name their action; errors name the problem and the recovery.
  An indicator inside a result area (a check, badge or color) must come from the
  real outcome, never sit there as decoration. Walk initial, empty, invalid,
  corrected and valid, and confirm indicator, message, field and result agree.
- Journeys: states are also visited in sequence, not only captured one by one.
  Switch mode and come back, repeat an action, close and reopen, and correct an
  input; then confirm controls, results, displayed code and links still agree.
- Widths: include the user's actual browser width and the sizes just around each
  point where columns change. No overflow is not the same as a comfortable,
  readable composition; judge density, not only fit.
- Content stress: the longest active locale, long names, single characters,
  large numbers, and empty or many-item lists neither overflow nor overlap.
  Use the dev pseudo-locale (PUBLIC_I18N_PSEUDO=true, see src/i18n/README.md)
  to lengthen every dictionary string and expose copy outside dictionaries.
- Browser surfaces: global.css themes selection, caret, native control accents,
  link underline offset and table numerals. Keep them aligned with token and
  dark-theme changes.
- Depth and motion: give an element a border or an offset shadow, not both by
  default; avoid zero-offset colored glows. Prefer one purposeful motion moment
  over identical entrances on every section, within reduced-motion rules.
- Fonts: the starter's Inter is a provisional default. Confirm the brand face
  before treating typography as final.

Captures are evidence only when labelled: record viewport, scroll position, mode
and state, open the file before sending it, and clear focus (the skip link) before
a composition capture. A capture artifact is not automatically a design defect.

A review verdict states its scope. Contract fidelity, working behavior and editorial
quality (copy, example usefulness, interaction polish) are separate judgments;
matching the direction does not mean finished. Without a quality reference, say
the verdict covers fidelity and behavior only, and do not present it as general
certification.

Run `check:design` for an advisory source scan of default decoration patterns:
gradient text, thick one-sided accent borders, zero-offset glows, pinging or
bouncing indicators, justified text and crushed tracking. Fix a finding or keep
a deliberate use with `design-ignore: <rule> <reason>` on the same or previous
line. It reads source text only; contrast, measure and states still need the
rendered checks above. `--strict` makes findings fail, for teams that want it.

Triage findings in order: broken tasks and inaccessible paths, missing states,
hierarchy/responsive/system drift, visual details, then cleanup. Fix drift at its
owner: add a missing token in tailwind.css, replace a one-off with the existing
component, and correct a local defect in place.

## Behavior and examples

Keep form state, validation and formatting in the selected Forms/Formatter
packages, rather than adding competing controllers. Keep section-specific
submission logic with the form. Browser code owns its listeners and cleanup,
works with multiple instances, and handles navigation without duplicate mounts.

A live demo states what capability it shows, what the visitor does, what result
to expect and which alternative cases are worth trying, including empty and
invalid input. It says which part is simulated and which real API runs.

Technical portfolio and product copy says what each tool does and when it is
useful. Replace slogans that fit any product with concrete explanations, without
inventing experience, benefits or results; facts stay in typed dictionaries.

A complete component example states its required feature, exact imports, owning
section path, dictionary keys, expected behavior and next step. Mark partial
snippets as partial. Installing an optional feature does not prove credentials,
provider connectivity, authorization or production behavior.

Update the owning README and persistent project memory as APIs or conventions
change. Verify the affected behavior using the project's actual scripts; report
what was checked and the remaining limits.

For incremental lists, keep server and browser-added items under one markup and
formatting owner. A native template can supply simple cloneable cards; preserve
scope attributes, unique IDs and accessible labels. Cloning does not copy event
listeners or mount client components. Use the owner's delegation/setup rather
than adding a duplicate string renderer or parallel fetch path.

Prefer native history/BFCache for list-detail returns. Add list-owned restoration
only when required: preserve stable item identity and allowlisted query context,
use bounded/expiring navigation intent with a storage fallback, reuse retained
DOM, limit replay work and allow cancellation/retry. Restore focus and scroll
without fighting user input. Do not introduce a global cache or invent filters.

## Cards with variable-length content

When a main card link represents the whole item, its owner may reflect that
link's focus-visible state on the card with :has(). Keep the link as the native
tab stop and preserve separate focus for secondary controls. Do not add wrapper
tabindex or nest interactive elements. Check outline clipping and contrast on
initial, appended, cloned and history-restored cards.

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
