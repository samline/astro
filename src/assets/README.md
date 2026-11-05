# Images across build and request boundaries

Use Astro's `Image`, `Picture` and `getImage` APIs for media that needs Astro
optimization. Keep original imports as ImageMetadata; passing only `.src` loses
the imported dimensions/format contract. No additional image wrapper is installed.
An inline SVG or a deliberate untransformed public resource can use native HTML;
do not replace a failing optimization pipeline with manual derivatives as a fix.

## Imported and remote media

Put approved editorial originals under `src/assets` and import them from the
owning component. Use `public` when an unchanged stable URL is required. Before
using this section fragment, add the real `src/assets/editorial.jpg` and a typed
`media` domain with `editorialAlt` in each active locale:

```astro
---
import { Image } from 'astro:assets'
import photo from '@/assets/editorial.jpg'
import { getDictionary } from '@/i18n'
const { media } = getDictionary(Astro.currentLocale)
---

<Image src={photo} alt={media.editorialAlt} layout='constrained' />
```

Describe the actual image, or use empty alt for decorative media. Set widths/sizes
from the component's real layout. Reserve dimensions; prioritize actual initial
hero media and defer offscreen images. Do not mark every image eager/high priority.

Remote media needs known dimensions or a deliberate supported inference strategy.
Authorize only the observed public hosts/paths in Astro image configuration.
Validate provider data at its boundary; a remote host allowlist does not establish
publication, access rights or that an arbitrary URL is appropriate to fetch.

## When transformations happen

| Consumer                      | Resolution                                                          | Verification                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| SSG page                      | Imported images are processed during build.                         | Read the emitted asset and its dimensions/format, not just its HTML URL.                                         |
| On-demand page                | Image HTML and transformation URLs may be produced at request time. | Request the image endpoint from the built function and decode its body.                                          |
| Server Island                 | The island is a separate request.                                   | Render the island and then request its image URL; pass the parent locale for alt/copy.                           |
| Native template / cloned card | Astro renders the source markup; cloning runs no Astro code.        | Test both the initial template and the inserted instance. Preserve dimensions, srcset/sizes and accessible text. |

For browser-added provider cards, generate transformed URLs at the existing server
boundary with `getImage`. Return only public image data and fill the existing
template safely. Do not add another endpoint or string renderer merely to repeat
the card. If changing srcset candidates, update them together with src; stale
srcset can keep displaying the old image. `getImage` is a server/build API, not a
browser image processor. Use it for video posters where transformation is useful.

## Vercel profile

This distribution uses `vercel({ imageService: false })`: Vercel Image
Optimization is disabled, while Astro's Sharp service remains available. The
profile explicitly installs Sharp and externalizes it from the SSR bundle so the
adapter can trace its native dependencies. Other profiles do not receive that
Vercel-specific workaround; their adapter's image support must be checked on its
own terms. Do not switch every target to Sharp or disable optimization globally.

An SSG-only example cannot prove native dependencies are present in a Function.
The package regression test builds a generated Vercel project and executes its
relocated function for SSR and island image requests. It also checks an SSG asset
and template markup. That is a local host/runtime test, not a Linux deployment or
physical-browser certification. For deployment, also check the target platform's
Sharp/libvips files and real image responses, including footer/error and cloned
content. A missing runtime binary is not fixed by a successful build.

If a future adapter update changes the pipeline, reproduce the failure against
its emitted artifact before retaining or removing the externalization. Preserve
the selected manager and runtime; a native module must match the deployed OS,
architecture and runtime, rather than the developer machine's binaries.

## Social assets and design sources

Canonical identity and the serving origin of an image are separate choices.
SEO already accepts an absolute HTTP(S) `image.src`; use a verified public asset
origin when previews need different media from the canonical production site.
Do not infer that origin from an untrusted Host header or change canonicals to
repair a missing image. Local metadata assertions do not prove remote availability.
See [SEO](../components/SEO/README.md) for the existing API.

Inspect originals before adding numbers, text, logos or decoration: they may
already be part of an SVG/composite. Preserve real headings and actions in HTML.
Share art and favicons serve different purposes; derive icon geometry from an
appropriate original and retain reproducible inputs/settings rather than
enlarging a low-resolution export.

Official APIs: [Astro images](https://docs.astro.build/en/guides/images/),
[Vercel image configuration](https://docs.astro.build/en/guides/integrations-guide/vercel/#images).
