# Contact Action

Demo form Action exposed as actions.contact. It validates contact data and calls
the server mail service. Registration lives in src/actions/index.ts; the schema
and handler stay together in this folder. Uses Astro 7's astro:actions and
astro/zod APIs, without a separate API route.

## Input and result

Send FormData, not JSON: this Action uses accept='form'.

| Field   | Required | Contract                                                                                                                     |
| ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| locale  | No       | Enabled site locale; defaults to defaultLocale in src/i18n/config.ts.                                                        |
| name    | Yes      | Trimmed, nonempty, at most 100 characters.                                                                                   |
| email   | Yes      | Valid email, at most 254 characters; used as replyTo only.                                                                   |
| phone   | No       | Up to 30 characters, optional leading +, digits, spaces, parentheses, dots and hyphens; at least 6 characters when provided. |
| message | Yes      | Trimmed, nonempty, at most 5000 characters.                                                                                  |
| website | No       | Honeypot: leave empty. Limit 200 characters.                                                                                 |

Unknown fields are stripped. Null bytes are rejected. Mail contains only the
explicit name/email/phone/message fields; it never includes the honeypot or
accepts recipient, sender, subject, or arbitrary HTML from the browser.

Successful delivery returns { success: true, message } with translated copy.
Validation returns Astro's ActionInputError with translated field errors.
Mail configuration/delivery failures return a generic translated ActionError
with code INTERNAL_SERVER_ERROR. No messageId, SMTP details, or credentials are
returned. Success means SMTP acceptance, not confirmed inbox delivery.

The request Origin must equal context.url.origin. Requests without Origin are
also rejected. This demo is intended for same-origin browser forms; trusted server
jobs should call the mail service directly. For reverse proxies, configure the
adapter/proxy so Astro sees the real public origin; do not remove origin checks
to hide a deployment configuration problem.

A filled honeypot returns the same success result but sends nothing. This is a
basic signal, not authentication or a complete spam defense. Configure provider
rate limits or project-specific challenge verification before exposing a real
form to traffic. An in-memory counter would not enforce limits across instances.

## Calling from an SSG section

Build a section containing the form and its browser script. Use dictionary copy
for labels, feedback, and accessible names. Pass locale through a hidden field
using resolveLocale(Astro.currentLocale); no locale prop is needed for the section.

The form should provide data-contact-form, a translated data-error attribute,
and a data-contact-status element with role='status'. Use the field names above
and a submit button. Keep the honeypot outside keyboard/screen-reader navigation
and disable autofill for that field.

```ts
import { actions, isInputError } from 'astro:actions'

const form = document.querySelector<HTMLFormElement>('[data-contact-form]')
const status = form?.querySelector<HTMLElement>('[data-contact-status]')

form?.addEventListener('submit', async (event) => {
  event.preventDefault()
  if (!status) return
  const fallback = form.dataset.error ?? ''
  try {
    const { data, error } = await actions.contact(new FormData(form))
    if (isInputError(error)) {
      status.textContent = Object.values(error.fields).flat().join(' ')
    } else {
      status.textContent = error ? fallback : data.message
    }
  } catch {
    status.textContent = fallback
  }
})
```

This is a minimal API example. A production form should also prevent duplicate
submissions and associate individual field errors with their inputs. Display
messages with textContent, not innerHTML. A prerendered page calls the Action
through its client helper; rendering Astro.getActionResult on that static page
cannot provide request-specific feedback. No contact page or form UI is installed
by this migration.

## Configuration and deployment

Configure the [mail service](../../server/mail/README.md) and enable MAIL_ENABLED
only when the project is ready to send. Disabled or missing SMTP configuration
returns a translated failure; it never pretends a normal form was delivered.

The base registers contact for its default Vercel adapter. Generated Vercel,
Netlify, and custom Node/Bun projects retain that registration. output remains
static: pages prerender and the adapter creates the Action's backend function.
Do not call the Action from a prerendered page's frontmatter.

For static and Cloudflare profiles the installer leaves the registration in
src/actions/index.ts.example commented out, retaining this demo folder and its
schema/documentation. Pure static hosting has
no backend; Workers needs a compatible mail transport. Once that transport is
implemented and an adapter is present, merge the example into an existing
index.ts without replacing its other Actions. If index.ts does not exist, rename
index.ts.example and uncomment the import and server export:

```ts
import { contact } from './contact'

export const server = { contact }
```

Do not add that registration to a pure static build without server support.
The .example suffix matters: Astro's build attempts to import server from an
index.ts entry even when the registration is entirely commented out.
There is no automatic CAPTCHA setup, real provider test, or external sending in
the test suite. HTTP tests replace delivery with an awaited local fake.

References: [Astro Actions](https://docs.astro.build/en/guides/actions/),
[Actions API](https://docs.astro.build/en/reference/modules/astro-actions/).

## CAPTCHA

When the CAPTCHA integration is installed, `captchaToken` is bounded to 2048
characters. Without that integration the schema and handler omit verification. With
`CAPTCHA_PROVIDER=none` it is not required. When Turnstile or reCAPTCHA is selected,
the Action verifies it after Origin/honeypot checks and before mail. A failed
check returns the translated `captcha.invalid` Action error and sends no mail.
Never include the token in mail fields. Reset the client widget after every
submission attempt; see src/components/Captcha/README.md when installed.
