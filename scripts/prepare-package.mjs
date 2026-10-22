import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
const cli = JSON.parse(
  await readFile(path.join(root, 'packages/cli/package.json'), 'utf8')
)
if (
  pkg.version !== cli.version ||
  pkg.version.split('.')[0] !== pkg.dependencies.astro.match(/\d+/)?.[0]
) {
  throw new Error(
    'El major del kit debe coincidir con Astro y las versiones de raíz y CLI deben coincidir.'
  )
}
const template = path.join(root, 'packages/cli/template')
await rm(template, { recursive: true, force: true })
await mkdir(template, { recursive: true })
// Explicit distribution boundary: never copy the working directory wholesale.
const files = [
  'src',
  'public',
  'astro.config.mjs',
  'tsconfig.json',
  'bunfig.toml',
  'vercel.json',
  '.editorconfig',
  '.env.example',
  '.gitignore',
  '.nvmrc',
  '.prettierrc.mjs',
  '.prettierignore',
  '.vscode/extensions.json',
  '.vscode/settings.json',
  '.vscode/launch.json'
]
for (const file of files) {
  const target = path.join(
    template,
    file === '.gitignore' ? '_gitignore' : file
  )
  await mkdir(path.dirname(target), { recursive: true })
  await cp(path.join(root, file), target, {
    recursive: true,
    errorOnExist: true
  })
}
await mkdir(path.join(template, 'scripts'))
await writeFile(
  path.join(template, 'package.json'),
  `${JSON.stringify(pkg, null, 2)}\n`
)
console.log(
  `Plantilla ${pkg.version} preparada desde la raíz (${files.length} entradas).`
)
