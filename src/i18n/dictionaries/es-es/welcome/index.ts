import type { Welcome } from './types'

export default {
  logoAlt: 'Página de inicio de Astro',
  title: 'Tu proyecto de Astro está listo.',
  description:
    'Empieza con una página, organiza sus secciones y reutiliza las piezas que lo necesiten. Este ejemplo te ofrece una estructura funcional para empezar.',
  filesTitle: 'Por dónde empezar',
  files: [
    {
      path: 'src/pages',
      title: 'Conecta la página',
      description:
        'Elige el layout, los datos de la ruta y las secciones de cada página.'
    },
    {
      path: 'src/sections',
      title: 'Construye el contenido',
      description:
        'Mantén cada área de la página junto con su contenido específico.'
    },
    {
      path: 'src/components',
      title: 'Reutiliza lo esencial',
      description:
        'Compón las secciones con los encabezados, enlaces, botones y contenedores compartidos.'
    }
  ],
  footer: 'Hecho con Astro. Listo para tu próximo sitio.',
  demo: {
    title: 'Otra página, la misma estructura.',
    description:
      'La cabecera y el pie se mantienen mientras cambia el contenido. La navegación señala esta página como activa con enlaces normales y HTML generado en el servidor.',
    structureTitle: 'Cómo se compone esta página',
    steps: [
      {
        path: 'src/pages/[...locale]/demo.astro',
        title: 'La ruta elige las piezas',
        description:
          'La página define sus metadatos y combina el layout, la cabecera, el contenido y el pie compartidos.'
      },
      {
        path: 'src/layouts/Main.astro',
        title: 'El layout controla el documento',
        description:
          'Main conserva el head y un solo elemento main. Los slots con nombre colocan la cabecera y el pie fuera del contenido.'
      },
      {
        path: 'src/sections/DemoPage/index.astro',
        title: 'La sección contiene este bloque',
        description:
          'La sección lee su diccionario y combina Section, Box, H y Button sin dejar interfaz en el archivo de la ruta.'
      }
    ]
  }
} satisfies Welcome
