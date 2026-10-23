# GTM and consent

Google Tag Manager with Consent Mode v2 and CookieConsent. Main integrates Head
in the head and Consent inside the body when the integration is enabled.

## Enable

Set environment variables before building; the site uses SSG:

```dotenv
GTM_ID=GTM-XXXXXXX
# Optional: override automatic activation.
# GTM_ENABLED=true
```

Replace the ID with a real container ID. Without an ID, GTM and the consent UI
stay disabled. Activation defaults to production on a non-local origin, outside
detected Vercel/Netlify previews. GTM_ENABLED=false disables it; true enables
local testing. This decision is independent of SITE_INDEXABLE.

## Configuration

Edit src/config/gtm.ts:

| Option               | Default               | Effect                                                                                                                                   |
| -------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `consentMode`        | `'basic'`             | Blocks GTM until an optional category is accepted. Advanced loads GTM earlier with denied signals.                                       |
| `consentTrigger`     | `'interaction'`       | Defers SDK, configuration, and CSS until scroll, wheel, touch movement, keyboard interaction, or preferences. Immediate starts on entry. |
| `cookieName`         | `'astro_kit_consent'` | Preference cookie name.                                                                                                                  |
| `cookieDurationDays` | `180`                 | Lifetime of the saved choice.                                                                                                            |
| `revision`           | `0`                   | Increase to request a new choice.                                                                                                        |
| `privacyPolicyPath`  | `null`                | Locale-free local path to an existing policy; null omits the link.                                                                       |

An existing cookie loads the SDK immediately to validate and restore the choice.
Permissions are not granted by directly reading its contents. Bots and audit
tools are not detected to change this behavior.

## Reopen preferences

```astro
---
import CookiePreferences from '@/components/GTM/CookiePreferences.astro'
---

<CookiePreferences class='text-accent underline' />
```

A native button accepting HTML attributes, classes, and a translated label slot.
The default label is cookies.preferences, using Astro's locale. It controls type
and hidden. Requires active Consent, without a locale prop. Main already shows
a fixed button; add another instance in a footer if needed. All instances share
the same consent. They stay hidden without the active integration or JavaScript.

## Categories

| Category    | Signals                                       |
| ----------- | --------------------------------------------- |
| `necessary` | Always enabled; stores the choice.            |
| `analytics` | analytics_storage.                            |
| `marketing` | ad_storage, ad_user_data, ad_personalization. |

All four signals start denied. Analytics does not grant advertising permissions.
In basic mode, rejection does not download GTM. Withdrawing a granted category
updates signals and reloads the page to stop previously loaded scripts. Adapt
container tags and cookie patterns in consent.ts to the project's actual tools.
Advanced mode may allow cookieless pings. No noscript iframe bypasses this flow.

## Navigation and measurement events

If ClientRouter is added, Head pushes astro_page_view into dataLayer for pathname
or query changes after an optional category is accepted. It includes page_location,
page_path, and page_title. Initial routes and hash-only changes are not duplicated.
It does not add ClientRouter or a manual initial page_view.

Configure the GTM trigger if you use this event, avoiding duplicates with automatic
history measurement. Validate the real container with Tag Assistant.

## Internal API and files

The integration exposes window.astroKitGTM?.updateConsent({ analytics, marketing }).
It returns a boolean: true means a permission was withdrawn after GTM loaded and
the caller should reload. The method updates signals and loads GTM when appropriate,
but **does not save the cookie or reload by itself**. It is the internal bridge
between Consent and Head. Use CookiePreferences for UI changes rather than
replacing a visitor's choice with a direct API call.

| File                      | Responsibility                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `Head.astro`              | Initial signals, internal API, single GTM load, and navigation.                                       |
| `Consent.astro`           | Locale, fixed button, deferred activation, and synchronization.                                       |
| `CookiePreferences.astro` | Reusable settings button.                                                                             |
| `consent.ts`              | Internal configuration builder and HTML text escaping.                                                |
| `consent-sdk.ts`          | Deferred SDK, configuration, and styles; retries failed CSS without duplicating successful downloads. |
| `consent.css`             | Consent UI appearance using Tailwind tokens and themes.                                               |

Copy lives in each locale's cookies dictionary domain. Customize content and the
policy for the project without hardcoding visitor-facing strings in components.
