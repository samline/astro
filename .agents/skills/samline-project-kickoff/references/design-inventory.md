# Design inventory contract

Read for design handoffs and revised deliveries. Adapt detail to the size of the
reference; a single supplied screen does not require a speculative site catalog.

## Three review passes

1. **Visual presentation:** enumerate accessible artboards/routes, review full
   pages and identify hierarchy, sections, copy, controls, media and repeated
   pieces. Capture significant sections and component variants. Mark illegible
   text rather than completing it from assumptions.
2. **Developer inspection:** inspect available dimensions, spacing, alignment,
   fonts, weights, colors, borders, radii, layers, exports and component states.
   Keep measured properties separate from proposed token normalization. Record
   unavailable inspection modes and missing mobile artboards explicitly.
3. **Interactive presentation:** follow hotspots, navigation, menus, tabs, cards,
   overlays and multi-step branches, including back/close paths. Record origin,
   trigger, result, return path and evidence. Do not send operational forms,
   messages or payments to explore. A dead hotspot does not prove final intent.

Use available connectors/browser tools or supplied exports. Report which pages,
viewports and modes were actually reviewed. Distinguish **observed**, **inferred**,
**proposed** and **unresolved** for both behavior and content.

## Evidence and records

Use .local/design-inventory (or the project's existing ignored evidence area).
Verify exclusion with Git before copying private material. Keep revisions under
revisions/<date-id>/ and an index pointing to the current one. Existing evidence
stays unchanged; create a new revision for a new delivery. Add these artifacts
when the available material warrants them:

- inventory.md and inventory.json with matching stable IDs.
- interaction-log.md with observed transitions and unresolved destinations.
- assets-manifest.json mapping delivered files to proposed project assets.
- open-questions.md and a coverage matrix, or equivalent inventory sections.
- index.html linking local screenshots by inventory ID, page and state.

Suggested screenshot names are section-home-hero-desktop-default.png and
component-header-mobile-open.png. Record the actual CSS viewport dimensions,
source artboard/URL, revision/date and whether the image is a crop, viewport or
full-page capture. Device labels alone do not establish measured viewport size.
Keep the gallery local, with relative links; do not embed private provider
responses, access tokens or executable snippets from a reference.

Minimum logical inventory fields (omit inapplicable fields with a reason):

```text
id, name, kind, page, order, source, revision, evidence[], copy,
structure, variants, observedProperties, proposedTokens,
interactions[], responsive, assets[], dataBoundary,
proposedOwner, analysisStatus, implementationStatus, questions[]
```

Kind distinguishes layout, section, component, content and state. Source records
the artboard/URL and inspection mode. Interactions include trigger, destination,
return path and evidence classification. Responsive distinguishes delivered
layouts from proposed adaptations. Data boundaries are static, build, runtime or
unknown, with real contract dependencies. Analysis and implementation statuses
remain independent. Include route/flow maps, reuse candidates and copy coverage
using those same IDs rather than duplicating their content.

## Assets and prior implementation

Inspect the entire delivery recursively. Identify photos, SVGs, logos, fonts,
icons, patterns, video, duplicates and versions. Preserve source names and paths;
record hashes, sizes and dimensions/viewBox when useful. Propose descriptive
kebab-case destinations. Keep asset discovery, import and actual UI consumption
as separate states. Identify provisional assets and missing approved material.

Use Astro image imports/optimization for appropriate editorial media; reserve
public paths for stable-URL requirements. Keep text and controls in HTML instead
of flattening a banner into an image. Separate photo, pattern, logo and crop;
avoid duplicating decorations already baked into an asset. A share icon is not
an Open Graph image. Legal copy and downloadable documents need approved sources.

When a prior site is authorized as reference, document route/content/link and
integration evidence without automatically migrating its code. Historical source
does not prove current production behavior. Use read-only source inspection or
an isolated checkout as appropriate, preserving the working site. Access to a
reference does not authorize extracting private credentials or provider exports.

## Handoff and revisions

Describe each proposed owner's responsibility, parent, reused pieces and source
location. Keep section-private children distinct from reusable APIs. List missing
assets, uncertain behavior and decisions that block the first implementation
stage. Prefer a bounded page/stage with dependencies and observable acceptance
criteria over a speculative whole-site build plan.

For each new delivery, compare stable IDs, copy, properties, flows and asset
hashes; identify additions/removals and mark affected implementation for
revalidation. Preserve historical evidence and point the index to the new
revision. Do not claim an inaccessible pass, provider response or unimplemented
revision is complete.
