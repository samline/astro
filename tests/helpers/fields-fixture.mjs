import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('../../', import.meta.url))

export const createFieldsFixture = async () => {
  const directory = await realpath(
    await mkdtemp(path.join(tmpdir(), 'astro-kit-fields-'))
  )
  try {
    await mkdir(path.join(directory, 'src/pages'), { recursive: true })
    for (const feature of [
      'components/Fields',
      'components/FaIcon',
      'i18n',
      'styles'
    ]) {
      await cp(
        path.join(root, 'src', feature),
        path.join(directory, 'src', feature),
        { recursive: true }
      )
    }
    await cp(
      path.join(root, 'tsconfig.json'),
      path.join(directory, 'tsconfig.json')
    )
    await writeFile(path.join(directory, 'package.json'), '{"type":"module"}')
    await symlink(
      path.join(root, 'node_modules'),
      path.join(directory, 'node_modules'),
      'junction'
    )
    await writeFile(
      path.join(directory, 'astro.config.mjs'),
      `import { defineConfig } from 'astro/config'
import tailwind from '@tailwindcss/vite'
export default defineConfig({ vite: { plugins: [tailwind()] } })`
    )
    await writeFile(
      path.join(directory, 'src/pages/index.astro'),
      `---
import Form from '../components/Fields/Form.astro'
import Input from '../components/Fields/Input.astro'
import Textarea from '../components/Fields/Textarea.astro'
import Select from '../components/Fields/Select.astro'
import Checkbox from '../components/Fields/Checkbox.astro'
import Radio from '../components/Fields/Radio.astro'
import File from '../components/Fields/File.astro'
import Fieldset from '../components/Fields/Fieldset.astro'
import { getDictionary } from '../i18n'
import '../styles/global.css'
const { forms, buttons } = getDictionary()
const labels = forms.labels
const options = [{ value: 0, label: labels.name }, { label: labels.email, options: [{ value: 1, label: labels.name }, { value: 2, label: labels.message, disabled: true }] }]
---
<html lang='en-us'><head><meta charset='UTF-8' /><title>{labels.name}</title></head>
<body class='mx-auto max-w-xl p-6'>
<Form id='test-form' method='post' action='/native' data-owner='fixture'>
<Input id='email' name='email' type='email' label={labels.email} required autocomplete='email' help={forms.messages.invalidEmail} aria-describedby='external-help' data-native='preserved' class='scoped-control' />
<p id='external-help'>{forms.messages.required}</p>
<Input id='zero' name='zero' type='number' label={labels.name} value={0} variant='basic' fieldSize='sm' />
<Input id='password' name='password' type='password' label={labels.name} value='must-not-render-secret' />
<Input id='readonly' name='readonly' label={labels.name} readonly value={labels.name} />
<Input name='generated' label={labels.name} />
<Select id='select-zero' name='choice' label={labels.name} options={options} value={0} placeholder={forms.messages.required} required />
<Select id='select-multiple' name='many' label={labels.name} options={options} multiple value={[0,1]} variant='basic' />
<Select id='select-default' name='default' label={labels.name} options={[{ value:'disabled', label:labels.name, disabled:true }, { value:'enabled', label:labels.email }]} />
<Textarea id='message' name='message' label={labels.message} value={'<b>literal</b>'} error={'<script>untrusted</script>'} />
<Fieldset legend={labels.name}>
<Checkbox id='a' name='interests' label={labels.name} value='a' checked />
<Checkbox id='b' name='interests' label={labels.email} value='b' checked />
<Radio id='radio-a' name='radio' label={labels.name} value='a' checked />
<Radio id='radio-b' name='radio' label={labels.email} value='b' />
</Fieldset>
<Fieldset legend={labels.name} disabled>
<Input id='disabled' name='disabled' label={labels.name} type='password' />
<Checkbox name='disabled-choice' label={labels.name} checked />
</Fieldset>
<File id='files' name='files' label={labels.message} multiple />
<button id='submit' type='submit' name='intent' value='save'>{buttons.submit}</button>
<button id='reset-button' type='reset'>{buttons.cancel}</button>
</Form>
<Form id='other-form'><Input id='other-email' name='email' label={labels.email} /></Form>

<style>.scoped-control { letter-spacing: 0.01em; }</style>
</body></html>`
    )
    const result = spawnSync(
      process.execPath,
      [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'],
      {
        cwd: directory,
        encoding: 'utf8',
        timeout: 20000,
        env: { ...process.env, NODE_ENV: 'production' }
      }
    )
    if (result.status !== 0) throw new Error(result.stdout + result.stderr)
    return {
      directory,
      html: await readFile(path.join(directory, 'dist/index.html'), 'utf8'),
      dispose: () => rm(directory, { recursive: true, force: true })
    }
  } catch (error) {
    await rm(directory, { recursive: true, force: true })
    throw error
  }
}
