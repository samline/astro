import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile
} from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dev } from 'astro'
import { contactInput } from '../src/actions/contact/schema.ts'
import { getDictionary } from '../src/i18n/index.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const input = {
  name: 'Visitor',
  email: 'visitor@example.com',
  message: 'A test message'
}

test('contact schema normalizes input, strips unrelated fields and returns dictionary validation messages', () => {
  const parsed = contactInput.parse({
    ...input,
    name: ' Visitor ',
    to: 'other@example.com'
  })
  assert.equal(parsed.name, 'Visitor')
  assert.equal(parsed.locale, 'en-us')
  assert.equal(parsed.phone, '')
  assert.equal(parsed.website, '')
  assert.equal(parsed.to, undefined)
  const copy = getDictionary().forms.messages
  for (const [overrides, field, message] of [
    [{ name: '  ' }, 'name', copy.required],
    [{ email: 'invalid' }, 'email', copy.invalidEmail],
    [{ phone: 'not a phone' }, 'phone', copy.invalidPhone],
    [{ message: 'a'.repeat(5001) }, 'message', copy.tooLong],
    [{ locale: 'invalid' }, 'locale', copy.invalidInput],
    [{ name: 'null\0byte' }, 'name', copy.invalidInput]
  ]) {
    const result = contactInput.safeParse({ ...input, ...overrides })
    assert.equal(result.success, false)
    assert.ok(
      result.error.issues.some(
        (issue) => issue.path[0] === field && issue.message === message
      )
    )
  }
  assert.ok(
    contactInput.safeParse({ ...input, phone: '+1 (555) 555-5555' }).success
  )
})

test(
  'real Astro Action HTTP requests validate, await delivery, ignore honeypots and sanitize failures',
  { timeout: 20000 },
  async (t) => {
    const fixture = await mkdtemp(path.join(tmpdir(), 'astro-kit-contact-'))
    t.after(() => rm(fixture, { recursive: true, force: true }))
    for (const name of ['actions', 'i18n'])
      await cp(path.join(root, 'src', name), path.join(fixture, 'src', name), {
        recursive: true
      })
    await mkdir(path.join(fixture, 'src/server/mail'), { recursive: true })
    await mkdir(path.join(fixture, 'src/pages'), { recursive: true })
    await cp(
      path.join(root, 'package.json'),
      path.join(fixture, 'package.json')
    )
    await symlink(
      path.join(root, 'node_modules'),
      path.join(fixture, 'node_modules'),
      'junction'
    )
    await writeFile(
      path.join(fixture, 'astro.config.mjs'),
      "import { defineConfig } from 'astro/config'; import vercel from '@astrojs/vercel'; export default defineConfig({ adapter: vercel({ imageService: false }) })"
    )
    await writeFile(
      path.join(fixture, 'src/pages/index.astro'),
      '<html><body></body></html>'
    )
    const record = path.join(fixture, 'messages.jsonl')
    await writeFile(record, '')
    await writeFile(
      path.join(fixture, 'src/server/mail/index.ts'),
      `import { appendFile } from 'node:fs/promises'
export const sendFormMail = async (mail) => {
  if (mail.fields[0].value === 'transport-error') throw new Error('Secret provider failure')
  await appendFile(${JSON.stringify(record)}, JSON.stringify(mail) + '\\n')
  return { messageId: 'fake-delivery' }
}`
    )
    const server = await dev({
      root: pathToFileURL(fixture + '/'),
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 47321, strictPort: true }
    })
    t.after(() => server.stop())
    const origin = `http://127.0.0.1:${server.address.port}`
    const post = async (overrides = {}, requestOrigin = origin) => {
      const form = new FormData()
      for (const [key, value] of Object.entries({ ...input, ...overrides }))
        form.set(key, value)
      return fetch(`${origin}/_actions/contact`, {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        body: form,
        headers: requestOrigin ? { Origin: requestOrigin } : {}
      })
    }
    const sent = await post({
      phone: '+1 (555) 555-5555',
      to: 'attacker@example.com'
    })
    assert.equal(sent.status, 200, await sent.clone().text())
    assert.ok(
      (await sent.text()).includes(getDictionary().forms.messages.success)
    )
    const mail = JSON.parse((await readFile(record, 'utf8')).trim())
    assert.equal(mail.replyTo, input.email)
    assert.equal(mail.title, getDictionary().mail.contactTitle)
    assert.deepEqual(
      mail.fields.map(({ label }) => label),
      Object.values(getDictionary().forms.labels)
    )
    assert.equal(mail.to, undefined)
    const invalid = await post({ email: 'invalid' })
    assert.equal(invalid.status, 400)
    assert.ok(
      (await invalid.text()).includes(
        getDictionary().forms.messages.invalidEmail
      )
    )
    const bot = await post({ website: 'bot content' })
    assert.equal(bot.status, 200)
    assert.equal((await post({}, 'https://other.example')).status, 403)
    assert.equal((await post({}, null)).status, 403)
    const failed = await post({ name: 'transport-error' })
    assert.equal(failed.status, 500)
    const failure = await failed.text()
    assert.ok(failure.includes(getDictionary().forms.messages.error))
    assert.doesNotMatch(failure, /Secret provider/)
    assert.equal((await readFile(record, 'utf8')).trim().split('\n').length, 1)
  }
)
