import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { project } from '../shared/lib/project.mjs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Derive public workflow downloads from the same source shipped by the CLI.
const repository = new URL('../../', import.meta.url)
const skill = '.agents/skills/samline-project-kickoff'
const downloads = new URL('../docs/public/downloads/', import.meta.url)
await mkdir(downloads, { recursive: true })
await cp(
  new URL(`${skill}/references/kickoff-prompt.md`, repository),
  new URL('kickoff-prompt.md', downloads)
)
const archive = new URL('samline-project-kickoff.zip', downloads)
await rm(archive, { force: true })
execFileSync('zip', ['-X', '-r', fileURLToPath(archive), skill], {
  cwd: fileURLToPath(repository),
  stdio: 'pipe'
})
for (const app of ['landing', 'docs']) {
  const target = new URL(`../${app}/public/`, import.meta.url)
  await mkdir(target, { recursive: true })
  const licenses = new URL('font-licenses/', target)
  await mkdir(licenses, { recursive: true })
  for (const file of await readdir(
    new URL('../shared/assets/fonts/', import.meta.url)
  )) {
    if (file.endsWith('-OFL.txt'))
      await cp(
        new URL('../shared/assets/fonts/' + file, import.meta.url),
        new URL(file, licenses)
      )
  }
  await writeFile(
    new URL('favicon.svg', target),
    (
      await readFile(
        new URL('../shared/assets/favicon.svg', import.meta.url),
        'utf8'
      )
    ).replace('{accent}', project.accentDark)
  )
}
