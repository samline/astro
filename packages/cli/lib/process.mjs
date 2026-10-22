import { spawnSync } from 'node:child_process'

// On Windows npm and pnpm are .cmd launchers. Only fixed tool names and
// internally constructed arguments reach the shell; paths use the cwd option.
export function command(tool, args, options = {}) {
  return spawnSync(tool, args, {
    ...options,
    shell: process.platform === 'win32',
    windowsHide: true
  })
}

export function detectTools() {
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

export function selectTools(versions) {
  const manager = versions.pnpm ? 'pnpm' : 'npm'
  if (!versions[manager]) {
    throw new Error(
      'No se encontró pnpm ni npm. Instala Node.js con npm y vuelve a intentarlo.'
    )
  }
  if (!versions.bun && !versions.npm) {
    throw new Error(
      'Sin Bun se necesita npm para ejecutar los scripts. Instala Node.js con npm.'
    )
  }
  return {
    manager,
    managerVersion: versions[manager],
    runtime: versions.bun ? 'bun' : 'node',
    runner: versions.bun ? 'bun' : 'npm',
    bunVersion: versions.bun
  }
}
