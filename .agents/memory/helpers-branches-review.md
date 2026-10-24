# Astro 5 helpers and experimental branch review

Reviewed 2026-10-24. User steering: stop component migrations and investigate
helpers and experimental branches. This review does not authorize migration of
helpers, auth, packages or any components. No application code or dependencies
were modified. Reference checkout stayed on main and clean.

## Branch evidence

Bitbucket remote heads were queried read-only with git ls-remote --heads origin.
Only main (91102bd5ee8d20eb6ef8da08ab6bfcd5692841d5) and breaking-changes
(4ab7c973cdf4d229d444adf6be57ec9ff23b83bc) exist; local refs match both heads.
There are 31 commits on breaking-changes beyond main. src/helpers has no diff
between their current tips. The branch's new helper is new/helpers/i18n.ts.
Git show/diff/ls-tree were used without checkout, fetch, edits or API calls to
its application backends. The Astro 5 graph is stale/coverage unavailable;
branch Git objects and current source reads are authoritative.

The experiment primarily lives in new/, outside src. Its config/Main/auth/
middleware/routes and collection definitions are prototype source, not a complete
configured active Astro app. Paths still use @ aliases targeting src; src/i18n
utils were removed in that branch while new equivalents live elsewhere.
Dependencies cleave-zen/libphonenumber-js referenced in new/ formatting are not
added to that branch's package manifest. Do not treat branch presence as a
working tested feature or copy its global output=server setting into the SSG kit.

## Main helpers: evaluation

| File                  | Judgment                                                  | Needed redesign                                                                                                                                                    |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| debounce.ts           | Worth a small reusable helper when consumed               | Remove any; add cancel/clear lifecycle and document async behavior.                                                                                                |
| formatNumber.ts       | Worth retaining the formatting intent                     | Strict finite numeric input, explicit currency independent of locale; avoid invalid input becoming zero or a partial valid number. Intl already does presentation. |
| getDate.ts            | Reconsider rather than copy                               | Intl for display when sufficient; explicit timezone and stable ISO parsing. Day.js only if arbitrary-format parsing is actually needed; no mutable global locale.  |
| urlQuery.ts           | Useful repeated-key conversion                            | Prefer native URLSearchParams for basics; own-key/prototype-safe records, fragment handling and deliberate URL-vs-query input contract.                            |
| form.ts               | Useful conversion tools distinct from native form reading | Typed values and explicit repeated-name/array conventions; preserve meaningful false/zero/empty files rather than blanket cleanup.                                 |
| stringCase.ts         | Small reusable slug helper candidate                      | Generic types and explicit Unicode/collision/business rules; toPascalCase only if used. Not a replacement for authored localized route names.                      |
| shuffleElements.ts    | Pure shuffleArray may be worthwhile                       | Generic type and explicit mutating vs nonmutating contract; do not impose DOM/Splide coupling.                                                                     |
| setOptionsOnSelect.ts | Optional dependent-select requirement                     | Current Astro Select handles render-time options, not runtime API updates. Define selection preservation, grouping and notification before adding a helper.        |
| centerItemsBy.ts      | Optional overflow-container behavior                      | Keep ordinary imports; eliminate function.toString/eval variants and account for nested layout/scroll bounds.                                                      |
| currentRoute.ts       | Rewrite only for actual active-menu requirement           | Exact segments, normalized locale/trailing slash, no startsWith prefix collisions; do not introduce a parallel router.                                             |
| getI18n.ts            | Already replaced                                          | getDictionary/resolveLocale and html.lang supply the current kit contract. Do not split locale by country suffix.                                                  |

Confirmed with local pure-function probes (no external requests):

- isCurrentRoute(/en-us/blogger, /blog) returns true.
- isHome(/other/en-us) returns true.
- paramsToObject for constructor=x and toString=y includes inherited function
  values instead of simple strings. JSON renders those function array entries null.
- notationNumber with 123garbage produces 123.
- formatPrice for fr-fr silently chooses MXN; currency cannot be inferred this way.
- objectToFormData always renames array fields to tags[], an implicit backend convention.
- removeEmptyFields drops a genuine zero-byte File named empty.txt, not merely a
  browser-generated unnamed empty upload placeholder.

## Experimental ideas worth preserving

1. Separate API transport, response adaptation and collection mapping. This is a
   useful boundary; the current kit already covers transport/schema validation
   and public build/live examples in server/content-api and content/remote/live.
2. Reusable typed loader factory with separate upstream and local schemas. This
   could reduce repetition for several real collections; do not generalize the
   starter solely to accommodate membership/profile demo shapes.
3. Request-scoped authenticated API access, profile operations and password-reset
   Actions are useful future-project recipes, not enabled generic SSG defaults.
4. Send only the client-required dictionary data from the server instead of
   bundling all locales in every client consumer. Evaluate payload size first.
   The branch sends the whole dictionary as Base64 and caches globally without
   locale/navigation invalidation; prefer a small safe serialized domain contract.
5. Split display formatting and raw submitted values, preserving cursor position.
   The existing SAM Forms integration exposes formatting hooks; the separately
   installed EasyTrip @samline/formatter 2.0.3 already implements this intent.
   Evaluate that package when masks are requested, not duplicated cleave/raw/phone files.

## Experimental defects and limits

- response.normalizeResponse trusts payload.success even on failed HTTP status.
  A local test of HTTP 500 with success:true returns success:true.
- HTTP 200 with data:[] and no explicit success becomes success:false; empty data
  is not inherently an error. These cases were executed from a transpiled Git
  source string in a temporary VM, without writing the reference checkout.
- toDataArray guesses any object-of-objects is a collection, potentially changing
  legitimate nested single-record shapes. Do not normalize away API contracts.
- fetchFromAPI declares query but ignores it; string URL concatenation lacks the
  current kit's timeout, redirect and URL-boundary policy. Private upstream error
  bodies should not become public user-facing messages verbatim.
- loaders turn API failures into entries:[] and skip invalid records, masking
  outage/schema failure as no content. Current kit distinguishes these states.
- user-profile IDs use randomUUID, so the same record changes ID between loads.
  Its request context resolver only handles collection calls, not entry calls.
- auth JWT update spreads session into token and derives role from session.role.
  Auth.js documents this update data as client-supplied and requiring validation:
  https://authjs.dev/reference/core#jwt
  This is a trust-boundary defect; no exploit against a deployed app was tested.
- middleware skips action/underscore/file-extension-like paths; authorization must
  be enforced by each protected Action/API, not inferred from page middleware.
  Unknown roles also default to client, rather than an explicit unauthorized state.
- Prototype registration/profile/memberships/loyalty schemas and admin/client
  routes are product-specific; do not impose them on every generated project.

## Subsequent implementation decision

The user declined all helper migration and plans separate packages later.
Do not implement the recommendation below as starter utilities. Component
migrations remain paused. Version 7.17.0 instead adopts SAM Formatter, strengthens
the existing API integration, adds an Astro-specific validated live-loader
factory and scoped Main client translation payload. See branch-adoption.md.

## Historical recommendation (superseded)

If the user requests implementation, prioritize strict formatting utilities,
query conversion, typed debounce and explicit FormData conversion. Implement
only useful consumed helpers, document their APIs and cover the confirmed edge
cases. Consider scoped client dictionaries and optional input masks separately.
Keep auth/private request access as a future opt-in feature with a verified
server trust boundary. Do not resume component migration from the older inventory.
