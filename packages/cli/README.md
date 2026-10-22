# @samline/astro-kit

Generador de sitios Astro 7 con SSG, Server Islands y Vercel.

```sh
npx @samline/astro-kit@latest mi-proyecto
```

Sin nombre, pregunta la carpeta. Con `--no-install`, crea los archivos sin
descargar dependencias. Nunca sobrescribe un destino con contenido.

Detecta pnpm y Bun por separado: prefiere pnpm para instalar y Bun para ejecutar;
usa npm cuando falta la herramienta correspondiente. Los scripts, el gestor
fijado y la configuración de Vercel se adaptan a esa combinación.

Requiere Node.js >=22.23.4 y npm o pnpm. No instala herramientas globales.

La serie 7.x corresponde a Astro 7. Los proyectos creados son privados y tienen
su propia versión inicial 0.0.1; no se actualizan al publicar el generador.
