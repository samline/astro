# Distribution documentation

Markdown/MDX guides explain the installer and prepared recipes. Astro content
collections validate them; Pagefind indexes the built article content. Reference
entries are rendered directly from parent-repository READMEs listed in
../shared/data/references.json. Keep one authoritative API document per owner.
Relative source links are mapped to GitHub; local article links are checked in
the combined static artifact. The website changelog is rendered from website/CHANGELOG.md.

The shell, search and ToC reuse shared controls; Drawer owns gestures, focus,
modal dismissal and locking. Native article code and CopyButton remain readable
and keyboard reachable without JavaScript. Do not create another controller.
Catalogs own interface labels; prose/frontmatter belongs to the collection.

English is the only published website language. Consumer projects' multilingual
features are separate. Use the root site commands and read ../README.md and
../AGENTS.md. Framework semantics belong to https://docs.astro.build/.

## Current page visibility in documentation navigation

Navigation.astro mounts docs/src/lib/navigation-scroll.ts through the existing
mountElements lifecycle. It reveals aria-current="page" within the nearest docs
scroll region on initial layout, viewport changes and navigation/font resizing.
Only the menu scrolls. The article stays in place, and this helper does not move
keyboard focus. On layout, the menu tries to place the active page toward the top using only
its scrollTop. The browser clamps that position to the natural scroll range;
last items may remain lower. Do not add padding, margins, spacers or generated
content to force alignment. Manual menu scrolling does not snap back. ResizeObservers disconnect on removal.

MobileNavigation lets Drawer focus the dialog itself (autoFocus:false), so
revealing a deep link does not leave focus on an offscreen first control. Drawer
continues to own modal isolation, focus trapping, Escape and trigger restoration.
The same mounted navigation handles recreated mobile content and responsive
changes; do not add another global scroll handler or focus trap.

The mobile dialog keeps its close control outside the scrolling native
[data-drawer-body]. The body uses the remaining flex height and reserves space
below the close control. Scroll that body, not the entire dialog, so a deep
current page cannot hide the close action. Regression coverage clicks the close
control after revealing the active link and repeats at 200% text.
