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
