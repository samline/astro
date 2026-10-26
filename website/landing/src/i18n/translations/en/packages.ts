export default {
  eyebrow: '05 / More by samline',
  title: 'More for your site.',
  accent: 'Made by samline.',
  description:
    'Explore my packages for sliding panels, moving content and forms. Each has its own API and documentation; use them in this starter or another project.',
  visit: 'Explore the website',
  package: 'Explore the package',
  items: [
    {
      id: 'drawer',
      name: 'Drawer',
      npm: '@samline/drawer',
      category: 'Menus, search and panels',
      description:
        'Sliding drawers with focus management, gestures and explicit open, close and cleanup APIs. Build menus, search and contextual panels.',
      href: 'https://samline.github.io/drawer/',
      status: 'Website & docs',
      preview: ['Content', 'A little more room.']
    },
    {
      id: 'ticker',
      name: 'Ticker',
      npm: '@samline/ticker',
      category: 'Moving content with controls',
      description:
        'A ticker for JavaScript, TypeScript and HTML, with playback controls and accessibility features for moving content.',
      href: 'https://samline.github.io/ticker/',
      status: 'Website & docs',
      preview: ['Ideas in motion', 'Made for the web']
    },
    {
      id: 'forms',
      name: 'Forms',
      npm: '@samline/forms',
      category: 'Form state and validation',
      description:
        'Manage form state and validation in your interface. Selecting Forms in @samline/astro also installs @samline/formatter; Fields adds optional Astro control templates.',
      href: 'https://www.npmjs.com/package/@samline/forms',
      status: 'Website coming next',
      preview: ['Your name', 'Your next idea', 'Send message']
    }
  ]
} as const
