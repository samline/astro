# Visual source of truth

This theme derives from [samline/ticker](https://github.com/samline/ticker), commit `8a30c9ca8486953fdc2801f0ceff8b17d0cb5615`. If the design or behavior is unclear, inspect the original before rebuilding it. The local sibling is `../ticker/` when both repositories are in Packages.

Home, Examples and Docs must retain the original shapes, color hierarchy, typography, borders/radii, layout, gaps, hover/focus/motion and responsive conventions. Neutralizing content does not authorize redesigning a section. Adapt actual runtime integrations and package data without replacing the presentation.

`design-reference.json` maps extracted components to immutable source paths and records their style fingerprints. `npm run check:design` catches unreviewed stylesheet drift. For intentional design changes requested by the user, review the source side by side, document the exception and update its fingerprint. Do not automatically bless a failing fingerprint.

Reference groups: Hero/Section/Box and Main for page geometry; SectionHeading/FeatureCard/StepCard/RuntimeItem/RecipeCard/FaqItem/CallToAction for sections and effects; Header/MobileMenu/Footer for navigation; DemoStudio/DemoPanel/DemoFooter for real shared previews; shared Heading/PageTitle, CodeFrame/CodeFiles/CopyButton/Tabs, Theme and DrawerStyles for primitives.

Runtime-specific counter content is neutral scaffolding. It replaces the dependency-specific moving content inside the original demo frame, not the frame's design. Fonts retain their licenses and names. Package APIs, screenshots, claims and release history are not inherited from the source package.

The reference is the committed snapshot, not another agent's working tree. If Ticker has uncommitted changes, do not copy, modify or bless them as part of this theme. Consult the pinned commit with git show; review later committed improvements deliberately. The local font assets preserve Inter, Instrument Serif and JetBrains Mono, including their upstream licenses.

Accessibility-only deviations: Surface allows long placeholder copy to wrap; mobile footer columns adapt to their text size so 200% text does not overflow. Code blocks are named focusable groups, rather than repeated page landmarks. Default shapes, spacing and palette remain those of the pinned source.

The current reviewed revision supersedes c74ec91. UPSTREAM.md records all four reviewed commits, applicability and regression coverage. The gallery additionally colocates the original compact recipe frame styles around its neutral recipe; its presentation matches the updated source composition. Style fingerprints also cover Fonts and the shared mount/build policies.

Docs Header scopes its GitHub visibility under .header so shared Button style emission order cannot override the mobile hidden state when route CSS inlines. Computed intended visibility is unchanged. Font licenses are copied separately into font-licenses/; old TTF notices remain alongside the social inputs.

ThemeToggle likewise uses its root context for button geometry, preserving the original zero padding and icon size when Button CSS inlines later. The computed icon was 6 CSS pixels wide before this correction; the intended 1.125rem width/height is covered in all three routes.

## Adaptation review — Drawer lessons, 2026-10-19

Confirm a new package’s accent preference before branding when it was not supplied; inherited lavender is not approval. Record the source and both theme values in content-audit.json.themeReview. Release checks reject missing or mismatched theme review. Keep the full semantic accent family consistent; neutral backgrounds, typography, geometry and shared component ownership remain the Ticker reference.

A CSS fingerprint cannot validate markup, useful demos or content coverage. Preserve multi-scenario Home tabs, replace every neutral counter control, compose real previews through DemoStudio/Panel/Footer, and reuse those previews on all three destinations. Provide complete copied sources for each supported loading mode. Test the exact viewer output rather than synthesizing an ESM recipe from CDN during testing. Keep installation concise and link exhaustive preserved contracts separately. API navigation follows a useful learning order.

Development and production are separate checks: two Astro compilers cannot share ambiguous /src module URLs through an HTML-only proxy. Dev article links redirect to the Docs origin, while shared docs landingHref returns Home/Examples links to their own origin; production keeps the combined same-origin artifact. Review Home → Examples → Docs → Home in the browser and inspect for compilation overlays. Do not claim “all reviewed” from existing automated checks alone.

Reviewed accessibility exception: PageTitle now uses a minmax(0, 1fr) grid track and wraps long identifiers in its description. The complete Drawer article sweep exposed configureDrawer(options?) expanding its title children to about 434 CSS pixels at a 320 viewport with 200% root text. This fixes intrinsic sizing without clipping, smaller fonts or a new title scale. Only the PageTitle fingerprint was updated after source review; a browser regression exercises that input in both themes.

The same all-article sweep found the longer createDrawerController(options?) breadcrumb exceeding its mobile gutter at enlarged text. ArticleHeader now permits intrinsic wrapping on breadcrumb flex items and keeps API detail pages labeled as API material. The typography regression includes this breadcrumb; no clipping or font reduction was added.

## Astro distribution adaptation

The website is contained in website/ to preserve the working starter at the root.
The approved Astro accent family replaces the neutral lavender through the
existing semantic theme generator; light #3245ff and dark #9aa4ff preserve
readable contrast. Home, Examples and Docs retain the template's neutral
geometry, local fonts, Hero, headings, controls and code frames. Counter-only
Playground selectors were removed after replacing the neutral counter with
real CLI recipe tabs. The source-backed API articles remain plain references;
no irrelevant browser-framework or CDN examples are published.

The human requested a new personal-package section. Its three decorative
illustrations identify Drawer, Ticker and Forms within the existing card, type
and token system. They do not duplicate package runtimes or pretend to be demos.
Forms deliberately links to npm until a real website is provided.

Formatting baseline: protected upstream source was formatted in memory with
the website Prettier configuration and compared to the adaptation. Fingerprints
now preserve the original upstream hash as upstreamStyleSha256 and validate
that normalized baseline. This accounts for formatter punctuation/spacing,
not a change to dimensions, colors or composition. All protected styles matched
the formatted source except the explicitly documented counter-selector cleanup.

Local responsive review found version/license metadata overflowing the footer by
one CSS pixel at 320 with 200% root text, and the inherited small-screen runtime
label column left too little room for longer capability copy. Footer metadata
now wraps; mobile RuntimeItem stacks its text; Hero descriptions permit long-word
wrapping. The new CLI panels omit redundant inner padding. These are bounded
readability changes, not a redesign of desktop geometry. The human had explicitly
removed SkipLink from the base; the adaptation also omits its inherited links.
The main/navigation landmarks and all native focus behavior remain in place.

## Clarity audit

Overview SVG meanings now match selection, composition, later additions,
languages, tooling and Astro ownership. No icon dependency was introduced.
The new shared RecipePanel explains run location, prerequisites, one executable
command, expected result and next steps; file trees are read-only disclosures.
Home/Docs use tabs for alternatives; Examples shows each distinct task directly.
The three gallery links now map to those actual tasks. The Hero visibly states
that npm publication is pending. Existing typography, Box widths, neutral palette
and component behavior remain owned by the inherited theme.

## 2026-10-26 editorial review

Display name is Astro and package identity is @samline/astro. Landing, Examples
and Docs use concrete task descriptions and source-backed reference summaries.
Getting Started now links its command-reference label to the command reference,
and the run step avoids repeating dependency installation after normal creation.
These are content/link corrections; no additional protected CSS changes.

## Personal package polish and command choices

The user requested cleaner package illustrations and aligned arrows. Packages
now uses one external-link SVG alongside the CTA, a restrained window toolbar
for Drawer, dot-separated Ticker tracks and a labeled Forms confirmation. The
existing palette, card geometry and responsive composition remain. This custom
section is not an upstream protected style. ToolCommands reuses the existing
Tabs/TabPanel/CodeFrame for npm, pnpm and Bun alternatives in guides and recipes;
no new client runtime or protected style replacement was introduced.
