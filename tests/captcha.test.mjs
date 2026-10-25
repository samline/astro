import assert from 'node:assert/strict'
import { test } from 'node:test'
import { verifyToken } from '../src/server/captcha/verify.ts'
import { createCaptchaFixture } from './helpers/captcha-fixture.mjs'

const settings = {
  provider: 'turnstile',
  secret: 'private-test-secret',
  hostnames: ['example.com']
}
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), { status })

test('CAPTCHA uses the selected official verifier, private secret, bounded request and hostname contract', async () => {
  for (const provider of ['turnstile', 'recaptcha']) {
    let calls = 0
    assert.equal(
      await verifyToken(
        'single-use-token',
        { ...settings, provider },
        async (url, init) => {
          calls++
          assert.equal(
            url,
            provider === 'turnstile'
              ? 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
              : 'https://www.google.com/recaptcha/api/siteverify'
          )
          assert.equal(init.method, 'POST')
          assert.equal(init.redirect, 'error')
          assert.ok(init.signal instanceof AbortSignal)
          assert.equal(init.body.get('secret'), settings.secret)
          assert.equal(init.body.get('response'), 'single-use-token')
          assert.equal(init.body.get('remoteip'), null)
          return json({
            success: true,
            hostname: 'example.com',
            'error-codes': []
          })
        }
      ),
      true
    )
    assert.equal(calls, 1)
  }
})

test('disabled CAPTCHA makes no request; enabled incomplete settings or tokens fail closed', async () => {
  const unexpected = () => {
    throw new Error('Unexpected provider call')
  }
  assert.equal(
    await verifyToken('', { provider: 'none', hostnames: [] }, unexpected),
    true
  )
  for (const [token, config] of [
    ['', settings],
    [' '.repeat(3), settings],
    ['a'.repeat(2049), settings],
    ['token', { ...settings, secret: '' }],
    ['token', { ...settings, hostnames: [] }],
    ['token', { ...settings, provider: 'untrusted-browser-provider' }]
  ])
    assert.equal(await verifyToken(token, config, unexpected), false)
})

test('provider rejection, replay/expiry, hostname mismatch and malformed or oversized responses fail', async () => {
  for (const provider of ['turnstile', 'recaptcha']) {
    for (const reply of [
      () => json({ success: false, 'error-codes': ['timeout-or-duplicate'] }),
      () => json({ success: true, hostname: 'attacker.example' }),
      () => json({ success: true }),
      () => json({ success: 'true', hostname: 'example.com' }),
      () => json(null),
      () => json({ success: true, hostname: 'example.com' }, 500),
      () => new Response('not json'),
      () => new Response('x'.repeat(8193)),
      () => {
        throw new Error('Private upstream diagnostic')
      }
    ])
      assert.equal(
        await verifyToken('token', { ...settings, provider }, reply),
        false
      )
  }
})

test(
  'SSG renders only the configured public provider and canonical field, with no secret leakage',
  { timeout: 60000 },
  async () => {
    for (const provider of ['none', 'turnstile', 'recaptcha']) {
      const fixture = await createCaptchaFixture(provider)
      try {
        assert.doesNotMatch(fixture.html, /private-test-secret/)
        if (provider === 'none')
          assert.doesNotMatch(
            fixture.html,
            /data-captcha(?:\s|=)|name="captchaToken"/
          )
        else {
          assert.ok(fixture.html.includes(`data-provider="${provider}"`))
          assert.ok(fixture.html.includes('name="captchaToken"'))
          assert.ok(
            fixture.html.includes('data-sitekey="public-test-site-key"')
          )
          assert.ok(fixture.html.includes('Security verification'))
          assert.ok(fixture.html.includes('<noscript>'))
        }
      } finally {
        await fixture.dispose()
      }
    }
  }
)
