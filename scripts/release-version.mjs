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
const pattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-beta\.(0|[1-9]\d*))?$/
if (!pattern.test(version ?? ''))
  throw new Error(
    'Uso: bun run kit:version <major.minor.patch> | <major.minor.patch-beta.n>'
  )
const major = manifests[0].dependencies.astro.match(/\d+/)?.[0]
if (version.split('.')[0] !== major)
  throw new Error(`La versión debe pertenecer a la serie ${major}.x de Astro.`)
// A stable release ranks above its betas: 7.26.0-beta.1 < 7.26.0.
const rank = (value) => {
  const [, a, b, c, beta] = value.match(pattern)
  return [a, b, c, beta ?? Infinity].map(Number)
}
const next = rank(version)
const previous = rank(manifests[0].version)
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
  `@samline/astro actualizado a ${version}. Ejecuta bun run verify y bun run kit:pack.` +
    (version.includes('-beta.')
      ? ' Publica la beta con --tag beta para conservar latest.'
      : '')
)
