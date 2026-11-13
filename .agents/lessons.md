# Technical pitfalls

- Declare Tailwind layer order in separately imported component CSS so Preflight
  cannot unexpectedly override control padding and borders.
- SAM Forms observes child-list changes. Update an existing error Text node's
  data rather than replacing textContent on every subscription.
- Target disabled controls directly; a disabled option must not make its select
  appear disabled through :has(:disabled).
- Astro Action FormData conversion can return null for empty optional strings
  under wrappers/transforms. Normalize nullable phone, website and captchaToken
  values at the submission boundary.
- Keep inactive Actions in index.ts.example. A commented-only index.ts lacks
  Astro's required server export. Adding another Action must not activate SMTP.
- Clear inherited npm_config_user_agent and npm_execpath when spawning a different
  package manager so it reports its own identity to installation guards.
- Documentation menus scroll active links within their natural scroll range.
  Preserve article position and manual scrolling; do not add artificial trailing
  space to force final links upward. Keep mobile close controls reachable.

- The compiler toolchain needs compatible @emnapi/core and @emnapi/runtime peers.
  Keep their explicit stable declarations with the catalog: a fresh peer resolver
  can otherwise select a v2 beta runtime for a v1 bridge. A passing maintainer
  lock does not validate a fresh generated project; test the packed CLI too.
- ClientRouter pitfalls (body replacement versus third-party SDKs, development-only
  style loss, duplicate view-transition names, viewport units, scroll order) live in
  the website guide "Use view transitions". Update that guide instead of repeating
  them here, and keep its effect previews and snippets in agreement.

Keep this file limited to applicable technical pitfalls. Move general conventions
into their owning contract and remove entries when they no longer apply.
