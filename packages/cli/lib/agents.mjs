import { readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { features } from './features/registry.mjs'

export const agentSkillNames = [
  'accessibility',
  'astro',
  'samline-astro',
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
  '.agents/memory/frontend-conventions.md',
  '.agents/memory/reveal-recipe.md',
  '.agents/lessons.md',
  '.agents/todos.md',
  '.agents/memory/integrations.md'
]

export const agentSkillIndex = (names, registry) => {
  const rows = names.map((name) => {
    const source =
      registry[name]?.source ??
      (name === 'samline-astro'
        ? 'Original @samline/astro project workflow (MIT)'
        : 'DeusData/codebase-memory-mcp (MIT; local workflow additions)')
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
    '{{INTEGRATIONS}}': integrationSummary(manifest.samlineAstro),
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
    text = selectedGuidance(
      text,
      file,
      manifest.samlineAstro.features
    ).replaceAll('{{INTEGRATIONS}}', integrationSummary(manifest.samlineAstro))
    await writeFile(target, text.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n')
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

export const integrationSummary = (
  metadata
) => `Installed: ${metadata.features.length ? metadata.features.map((name) => features[name].label).join(', ') : 'core only'}.
Locales: ${metadata.locales.map((item) => `${item.code}${item.ready ? '' : ' (translation pending)'}`).join(', ')}.
Collections: ${metadata.collections.map((item) => `${item.name} (${item.source}, ${item.mode}${item.configuredAtInstall ? '' : ', configure and activate'})`).join(', ') || 'none'}.

Use package.json samlineAstro metadata and actual source/configuration together.
Installed is not proof of configured credentials, active routes or validation.
`

const removeSection = (text, heading) => {
  const start = text.indexOf('## ' + heading + '\n')
  if (start < 0) return text
  const next = text.indexOf('\n## ', start + 3)
  return text.slice(0, start) + (next < 0 ? '' : text.slice(next + 1))
}
const selectedGuidance = (text, file, selected) => {
  if (file === '.agents/AGENTS.md') {
    for (const [feature, heading] of [
      ['mail', 'Server mail'],
      ['content', 'Content and API examples'],
      ['auth', 'Optional authentication']
    ])
      if (!selected.includes(feature)) text = removeSection(text, heading)
    const start = text.indexOf('Keep ldrs in PageLoader')
    const end = text.indexOf('\n## ', start)
    if (start >= 0) text = text.slice(0, start) + text.slice(end)
  }
  if (file === '.agents/memory/decisions.md') {
    if (!selected.includes('auth'))
      text = removeSection(text, 'Authentication boundary')
    text = text.replace(
      'Tailwind owns design tokens. Theme initialization runs before paint. GTM is\noptional and starts with denied consent signals; analytics and advertising are\nindependent. PageLoader retains ldrs to make animation changes straightforward.',
      'Tailwind owns design tokens. Read memory/integrations.md for installed optional\ncapabilities and each installed feature README before changing its API.'
    )
  }
  return text
}
