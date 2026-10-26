# Captcha

Provider-neutral form verification for Cloudflare Turnstile (Managed widget) or
Google reCAPTCHA v2 checkbox, using explicit rendering and server verification. This API does
not implement reCAPTCHA v3, invisible reCAPTCHA or Enterprise Assessments.

## Availability and prerequisites

Optional installer selection: `captcha`. Add it later with
`npx @samline/astro add captcha --captcha-provider turnstile` (or `recaptcha`).
The feature includes this widget, client lifecycle helpers, the server verifier,
environment declarations and the captcha dictionary domain. It does not create a
form, mail service or protected operation by itself.

The component lives at `src/components/Captcha/index.astro`. Its widget can be
rendered on SSG pages, but a submitted token must be verified by a backend before
the protected operation. A static-only site needs an external verifier/backend.

## Configure

```dotenv
CAPTCHA_PROVIDER=turnstile
CAPTCHA_SITE_KEY=your-public-site-key
CAPTCHA_SECRET_KEY=your-private-secret
SITE_URL=https://example.com
# Optional exact hostname allowlist; default is the SITE_URL hostname.
CAPTCHA_HOSTNAMES=example.com,www.example.com
```

Choose `recaptcha` for Google or `none` to disable (the default). Use keys from the
selected provider; they are not interchangeable. Provider, site key, hostnames
and SITE_URL are build settings: rebuild after changing them. The private secret
is read at verification time with `astro:env/server.getSecret`; never expose it
in client imports, markup, logs or translations. Configure it in the server
hosting environment; Cloudflare local runtime uses `.dev.vars`.

Register the actual domains in the provider dashboard too. Use separate test
credentials for development; add `localhost`/`127.0.0.1` to the test hostname
allowlist only if those are returned by your test provider. Do not add a special
production bypass for test keys. Official testing instructions:
[Turnstile](https://developers.cloudflare.com/turnstile/troubleshooting/testing/),
[reCAPTCHA](https://developers.google.com/recaptcha/docs/faq).

## Complete rendering example

Put this in `src/sections/CaptchaPreview/index.astro` and compose the section in
Main. This is deliberately a rendering preview, with a disabled submit control;
it does not claim to submit or verify a token:

```astro
---
import Captcha from '@/components/Captcha/index.astro'
import Button from '@/components/Button/index.astro'
import { getDictionary } from '@/i18n'

const { buttons } = getDictionary(Astro.currentLocale)
---

<form class='grid gap-5'>
  <Captcha size='compact' />
  <Button type='button' disabled>
    {buttons.submit}
  </Button>
</form>
```

Expected result: with the selected provider and a valid public site key, one
compact provider widget appears inside the form. A successful challenge fills
the hidden `captchaToken` field. That browser callback is not authorization or
proof of server verification. With `CAPTCHA_PROVIDER=none`, no widget is rendered.
The submit control stays disabled because this preview has no submission handler.

| Prop                  | Default  | Purpose                                                                    |
| --------------------- | -------- | -------------------------------------------------------------------------- |
| `theme`               | `auto`   | `auto`, `light`, `dark`. Auto reads the site's current theme when mounted. |
| `size`                | `normal` | `normal` or `compact`, supported by both providers.                        |
| Native div attributes | —        | `id`, `class`, data attributes and Astro scope attributes.                 |

The component reads `Astro.currentLocale` and modular `captcha` translations.
The initial presets request the provider's English or Spanish UI from the resolved
locale. Review the provider language mapping for additional language/script tags. Google fixes widget language
when its SDK first loads; switching to another language through client navigation
requires a full document navigation. Theme is fixed when each widget mounts;
remount to apply a later site theme change. Provider iframe internals retain their
native controls, dimensions, branding and accessibility behavior.

Disabled configuration renders no widget and makes no SDK request. An enabled
widget without its site key fails visibly during rendering. Only the chosen
provider loads, once per document, when a widget mounts. This does not load either
SDK globally through the layout. Integrate provider privacy disclosures and CSP
requirements into the consuming site's policy.

Success writes the token to the hidden `captchaToken` input and dispatches native
`input`/`change`, so FormData and SAM Forms can read it. Turnstile's duplicate
response field is disabled; Google's standard response textarea may still exist.
Use the canonical field with the shared server verifier. Expiration/errors clear
it and show translated feedback/retry. JavaScript is required when enabled.

## Submission and lifecycle

The helper below belongs in the **browser script** of an actual form section.
It requires the `mail` feature's registered Contact Action, a supported server
adapter, configured SMTP, and the fields documented by that Action (`name`,
`email`, `message`, plus locale/honeypot when used). Installing only Captcha does
not provide `actions.contact`. For another backend, call that backend instead
and verify the token there. Do not copy this import into Astro frontmatter.

```ts
import { actions } from 'astro:actions'
import { resetCaptchas } from '@/components/Captcha/scripts'

const submit = async (form: HTMLFormElement) => {
  try {
    const { data, error } = await actions.contact(new FormData(form))
    // Render translated success or generic failure text through the section's UI.
    return { data, error }
  } finally {
    resetCaptchas(form)
  }
}
```

With SAM Forms, put the same Action call/reset in the section's async `onSubmit`.
Capture the submitted data before resetting. Tokens are single-use: reset after
**every request**, including validation, verification or mail errors. Prevent
concurrent submissions in the consuming controller. Do not reset immediately on
the native submit event before the payload has been captured.

Client exports from `./scripts`:

- `mountCaptchas(root = document)`: mount newly inserted markup, idempotently.
- `resetCaptchas(root = document)`: clear tokens and reset matching widgets.
- `destroyCaptchas(root = document)`: clear tokens, detach listeners and remove
  matching widget markup before dynamically removing it.

Root may be the wrapper or a containing form/section. Native form reset is
handled. Astro `page-load` mounts and `before-swap` cleans up automatically;
non-persisted pagehide cleans up too. Turnstile has `remove`; Google v2 exposes
reset, so its widget is reset and its owned container removed. Late callbacks
from destroyed instances cannot change the active form. Importing the component
owns automatic listeners; consumers only call these APIs for their dynamic UI.

## Backend requirement

`src/server/captcha/index.ts` exposes `verifyCaptcha(token): Promise<boolean>`.
When Mail is also installed, the generated Contact Action calls it after same-origin/honeypot checks and **before mail**.
Other Actions/endpoints must call it explicitly before their protected operation.
Missing tokens, unavailable/misconfigured providers, failed responses and hostname
mismatches fail verification. No automatic verification retry consumes the token
again. The provider checks token expiration and replay; there is no local trust
in the hidden field or browser callback. Rate limiting is a separate application
concern. No provider tokens or errors are returned to visitors or included in mail.

SSG pages can render this component with either provider, independent of where the
site is hosted. Token verification always requires a backend. Pure static hosting
must send the form to an external backend implementing the same check, or add an
adapter and enable the included Action registration. A Cloudflare deployment does
not require Turnstile, and Vercel does not require reCAPTCHA. CAPTCHA verification
uses fetch and no SMTP dependency; the example contact Action still needs a
compatible mail transport on the chosen runtime.

Official APIs:
[Turnstile client](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/),
[Turnstile verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/),
[Google v2 client](https://developers.google.com/recaptcha/docs/display),
[Google verification](https://developers.google.com/recaptcha/docs/verify).
