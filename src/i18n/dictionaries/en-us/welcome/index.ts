import type { Welcome } from './types'

export default {
  logoAlt: 'Astro homepage',
  title: 'Your Astro project is ready.',
  description:
    'Start with a page, compose its sections, and keep useful pieces reusable. This small example gives you a working structure to build on.',
  filesTitle: 'Where to begin',
  files: [
    {
      path: 'src/pages',
      title: 'Connect the page',
      description:
        'Choose the layout, route data and sections that belong on each page.'
    },
    {
      path: 'src/sections',
      title: 'Build the content',
      description: 'Keep each page area and its specific content together.'
    },
    {
      path: 'src/components',
      title: 'Reuse the essentials',
      description:
        'Compose sections with the shared headings, links, buttons and layout primitives.'
    }
  ],
  footer: 'Built with Astro. Ready for your next site.',
  demo: {
    title: 'A second page, the same structure.',
    description:
      'The header and footer stay in place while the page content changes. The navigation marks this page as active, using ordinary links and server-rendered HTML.',
    structureTitle: 'How this page is composed',
    steps: [
      {
        path: 'src/pages/[...locale]/demo.astro',
        title: 'The route chooses the pieces',
        description:
          'The page sets its metadata and composes the shared layout, header, content and footer.'
      },
      {
        path: 'src/layouts/Main.astro',
        title: 'The layout owns the document',
        description:
          'Main keeps the head and one main landmark. Named slots place the header and footer outside the content.'
      },
      {
        path: 'src/sections/DemoPage/index.astro',
        title: 'The section owns this content',
        description:
          'The section reads its dictionary and combines Section, Box, H and Button without adding UI to the route file.'
      }
    ]
  }
} satisfies Welcome
