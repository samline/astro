import { lstat, readFile, readdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  configureAgents,
  agentContextFiles,
  agentSkillNames
} from './agents.mjs'
import {
  buildCommand,
  configureDeployment,
  deploymentGuide,
  deploymentManifest,
  deploymentProfile,
  siteOrigin
} from './deployment.mjs'
import {
  features,
  coreFiles,
  resolveFeatures,
  domainsFor,
  environmentNames,
  validateOptions
} from './features/registry.mjs'
import {
  coreLayout,
  welcomeSection,
  authSettings,
  contactWithoutCaptcha,
  contactSchemaWithoutCaptcha,
  actionRegistrations
} from './features/composition.mjs'
import { contentFiles } from './features/content.mjs'
import { initialLocales, localeDetails } from './locales.mjs'
import { environmentExample, withoutTrackingImport } from './environment.mjs'
import {
  selectEnvironment,
  appendProperties,
  envSchema,
  removeImports
} from './syntax.mjs'
import { applyFiles, listFiles, read, json, serialize } from './files.mjs'

export const projectName = (destination) => {
  const name = path.basename(destination).toLowerCase().replace(/\s+/g, '-')
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name) || name.length > 214)
    throw new Error('Use a folder name such as my-project.')
  return name
}

export const projectManifest = (
  source,
  name,
  tools,
  kitVersion,
  deployment,
  selected
) => {
  const bun = tools.runtime === 'bun'
  const astro =
    deployment === 'cloudflare'
      ? 'node ./node_modules/astro/bin/astro.mjs'
      : bun
        ? 'bun --bun ./node_modules/astro/bin/astro.mjs'
        : 'astro'
  const prettier = bun
    ? 'bun --bun ./node_modules/prettier/bin/prettier.cjs'
    : 'prettier'
  const dependencies = Object.fromEntries(
    [
      'astro',
      '@astrojs/sitemap',
      '@fontsource-variable/inter',
      ...selected.flatMap((name) => features[name].dependencies ?? [])
    ].map((name) => [name, source.dependencies[name]])
  )
  const devDependencies = { ...source.devDependencies }
  delete devDependencies['@types/pg']
  delete devDependencies['@types/nodemailer']
  for (const name of selected.flatMap(
    (feature) => features[feature].devDependencies ?? []
  ))
    devDependencies[name] = source.devDependencies[name]
  return {
    name,
    type: 'module',
    version: '0.0.1',
    private: true,
    packageManager: `${tools.manager}@${tools.managerVersion}`,
    engines: {
      node: source.engines.node,
      ...(bun ? { bun: source.engines.bun } : {})
    },
    scripts: {
      preinstall: 'node scripts/check-package-manager.mjs',
      dev: `${astro} dev --background`,
      build: `${astro} build`,
      preview: `${astro} preview`,
      astro,
      check: `${astro} check`,
      'check:i18n': `${bun ? 'bun' : 'node'} scripts/check-i18n.mjs`,
      format: `${prettier} . --write`,
      'format:check': `${prettier} . --check`,
      verify: `${tools.runner} run format:check && ${buildCommand(tools)}`
    },
    dependencies,
    devDependencies,
    samlineAstro: {
      version: kitVersion,
      schema: 1,
      recipeVersion: 1,
      features: selected,
      tools
    }
  }
}

export const copyPayload = async (template, prefixes, selected, options) => {
  const files = new Map()
  const add = async (prefix) => {
    const stat = await lstat(path.join(template, prefix))
    if (stat.isSymbolicLink())
      throw new Error(`Unexpected template symlink: ${prefix}`)
    if (stat.isDirectory())
      for (const child of await listFiles(template, prefix)) await add(child)
    else {
      if (
        prefix.startsWith('src/server/auth/providers/') &&
        prefix !== `src/server/auth/providers/${options.authMode}.ts`
      )
        return
      if (prefix === 'src/server/auth/settings.ts')
        files.set(prefix, await authSettings(template, options.authMode))
      else if (prefix === 'src/sections/Welcome/index.astro')
        files.set(prefix, await welcomeSection(template, selected))
      else if (
        prefix === 'src/actions/contact/index.ts' &&
        !selected.includes('captcha')
      )
        files.set(prefix, contactWithoutCaptcha(await read(template, prefix)))
      else if (
        prefix === 'src/actions/contact/schema.ts' &&
        !selected.includes('captcha')
      )
        files.set(
          prefix,
          contactSchemaWithoutCaptcha(await read(template, prefix))
        )
      else
        files.set(
          prefix === '_gitignore' ? '.gitignore' : prefix,
          await readFile(path.join(template, prefix))
        )
    }
  }
  for (const prefix of prefixes) await add(prefix)
  return files
}

export const createProject = async ({
  template,
  destination,
  tools,
  kitVersion,
  deployment = 'vercel',
  site,
  features: requested = [],
  locale = 'en-us',
  additionalLocales = [],
  localeName,
  direction = 'ltr',
  dryRun = false,
  ...options
}) => {
  deploymentProfile(deployment)
  const origin = siteOrigin(site)
  const name = projectName(destination)
  const selected = resolveFeatures(requested)
  validateOptions(selected, options, deployment)
  const entries = [
    localeDetails(locale, localeName, direction),
    ...additionalLocales.map((item) =>
      typeof item === 'string'
        ? localeDetails(item)
        : localeDetails(item.code, item.name, item.direction)
    )
  ]
  if (new Set(entries.map((item) => item.code)).size !== entries.length)
    throw new Error('Duplicate locales are not allowed.')
  const existing = await lstat(destination).catch((error) => {
    if (error.code !== 'ENOENT') throw error
    return null
  })
  if (
    existing &&
    (!existing.isDirectory() || (await readdir(destination)).length)
  )
    throw new Error(`Destination exists and is not empty: ${destination}`)
  const stage = await mkdtemp(path.join(tmpdir(), 'samline-create-'))
  try {
    const payload = await copyPayload(
      template,
      [...coreFiles, ...selected.flatMap((name) => features[name].files)],
      selected,
      options
    )
    for (const [file, content] of await initialLocales(
      template,
      entries,
      entries[0].code,
      domainsFor(selected)
    ))
      payload.set(file, content)
    payload.set('src/layouts/Main.astro', await coreLayout(template, selected))
    if (!selected.includes('faicon')) {
      const file = 'src/sections/NotFound/NotFoundContent.astro'
      let value = await read(template, file)
      const end = value.indexOf('\n---', 4)
      value =
        '---\n' +
        removeImports(value.slice(4, end), [
          '@/components/FaIcon/index.astro',
          '@fortawesome/free-solid-svg-icons/faArrowLeft'
        ]) +
        value.slice(end)
      payload.set(file, value.replace('  <FaIcon icon={faArrowLeft} />', ''))
    }
    const section = selected.includes('welcome') ? 'Welcome' : 'Home'
    payload.set(
      `src/sections/${section}/index.astro`,
      await welcomeSection(template, selected)
    )
    if (section === 'Home')
      payload.set(
        'src/pages/[...locale]/index.astro',
        (await read(template, 'src/pages/[...locale]/index.astro')).replaceAll(
          'Welcome',
          'Home'
        )
      )
    let config = selectEnvironment(
      await read(template, 'astro.config.mjs'),
      new Set(environmentNames(selected, options))
    )
    if (!selected.includes('gtm')) config = withoutTrackingImport(config)
    payload.set('astro.config.mjs', config)
    const manifest = deploymentManifest(
      projectManifest(
        await json(template),
        name,
        tools,
        kitVersion,
        deployment,
        selected
      ),
      deployment,
      tools
    )
    Object.assign(manifest.samlineAstro, {
      locales: entries,
      options,
      collections: [],
      dependenciesInstalled: false
    })
    if (selected.includes('auth')) {
      const route =
        'src/pages/api/auth/[...all].ts' +
        (deployment === 'static' ||
        (deployment === 'cloudflare' &&
          options.authMode === 'database' &&
          options.scaffold)
          ? '.example'
          : '')
      payload.set(
        route,
        await read(template, 'src/pages/api/auth/[...all].ts.example')
      )
      if (options.authMode === 'database') {
        const original = await json(template)
        manifest.dependencies.pg = original.dependencies.pg
        manifest.devDependencies['@types/pg'] =
          original.devDependencies['@types/pg']
        manifest.scripts['auth:migrate'] =
          `${tools.runtime === 'bun' ? 'bun' : 'node'} scripts/auth-migrate.mjs`
        payload.set(
          'scripts/auth-migrate.mjs',
          await read(template, 'scripts/auth-migrate.mjs')
        )
      }
    }
    for (const [file, value] of actionRegistrations(
      null,
      null,
      [
        ...(selected.includes('actions') ? ['basic'] : []),
        ...(selected.includes('mail') ? ['contact'] : [])
      ],
      deployment
    ))
      payload.set(file, value)
    if (selected.includes('content')) {
      const content = await contentFiles(stage, template, options, entries)
      for (const [file, value] of content.files) payload.set(file, value)
      manifest.samlineAstro.collections.push(content.collection)
      if (content.collection.source !== 'local') {
        payload.set(
          'astro.config.mjs',
          appendProperties(
            payload.get('astro.config.mjs'),
            envSchema(payload.get('astro.config.mjs')),
            Object.fromEntries(
              ['URL', 'ENDPOINT', 'TOKEN'].map((key) => [
                `${content.prefix}_${key}`,
                "envField.string({ context: 'server', access: 'secret', optional: true })"
              ])
            )
          )
        )
      }
    }
    payload.set(
      'src/components/README.md',
      `# Components\n\nEach reusable component owns its source and English API documentation.\n\n${['Box', 'Section', 'Link', 'Button', 'H', 'SEO', ...selected.flatMap((feature) => ({ themes: ['Theme'], gtm: ['GTM'], fields: ['Fields'], captcha: ['Captcha'], 'language-picker': ['LanguagePicker'], pageloader: ['PageLoader'], faicon: ['FaIcon'] })[feature] ?? [])].map((item) => `- [${item}](./${item}/README.md)`).join('\n')}\n`
    )
    manifest.samlineAstro.files = [...payload.keys()].filter(
      (file) => file.startsWith('src/') || file.startsWith('scripts/')
    )
    payload.set('package.json', serialize(manifest))
    for (const file of [
      ...agentContextFiles,
      'skills-lock.json',
      '.agents/skills/README.md',
      ...agentSkillNames.map((skill) => `.agents/skills/${skill}`)
    ]) {
      const stat = await lstat(path.join(template, file))
      if (stat.isDirectory())
        for (const child of await listFiles(template, file))
          payload.set(child, await readFile(path.join(template, child)))
      else payload.set(file, await readFile(path.join(template, file)))
    }
    await applyFiles(stage, payload)
    await configureDeployment(stage, deployment, tools, name, origin)
    let env = await environmentExample(
      template,
      selected,
      options,
      deployment,
      tools
    )
    for (const [file, value] of payload)
      if (file.startsWith('src/content/') && file.endsWith('/.env.example'))
        env += '\n' + value
    await applyFiles(
      stage,
      new Map([
        ['.env.example', env],
        ['.env.development', env],
        ...(deployment === 'cloudflare' ? [['.dev.vars.example', env]] : [])
      ])
    )
    if (deployment === 'vercel') {
      const config = await json(stage, 'vercel.json')
      Object.assign(config, {
        installCommand:
          tools.manager === 'pnpm'
            ? 'pnpm install --frozen-lockfile'
            : 'npm ci',
        buildCommand: buildCommand(tools),
        devCommand: `${tools.runner} run astro dev`
      })
      if (tools.runtime !== 'bun') delete config.bunVersion
      await applyFiles(stage, new Map([['vercel.json', serialize(config)]]))
    }
    await configureAgents(stage, { name, tools, kitVersion, deployment })
    const launch = await json(stage, '.vscode/launch.json')
    launch.configurations[0].command = `${tools.runner} run dev`
    await applyFiles(
      stage,
      new Map([
        ['.vscode/launch.json', serialize(launch)],
        [
          'scripts/check-package-manager.mjs',
          `if (!process.env.npm_config_user_agent?.startsWith('${tools.manager}/')) {\n console.error('Install dependencies with ${tools.manager} install.'); process.exit(1)\n}\n`
        ],
        ['README.md', projectReadme(manifest, tools, deployment)]
      ])
    )
    const finalFiles = new Map()
    for (const file of await listFiles(stage))
      finalFiles.set(file, await readFile(path.join(stage, file)))
    const changed = await applyFiles(destination, finalFiles, {
      dryRun,
      expected: new Map([...finalFiles.keys()].map((file) => [file, null]))
    })
    return { name, destination, files: changed, manifest }
  } finally {
    await rm(stage, { recursive: true, force: true })
  }
}

export const projectReadme = (manifest, tools, deployment) =>
  `# ${manifest.name}\n\nCreated with SAM Astro ${manifest.samlineAstro.version}. Public output is SSG.\n\n## Commands\n\n\`\`\`sh\n${tools.manager} install\n${tools.runner} run dev\n${tools.runner} run verify\n\`\`\`\n\n## Initial integrations\n\n${manifest.samlineAstro.features.length ? manifest.samlineAstro.features.map((name) => `- ${features[name].label}`).join('\n') : 'Core only; no optional integrations installed.'}\n\nDefault language: ${manifest.samlineAstro.locales[0].code}. Read src/i18n/config.ts\nfor active languages. New language scaffolds contain empty translations and stay\ninactive until completed. Locale addition creates no content entries.\n\n\`\`\`sh\nnpx @samline/astro add\nnpx @samline/astro status\nnpx @samline/astro locale add es-mx\n\`\`\`\n\nFor the current inventory read .agents/memory/integrations.md or run status.\nInstalled does not mean configured. Follow the installed feature README and\n.env.example; keep real secrets in ignored local files or provider settings.\nUnconfigured remote collections remain inactive; each has registration instructions.\n\n## Deployment\n\n${deploymentGuide(deployment, tools)}\n\n## Agent context\n\nRead AGENTS.md and .agents/README.md. Components document their API alongside\nthe source. This project evolves independently of the generator; add never\nautomatically upgrades Astro or replaces custom code.\n`
