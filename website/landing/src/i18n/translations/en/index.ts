import sections from './sections'
import packages from './packages'
import common from '../../../../../shared/i18n/translations/en/common'
import controls from '../../../../../shared/i18n/translations/en/controls'
import { project } from '../../../../../shared/lib/project.mjs'
export default {
  sections,
  packages,
  common,
  controls,
  navigation: {
    mainLabel: 'Main navigation',
    skipContent: 'Skip to content',
    mobile: {
      title: `Explore ${project.name}`,
      introduction: 'Read the setup choices, examples and distribution docs.',
      resources: 'Project resources',
      label: 'Mobile navigation',
      open: 'Open navigation menu',
      close: 'Close navigation menu'
    },
    footer: {
      description: project.description,
      label: 'Footer navigation',
      explore: 'Explore',
      project: 'Project',
      setup: 'Installation guide',
      examples: 'Setup examples',
      astro: 'Astro documentation',
      changelog: 'Changelog',
      backToTop: 'Back to top',
      credit: common.footerCredit
    },
    items: [
      {
        href: '#features',
        label: 'Overview',
        description: 'See the core setup and project conventions.'
      },
      {
        href: '#how',
        label: 'Get started',
        description: 'Create a project and run it locally.'
      },
      {
        href: '#recipes',
        label: 'Recipes',
        description: 'Create a project, add Fields or register content.'
      },
      {
        href: '#packages',
        label: 'By samline',
        description: 'Explore Drawer, Ticker and Forms.'
      },
      {
        href: '#faq',
        label: 'FAQ',
        description: 'Understand setup choices and server requirements.'
      },
      {
        page: 'examples',
        label: 'Examples',
        description: 'Follow each command, result and next step.'
      },
      {
        docsRoute: 'overview',
        label: 'Docs',
        description: 'Read setup guides and component API examples.'
      }
    ]
  },
  examples: {
    exploreAction: 'View the setup examples',
    installAction: 'Installation guide',
    recipeEyebrow: '01 / Three setup tasks',
    eyebrow: 'Examples',
    title: 'Choose a task. See what changes.',
    accent: 'See what changes.',
    description:
      'Create the static project first. Then add form controls or local content from the generated project root. Each example gives you the command, generated files and next step.',
    possibilities:
      'These commands prepare source; they do not build a finished contact page or blog. Component docs show the imports, props and section examples you can use next.',
    guide: 'Read the setup guide',
    navigation: 'Setup examples',
    accessibility:
      'Choose npm, pnpm or Bun to run each command. Read the installation guide for requirements and setup options.',
    components: 'See how to use the components'
  }
} as const
