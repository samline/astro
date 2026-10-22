import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { createInterface } from 'node:readline/promises'
import path from 'node:path'
import { command, detectTools, selectTools } from './process.mjs'
import { createProject } from './project.mjs'
import { deployments, deploymentProfile, siteOrigin } from './deployment.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))

export async function main(args = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
      'no-install': { type: 'boolean' },
      deploy: { type: 'string' },
      site: { type: 'string' }
    }
  })
  const pkg = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8')
  )
  if (values.version) return console.log(pkg.version)
  if (values.help) {
    console.log(
      `Astro Kit ${pkg.version}\n\nUso: npx @samline/astro-kit@latest [carpeta] [opciones]\n\nEl asistente pregunta la carpeta y el destino de despliegue.\n  --deploy      static | vercel | netlify | cloudflare | custom\n                Obligatorio sin terminal interactiva; Vercel por defecto en el asistente.\n  --site        Origen de producción, por ejemplo https://example.com\n  --no-install  Crear archivos sin instalar dependencias\n  --version     Mostrar versión\n  --help        Mostrar ayuda`
    )
    return
  }
  if (positionals.length > 1)
    throw new Error('Indica una sola carpeta de destino.')
  let directory = positionals[0]
  let deployment = values.deploy
  if (deployment) deploymentProfile(deployment)
  const site = siteOrigin(values.site)
  if (!directory || !deployment) {
    if (!process.stdin.isTTY)
      throw new Error(
        'Sin terminal interactiva, indica carpeta y --deploy: astro-kit mi-proyecto --deploy vercel'
      )
    const prompt = createInterface({
      input: process.stdin,
      output: process.stdout
    })
    try {
      if (!directory)
        directory =
          (
            await prompt.question(
              'Nombre o carpeta del proyecto (mi-proyecto): '
            )
          ).trim() || 'mi-proyecto'
      if (!deployment) {
        const entries = Object.entries(deployments)
        console.log('\n¿Dónde se va a desplegar?')
        entries.forEach(([key, profile], index) =>
          console.log(`  ${index + 1}. ${profile.label} (${key})`)
        )
        while (!deployment) {
          const answer =
            (await prompt.question('Selecciona una opción [2: vercel]: '))
              .trim()
              .toLowerCase() || 'vercel'
          const choice = entries.find(
            ([key], index) => key === answer || String(index + 1) === answer
          )
          if (choice) deployment = choice[0]
          else
            console.log(
              'Selecciona un número del 1 al 5 o el nombre del destino.'
            )
        }
      }
    } finally {
      prompt.close()
    }
  }
  const tools = selectTools(detectTools())
  const destination = path.resolve(directory)
  console.log(
    `\nAstro Kit ${pkg.version}\nInstalación: ${tools.manager}\nEjecución: ${tools.runtime === 'bun' ? 'Bun' : 'npm / Node.js'}\nDespliegue: ${deployments[deployment].label}\n`
  )
  if (deployment === 'cloudflare' && tools.runtime === 'bun')
    console.log(
      'Cloudflare: Astro y Wrangler usarán Node.js por compatibilidad con workerd; los comandos se lanzan con bun run.\n'
    )
  await createProject({
    template: path.join(root, 'template'),
    readme: path.join(root, 'project-readme.md'),
    destination,
    tools,
    kitVersion: pkg.version,
    deployment,
    site
  })
  if (!values['no-install']) {
    const result = command(tools.manager, ['install'], {
      cwd: destination,
      stdio: 'inherit'
    })
    if (result.error || result.status !== 0) {
      throw new Error(
        `Los archivos se crearon, pero la instalación falló. Entra en ${destination} y ejecuta ${tools.manager} install para reintentar.`
      )
    }
    // Make the freshly generated files pass the project's own format check.
    const format = command(tools.runner, ['run', 'format'], {
      cwd: destination,
      stdio: 'inherit'
    })
    if (format.error || format.status !== 0) {
      throw new Error(
        `El proyecto se creó e instaló, pero falló el formato. Ejecuta ${tools.runner} run format en ${destination}.`
      )
    }
  }
  const quoted = JSON.stringify(directory)
  console.log(
    `\nProyecto creado en ${destination}\n\n  cd ${quoted}\n${values['no-install'] ? `  ${tools.manager} install\n  ${tools.runner} run format\n` : ''}  ${tools.runner} run dev\n`
  )
}
