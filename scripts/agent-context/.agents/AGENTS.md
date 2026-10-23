# Project conventions

## Tools and deployment

Install dependencies with {{INSTALL}} install. Run scripts with {{RUN}} run;
use package.json as the source of truth for the actual runtime commands.
The selected runtime is {{RUNTIME}} and the deployment target is {{DEPLOYMENT}}.
Never silently install global tools or assume a different package manager.

Use {{RUN}} run verify before delivering source changes. Start development with
{{RUN}} run dev; manage the background server with {{RUN}} run astro dev status,
logs, or stop. The configured Cloudflare profile runs Astro through Node even
when Bun launches the scripts; preserve that compatibility setting.

Keep output static unless the project explicitly needs SSR. {{ISLANDS}}
Use the selected adapter and deployment files. Environment secrets belong in
ignored .env files or provider settings; document variable names in .env.example.

## UI ownership

Pages compose layout -> section -> reusable component. Main owns the document,
SEO, and unique main landmark. Pages contain routing/data logic, metadata, and
section composition rather than loose UI, styles, or browser scripts.

Section-specific pieces live inside src/sections/<Name>. Each reusable component
owns src/components/<Name> with its README and supporting files. Single-entry
components use index.astro; related Theme or GTM pieces share a feature folder.
Shared components do not import sections or layouts.

Section owns semantic sections, unique anchors, and vertical rhythm. Box owns
centered content width and gutters. Preserve their separate responsibilities.
Read each component's README before changing its public contract.

## JavaScript and TypeScript

Use arrow functions by default. Avoid classes and this in authored code; use
function only when an API requires its own arguments or another non-arrow behavior.
Prefer native HTML attributes, typed props, slots, and Astro APIs. Forward native
and Astro scope attributes, consume custom props, and avoid unrestricted any.

## Internationalization

All visitor-facing copy belongs in src/i18n/dictionaries, including metadata,
accessible labels, alt text, and client messages. Each locale has domain folders
with index.ts and types.ts. Locale indexes compose those domains. The en-us
contract is reexported by en-mx to avoid drift.

Default locale is en-us. En-mx is prepared but inactive and means English for
Mexico. Components read Astro.currentLocale directly; pass locale only across
isolated boundaries such as Server Islands that cannot infer the parent locale.
Use native astro:i18n URL helpers instead of a custom routing layer.

## Styling and components

Tailwind configuration and tokens live in src/styles/tailwind.css; global base
rules live in global.css. Use complete utility names and light:/dark: variants.
Keep theme-color aligned with the primary accent. Use rem for authored CSS lengths
and unitless zero, preserving intrinsic and library-required numeric dimensions.
Fonts are local Fontsource imports. Preserve focus indicators and reduced motion.

Keep ldrs in PageLoader so animations can be swapped easily. Keep its animation
import, registration, and tag together. Consent defers SDK and CSS by interaction;
analytics and advertising permissions remain independent. Theme Init belongs in
the head, with reusable Switch controls wherever needed.

## Documentation and memory

Write developer docs and example comments in English. Keep component API docs next
to their implementation and update props, methods, events, and examples together.
Read and maintain this directory's project memory. Keep project-specific lessons
and todos accurate; do not invent backlog tasks or claim unperformed validation.

Reference documentation: https://docs.astro.build
