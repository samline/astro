# Localized routes when integrating an API or CMS

Read this guide before connecting API/CMS content, adding translated slugs or
changing language navigation. It describes the integration contract to implement
in the consuming project; it is not an already installed route resolver.

## Current starter limitation

LanguagePicker accepts one locale-free `path` and applies it to every active
locale. SEO similarly accepts one `path` and `alternateLocales`. These APIs are
suitable only when the page exists at the same path in those locales. Neither
currently resolves translated slugs or checks that alternate pages exist.

Before rendering content with different paths or availability, adapt both
consumers to share actual equivalent destinations. Do not pass the current slug
to every locale or claim the current starter handles that case automatically.

Keep Astro routing and `astro:i18n` URL helpers. They format localized URLs using
project settings; they do not discover which API records are translations of
one another. No new router or automatic translation of slug text is required.

## Inspect the source contract first

When asked to consume an API, determine:

1. Which field identifies a translation group independently of language? Use the
   provider's documented localization relation, shared content key or explicit
   mapping. Record IDs may differ between translations. Never infer relationships
   from matching titles, similar slugs, array order or assumed shared IDs.
2. Which fields contain locale, slug or full route, publication state and access
   restrictions? Identify nested categories/parents and route segments too.
3. Can a content query include its published translations? Prefer that query to
   downloading every record or issuing one request per language. Otherwise use a
   bounded lookup by the explicit translation relation.
4. Are the consuming pages prerendered, rendered on demand, or browser-loaded?
   An API source alone does not imply SSR. Keep SSG unless requirements change it.

If there is no reliable relationship, document the missing API contract and ask
for that information. Do not fabricate equivalent destinations. A project may
add an explicit mapping when its provider lacks localization relations.

## Normalize destinations once

At the content boundary, validate provider data and produce a small, typed
representation such as this conceptual shape:

```ts
type LocalizedContentRoutes = {
  translationKey: string
  paths: Partial<Record<Locale, string>>
}
```

`Locale` comes from the project's i18n configuration. Each value is the complete
**locale-free site path**, including translated parent/category segments. For
example, one item might map en-us to `/articles/hello` and es-mx to
`/articulos/hola`. en-us is English and es-mx is Mexican Spanish. These example
paths are not routes shipped by the starter and do not activate another locale.

Only include configured active locales and published, accessible translations.
Reject duplicate locale entries for the same group, conflicting group identities,
invalid paths and ambiguous destinations. Validate API URLs before reducing them
to site paths: do not turn an external host or unsafe scheme into a navigation
link. For this same-site contract, reject protocol-relative paths, queries and
fragments; handle genuine cross-domain localization through an explicit separate
project policy. Encode raw slug segments exactly once when constructing paths.

Resolve once per page/data load, then share the result with navigation and SEO.
Components continue to infer their own current locale. Passing a set of known
content destinations is different from passing redundant locale props to every
component. Avoid a separate API request in each component or a global mutable
map shared across requests.

## Resolve at the correct time

| Consumer                           | Resolution and freshness                                                                                                                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static pages and local collections | Resolve from route definitions/translation groups during the build.                                                                                                                           |
| SSG pages using an API or CMS      | Fetch and validate the published snapshot at build time; generate paths and alternates from that same snapshot. Changes require a rebuild, optionally triggered by a CMS webhook.             |
| SSR or another on-demand route     | Query the requested item and its published translations during the request. Configure an adapter/on-demand route only when needed; this does not require converting the whole starter to SSR. |
| Live Collections                   | Resolve in the on-demand consumer using the current entry and its localization relationship. A live data source does not update previously generated static HTML.                             |
| Browser-loaded content             | Update the selector when the current content response arrives. Ignore/cancel stale responses after content or locale navigation. Keep credentials server-side.                                |

For SSR, apply the API client's existing timeout, validation and error policy.
If caching, include the content identity, locale, publication/access scope and
other relevant query dimensions in the key. Define a TTL or invalidation strategy;
do not share private response data in a public cache. A provider translation can
be deleted after resolution: no static snapshot or cache guarantees perpetual
availability.

For indexable content, render canonical and hreflang metadata in initial SSG/SSR
HTML. Browser-only updates to navigation do not substitute for that metadata.
A Server Island cannot retroactively replace the parent page's static head;
resolve metadata with the page or choose an on-demand page when required.

## Missing translations and request failures

Default to omitting a language option when its equivalent translation is absent,
unpublished or inaccessible. A project can explicitly offer that language's
listing/home as a fallback, but label it as such and never advertise it as the
article's equivalent in hreflang. Never guess a translated route by replacing the
locale prefix. Do not use HTTP probes for every generated language link.

Distinguish confirmed missing content from a provider error. Invalid/unavailable
build data should fail the build according to the loader policy, not publish a
silently empty translation snapshot. On demand, follow the page's documented
failure policy; omit unresolved alternates or return an appropriate error rather
than construct guessed URLs. Return a real 404 when the requested content is
confirmed missing. Keep all user-facing fallback/error copy in dictionaries.

Do not blindly carry pagination, filters, query strings or fragments into another
translation. Preserve only values with an explicit equivalent in the destination.
Changing language to an item with a different slug should still preserve its
translation-group identity.

## Navigation and SEO must agree

Use the same validated destinations for LanguagePicker, self/cross-language
hreflang and sitemap alternates where applicable. Compute each page's canonical
from its own actual route; another language's URL is an alternate, not its
canonical. Include x-default only under a defined policy with a real destination.
Do not treat a listing/home fallback as an equivalent translation.

Use Astro helpers to apply prefixes, base paths and trailing-slash configuration
to each destination's own locale-free path. The default locale may have no URL
prefix. Do not concatenate prefixes manually or localize an already resolved URL
again through Link; use `localize={false}` for those links.

## Verification when implementing this integration

Exercise the actual routes and rendered navigation/metadata:

- Same path across locales, different slugs, translated parent segments, and
  different record IDs linked to the same translation group.
- Default locale without a prefix, non-default locales and configured base paths.
- Missing/unpublished translations, duplicate locales, malformed paths, unsupported
  locales and provider failures.
- SSG destinations matching the paths generated from the same published snapshot;
  SSR destinations matching current public records and the cache policy.
- Navigation and hreflang agreement, correct self canonical, and no hreflang to
  a fallback listing or missing translation.
- Browser navigation races and allowed query/hash behavior when relevant.

Record the provider mapping, rendering mode, freshness policy, missing-translation
behavior and performed verification in the consuming project's `.agents` memory.
Do not claim the integration is complete based only on this guide.

Official references:
[Astro internationalization](https://docs.astro.build/en/guides/internationalization/),
[URL helpers](https://docs.astro.build/en/reference/modules/astro-i18n/),
[routing](https://docs.astro.build/en/guides/routing/).

## Parent query context for Server Islands

A Server Island's `Astro.url` describes its isolated endpoint, not the page that
contains it. Pass known route data and locale explicitly as props. On an SSG
page, visitor query parameters do not exist during frontmatter execution, so
passing `Astro.url.search` at build time cannot transport the visitor's filters.
Astro documents reading the island request's `Referer` for this case:
<https://docs.astro.build/en/guides/server-islands/#accessing-the-page-url-in-a-server-island>.

For a public listing, this frontmatter fragment resolves same-origin parent
context and a bounded, allowlisted filter. It must run inside the island:

```ts
const resolveParent = (referer: string | null, site: URL) => {
  if (!referer) return undefined
  try {
    const parent = new URL(referer)
    return parent.origin === site.origin ? parent : undefined
  } catch {
    return undefined
  }
}
const parent = resolveParent(Astro.request.headers.get('referer'), Astro.site!)
const name = parent?.searchParams.get('name')?.trim().slice(0, 100) ?? ''
// Query the real provider using only validated filters and the explicit locale.
// Referer-dependent HTML must not be shared under the island endpoint's URL.
Astro.response.headers.set('Cache-Control', 'private, no-store')
```

The production site's configured origin must match the parent origin. A preview
needs its own correct site configuration or a separately validated allowed
origin; do not accept arbitrary request headers as trusted origins. Referer is
optional and caller-controlled: it cannot authorize a user or resource. Validate
filter enums, numeric ranges and provider arguments independently.

Define the missing-context policy in the consuming product. An unfiltered
**public** listing is acceptable only when that is the agreed behavior; if an
explicit filter is required, show translated recovery feedback instead. Do not
silently return fixtures when a real provider fails. Referrer-Policy may remove
the path/query, and production delivery must be tested with filters, reload,
missing/malformed/foreign Referer and navigation between different queries.

Keep the returned island HTML private/no-store when it depends on Referer or
user context. A server-side data cache may separately use normalized locale and
all validated filter dimensions as its key. `Vary: Referer` alone is not a
portable substitute for an explicit CDN policy. If reliable context or shared
HTTP caching is required, use an explicit browser request carrying validated
filters to an owned endpoint, or a request-rendered page; define its cache key
and fallback there. Do not retrofit a second global query router into every
starter project.
