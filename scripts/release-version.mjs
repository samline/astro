import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const files = ['package.json', 'packages/cli/package.json']
const manifests = await Promise.all(
  files.map(async (file) =>
    JSON.parse(await readFile(path.join(root, file), 'utf8'))
  )
)
const version = process.argv[2]
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version ?? ''))
  throw new Error('Uso: bun run kit:version <major.minor.patch>')
const major = manifests[0].dependencies.astro.match(/\d+/)?.[0]
if (version.split('.')[0] !== major)
  throw new Error(`La versión debe pertenecer a la serie ${major}.x de Astro.`)
const next = version.split('.').map(Number)
const previous = manifests[0].version.split('.').map(Number)
const changed = next.findIndex((part, index) => part !== previous[index])
if (changed === -1 || next[changed] < previous[changed])
  throw new Error('La nueva versión debe ser mayor que la actual.')
for (let i = 0; i < files.length; i++) {
  manifests[i].version = version
  await writeFile(
    path.join(root, files[i]),
    `${JSON.stringify(manifests[i], null, 2)}\n`
  )
}
console.log(
  `Astro Kit actualizado a ${version}. Ejecuta bun run verify y bun run kit:pack.`
)
