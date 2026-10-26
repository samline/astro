import sharedCommon from '../../../../../shared/i18n/translations/en/common'
import { manifest } from '../../../../../shared/lib/project.mjs'
export default {
  name: manifest.npmName,
  versionLabel: 'v{version}',
  docs: 'Documentation',
  examples: 'Installation examples',
  examplesDescription:
    'Choose a starting setup and follow the command step by step.',
  github: 'GitHub',
  skip: 'Skip to content',
  license: manifest.license,
  footer: sharedCommon.footerCredit,
  changelog: {
    title: 'Changelog',
    description:
      'Changes recorded for the installer, generated source and documentation.'
  },
  reading: 'Guide',
  apiReading: 'Reference'
}
