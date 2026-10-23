# {{NAME}}

Creado con Astro Kit {{VERSION}}. Astro 7 con páginas estáticas (SSG).
Destino seleccionado: {{DEPLOYMENT}}. Este proyecto es independiente del generador.

## Herramientas seleccionadas

- Dependencias: `{{INSTALL}}`.
- Runtime: {{RUNTIME}}.

```sh
{{INSTALL}} install
{{RUN}} run dev
```

El instalador prefiere pnpm para dependencias y Bun para ejecutar. Si falta
alguna herramienta, configura npm para esa función. Los archivos generados
conservan esa elección; instalar otra herramienta después no cambia los scripts.
Node.js >=22.23.4 sigue siendo necesario.

## Comandos

```sh
{{RUN}} run astro dev status
{{RUN}} run astro dev logs
{{RUN}} run astro dev stop
{{RUN}} run check
{{RUN}} run check:i18n
{{RUN}} run format
{{RUN}} run format:check
{{RUN}} run verify
{{RUN}} run build
```

Desarrollo se inicia en segundo plano. Hay sitemap, imágenes procesadas por
Astro, TypeScript estricto y alias `@/*` a `src/*`.

## Entorno y despliegue

`.env.development` y `.env.production` se crean durante la instalación. Los
archivos de entorno reales están ignorados por Git; `.env.example` documenta
las variables. El nombre y los textos del sitio se editan en los diccionarios.

{{DEPLOYMENT_GUIDE}}

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
    ├── Section.astro
    ├── Box.astro
    ├── Link.astro
    ├── LanguagePicker.astro
    ├── SEO.astro
    ├── ThemeInit.astro
    └── ThemeSwitch.astro
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
`Section.astro` como contenedor semántico: reenvía atributos HTML tipados,
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
import Section from '@/components/Section.astro'
import Box from '@/components/Box.astro'
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

`src/components/Link.astro` es el enlace de navegación común, sin estilos propios
ni JavaScript cliente. Requiere `href`, acepta atributos nativos de `<a>` y
conserva clases, slots y estilos scoped del padre.

```astro
---
import Link from '@/components/Link.astro'
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

## SEO y recursos públicos

`public/img`, `public/docs` y `public/video` contienen `.gitkeep` para conservar
las carpetas en Git y en el paquete. Sus recursos se sirven como `/img/archivo`,
`/docs/archivo` y `/video/archivo`, conservando nombre y bytes, sin procesamiento
por Astro. Los recursos que necesiten optimización se importan desde `src/assets`.

`Main.astro` delega los metadatos en `src/components/SEO.astro`. Las páginas
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

## Idiomas

`src/i18n/config.ts` define `en-us` como predeterminado en `/`. Descomenta
`locales.push('en-mx')` para generar `/en-mx`, habilitar el selector y actualizar
el sitemap. Es inglés de México, no español (`es-mx`).

Todo texto visible vive en `src/i18n/dictionaries`, incluidos SEO, accesibilidad,
formularios y errores. Cada idioma tiene carpetas `common`, `forms`, `buttons`,
`site`, `navigation`, `languages`, `welcome`, `errors` y `seo`. Cada módulo contiene
`index.ts` con las traducciones y `types.ts` con sus tipos; el índice del idioma
solo compone módulos. Los tipos de cada módulo se definen en `en-us` y se
reexportan desde `en-mx` para mantener el mismo contrato.

Usa `getDictionary(Astro.currentLocale)` desde `@/i18n`; el tipo
`Dictionary` exige que los diccionarios tengan las mismas claves. El layout
añade `lang`, canonical y alternates para los locales activos.

La construcción de URLs usa `astro:i18n` y el idioma actual se obtiene con
`Astro.currentLocale`. Pasa al layout y al selector un `path` sin prefijo, como
`/about`; Astro añade el idioma. El `getStaticPaths` del inicio genera sus variantes
SSG, sin una capa propia de routing.

Los componentes Astro y layouts leen `Astro.currentLocale` directamente;
no reciben ni propagan un prop `locale`. `getStaticPaths` solo genera parámetros
de ruta, sin duplicar el idioma en `props`. Normaliza con `resolveLocale` cuando
necesites el código para enlaces o atributos.

Si el destino admite Server Islands, pasa el locale como prop desde la página y úsalo para obtener
el diccionario; no lo deduzcas de la URL del endpoint. En navegador pasa solo los
textos necesarios desde el componente.

`{{RUN}} run check:i18n` detecta textos literales en plantillas y forma parte de
`verify`. Mantén también los mensajes de scripts en diccionarios; la comprobación
de markup no hace análisis de flujo de datos.

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
- `accent-third`, `accent-third-light`, `accent-third-dark` (naranja).

`placeholder` se aplica por defecto a inputs y textareas; se puede usar también
con `placeholder:text-placeholder`.

Cada tono tiene su propio valor hexadecimal y puede ajustarse de forma independiente.
No hay configuración de colores en TypeScript ni variables inyectadas en `<html>`.
La paleta predeterminada de Tailwind está desactivada. Usa, por ejemplo, `bg-accent`,
`hover:bg-accent-sec-dark`, `text-accent-third` o `bg-accent/10`.

La meta `theme-color` del head de `Main.astro` tiene el valor del acento principal
(#067df7). Cuando cambies ese acento, actualiza también el valor de la meta:
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
Los colores y las variables visuales siguen definidos en `tailwind.css`.

`src/config/theme.ts` solo configura comportamiento: `defaultPreference` puede
ser `system` (predeterminado), `light` o `dark`; `storageKey` identifica la preferencia
guardada. El tema sigue al sistema hasta que el usuario elige otro. Sin JavaScript
se muestra el modo predeterminado fijo (claro si se usa `system`) y se oculta el switch.

Para integrar el control en cualquier sección o componente compartido:

```astro
---
import ThemeSwitch from '@/components/ThemeSwitch.astro'
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
window.astroKitTheme?.setPreference('system')
```

La misma API acepta `light` y `dark`, expone `getPreference()` y `getTheme()`,
y emite `themechange` en `window` con `{ theme, preference }` en `event.detail`.
Las animaciones del switch respetan la preferencia de movimiento reducido.
