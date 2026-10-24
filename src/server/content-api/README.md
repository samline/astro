# Content API client

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
Adapt this explicit contract to the real CMS. These normalized endpoints are
not an implicit Strapi API mapping. The Strapi build loader has its own schema.

requestJson(options, relativePath, schema, request?) provides reusable schema
validation for another trusted endpoint. options includes url, optional token and
an optional fetcher for tests. request supports GET/POST, string query parameters
and JSON body. Unsupported HTTP contracts should be implemented deliberately;
there is no any-typed generic API relay or caller-supplied host/header proxy.

URLs require HTTPS except loopback HTTP for local development. Base credentials,
query strings and fragments are rejected. Paths must remain under the base;
absolute or parent traversal paths are rejected. Bearer auth is sent only to that
configured origin; redirects fail instead of forwarding credentials. Requests
use a 10-second timeout, check status before parsing, and validate unknown JSON
with Zod. Network failures, error bodies and schema details are not exposed to
visitors. HTTP errors carry only their numeric status for server-side handling.
No automatic write retries, disk access, or provider error logging is added.

The API's authentication and authorization remain provider responsibilities.
Configure a read-only token for public reads. Grant mutation privileges only to
trusted server code with real user authorization. A successful write affects
the upstream source, not a build-time Astro collection or previously generated HTML.

See [collections](../../content/README.md) and
[Action examples](../../actions/content-demo/README.md).
