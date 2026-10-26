export const managers = [
  { id: 'npm', label: 'npm' },
  { id: 'pnpm', label: 'pnpm' },
  { id: 'bun', label: 'Bun' }
] as const

export const tasks = {
  install: {
    label: 'Install project dependencies',
    commands: ['npm install', 'pnpm install', 'bun install']
  },
  run: {
    label: 'Start development',
    commands: [
      'cd my-site\nnpm run dev',
      'cd my-site\npnpm run dev',
      'cd my-site\nbun run dev'
    ]
  },
  verify: {
    label: 'Format and verify the project',
    commands: [
      'npm run format\nnpm run verify',
      'pnpm run format\npnpm run verify',
      'bun run format\nbun run verify'
    ]
  },
  server: {
    label: 'Manage the development server',
    commands: [
      'npm run astro dev status\nnpm run astro dev logs\nnpm run astro dev stop',
      'pnpm run astro dev status\npnpm run astro dev logs\npnpm run astro dev stop',
      'bun run astro dev status\nbun run astro dev logs\nbun run astro dev stop'
    ]
  },
  upgrade: {
    label: 'Preview and apply an Astro upgrade',
    commands: [
      'npx @astrojs/upgrade --dry-run\n# After reviewing the proposed versions:\nnpx @astrojs/upgrade',
      'pnpm dlx @astrojs/upgrade --dry-run\n# After reviewing the proposed versions:\npnpm dlx @astrojs/upgrade',
      'bunx @astrojs/upgrade --dry-run\n# After reviewing the proposed versions:\nbunx @astrojs/upgrade'
    ]
  },
  outdated: {
    label: 'Inspect outdated dependencies',
    commands: ['npm outdated', 'pnpm outdated', 'bun outdated']
  },
  formsUpdate: {
    label: 'Update installed Forms and Formatter packages',
    commands: [
      'npm update @samline/forms @samline/formatter',
      'pnpm update @samline/forms @samline/formatter',
      'bun update @samline/forms @samline/formatter'
    ]
  },
  fields: {
    label: 'Add Fields templates',
    commands: [
      'npx @samline/astro add fields',
      'pnpm dlx @samline/astro add fields',
      'bunx @samline/astro add fields'
    ]
  }
} as const
