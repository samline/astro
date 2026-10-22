# Astro Kit

Base nueva sobre Astro 7 para sitios SSG con Server Islands y despliegue en
Vercel. Las páginas se generan al compilar; los componentes con `server:defer`
se resuelven bajo demanda mediante el adaptador de Vercel.

## Generador de proyectos

La base se desarrolla en esta raíz. El paquete publicable
`@samline/astro-kit` vive en `packages/cli`, no tiene dependencias propias y
recibe una plantilla generada desde una lista explícita de archivos de la raíz.
No se mantiene una segunda copia manual de la base.

Después de publicar en npm:

```sh
npx @samline/astro-kit@latest mi-proyecto
# Alternativa:
pnpm dlx @samline/astro-kit@latest mi-proyecto
```

El asistente pregunta dónde desplegar: estático, Vercel (predeterminado),
Netlify, Cloudflare Workers o custom (servidor propio con Node standalone).
Todos conservan `output: 'static'`; estático no instala adaptador ni admite
Server Islands. Los otros destinos añaden solo su adaptador oficial compatible
con Astro 7. Cloudflare ejecuta las islas en workerd; Netlify, en Node.js.
Por compatibilidad con Miniflare, Astro y Wrangler usan Node.js al elegir
Cloudflare, aunque los comandos se lancen con `bun run`.
Custom usa Bun si está disponible y Node.js como alternativa.

Se generan `astro.config.mjs`, dependencias, scripts, variables documentadas y
archivos del proveedor: `vercel.json`, `netlify.toml` o `wrangler.jsonc` según el
destino. Custom añade `start`, HOST y PORT; Cloudflare añade Wrangler, `deploy`,
`cf:types` y `.dev.vars.example`. No se generan credenciales ni se despliega al
crear el proyecto. El README generado explica el destino elegido. La raíz del
kit conserva Vercel como configuración de desarrollo.

Para automatizar, indica el destino; `--site` configura el origen de producción
en `.env.production` (ignorado por Git):

```sh
npx @samline/astro-kit@latest mi-proyecto --deploy netlify --site https://example.com
```

Sin terminal interactiva, `--deploy` y la carpeta son obligatorios.
Sin destino de carpeta, el asistente también pregunta dónde crear el proyecto.
`--no-install` permite generar sin descargar
dependencias. Nunca sobrescribe una carpeta con contenido ni instala herramientas
globales. La detección se realiza por separado:

| pnpm disponible | Bun disponible | Instala con | Ejecuta con   |
| --------------- | -------------- | ----------- | ------------- |
| Sí              | Sí             | pnpm        | Bun           |
| Sí              | No             | pnpm        | npm / Node.js |
| No              | Sí             | npm         | Bun           |
| No              | No             | npm         | npm / Node.js |

Los scripts, `packageManager`, el hook de instalación, el README y la configuración de despliegue se
generan según esa combinación. El instalador arranca con Node.js para que npx
funcione sin Bun. La primera instalación crea el lockfile propio del proyecto;
debe conservarse antes de desplegar con instalación congelada.

El proyecto generado es privado, inicia en `0.0.1`, registra la versión de Astro
Kit que lo creó y es independiente: futuras publicaciones del kit no lo alteran.
No se distribuyen los archivos de entorno reales, contexto local, dependencias,
cachés, configuración del workspace ni resultados de compilación.

## Preparar una publicación

La versión de la raíz y la del instalador es `7.3.2`. La serie `7.x.y` está
reservada para Astro 7: parches para correcciones y menores para nuevas funciones.
La serie 8 empieza cuando se adapte la base a Astro 8; las versiones menores
no necesitan coincidir con las del framework. Mantén compatible el CLI dentro
de cada serie mayor.

```sh
bun run verify
bun run kit:pack
```

El tarball se escribe en `artifacts/samline-astro-kit-7.3.2.tgz`. Se puede probar
antes de publicar:

```sh
npm exec --yes --package ./artifacts/samline-astro-kit-7.3.2.tgz -- astro-kit mi-prueba
```

Para una siguiente versión:

```sh
bun run kit:version 7.3.3
bun run verify
bun run kit:pack
```

`kit:version` actualiza ambos manifiestos y rechaza versiones que no avanzan o
pertenecen a otro major de Astro. `kit:prepare` regenera la plantilla;
`packages/cli/template` está ignorado por Git y no debe editarse manualmente.
El hook de empaquetado comprueba las versiones y rechaza archivos no publicables
y enlaces simbólicos en la plantilla.

La publicación es un paso manual separado, con una cuenta que tenga permisos
sobre `@samline` y el método de autenticación vigente de npm. Después de revisar
el tarball, se publica ese mismo artefacto con acceso público. Preparar o
empaquetar no publica nada.

## Idiomas y traducciones

`src/i18n/config.ts` es la fuente única de idiomas para Astro, las rutas y el
sitemap. El predeterminado es `en-us` y se sirve en `/`, sin prefijo. Para activar
inglés de México, descomenta `locales.push('en-mx')` en ese archivo: se genera
`/en-mx` y aparece el selector de idioma. `en-mx` significa inglés de México;
no se sustituye por español (`es-mx`).

Los diccionarios están separados por idioma y responsabilidad. Cada módulo
contiene `index.ts` con sus traducciones y `types.ts` con su contrato:

```text
src/i18n/dictionaries/
├── en-us/
│   ├── common/      (index.ts + types.ts)
│   ├── forms/       (index.ts + types.ts)
│   ├── buttons/     (index.ts + types.ts)
│   ├── site/        (index.ts + types.ts)
│   ├── navigation/  (index.ts + types.ts)
│   ├── languages/   (index.ts + types.ts)
│   ├── welcome/     (index.ts + types.ts)
│   ├── errors/      (index.ts + types.ts)
│   ├── seo/         (index.ts + types.ts)
│   └── index.ts
└── en-mx/          (misma estructura)
```

El `index.ts` de cada idioma solo reúne módulos; no contiene textos. Los tipos
se definen junto al módulo de `en-us`; el `types.ts` correspondiente de `en-mx`
reexporta el mismo contrato para evitar divergencias. `src/i18n/types.ts` solo
compone esos contratos en `Dictionary`, sin concentrar las definiciones de campos.

Usa `dictionary.common` para textos generales, `dictionary.buttons` para acciones,
`dictionary.forms` para formularios y los demás módulos según su responsabilidad.
El nombre y SEO del sitio se editan en `site/index.ts`, no en env.
Todo texto visible del sitio debe venir de estos diccionarios, incluidos
`title`, descripción, etiquetas accesibles, alt, placeholders y estados.

```astro
---
import { getDictionary } from '@/i18n'

const dictionary = getDictionary(Astro.currentLocale)
---

<h1>{dictionary.site.title}</h1>
```

El layout utiliza `lang`, canonical y alternates `hreflang` de los idiomas
activos. La página de inicio comparte una sola composición y `getStaticPaths`
genera las variantes SSG. La página 404 utiliza el idioma predeterminado.
Se usa `Astro.currentLocale` para conocer el idioma. Los enlaces se construyen
con `getRelativeLocaleUrl` y `getAbsoluteLocaleUrl` de `astro:i18n`, respetando la
configuración del framework. No hay un router propio. El layout y el selector
reciben `path`, la ruta sin prefijo de idioma (por ejemplo `/about`); no pases
`/en-mx/about`, porque Astro añade el prefijo correspondiente. Los slugs son
compartidos entre idiomas. `getStaticPaths` está en la página dinámica que lo
requiere, en lugar de una utilidad de routing separada.

Los componentes Astro y layouts leen `Astro.currentLocale` directamente;
no reciben ni propagan un prop `locale`. `getStaticPaths` solo genera parámetros
de ruta, sin duplicar el idioma en `props`. Normaliza con `resolveLocale` cuando
necesites el código para enlaces o atributos.

En Server Islands, pasa el locale de la página como prop explícita. Dentro de la
isla usa `getDictionary(Astro.props.locale)`: su URL es un endpoint independiente,
no la ruta original del visitante. En scripts del navegador, pasa solamente las
traducciones necesarias desde el componente, sin duplicar textos ni cargar todos
los diccionarios por defecto.

`bun run check:i18n` detecta textos literales en el markup Astro, atributos
accesibles y metadatos. Forma parte de `verify` y también se distribuye en los
proyectos generados. Es una protección estática de plantillas, no un análisis de
flujo de datos: también debes mantener en diccionarios los mensajes construidos
en JavaScript. Las instrucciones del CLI y la documentación son herramientas de
desarrollo; no son contenido del sitio.

## Herramientas de desarrollo

- pnpm 12.9.1 para instalar, agregar y eliminar dependencias.
- Bun >=1.3.14 para ejecutar todos los comandos del proyecto.
- Node.js >=22.23.4 para pnpm; `.nvmrc` selecciona Node 24.
- TypeScript 6 y comprobación de Astro.
- Prettier con el plugin oficial de Astro y EditorConfig.

El hook de instalación exige pnpm. Los scripts fuerzan el runtime de Bun y
`bunfig.toml` desactiva la instalación automática de dependencias.
También desactiva la carga automática de archivos de entorno de Bun para que
Astro/Vite seleccione el entorno correcto al desarrollar o compilar.

## Inicio

```sh
pnpm install
cp .env.example .env.development
bun run dev
```

El servidor de desarrollo se inicia en segundo plano en `http://localhost:4321`.

| Comando                    | Uso                                       |
| -------------------------- | ----------------------------------------- |
| `bun run dev`              | Iniciar desarrollo en segundo plano       |
| `bun run astro dev status` | Consultar el servidor                     |
| `bun run astro dev logs`   | Consultar los logs                        |
| `bun run astro dev stop`   | Detener el servidor                       |
| `bun run check`            | Comprobar Astro y TypeScript              |
| `bun run build`            | Generar la salida de producción de Vercel |
| `bun run preview`          | Previsualizar la parte estática compilada |
| `bun run format`           | Formatear el proyecto                     |
| `bun run format:check`     | Comprobar el formato                      |
| `bun run verify`           | Comprobar formato, tipos y compilación    |
| `bun run astro …`          | Ejecutar otros comandos de Astro          |

`astro preview` no emula las funciones de Vercel ni las Server Islands.
Comprueba las islas con `bun run dev` y su ejecución en Vercel mediante un
Preview Deployment.

## Variables de entorno

`.env.example` documenta las variables. Los archivos `.env`, `.env.development`,
`.env.production` y sus variantes locales están ignorados por Git.

| Variable         | Disponibilidad                 | Valor predeterminado                        |
| ---------------- | ------------------------------ | ------------------------------------------- |
| `SITE_URL`       | Servidor y generación estática | Dominio de producción de Vercel o localhost |
| `SITE_INDEXABLE` | Política SEO al compilar       | Automática; `false` para staging            |
| `ASTRO_KEY`      | Interna de Astro, opcional     | Clave generada por Astro por build          |

El esquema de `astro.config.mjs` valida `SITE_URL` como URL y genera tipos para
`astro:env/server` y `astro:env/client`. Las variables del sistema tienen
prioridad sobre los archivos de entorno. La configuración carga el entorno
`development` o `production` según `NODE_ENV`, los modos usados por los comandos
predeterminados.

En Vercel configura `SITE_URL` con el origen final, por ejemplo
`https://www.example.com`, en Production y Preview para mantener una URL de
referencia estable. Si se omite, se usa `VERCEL_PROJECT_PRODUCTION_URL`; fuera de
Vercel se usa `http://localhost:4321`. Para compilar localmente con el dominio
final, define `SITE_URL` en `.env.production`.

Agrega las futuras variables al esquema y a `.env.example` cuando se incorpore
su funcionalidad. Las credenciales deben declararse como
`context: 'server', access: 'secret'`; no uses el prefijo `PUBLIC_` para secretos.

`ASTRO_KEY` no es una variable pública ni se declara en el esquema de aplicación.
Si necesitas conservar la clave de cifrado de props de las Server Islands entre
despliegues, genera una con `bun run astro create-key` y guárdala en Vercel.
Cada proyecto debe tener su propia clave; no se incluye ninguna en esta base.

## Configuración de Astro

- `output: 'static'`: SSG por defecto. El SSR general se decide en cada proyecto.
- Adaptador Vercel activo para las Server Islands.
- URLs sin slash final, coherentes con `vercel.json`.
- Sitemap oficial generado a partir de `site` y las rutas estáticas.
- Imágenes con layout `constrained`, procesadas por Astro. La optimización de
  imágenes de Vercel está desactivada.
- TypeScript estricto y alias `@/*` hacia `src/*`.

No se requieren flags experimentales para las Server Islands. Un componente
Astro se convierte en isla con `server:defer`; puede recibir contenido
`slot="fallback"`. No cambies `output` a `server` para habilitar una isla.

## Vercel

Importa el repositorio con esta carpeta como raíz. `vercel.json` define:

- Framework Astro.
- Instalación reproducible: `pnpm install --frozen-lockfile`.
- Compilación con Bun: `bun run check:i18n && bun run check && bun run build`.
- Funciones con Bun mediante `bunVersion: '1.x'` (actualmente Bun 1.3).

El adaptador genera `.vercel/output/`; no configures `dist` manualmente como
directorio de publicación. La base no activa ISR, cachés compartidas de contenido
personalizado, analítica ni integraciones de UI.

## SEO y recursos públicos

`public/img`, `public/docs` y `public/video` contienen `.gitkeep` para conservar
las carpetas en Git y en el paquete. Sus recursos se sirven como `/img/archivo`,
`/docs/archivo` y `/video/archivo`, conservando nombre y bytes, sin procesamiento
por Astro. Los recursos que necesiten optimización se importan desde `src/assets`.

`Layout.astro` delega los metadatos en `src/components/SEO.astro`. Las páginas
reciben título, descripción, canonical y alternates por idioma, Open Graph,
Twitter Cards, favicon, color del navegador y JSON-LD. El título de una página
usa `seo.titleTemplate`; la portada conserva `site.title`. `titleAbsolute`
permite un título completo. Los textos permanecen en los diccionarios `site` y
`seo`, con `index.ts` y `types.ts` por idioma.

```astro
---
import Layout from '@/layouts/Layout.astro'
import { getDictionary } from '@/i18n'

const dictionary = getDictionary(Astro.currentLocale)
---

<Layout
  path='/about'
  title={dictionary.navigation.home}
  description={dictionary.site.description}
>
  <main id='main-content'>{dictionary.navigation.home}</main>
</Layout>
```

`path` es la ruta sin idioma, parámetros ni hash. Las URLs se construyen con
`astro:i18n` y el origen de `SITE_URL`, sin depender del dominio de una petición
ni de parámetros de seguimiento. Usa `alternateLocales` si una página solo
existe en parte de los idiomas; `canonical` permite una URL canónica explícita.

`src/config/seo.ts` reúne ajustes técnicos: color, imagen social predeterminada,
cuentas reales de Twitter/X, icono Apple, manifest y `noindexPaths`. La imagen
social está desactivada hasta que añadas un archivo real. Configura sus medidas
reales y traduce `seo.imageAlt`, o pasa `image={{ src, alt, width, height, type }}`
al layout con un `alt` del diccionario. `image={null}` la desactiva por página.
No se publican URLs de imágenes, iconos adicionales o manifests inexistentes.
Las cuentas sociales se configuran explícitamente, sin inferirlas del nombre.

Se emiten datos estructurados WebSite en la portada predeterminada y WebPage en
las páginas indexables. `structuredData` admite objetos adicionales para el
contenido real, por ejemplo Article o BreadcrumbList; `type='article'` cambia
el tipo Open Graph. JSON-LD se serializa escapando contenido que pudiera cerrar
el elemento `script`. No se inventan organizaciones, autores, reseñas o negocios.
El slot `head` permite etiquetas adicionales sin duplicar las del componente.

### Indexación y robots

`SITE_INDEXABLE` controla robots, metadatos y la generación del sitemap. Por
defecto se permite indexar builds de producción con un origen distinto de
localhost. Desarrollo y previews detectadas de Vercel/Netlify quedan con
`noindex`, sin sitemap y con `Disallow: /`. Configura `SITE_INDEXABLE=false` al
compilar staging, incluidas previews de Workers y servidores propios. Un valor
explícito `true` o `false` tiene prioridad sobre la detección.

`src/pages/robots.txt.ts` genera un **archivo estático** `/robots.txt` con el
sitemap del dominio configurado; no requiere funciones de servidor. No añadas
otro `public/robots.txt`, porque competirían por la misma URL. No es un archivo
por idioma: corresponde a la raíz del sitio.

Para excluir una ruta de SEO, añádela a `seoConfig.noindexPaths` sin prefijo de
idioma. Esa lista aplica `noindex` y la retira del sitemap en todos los idiomas;
acepta rutas exactas, no patrones. Para excepciones de una sola página también
existen `noindex` y `nofollow` en el layout. Si usas `noindex` directamente,
retira además la ruta del sitemap mediante `noindexPaths`. La 404 está excluida
por defecto y no emite canonical, alternates ni JSON-LD.

Las reglas se fijan durante el build SSG: cambiar variables del servidor después
requiere recompilar las páginas, robots y sitemap.

## Referencias

- [Configuración de Astro](https://docs.astro.build/en/reference/configuration-reference/)
- [Variables de entorno](https://docs.astro.build/en/guides/environment-variables/)
- [Server Islands](https://docs.astro.build/en/guides/server-islands/)
- [Adaptador Vercel](https://docs.astro.build/en/guides/integrations-guide/vercel/)
- [Bun en Vercel](https://vercel.com/docs/functions/runtimes/bun)

- [Sitemap y robots en Astro](https://docs.astro.build/en/guides/integrations-guide/sitemap/#sitemap-discovery)
- [Open Graph](https://ogp.me/)
- [Robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [WebSite y nombre del sitio](https://developers.google.com/search/docs/appearance/site-names)
