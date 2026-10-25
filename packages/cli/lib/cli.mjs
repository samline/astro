import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import path from 'node:path'
import {
  command as runCommand,
  detectTools,
  selectTools,
  projectTools
} from './process.mjs'
import { createProject } from './project.mjs'
import {
  addIntegrations,
  addProjectLocale,
  projectStatus,
  loadProject
} from './integrations.mjs'
import { askQuestions } from './questions.mjs'
import { features, resolveFeatures } from './features/registry.mjs'
import { localeDetails } from './locales.mjs'
import { deploymentProfile, siteOrigin } from './deployment.mjs'
import { applyFiles, serialize, json } from './files.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const help = `SAM Astro — modular project installer

Create: npx @samline/astro [folder]
Add:    npx @samline/astro add [integration...] [--cwd path]
Locale: npx @samline/astro locale add <tag> [--locale-name name] [--direction ltr|rtl]
Status: npx @samline/astro status [--cwd path]

--features        Comma-separated integration names
--deploy          static | vercel | netlify | cloudflare | custom
--locale          Default language: en-us | es-mx | es-es | custom tag
--locales         Additional preset languages, comma separated
--locale-name     Native name for a custom language
--auth-mode       external | database | oauth
--captcha-provider turnstile | recaptcha
--source          local | api | strapi | shopify | other (Content)
--collection      Collection name (posts/products by default)
--content-mode    build | live
--protocol        rest | graphql (generic API/custom service)
--service         Custom service name
--site            Production origin
--scaffold        Explicitly inactive examples when execution is unsupported
--minimal         Core only; skip interactive feature selection
--yes, -y         Use explicit flags and minimal defaults without questions
--no-install      Write files without installing dependencies
--dry-run         Inspect planned files without modifying the destination
--help, -h        Show help
--version, -v     Show version

Integrations: ${Object.keys(features).join(', ')}
`

const finish = async (
  destination,
  result,
  tools,
  { skipInstall = false, dryRun = false, install = true } = {}
) => {
  if (!result.files.length) {
    console.log('Already installed. No files changed.')
    return
  }
  console.log(
    `\n${dryRun ? 'Planned' : 'Applied'} ${result.files.length} files.${dryRun ? '\n' + result.files.map((file) => '  ' + file).join('\n') : ''}`
  )
  if (dryRun) return
  if (skipInstall) {
    console.log(
      `\nDependencies were not installed. Run ${tools.manager} install, then format the changed files with the project's Prettier. See status and installed feature READMEs for configuration/activation.`
    )
    return
  }
  if (install) {
    const execution = runCommand(tools.manager, ['install'], {
      cwd: destination,
      stdio: 'inherit'
    })
    if (execution.error || execution.status !== 0)
      throw new Error(
        `Files were applied, but dependency installation failed. Retry ${tools.manager} install in ${destination}; no configuration is marked as validated.`
      )
    const installed = await json(destination)
    installed.samlineAstro.dependenciesInstalled = true
    await applyFiles(
      destination,
      new Map([['package.json', serialize(installed)]])
    )
  }
  const paths = result.files.filter(
    (file) =>
      /\.(?:mjs|cjs|ts|astro|css|jsonc?|md|yaml)$/.test(file) &&
      !file.startsWith('.agents/skills/')
  )
  const formatter = path.join(
    destination,
    'node_modules/prettier/bin/prettier.cjs'
  )
  const format = runCommand(
    tools.runtime === 'bun' ? 'bun' : 'node',
    [
      ...(tools.runtime === 'bun' ? ['--bun'] : []),
      formatter,
      ...paths,
      '--write'
    ],
    { cwd: destination, stdio: 'inherit' }
  )
  if (format.error || format.status !== 0)
    throw new Error(
      'Files were applied; formatting failed. Install dependencies and format the changed files before continuing.'
    )
  console.log(
    `\nReady to configure in ${destination}. Installation does not connect real providers, run migrations or deploy.`
  )
}

export const main = async (args = process.argv.slice(2)) => {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
      yes: { type: 'boolean', short: 'y' },
      minimal: { type: 'boolean' },
      'no-install': { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      scaffold: { type: 'boolean' },
      deploy: { type: 'string' },
      site: { type: 'string' },
      features: { type: 'string' },
      locale: { type: 'string' },
      locales: { type: 'string' },
      'locale-name': { type: 'string' },
      direction: { type: 'string' },
      'auth-mode': { type: 'string' },
      'captcha-provider': { type: 'string' },
      source: { type: 'string' },
      collection: { type: 'string' },
      'content-mode': { type: 'string' },
      protocol: { type: 'string' },
      service: { type: 'string' },
      cwd: { type: 'string' }
    }
  })
  const pkg = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8')
  )
  if (values.version) return console.log(pkg.version)
  if (values.help) return console.log(help)
  const template = path.join(root, 'template')
  const subcommand = ['add', 'locale', 'status'].includes(positionals[0])
    ? positionals.shift()
    : 'create'
  const destination = path.resolve(values.cwd ?? '.')
  const dryRun = Boolean(values['dry-run'])
  if (subcommand === 'status') {
    if (positionals.length) throw new Error('Use status --cwd <project>.')
    return console.log(
      JSON.stringify(await projectStatus(destination, pkg.version), null, 2)
    )
  }
  if (subcommand === 'locale') {
    if (positionals.shift() !== 'add' || positionals.length !== 1)
      throw new Error(
        'Use locale add <tag> [--locale-name name] [--direction ltr|rtl].'
      )
    let entryOptions = {
      localeName: values['locale-name'],
      direction: values.direction
    }
    if (process.stdin.isTTY && !values.yes)
      entryOptions = (
        await askQuestions({
          command: 'locale',
          requested: [],
          locale: positionals[0],
          options: entryOptions
        })
      ).options
    const entry = localeDetails(
      positionals[0],
      entryOptions.localeName,
      entryOptions.direction
    )
    const result = await addProjectLocale({
      root: destination,
      kitVersion: pkg.version,
      entry,
      dryRun
    })
    await finish(destination, result, result.manifest.samlineAstro.tools, {
      skipInstall: values['no-install'],
      dryRun,
      install: false
    })
    if (result.files.length)
      console.log(
        'Dictionary keys were scaffolded with empty translations. No content was added. Complete translations and explicitly enable the language in src/i18n/config.ts.'
      )
    return
  }
  let requested =
    values.features === undefined
      ? undefined
      : values.features
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
  let options = Object.fromEntries(
    Object.entries({
      authMode: values['auth-mode'],
      captchaProvider: values['captcha-provider'],
      contentSource: values.source,
      collection: values.collection,
      contentMode: values['content-mode'],
      protocol: values.protocol,
      service: values.service,
      scaffold: values.scaffold
    }).filter(([, value]) => value !== undefined)
  )
  let directory = subcommand === 'create' ? positionals[0] : undefined
  if (subcommand === 'create' && positionals.length > 1)
    throw new Error('Provide one destination directory.')
  let deployment = values.deploy
  if (deployment) deploymentProfile(deployment)
  siteOrigin(values.site)
  let locale = values.locale
  let additionalLocales = (values.locales ?? '').split(',').filter(Boolean)
  if (subcommand === 'add' && positionals.length)
    requested = [...positionals, ...(requested ?? [])]
  if (requested) resolveFeatures(requested)
  const current =
    subcommand === 'add' ? await loadProject(destination, pkg.version) : null
  if (current) {
    deployment = current.samlineAstro.deployment
    options = { ...current.samlineAstro.options, ...options }
  }
  if (subcommand === 'add' && requested?.includes('content')) {
    options.contentSource = values.source
    options.collection = values.collection
    options.contentMode = values['content-mode']
    options.protocol = values.protocol
    options.service = values.service
  }
  const interactive = process.stdin.isTTY && !values.yes && !values.minimal
  if (interactive) {
    const answers = await askQuestions({
      command: subcommand,
      directory,
      requested,
      options: {
        ...options,
        localeName: values['locale-name'],
        direction: values.direction
      },
      deployment,
      locale,
      additionalLocales,
      installed: current?.samlineAstro.features
    })
    ;({ directory, requested, options, deployment, locale, additionalLocales } =
      answers)
  } else {
    if (
      subcommand === 'create' &&
      (!directory || (!deployment && !values.yes && !values.minimal))
    )
      throw new Error(
        'Without a terminal provide a directory and --deploy, or use --minimal/--yes.'
      )
    if (subcommand === 'add' && requested === undefined)
      throw new Error('Specify integrations, for example add forms.')
    requested ??= []
    deployment ??= 'vercel'
    locale ??= 'en-us'
  }
  if (values.minimal && requested?.length)
    throw new Error('--minimal cannot be combined with optional integrations.')
  const tools = current ? projectTools(current) : selectTools(detectTools())
  if (!['pnpm', 'npm'].includes(tools.manager))
    throw new Error(
      'Existing project must declare pnpm or npm; add will not switch package managers.'
    )
  const resolved = resolveFeatures(requested)
  console.log(
    `\nConfiguration: ${deployment}; install with ${tools.manager}; scripts with ${tools.runtime === 'bun' ? 'Bun' : 'Node / npm'}.`
  )
  console.log(
    'Integrations: ' +
      (resolved.length
        ? resolved
            .map(
              (name) =>
                features[name].label +
                (requested.includes(name) ? '' : ' (required dependency)')
            )
            .join(', ')
        : 'core only')
  )
  if (resolved.includes('mail'))
    console.log(
      'Mail includes the contact Action example; configure SMTP before sending.'
    )
  if (resolved.includes('content'))
    console.log(
      `Content: ${options.contentSource}, ${options.contentMode ?? 'build'}; remote examples require explicit configuration and activation.`
    )
  const result =
    subcommand === 'create'
      ? await createProject({
          template,
          destination: path.resolve(directory),
          tools,
          kitVersion: pkg.version,
          deployment,
          site: values.site,
          features: requested,
          locale,
          additionalLocales,
          localeName: values['locale-name'] ?? options.localeName,
          direction: values.direction ?? options.direction,
          dryRun,
          ...options
        })
      : await addIntegrations({
          root: destination,
          template,
          kitVersion: pkg.version,
          requested,
          options,
          dryRun
        })
  await finish(
    subcommand === 'create' ? path.resolve(directory) : destination,
    result,
    tools,
    { skipInstall: values['no-install'], dryRun }
  )
}
