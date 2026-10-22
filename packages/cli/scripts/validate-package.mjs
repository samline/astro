import { readFile, lstat, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
const template = path.join(root, 'template')
const base = JSON.parse(
  await readFile(path.join(template, 'package.json'), 'utf8')
)
if (
  pkg.version !== base.version ||
  pkg.version.split('.')[0] !== base.dependencies.astro.match(/\d+/)?.[0]
) {
  throw new Error(
    'Las versiones de la plantilla, el instalador y Astro no coinciden. Ejecuta bun run kit:prepare.'
  )
}
async function inspect(directory) {
  for (const entry of await readdir(directory)) {
    if (
      [
        'node_modules',
        '.git',
        '.astro',
        '.vercel',
        'dist',
        '.local',
        'AGENTS.md'
      ].includes(entry) ||
      (entry.startsWith('.env') && entry !== '.env.example')
    ) {
      throw new Error(`Archivo no publicable en plantilla: ${entry}`)
    }
    const file = path.join(directory, entry)
    const stat = await lstat(file)
    if (stat.isSymbolicLink())
      throw new Error(`No se permiten symlinks en la plantilla: ${file}`)
    if (stat.isDirectory()) await inspect(file)
  }
}
await inspect(template)
console.log(`Plantilla ${pkg.version} verificada para publicar.`)
