# SAM Astro

Base nueva sobre Astro 7 para sitios SSG con Server Islands y despliegue en
Vercel. Las páginas se generan al compilar; los componentes con `server:defer`
se resuelven bajo demanda mediante el adaptador de Vercel.

## Generador de proyectos

La base se desarrolla en esta raíz. El paquete publicable
`@samline/astro` vive en `packages/cli`, no tiene dependencias propias y
recibe una plantilla generada desde una lista explícita de archivos de la raíz.
No se mantiene una segunda copia manual de la base.

Después de publicar en npm:

```sh
npx @samline/astro@latest mi-proyecto
# Alternativa:
pnpm dlx @samline/astro@latest mi-proyecto
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
npx @samline/astro@latest mi-proyecto --deploy netlify --site https://example.com
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
No se distribuyen los archivos de entorno reales, historial privado del kit, dependencias,
cachés, configuración del workspace ni resultados de compilación.

## Preparar una publicación

La versión de la raíz y la del instalador es `7.14.0`. La serie `7.x.y` está
reservada para Astro 7: parches para correcciones y menores para nuevas funciones.
La serie 8 empieza cuando se adapte la base a Astro 8; las versiones menores
no necesitan coincidir con las del framework. Mantén compatible el CLI dentro
de cada serie mayor.

```sh
bun run verify
bun run kit:pack
```

El tarball se escribe en `artifacts/samline-astro-7.19.0.tgz`. Se puede probar
antes de publicar:

```sh
npm exec --yes --package ./artifacts/samline-astro-7.19.0.tgz -- samline-astro mi-prueba
```

Para una siguiente versión:

```sh
bun run kit:version 7.14.1
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

## Jerarquía de la interfaz

La composición visual sigue tres niveles: **layout → section → component**.
`src/sections` es hermana de `src/components` y `src/layouts`.

```text
src/
├── layouts/
│   └── Main.astro
├── sections/
│   ├── Welcome/
│   │   ├── index.astro
│   │   └── WelcomeContent.astro
│   └── NotFound/
│       ├── index.astro
│       └── NotFoundContent.astro
└── components/
    ├── README.md
    ├── Box/
    ├── Section/
    ├── Link/
    ├── LanguagePicker/
    ├── SEO/
    ├── PageLoader/
    ├── GTM/
    └── Theme/
```

Las páginas declaran las rutas y componen un layout con sus secciones, sin
markup de contenido, estilos o scripts de interfaz sueltos. El frontmatter
puede resolver datos, traducciones de metadatos y `getStaticPaths` cuando la
ruta lo requiera.

```astro
---
import Main from '@/layouts/Main.astro'
import Welcome from '@/sections/Welcome/index.astro'
---

<Main path='/'>
  <Welcome />
</Main>
```

`Main` define el documento, el SEO y el único `<main>` de la
página. Recibe las secciones mediante el slot; no fija qué secciones necesita
cada ruta. Una futura página Contact usará `Main` con sus propias secciones.
SEO es un componente compartido del documento que se utiliza desde el layout.

Cada sección tiene su carpeta en `sections`, con `index.astro` como entrada y
sus componentes específicos junto a ella. `components` contiene exclusivamente
piezas reutilizables entre secciones o layouts. Usa
`Section/index.astro` como contenedor semántico: reenvía atributos HTML tipados,
clases y atributos accesibles a `<section>`. El contenido, el comportamiento y
los estilos de las piezas reutilizables viven en `components`; el contenido y
los componentes exclusivos de una sección viven dentro de su carpeta. Los estilos
de composición pertenecen a la sección o al layout correspondiente. Los componentes no
importan secciones ni layouts, y las secciones no importan páginas ni layouts.

La portada sigue `Main → Welcome → Section + Box + WelcomeContent + LanguagePicker + ThemeSwitch`;
la 404 sigue `Main → NotFound → Section + Box + NotFoundContent`. Cada pieza resuelve su idioma con
`Astro.currentLocale`, sin pasarlo por props. Los endpoints como `robots.txt.ts`
no forman parte de esta jerarquía visual.

### Section y Box

Son componentes de composición con responsabilidades distintas:

| Componente | Responsabilidad                                          | Valores predeterminados                                                  |
| ---------- | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| `Section`  | Bloque semántico `<section>`, ancla y espaciado vertical | `id` obligatorio; padding de 2.5rem, 4rem desde 48rem y 5rem desde 64rem |
| `Box`      | Contenedor `<div>` que centra y limita el contenido      | Ancho completo hasta 90rem, con 1.25rem de espacio lateral               |

El patrón habitual dentro de un archivo de `sections` es:

```astro
---
import Section from '@/components/Section/index.astro'
import Box from '@/components/Box/index.astro'
import NotFoundContent from '@/sections/NotFound/NotFoundContent.astro'
---

<Section id='not-found' aria-labelledby='not-found-title'>
  <Box>
    <NotFoundContent />
  </Box>
</Section>
```

`Section` organiza la página y puede contener varios Box, fondos o bloques de
ancho completo; no centra ni limita el ancho de sus hijos automáticamente.
`Box` no es una tarjeta y no añade fondo, borde ni padding vertical.

Usa `padded={false}` para quitar el padding predeterminado de Section. Su espacio
se puede ajustar con `--section-padding-block`; `--section-scroll-offset`
compensa el desplazamiento de anclas cuando un proyecto tenga cabecera fija.

Box tiene una única opción de ancho: `size='default'` (90rem),
`size='narrow'` (48rem, para formularios o contenido concentrado),
`size='wide'` (120rem) o `size='fluid'` (sin máximo). Reemplaza los antiguos `x2` y `liquid`
por `wide` y `fluid`, evitando combinaciones contradictorias de booleanos.
`--box-max-width` permite otro máximo y `--box-gutter` ajusta el espacio lateral.

Ambos aceptan clases y atributos HTML nativos tipados, incluidos `aria-*`,
`data-*` y `style`, y conservan los atributos que Astro necesita para los estilos
scoped del padre. Los props de configuración se consumen en el servidor y no
aparecen como atributos del DOM. Usan slots y CSS nativo, sin JavaScript cliente
y permiten clases Tailwind en su API. Mantén los ids únicos y las etiquetas accesibles
asociadas a encabezados reales.

### Link

`src/components/Link/index.astro` es el enlace de navegación común, sin estilos propios
ni JavaScript cliente. Requiere `href`, acepta atributos nativos de `<a>` y
conserva clases, slots y estilos scoped del padre.

```astro
---
import Link from '@/components/Link/index.astro'
import { getDictionary } from '@/i18n'
const dictionary = getDictionary(Astro.currentLocale)
---

<Link href='/'>{dictionary.buttons.backHome}</Link>
<Link href='/docs/guide.pdf' download>
  {dictionary.navigation.documentation}
</Link>
<Link href='/img/logo.svg' localize={false}>
  {dictionary.site.title}
</Link>
```

Las rutas que empiezan por `/` se localizan mediante `getRelativeLocaleUrl()` y
`Astro.currentLocale`, independientemente de `target`. Se conservan query y hash,
y las rutas que ya empiezan por un idioma activo no reciben otro prefijo.
Los enlaces externos, `//`, `mailto:`, `tel:`, relativos, `#anclas`, `?queries`
y las descargas conservan su destino. Usa `localize={false}` para recursos públicos,
endpoints sin idioma o URLs ya resueltas, como las del selector de idiomas.

`target='_blank'` añade `noopener` conservando los demás valores de `rel`.
`noreferrer` es opcional y se pasa explícitamente cuando se quiera ocultar el referente.
El nombre accesible procede del contenido o de un `aria-label` traducido; no se
inserta una etiqueta genérica. Las anclas usan `href='#id'` y funcionan con teclado
y sin JavaScript. Los envíos de formularios corresponden a `<button type='submit'>`.

## Tailwind CSS 4

Tailwind se integra con `@tailwindcss/vite` en `astro.config.mjs`. `Main.astro`
importa `src/styles/global.css`, que carga `tailwind.css`. La configuración es
CSS-first con `@theme`; no se usa `tailwind.config.js`, PostCSS ni `@astrojs/tailwind`.

La escala responsive toma dinkbit como referencia y usa rem de forma consistente:

| Variante | Desde      | Equivalencia con raíz de 16px |
| -------- | ---------- | ----------------------------- |
| `xs:`    | 23.4375rem | 375px                         |
| `sm:`    | 37.5rem    | 600px                         |
| `md:`    | 48rem      | 768px                         |
| `lg:`    | 64rem      | 1024px                        |
| `xl:`    | 75rem      | 1200px                        |
| `2xl:`   | 85.375rem  | 1366px                        |
| `3xl:`   | 90rem      | 1440px                        |

Usa `max-sm:` para menos de 600px, `max-md:` para menos de 768px, o combina
`md:max-lg:` para un rango. No hay breakpoints duplicados con sufijo `_`.

La paleta se define directamente en `src/styles/tailwind.css`, dentro de `@theme`:

- `black`, `white`, `placeholder` (#999), `state-success`, `state-warning` y `state-error`.
- `accent`, `accent-light`, `accent-dark` (azul).
- `accent-sec`, `accent-sec-light`, `accent-sec-dark` (violeta).
- `accent-third`, `accent-third-light`, `accent-third-dark` (rosa).

`placeholder` se aplica por defecto a inputs y textareas; se puede usar también
con `placeholder:text-placeholder`.

Los tonos principales vienen de la [paleta del sitio de Astro](https://github.com/withastro/astro.build/blob/main/tailwind.config.ts):
azul `#3245ff`, violeta `#bc52ee` y rosa `#f041ff`. Los tonos light y dark
son derivados propios, mezclados un 20% con blanco y negro respectivamente.
Cada tono tiene su propio valor hexadecimal y puede ajustarse de forma independiente.
No hay configuración de colores en TypeScript ni variables inyectadas en `<html>`.
La paleta predeterminada de Tailwind está desactivada. Usa, por ejemplo, `bg-accent`,
`hover:bg-accent-sec-dark`, `text-accent-third` o `bg-accent/10`.

La meta `theme-color` del head de `Main.astro` tiene el valor del acento principal
(#3245ff). Cuando cambies ese acento, actualiza también el valor de la meta:
HTML necesita un color concreto y no resuelve `var()` de CSS en ese atributo.

`font-primary` y `font-secondary` se definen directamente en `@theme` como
`'Inter Variable', ui-sans-serif, system-ui, sans-serif`. Se pueden cambiar
independientemente, sin `@theme inline` ni configuración tipográfica en TypeScript.
`global.css` importa `@fontsource-variable/inter/wght.css` y `wght-italic.css`:
pesos variables 100–900, normal e itálica, con `font-display: swap`. Vite publica
los archivos WOFF2 con el sitio; no se solicitan fuentes a Google Fonts ni a un CDN.
Los rangos Unicode permiten que el navegador descargue los subconjuntos que necesite.
Para cambiar de familia, instala su paquete con pnpm, actualiza los imports de
`global.css` y los tokens de `tailwind.css`.

Las reglas base de tipografía, placeholders y selección de texto viven en
`global.css`, separadas de los tokens de Tailwind. La duración predeterminada de transición es 200ms. `dark:` y `light:` se activan mediante
`data-theme='dark'` o `data-theme='light'` en un ancestro. `ThemeSwitch` y `ThemeInit`
controlan la elección y su persistencia.

Tailwind solo busca clases en `src/`: excluye documentación, pruebas y la copia
generada del instalador. Escribe clases completas, sin concatenar nombres dinámicos;
registra con `@source` cualquier biblioteca externa que lo requiera.
Prettier ordena las clases usando este mismo tema, y VS Code recomienda Tailwind
CSS IntelliSense y reconoce los archivos CSS con su sintaxis.

El normalize se apoya en Preflight de Tailwind: ya resuelve márgenes, padding,
`box-sizing`, bordes, imágenes y videos responsive, y herencia de fuentes en formularios.
`global.css` añade el balance de títulos, corte de cadenas largas en títulos y párrafos,
SVGs limitados al contenedor, foco visible de teclado, cursor en botones habilitados,
placeholders y selección de texto. Las transiciones de enlaces afectan solo a colores
y decoración y se activan cuando el usuario no solicita reducir el movimiento.

Las medidas CSS propias usan `rem` (conversión de referencia: 1rem = 16px);
los ceros se escriben sin unidad. Se conserva el tamaño de fuente configurado
por el usuario en el navegador.
No hay resets globales de outline, `position: relative` para todos los bloques,
bloqueo de selección de imágenes, cambios globales del color hover ni `transition: all`.
Los estilos viven en `@layer base`, de modo que las utilidades Tailwind pueden
sobrescribirlos. Los estilos propios de cada sección siguen en su carpeta; los
componentes reutilizables mantienen sus contratos y variables de personalización.

## Temas claro y oscuro

`Main.astro` incluye `ThemeInit` en el head. El tema se aplica antes de mostrar la
página, usa `data-theme` en `<html>` y activa las variantes `dark:` y `light:` de
Tailwind. `global.css` define el fondo, texto y `color-scheme` de cada modo.
El ejemplo en `WelcomeContent.astro` usa `light:text-black dark:text-white`
para el contenido y `dark:brightness-0 dark:invert` para el logo: aplica las
variantes directamente en las clases del elemento, sin selectores CSS de tema.
Los colores y las variables visuales siguen definidos en `tailwind.css`.

`src/config/theme.ts` solo configura comportamiento: `defaultPreference` puede
ser `system` (predeterminado), `light` o `dark`; `storageKey` identifica la preferencia
guardada. El tema sigue al sistema hasta que el usuario elige otro. Sin JavaScript
se muestra el modo predeterminado fijo (claro si se usa `system`) y se oculta el switch.

Para integrar el control en cualquier sección o componente compartido:

```astro
---
import ThemeSwitch from '@/components/Theme/Switch.astro'
---

<ThemeSwitch class='my-theme-switch' />
```

El componente ya está en Welcome. Acepta atributos nativos de botón, clases y un
slot para una etiqueta traducida alternativa. Su etiqueta predeterminada viene de
`themes.darkMode`. Usa `role='switch'` y `aria-checked`, funciona con teclado y
sincroniza todas sus instancias. No necesita props de idioma ni un framework cliente.

La preferencia se guarda en localStorage, se sincroniza entre pestañas y sigue
funcionando en memoria si el almacenamiento está bloqueado. Se conservan tema y
controles al navegar con Astro ClientRouter si se incorpora más adelante.

Para volver a seguir al sistema desde un control propio:

```ts
window.samlineAstroTheme?.setPreference('system')
```

La misma API acepta `light` y `dark`, expone `getPreference()` y `getTheme()`,
y emite `themechange` en `window` con `{ theme, preference }` en `event.detail`.
Las animaciones del switch respetan la preferencia de movimiento reducido.

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
- Prettier con plugins de Astro y Tailwind, y EditorConfig.

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

`Main.astro` delega los metadatos en `src/components/SEO/index.astro`. Las páginas
reciben título, descripción, canonical y alternates por idioma, Open Graph,
Twitter Cards, favicon, color del navegador y JSON-LD. El título de una página
usa `seo.titleTemplate`; la portada conserva `site.title`. `titleAbsolute`
permite un título completo. Los textos permanecen en los diccionarios `site` y
`seo`, con `index.ts` y `types.ts` por idioma.

```astro
---
import Main from '@/layouts/Main.astro'
import NotFound from '@/sections/NotFound/index.astro'
import { getDictionary } from '@/i18n'

const dictionary = getDictionary(Astro.currentLocale)
---

<Main path='/404' title={dictionary.errors.notFound.title} noindex>
  <NotFound />
</Main>
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

## Google Tag Manager y consentimiento

`Main` integra `GTM/Head` y `GTM/Consent`. Sin `GTM_ID` no se muestra el aviso ni
se carga GTM. Configura `GTM_ID=GTM-XXXXXXX` en el entorno antes de compilar.
`GTM_ENABLED` permite activarlo o desactivarlo explícitamente; por defecto solo
se activa en producción con origen no local, fuera de previews Vercel/Netlify.
Esta decisión es independiente de `SITE_INDEXABLE`.

`src/config/gtm.ts` configura el comportamiento. El modo predeterminado es
`basic`: las cuatro señales de Consent Mode v2 empiezan denegadas y GTM no se
descarga hasta aceptar analytics o advertising. Las categorías son independientes:
analytics no concede permisos publicitarios. Rechazar mantiene GTM bloqueado;
retirar un permiso ya concedido actualiza las señales y recarga la página para
interrumpir los scripts cargados. Los patrones de limpieza cubren cookies comunes;
cada proyecto debe ajustarlos a las herramientas que configure en su contenedor.

Con `consentTrigger: 'interaction'`, el JavaScript y el CSS de CookieConsent se
cargan al intentar desplazar la página, interactuar por teclado o abrir Cookie
settings. No se distingue entre visitantes y herramientas de auditoría. Si ya
existe una cookie de elección, el SDK se carga al entrar y valida esa elección
antes de restaurar permisos. `immediate` permite mostrar el aviso al entrar.
No se incluye iframe noscript porque no puede aplicar esta elección.

Los textos viven en el dominio `cookies` de cada idioma. Los estilos del aviso
usan los tokens Tailwind y respetan el tema. La presentación toma dinkbit.com
como referencia: caja inferior centrada, botones neutros, preferencias en una
fila y rechazar/aceptar debajo, con fondo oscurecido mientras se decide. `privacyPolicyPath` acepta la ruta
local de una política existente; `null` omite el enlace. Cambia `revision` cuando
necesites pedir una nueva elección. La cookie de preferencias dura 180 días.
`CookiePreferences.astro` permite añadir otro botón de ajustes en cualquier sección;
lee el idioma de Astro y permanece oculto si la integración no está activa.

El modo `advanced` es opcional y carga GTM antes de aceptar, con las señales
inicialmente denegadas; puede permitir pings sin cookies según las etiquetas.
Con ClientRouter, el evento `astro_page_view` comunica cambios de ruta después
de aceptar una categoría opcional. Configura ese disparador en GTM si lo necesitas
y evita duplicarlo con medición automática del historial. No hay un page_view
manual adicional al de tus etiquetas. Verifica el contenedor real con Tag Assistant:
las etiquetas personalizadas deben respetar también sus requisitos de consentimiento.

Referencias: [CookieConsent](https://cookieconsent.orestbida.com/) y
[Consent Mode](https://developers.google.com/tag-platform/security/guides/consent).

## PageLoader

`Main` incluye `src/components/PageLoader/index.astro` dentro del body. El
indicador cubre la pantalla con un fondo translúcido y un pulso en color accent;
usa `ping` de ldrs para la animación y Tailwind para el overlay. Respeta el tema
y muestra un indicador estático cuando el usuario pide reducir el movimiento.
Su etiqueta accesible procede de `common.loading` en el idioma de Astro.

Empieza oculto, incluso sin JavaScript. Se muestra cuando una navegación interna
o un envío nativo de formulario tarda más de 250ms. Ignora anclas de la página,
descargas, destinos externos, pestañas nuevas y eventos cancelados. Usa
`data-page-loader-skip` en un enlace o formulario para omitirlo. No intercepta
la navegación ni bloquea los controles.

Al volver con el historial se oculta inmediatamente. Un límite de seguridad de
10 segundos evita que el indicador permanezca activo por una navegación cancelada.
También funciona con los eventos de ClientRouter si un proyecto lo incorpora;
esta base conserva la navegación normal. No depende de beforeunload.

Para cambiar la animación, edita `index.astro`: sustituye el import de `ping`,
su llamada `register()` y la etiqueta `l-ping` por el loader de ldrs elegido
(por ejemplo, `ring` y `l-ring`). Solo se incluye la animación importada.

Para una operación asíncrona propia, importa las funciones desde el mismo módulo:

```ts
import { showLoader, hideLoader } from '@/components/PageLoader/scripts'

const save = async () => {
  showLoader()
  try {
    await saveData()
  } finally {
    hideLoader()
  }
}
```

El loader indica navegación o trabajo explícito; no espera a las Server Islands,
que deben tener su propio contenido de fallback.

## Component documentation

See [src/components/README.md](src/components/README.md) for each component's API,
props, events, and examples. Every component owns a folder containing its source,
README, and any supporting files. Single-entry components expose index.astro;
related components such as Theme's Init/Switch share their feature folder.
Developer documentation is written in English and included in generated projects.
Tailwind excludes these Markdown files so example classes do not add website CSS.

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

## Server mail

SMTP delivery and localized form notifications live in
[src/server/mail](src/server/mail/README.md). Configure the private mail settings
in your hosting runtime, then call sendFormMail or sendMail from server code.
Sending is disabled by default. A demo [contact Action](src/actions/contact/README.md)
connects form validation to the service; no contact page or form UI is installed.

## Content examples

[Content Collections](src/content/README.md) includes a local localized collection,
optional API/Strapi build loaders and an optional Astro 7 Live Collection.
[Content Actions](src/actions/content-demo/README.md) demonstrate validated API
reads and writes; they remain unregistered and writes deny access by default.
No remote request or new demo page is enabled by default.

## CAPTCHA

Choose Cloudflare Turnstile or Google reCAPTCHA v2 checkbox through
`CAPTCHA_PROVIDER=turnstile` / `recaptcha`; default `none`. Configure the public
site key at build time and the private secret in the server environment. The
contact Action verifies the token before sending mail. Pure static hosting needs
an external backend or activation of a server adapter/Action.
See [Captcha](src/components/Captcha/README.md) for configuration, rendering,
SAM Forms integration, reset/lifecycle APIs and provider limits.

## Authentication

Optional Better Auth integration supports external REST identity, OAuth/OIDC and
project-owned users. It starts disabled with an inactive auth route, no account
UI and no predefined business roles. Public pages stay SSG; protected pages opt
into server rendering, and Server Islands authorize their own requests.
See [Authentication](src/server/auth/README.md) for activation, environment,
database migrations, REST mapping, session/permission APIs and browser lifecycle.
