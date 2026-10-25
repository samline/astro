import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomBytes } from 'node:crypto'
import { createAuthService } from '../src/server/auth/factory.ts'

test('Generic OAuth exchanges a code with a fake provider and the session survives another instance without a database', async (t) => {
  const provider = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch: (request) => {
      if (new URL(request.url).pathname === '/token')
        return Response.json({
          access_token: 'private-oauth-token',
          token_type: 'Bearer',
          expires_in: 3600
        })
      return Response.json({
        id: 'provider-42',
        name: 'OAuth visitor',
        email: 'oauth@example.com',
        email_verified: true
      })
    }
  })
  t.after(() => provider.stop(true))
  const origin = 'http://localhost:4321'
  const options = {
    mode: 'oauth',
    baseURL: origin,
    secret: randomBytes(48).toString('base64'),
    providers: [
      {
        providerId: 'fixture',
        clientId: 'fixture-client',
        clientSecret: 'fixture-secret',
        authorizationUrl: provider.url.origin + '/authorize',
        tokenUrl: provider.url.origin + '/token',
        userInfoUrl: provider.url.origin + '/profile',
        scopes: ['profile', 'email']
      }
    ]
  }
  const service = createAuthService(options)
  const start = await service.handler(
    new Request(origin + '/api/auth/sign-in/social', {
      method: 'POST',
      headers: {
        origin,
        'content-type': 'application/json',
        'x-samline-client-ip': '192.0.2.44'
      },
      body: JSON.stringify({ provider: 'fixture', callbackURL: '/account' })
    })
  )
  assert.equal(start.status, 200, await start.clone().text())
  const destination = new URL((await start.json()).url)
  assert.equal(destination.origin, provider.url.origin)
  const cookie = start.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ')
  const callback =
    origin +
    '/api/auth/callback/fixture?code=fixture-code&state=' +
    encodeURIComponent(destination.searchParams.get('state'))
  const completed = await service.handler(
    new Request(callback, { headers: { cookie } })
  )
  assert.equal(completed.status, 302, await completed.clone().text())
  assert.equal(
    new URL(completed.headers.get('location'), origin).href,
    origin + '/account'
  )
  const sessionCookies = completed.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ')
  const state = await createAuthService(options).getSession(
    new Request(origin + '/account', { headers: { cookie: sessionCookies } })
  )
  assert.equal(state.user.email, 'oauth@example.com')
  assert.doesNotMatch(JSON.stringify(state), /private-oauth-token/)
})
