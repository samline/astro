# Reusable components

Each component owns a folder containing its implementation, README, and any
supporting scripts or styles. Keep related files together as the component grows.

Pages compose layout → section → component. Section-specific content stays in
its section folder rather than in this reusable component directory.

| Component      | Documentation                                          | Main API                                                                                            |
| -------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Fields         | [Fields/README.md](./Fields/README.md)                 | Native form controls, field presentation, password/file enhancements, and optional form controller. |
| PageLoader     | [PageLoader/README.md](./PageLoader/README.md)         | showLoader, hideLoader, navigation, and ldrs animation selection.                                   |
| Theme          | [Theme/README.md](./Theme/README.md)                   | Init, Switch, window.astroKitTheme, and themechange.                                                |
| GTM            | [GTM/README.md](./GTM/README.md)                       | Consent, CookiePreferences, and container configuration.                                            |
| Section        | [Section/README.md](./Section/README.md)               | id, padded, slots, and vertical spacing.                                                            |
| Box            | [Box/README.md](./Box/README.md)                       | size, slots, width, and gutters.                                                                    |
| Link           | [Link/README.md](./Link/README.md)                     | href, localize, and native navigation attributes.                                                   |
| Button         | [Button/README.md](./Button/README.md)                 | variant, size, native actions, and styled links.                                                    |
| LanguagePicker | [LanguagePicker/README.md](./LanguagePicker/README.md) | path and active locale configuration.                                                               |
| SEO            | [SEO/README.md](./SEO/README.md)                       | Main metadata props and shared configuration.                                                       |
| H              | [H/README.md](./H/README.md)                           | level, native heading attributes, and default slot.                                                 |
| FaIcon         | [FaIcon/README.md](./FaIcon/README.md)                 | Imported Font Awesome definitions, inline SVG, and optional accessible label.                       |

Single-entry components expose index.astro. Related components such as Theme's
Init/Switch and GTM's Head/Consent share their feature folder with one README.
Documentation ships with generated projects. Files under src/components do not
become public website pages.

When adding or changing an API, update its README: purpose, integration, props,
slots, client methods, events, configuration, examples, and relevant limits.
Keep all developer documentation in English. Use arrow functions and dictionaries
for visitor-facing text in examples. Distinguish internal helpers from public APIs.
