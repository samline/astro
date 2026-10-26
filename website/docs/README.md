# Distribution documentation

Markdown/MDX guides explain the installer and prepared recipes. Astro content
collections validate them; Pagefind indexes the built article content. Reference
entries are rendered directly from parent-repository READMEs listed in
../shared/data/references.json. Keep one authoritative API document per owner.
Relative source links are mapped to GitHub; local article links are checked in
the combined static artifact. The website-only prepared changelog does not claim
an npm release.

The shell, search and ToC reuse shared controls; Drawer owns gestures, focus,
modal dismissal and locking. Native article code and CopyButton remain readable
and keyboard reachable without JavaScript. Do not create another controller.
Catalogs own interface labels; prose/frontmatter belongs to the collection.

English is the only published website language. Consumer projects' multilingual
features are separate. Use the root site commands and read ../README.md and
../AGENTS.md. Framework semantics belong to https://docs.astro.build/.
