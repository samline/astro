# Starter demo

This optional `welcome` integration shows how to assemble a small Astro site.
It includes a homepage, a `/demo` page, shared header/navigation and a footer.
Both pages use the same layout and primitives. Replace this presentation with
your own site as you build; it is a source example, not a separate UI framework.

## Where to edit

| File or folder                               | Responsibility                                     |
| -------------------------------------------- | -------------------------------------------------- |
| `src/pages/[...locale]/index.astro`          | Homepage routes and section composition            |
| `src/pages/[...locale]/demo.astro`           | Second page routes and section composition         |
| `src/layouts/Main.astro`                     | Document, metadata and the single main landmark    |
| `src/sections/DemoHeader/`                   | Header, localized navigation and optional controls |
| `src/sections/Welcome/`                      | Homepage content                                   |
| `src/sections/DemoPage/`                     | Second page content                                |
| `src/sections/DemoFooter/`                   | Footer content                                     |
| `src/i18n/dictionaries/<locale>/welcome/`    | Homepage, demo page and footer copy                |
| `src/i18n/dictionaries/<locale>/navigation/` | Navigation labels                                  |

## Assemble a page

The layout exposes named `header` and `footer` slots around its default content
slot. This keeps demo sections out of the layout itself and avoids adding them
to pages that do not use them. The homepage composes:

```astro
<Main path='/'>
  <DemoHeader slot='header' />
  <Welcome />
  <DemoFooter slot='footer' />
</Main>
```

The existing route supplies the imports and `getStaticPaths`. Start there instead
of copying this composition into a route without its frontmatter. Use the
adjacent section sources to see `Section`, `Box`, headings, links and buttons in
context. New pages should follow the same page → layout → section → component
composition.

## Navigation and languages

The header reads the current Astro locale itself. It uses native localized URL
helpers, and the current page's navigation link receives `aria-current="page"`.
The default language has no URL prefix; other active languages use their locale
prefix. Home and `/demo` have the same path in each language, so switching on the
second page keeps you on its translated equivalent.

This demo does not resolve translated API/CMS slugs. Before connecting those,
read `src/i18n/localized-content.md` and provide the actual translation mapping.

## Optional controls

On creation, the header includes Theme Switch only when `themes` is selected,
and LanguagePicker only when `language-picker` is selected. A single active
language needs no language list. The demo does not silently install either
feature. If you add a control later, import and place it in your header following
its own README; `add` does not rewrite customized sections.

## Adding the demo later

Run `npx @samline/astro add welcome` inside a compatible generated project after
the npm release is available. This adds the demo sections and `/demo` route,
then preserves your existing homepage. To use the demo homepage as well, review
the composition above and edit your route deliberately. Existing conflicting
files require review rather than being overwritten.

Existing layouts must expose one static `<slot name='header' />` and one static
`<slot name='footer' />` around their main content. If an older or customized
layout lacks them, `add welcome` stops before writing any files. Review and add
those slots explicitly before retrying; the installer does not rewrite a custom
document to guess the intended header/footer placement.

The interactive creation wizard selects this demo by default. `--minimal`
omits the demo files and their `welcome`/`navigation` dictionary domains.
