import { readFile, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'

export const deployments = {
  static: { label: 'Estático (sin servidor ni Server Islands)' },
  vercel: {
    label: 'Vercel',
    adapter: '@astrojs/vercel',
    version: '11.0.16',
    identifier: 'vercel',
    options: '{ imageService: false }'
  },
  netlify: {
    label: 'Netlify',
    adapter: '@astrojs/netlify',
    version: '8.2.10',
    identifier: 'netlify',
    options: '{ imageCDN: false }'
  },
  cloudflare: {
    label: 'Cloudflare Workers',
    adapter: '@astrojs/cloudflare',
    version: '14.4.2',
    identifier: 'cloudflare',
    options: "{ imageService: 'compile' }"
  },
  custom: {
    label: 'Custom (servidor propio, Node standalone)',
    adapter: '@astrojs/node',
    version: '11.1.9',
    identifier: 'node',
    options: "{ mode: 'standalone' }"
  }
}

export const deploymentProfile = (deployment) => {
  if (!Object.hasOwn(deployments, deployment)) {
    throw new Error(
      'Despliegue inválido. Usa static, vercel, netlify, cloudflare o custom.'
    )
  }
  return deployments[deployment]
}

export const siteOrigin = (value) => {
  if (!value) return undefined
  const url = new URL(value)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'SITE_URL debe ser un origen HTTP(S), por ejemplo https://example.com.'
    )
  }
  return url.origin
}

// Fail visibly if the maintained base changes, rather than emit a partial config.
const replace = (source, previous, next) => {
  if (!source.includes(previous))
    throw new Error(
      'La configuración base cambió. Actualiza el generador de despliegues.'
    )
  return source.replace(previous, next)
}

const astroDeploymentConfig = (source, deployment) => {
  const profile = deploymentProfile(deployment)
  let config = replace(
    source,
    "import vercel from '@astrojs/vercel'\n",
    profile.adapter
      ? `import ${profile.identifier} from '${profile.adapter}'\n`
      : ''
  )
  config = replace(
    config,
    '  adapter: vercel({ imageService: false }),\n',
    profile.adapter
      ? `  adapter: ${profile.identifier}(${profile.options}),\n`
      : ''
  )
  const start = 'const site =\n'
  const end = '\n\nconst indexable ='
  const from = config.indexOf(start)
  const to = config.indexOf(end, from)
  if (from < 0 || to < 0)
    throw new Error('No se encontró la configuración de SITE_URL en la base.')
  const fallback =
    deployment === 'vercel'
      ? "(env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:4321')"
      : deployment === 'netlify'
        ? "env.URL || 'http://localhost:4321'"
        : "'http://localhost:4321'"
  config =
    config.slice(0, from) +
    `const site = env.SITE_URL || ${fallback}` +
    config.slice(to)
  return config
}

export const deploymentManifest = (manifest, deployment, tools) => {
  const profile = deploymentProfile(deployment)
  const dependencies = { ...manifest.dependencies }
  for (const item of Object.values(deployments))
    if (item.adapter) delete dependencies[item.adapter]
  if (profile.adapter) dependencies[profile.adapter] = profile.version
  manifest.dependencies = dependencies
  manifest.samlineAstro.deployment = deployment
  if (deployment === 'cloudflare') {
    manifest.devDependencies = {
      ...manifest.devDependencies,
      wrangler: '4.152.0'
    }
    const wrangler = 'node ./node_modules/wrangler/bin/wrangler.js'
    manifest.scripts.deploy = `${buildCommand(tools)} && ${wrangler} deploy`
    manifest.scripts['cf:types'] = `${wrangler} types`
  }
  if (deployment === 'custom') {
    manifest.scripts.start =
      tools.runtime === 'bun'
        ? 'bun --env-file=.env.production ./dist/server/entry.mjs'
        : 'node --env-file-if-exists=.env.production ./dist/server/entry.mjs'
  }
  return manifest
}

export const configureDeployment = async (
  destination,
  deployment,
  tools,
  name,
  site
) => {
  deploymentProfile(deployment)
  const file = (name) => path.join(destination, name)
  const write = (name, content) => writeFile(file(name), content)
  const json = (name, value) =>
    write(name, JSON.stringify(value, null, 2) + '\n')
  await write(
    'astro.config.mjs',
    astroDeploymentConfig(
      await readFile(file('astro.config.mjs'), 'utf8'),
      deployment
    )
  )
  const build = buildCommand(tools)
  if (
    tools.manager === 'pnpm' &&
    ['netlify', 'cloudflare'].includes(deployment)
  ) {
    const packages =
      deployment === 'cloudflare' ? ['esbuild', 'workerd'] : ['esbuild']
    const modern = Number(tools.managerVersion.split('.')[0]) >= 11
    await write(
      'pnpm-workspace.yaml',
      modern
        ? `# Native tools required by the selected adapter.\nallowBuilds:\n${packages.map((name) => `  ${name}: true`).join('\n')}\n`
        : `onlyBuiltDependencies:\n${packages.map((name) => `  - ${name}`).join('\n')}\n`
    )
  }
  if (deployment !== 'vercel') await rm(file('vercel.json'))
  if (deployment === 'netlify') {
    await write(
      'netlify.toml',
      `[build]\ncommand = ${JSON.stringify(build)}\npublish = "dist"\n\n[build.environment]\nNODE_VERSION = "24"\n${tools.runtime === 'bun' ? `BUN_VERSION = ${JSON.stringify(tools.bunVersion)}\n` : ''}`
    )
  }
  if (deployment === 'cloudflare') {
    const bunfig = await readFile(file('bunfig.toml'), 'utf8')
    await write(
      'bunfig.toml',
      replace(
        bunfig,
        'bun = true',
        '# Cloudflare tooling needs Node (Miniflare/workerd).\nbun = false'
      )
    )
    // Wrangler names are stricter than npm package names.
    const workerName = name
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 63)
      .replace(/-+$/, '')
    await json('wrangler.jsonc', {
      $schema: 'node_modules/wrangler/config-schema.json',
      name: workerName,
      main: '@astrojs/cloudflare/entrypoints/server',
      compatibility_date: '2026-10-01',
      compatibility_flags: ['nodejs_compat']
    })
  }
  await write(
    '.env.production',
    `# Configure the production origin before deploying.\n${site ? `SITE_URL=${site}\n` : '# SITE_URL=https://example.com\n'}${deployment === 'custom' ? 'HOST=0.0.0.0\nPORT=4321\n' : ''}`
  )
}

export const deploymentGuide = (deployment, tools) => {
  const run = tools.runner
  const common = `Set \`SITE_URL\` to the production origin at build time (provider dashboard or \`.env.production\`). Commit the lockfile after the first installation. Real credentials are ignored by Git. Declare future secrets in Astro with \`context: 'server', access: 'secret'\`.`
  const guide = {
    static: `Publish \`dist/\` to static hosting after \`${run} run build\`. This profile has no adapter, functions or Server Islands. Use \`${run} run preview\` to inspect the output.`,
    vercel: `Import the repository into Vercel. \`vercel.json\` configures frozen installation and the build command. The adapter generates \`.vercel/output/\`. Without SITE_URL, VERCEL_PROJECT_PRODUCTION_URL supplies the origin. Functions use ${tools.runtime === 'bun' ? 'Bun' : 'Node.js'}. Astro preview serves static files only; test islands in development or a Preview Deployment.`,
    netlify: `Import the repository into Netlify. \`netlify.toml\` configures the build and publication of \`dist/\`; the adapter generates functions in \`.netlify/\`. Without SITE_URL, Netlify's production URL supplies the origin. Functions use Node.js independently of the local runtime. Test islands in development or a Deploy Preview.`,
    cloudflare: `This profile targets Cloudflare Workers. \`wrangler.jsonc\` defines the Worker and Node compatibility. \`${run} run deploy\` checks, builds and deploys with Wrangler after you authenticate. In Workers Builds, build with \`${buildCommand(tools)}\` and deploy with \`node ./node_modules/wrangler/bin/wrangler.js deploy\`; configure SITE_URL as a build variable. Islands run in workerd. Astro and Wrangler use Node.js for Miniflare compatibility; the script runner remains ${run}. Copy \`.dev.vars.example\` to \`.dev.vars\` for local secrets; use the dashboard or \`wrangler secret put\` for remote secrets. Run \`${run} run cf:types\` after adding bindings. SSG page images are processed at build time.`,
    custom: `The profile configures \`@astrojs/node\` in standalone mode for your own server. Build with \`${run} run build\` and start with \`${run} run start\`, which loads \`.env.production\` and serves \`dist/client/\` and islands through \`dist/server/entry.mjs\`. Configure HOST and PORT; process variables take precedence. Use an HTTPS proxy in production. Replace the adapter if your infrastructure requires a different contract.`
  }
  return `${common}\n\n${guide[deployment]}\n\n${deployment === 'static' ? '' : `Pages retain \`output: 'static'\`; use \`server:defer\` for islands. To preserve encryption between deployments, generate \`ASTRO_KEY\` with \`${run} run astro create-key\` and configure the same key at build and runtime. General SSR is not enabled.`}`
}

export const buildCommand = (tools) => {
  return `${tools.runner} run check:i18n && ${tools.runner} run check && ${tools.runner} run build`
}
