import { readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const agentSkillNames = [
  'accessibility',
  'astro',
  'bun',
  'codebase-memory',
  'deploy-to-vercel',
  'frontend-design',
  'seo',
  'tailwind-css-patterns',
  'typescript-advanced-types',
  'vite'
]

export const agentContextFiles = [
  'AGENTS.md',
  '.agents/README.md',
  '.agents/AGENTS.md',
  '.agents/memory/project.md',
  '.agents/memory/decisions.md',
  '.agents/lessons.md',
  '.agents/todos.md'
]

export const agentSkillIndex = (names, registry) => {
  const rows = names.map((name) => {
    const source =
      registry[name]?.source ?? 'Project-local graph/source exploration skill'
    return `- [${name}](./${name}/SKILL.md): ${source}.`
  })
  return `# Project skills

Read a skill's SKILL.md before applying it. Project conventions and current user
instructions take precedence over generic examples. Source metadata for registry
skills is retained in the root skills-lock.json. Preserve upstream files.

${rows.join('\n')}

Codebase-memory uses its MCP service when configured. Otherwise inspect source
directly and state coverage limits. Skills do not install or authorize external
services. Deployment guidance does not itself deploy the project.
`
}

export const configureAgents = async (
  destination,
  { name, tools, kitVersion, deployment }
) => {
  const manifest = JSON.parse(
    await readFile(path.join(destination, 'package.json'), 'utf8')
  )
  const replacements = {
    '{{NAME}}': name,
    '{{VERSION}}': kitVersion,
    '{{ASTRO}}': manifest.dependencies.astro,
    '{{INSTALL}}': tools.manager,
    '{{RUN}}': tools.runner,
    '{{RUNTIME}}': tools.runtime === 'bun' ? 'Bun' : 'Node.js',
    '{{DEPLOYMENT}}': deployment,
    '{{ISLANDS}}':
      deployment === 'static'
        ? 'Server Islands require adding a supported adapter.'
        : 'Server Islands are available through the selected adapter.'
  }
  for (const file of agentContextFiles) {
    const target = path.join(destination, file)
    let text = await readFile(target, 'utf8')
    for (const [key, value] of Object.entries(replacements))
      text = text.replaceAll(key, value)
    await writeFile(target, text)
  }
  const names = agentSkillNames.filter(
    (skill) => skill !== 'deploy-to-vercel' || deployment === 'vercel'
  )
  const lockPath = path.join(destination, 'skills-lock.json')
  const lock = JSON.parse(await readFile(lockPath, 'utf8'))
  lock.skills = Object.fromEntries(
    Object.entries(lock.skills).filter(([skill]) => names.includes(skill))
  )
  if (deployment !== 'vercel')
    await rm(path.join(destination, '.agents/skills/deploy-to-vercel'), {
      recursive: true
    })
  await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`)
  await writeFile(
    path.join(destination, '.agents/skills/README.md'),
    agentSkillIndex(names, lock.skills)
  )
}
