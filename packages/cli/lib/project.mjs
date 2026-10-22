import {
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  writeFile
} from 'node:fs/promises'
import path from 'node:path'

export function projectName(destination) {
  const name = path.basename(destination).toLowerCase().replace(/\s+/g, '-')
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name) || name.length > 214) {
    throw new Error(
      'Usa un nombre de carpeta como mi-proyecto (letras, números, guiones o puntos).'
    )
  }
  return name
}

export function projectManifest(source, name, tools, kitVersion) {
  const bun = tools.runtime === 'bun'
  const astro = bun ? 'bun --bun ./node_modules/astro/bin/astro.mjs' : 'astro'
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
      format: `${prettier} . --write`,
      'format:check': `${prettier} . --check`,
      verify: `${tools.runner} run format:check && ${tools.runner} run check && ${tools.runner} run build`
    },
    dependencies: source.dependencies,
    devDependencies: source.devDependencies,
    astroKit: { version: kitVersion }
  }
}

export function deploymentConfig(source, tools) {
  const config = {
    ...source,
    installCommand:
      tools.manager === 'pnpm' ? 'pnpm install --frozen-lockfile' : 'npm ci',
    buildCommand: `${tools.runner} run check && ${tools.runner} run build`,
    devCommand: `${tools.runner} run astro dev`
  }
  if (tools.runtime !== 'bun') delete config.bunVersion
  return config
}

export async function createProject({
  template,
  readme,
  destination,
  tools,
  kitVersion
}) {
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
    projectManifest(await json('package.json'), name, tools, kitVersion)
  )
  await save('vercel.json', deploymentConfig(await json('vercel.json'), tools))
  const launch = await json('.vscode/launch.json')
  launch.configurations[0].command = `${tools.runner} run dev`
  await save('.vscode/launch.json', launch)
  await mkdir(path.join(destination, 'scripts'), { recursive: true })
  const hook = `if (!process.env.npm_config_user_agent?.startsWith('${tools.manager}/')) {\n  console.error('Instala las dependencias con ${tools.manager} install.')\n  process.exit(1)\n}\n`
  await writeFile(
    path.join(destination, 'scripts/check-package-manager.mjs'),
    hook
  )
  await cp(
    path.join(destination, '.env.example'),
    path.join(destination, '.env.development')
  )
  const instructions = (await readFile(readme, 'utf8'))
    .replaceAll('{{NAME}}', name)
    .replaceAll('{{VERSION}}', kitVersion)
    .replaceAll('{{INSTALL}}', tools.manager)
    .replaceAll('{{RUN}}', tools.runner)
    .replaceAll(
      '{{RUNTIME}}',
      tools.runtime === 'bun' ? 'Bun' : 'Node.js (comandos con npm)'
    )
  await writeFile(path.join(destination, 'README.md'), instructions)
  return { name, destination }
}
