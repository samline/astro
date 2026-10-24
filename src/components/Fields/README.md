# Fields

Native Astro form controls with a shared presentation inspired by EasyTrip.
Works in SSG without a client framework. The browser keeps its native validation,
autocomplete, keyboard, date picker, select and file selection behavior.

## Components

Import each piece directly from `@/components/Fields/<Name>.astro`:

| Component        | Contract                                                                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Form             | Native form attributes; `layout="stack"` (default) or `"none"`. No implicit action, method or submission interception.                                                                              |
| Input            | Native text-like input attributes; `name`, translated `label`, optional `value`. Types: text, email, tel, url, search, password, number, date, datetime-local, month, week, time. Defaults to text. |
| Textarea         | Native textarea attributes; `name`, `label`, `value`, `rows` (default 4). Vertically resizable.                                                                                                     |
| Select           | Native select attributes; `name`, `label`, `options`, `value`, optional `placeholder`. Supports multiple and optgroups.                                                                             |
| Checkbox / Radio | Native input attributes including checked/value/required/disabled; `name`, `label`, help/error and field sizing. Use Fieldset for related choices.                                                  |
| File             | Native file attributes including accept/multiple/capture; `name`, `label`. No accept restriction by default; never prepopulates a file.                                                             |
| Fieldset         | Native fieldset attributes, translated `legend`, default slot. Native disabled applies to its controls.                                                                                             |

Input, Textarea and Select share `variant="floating" | "basic"` (default floating).
Floating means a persistent small label inside the field, not a disappearing
placeholder. Use basic for long labels or native multiple selects. File uses
basic; choices have their own layout.

All controls share `help`, `error`, `fieldSize="md" | "sm"`, `fieldClass` (outer
wrapper), and native `class` (control). Compact sizing preserves 1rem control text.
Supplied IDs are preserved; otherwise an ID is generated. Labels, help and error
nodes are associated with the control. Caller `aria-describedby` IDs are merged.
Errors set aria-invalid; error text remains escaped, including server responses.
Labels/help/error/options come from the consuming section's dictionary. Shared
required/password/file labels come from the active forms dictionary.

Do not put password values in markup: Input ignores its value for password.
Hidden fields need a native `<input type="hidden">`, not a styled Field.
Native numeric `size` is separate from visual `fieldSize`.
Avoid naming or identifying controls `reset`, `submit` or `requestSubmit`: native
form named properties can shadow methods used by the controller.

## Basic composition

The owning section imports the dictionary and components; no form UI belongs in
a route file. No locale prop is needed on these components.

```astro
---
import Form from '@/components/Fields/Form.astro'
import Input from '@/components/Fields/Input.astro'
import Textarea from '@/components/Fields/Textarea.astro'
import Button from '@/components/Button/index.astro'
import { getDictionary } from '@/i18n'
const { forms, buttons } = getDictionary(Astro.currentLocale)
---

<Form id='contact-form' method='post' action='/your-endpoint'>
  <Input name='name' label={forms.labels.name} autocomplete='name' required />
  <Input
    name='email'
    type='email'
    label={forms.labels.email}
    autocomplete='email'
    required
  />
  <Textarea name='message' label={forms.labels.message} required />
  <Button type='submit'>{buttons.submit}</Button>
</Form>
```

Use a real endpoint for native submission. A prerendered page cannot handle
request-specific Action results. Static hosting without an adapter needs an
external backend; see `src/actions/contact/README.md` for the SSG Action recipe.
File uploads need a matching backend and `enctype="multipart/form-data"` for
native POST. Accept/type/size restrictions must also be validated on the server.

## Select data

Use a typed `SelectEntry[]` from `./types`. Each option is
`{ value: string | number, label: string, disabled?: boolean }`. An optgroup is
`{ label: string, options: SelectOption[], disabled?: boolean }`. Display labels
may repeat. Option values should be unique within one select.

`value={0}` selects zero, not the placeholder. For multiple, pass an array of
values; no placeholder option is added. With no explicit value or placeholder,
a single select selects its first enabled option. Use an empty value and a
placeholder for a deliberate unselected required field. No HTML slot parsing,
Alpine-specific options or country catalog is imposed.

## Progressive enhancement

Input and File include one shared delegated enhancement module. Password buttons
are hidden without JS; with JS they expose translated show/hide labels and
aria-pressed. File keeps the native filename/count display and adds a clear
button only after selection. Clear emits input/change and restores input focus.
Reset hides the clear button and returns revealed passwords to password type.
The native filename text and date UI are localized by the browser itself.

`mountFields(root?: ParentNode)` from `./enhancements` reveals/synchronizes controls
and installs document delegation once. It runs automatically when Input/File
scripts execute, and refreshes on `astro:page-load`. Call it after inserting HTML
dynamically; scripts inserted through innerHTML do not execute. `refreshFields`
updates button visibility/disabled state after programmatic changes. Existing
document delegation requires no per-control cleanup.

## Optional form controller

`./scripts` wraps the ESM API of `@samline/forms` without creating browser globals.
Merely using Form does not bundle or initialize the controller.

- `createForm(elementOrId, options?)`: idempotent per element; returns the SAM
  FormController. Configure before the first call. Call after the form is mounted.
- `destroyForm(elementOrId)`: destroys that controller and removes its registry entry.
- `destroyForms(root?)`: destroy controllers within a subtree before removing it.
- Controller API includes onSubmit, watch, subscribe, getValue/setValue, getData,
  validate, setErrors/clearErrors, reset, addCleanup and destroy. See the installed
  `@samline/forms/docs` for its complete API.

The wrapper defaults `autoValidate` to false: untouched forms do not show errors
on mount. Native HTML constraints still run. Explicit library validators are
separate from required/type/pattern HTML attributes. Supply translated messages
for every rule; use `setErrors({ field: [translatedMessage] })` rather than the
array overload with its library fallback. Formatted fields/masks are optional;
this base includes @samline/formatter, used through the controller API.

State subscriptions safely render errors under each matching field in that form
and expose `aria-busy` during async handlers. Initial server-rendered errors are
restored into the controller. Repeated field names share their message; aggregate
errors do not identify a specific item. Validators using `each` can still mark
individual controls through the library. No implicit success checkmark is shown.

```ts
import { actions, isInputError } from 'astro:actions'
import { createForm } from '@/components/Fields/scripts'
import { getDictionary } from '@/i18n'

const initialized = new WeakSet<HTMLFormElement>()
const setup = () => {
  const element = document.getElementById('contact-form')
  if (!(element instanceof HTMLFormElement) || initialized.has(element)) return
  const copy = getDictionary(document.documentElement.lang).forms
  const controller = createForm(element)
  initialized.add(element)
  controller.addCleanup(() => initialized.delete(element))
  const status = element.querySelector<HTMLElement>('[data-form-status]')
  // Register once per mount; createForm itself is idempotent, onSubmit is additive.
  controller.onSubmit(async (_element, _values, formData) => {
    try {
      const result = await actions.contact(formData)
      if (result.error) {
        if (isInputError(result.error))
          controller.setErrors(result.error.fields)
        if (status) status.textContent = copy.messages.error
        return
      }
      if (status) status.textContent = result.data.message
    } catch {
      if (status) status.textContent = copy.messages.error
    }
  })
}
setup()
document.addEventListener('astro:page-load', setup)
```

Add a section-owned `<p data-form-status role="status"></p>` for the general
status. The example requires a registered contact Action/adapter and the contact schema's
locale/honeypot inputs where appropriate. In a project with ClientRouter, arrange
one setup per mount: destroy controllers on before-swap (automatic), and use a
section-owned initialization guard for persisted elements or repeated setup.
Do not register multiple onSubmit handlers on an existing controller.

Submission and status UI belong to the section. Handle transport failures in the
handler; rejected promises do not automatically become field errors. Prevent
repeat submissions in that consumer when needed, and avoid disabling ordinary
fields before FormData is collected. Browser constraints and client validation
never replace server validation or abuse controls.

Controllers are destroyed on Astro before-swap and non-persisted pagehide.
BFCache-persisted documents retain their controller. For HTML inserted into a
modal, call createForm after insertion and destroyForm before removal.

## Internal pieces

Field.astro, Choice.astro, attributes.ts and styles.css share implementation;
prefer the public controls above. Field has a default control slot and an
accessory slot. Tailwind variables/configuration stay in src/styles/tailwind.css;
component selectors live here. No global form reset, framework hydration,
calendar, country defaults, provider autocomplete or payment integration is added.

## SAM formatting

Formatting and raw-value synchronization belong to `@samline/forms` and
`@samline/formatter`. This feature contains no Astro 5 formatter/controller code,
local masks, cursor trackers, phone parser or regex dictionary.

Use text/tel inputs for masks, not type=number (formatted separators are not valid
native number input values). In the consuming section's processed script:

```ts
import { createForm } from '@/components/Fields/scripts'

const controller = createForm('contact-form', {
  formats: {
    phone: { type: 'phone', field: 'phone', options: { country: 'US' } },
    amount: {
      type: 'numeral',
      field: 'amount',
      options: {
        delimiter: ',',
        numeralDecimalMark: '.',
        numeralDecimalScale: 2
      }
    }
  }
})
```

The country/currency/format is a consuming project's choice. There is no global
Mexico default or automatic mask for every input. Date/time/general formats are
also available through the SAM API; formatting is not calendar/date validation.

SAM renames the visible `phone` input to `phone_displayed` and inserts a hidden
canonical `phone` raw mirror. IDs and associated labels remain on the visible
control. Validators for `phone` operate on raw data. `getValue('phone')` returns
raw; `getValue('phone_displayed')` returns display text. Both names appear in
FormData; the backend must accept only its schema/allowlist. Existing contact
validation strips unrelated display names.

`controller.setValue('phone', raw)` reformats the visible value.
`controller.format({ type, field, options })` configures/rebinds an individual
field; `formatAll` is the package alias. Binding is asynchronous while the ESM
formatter loads: initialize before the user can submit a masked form when raw
values are mandatory. Native HTML validation still applies to the display input.
Reset synchronizes the mirrors; destroy removes owned mirrors and restores names.
Do not manually rename these inputs or create a second raw mirror.
