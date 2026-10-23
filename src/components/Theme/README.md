# Theme

Theme initialization and a control for choosing light or dark mode. Both
components work together; colors are defined in Tailwind.

## Integration

Main.astro already mounts Init.astro in the head. It applies the theme before
first paint and exposes the client API. Do not mount it again in each section.

Place the switch wherever needed; Welcome already includes one instance:

```astro
---
import ThemeSwitch from '@/components/Theme/Switch.astro'
---

<ThemeSwitch class='text-accent dark:text-accent-light' />
```

Switch accepts native button attributes, classes, and a slot for an alternative
translated label. It controls type, role, aria-checked, and hidden.
The default label is themes.darkMode, resolved with Astro.currentLocale.
The slot should contain a label, without nested interactive controls.

All instances stay synchronized. Aria-checked reflects whether the effective
theme is dark, including when the preference follows the system. Clicking the
switch selects an explicit light or dark preference.

## Configuration

`src/config/theme.ts` contains behavior only:

| Option              | Default             | Purpose                                                                   |
| ------------------- | ------------------- | ------------------------------------------------------------------------- |
| `defaultPreference` | `'system'`          | `'system'`, `'light'`, or `'dark'` when no valid saved preference exists. |
| `storageKey`        | `'astro-kit:theme'` | LocalStorage key for the preference.                                      |

Theme and ThemePreference types are exported from that file.
Color tokens and variants live in src/styles/tailwind.css.

## Client API

After Init runs, use window.astroKitTheme from client scripts. The property is
optional in TypeScript and does not exist on the server.

| Method                 | Returns                         | Purpose                                                        |
| ---------------------- | ------------------------------- | -------------------------------------------------------------- |
| `getTheme()`           | `'light' \| 'dark'`             | Current effective theme.                                       |
| `getPreference()`      | `'light' \| 'dark' \| 'system'` | Saved or default preference.                                   |
| `setPreference(value)` | `void`                          | Saves the preference and updates the document and controls.    |
| `refresh()`            | `void`                          | Reapplies current state and synchronizes newly added controls. |

```ts
window.astroKitTheme?.setPreference('dark')
window.astroKitTheme?.setPreference('light')
window.astroKitTheme?.setPreference('system')

const theme = window.astroKitTheme?.getTheme()
const preference = window.astroKitTheme?.getPreference()
```

Use system to follow the operating system again; the API persists that explicit
preference. There is no need to edit localStorage directly. Invalid values are
ignored at runtime.

## Event

`themechange` is dispatched on window whenever the theme is applied. `event.detail`
contains theme and preference; it is typed in src/types/theme.d.ts.

```ts
window.addEventListener('themechange', (event) => {
  const { theme, preference } = event.detail
  // Update a client integration that needs the current theme.
  console.debug({ theme, preference })
})
```

Use the getters for the initial state too: the first event may fire before your
listener is registered. Refresh also emits the event; do not call it from a
themechange listener.

## Using Tailwind

```astro
<div class='bg-white text-black dark:bg-black dark:text-white'>
  <slot />
</div>
```

Variants follow html's data-theme attribute rather than consulting the system
directly. Welcome demonstrates light:text-black dark:text-white and
dark:brightness-0 dark:invert for the logo.

## Persistence and navigation

The preference persists in localStorage, synchronizes across tabs, and follows
system changes while set to system. If storage is blocked, it works in memory.
Init avoids duplicate listeners and supports Astro lifecycle events if the
project adds ClientRouter. It does not add that router.

Without JavaScript, Switch is hidden. The fixed default theme remains, or light
mode when the default is system.
