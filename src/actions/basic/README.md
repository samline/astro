# Basic Action

A request-time FormData example with bounded input, explicit locale validation,
same-origin checks and dictionary messages. It does not send email or write data.

```ts
import { actions } from 'astro:actions'

const submit = async (form: HTMLFormElement) => {
  const { data, error } = await actions.basic(new FormData(form))
  // Render the translated message through the owning section's status UI.
  return { data, error }
}
```

Supply named name and locale controls. Native HTML forms also work with Astro's
Action URL/result APIs. Keep UI inside sections and use Fields only if installed.
The installer registers this Action on supported server profiles. An explicitly
requested static scaffold keeps inactive index.ts.example registration; add a
server adapter and merge its registration into an existing index.ts, or
rename/uncomment it when no active entry exists, before calling the Action. Never expose
private operations without independent authorization and resource checks.
