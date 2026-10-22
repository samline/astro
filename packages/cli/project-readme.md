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
