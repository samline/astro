# Authentication

Optional Better Auth integration with a common session/authorization interface.
Better Auth is installed when selected, but `AUTH_MODE` defaults to `disabled`.
Route activation depends on the deployment; no login page, business roles or
account UI is imposed. Public
pages remain SSG. Authored visitor messages live in modular `auth` dictionaries.
The REST bridge is a Better Auth plugin with an explicit provider contract.

## Activation

1. Configure a server adapter (already present in the default Vercel profile).
2. The installer registers `[...all].ts` on compatible targets. If only
   `src/pages/api/auth/[...all].ts.example` exists, configure a compatible adapter
   and rename it to `[...all].ts`. Preserve `prerender = false` and the trusted
   client-address replacement. Never accept the browser's IP header as trusted.
3. Set `AUTH_MODE`, a random `AUTH_SECRET` of at least 32 characters, and
   `AUTH_URL` to the application's exact origin. `SITE_URL` is the origin fallback.
   Use HTTPS except on loopback for local development. Keep runtime secrets out
   of browser imports. Restart instances after changing runtime configuration.
4. Configure the selected identity mode below, then build and test it. Configure
   private pages individually with `export const prerender = false`; do not
   switch the entire site to SSR just to enable login.

```dotenv
AUTH_MODE=external
AUTH_URL=https://example.com
AUTH_SECRET=replace-with-a-random-secret
AUTH_API_URL=https://api.example.com/api/
# Optional service credential sent server-to-server as x-api-key.
AUTH_API_KEY=
```

Generate a secret, for example, with `openssl rand -base64 48`. The application
never generates or changes persistent secrets automatically. The configured
origin, not an incoming Host header, establishes the auth origin. Same-origin
Origin is required on HTTP mutations in every mode. Keep site and auth under
the same origin; cross-origin frontend auth is outside this starter contract.

## Identity modes

| Mode       | Identity authority                     | Local persistence                                                                                            |
| ---------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `disabled` | None                                   | None. No credential requests or database connections.                                                        |
| `external` | Configured REST API                    | No local user database. Better Auth JWE session cache plus a separate encrypted, HttpOnly credential cookie. |
| `database` | Better Auth and the project's database | PostgreSQL by default; `createAuthService` accepts other supported database adapters.                        |
| `oauth`    | OAuth2/OIDC provider                   | Stateless Better Auth session/account cookies; no configured local user database.                            |

`AUTH_SESSION_SECONDS` accepts 60..86400. Defaults are 900 seconds for REST/OAuth
and 3600 for database mode. REST sessions never extend beyond a provided upstream
`expires_at`. Do not confuse local session expiry with an upstream access-token
expiry or a refreshed user profile.

The generator includes only the selected provider settings module. Changing an
installed identity mode requires reviewing its source, dependencies and environment
together; changing AUTH_MODE alone does not install another provider or migrate
users. Check package.json samlineAstro.options for the initial selected mode.

### External REST

The default mapping in `remote.ts` uses these fixed, server-configured paths:

| Operation                | Request                                                         | Response                                                                   |
| ------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Login                    | POST `auth/login`, JSON `{ email, password }`                   | `{ success: true, data: { profile, token, expires_at?, refresh_token? } }` |
| Profile / current access | GET `auth/profile`, Bearer token                                | `{ success: true, data: profile }`                                         |
| Optional renewal         | POST configured path, Bearer token and JSON `{ refresh_token }` | Same envelope as login.                                                    |
| Optional revocation      | POST configured path, Bearer token and JSON `{}`                | HTTP success; 204 is accepted.                                             |

Override paths with `AUTH_API_LOGIN_PATH`, `AUTH_API_PROFILE_PATH`,
`AUTH_API_REFRESH_PATH` and `AUTH_API_LOGOUT_PATH`. Paths are relative to the fixed
API base. Renewal/revocation are **not assumed to exist** and stay disabled unless
configured. HTTPS (or loopback HTTP), no redirects, an eight-second timeout,
bounded 64 KiB JSON and schema validation apply. No credential request retries.

The profile mapping accepts `id`, `name`, `email`, optional `avatar.url`,
`emailVerified` (or `verified_at`), `roles` (or a single `role`) and `permissions`.
IDs normalize to strings. Missing roles/permissions become empty arrays: no
implicit administrator privilege. Business fields such as subscriptions are
not placed in the generic session. Dates in `expires_at` are ISO timestamps.

When an API differs, implement `IdentityProvider` in `types.ts` and connect it in
`settings.ts`; do not force unrelated provider responses into the default mapping.
The contract is `authenticate`, `profile`, optional `renew` and optional `revoke`.
All return values are validated before a session is trusted. Renewed/refetched
profiles must keep the same identity ID. Authentication/profile/renewal failures
must reject rather than produce an anonymous or privileged placeholder user.

The plugin establishes Better Auth cookies using its exported cookie API; it
does not insert shadow user rows. The upstream access/refresh credentials are
in a separate encrypted cookie bound to the local session ID and user ID. They
never enter public session JSON, HTML data attributes or localStorage. Individual
tokens are limited to 1024 characters and the encrypted credential payload to
3500 characters. Providers with larger tokens need an explicitly designed
server-side credential store; do not remove cookie bounds or truncate tokens.

Every new request that reads the authorized session verifies the upstream profile
again. A same-request WeakMap avoids duplicate calls, and no user/permission cache
is shared across requests. Remote 401 becomes unauthenticated; 403 denies access;
provider/network failures fail closed with a localized 503. Changing permissions
or revoking a token upstream therefore affects the next protected request.

A client cannot sign in by submitting a token alone or choose its own role. REST
mode exposes only its four intended HTTP endpoints; native signup/account-edit
endpoints are unavailable. `getAuth().auth` is the underlying Better Auth engine
for server integration work, not an alternative to the authorization facade.

### Database-owned users

```dotenv
AUTH_MODE=database
AUTH_URL=https://example.com
AUTH_SECRET=replace-with-a-random-secret
AUTH_DATABASE_URL=postgresql://user:password@localhost:5432/project
```

Run `auth:migrate` explicitly with the project's script runner before using the
schema. The command reads the project's environment using Vite, migrates the core
Better Auth tables and shared role/permission fields, and closes its pool. It is
never called by installation, build or the application. Use a dedicated database
and the provider's TLS settings; do not disable TLS verification. The command is
for the included PostgreSQL setup. If choosing an ORM, another adapter or plugins
that add tables, adapt the configuration and migrations together.

`config.ts` owns native email/password options. Signup is deliberately disabled:
choose provisioning, registration, verification and recovery behavior for the
actual project. To enable native registration, explicitly change
`emailAndPassword.disableSignUp` after configuring that project's account policy.
Use Better Auth's documented verification/reset callbacks for its mail workflows;
the starter does not invent a registration page or send account messages.

`schema.mjs` defines roles and permissions for runtime and migrations. Those fields
are `input: false`; signup/profile requests cannot grant them. Set them through
trusted server administration only. Database-mode authorization bypasses cookie
cache and reads current user/session data. No business-specific roles, admin
screens, subscription policies or universal superuser role are predefined.

### OAuth / OIDC

For an OIDC provider, configure `AUTH_MODE=oauth`, `AUTH_URL`, `AUTH_SECRET`,
`AUTH_OAUTH_DISCOVERY_URL`, `AUTH_OAUTH_CLIENT_ID` and optional
`AUTH_OAUTH_CLIENT_SECRET`. The provider ID is `identity`; register the callback
`https://example.com/api/auth/callback/identity` with that provider.

For plain OAuth2 such as a compatible Laravel Passport deployment, configure
`oauthProviders` in `config.ts` with the provider ID, client credentials and its
actual authorization, token and profile endpoints. Use server-only credential
reads; declare additional secrets in Astro's environment schema. Generic OAuth
supports explicit endpoints and provider-specific profile mapping. A REST login
or Sanctum token endpoint is not automatically an OAuth authorization server.

No automatic account linking by email is enabled. OAuth grants follow Better
Auth's provider flow and stateless lifecycle; REST's per-request profile lookup
does not automatically apply to OAuth. Map trusted roles/permissions explicitly
and define a provider revalidation policy when immediate permission/revocation
updates are required. Otherwise the local snapshot remains valid up to its TTL.
The public HTTP handler blocks provider-token export endpoints; use the underlying
server API only where a protected server integration actually requires it.

## Server API and permissions

The public entry is `src/server/auth/index.ts`:

- `getAuth()` lazily returns the configured service or null when disabled.
- `requestAuth(request, locale?)` creates a request-scoped authorization context.
- `canAccess(state, rule)` evaluates an already authoritative state; it never
  authenticates a request or validates arbitrary browser JSON.

The middleware installs the same context as `Astro.locals.auth` or
`context.locals.auth`. Context APIs:

| API                                  | Behavior                                                                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `getSession()`                       | Returns `{ user, session }` or null. Provider errors remain errors.                                                         |
| `requireSession()`                   | Returns the state or throws a translated Astro ActionError (401).                                                           |
| `requireAccess(rule)`                | Requires a session plus the requested permissions/roles/verification; otherwise 401/403.                                    |
| `withExternalToken(rule, operation)` | Requires access, then passes the private token to a server-only callback in REST mode. Never return that token to a client. |

A rule can require `permissions: ['posts:update']`, `roles: ['editor', 'admin']`
and/or `verified: true`. All listed permissions are required; any listed role
suffices. Different constraints combine with AND. No wildcard role or permission
is implied. Resource ownership/tenant checks still belong at the operation.
The external API must enforce authorization over its own resources too.

```ts
import { defineAction } from 'astro:actions'
import { requestAuth } from '@/server/auth'

export const update = defineAction({
  // Add the actual input schema for this operation.
  handler: async (_input, context) => {
    const state = await requestAuth(context.request).requireAccess({
      permissions: ['posts:update']
    })
    // Check resource ownership and perform this project's protected operation.
    return { userId: state.user.id }
  }
})
```

For REST API calls, use `withExternalToken` with a server-owned, fixed destination
and bounded request/schema handling. Return only explicitly public result data;
never turn it into a browser-controlled URL/header relay. Do not import the
server entry into browser scripts.

## Route policies

`src/config/auth.ts` starts with an empty `authRoutes` list. Add rules explicitly:

```ts
export const authRoutes = [
  { path: '/account', verified: true },
  { path: '/dashboard', permissions: ['dashboard:read'] },
  { path: '/dashboard/settings', permissions: ['settings:update'] }
]
```

Paths are locale-free. Rules match the path and its descendants at segment
boundaries; all matching parent/child rules apply. Unknown roles receive no
special access. Encoded separators are rejected; files/dotted routes and Actions
are not blanket exceptions. A protected prerendered page fails visibly: it must
opt out of prerendering. Authorized protected responses use private, no-store.

Optional `authLoginPath` must point to an existing sign-in page. Unauthenticated
GET page requests accepting HTML redirect there with a local `returnTo`; other
requests return 401. Validate `returnTo` as a same-origin local destination before
using it after login. Missing permission is 403, not a login redirect. Every
protected Action/endpoint must still enforce its own operation's rule: a page
policy is not a substitute for that guard.

## SSG and Server Islands

SSG pages can contain authenticated islands without exposing private HTML in the
public shell. Keep all private markup/data inside the deferred island and guard
inside its request. Never put protected values in the shell or unencrypted public
props. Pass the parent locale explicitly across the island boundary when needed.

```astro
---
// Inside the deferred island; props are supplied by its parent section.
import { requestAuth } from '@/server/auth'
import type { Locale } from '@/i18n/config'
interface Props {
  locale: Locale
}
const { locale } = Astro.props
const state = await requestAuth(Astro.request, locale).requireSession()
Astro.response.headers.set('Cache-Control', 'private, no-store')
---

<p>{state.user.name}</p>
```

This example requires a session; for a guest/error fallback, catch the expected
ActionError and render that section's translated state without protected data.
Use `requireAccess` for permission-specific content. Server Island endpoint URLs
are separate from the page URL, so a page route rule does not protect the island.
Set private/no-store on personalized island responses, including fallbacks.
The adapter must forward session cookies to the island request. Pure static
hosting without a backend cannot run this integration; adding an adapter does
not require converting public pages to SSR.

## Browser API and session lifecycle

`src/auth/client.ts` is the browser-safe entry, imported only by a consuming
section. `authClient` is the vanilla Better Auth client for native/OAuth modes.
For example, native mode uses `authClient.signIn.email(...)`; OAuth mode uses
`authClient.signIn.social({ provider: 'identity', callbackURL: '/account' })`.

REST mode exports:

- `signInExternal({ email, password })`
- `getExternalSession()` (fresh authorized profile, no upstream token)
- `refreshExternalSession()` (server-side renew, or profile refresh if no renewal
  operation is configured)
- `signOutExternal()` (clear local cookies and report `remoteRevoked`)

REST responses expose a string expiry timestamp; server state uses a Date.
Render errors using the dictionary for the current section, not arbitrary provider
messages. Build forms with the existing Fields/SAM Forms/SAM Formatter contracts.
No auth form UI, controller replacement or global browser session cache is added.

Call refresh before local/upstream expiration. It rotates the local cookie session
and updates profile data; the optional provider renew operation can rotate the
upstream credentials. A profile-only refresh cannot rescue an expired token.
Expired local sessions require a new login. Coordinate refresh across concurrent
submissions/tabs in the consuming app when its provider uses single-use renewal
credentials; the starter adds no automatic refresh loop.

### Profile updates without signing in again

In REST mode, save the profile through a protected Action calling the external
API, then call `refreshExternalSession()` to update the local session cookies.
The helper does not save profile changes upstream. `getExternalSession()` and
server `getSession()` reads also fetch the current profile, without rotating
the cookie snapshot. Refresh still requires valid local and upstream credentials.

In database mode, use the exported Better Auth client:

```ts
import { authClient } from '@/auth/client'

const { error } = await authClient.updateUser({
  name: 'Sam',
  image: 'https://example.com/avatar.webp'
})
```

Upload image files separately and pass the resulting URL. Handle `error` before
showing success. Database-mode guards read current user records on the next
request; no new login is required for these profile changes. The same-request
authorization context remains memoized.

Cookie/profile updates do not replace already rendered HTML. Update the affected
UI with fresh user data or request a new rendering of its personalized content.
OAuth has no generic profile synchronization helper here; configure its provider
policy separately rather than calling the REST-only refresh helper.

### Logout and revocation

REST logout calls upstream revocation only when configured. It always clears the
current browser's cookies and returns `remoteRevoked: true`, `false`, or null
(no operation configured). Without upstream revocation or a server-side session
store, a copied stateless cookie can remain usable until expiry. There is no
claim of immediate per-device/global local revocation in that mode. API-side
revocation is checked on the next protected request. Failed remote logout is not
reported as successful remote revocation.

Better Auth's limiter is enabled, but its in-memory buckets are per process.
Configure distributed rate limiting at the host or in Better Auth before using
multiple instances for a real credential flow. Database credentials, OAuth client
credentials, cookies and tokens must never be logged. No real provider, database,
mail workflow or production deployment is provisioned by the starter.

## Validation scope

Tests exercise actual Better Auth HTTP handlers, stateless sessions across
instances, encrypted credential binding, authorization freshness and token
revocation with a fake REST provider. Owned-user tests use a disposable SQLite
schema to exercise the real native flow, protected fields and session deletion;
that does not validate connectivity to your PostgreSQL service. A fake local
OAuth server exercises the code exchange and stateless session. Astro HTTP tests
cover route/Action independence, redirects and dotted paths; temporary Chromium
checks exercise authenticated Server Islands in a public SSG page.

Official references:
[Astro integration](https://better-auth.com/docs/integrations/astro),
[session management](https://better-auth.com/docs/concepts/session-management),
[plugins](https://better-auth.com/docs/concepts/plugins),
[Generic OAuth](https://better-auth.com/docs/plugins/generic-oauth),
[Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/).
