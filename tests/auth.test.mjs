import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomBytes } from 'node:crypto'
import { Database } from 'bun:sqlite'
import { getMigrations } from 'better-auth/db/migration'
import { createAuthService } from '../src/server/auth/factory.ts'
import { createRestIdentity } from '../src/server/auth/remote.ts'
import { canAccess } from '../src/server/auth/policy.ts'
import { authUserFields } from '../src/server/auth/schema.mjs'

const secret = randomBytes(48).toString('base64')
const baseURL = 'http://localhost:4321'
const user = {
  id: '42',
  name: 'Visitor',
  email: 'visitor@example.com',
  emailVerified: true,
  roles: ['editor'],
  permissions: ['posts:update']
}
const credential = {
  token: 'private-api-token',
  refreshToken: 'private-refresh-token'
}
const cookies = (response) =>
  response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ')
let address = 1
const request = (path, { body, cookie, method, origin = baseURL } = {}) =>
  new Request(baseURL + '/api/auth' + path, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers: {
      origin,
      'x-samline-client-ip': `127.0.0.${address++}`,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
const signIn = async (service) =>
  service.handler(
    request('/external/sign-in', {
      body: { email: user.email, password: 'password123' }
    })
  )

const external = (provider = {}) =>
  createAuthService({
    mode: 'external',
    secret,
    baseURL,
    provider: {
      authenticate: async () => ({ user, credential }),
      profile: async () => user,
      ...provider
    }
  })

test('REST Better Auth sessions survive another instance without a user database; private tokens never enter JSON or clear cookies', async () => {
  const first = external()
  const response = await signIn(first)
  assert.equal(response.status, 200, await response.clone().text())
  const state = await response.json()
  assert.equal(state.user.id, user.id)
  assert.doesNotMatch(
    JSON.stringify(state),
    /private-api-token|private-refresh-token/
  )
  const cookie = cookies(response)
  assert.doesNotMatch(cookie, /private-api-token|private-refresh-token/)
  for (const value of response.headers.getSetCookie())
    assert.match(value, /HttpOnly/i)
  assert.equal(
    (await external().getSession(request('/get-session', { cookie }))).user.id,
    user.id
  )
  assert.equal(await external().getSession(request('/get-session')), null)
  const exposed = await external().handler(request('/get-session', { cookie }))
  assert.doesNotMatch(
    await exposed.text(),
    /private-api-token|private-refresh-token/
  )
  const payload = cookie.replace(
    /samline-identity=([^;]+)/,
    'samline-identity=invalid'
  )
  assert.equal(
    (await external().handler(request('/get-session', { cookie: payload })))
      .status,
    401
  )
  const second = await signIn(first)
  const mixed = cookies(second)
    .split('; ')
    .filter((entry) => !entry.startsWith('samline-identity='))
    .concat(
      cookie.split('; ').find((entry) => entry.startsWith('samline-identity='))
    )
    .join('; ')
  assert.equal(
    (await first.handler(request('/get-session', { cookie: mixed }))).status,
    401
  )
})

test('REST authorization revalidates provider permissions, denies revoked tokens and memoizes only within a request', async () => {
  let profile = user,
    calls = 0,
    revoked = false
  const service = external({
    profile: async () => {
      calls++
      if (revoked) throw { status: 401 }
      return profile
    }
  })
  const cookie = cookies(await signIn(service))
  const currentRequest = request('/get-session', { cookie })
  assert.equal(
    canAccess(await service.getSession(currentRequest), {
      permissions: ['posts:update'],
      verified: true
    }),
    true
  )
  assert.equal(
    await service.withExternalToken(
      currentRequest,
      async (token) => token === credential.token
    ),
    true
  )
  assert.equal(calls, 1)
  profile = { ...user, permissions: [] }
  assert.equal(
    canAccess(await service.getSession(request('/get-session', { cookie })), {
      permissions: ['posts:update']
    }),
    false
  )
  revoked = true
  await assert.rejects(
    service.getSession(request('/get-session', { cookie })),
    (error) => error.status === 401
  )
  assert.equal(canAccess(null), false)
  assert.equal(canAccess({ user, session: {} }, { roles: ['unknown'] }), false)
  assert.equal(
    canAccess(
      { user, session: {} },
      { permissions: ['posts:update', 'users:delete'] }
    ),
    false
  )
})

test('REST session refresh remains server-side, rejects identity changes and logout clears cookies and reports remote revocation', async () => {
  let profile = user,
    revocations = 0
  const service = external({
    profile: async () => profile,
    revoke: async (value) => {
      assert.equal(value.token, credential.token)
      revocations++
    }
  })
  const cookie = cookies(await signIn(service))
  profile = { ...user, name: 'Updated' }
  const refresh = await service.handler(
    request('/external/refresh', { cookie, body: {} })
  )
  assert.equal(refresh.status, 200, await refresh.clone().text())
  assert.equal((await refresh.json()).user.name, 'Updated')
  profile = { ...user, id: 'another-user' }
  assert.equal(
    (await service.handler(request('/external/refresh', { cookie, body: {} })))
      .status,
    401
  )
  const logout = await service.handler(
    request('/external/sign-out', { cookie, body: {} })
  )
  assert.deepEqual(await logout.json(), { success: true, remoteRevoked: true })
  assert.equal(revocations, 1)
  assert.ok(
    logout.headers
      .getSetCookie()
      .some((value) => /samline-identity=;.*max-age=0/i.test(value))
  )
})

test('REST auth rejects cross-origin and missing-origin mutations, token injection, wrong methods and unused native account endpoints', async () => {
  const service = external()
  const body = { email: user.email, password: 'password123' }
  for (const origin of ['https://attacker.example', ''])
    assert.equal(
      (await service.handler(request('/external/sign-in', { body, origin })))
        .status,
      403
    )
  assert.equal(
    (await service.handler(request('/external/sign-in', { method: 'GET' })))
      .status,
    405
  )
  assert.equal(
    (await service.handler(request('/sign-up/email', { body }))).status,
    404
  )
  assert.equal(
    (
      await service.handler(
        request('/update-user', { body: { roles: ['admin'] } })
      )
    ).status,
    404
  )
  assert.equal(
    (
      await service.handler(
        request('/external/sign-in', { body: { token: credential.token } })
      )
    ).status,
    400
  )
  const failed = external({
    authenticate: async () => {
      throw new Error('private-provider-detail')
    }
  })
  const response = await signIn(failed)
  assert.equal(response.status, 503)
  assert.doesNotMatch(await response.text(), /private-provider-detail/)
})

test('REST mapping validates envelopes, strips business fields, supports fixed optional renewal/revocation and constrains credentials', async () => {
  const calls = []
  const profile = {
    id: 42,
    name: user.name,
    email: user.email,
    role: 'editor',
    verified_at: '2026-10-24',
    permissions: ['posts:update'],
    subscription: { secret: 'business-data' }
  }
  const api = createRestIdentity({
    url: 'https://api.example.com/v1/',
    apiKey: 'private-service-key',
    renewPath: 'auth/refresh',
    logoutPath: 'auth/logout',
    fetcher: async (url, init) => {
      calls.push({ url: String(url), ...init })
      assert.equal(init.redirect, 'error')
      assert.ok(init.signal instanceof AbortSignal)
      return Response.json(
        url.pathname.endsWith('/profile')
          ? { success: true, data: profile }
          : {
              success: true,
              data: {
                profile,
                token: credential.token,
                refresh_token: credential.refreshToken
              }
            }
      )
    }
  })
  const login = await api.authenticate({
    email: user.email,
    password: 'password123'
  })
  assert.equal(login.user.id, '42')
  assert.equal(login.user.subscription, undefined)
  await api.profile(login.credential)
  await api.renew(login.credential)
  await api.revoke(login.credential)
  assert.equal(calls[1].headers.Authorization, 'Bearer ' + credential.token)
  assert.equal(calls[0].headers['x-api-key'], 'private-service-key')
  assert.equal(JSON.parse(calls[2].body).refresh_token, credential.refreshToken)
  for (const options of [
    { url: 'http://remote.example/' },
    { url: 'https://api.example/', profilePath: '../escape' },
    {
      url: 'https://api.example/base/',
      profilePath: 'https://attacker.example/'
    }
  ])
    assert.throws(() => createRestIdentity(options))
})

test('database-owned Better Auth uses its schema and sessions, ignores client role escalation and honors server permission changes', async () => {
  const database = new Database(':memory:')
  const config = {
    mode: 'database',
    secret,
    baseURL,
    database,
    native: { emailAndPassword: { enabled: true } }
  }
  const service = createAuthService(config)
  await (
    await getMigrations({
      database,
      user: { additionalFields: authUserFields }
    })
  ).runMigrations()
  const signup = await service.handler(
    request('/sign-up/email', {
      body: {
        email: user.email,
        password: 'password123',
        name: user.name,
        emailVerified: true,
        roles: ['admin'],
        permissions: ['users:delete']
      }
    })
  )
  assert.equal(signup.status, 200, await signup.clone().text())
  const cookie = cookies(signup)
  const state = await service.getSession(request('/get-session', { cookie }))
  assert.equal(state.user.emailVerified, false)
  assert.deepEqual(state.user.roles, [])
  assert.deepEqual(state.user.permissions, [])
  database
    .query('UPDATE user SET roles = ?, permissions = ? WHERE id = ?')
    .run(
      JSON.stringify(['editor']),
      JSON.stringify(['posts:update']),
      state.user.id
    )
  const fresh = await service.getSession(request('/get-session', { cookie }))
  assert.equal(canAccess(fresh, { permissions: ['posts:update'] }), true)
  const signout = await service.handler(
    request('/sign-out', { cookie, body: {} })
  )
  assert.equal(signout.status, 200)
  assert.equal(
    await service.getSession(request('/get-session', { cookie })),
    null
  )
  database.close()
})

test('stateless external sessions expire with upstream credentials and refresh refuses a mismatched credential cookie', async () => {
  const expired = external({
    authenticate: async () => ({
      user,
      credential: { ...credential, expiresAt: Date.now() - 1000 }
    })
  })
  assert.equal((await signIn(expired)).status, 401)
  const service = external()
  const first = cookies(await signIn(service))
  const second = cookies(await signIn(service))
  const mixed = second
    .split('; ')
    .filter((entry) => !entry.startsWith('samline-identity='))
    .concat(
      first.split('; ').find((entry) => entry.startsWith('samline-identity='))
    )
    .join('; ')
  assert.equal(
    (
      await service.handler(
        request('/external/refresh', { cookie: mixed, body: {} })
      )
    ).status,
    401
  )
  const unavailable = external({
    revoke: async () => {
      throw new Error('provider unavailable')
    }
  })
  const logout = await unavailable.handler(
    request('/external/sign-out', { cookie: first, body: {} })
  )
  assert.deepEqual(await logout.json(), { success: true, remoteRevoked: false })
})

test('authentication rate limiting applies to the trusted address instead of accepting unlimited credential attempts', async () => {
  const service = external()
  let response
  for (let index = 0; index < 6; index++) {
    const attempt = request('/external/sign-in', {
      body: { email: user.email, password: 'password123' }
    })
    attempt.headers.set('x-samline-client-ip', '192.0.2.99')
    response = await service.handler(attempt)
  }
  assert.equal(response.status, 429)
})
