# Server mail

Install with `npx @samline/astro add mail` from a generated project. This also
includes the contact Action example. Configure a compatible server adapter and
SMTP credentials before enabling delivery.

Reusable server service for SMTP delivery and localized form notifications.
It belongs under src/server because it is not a UI component or an Astro
integration plugin. Import the public API from @/server/mail only in server code.
Its astro:env/server import prevents browser use of the public entry point.

## Configuration

The base builds without mail credentials. Sending is disabled unless MAIL_ENABLED
is exactly true. Set the following in your hosting runtime environment, or in
an ignored local .env file during development:

```dotenv
MAIL_ENABLED=true
MAIL_FROM=website@example.com
MAIL_TO=team@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-user
SMTP_PASSWORD=your-password
```

All fields are server secrets in Astro's env schema. Values are read with
getSecret for each send and validated only when sending. No transporter or
network connection is created merely by importing the module or building pages.
MAIL_FROM and MAIL_TO each accept one plain email address. No user-supplied
recipient or sender override is exposed. Use a sender authorized by your SMTP
provider; configure the domain's SPF/DKIM and any required verification there.

Port defaults to 587 with required STARTTLS. Port 465 defaults to implicit TLS
unless SMTP_SECURE is set explicitly; use SMTP_SECURE=true for that port.
Certificate verification is never disabled. SMTP authentication is required.
Connection/greeting timeouts are 10 seconds and socket inactivity timeout is
20 seconds. There is no connection pool, background queue, or automatic retry.

## Form notifications

Call from an Astro Action or an on-demand endpoint after validating the submitted
data. The example assumes input and locale have already been validated:

```ts
import { sendFormMail } from '@/server/mail'
import { getDictionary } from '@/i18n'

const dictionary = getDictionary(locale)
const receipt = await sendFormMail({
  locale,
  title: dictionary.mail.contactTitle,
  replyTo: input.email,
  fields: [
    { label: dictionary.forms.labels.name, value: input.name },
    { label: dictionary.forms.labels.email, value: input.email },
    { label: dictionary.forms.labels.message, value: input.message }
  ]
})
```

The explicit field array controls ordering and avoids accidentally emailing
tokens, honeypots, or other private form fields. Labels, title, and template copy
come from dictionaries. No field labels are guessed from object keys.
Pass locale explicitly across the request boundary; mail has no Astro.currentLocale.
Locale resolution follows the site's enabled locales and defaults to en-us.

## Public API

| Export                 | Input                                      | Result                                    |
| ---------------------- | ------------------------------------------ | ----------------------------------------- |
| sendMail               | subject, text, optional html and replyTo   | Promise of { messageId }.                 |
| sendFormMail           | title, fields, optional locale and replyTo | Renders a form notification and sends it. |
| renderFormMail         | title, fields, optional locale             | { subject, text, html }, without sending. |
| MailMessage / FormMail | Type-only exports                          | Contracts for the API above.              |

Plain text is required for sendMail. It is generated automatically by the form
template. Form HTML escapes every title, label, and value and preserves line
breaks. It uses a small inline-styled table with header cells; it does not depend
on the site's CSS, Tailwind, JavaScript, fonts, or remote images. Test appearance
in the mail clients required by each project; no universal client rendering
guarantee is implied. Its own neutral presentation intentionally has no site tokens.

sendMail's optional html is trusted developer-authored HTML: escape interpolated
user data yourself or use renderFormMail. No attachments, arbitrary headers,
filesystem content, or URL-backed content are accepted. Subjects reject control
characters; addresses reject multiple recipients and header injection.

Success means the SMTP server accepted the configured recipient, not confirmed
inbox delivery. Transport failures return a generic error without provider
responses or credentials. Configuration errors name the missing or invalid setting.
Do not send internal errors to visitors; return dictionary.forms.messages.error
from your Action or endpoint. Await delivery before returning its response.

## Runtime and deployment

Pages remain SSG. Sending at request time requires a server adapter and an Astro
Action or an endpoint with export const prerender = false. The base now includes
a [contact Action](../../actions/contact/README.md) that uses this service.
Validate inputs and apply appropriate anti-abuse measures at the form boundary.
Calling sendMail from a prerendered page would send during its build; never do so.

Vercel's Node/Bun functions, Netlify's Node functions, and custom Node/Bun servers
can use this SMTP service when their host allows connectivity to the provider.
Pure static deployment has no runtime for local sending; use an external backend.
Cloudflare Workers needs a runtime-compatible transport: do not assume Nodemailer
or its TCP/TLS behavior is supported there. Use the provider's HTTP API or a
Worker-native mail binding in that project's implementation. That transport is
not included or validated here. This base does not activate global SSR.

The installer preserves commented mail settings in .env.example and
.env.development for every profile. For Cloudflare, keep Worker secrets in
.dev.vars or provider bindings when implementing its transport, not public vars.
Credentials are never installed by the generator.

## Internal files and tests

index.ts bridges Astro runtime secrets to the service. mailer.ts contains SMTP
validation and delivery. template.ts contains pure notification rendering.
createMailer's injected transport is an internal test seam, not the public app API.
Tests use fake configuration and local in-memory transports, never real accounts
or external recipients. Real provider delivery requires project credentials and
separate authorization to send a test message.

References: [Astro env](https://docs.astro.build/en/reference/modules/astro-env/),
[Astro endpoints](https://docs.astro.build/en/guides/endpoints/),
[Nodemailer SMTP](https://nodemailer.com/smtp),
[Nodemailer message configuration](https://nodemailer.com/message).
