# Server CAPTCHA verification

Import `verifyCaptcha` from this folder in Actions/endpoints. It returns a boolean
and never trusts a client-selected provider. The configured provider is fixed at
build time; only the secret is read at runtime. `none` explicitly bypasses the
check. When enabled, missing credentials, empty/oversized tokens, provider failures
or an unexpected hostname return false. See the complete configuration and client
API in [Captcha](../../components/Captcha/README.md).

The pure `verifyToken(token, settings, request = fetch)` implementation is kept
separate for deterministic testing. It POSTs only to the selected official
Siteverify endpoint, forbids redirects, applies an eight-second deadline and
bounds the response to 8 KiB. No automatic retries or IP header forwarding are
performed. Provider-side token expiration and single-use checks are authoritative;
never cache a positive result for later submissions. `hostnames` is a fixed exact
allowlist, not a value derived from an untrusted request Host header.

The contact Action already gates delivery with this verifier. Other consumers
must invoke it themselves before their protected operation. Keep tokens and
secrets out of logs and mail. Pure SSG hosting needs a separate verification
backend. Tests mock HTTP responses; no real keys or live challenges are claimed.
