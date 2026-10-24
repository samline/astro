# API Live Loader

`apiLiveLoader` is an Astro integration, not a standalone utility package. The
existing postsLiveLoader uses it. There is no default registration, cache, fetch
on import, global request/session state or mutation of a build-time content store.
Enable live.config.ts.example only with an adapter and an on-demand consumer.

## Contract

| Option         | Purpose                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| name           | Nonempty loader name.                                                                                                   |
| inputSchema    | Zod schema for each upstream record; receives unknown values.                                                           |
| schema         | Zod schema for the mapped local data.                                                                                   |
| id             | Derives a stable nonempty string ID from validated upstream data.                                                       |
| map            | Maps validated upstream data to the local schema.                                                                       |
| loadCollection | Async source callback receiving Astro's collection/filter context. Returns an array of unknown records; empty is valid. |
| loadEntry      | Async source callback receiving Astro's entry/filter context. Returns one unknown record or undefined for missing.      |
| errors         | Optional safe collection/entry diagnostic messages; never provider response bodies.                                     |

Source callbacks own the API contract, endpoint and pagination. The factory
validates and maps; it does not infer response envelopes. Input/output schemas
and mapping are synchronous. All collection entries must validate, IDs must be
unique, and a single returned ID must equal the requested filter.id. Do not use
randomUUID for an existing record or swallow upstream errors as empty arrays.

## Configure another collection

Define sourceSchema and localSchema beside the collection, using astro/zod.
Then adapt the actual trusted API implementation:

```ts
import { apiLiveLoader } from '@/content/live/api'

export const loader = apiLiveLoader({
  name: 'project-records',
  inputSchema: sourceSchema,
  schema: localSchema,
  id: (record) => record.id,
  map: (record) => ({ title: record.name }),
  loadCollection: async ({ filter }) => api.list(filter),
  loadEntry: async ({ filter }) => api.get(filter.id)
})
```

The four optional type arguments are Source, Data, EntryFilter (extends
{id:string}) and CollectionFilter. Typically schemas and callbacks infer them;
use explicit filter types when a locale/category is part of the API contract.
The factory forwards both contexts unchanged. It never captures a user's Request
at module initialization. For private sources, resolve authorization per request
in trusted server code for both callbacks; avoid credentials in serializable
filter data or public collection config. Define caching/privacy policy explicitly
when the future project introduces authenticated data.

## Results and failures

A successful collection returns { entries }; a successful entry returns { id,
data }. Missing returns undefined. Transport errors, invalid input/output,
duplicate IDs and mismatched entry IDs return { error: Error } with a safe
message, without partial entries or leaked exception text. Consumers must check
error and render translated feedback from their dictionary. A valid empty
collection remains distinct from failure.

The example post API uses stable upstream IDs, filters active locale/draft and
returns up to 100 items from one requested page. This factory does not pretend
that a page is a complete remote dataset. The separate Strapi build loader owns
its bounded pagination and atomic snapshot validation.
