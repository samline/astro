import { spawnSync } from 'node:child_process'

// On Windows npm and pnpm are .cmd launchers. Only fixed tool names and
// internally constructed arguments reach the shell; paths use the cwd option.
export const command = (tool, args, options = {}) => {
  return spawnSync(tool, args, {
    ...options,
    shell: process.platform === 'win32' && ['npm', 'pnpm'].includes(tool),
    windowsHide: true
  })
}

export const detectTools = () => {
  const versions = {}
  for (const name of ['pnpm', 'bun', 'npm']) {
    const result = command(name, ['--version'], {
      env: {
        ...process.env,
        COREPACK_ENABLE_NETWORK: '0',
        COREPACK_ENABLE_DOWNLOAD_PROMPT: '0'
      },
      encoding: 'utf8',
      timeout: 10000,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const version = result.stdout?.trim()
    if (result.status === 0 && /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version)) {
      versions[name] = version
    }
  }
  return versions
}

export const selectTools = (versions, preferences = {}) => {
  if (
    preferences.manager &&
    !['npm', 'pnpm', 'bun'].includes(preferences.manager)
  )
    throw new Error('Choose npm, pnpm or bun for --package-manager.')
  if (preferences.runtime && !['node', 'bun'].includes(preferences.runtime))
    throw new Error('Choose node or bun for --runtime.')
  if (preferences.manager && !versions[preferences.manager])
    throw new Error(
      `Selected package manager ${preferences.manager} is not available. Install it or choose an available manager.`
    )
  if (preferences.runtime === 'bun' && !versions.bun)
    throw new Error(
      'Selected Bun runtime is not available. Install Bun or choose --runtime node.'
    )
  const manager = preferences.manager ?? (versions.pnpm ? 'pnpm' : 'npm')
  if (!versions[manager]) {
    throw new Error(
      'No se encontró pnpm ni npm. Instala Node.js con npm y vuelve a intentarlo.'
    )
  }
  const runtime = preferences.runtime ?? (versions.bun ? 'bun' : 'node')
  return {
    manager,
    managerVersion: versions[manager],
    runtime,
    runner: runtime === 'bun' ? 'bun' : manager,
    bunVersion: versions.bun
  }
}

export const projectTools = (manifest) => {
  const manager = manifest.packageManager?.split('@')[0]
  if (!['pnpm', 'npm', 'bun'].includes(manager))
    throw new Error(
      'Existing project must declare npm, pnpm or bun; add will not switch package managers.'
    )
  const bun = ['dev', 'build', 'astro', 'check', 'format', 'check:i18n'].some(
    (name) => /^\s*bun(?:\s|$)/.test(manifest.scripts?.[name] ?? '')
  )
  return {
    ...manifest.samlineAstro.tools,
    manager,
    managerVersion: manifest.packageManager.slice(manager.length + 1),
    runtime: bun ? 'bun' : 'node',
    runner: bun ? 'bun' : manager
  }
}
