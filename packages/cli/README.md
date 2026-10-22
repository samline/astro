# @samline/astro-kit

Generador de sitios Astro 7 con SSG y despliegue configurable.

```sh
npx @samline/astro-kit@latest mi-proyecto
```

Sin nombre, pregunta la carpeta. Con `--no-install`, crea los archivos sin
descargar dependencias. Nunca sobrescribe un destino con contenido.

Detecta pnpm y Bun por separado: prefiere pnpm para instalar y Bun para ejecutar;
usa npm cuando falta la herramienta correspondiente. Los scripts, el gestor
fijado y el despliegue se adaptan a esa combinación.

Requiere Node.js >=22.23.4 y npm o pnpm. No instala herramientas globales.

La serie 7.x corresponde a Astro 7. Los proyectos creados son privados y tienen
su propia versión inicial 0.0.1; no se actualizan al publicar el generador.

El asistente permite elegir static, vercel (predeterminado), netlify, cloudflare
(Workers) o custom (Node standalone). La salida sigue siendo SSG; static no
admite Server Islands. Instala solo el adaptador del destino elegido.

```sh
npx @samline/astro-kit@latest mi-proyecto --deploy cloudflare --site https://example.com
```

`--deploy` es obligatorio en ejecuciones sin terminal interactiva. `--site` es
opcional y escribe el origen de producción en `.env.production`, ignorado por
Git. `--no-install` genera sin instalar ni desplegar. Las instrucciones concretas
se incluyen en el README del proyecto generado.

Incluye SEO multilingüe, Open Graph, Twitter Cards, JSON-LD, robots y sitemap
con una política compartida de indexación. `SITE_INDEXABLE=false` desactiva la
indexación al compilar staging. Los textos SEO están en los diccionarios.
`public/img`, `public/docs` y `public/video` se distribuyen con `.gitkeep`.
