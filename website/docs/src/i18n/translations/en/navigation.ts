import references from '../../../../../shared/data/references.json'
export default {
  mainLabel: 'Main navigation',
  paginationLabel: 'Documentation pagination',
  navigation: 'Documentation navigation',
  menu: 'Browse documentation',
  close: 'Close navigation',
  toc: 'On this page',
  previous: 'Previous',
  next: 'Next',
  breadcrumb: 'Docs',
  breadcrumbLabel: 'Breadcrumb',
  groupLabels: {
    start: 'Start here',
    guides: 'Guides',
    reference: 'Setup and APIs',
    api: 'Components'
  },
  pageLabels: {
    index: 'Overview',
    'getting-started': 'Create a project',
    'guides/integrations': 'Add integrations',
    'guides/languages': 'Set up languages',
    'guides/content': 'Content Collections',
    'guides/deployment': 'Deployment targets',
    'guides/agent-workflows': 'AI agent workflows',
    'guides/conventions': 'Project conventions',
    'guides/starter-demo': 'Starter demo',
    'guides/examples': 'Installation examples',
    'guides/accessibility': 'Review accessibility',
    'guides/updating': 'Update a project',
    'reference/configuration': 'Configuration and recovery',
    changelog: 'Changelog',
    ...Object.fromEntries(references.map((entry) => [entry.id, entry.title]))
  }
}
