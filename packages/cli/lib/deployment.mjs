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

export function deploymentProfile(deployment) {
  if (!Object.hasOwn(deployments, deployment)) {
    throw new Error(
      'Despliegue inválido. Usa static, vercel, netlify, cloudflare o custom.'
    )
  }
  return deployments[deployment]
}

export function siteOrigin(value) {
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
function replace(source, previous, next) {
  if (!source.includes(previous))
    throw new Error(
      'La configuración base cambió. Actualiza el generador de despliegues.'
    )
  return source.replace(previous, next)
}

function astroDeploymentConfig(source, deployment) {
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

export function deploymentManifest(manifest, deployment, tools) {
  const profile = deploymentProfile(deployment)
  const dependencies = { ...manifest.dependencies }
  for (const item of Object.values(deployments))
    if (item.adapter) delete dependencies[item.adapter]
  if (profile.adapter) dependencies[profile.adapter] = profile.version
  manifest.dependencies = dependencies
  manifest.astroKit.deployment = deployment
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

export async function configureDeployment(
  destination,
  deployment,
  tools,
  name,
  site
) {
  const profile = deploymentProfile(deployment)
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
    await write(
      '.dev.vars.example',
      '# Local Worker secrets. Copy to .dev.vars; never commit real credentials.\n# ASTRO_KEY=\n'
    )
  }
  const fallback =
    deployment === 'vercel'
      ? 'VERCEL_PROJECT_PRODUCTION_URL'
      : deployment === 'netlify'
        ? 'URL (Netlify)'
        : 'localhost'
  const server = deployment !== 'static'
  const env = `# ${profile.label}\n# Local development origin. Set SITE_URL to your production origin when building.\n# Without SITE_URL, Astro falls back to ${fallback}.\nSITE_URL=http://localhost:4321\n\n# Optional indexing override. Default: production, non-local origin, no detected preview.\n# Set false for staging (including Cloudflare previews and custom hosting).\n# SITE_INDEXABLE=false\n\n# Optional Google Tag Manager. Unset means no GTM or consent UI.\n# GTM_ID=GTM-XXXXXXX\n# GTM_ENABLED=false\n${server ? '\n# Optional persistent Server Islands key. Generate with: ' + tools.runner + ' run astro create-key\n# Supply the same key to builds and runtime through your hosting environment.\n# ASTRO_KEY=\n' : ''}${deployment === 'custom' ? '\n# Standalone server runtime; start loads .env.production.\nHOST=0.0.0.0\nPORT=4321\n' : ''}`
  await write('.env.example', env)
  await write('.env.development', env)
  await write(
    '.env.production',
    `# Set SITE_URL to your final production origin before deploying.\n${site ? `SITE_URL=${site}\n` : '# SITE_URL=https://example.com\n'}${deployment === 'custom' ? 'HOST=0.0.0.0\nPORT=4321\n' : ''}`
  )
}

export function deploymentGuide(deployment, tools) {
  const run = tools.runner
  const common = `Configura \`SITE_URL\` con el origen de producción al compilar (dashboard del proveedor o \`.env.production\`). Conserva el lockfile tras la primera instalación. Las credenciales reales están ignoradas por Git. Declara futuros secretos en Astro como \`context: 'server', access: 'secret'\`.`
  const guide = {
    static: `Publica \`dist/\` en cualquier hosting estático después de \`${run} run build\`. No hay adaptador, funciones ni Server Islands. \`${run} run preview\` permite comprobar la salida.`,
    vercel: `Importa el repositorio en Vercel. \`vercel.json\` configura instalación congelada y compilación. El adaptador genera \`.vercel/output/\`. Sin SITE_URL se usa VERCEL_PROJECT_PRODUCTION_URL. Las funciones usan ${tools.runtime === 'bun' ? 'Bun' : 'Node.js'}. Preview de Astro solo sirve archivos estáticos; prueba las islas en desarrollo o un Preview Deployment.`,
    netlify: `Importa el repositorio en Netlify. \`netlify.toml\` configura compilación y publicación de \`dist/\`; el adaptador genera las funciones en \`.netlify/\`. Sin SITE_URL se usa URL, el dominio de producción de Netlify. Las funciones usan Node.js, independientemente del runtime local. Prueba las islas en desarrollo o un Deploy Preview.`,
    cloudflare: `El destino es Cloudflare Workers. \`wrangler.jsonc\` define el Worker y la compatibilidad con Node. \`${run} run deploy\` comprueba, compila y despliega con Wrangler (requiere autenticar tu cuenta). En Workers Builds usa \`${buildCommand(tools)}\` para compilar y \`node ./node_modules/wrangler/bin/wrangler.js deploy\` para desplegar; configura SITE_URL como variable de build. Las islas se ejecutan en workerd. Astro y Wrangler usan Node.js por compatibilidad con Miniflare; el lanzador sigue siendo ${run}. Copia \`.dev.vars.example\` a \`.dev.vars\` para secretos locales; usa el dashboard o \`wrangler secret put\` para secretos remotos. Ejecuta \`${run} run cf:types\` al añadir bindings. Las imágenes de las páginas SSG se procesan al compilar.`,
    custom: `Se configura \`@astrojs/node\` en modo standalone para servidor propio. Compila con \`${run} run build\` e inicia con \`${run} run start\`, que carga \`.env.production\` y sirve \`dist/client/\` y las islas mediante \`dist/server/entry.mjs\`. Configura HOST y PORT; las variables del proceso tienen prioridad. Usa un proxy HTTPS en producción. Puedes sustituir el adaptador si tu infraestructura requiere otro contrato.`
  }
  return `${common}\n\n${guide[deployment]}\n\n${deployment === 'static' ? '' : `Las páginas siguen con \`output: 'static'\`; usa \`server:defer\` para islas. Para mantener el cifrado entre despliegues, genera \`ASTRO_KEY\` con \`${run} run astro create-key\` y configura la misma clave en build y runtime. No se activa SSR general.`}`
}

export function buildCommand(tools) {
  return `${tools.runner} run check:i18n && ${tools.runner} run check && ${tools.runner} run build`
}
