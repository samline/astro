import { projectTools } from './process.mjs'
import {
  features,
  resolveFeatures,
  domainsFor,
  validateOptions
} from './features/registry.mjs'
import { copyPayload } from './project.mjs'
import {
  mountLayout,
  addedDemoLayout,
  mergeAuthMiddleware,
  addContactCaptcha,
  addContactCaptchaSchema,
  actionRegistrations
} from './features/composition.mjs'
import { contentFiles } from './features/content.mjs'
import {
  addDomains,
  addLocale,
  readLocaleConfig,
  addDemoRoutes
} from './locales.mjs'
import { environmentExample, mergeEnvironment } from './environment.mjs'
import { appendProperties, envSchema, parse, variable } from './syntax.mjs'
import { integrationSummary } from './agents.mjs'
import {
  applyFiles,
  read,
  json,
  exists,
  serialize,
  createReader
} from './files.mjs'

export const loadProject = async (
  root,
  kitVersion,
  readCurrent = (file) => read(root, file)
) => {
  const manifest = JSON.parse(await readCurrent('package.json'))
  const metadata = manifest.samlineAstro
  if (
    metadata?.schema !== 1 ||
    metadata.recipeVersion !== 1 ||
    !Array.isArray(metadata.features) ||
    !Array.isArray(metadata.locales)
  )
    throw new Error(
      'This project predates modular installer metadata. Review/adopt its integrations explicitly before using add; no files were changed.'
    )
  if (
    metadata.version?.split('.')[0] !== kitVersion.split('.')[0] ||
    manifest.dependencies?.astro?.match(/\d+/)?.[0] !== '7'
  )
    throw new Error(
      'Unsupported project/recipe Astro version. No automatic framework upgrade is performed.'
    )
  resolveFeatures(metadata.features)
  metadata.tools = projectTools(manifest)
  return manifest
}

const addDependencies = (manifest, source, selected, options) => {
  const dependencies = [
    ...selected.flatMap((name) => features[name].dependencies ?? [])
  ]
  const devDependencies = [
    ...selected.flatMap((name) => features[name].devDependencies ?? [])
  ]
  if (selected.includes('auth') && options.authMode === 'database') {
    dependencies.push('pg')
    devDependencies.push('@types/pg')
  }
  for (const [field, names] of [
    ['dependencies', dependencies],
    ['devDependencies', devDependencies]
  ]) {
    manifest[field] ??= {}
    for (const name of names) {
      const current = manifest[field][name]
      const target = source[field][name]
      if (current) {
        const old = current
          .match(/\d+\.\d+\.\d+/)?.[0]
          ?.split('.')
          .map(Number)
        const next = target
          .match(/\d+\.\d+\.\d+/)?.[0]
          ?.split('.')
          .map(Number)
        if (
          !old ||
          old[0] !== next[0] ||
          old[1] < next[1] ||
          (old[1] === next[1] && old[2] < next[2])
        )
          throw new Error(
            `Review existing ${name}@${current} against recipe ${target}; it will not be silently replaced.`
          )
      } else manifest[field][name] = target
    }
  }
}

const mergeEnvExample = (current, incoming) => {
  const names = new Set(
    [...current.matchAll(/^(?:# )?([A-Z_]+)=/gm)].map((item) => item[1])
  )
  const lines = incoming.split('\n').filter((line) => {
    const match = line.match(/^(?:# )?([A-Z_]+)=/)
    return match && !names.has(match[1])
  })
  return lines.length
    ? current.trimEnd() +
        '\n\n# Added integration settings. Configure real values in ignored environment files.\n' +
        lines.join('\n') +
        '\n'
    : current
}

const sourceEnv = (config, prefix) =>
  appendProperties(
    config,
    envSchema(config),
    Object.fromEntries(
      ['URL', 'ENDPOINT', 'TOKEN'].map((name) => [
        `${prefix}_${name}`,
        "envField.string({ context: 'server', access: 'secret', optional: true })"
      ])
    )
  )

const planContext = async (root, files, capture) => {
  if (
    files.has('.agents/memory/integrations.md') &&
    (await exists(root, '.agents/memory/integrations.md'))
  )
    await capture.read('.agents/memory/integrations.md')
  return new Map([
    ...capture.expected,
    ...[...files.keys()]
      .filter((file) => !capture.expected.has(file))
      .map((file) => [file, null])
  ])
}

export const addIntegrations = async ({
  root,
  template,
  kitVersion,
  requested,
  options = {},
  dryRun = false
}) => {
  const capture = createReader(root)
  const readCurrent = capture.read
  const manifest = await loadProject(root, kitVersion, readCurrent)
  const metadata = manifest.samlineAstro
  const selected = resolveFeatures(requested)
  const added = selected.filter((name) => !metadata.features.includes(name))
  const effective = { ...metadata.options, ...options }
  if (
    selected.includes('auth') &&
    metadata.features.includes('auth') &&
    effective.authMode !== metadata.options.authMode
  )
    throw new Error(
      'Changing an installed authentication mode needs explicit configuration review; add will not replace it.'
    )
  if (
    selected.includes('captcha') &&
    metadata.features.includes('captcha') &&
    effective.captchaProvider !== metadata.options.captchaProvider
  )
    throw new Error(
      'Changing an installed CAPTCHA provider needs explicit configuration review.'
    )
  const addingContent = selected.includes('content')
  const collectionName =
    effective.collection ??
    (effective.contentSource === 'shopify' ? 'products' : 'posts')
  const existing =
    addingContent &&
    metadata.collections.find((item) => item.name === collectionName)
  if (
    existing &&
    (existing.source !== effective.contentSource ||
      existing.mode !== (effective.contentMode ?? 'build'))
  )
    throw new Error(`Collection name conflict: ${collectionName}`)
  const addCollection = addingContent && !existing
  if (!added.length && !addCollection) return { files: [], manifest }
  validateOptions(
    [...new Set([...added, ...(addCollection ? ['content'] : [])])],
    effective,
    metadata.deployment
  )
  if (added.includes('welcome')) {
    if (!(await exists(root, 'src/i18n/route-tables.ts')))
      throw new Error(
        'Welcome requires the per-locale route-table contract. Merge the documented routing source manually before retrying; no project files were changed.'
      )
    const layout = await readCurrent('src/layouts/Main.astro')
    const markup = layout
      .replace(/^---\r?\n[\s\S]*?\r?\n---/, '')
      .replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    const slots = markup.match(/<slot\b[^>]*>/g) ?? []
    for (const name of ['header', 'footer'])
      if (
        slots.filter((slot) =>
          new RegExp(`\\sname\\s*=\\s*(['"])${name}\\1`).test(slot)
        ).length !== 1
      )
        throw new Error(
          `The welcome demo needs one static ${name} slot in src/layouts/Main.astro. Review the layout and add named header/footer slots around main before retrying; no files were changed.`
        )
  }
  const total = resolveFeatures([...metadata.features, ...added])
  const files = await copyPayload(
    template,
    added.flatMap((name) => features[name].files),
    total,
    effective
  )
  if (added.includes('welcome')) {
    files.set('src/layouts/Demo.astro', addedDemoLayout)
    const route = 'src/pages/[...locale]/demo.astro'
    const source = await read(template, route)
    files.set(
      route,
      source.replace('@/layouts/Main.astro', '@/layouts/Demo.astro')
    )
  }
  if (added.includes('auth') && (await exists(root, 'src/middleware.ts')))
    files.set(
      'src/middleware.ts',
      mergeAuthMiddleware(await readCurrent('src/middleware.ts'))
    )
  for (const file of files.keys())
    if (
      (await exists(root, file)) &&
      !(file === 'src/middleware.ts' && capture.expected.has(file))
    )
      throw new Error(
        `File conflict: ${file}. Review the existing file; add never overwrites feature source.`
      )
  if (added.includes('welcome'))
    for (const [file, value] of await addDemoRoutes(root, readCurrent))
      files.set(file, value)
  for (const [file, value] of await addDomains(
    root,
    template,
    domainsFor(total),
    metadata,
    readCurrent
  ))
    files.set(file, value)
  addDependencies(manifest, await json(template), added, effective)
  let config = await mergeEnvironment(
    await readCurrent('astro.config.mjs'),
    template,
    added,
    effective
  )
  if (added.some((name) => ['themes', 'gtm', 'pageloader'].includes(name)))
    files.set(
      'src/layouts/Main.astro',
      mountLayout(await readCurrent('src/layouts/Main.astro'), added)
    )
  if (added.includes('auth')) {
    const inactive =
      metadata.deployment === 'static' ||
      (metadata.deployment === 'cloudflare' &&
        effective.authMode === 'database' &&
        effective.scaffold)
    files.set(
      `src/pages/api/auth/[...all].ts${inactive ? '.example' : ''}`,
      await read(template, 'src/pages/api/auth/[...all].ts.example')
    )
    if (effective.authMode === 'database') {
      files.set(
        'scripts/auth-migrate.mjs',
        await read(template, 'scripts/auth-migrate.mjs')
      )
      manifest.scripts['auth:migrate'] =
        `${metadata.tools.runtime === 'bun' ? 'bun' : 'node'} scripts/auth-migrate.mjs`
    }
  }
  if (added.includes('captcha') && metadata.features.includes('mail')) {
    files.set(
      'src/actions/contact/index.ts',
      addContactCaptcha(await readCurrent('src/actions/contact/index.ts'))
    )
    files.set(
      'src/actions/contact/schema.ts',
      addContactCaptchaSchema(
        await readCurrent('src/actions/contact/schema.ts'),
        await read(template, 'src/actions/contact/schema.ts')
      )
    )
  }
  if (added.includes('mail') || added.includes('actions')) {
    const active = (await exists(root, 'src/actions/index.ts'))
      ? await readCurrent('src/actions/index.ts')
      : null
    const inactive = (await exists(root, 'src/actions/index.ts.example'))
      ? await readCurrent('src/actions/index.ts.example')
      : null
    for (const [file, value] of actionRegistrations(
      active,
      inactive,
      [
        ...(added.includes('actions') ? ['basic'] : []),
        ...(added.includes('mail') ? ['contact'] : [])
      ],
      metadata.deployment
    ))
      files.set(file, value)
  }
  let env = await environmentExample(
    template,
    added,
    effective,
    metadata.deployment,
    metadata.tools
  )
  if (addCollection) {
    const content = await contentFiles(
      root,
      template,
      effective,
      metadata.locales,
      { adding: true, readCurrent }
    )
    for (const [file, value] of content.files) {
      if (
        !['src/content.config.ts', 'src/live.config.ts.example'].includes(
          file
        ) &&
        (await exists(root, file))
      )
        throw new Error(`Collection file conflict: ${file}`)
      files.set(file, value)
    }
    metadata.collections.push(content.collection)
    if (content.collection.source !== 'local') {
      config = sourceEnv(config, content.prefix)
      env +=
        '\n' +
        content.files.get(`src/content/${content.collection.name}/.env.example`)
    }
  }
  files.set('astro.config.mjs', config)
  files.set(
    '.env.example',
    mergeEnvExample(await readCurrent('.env.example'), env)
  )
  if (metadata.deployment === 'cloudflare')
    files.set(
      '.dev.vars.example',
      mergeEnvExample(await readCurrent('.dev.vars.example'), env)
    )
  metadata.features = total
  metadata.options = effective
  metadata.dependenciesInstalled = false
  metadata.files = [...new Set([...(metadata.files ?? []), ...files.keys()])]
  files.set(
    '.agents/memory/integrations.md',
    '# Installed integrations\n\n' + integrationSummary(metadata)
  )
  files.set('package.json', serialize(manifest))
  const changed = await applyFiles(root, files, {
    dryRun,
    expected: await planContext(root, files, capture)
  })
  return { files: changed, manifest }
}

export const addProjectLocale = async ({
  root,
  kitVersion,
  entry,
  dryRun = false
}) => {
  const capture = createReader(root)
  const manifest = await loadProject(root, kitVersion, capture.read)
  const files = await addLocale(
    root,
    entry,
    manifest.samlineAstro,
    capture.read
  )
  if (!files.size) return { files: [], manifest }
  for (const file of files.keys())
    if (
      file.startsWith(`src/i18n/dictionaries/${entry.code}/`) &&
      (await exists(root, file))
    )
      throw new Error(`Locale file conflict: ${file}`)
  files.set(
    '.agents/memory/integrations.md',
    '# Installed integrations\n\n' + integrationSummary(manifest.samlineAstro)
  )
  manifest.samlineAstro.files = [
    ...new Set([...(manifest.samlineAstro.files ?? []), ...files.keys()])
  ]
  files.set('package.json', serialize(manifest))
  return {
    files: await applyFiles(root, files, {
      dryRun,
      expected: await planContext(root, files, capture)
    }),
    manifest
  }
}

export const projectStatus = async (root, kitVersion) => {
  const manifest = await loadProject(root, kitVersion)
  const metadata = manifest.samlineAstro
  const missing = []
  for (const file of metadata.files ?? [])
    if (!(await exists(root, file))) missing.push(file)
  const current = readLocaleConfig(await read(root, 'src/i18n/config.ts'))
  return {
    features: metadata.features,
    available: current.available,
    active: current.active,
    pending: current.available.filter((code) => !current.active.includes(code)),
    collections: await Promise.all(
      metadata.collections.map(async (item) => {
        const config =
          item.mode === 'live' ? 'src/live.config.ts' : 'src/content.config.ts'
        let registered = false
        if (await exists(root, config)) {
          try {
            registered = variable(
              parse(await read(root, config)),
              'collections'
            ).properties.some(
              (property) =>
                property.name?.getText().replace(/['"]/g, '') === item.name
            )
          } catch {
            registered = 'manual review required'
          }
        }
        return { ...item, registered, credentials: 'not inspected' }
      })
    ),
    dependenciesInstalled: metadata.dependenciesInstalled,
    missing,
    configuration:
      'Read installed feature docs and .env.example; runtime credentials are not inspected or printed.'
  }
}
