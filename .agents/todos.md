# Todos

Only human-requested pending or explicitly deferred work belongs here. Update
status when work is completed; do not turn possible improvements into tasks.

## Explicitly deferred

- [ ] Publish @samline/astro to npm only after the user says the base is ready and authorizes publication. Local packaging is implemented; nothing has been published.

## Active feature backlog

- [x] Finalize validation and cleanup of the implemented 7.20.0 modular installer.
      The source is implemented; see project.md for the current verification
      ledger. No npm publication or deployment is part of this request.

## Intentional defaults, not unfinished tasks

- SSG remains the default; full SSR is configured only in a future project that needs it.
- en-us is the maintained default; es-mx and es-es are the prepared presets.
  Generated projects include their selected languages only; later additions
  create empty dictionaries and stay inactive until completed.
- A real GTM ID and deployed tracking validation are project-specific inputs, not a pretext to add credentials or deploy this base.

## Recent completed requests

- [x] Migrate and improve GTM/consent, with deferred loading and Dinkbit presentation.
- [x] Group Theme's initialization and switch; demonstrate Tailwind theme variants.
- [x] Migrate PageLoader while retaining ldrs for replaceable animations.
- [x] Apply Astro-site accent families and matching theme-color.
- [x] Encapsulate reusable components with English API documentation.
- [x] Commit source changes as d9f3d8f and 2059917.
- [x] Run autoskills and consolidate project context under .agents.

- [x] Include a portable .agents seed and relevant skills in generated projects, with deployment/tool-specific instructions and fresh project memory.

- [x] Migrate local/API/Strapi collection examples and optional API Actions to
      Astro 7, with localized demo data, Live Collections and private configuration.

- [x] Analyze EasyTrip/legacy Fields and migrate generic native Astro controls with
      translated UI, accessible help/errors, optional SAM controller and API docs.

- [x] Rename the generator to @samline/astro (7.18.0), with samline-astro executable,
      updated distribution docs, metadata and runtime names. Do not publish yet.
- [x] Add provider-selectable Captcha with Turnstile / reCAPTCHA v2, server-side
      verification before contact delivery, lifecycle API and English documentation.

- [x] Document future localized API/CMS integration for SSG/SSR/live/browser use,
      and include the guidance in generated projects' agent context. Runtime
      translated-slug resolution was not requested as part of this documentation.

- [x] Implement optional Better Auth integration for external REST identities,
      OAuth/OIDC and project-owned users, with route/operation permissions and
      SSG Server Islands support. Provider/database configuration stays per project.
