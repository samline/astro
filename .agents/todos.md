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

- [x] Adapt the package landing/docs for @samline/astro, preserve the Astro documentation boundary, add the curated Drawer/Ticker/Forms section, and maintain distribution ignores.

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

- [x] Audit the core installer and documentation site; clarify examples/titles,
      correct overview icons and record frontend conventions from the reference projects.
- [x] Investigate Astro/dependency/base-source updates and document the real
      commands and unsupported automatic source merging.
- [x] Create portable and maintainer project skills at the end of the audit.
- [x] Review license/provenance and rewrite READMEs in English with a clear purpose.
- [x] Add the improved optional starter demo with header, exact active navigation,
      Welcome, a second page and footer; preserve minimal and later-add behavior.

- [x] Expand FAQs and align landing/Examples/Docs footer credits with Ticker/Drawer.
- [x] Refine personal-package cards and remove redundant decorative arrows.
- [x] Offer client-selected package managers/runtimes and command tabs throughout
      authored guides and recipes; keep maintainer pnpm/Bun rules separate.
