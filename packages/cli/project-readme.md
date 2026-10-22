# {{NAME}}

Creado con Astro Kit {{VERSION}}. Astro 7 con páginas estáticas (SSG), Server
Islands y adaptador Vercel. Este proyecto es independiente del generador.

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
{{RUN}} run format
{{RUN}} run format:check
{{RUN}} run verify
{{RUN}} run build
```

Desarrollo se inicia en segundo plano. `preview` sirve la parte estática del
build; las Server Islands se comprueban con desarrollo o un Preview Deployment
de Vercel.

## Entorno y Vercel

`.env.development` se crea desde `.env.example`. Los archivos de entorno reales
están ignorados por Git. Configura `SITE_URL` con el origen final en Vercel; si
se omite, se utiliza `VERCEL_PROJECT_PRODUCTION_URL`, o localhost fuera de Vercel.
`PUBLIC_SITE_NAME` es público. Declara futuros secretos en el esquema de Astro
como `context: 'server', access: 'secret'`.

`output: 'static'` genera las páginas al compilar. Usa `server:defer` en los
componentes dinámicos; no hace falta habilitar SSR general. Hay sitemap, imágenes
procesadas por Astro, TypeScript estricto y alias `@/*` a `src/*`.

Después de la primera instalación, conserva el lockfile generado. `vercel.json`
usa instalación congelada (`pnpm install --frozen-lockfile` o `npm ci`) y los
comandos del runtime elegido. El adaptador escribe `.vercel/output/`.

Para una clave persistente de Server Islands, genera una con
`{{RUN}} run astro create-key` y configura `ASTRO_KEY` en Vercel. No guardes
credenciales en el repositorio.
