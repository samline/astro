import { readFile, readdir, access } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkReadme, checkPageIdentity } from './lib/identity-checks.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const args = process.argv.slice(2)
const packageRoot = args.includes('--package-root')
  ? resolve(root, args[args.indexOf('--package-root') + 1])
  : resolve(root, '..')
let config
try {
  config = JSON.parse(await readFile(join(root, 'project.config.json'), 'utf8'))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const manifest = JSON.parse(
  await readFile(join(packageRoot, 'package.json'), 'utf8')
)
const npmName = config?.package.npmName ?? manifest.name
const siteUrl = config?.site.url ?? manifest.homepage
const repository = String(
  config?.site.repository ?? manifest.repository?.url ?? manifest.repository
)
  .replace(/^git\+/, '')
  .replace(/\.git$/, '')
const credit =
  config?.site.credit ??
  new URL(repository).pathname.split('/').filter(Boolean)[0]
const problems = checkReadme(
  await readFile(join(packageRoot, 'README.md'), 'utf8'),
  {
    npmName,
    siteUrl,
    credit,
    template: true, // Installer commands and multiple bundled skills, not a browser runtime.
    licenseFile: 'LICENSE',
    cdn: config
      ? !!config.delivery.cdnScript
      : !!manifest.exports?.['./browser/global']
  }
)
const readme = await readFile(join(packageRoot, 'README.md'), 'utf8')
for (const command of [
  'npx @samline/astro@latest my-site',
  'pnpm dlx @samline/astro@latest my-site',
  'bunx @samline/astro@latest my-site'
])
  if (!readme.includes('```sh\n' + command + '\n```'))
    problems.push(`README: Installation must show ${command}.`)
const cliReadme = await readFile(
  join(packageRoot, 'packages/cli/README.md'),
  'utf8'
)
problems.push(
  ...checkReadme(cliReadme, {
    npmName,
    siteUrl,
    template: true,
    licenseFile: 'LICENSE'
  }).map((problem) => `packages/cli/${problem}`)
)
const dist = join(root, 'landing/dist')
await access(join(dist, 'index.html'))
let total = 0
const walk = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['pagefind', '_astro', 'font-licenses'].includes(entry.name)) continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      await walk(path)
      continue
    }
    if (!entry.name.endsWith('.html')) continue
    const html = await readFile(path, 'utf8')
    if (/http-equiv="refresh"/i.test(html)) continue
    const local = path.slice(dist.length + 1)
    problems.push(
      ...checkPageIdentity(html, {
        npmName,
        credit,
        footer: true, // Docs also owns a copyright footer in this distribution.
        subject: {
          'examples/index.html': 'Examples',
          'docs/index.html': 'Documentation'
        }[local]
      }).map((problem) => `${local}: ${problem}`)
    )
    total++
  }
}
await walk(dist)
if (problems.length) {
  console.error(problems.map((problem) => `✗ ${problem}`).join('\n'))
  process.exitCode = 1
} else
  console.log(
    `Both public READMEs, ${total} document/social titles and page footers follow the identity contract.`
  )
