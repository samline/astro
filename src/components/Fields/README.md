# Fields

Native Astro form controls with shared labels, errors and layout.
Works in SSG without a client framework. The browser keeps its native validation,
autocomplete, keyboard, date picker, select and file selection behavior.

## Availability and ownership

Optional installer selection: `forms`, then opt into the Fields templates.
Alternatively, `npx @samline/astro add fields` adds Fields **and** its required
`@samline/forms` / `@samline/formatter` integration. Selecting Forms alone installs
the packages and `src/forms` guidance, not this folder.

All templates live in `src/components/Fields`. Form UI, submission handlers and
status messages belong to a domain section in `src/sections`; route files only
compose that section inside Main. Form sends nothing by itself. A working submit
requires a real Astro Action or external backend, chosen by the consuming project.

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

## First: render the controls

Save this complete preview as `src/sections/ContactPreview/index.astro` and render
it inside Main. It uses existing forms/buttons dictionary keys, requires no
backend, and intentionally has a disabled action. No locale prop is needed.

```astro
---
import Form from '@/components/Fields/Form.astro'
import Input from '@/components/Fields/Input.astro'
import Textarea from '@/components/Fields/Textarea.astro'
import Button from '@/components/Button/index.astro'
import { getDictionary } from '@/i18n'
const { forms, buttons } = getDictionary(Astro.currentLocale)
---

<Form id='contact-preview'>
  <Input name='name' label={forms.labels.name} autocomplete='name' required />
  <Input
    name='email'
    type='email'
    label={forms.labels.email}
    autocomplete='email'
    required
  />
  <Textarea name='message' label={forms.labels.message} required />
  <Button type='button' disabled>
    {buttons.submit}
  </Button>
</Form>
```

Expected result: labeled name/email/message controls with native browser
validation and a disabled button. This proves presentation only; it does not
pretend to deliver a message. Enable a submit control only after connecting the
actual transport, as in the next complete example.

A prerendered page cannot render request-specific Action results from frontmatter.
Static hosting without an adapter needs an external backend. For real SMTP mail,
install `mail` and follow the generated `src/actions/contact/README.md`; the
independent Basic Action example below deliberately sends no mail.
File uploads need a matching backend and `enctype="multipart/form-data"` for
native POST. Accept/type/size restrictions must also be validated on the server.

## Select data

For project choices, add descriptive keys to the owning dictionary domain first;
option values are stable backend identifiers, while `label` is translated copy.
A Select does not generate those keys, fetch remote options or invent a placeholder.

Use a typed `SelectEntry[]` from `./types`. Each option is
`{ value: string | number, label: string, disabled?: boolean }`. An optgroup is
`{ label: string, options: SelectOption[], disabled?: boolean }`. Display labels
may repeat. Option values should be unique within one select.

`value={0}` selects zero, not the placeholder. For multiple, pass an array of
values; no placeholder option is added. With no explicit value or placeholder,
a single select selects its first enabled option. Use an empty value and a
placeholder for a deliberate unselected required field. No HTML slot parsing,
Alpine-specific options or country catalog is imposed.

## Additional control examples

Password, file upload and contact preference labels are project-specific, so the
starter does not guess their wording. Before using the customization example
below, extend `Forms` in
`src/i18n/dictionaries/<default-locale>/forms/types.ts` with:

```ts
examples: {
  password: string
  contactMethod: string
  chooseContactMethod: string
  updates: string
  attachment: string
}
```

Add a matching `examples` object to **each locale's** `forms/index.ts`. These are
example English values for that object; supply the corresponding translations
in your other languages:

```json
{
  "password": "Password",
  "contactMethod": "Preferred contact method",
  "chooseContactMethod": "Choose a contact method",
  "updates": "Receive project updates",
  "attachment": "Attachment"
}
```

After those explicit dictionary additions, this complete section can live at
`src/sections/AdditionalFields/index.astro`:

```astro
---
import Form from '@/components/Fields/Form.astro'
import Input from '@/components/Fields/Input.astro'
import Select from '@/components/Fields/Select.astro'
import Checkbox from '@/components/Fields/Checkbox.astro'
import Radio from '@/components/Fields/Radio.astro'
import File from '@/components/Fields/File.astro'
import Fieldset from '@/components/Fields/Fieldset.astro'
import { getDictionary } from '@/i18n'

const { forms } = getDictionary(Astro.currentLocale)
const options = [
  { value: 'email', label: forms.labels.email },
  { value: 'phone', label: forms.labels.phone }
]
---

<Form id='additional-fields'>
  <Input
    name='password'
    type='password'
    label={forms.examples.password}
    autocomplete='new-password'
    variant='basic'
  />
  <Select
    name='contactMethod'
    label={forms.examples.contactMethod}
    options={options}
    placeholder={forms.examples.chooseContactMethod}
    value=''
    required
  />
  <Fieldset legend={forms.examples.contactMethod}>
    <Radio
      name='preferredChannel'
      value='email'
      label={forms.labels.email}
      checked
    />
    <Radio name='preferredChannel' value='phone' label={forms.labels.phone} />
  </Fieldset>
  <Checkbox name='updates' value='yes' label={forms.examples.updates} />
  <File name='attachment' label={forms.examples.attachment} accept='.pdf' />
</Form>
```

Expected result: a password field with a progressive show/hide button, a required
select with no initial choice, two mutually exclusive radios, an independent
checkbox, and a native PDF file chooser. These are separate controls showing the
API; the example has no submit operation or upload service. Both contact choice
controls are included only to compare Select with a Radio group; use the suitable
one in a real form. `accept='.pdf'` guides the picker and does not validate the
upload on the server.

Use `multiple value={['email', 'phone']} variant='basic'` for a multiple Select.
For repeated Checkbox names, give each a distinct value and read all values with
`formData.getAll(name)` on the backend. A Radio group shares one name; separate
instances receive unique generated IDs. Disable a related group with Fieldset's
native `disabled` attribute. Keep hidden metadata as native inputs, not Field.

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

## Then: connect a real SSG Action

This complete section is `src/sections/NameForm/index.astro`. In addition to
Fields, it requires the `actions` integration with its registered `basic` Action
and a compatible adapter (Vercel, Netlify or custom). If Actions were generated
only as an inactive static scaffold, activate the adapter/registration first.

The Basic Action accepts `name` and `locale`, validates them, and returns a
translated message. It does not send email or write data. The disabled submit
button prevents an unhandled native POST when JavaScript is unavailable; setup
reveals its normal enabled behavior after attaching the controller.

```astro
---
import Form from '@/components/Fields/Form.astro'
import Input from '@/components/Fields/Input.astro'
import Button from '@/components/Button/index.astro'
import { getDictionary, resolveLocale } from '@/i18n'

const locale = resolveLocale(Astro.currentLocale)
const { forms, buttons, actions: copy } = getDictionary(locale)
---

<Form id='name-form' data-error={copy.invalid}>
  <input type='hidden' name='locale' value={locale} />
  <Input
    name='name'
    label={forms.labels.name}
    autocomplete='name'
    maxlength={100}
    required
  />
  <Button type='submit' disabled>
    {buttons.submit}
  </Button>
  <p data-form-status role='status'></p>
</Form>

<script>
  import { actions, isInputError } from 'astro:actions'
  import { createForm } from '@/components/Fields/scripts'

  const initialized = new WeakSet<HTMLFormElement>()
  const setup = () => {
    const element = document.getElementById('name-form')
    if (!(element instanceof HTMLFormElement) || initialized.has(element))
      return
    const status = element.querySelector<HTMLElement>('[data-form-status]')
    const button = element.querySelector<HTMLButtonElement>('[type="submit"]')
    if (!status || !button) return
    const controller = createForm(element)
    initialized.add(element)
    controller.addCleanup(() => initialized.delete(element))
    let submitting = false
    controller.onSubmit(async (_element, _values, formData) => {
      if (submitting) return
      submitting = true
      button.disabled = true
      try {
        const { data, error } = await actions.basic(formData)
        if (isInputError(error)) controller.setErrors(error.fields)
        status.textContent = error
          ? (element.dataset.error ?? '')
          : data.message
      } catch {
        status.textContent = element.dataset.error ?? ''
      } finally {
        submitting = false
        button.disabled = false
      }
    })
    button.disabled = false
  }
  setup()
  document.addEventListener('astro:page-load', setup)
</script>
```

Expected result: native required/name-length validation, one Action request per
submission, field errors under their matching controls when returned by Astro,
and a general translated status. Network/Action errors use the serialized fallback.
The browser imports only the public Action helper and Fields controller; it does
not bundle every locale dictionary just to display one error message.

`createForm` is idempotent, but `onSubmit` registration is additive. The WeakSet
prevents registering the same handler twice on a persisted element. Its cleanup
entry allows the controller to be initialized again after it is destroyed.
Controllers are destroyed on before-swap automatically; setup handles page-load.
Do not register a controller separately before this setup if it needs different
options: initial options belong to the first call.

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
native number input values). The configuration fragment below requires a real
mounted `contact-form` containing named `phone` and `amount` controls. Add the
amount label to the owning dictionary domain first; it is not a shipped field.
Choose the format at the **first** `createForm` call in that section's browser
script, not after another setup already created its controller:

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

## Framework and package references

The distribution owns this markup adapter and its cleanup/error connection.
Submission APIs remain [Astro Actions](https://docs.astro.build/en/guides/actions/),
and browser script processing remains
[Astro scripts](https://docs.astro.build/en/guides/client-side-scripts/).
Use the installed SAM Forms and Formatter package documentation for their full
validator, state and formatting APIs; this README only documents the wrapper's
choices and the Fields templates.
