import { readFile, lstat, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { agentContextFiles, agentSkillNames } from '../lib/agents.mjs'

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

const contextFiles = new Set([...agentContextFiles, '.agents/skills/README.md'])
const allowedAgentPath = (relative) =>
  contextFiles.has(relative) ||
  ['.agents', '.agents/memory', '.agents/skills'].includes(relative) ||
  agentSkillNames.some(
    (name) =>
      relative === `.agents/skills/${name}` ||
      relative.startsWith(`.agents/skills/${name}/`)
  )

const inspect = async (directory) => {
  for (const entry of await readdir(directory)) {
    const file = path.join(directory, entry)
    const relative = path.relative(template, file).split(path.sep).join('/')
    if (
      [
        'node_modules',
        '.git',
        '.astro',
        '.vercel',
        '.netlify',
        '.wrangler',
        'dist',
        '.local'
      ].includes(entry) ||
      (entry === '.agents' && relative !== '.agents') ||
      (relative.startsWith('.agents/') && !allowedAgentPath(relative)) ||
      (entry === 'AGENTS.md' && !contextFiles.has(relative)) ||
      (entry === 'skills-lock.json' && relative !== 'skills-lock.json') ||
      (entry.startsWith('.env') && entry !== '.env.example') ||
      (entry.startsWith('.dev.vars') && entry !== '.dev.vars.example')
    )
      throw new Error(`Archivo no publicable en plantilla: ${relative}`)
    const stat = await lstat(file)
    if (stat.isSymbolicLink())
      throw new Error(`No se permiten symlinks en la plantilla: ${file}`)
    if (stat.isDirectory()) await inspect(file)
  }
}
await inspect(template)
for (const file of [
  ...contextFiles,
  'skills-lock.json',
  ...agentSkillNames.map((name) => `.agents/skills/${name}/SKILL.md`)
]) {
  if (!(await lstat(path.join(template, file))).isFile())
    throw new Error(`Missing agent context file: ${file}`)
}
const lock = JSON.parse(
  await readFile(path.join(template, 'skills-lock.json'), 'utf8')
)
if (Object.keys(lock.skills).some((name) => !agentSkillNames.includes(name)))
  throw new Error('Unexpected skill provenance in template.')
console.log(`Plantilla ${pkg.version} verificada para publicar.`)
