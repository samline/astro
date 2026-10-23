import assert from 'node:assert/strict'
import { test } from 'node:test'
import nodemailer from 'nodemailer'
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createMailer } from '../src/server/mail/mailer.ts'
import { renderFormMail } from '../src/server/mail/template.ts'
import { getDictionary } from '../src/i18n/index.ts'

const settings = {
  MAIL_ENABLED: 'true',
  MAIL_FROM: 'website@example.com',
  MAIL_TO: 'team@example.com',
  SMTP_HOST: 'smtp.example.com',
  SMTP_USER: 'test-user',
  SMTP_PASSWORD: 'fake-password'
}
const message = {
  subject: 'Test',
  text: 'Plain text',
  html: '<p>Plain text</p>',
  replyTo: 'visitor@example.com'
}
const accepted = {
  messageId: 'local-test',
  accepted: ['team@example.com'],
  rejected: []
}
const reader = (config) => (name) => config[name]

test('mail stays lazy, reads runtime settings and fixes sender/recipient independently of message data', async () => {
  let configuration
  let sent
  const config = { ...settings, MAIL_ENABLED: 'false' }
  const send = createMailer(reader(config), (options) => {
    configuration = options
    return {
      sendMail: async (value) => {
        sent = value
        return accepted
      }
    }
  })
  assert.equal(configuration, undefined)
  await assert.rejects(send(message), /disabled/)
  assert.equal(configuration, undefined)
  config.MAIL_ENABLED = 'true'
  assert.deepEqual(
    await send({
      ...message,
      from: 'attacker@example.com',
      to: 'attacker@example.com',
      attachments: [{ path: '/etc/passwd' }]
    }),
    { messageId: 'local-test' }
  )
  assert.equal(sent.from, settings.MAIL_FROM)
  assert.equal(sent.to, settings.MAIL_TO)
  assert.equal(sent.replyTo, message.replyTo)
  assert.equal(sent.attachments, undefined)
  assert.equal(configuration.port, 587)
  assert.equal(configuration.secure, false)
  assert.equal(configuration.requireTLS, true)
  assert.equal(configuration.disableFileAccess, true)
  assert.equal(configuration.disableUrlAccess, true)
  assert.equal(sent.disableFileAccess, true)
  assert.equal(sent.disableUrlAccess, true)
  config.MAIL_TO = 'changed@example.com'
  await send(message)
  assert.equal(sent.to, config.MAIL_TO)
})

test('SMTP port 465 uses implicit TLS and invalid configuration fails before transport creation', async () => {
  let options
  await createMailer(reader({ ...settings, SMTP_PORT: '465' }), (value) => {
    options = value
    return { sendMail: async () => accepted }
  })(message)
  assert.equal(options.secure, true)
  assert.equal(options.requireTLS, false)
  const invalid = [
    { SMTP_PORT: '587garbage' },
    { SMTP_PORT: '0' },
    { SMTP_PORT: '65536' },
    { SMTP_SECURE: 'yes' },
    { SMTP_PASSWORD: '' },
    { SMTP_HOST: '' },
    { MAIL_FROM: 'visitor@example.com\r\nBcc: other@example.com' },
    { MAIL_TO: 'first@example.com,second@example.com' }
  ]
  for (const overrides of invalid) {
    await assert.rejects(
      createMailer(reader({ ...settings, ...overrides }), () =>
        assert.fail('Transport must not be created')
      )(message)
    )
  }
})

test('mail rejects injected headers, empty bodies and invalid reply addresses', async () => {
  const send = createMailer(reader(settings), () =>
    assert.fail('Transport must not be created')
  )
  for (const overrides of [
    { subject: '' },
    { subject: 'Title\r\nBcc: other@example.com' },
    { subject: 'a'.repeat(999) },
    { text: '  ' },
    { replyTo: 'visitor@example.com\nBcc: other@example.com' },
    { replyTo: 'first@example.com,second@example.com' }
  ])
    await assert.rejects(send({ ...message, ...overrides }))
})

test('SMTP rejection is not success and transport responses never leak to callers', async () => {
  for (const result of [
    { ...accepted, accepted: [] },
    { ...accepted, rejected: ['team@example.com'] }
  ]) {
    await assert.rejects(
      createMailer(reader(settings), () => ({ sendMail: async () => result }))(
        message
      ),
      /did not accept/
    )
  }
  await assert.rejects(
    createMailer(reader(settings), () => ({
      sendMail: async () => {
        throw new Error(
          `Provider response containing ${settings.SMTP_PASSWORD}`
        )
      }
    }))(message),
    { message: 'Mail delivery failed.' }
  )
})

test('form template escapes content, preserves order and produces localized plain text and HTML', () => {
  const copy = getDictionary().mail
  const title = '<img src=x onerror=alert(1)>'
  const fields = [
    {
      label: 'Name & "label"',
      value: '<script>alert(1)</script>\nSecond line'
    },
    { label: 'Next', value: 'Other' }
  ]
  for (const locale of ['en-us', 'en-mx', 'invalid']) {
    const result = renderFormMail({ title, fields, locale })
    assert.equal(result.subject, title)
    assert.ok(result.text.includes(copy.introduction))
    assert.ok(result.text.includes(fields[0].value))
    assert.match(result.html, /<html lang="en-us">/)
    assert.match(result.html, /&lt;img src=x onerror=alert\(1\)&gt;/)
    assert.match(result.html, /Name &amp; &quot;label&quot;/)
    assert.match(
      result.html,
      /&lt;script&gt;alert\(1\)&lt;\/script&gt;\nSecond line/
    )
    assert.ok(result.html.indexOf('Name &amp;') < result.html.indexOf('Next'))
    assert.doesNotMatch(result.html, /<script|<img|undefined/)
  }
})

test('Nodemailer composes a multipart message locally without contacting an SMTP provider', async () => {
  let mime
  const send = createMailer(reader(settings), () => {
    const stream = nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: 'unix',
      disableFileAccess: true,
      disableUrlAccess: true
    })
    return {
      sendMail: async (value) => {
        const result = await stream.sendMail(value)
        mime = result.message.toString()
        return { ...accepted, messageId: result.messageId }
      }
    }
  })
  const rendered = renderFormMail({
    title: getDictionary().mail.contactTitle,
    fields: [{ label: 'Name', value: 'Test visitor' }]
  })
  await send({ ...rendered, replyTo: message.replyTo })
  assert.match(mime, /From: website@example.com/)
  assert.match(mime, /To: team@example.com/)
  assert.match(mime, /Reply-To: visitor@example.com/)
  assert.match(mime, /Content-Type: multipart\/alternative/)
  assert.match(mime, /Content-Type: text\/plain/)
  assert.match(mime, /Content-Type: text\/html/)
})

test('Astro bundles the mail entry on the server without credentials and rejects a client import', async (t) => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const fixture = await mkdtemp(path.join(tmpdir(), 'astro-kit-mail-'))
  t.after(() => rm(fixture, { recursive: true, force: true }))
  await mkdir(path.join(fixture, 'src/pages'), { recursive: true })
  await cp(
    path.join(root, 'src/server/mail'),
    path.join(fixture, 'src/server/mail'),
    { recursive: true }
  )
  await cp(path.join(root, 'src/i18n'), path.join(fixture, 'src/i18n'), {
    recursive: true
  })
  await symlink(
    path.join(root, 'node_modules'),
    path.join(fixture, 'node_modules'),
    'junction'
  )
  await cp(path.join(root, 'package.json'), path.join(fixture, 'package.json'))
  await writeFile(
    path.join(fixture, 'astro.config.mjs'),
    `import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'
export default defineConfig({ output: 'static', adapter: vercel({ imageService: false }) })`
  )
  await writeFile(
    path.join(fixture, 'src/pages/index.astro'),
    '<html><body></body></html>'
  )
  await writeFile(
    path.join(fixture, 'src/pages/mail.ts'),
    `import { sendMail } from '../server/mail'
export const prerender = false
export const GET = () => new Response(typeof sendMail)`
  )
  const build = () =>
    spawnSync(
      process.execPath,
      [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'],
      {
        cwd: fixture,
        env: { ...process.env, NODE_ENV: 'production', MAIL_ENABLED: 'false' },
        encoding: 'utf8',
        timeout: 15000
      }
    )
  const server = build()
  assert.equal(server.status, 0, server.stdout + server.stderr)
  assert.doesNotMatch(
    await readFile(
      path.join(fixture, '.vercel/output/static/index.html'),
      'utf8'
    ),
    /SMTP_PASSWORD|nodemailer|astro:env/
  )
  await writeFile(
    path.join(fixture, 'src/pages/index.astro'),
    `<html><body><script>
import { sendMail } from '../server/mail'
document.addEventListener('click', () => sendMail({ subject: 'Test', text: 'Test' }))
</script></body></html>`
  )
  const client = build()
  assert.notEqual(client.status, 0)
  assert.match(
    client.stdout + client.stderr,
    /astro:env\/server|server.only|server-only/i
  )
})
