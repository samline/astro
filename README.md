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

Sin destino, pregunta la carpeta. `--no-install` permite generar sin descargar
dependencias. Nunca sobrescribe una carpeta con contenido ni instala herramientas
globales. La detección se realiza por separado:

| pnpm disponible | Bun disponible | Instala con | Ejecuta con   |
| --------------- | -------------- | ----------- | ------------- |
| Sí              | Sí             | pnpm        | Bun           |
| Sí              | No             | pnpm        | npm / Node.js |
| No              | Sí             | npm         | Bun           |
| No              | No             | npm         | npm / Node.js |

Los scripts, `packageManager`, el hook de instalación, el README y Vercel se
generan según esa combinación. El instalador arranca con Node.js para que npx
funcione sin Bun. La primera instalación crea el lockfile propio del proyecto;
debe conservarse antes de desplegar con instalación congelada.

El proyecto generado es privado, inicia en `0.0.1`, registra la versión de Astro
Kit que lo creó y es independiente: futuras publicaciones del kit no lo alteran.
No se distribuyen los archivos de entorno reales, contexto local, dependencias,
cachés, configuración del workspace ni resultados de compilación.

## Preparar una publicación

La versión de la raíz y la del instalador es `7.0.0`. La serie `7.x.y` está
reservada para Astro 7: parches para correcciones y menores para nuevas funciones.
La serie 8 empieza cuando se adapte la base a Astro 8; las versiones menores
no necesitan coincidir con las del framework. Mantén compatible el CLI dentro
de cada serie mayor.

```sh
bun run verify
bun run kit:pack
```

El tarball se escribe en `artifacts/samline-astro-kit-7.0.0.tgz`. Se puede probar
antes de publicar:

```sh
npm exec --yes --package ./artifacts/samline-astro-kit-7.0.0.tgz -- astro-kit mi-prueba
```

Para una siguiente versión:

```sh
bun run kit:version 7.0.1
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

## Herramientas

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

| Variable           | Disponibilidad                 | Valor predeterminado                        |
| ------------------ | ------------------------------ | ------------------------------------------- |
| `SITE_URL`         | Servidor y generación estática | Dominio de producción de Vercel o localhost |
| `PUBLIC_SITE_NAME` | Servidor y navegador           | `Astro Kit`                                 |
| `ASTRO_KEY`        | Interna de Astro, opcional     | Clave generada por Astro por build          |

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
- Compilación con Bun: `bun run check && bun run build`.
- Funciones con Bun mediante `bunVersion: '1.x'` (actualmente Bun 1.3).

El adaptador genera `.vercel/output/`; no configures `dist` manualmente como
directorio de publicación. La base no activa ISR, cachés compartidas de contenido
personalizado, analítica ni integraciones de UI.

## Referencias

- [Configuración de Astro](https://docs.astro.build/en/reference/configuration-reference/)
- [Variables de entorno](https://docs.astro.build/en/guides/environment-variables/)
- [Server Islands](https://docs.astro.build/en/guides/server-islands/)
- [Adaptador Vercel](https://docs.astro.build/en/guides/integrations-guide/vercel/)
- [Bun en Vercel](https://vercel.com/docs/functions/runtimes/bun)
