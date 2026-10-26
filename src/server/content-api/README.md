# Content API client

This is the maintained repository's normalized REST example contract. Installer
Content selections generate a source-specific client beside the chosen collection
instead; follow that collection's README in the generated project.

Request-time server entry: getContentApi from @/server/content-api. Its
astro:env/server import protects runtime settings from browser imports. Configure
CONTENT_API_URL and optionally CONTENT_API_TOKEN as private runtime variables.
The URL includes any API base path, for example https://cms.example.com/api/.
No network request happens until a method is called. No extra dependency is needed.

client.ts is the pure request implementation, also used by build-time loaders.
It receives trusted server/build configuration explicitly, enabling local mock
tests without provider access. Do not import it into browser code with credentials.

## Normalized example contract

| Method                        | Upstream request                                       | Validated response                        |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------- |
| listPosts(locale, page=1)     | GET posts?locale=...&page=...&pageSize=100&draft=false | { data: ApiPost[] }, at most 100.         |
| getPost(id, locale)           | GET posts/:id?locale=...                               | { data: ApiPost }; 404 becomes undefined. |
| createPost({ title, locale }) | POST posts with JSON body                              | { data: ApiPost }.                        |

ApiPost has id (string or nonnegative integer normalized to string), title,
locale, and draft (defaults false). The schema strips unknown response fields.
Reads filter out drafts and other locales even if the server returns them.
Example envelopes accept an omitted success flag or success:true; success:false
fails validation even on HTTP 200. A valid empty data array is successful. HTTP
errors fail regardless of success flags inside their body.
Adapt this explicit contract to the real CMS. These normalized endpoints are
not an implicit Strapi API mapping. The Strapi build loader has its own schema.

requestJson(options, relativePath, schema, request?) provides reusable schema
validation for another trusted endpoint. options includes url, optional token and
an optional fetcher for tests. request supports GET/POST/PUT/PATCH/DELETE, string or repeated string-array query
parameters, an optional JSON body and a caller AbortSignal. GET rejects a body.
Body presence is explicit: false, zero, null and empty strings are serialized.
An HTTP 204 is parsed as undefined, so pass z.undefined() for that contract.
There is no implicit retry or transport-level success coercion;
there is no any-typed generic API relay or caller-supplied host/header proxy.

URLs require HTTPS except loopback HTTP for local development. Base credentials,
query strings and fragments are rejected. Paths must remain under the base;
absolute or parent traversal paths are rejected. Bearer auth is sent only to that
configured origin; redirects fail instead of forwarding credentials. Requests
use a 10-second timeout combined with caller cancellation, check status before
parsing, cap decoded response streams at 2 MiB, and validate unknown JSON
with Zod. Network failures, error bodies and schema details are not exposed to
visitors. HTTP errors carry only their numeric status for server-side handling.
No automatic write retries, disk access, or provider error logging is added.

The API's authentication and authorization remain provider responsibilities.
Configure a read-only token for public reads. Grant mutation privileges only to
trusted server code with real user authorization. A successful write affects
the upstream source, not a build-time Astro collection or previously generated HTML.

See [collections](../../content/README.md) and
[Action examples](../../actions/content-demo/README.md).

## Additional server operations

```ts
import { z } from 'astro/zod'
import { requestJson } from '@/server/content-api/client'

const updated = await requestJson(trustedOptions, 'records/42', recordSchema, {
  method: 'PATCH',
  body: { published: true },
  signal: request.signal
})
await requestJson(trustedOptions, 'records/42', z.undefined(), {
  method: 'DELETE'
})
```

These are transport capabilities, not new public mutation Actions. Authentication,
authorization, input schemas and same-origin/abuse policy belong at the actual
request boundary. `trustedOptions` is server/build-owned configuration; never
accept its destination or token from a browser payload. Request-specific tokens
must come from a verified server session and a fresh client instance, not global
mutable options shared between users. No auth provider or role model is imposed.

Pass query data through query, not embedded `?` or `#` in paths. Encoded path
separators are rejected. If your API returns HTTP 200 business failures, include
that contract explicitly in its Zod schema rather than converting every response
to an assumed { success, data[] } envelope. Singular objects remain objects and
no arbitrary nested map is guessed to be a collection. Do not return diagnostic
Error.message or provider bodies directly to the visitor.
