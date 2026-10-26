# Content API Action examples

Maintainer examples of validated API reads and writes through Astro Actions.
They access an upstream API rather than modifying a Content Collection. They
remain unregistered in this repository and are not included by the installer's
basic Actions selection. Use that selection's `actions.basic` example when
starting a new form.

## Registration

After configuring an adapter and the [content API](../../server/content-api/README.md),
uncomment the contentDemo import in src/actions/index.ts and include it in server:

```ts
import { contact } from './contact'
import { contentDemo } from './content-demo'

export const server = { contact, contentDemo }
```

For static/Cloudflare projects the inactive entry remains index.ts.example.
Remove .example only after configuring a compatible server adapter. The content
HTTP client uses fetch and does not depend on SMTP, so Workers may register a
content-only server object after configuration; do not register contact unless
its mail transport is also compatible.

## Read

```ts
import { actions } from 'astro:actions'

const { data, error } = await actions.contentDemo.list({
  locale: 'en-us',
  page: 1
})
```

Input is JSON: locale defaults to en-us and must be enabled; page defaults to 1
and is bounded to 1..100. The validated result is { posts: ApiPost[] }. Invalid
input uses dictionary copy; failed upstream requests return a translated generic
INTERNAL_SERVER_ERROR. No private headers or raw upstream responses are returned.
This demo's reads are public when registered; apply authorization if data is private.

The browser-to-Action RPC always uses POST. The Action makes a GET to the source.
Do not reject an Action based on request.method !== 'GET', as the old example did.
There are no arbitrary endpoint, query object, header or host inputs.

## Write

```ts
const { data, error } = await actions.contentDemo.create({
  locale: 'en-us',
  title: titleFromValidatedForm
})
```

The title is trimmed, required and bounded to 200 characters. Unknown input keys
are stripped. Before any upstream request, canCreatePost in index.ts denies all
writes by default. Replace that function with the project's trusted server-side
session/role check; never grant access based on a browser boolean. The handler
also requires the browser Origin to match the Action's origin. Do not remove
authorization merely to make the demo appear to succeed.

An authorized request sends only title and locale as JSON. The response is
validated and returned as { post: ApiPost }. Failure returns translated errors,
without raw provider bodies, tokens, or the old loose success/data assumptions.
Add deployment-appropriate abuse limits before exposing a real write workflow.

No UI, CMS session system, generic HTTP proxy, challenge service, or automatic
rebuild is imposed by the example. Error state copy belongs in the content
dictionary. A successful write does not refresh SSG output: rebuild or consume
live content as documented in [collections](../../content/README.md).
