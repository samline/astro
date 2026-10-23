import {
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  writeFile
} from 'node:fs/promises'
import path from 'node:path'
import { configureAgents } from './agents.mjs'
import {
  buildCommand,
  configureDeployment,
  deploymentGuide,
  deploymentManifest,
  deploymentProfile,
  siteOrigin
} from './deployment.mjs'

function projectName(destination) {
  const name = path.basename(destination).toLowerCase().replace(/\s+/g, '-')
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name) || name.length > 214) {
    throw new Error(
      'Usa un nombre de carpeta como mi-proyecto (letras, números, guiones o puntos).'
    )
  }
  return name
}

function projectManifest(
  source,
  name,
  tools,
  kitVersion,
  deployment = 'vercel'
) {
  const bun = tools.runtime === 'bun'
  // Miniflare/workerd prerendering hangs under Bun; the script runner may stay Bun.
  const astro =
    deployment === 'cloudflare'
      ? 'node ./node_modules/astro/bin/astro.mjs'
      : bun
        ? 'bun --bun ./node_modules/astro/bin/astro.mjs'
        : 'astro'
  const prettier = bun
    ? 'bun --bun ./node_modules/prettier/bin/prettier.cjs'
    : 'prettier'
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
    dependencies: source.dependencies,
    devDependencies: source.devDependencies,
    astroKit: { version: kitVersion }
  }
}

function vercelConfig(source, tools) {
  const config = {
    ...source,
    installCommand:
      tools.manager === 'pnpm' ? 'pnpm install --frozen-lockfile' : 'npm ci',
    buildCommand: buildCommand(tools),
    devCommand: `${tools.runner} run astro dev`
  }
  if (tools.runtime !== 'bun') delete config.bunVersion
  return config
}

export const createProject = async ({
  template,
  readme,
  destination,
  tools,
  kitVersion,
  deployment = 'vercel',
  site
}) => {
  const profile = deploymentProfile(deployment)
  const origin = siteOrigin(site)
  const name = projectName(destination)
  // Reject symlinks as well as nonempty folders. Never offer a destructive --force.
  const existing = await lstat(destination).catch((error) => {
    if (error.code !== 'ENOENT') throw error
    return null
  })
  if (
    existing &&
    (!existing.isDirectory() || (await readdir(destination)).length)
  ) {
    throw new Error(`El destino ya existe y no está vacío: ${destination}`)
  }
  const files = await readdir(template)
  await mkdir(destination, { recursive: true })
  for (const file of files) {
    await cp(
      path.join(template, file),
      path.join(destination, file === '_gitignore' ? '.gitignore' : file),
      {
        recursive: true,
        force: false,
        errorOnExist: true,
        dereference: false
      }
    )
  }
  const json = async (file) =>
    JSON.parse(await readFile(path.join(destination, file), 'utf8'))
  const save = (file, value) =>
    writeFile(
      path.join(destination, file),
      `${JSON.stringify(value, null, 2)}\n`
    )
  await save(
    'package.json',
    deploymentManifest(
      projectManifest(
        await json('package.json'),
        name,
        tools,
        kitVersion,
        deployment
      ),
      deployment,
      tools
    )
  )
  if (deployment === 'vercel')
    await save('vercel.json', vercelConfig(await json('vercel.json'), tools))
  await configureDeployment(destination, deployment, tools, name, origin)
  await configureAgents(destination, { name, tools, kitVersion, deployment })
  const launch = await json('.vscode/launch.json')
  launch.configurations[0].command = `${tools.runner} run dev`
  await save('.vscode/launch.json', launch)
  await mkdir(path.join(destination, 'scripts'), { recursive: true })
  const hook = `if (!process.env.npm_config_user_agent?.startsWith('${tools.manager}/')) {\n  console.error('Instala las dependencias con ${tools.manager} install.')\n  process.exit(1)\n}\n`
  await writeFile(
    path.join(destination, 'scripts/check-package-manager.mjs'),
    hook
  )
  const instructions = (await readFile(readme, 'utf8'))
    .replaceAll('{{NAME}}', name)
    .replaceAll('{{VERSION}}', kitVersion)
    .replaceAll('{{INSTALL}}', tools.manager)
    .replaceAll('{{RUN}}', tools.runner)
    .replaceAll('{{DEPLOYMENT}}', profile.label)
    .replaceAll('{{DEPLOYMENT_GUIDE}}', deploymentGuide(deployment, tools))
    .replaceAll(
      '{{RUNTIME}}',
      tools.runtime === 'bun' ? 'Bun' : 'Node.js (comandos con npm)'
    )
  await writeFile(path.join(destination, 'README.md'), instructions)
  return { name, destination }
}
