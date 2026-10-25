import { read, exists } from '../files.mjs'
import { appendExport, namedImport } from '../syntax.mjs'

export const contentFiles = async (
  root,
  template,
  options,
  locales,
  { adding = false, readCurrent = (file) => read(root, file) } = {}
) => {
  const source = options.contentSource
  const name =
    options.collection ?? (source === 'shopify' ? 'products' : 'posts')
  const mode = options.contentMode ?? 'build'
  const folder = `src/content/${name}`
  const files = new Map()
  const configFile =
    mode === 'live' ? 'src/live.config.ts.example' : 'src/content.config.ts'
  let config =
    adding && (await exists(root, configFile))
      ? await readCurrent(configFile)
      : 'export const collections = {}\n'
  if (adding && mode === 'live' && (await exists(root, 'src/live.config.ts')))
    throw new Error(
      'Live config is already active. Review the new collection registration example before merging it into src/live.config.ts.'
    )
  const prefix = `CONTENT_${name.replace(/([A-Z])/g, '_$1').toUpperCase()}`
  if (source === 'local') {
    const schema = await read(template, 'src/content/posts/index.ts')
    files.set(
      `${folder}/index.ts`,
      schema
        .replaceAll('export const posts', 'export const ' + name)
        .replaceAll('./src/content/posts/data', `./${folder}/data`)
    )
    for (const locale of locales.filter((item) => item.ready))
      files.set(
        `${folder}/data/${locale.code}/getting-started.json`,
        JSON.stringify(
          {
            locale: locale.code,
            copyKey: 'gettingStarted',
            publishedAt: '2026-01-01',
            draft: false
          },
          null,
          2
        ) + '\n'
      )
    config = namedImport(config, name, `./content/${name}`)
    config = appendExport(config, 'collections', { [name]: name })
    files.set(configFile, config)
  } else {
    for (const file of ['types.ts', mode === 'live' ? 'live.ts' : 'build.ts'])
      files.set(
        `${folder}/${file === 'types.ts' ? file : 'loader.ts'}`,
        await read(template, `src/content/sources/${file}`)
      )
    const provider =
      source === 'api' || source === 'other'
        ? options.protocol === 'graphql'
          ? 'graphql'
          : 'api'
        : source
    files.set(
      `${folder}/source.ts`,
      await read(template, `src/content/sources/${provider}.ts`)
    )
    if (!(await exists(root, 'src/server/content-api/request.ts')))
      files.set(
        'src/server/content-api/request.ts',
        await read(template, 'src/server/content-api/request.ts')
      )
    const mapping = Object.fromEntries(
      locales.map((item) => [
        item.code,
        source === 'shopify'
          ? item.code.split('-')[0].toUpperCase()
          : Intl.getCanonicalLocales(item.code)[0]
      ])
    )
    const definition =
      mode === 'live'
        ? `import { sourceLiveLoader } from './loader'\nimport { fetchEntries, schema } from './source'\nimport type { Locale } from '../../i18n/config'\nexport { schema }\nexport const loader = sourceLiveLoader(${JSON.stringify(prefix)}, fetchEntries, ${JSON.stringify(mapping)} satisfies Partial<Record<Locale, string>>)\n`
        : `import { defineCollection } from 'astro:content'\nimport { sourceLoader } from './loader'\nimport { fetchEntries, schema } from './source'\nimport type { Locale } from '../../i18n/config'\nexport const ${name} = defineCollection({ schema, loader: sourceLoader(${JSON.stringify(name)}, ${JSON.stringify(prefix)}, fetchEntries, ${JSON.stringify(mapping)} satisfies Partial<Record<Locale, string>>) })\n`
    files.set(`${folder}/index.ts`, definition)
    if (mode === 'live') {
      config = namedImport(config, 'defineLiveCollection', 'astro:content')
      config = namedImport(
        config,
        'loader',
        `./content/${name}`,
        `${name}Loader`
      )
      // Keep the live definition directly in the special root config as Astro requires.
      config = appendExport(config, 'collections', {
        [name]: `defineLiveCollection({ loader: ${name}Loader })`
      })
      files.set(configFile, config)
    } else {
      if (!adding || !(await exists(root, configFile)))
        files.set(configFile, config)
      files.set(
        `${folder}/registration.ts.example`,
        `// Add these to src/content.config.ts after configuring the source.\nimport { ${name} } from './content/${name}'\nexport const collections = { ${name} }\n`
      )
    }
    const url =
      source === 'shopify'
        ? 'https://your-store.myshopify.com/'
        : 'https://api.example.com/'
    const endpoint =
      source === 'shopify'
        ? 'api/2026-10/graphql.json'
        : options.protocol === 'graphql'
          ? 'graphql'
          : 'posts'
    files.set(
      `${folder}/.env.example`,
      `# Copy these names into your ignored build/runtime environment; keep real tokens private.\n${prefix}_URL=${url}\n${prefix}_ENDPOINT=${endpoint}\n${prefix}_TOKEN=\n`
    )
  }
  files.set(
    `${folder}/README.md`,
    `# ${name}: ${source} collection\n\nThis is a ${mode === 'live' ? 'request-time Live' : 'build-time'} Collection example. ${source === 'local' ? 'The local example is registered and works offline.' : `It is scaffolded but not registered for remote fetching. Configure ${prefix}_URL, ${prefix}_ENDPOINT and ${prefix}_TOKEN from the adjacent .env.example, review schema/source and the explicit locale map, then ${mode === 'live' ? 'merge/rename src/live.config.ts.example to src/live.config.ts' : 'merge registration.ts.example into src/content.config.ts'}. Installation makes no provider request.`}\n\n${source === 'other' ? `Custom service: ${options.service ?? 'your API'}. This is an explicit ${options.protocol} scaffold, not a verified native connector.\n\n` : ''}${source === 'shopify' ? 'Uses the read-only Shopify Storefront GraphQL products API (2026-10) with a Storefront public access token kept server-side. Check the shop hostname, supported version, language mapping and any required market/country context. This does not install cart, checkout, Admin API or user authentication.\n\n' : ''}${source === 'strapi' ? 'Targets Strapi 5 with localized/published posts containing title and slug. Adapt the content type, fields and provider locale map to your CMS.\n\n' : ''}${source !== 'local' ? 'Source errors, invalid schemas, pagination loops, duplicate IDs and GraphQL errors must remain failures; never replace them with fake successful empty data. Content IDs are stable and locale-qualified. API/CMS editorial text stays in the provider; shared site UI belongs in dictionaries.\n\n' : ''}## Read from an owning section\n\n\`\`\`ts\n${mode === 'live' ? `import { getLiveCollection } from 'astro:content'\nconst { entries, error } = await getLiveCollection('${name}', { locale })\n// Handle errors with translated feedback before rendering entries.` : `import { getCollection } from 'astro:content'\nconst entries = await getCollection('${name}', ({ data }) => data.locale === locale && !('draft' in data && data.draft))`}\n\`\`\`\n\n${source === 'local' ? 'For the local sample, resolve entry.data.copyKey through dictionary.content.posts; the JSON stores structure, not visitor copy.\n\n' : ''}Keep page -> layout -> section -> component composition. ${mode === 'live' ? 'Live reads require an adapter and a server-rendered consumer or Server Island; public pages can remain SSG.' : 'Remote build-time data does not require global SSR. Rebuild to publish upstream changes.'} Adding a language creates dictionary keys only; it never clones content entries or invents translated slugs.\n`
  )
  return {
    files,
    collection: {
      name,
      source,
      mode,
      protocol: options.protocol,
      service: options.service,
      configuredAtInstall: source === 'local'
    },
    prefix
  }
}
