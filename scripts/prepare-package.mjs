import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  agentContextFiles,
  agentSkillNames,
  agentSkillIndex
} from '../packages/cli/lib/agents.mjs'

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
await cp(
  path.join(root, 'scripts/auth-migrate.mjs'),
  path.join(template, 'scripts/auth-migrate.mjs')
)
await cp(
  path.join(root, 'scripts/check-i18n.mjs'),
  path.join(template, 'scripts/check-i18n.mjs')
)
await cp(
  path.join(root, 'packages/cli/lib/dictionary.mjs'),
  path.join(template, 'scripts/dictionary.mjs')
)
await writeFile(
  path.join(template, 'scripts/check-translations.mjs'),
  (
    await readFile(path.join(root, 'scripts/check-translations.mjs'), 'utf8')
  ).replace("'../packages/cli/lib/dictionary.mjs'", "'./dictionary.mjs'")
)
await writeFile(
  path.join(template, 'package.json'),
  `${JSON.stringify(pkg, null, 2)}\n`
)
// Ship a portable seed, never this repository's development memory.
for (const file of agentContextFiles) {
  const target = path.join(template, file)
  await mkdir(path.dirname(target), { recursive: true })
  await cp(path.join(root, 'scripts/agent-context', file), target)
}
const skillLock = JSON.parse(
  await readFile(path.join(root, 'skills-lock.json'), 'utf8')
)
skillLock.skills = Object.fromEntries(
  Object.entries(skillLock.skills).filter(([name]) =>
    agentSkillNames.includes(name)
  )
)
for (const name of agentSkillNames) {
  if (name !== 'codebase-memory' && !skillLock.skills[name])
    throw new Error(`Missing skill provenance: ${name}`)
  await cp(
    path.join(root, '.agents/skills', name),
    path.join(template, '.agents/skills', name),
    { recursive: true }
  )
}
await writeFile(
  path.join(template, 'skills-lock.json'),
  `${JSON.stringify(skillLock, null, 2)}\n`
)
await writeFile(
  path.join(template, '.agents/skills/README.md'),
  agentSkillIndex(agentSkillNames, skillLock.skills)
)
console.log(
  `Plantilla ${pkg.version} preparada desde la raíz (${files.length} entradas).`
)
