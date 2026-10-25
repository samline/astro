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

export const createCaptchaFixture = async (provider) => {
  const directory = await realpath(
    await mkdtemp(path.join(tmpdir(), 'samline-astro-captcha-'))
  )
  try {
    await mkdir(path.join(directory, 'src/pages'), { recursive: true })
    for (const feature of ['components/Captcha', 'i18n']) {
      await cp(
        path.join(root, 'src', feature),
        path.join(directory, 'src', feature),
        { recursive: true }
      )
    }
    await writeFile(path.join(directory, 'package.json'), '{"type":"module"}')
    await symlink(
      path.join(root, 'node_modules'),
      path.join(directory, 'node_modules'),
      'junction'
    )
    await writeFile(
      path.join(directory, 'astro.config.mjs'),
      `import { defineConfig, envField } from 'astro/config'
export default defineConfig({ env: { schema: {
  CAPTCHA_PROVIDER: envField.enum({ context: 'server', access: 'public', values: ['none','turnstile','recaptcha'], default: 'none' }),
  CAPTCHA_SITE_KEY: envField.string({ context: 'server', access: 'public', optional: true }),
  CAPTCHA_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true })
} } })`
    )
    await writeFile(
      path.join(directory, 'src/pages/index.astro'),
      `---
import Captcha from '../components/Captcha/index.astro'
---
<html lang='en-us' data-theme='dark'><head><meta charset='UTF-8' /></head><body>
<form id='first'><Captcha id='first-widget' /></form>
<form id='second'><Captcha size='compact' theme='light' /></form>
</body></html>`
    )
    const result = spawnSync(
      process.execPath,
      [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'],
      {
        cwd: directory,
        encoding: 'utf8',
        timeout: 20000,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          CAPTCHA_PROVIDER: provider,
          CAPTCHA_SITE_KEY: 'public-test-site-key',
          CAPTCHA_SECRET_KEY: 'private-test-secret'
        }
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
