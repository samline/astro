---
title: 'Overview'
description: 'What @samline/astro sets up, how to choose integrations, and where to find the Astro documentation.'
locale: en
sidebar:
  group: start
  order: 1
---

## Start with a prepared Astro project

`@samline/astro` creates an **Astro 7** project with a shared starting structure
and the integrations you choose. Use it to set up a new site, then edit the
generated source as your own project.

This documentation covers the installer, its configuration, the supplied
components and the examples it generates. For routing, rendering, Server Islands,
Actions, Content Collections and other framework features, use the
[official Astro documentation](https://docs.astro.build/).

## Included in every project

The starting project includes:

- Astro, TypeScript, Tailwind 4 and locally installed Fontsource typography.
- A Main layout, Section and Box wrappers, and basic heading, link and button components.
- A small homepage and a not-found page.
- SEO metadata, robots and sitemap configuration.
- Separate translation dictionaries for the selected languages.
- Public `img`, `docs` and `video` folders.
- Portable `.agents` instructions and skills for working on the generated project.

Themes, authentication, forms, mail and the other optional integrations are added
only when selected. The source repository contains the full set so we can maintain
it; your generated site contains the parts you requested.

## Find the right guide

- [Create a project](./getting-started/): requirements, wizard and first run.
- [Add integrations](./guides/integrations/): choices and configuration still needed.
- [Use the installation examples](./guides/examples/): commands for common starting points.
- [Follow the project conventions](./guides/conventions/): where code, styles and translations belong.
- [Update a project](./guides/updating/): Astro, dependencies and generated source.
- [Read the command reference](./reference/api/): flags and supported operations.

## Start building

Follow [Create a project](./getting-started/) to choose your tools, deployment
target, languages and integrations. Then replace the generated sections with
your site’s content and use the component references as you build.
