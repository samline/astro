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

Keep this file limited to applicable technical pitfalls. Move general conventions
into their owning contract and remove entries when they no longer apply.
