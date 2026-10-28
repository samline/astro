import assert from 'node:assert/strict'
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
import { test } from 'node:test'

const root = fileURLToPath(new URL('../', import.meta.url))
const components = [
  'Box',
  'Button',
  'Captcha',
  'FaIcon',
  'Fields',
  'GTM',
  'H',
  'LanguagePicker',
  'Link',
  'PageLoader',
  'Section',
  'SEO',
  'Theme'
]

// Copy the published examples as written: no hand-maintained equivalent snippets.
const completeExamples = (markdown) =>
  [...markdown.matchAll(/```astro\n(---\n[\s\S]*?)\n```/g)].map(
    (match) => match[1]
  )

const runAstro = (directory, command) => {
  const environment = { ...process.env, NODE_ENV: 'production' }
  for (const name of Object.keys(environment))
    if (
      /^(AUTH_|CAPTCHA_|CONTENT_API_|GTM_|MAIL_|SMTP_|VERCEL_|CONTEXT$)/.test(
        name
      )
    )
      delete environment[name]
  Object.assign(environment, {
    SITE_URL: 'https://documentation.example',
    SITE_INDEXABLE: 'false',
    GTM_ENABLED: 'false',
    CAPTCHA_PROVIDER: 'turnstile',
    // Rendering only: the build never calls the SDK or verification provider.
    CAPTCHA_SITE_KEY: 'public-render-fixture-not-provider-key'
  })
  const result = spawnSync(
    process.execPath,
    [path.join(root, 'node_modules/astro/bin/astro.mjs'), command],
    {
      cwd: directory,
      encoding: 'utf8',
      timeout: 40000,
      env: environment
    }
  )
  assert.equal(result.status, 0, result.stdout + result.stderr)
  return result.stdout + result.stderr
}

test(
  'complete component README examples type-check and build as consumer sections',
  { timeout: 90000 },
  async (t) => {
    const directory = await mkdtemp(
      path.join(tmpdir(), 'samline-component-docs-')
    )
    t.after(() => rm(directory, { recursive: true, force: true }))
    for (const entry of [
      'src',
      'public',
      'astro.config.mjs',
      'tsconfig.json',
      'package.json'
    ])
      await cp(path.join(root, entry), path.join(directory, entry), {
        recursive: true
      })
    await symlink(
      path.join(root, 'node_modules'),
      path.join(directory, 'node_modules'),
      'junction'
    )

    const edit = async (file, change) => {
      const target = path.join(directory, file)
      await writeFile(target, change(await readFile(target, 'utf8')))
    }
    await edit('src/i18n/config.ts', (source) =>
      source.replace("// locales.push('es-mx')", "locales.push('es-mx')")
    )
    // This recipe explicitly requires Actions, not SMTP or an invented endpoint.
    await writeFile(
      path.join(directory, 'src/actions/index.ts'),
      "import { basic } from './basic'\nexport const server = { basic }\n"
    )

    const fieldsMarkdown = await readFile(
      path.join(root, 'src/components/Fields/README.md'),
      'utf8'
    )
    const extras = JSON.parse(
      fieldsMarkdown.match(/```json\n([\s\S]*?)\n```/)[1]
    )
    // Apply exactly the documented project customization before consuming its keys.
    await edit('src/i18n/dictionaries/en-us/forms/types.ts', (source) =>
      source.replace(
        'export interface Forms {',
        `export interface Forms {\n  examples: { ${Object.keys(extras)
          .map((key) => `${key}: string`)
          .join('; ')} }`
      )
    )
    for (const locale of ['en-us', 'es-mx', 'es-es'])
      await edit(`src/i18n/dictionaries/${locale}/forms/index.ts`, (source) =>
        source.replace(
          '\n} satisfies Forms',
          `,\n  examples: ${JSON.stringify(extras)}\n} satisfies Forms`
        )
      )

    const sectionsDirectory = path.join(directory, 'src/sections/Documentation')
    const pagesDirectory = path.join(directory, 'src/pages/examples')
    await mkdir(sectionsDirectory, { recursive: true })
    await mkdir(pagesDirectory, { recursive: true })
    const rendered = new Map()
    for (const name of components) {
      const markdown = await readFile(
        path.join(root, 'src/components', name, 'README.md'),
        'utf8'
      )
      const examples = completeExamples(markdown)
      assert.ok(examples.length > 0, `${name} needs a complete example`)
      for (const [index, source] of examples.entries()) {
        // SEO's second complete block is an actual localized page, not section UI.
        if (name === 'SEO' && source.includes('export const getStaticPaths')) {
          await writeFile(
            path.join(directory, 'src/pages/[...locale]/index.astro'),
            source
          )
          continue
        }
        const id = `${name.toLowerCase()}-${index + 1}`
        const sectionName = `${name}${index + 1}`
        await writeFile(
          path.join(sectionsDirectory, `${sectionName}.astro`),
          source
        )
        await writeFile(
          path.join(pagesDirectory, `${id}.astro`),
          `---\nimport Main from '@/layouts/Main.astro'\nimport Example from '@/sections/Documentation/${sectionName}.astro'\n---\n<Main path='/examples/${id}'><Example /></Main>\n`
        )
        if (name === 'SEO' && index === 0) {
          await mkdir(path.join(directory, 'src/sections/Overview'), {
            recursive: true
          })
          await writeFile(
            path.join(directory, 'src/sections/Overview/index.astro'),
            source
          )
        }
        rendered.set(
          id,
          path.join(
            directory,
            '.vercel/output/static/examples',
            id,
            'index.html'
          )
        )
      }
    }

    const diagnostics = runAstro(directory, 'check')
    assert.match(diagnostics, /0 errors/)
    runAstro(directory, 'build')
    const html = async (id) => readFile(rendered.get(id), 'utf8')
    assert.match(await html('box-1'), /box--narrow/)
    assert.match(await html('section-1'), /aria-labelledby="overview-title"/)
    assert.match(await html('h-1'), /<h1\b[^>]*id="page-title"/)
    assert.match(await html('link-1'), /href="\/"/)
    assert.match(await html('button-1'), /<button\b[^>]*disabled/)
    const action =
      (await html('fields-3')).match(/<button\b[^>]*type="submit"[^>]*>/g) ?? []
    assert.equal(
      action.length,
      1,
      'the Action example must render a real submit button'
    )
    assert.match(await html('faicon-1'), /<svg\b[^>]*aria-hidden="true"/)
    assert.match(await html('captcha-1'), /name="captchaToken"/)
    assert.match(await html('fields-1'), /id="contact-preview"/)
    const choices = await html('fields-2')
    assert.equal((choices.match(/type="radio"/g) ?? []).length, 2)
    assert.match(choices, /name="attachment"[^>]*type="file"/)
    assert.match(choices, /Preferred contact method/)
    assert.match(await html('fields-3'), /id="name-form"[^>]*data-error=/)
    assert.match(await html('fields-4'), /<form\b[^>]*method="get"/)
    assert.match(await html('fields-4'), /<button\b[^>]*type="submit"/)
    assert.match(await html('languagepicker-1'), /hreflang="es-mx"/)
    assert.match(await html('pageloader-1'), /href="\/\?from=loader-example"/)
    assert.match(await html('theme-1'), /data-theme-switch[^>]*hidden/)
    // GTM stays disabled without a real container; copying its button does not enable it.
    assert.match(await html('gtm-1'), /data-cookie-preferences[^>]*hidden/)
    const home = await readFile(
      path.join(directory, '.vercel/output/static/index.html'),
      'utf8'
    )
    assert.equal((home.match(/<title>/g) ?? []).length, 1)
    assert.match(home, /id="page-title"/)
  }
)
