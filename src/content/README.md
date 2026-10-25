# Content collections

Astro 7 build-time collections are registered in src/content.config.ts. The base
enables only posts, a local JSON collection using astro/loaders glob and a Zod
schema from astro/zod. No external API, credentials, new page, or server runtime
is needed for that collection.

## Local posts and translations

posts/data contains one entry per locale. IDs come from relative filenames, for
example en-us/getting-started. Entries contain locale, copyKey, publishedAt, and
draft. Visitor-facing demo text lives in the content dictionary domain; copyKey
connects the entry to dictionary.content.posts. There is no duplicate UI copy in
JSON or hardcoded page markup. es-mx is prepared, but its routes remain disabled.

Collections can store inactive locales. Consumers must filter by the current
enabled locale and draft state. In a domain section's frontmatter:

```ts
import { getCollection } from 'astro:content'
import { getDictionary, resolveLocale } from '@/i18n'

const locale = resolveLocale(Astro.currentLocale)
const dictionary = getDictionary(locale)
const entries = await getCollection(
  'posts',
  ({ data }) => data.locale === locale && !data.draft
)
entries.sort(
  (a, b) =>
    b.data.publishedAt.getTime() - a.data.publishedAt.getTime() ||
    a.id.localeCompare(b.id)
)
const items = entries.map((entry) => ({
  id: entry.id,
  copy: dictionary.content.posts[entry.data.copyKey]
}))
```

Compose Main -> domain section -> reusable components. The example installs no
listing page or UI. Use getStaticPaths in a route to generate SSG detail pages
from the filtered entries; IDs are not automatically URLs and require an explicit
route design. Use getEntry('posts', 'en-us/getting-started') for a single entry.
There is no legacy entry.slug or entry.render() assumption. For future Markdown
collections, use a Markdown glob loader and render(entry) from astro:content;
the current JSON entries have no Markdown body to render.

## Optional build-time API examples

remote/index.ts defines apiPosts and strapiStores. Enable them by uncommenting
the import in src/content.config.ts and adding the chosen names to collections
(including the required commas). Configure CONTENT_API_URL and optionally
CONTENT_API_TOKEN in the build environment or ignored local .env files.
Remote loaders read these through Vite's loadEnv using the project root; they do
not depend on an Astro request or runtime secret bindings.

- apiPosts expects the normalized posts API documented in
  [the API client](../server/content-api/README.md). It loads page 1, up to 100
  public posts per enabled locale. Add provider-specific pagination if needed.
- strapiStores demonstrates Strapi 5's flat data entries with documentId, locale,
  name, and url. It requests published stores with explicit stable sorting and
  pageSize=100, and follows meta.pagination up to 100 pages per locale. It maps
  en-us to en-US and es-mx to es-MX for the CMS; adjust that mapping to the CMS's
  actual locale configuration. This is an example contract, not a universal
  adapter for every Strapi project.

Each loader uses locale/upstream-id as its entry ID, preserves deterministic
order, rejects duplicate IDs, and validates the full snapshot before clearing
the previous store. Remote errors fail the build instead of silently returning
an empty collection. Empty valid responses do clear the old snapshot. A failed
build must not be deployed. No partial dataset is intentionally published.

The shared request client checks HTTP status, JSON and schema, rejects credential
redirects, and times out after 10 seconds per request. It does not forward a token
to an arbitrary host supplied by a browser. Remote CMS text is incoming localized
editorial data; shared UI, empty/error states and local demo text stay in dictionaries.
Treat CMS text as text, not trusted HTML. Credentials must never become entry data.

## Optional live collection

Astro 7's stable Live Collections are separate from build-time collections.
live/index.ts provides the live loader with loadCollection and loadEntry. To enable it,
rename src/live.config.ts.example to src/live.config.ts and uncomment its import
and collection definition. Keep defineLiveCollection directly in live.config.ts;
Astro checks that location. Reusable loader logic stays in the feature folder. Configure an adapter and private runtime API settings.
The loader reads runtime secrets lazily; it does not fetch while defining config.

In an on-demand consumer or Server Island:

```ts
import { getLiveCollection, getLiveEntry } from 'astro:content'

const { entries, error } = await getLiveCollection('livePosts', { locale })
const single = await getLiveEntry('livePosts', { id, locale })
```

Check error before displaying entries. Translate visitor feedback through the
content dictionary rather than displaying loader diagnostics. loadEntry returns
undefined for a missing, wrong-locale or draft post. Errors remain distinguishable
from an empty valid collection. Only the requested locale's published data is
exposed. This demo fetches page 1 with up to 100 entries and sets no cache policy;
set an appropriate cache policy in the consumer for the real source.

Keep output static globally. Use server:defer or a route with prerender=false for
live data that must refresh per request. Pass locale explicitly across a Server
Island boundary. Pure static hosting cannot refresh a live collection at request
time. No experimental flag, custom virtual content module, or global SSR is added.

## Reusable API Live Loader

`live/api.ts` owns `apiLiveLoader`, a typed Astro LiveLoader factory. It separates
upstream input validation, mapping and local output validation, and is already
used by postsLiveLoader. See [its API](./live/README.md). A malformed item or
duplicate/mismatched ID fails the result rather than silently dropping records.

## Actions versus collections

The optional [content Actions](../actions/content-demo/README.md) read or write a
remote API at request time. Actions do not edit Astro's content store. Writing a
CMS does not update already built HTML or build-time collections: rebuild after
publication, or use live rendering where fresh data is required. A future CMS
webhook needs its own authentication; no webhook or mutation route is installed.

## Files and removal

posts owns the local schema/data; remote owns build loaders; live owns request-time
loading. Each directory has a collection definition entry, and reusable loader
logic stays beside it. Remove the posts registration, sample data and unused
content.posts dictionary entries when replacing the local demo in a real project.
Optional examples can be removed independently. Generated projects include all
these source files and this documentation.

References: [Content collections](https://docs.astro.build/en/guides/content-collections/),
[Content API](https://docs.astro.build/en/reference/modules/astro-content/),
[Loader API](https://docs.astro.build/en/reference/content-loader-reference/).
