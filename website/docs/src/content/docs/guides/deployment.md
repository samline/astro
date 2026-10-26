---
title: 'Choose a deployment target'
description: 'Compare the generated static, Vercel, Netlify, Cloudflare Workers and Node server configurations.'
locale: en
sidebar:
  group: guides
  order: 4
---

## Select the hosting environment

The installer starts every project with `output: 'static'`: public pages are
built ahead of time. Choosing a server-capable target adds its adapter and
configuration so specific features can run on the server when needed.

| Wizard choice | Generated setup                                                                             |
| ------------- | ------------------------------------------------------------------------------------------- |
| Static        | A file-only build without a server adapter.                                                 |
| Vercel        | `@astrojs/vercel` and `vercel.json`. This is the default choice.                            |
| Netlify       | `@astrojs/netlify` and `netlify.toml`.                                                      |
| Cloudflare    | `@astrojs/cloudflare`, Wrangler configuration and Node-based Astro/Wrangler execution.      |
| Custom        | `@astrojs/node` in standalone mode, plus a start script for the project's selected runtime. |

Custom means a prepared standalone server, not automatic support for every
hosting provider. Review the generated README for its entrypoint, environment
and reverse-proxy setup.

## Choose a backend for server features

Authentication, Actions, SMTP mail, Live Collections and Server Islands need
compatible server execution. Select an adapter when you want to run these
features from the Astro project.

If you initially choose pure static hosting, `--scaffold` can include inactive
examples for later setup. Configure an adapter and merge the documented
registration before using them. A static site can also call an external backend
when that is the project's architecture.

On Cloudflare Workers, SMTP and the owned-PostgreSQL auth example remain inactive
until the project supplies a compatible transport. Read their generated READMEs
before activation. The deployment target and the identity/CAPTCHA provider are
separate choices.

## Keep public pages static

A public static page can use a Server Island for dynamic or private work when
an adapter is configured. Pass the parent page's locale explicitly to the island
and authorize protected operations inside it. Private full pages can opt into
request-time rendering individually.

Astro defines these APIs. Follow its guides to
[Server Islands](https://docs.astro.build/en/guides/server-islands/),
[on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
and [deployment](https://docs.astro.build/en/guides/deploy/).

## Prepare the first deployment

1. Configure the real `SITE_URL` and the selected features' environment variables.
2. Run the generated verification scripts and inspect the output for your target.
3. Test server features with the actual provider configuration and hosting runtime.
4. Follow the platform's deployment instructions and check the deployed site.

The installer prepares files; you choose when to deploy and when to run database
migrations or other external setup.
