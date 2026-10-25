# @samline/astro

Generador de sitios Astro 7 con SSG y despliegue configurable.

```sh
npx @samline/astro@latest mi-proyecto
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
npx @samline/astro@latest mi-proyecto --deploy cloudflare --site https://example.com
```

`--deploy` es obligatorio en ejecuciones sin terminal interactiva. `--site` es
opcional y escribe el origen de producción en `.env.production`, ignorado por
Git. `--no-install` genera sin instalar ni desplegar. Las instrucciones concretas
se incluyen en el README del proyecto generado.

Incluye SEO multilingüe, Open Graph, Twitter Cards, JSON-LD, robots y sitemap
con una política compartida de indexación. `SITE_INDEXABLE=false` desactiva la
indexación al compilar staging. Los textos SEO están en los diccionarios.
`public/img`, `public/docs` y `public/video` se distribuyen con `.gitkeep`.

La interfaz se organiza como layout → section → component. Las páginas componen
`Main` con bloques de `src/sections`, y estos se construyen con `src/components`.
El layout mantiene un único `<main>` y las páginas no contienen markup de UI.

Incluye GTM opcional y CookieConsent con carga diferida por interacción,
Consent Mode v2 y categorías independientes. Sin GTM_ID no se activa.

## Bundled agent context

Generated projects include root AGENTS.md and a portable .agents directory with
coding conventions, an initial project summary, architecture notes, and fresh
lessons/todos files. The summary reflects the selected deployment, package manager,
and runtime. It contains no maintainer commit history, local references, or kit
publication tasks.

Bundled skills cover Astro, Tailwind, TypeScript, Bun, Vite, SEO, accessibility,
frontend design, and codebase/source exploration. Vercel deployments also receive
the Vercel deployment skill. The root skills-lock.json retains provenance for
registry skills, and skill references and license files are preserved.

No extra network request or global skill installation is needed when creating a
project: these files are included in the generator. Keep the context versioned
with the new project and update it as work progresses. Skills are guidance and
do not override project rules or authorize deployment by themselves. Graph-based
exploration needs its MCP service; source inspection is the fallback when absent.
