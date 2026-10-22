if (!process.env.npm_config_user_agent?.startsWith('pnpm/')) {
  console.error(
    'Instala las dependencias con pnpm install. Usa bun run para ejecutar los scripts.'
  )
  process.exit(1)
}
