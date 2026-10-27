# Astro distribution website maintenance

Read ../AGENTS.md, README.md, REFERENCE.md, UPSTREAM.md and the affected app/shared
README before editing. This is a private pnpm workspace inside the repository;
install with pnpm, execute project scripts with Bun. Keep its toolchain separate
from the maintained starter at ../src. Do not add website source/dependencies to
the CLI archive or generated consumer projects. Preserve portable .agents.

## Editorial ownership

Document what @samline/astro actually generates and configures: installer,
recipes, defaults, local APIs and limits. Link to Astro's official docs for
framework behavior and to dependency docs for their APIs. Do not claim Astro
features as our inventions or imply official affiliation. References render
source READMEs listed in shared/data/references.json; update the owner instead
of duplicating prose. Guide articles and catalogs are English. All UI copy stays
in catalogs; article prose/frontmatter stays in the content collection.

Public npm commands are upcoming until publication is explicitly authorized.
Do not publish/deploy/push as part of a content update. The adapted distribution site is indexable. The human requested normal public
installation copy without pending-publication notices; do not reintroduce them. Unadapted templates use site.template=true. No automatic remove, upgrade or arbitrary-project
adoption is supported by the installer. Do not invent those commands.

## Approved design and curated packages

Preserve the package-landing-docs/Ticker reference, semantic tokens, Box widths,
fonts/licenses, shared component behavior, headings, spacing and responsive
rules. The website uses the existing approved Astro accent family with readable
light/dark variants. Local source scripts use arrow functions and closure state;
shared mountElements owns integration cleanup, and Drawer owns modal behavior.

The human requested a prominent personal-package section with Drawer, Ticker
and Forms only. Its catalog is landing/src/i18n/translations/en/packages.ts.
Keep real website links for Drawer/Ticker; Forms links to npm until its landing
is supplied. The illustrations are decorative, not package demos. Add packages
only when requested. Do not auto-discover, invent products or claim the links
are verified live merely because a local link check passed.

## Validation and distribution

From the repository root: bun run site:install, site:dev, site:verify and
site:preview. Site verification covers both apps, source conventions, real CLI
recipe execution, formatting, protected design source, combined links and browser
checks. Root bun run verify protects the starter and CLI package boundary. Keep
.gitignore, .npmignore and package.json files allowlists in agreement; inspect
the actual tarball, including .env.example and selected portable agent context.
Do not ignore source, docs, tests, source fonts/licenses or pnpm-lock.yaml.

The combined static output is landing/dist. The Pages workflow validates and
deploys every push to main and supports manual runs. Pages uses GitHub Actions;
website deployment is separate from npm publication. Dev uses two compilers on 4330/4331 with
owning-origin redirects; verify Home → Examples → Docs → Home. Never replace
this with an HTML-only proxy. Production uses one origin and base /astro/.

## PageSpeed performance contract

Performance is a shared site requirement for Home, Examples and Docs. Preserve readable content, the approved design, accessibility, keyboard controls and package behavior while optimizing. Use this section as the cross-site policy; app/shared contracts describe implementation ownership, and [README.md](README.md#performance-validation) records dated measurements and limitations.

### Goals and evidence

- For the adapted production site, aim for at least 95 mobile performance and 100 desktop, and 100 accessibility, best practices and SEO in PageSpeed. Template mode intentionally has noindex; do not remove it to chase SEO scores before adaptation is complete. These are engineering targets, not guaranteed scores or evidence of complete accessibility. Investigate metric regressions even when the overall score stays green; do not change the design merely to chase a perfect score.
- Track FCP, LCP, TBT, CLS and Speed Index separately. Aim for near-zero initialization CLS and TBT; prioritize visible content and responsiveness over diagnostic counts. Lighthouse TBT is not field INP. Missing field data means unknown real-user performance, not a Core Web Vitals pass.

### Loading and asset conventions

- Keep static content and syntax highlighting in generated HTML. Reuse Astro's processed, deduplicated scripts and existing shared components; avoid client hydration, third-party scripts and duplicate runtimes unless a concrete requirement justifies their loading cost. Keep Pagefind lazy and package animation/viewport behavior in the package owner.
- Fonts must come through shared Fonts: three local Latin WOFF2 faces, currently 96.4 KiB total, with `font-display: swap`. Preload only Inter and Instrument Serif for initial headings; do not preload every font or restore Google/Bunny stylesheets. Keep weights, character coverage, hashes, versions and licenses in shared/assets/fonts/README.md. Preserve the separate social-image TTF inputs. Recheck coverage when adding locales or weights.
- Both Astro configs use shared/lib/site-build.mjs. The current policy inlines CSS strictly below 40 KiB of uncompressed content and preserves Vite defaults for other assets. Inspect the emitted routes: a template's smaller Docs stylesheet may inline while a fully adapted documentation site needs larger cacheable CSS. Before changing the threshold, compare compressed HTML plus CSS transfer, blocking requests, cold mobile LCP and repeat/cross-route caching. Neither blanket inlining nor eliminating every external stylesheet is a goal.
- Emit highlighted code once. CopyButton reads live rendered source unless a command explicitly overrides it; never duplicate complete snippets in clipboard attributes, hidden markup or client state. Keep Shiki at build time, exact copying, final newlines and execution of complete/split examples.
- Keep hashed assets and valid base paths. Inspect actual response headers before diagnosing cache warnings. Cache TTLs are hosting observations, not application guarantees; verify the actual deployment. Do not add a service worker, caching proxy or hosting migration just to silence that audit without a separate requirement and evidence.

### Layout, initialization and motion

- Reserve control geometry before scripts run using inert plus visibility:hidden, as CopyButton and Tabs already do. Keep unavailable actions outside focus/accessibility until ready. Do not replace this with display:none or override native hidden on inactive panels. Preserve readable no-JavaScript content and test delayed-script dimensions after initialization changes.
- Finish initial tab and fragment selection before releasing inert. Initial selection must not animate. Limit interactive feedback to explicit color/background-color transitions on hover/focus, rather than the background shorthand; respect reduced motion.
- Use observer-provided geometry and batch layout reads before writes. Do not measure every Reveal block synchronously during mount or add per-item scroll listeners. Reveal uses the first IntersectionObserver snapshot, arms only offscreen blocks, anticipates entry by 64 CSS pixels and retains the 600ms fade. Initial viewport content must remain visible immediately; disconnect observers on reveal/removal.
- Prefer opacity/transform for entrance motion, with cleanup and reduced-motion alternatives. Avoid layout-property animation, blanket transition:all, persistent will-change on every item and new independent animation systems. The approved HeroBackdrop entrance lasts 4.8 seconds; if Speed Index is slow, inspect the filmstrip and trace before attributing the delay or changing that visual contract. Do not hide meaningful content to improve a score.
- Avoid unnecessary DOM and repeated generated content, while preserving readable originals, dependency-owned generated content, all examples and public fragments. Investigate long tasks and expensive measurements at their owner rather than bypassing runtime behavior. Preserve image dimensions/aspect ratios when adding media, and defer offscreen media rather than the initial LCP content.

### Measurement and completion workflow

1. Record the commit and dirty state, route, date, tool/browser versions, device, throttling and cache conditions. Build the production artifact; do not benchmark a dev server. Capture a baseline before editing. Measure Home, Examples and a representative Docs article separately when shared loading changes; Home's score cannot stand in for the gallery or docs.
2. Compare at least three cold mobile runs per before/after configuration using the same environment and median metrics. Avoid concurrent builds/tests during timing. Report compressed HTML/CSS/JS/font sizes and request changes alongside metrics; also inspect repeat navigation if caching changes. Keep raw reports locally, record reproducible conditions and summarized evidence in the owning README, and do not commit generated reports or machine-specific temporary paths as tooling.
3. Change a bounded cause, compare the result and retain it only with a justified tradeoff. Local HTTP Lighthouse and deployed HTTPS PageSpeed use different environments; never compare their scores as a controlled experiment. Label simulated and observed timings, lab and field data, single runs and medians. Report failed diagnostics as unverified, not passed. An upstream Lighthouse animation diagnostic failed internally; do not mark failed diagnostics as verified on a new project. Browser regressions and trace diagnostics are different evidence.
4. Review Home beside Examples and Docs. Run affected app checks and formatting, npm run verify, including both app checks, the combined build/link audit, adaptation builds and browser suites. Preserve e2e/upstream.spec.ts, e2e/reveal.spec.ts and related responsive, theme, enlarged-text, keyboard, no-JavaScript, copy and lifecycle coverage. Documentation-only edits need formatting/link review, not a new performance benchmark or full browser run.
5. After an authorized commit/push, confirm the deployment's exact head and successful publication, then verify the live artifact/assets before re-running PageSpeed mobile and desktop. A queued workflow or a local green build is not a published improvement. Check job logs, environment approvals, concurrency and GitHub Status when publication stalls; do not change application code or repeatedly restart workflows without evidence.

Ticker measurements belong to the upstream repository and are not a score for this template or another package. Preserve this contract when embedding the theme, merge it with project instructions and link the app/shared contracts to one policy. Record fresh evidence per adapted project; do not copy benchmark numbers or claim an untested deployment.
