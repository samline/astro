import { manifest } from '../../../lib/project.mjs'
export default {
  packageName: manifest.npmName,
  version: manifest.version,
  author: manifest.author,
  footerCredit: 'Samuel Olvera · Made for the open web.',
  externalLinkHint: '(opens in a new tab)',
  license: manifest.license,
  versionLabel: 'v{version}',
  brandHome: '{name} home',
  links: {
    github: 'GitHub',
    docs: 'Docs',
    npm: 'npm',
    license: 'License and notices'
  },
  buttons: {
    getStarted: 'Get started',
    exploreDemo: 'Explore setup examples',
    starGithub: 'View on GitHub'
  }
} as const
