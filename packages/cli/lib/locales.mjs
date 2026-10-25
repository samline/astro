import ts from 'typescript'
import path from 'node:path'
import { readdir } from 'node:fs/promises'
import {
  dictionary,
  propertyName,
  parse,
  variable,
  readLiteral,
  edits,
  appendExport,
  importSource,
  appendProperties
} from './syntax.mjs'
import { read } from './files.mjs'

export const presets = {
  'en-us': { name: 'English (United States)', direction: 'ltr' },
  'es-mx': { name: 'Español (México)', direction: 'ltr' },
  'es-es': { name: 'Español (España)', direction: 'ltr' }
}
export const normalizeLocale = (code) => {
  if (
    typeof code !== 'string' ||
    !/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(code)
  )
    throw new Error('Use a locale tag such as en-us, es-mx or pt-br.')
  try {
    return Intl.getCanonicalLocales(code)[0].toLowerCase()
  } catch {
    throw new Error(`Invalid language tag: ${code}`)
  }
}
export const localeDetails = (code, name, direction = 'ltr') => {
  code = normalizeLocale(code)
  if (!['ltr', 'rtl'].includes(direction))
    throw new Error('Text direction must be ltr or rtl.')
  if (presets[code]) return { code, ...presets[code], ready: true }
  if (!name?.trim())
    throw new Error('Provide --locale-name for a custom language.')
  return { code, name: name.trim(), direction, ready: false }
}
export const typeName = (domain) =>
  domain === 'seo' ? 'SEO' : domain[0].toUpperCase() + domain.slice(1)
const alias = (locale) => 'locale' + locale.replaceAll('-', '_')
const blank = (value) =>
  typeof value === 'string'
    ? ''
    : Array.isArray(value)
      ? value.map(blank)
      : value && typeof value === 'object'
        ? Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, blank(item)])
          )
        : value
const shape = (value) =>
  Array.isArray(value)
    ? value.map(shape)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, shape(value[key])])
        )
      : value === null
        ? 'null'
        : typeof value
const dictionarySource = (value, name) =>
  `import type { ${name} } from './types'\n\nexport default ${JSON.stringify(value, null, 2)} satisfies ${name}\n`

export const localeConfig = (
  entries,
  defaultLocale
) => `export const availableLocales = ${JSON.stringify(entries.map((item) => item.code))} as const
export type Locale = (typeof availableLocales)[number]
export const defaultLocale: Locale = ${JSON.stringify(defaultLocale)}
// Only completed translations belong in this list. Draft dictionaries stay available.
export const locales: Locale[] = ${JSON.stringify(entries.filter((item) => item.ready || item.code === defaultLocale).map((item) => item.code))}
export const localeDirections = ${JSON.stringify(Object.fromEntries(entries.map((item) => [item.code, item.direction])), null, 2)} satisfies Record<Locale, 'ltr' | 'rtl'>
`
const localeIndex = (
  entries
) => `import { defaultLocale, locales, type Locale } from './config'
import type { Dictionary } from './types'
${entries.map((item) => `import ${alias(item.code)} from './dictionaries/${item.code}'`).join('\n')}
const dictionaries = { ${entries.map((item) => `${JSON.stringify(item.code)}: ${alias(item.code)}`).join(',\n')} } satisfies Record<Locale, Dictionary>
export const resolveLocale = (value?: string): Locale => locales.find((locale) => locale === value?.toLowerCase()) ?? defaultLocale
export const getDictionary = (locale?: string): Dictionary => dictionaries[resolveLocale(locale)]
`
const domainIndex = (domains) =>
  `import type { Dictionary } from '../../types'\n${domains.map((domain) => `import ${domain} from './${domain}'`).join('\n')}\nexport default { ${domains.join(', ')} } satisfies Dictionary\n`

export const initialLocales = async (
  template,
  entries,
  defaultLocale,
  domains
) => {
  const files = new Map()
  files.set('src/i18n/config.ts', localeConfig(entries, defaultLocale))
  files.set('src/i18n/index.ts', localeIndex(entries))
  files.set(
    'src/i18n/types.ts',
    `import type { Locale } from './config'\n${domains.map((domain) => `import type { ${typeName(domain)} } from './dictionaries/${defaultLocale}/${domain}/types'`).join('\n')}\nexport interface Dictionary {\n${domains.map((domain) => `${domain}: ${typeName(domain)}`).join('\n')}\n}\nexport type ClientTranslations<Domain extends keyof Dictionary> = { locale: Locale; translations: Pick<Dictionary, Domain> }\n`
  )
  for (const entry of entries) {
    files.set(
      `src/i18n/dictionaries/${entry.code}/index.ts`,
      domainIndex(domains)
    )
    for (const domain of domains) {
      const type = typeName(domain)
      const original = dictionary(
        await read(
          template,
          `src/i18n/dictionaries/${presets[entry.code] ? entry.code : 'en-us'}/${domain}/index.ts`
        ),
        domain
      )
      let value = entry.ready ? original : blank(original)
      if (domain === 'languages')
        value = Object.fromEntries(
          entries.map((item) => [item.code, entry.ready ? item.name : ''])
        )
      files.set(
        `src/i18n/dictionaries/${entry.code}/${domain}/index.ts`,
        dictionarySource(value, type)
      )
      files.set(
        `src/i18n/dictionaries/${entry.code}/${domain}/types.ts`,
        entry.code === defaultLocale
          ? await read(
              template,
              `src/i18n/dictionaries/en-us/${domain}/types.ts`
            )
          : `export type { ${type} } from '../../${defaultLocale}/${domain}/types'\n`
      )
    }
  }
  return files
}

export const readLocaleConfig = (source) => {
  const tree = parse(source, 'src/i18n/config.ts')
  const available = readLiteral(variable(tree, 'availableLocales'))
  const active = readLiteral(variable(tree, 'locales'))
  const defaultLocale = readLiteral(variable(tree, 'defaultLocale'))
  if (
    !Array.isArray(available) ||
    !Array.isArray(active) ||
    available.some((code) => normalizeLocale(code) !== code) ||
    !available.includes(defaultLocale) ||
    active.some((code) => !available.includes(code))
  )
    throw new Error('Inconsistent locale inventory; review src/i18n/config.ts.')
  return { available, active, defaultLocale }
}

/** Analyze literal syntax only. Dynamic modules are never imported or evaluated. */
export const addLocale = async (
  root,
  entry,
  metadata,
  readCurrent = (file) => read(root, file)
) => {
  const config = await readCurrent('src/i18n/config.ts')
  const current = readLocaleConfig(config)
  if (current.available.includes(entry.code)) return new Map()
  const base = `src/i18n/dictionaries/${current.defaultLocale}`
  const domains = (
    await readdir(path.join(root, base), { withFileTypes: true })
  )
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
  if (!domains.length) throw new Error('No dictionary domains were found.')
  const files = new Map()
  for (const domain of domains) {
    const source = await readCurrent(`${base}/${domain}/index.ts`)
    const contract = parse(
      await readCurrent(`${base}/${domain}/types.ts`),
      `${base}/${domain}/types.ts`
    )
    let constrained = false
    const inspect = (node) => {
      if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal))
        constrained = true
      ts.forEachChild(node, inspect)
    }
    inspect(contract)
    if (constrained)
      throw new Error(
        `String-literal type constraints in ${domain} need review before creating empty translations.`
      )

    const value = dictionary(source, `${base}/${domain}/index.ts`)
    for (const locale of current.available) {
      const other = dictionary(
        await readCurrent(`src/i18n/dictionaries/${locale}/${domain}/index.ts`),
        domain
      )
      // Language labels use the locale inventory; translated arrays retain their positions.
      if (JSON.stringify(shape(value)) !== JSON.stringify(shape(other)))
        throw new Error(
          `Dictionary shape drift: ${locale}/${domain}. Resolve it before adding a language.`
        )
      const otherDomains = (
        await readdir(path.join(root, `src/i18n/dictionaries/${locale}`), {
          withFileTypes: true
        })
      )
        .filter((item) => item.isDirectory())
        .map((item) => item.name)
        .sort()
      if (JSON.stringify([...domains].sort()) !== JSON.stringify(otherDomains))
        throw new Error(`Dictionary domain drift in ${locale}.`)
    }
    const tree = parse(source)
    const imported = tree.statements.find(
      (node) =>
        ts.isImportDeclaration(node) && node.moduleSpecifier.text === './types'
    )
    const binding = imported?.importClause?.namedBindings
    if (
      !binding ||
      !ts.isNamedImports(binding) ||
      binding.elements.length !== 1
    )
      throw new Error(`Expected a single domain type import in ${domain}.`)
    const type = binding.elements[0].name.text
    let empty = blank(value)
    if (domain === 'languages') {
      empty = { ...empty, [entry.code]: '' }
      for (const locale of current.available) {
        const file = `src/i18n/dictionaries/${locale}/${domain}/index.ts`
        const original = await readCurrent(file)
        const exported = parse(original).statements.find(ts.isExportAssignment)
        files.set(
          file,
          appendProperties(original, unwrapDefault(exported.expression), {
            [entry.code]: "''"
          })
        )
      }
    }
    files.set(
      `src/i18n/dictionaries/${entry.code}/${domain}/index.ts`,
      dictionarySource(empty, type)
    )
    files.set(
      `src/i18n/dictionaries/${entry.code}/${domain}/types.ts`,
      `export type { ${type} } from '../../${current.defaultLocale}/${domain}/types'\n`
    )
  }
  files.set(
    `src/i18n/dictionaries/${entry.code}/index.ts`,
    composeCurrentDomains(await readCurrent(`${base}/index.ts`), domains)
  )
  const tree = parse(config)
  const available = variable(tree, 'availableLocales')
  if (!ts.isArrayLiteralExpression(available))
    throw new Error('Expected a literal locale inventory.')
  let next = edits(config, [
    {
      start: available.getStart(),
      end: available.end,
      text: JSON.stringify([...current.available, entry.code])
    }
  ])
  next = appendExport(next, 'localeDirections', {
    [entry.code]: JSON.stringify(entry.direction)
  })
  files.set('src/i18n/config.ts', next)
  let index = importSource(
    await readCurrent('src/i18n/index.ts'),
    alias(entry.code),
    `./dictionaries/${entry.code}`
  )
  index = appendExport(index, 'dictionaries', {
    [entry.code]: alias(entry.code)
  })
  files.set('src/i18n/index.ts', index)
  metadata.locales.push({ ...entry, ready: false })
  return files
}

const unwrapDefault = (node) => {
  while (
    ts.isSatisfiesExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isParenthesizedExpression(node)
  )
    node = node.expression
  return node
}

export const addDomains = async (
  root,
  template,
  domains,
  metadata,
  readCurrent = (file) => read(root, file)
) => {
  const files = new Map()
  const config = readLocaleConfig(await readCurrent('src/i18n/config.ts'))
  const base = config.defaultLocale
  let types = await readCurrent('src/i18n/types.ts')
  const contract = parse(types).statements.find(
    (node) => ts.isInterfaceDeclaration(node) && node.name.text === 'Dictionary'
  )
  if (!contract) throw new Error('Expected the current Dictionary interface.')
  const existing = new Set(
    contract.members.map((member) => member.name.getText().replace(/['"]/g, ''))
  )
  const missing = domains.filter((domain) => !existing.has(domain))
  if (!missing.length) return files
  types = edits(types, [
    {
      start: contract.end - 1,
      text: missing.map((domain) => `${domain}: ${typeName(domain)}\n`).join('')
    }
  ])
  types =
    missing
      .map(
        (domain) =>
          `import type { ${typeName(domain)} } from './dictionaries/${base}/${domain}/types'\n`
      )
      .join('') + types
  files.set('src/i18n/types.ts', types)
  for (const locale of config.available) {
    let index = await readCurrent(`src/i18n/dictionaries/${locale}/index.ts`)
    for (const domain of missing) {
      index = importSource(index, domain, `./${domain}`)
      const name = typeName(domain)
      let value = dictionary(
        await read(
          template,
          `src/i18n/dictionaries/${presets[locale] ? locale : 'en-us'}/${domain}/index.ts`
        ),
        domain
      )
      if (
        !presets[locale] ||
        metadata.locales.find((item) => item.code === locale)?.ready === false
      )
        value = blank(value)
      if (domain === 'languages')
        value = Object.fromEntries(
          config.available.map((code) => [code, presets[code]?.name ?? ''])
        )
      files.set(
        `src/i18n/dictionaries/${locale}/${domain}/index.ts`,
        dictionarySource(value, name)
      )
      files.set(
        `src/i18n/dictionaries/${locale}/${domain}/types.ts`,
        locale === base
          ? await read(
              template,
              `src/i18n/dictionaries/en-us/${domain}/types.ts`
            )
          : `export type { ${name} } from '../../${base}/${domain}/types'\n`
      )
    }
    const tree = parse(index)
    const exported = tree.statements.find(ts.isExportAssignment)
    if (!exported) throw new Error('Expected a composed dictionary export.')
    index = appendProperties(
      index,
      unwrapDefault(exported.expression),
      Object.fromEntries(missing.map((domain) => [domain, domain]))
    )
    files.set(`src/i18n/dictionaries/${locale}/index.ts`, index)
  }
  return files
}

const composeCurrentDomains = (source, domains) => {
  const tree = parse(source)
  const exported = tree.statements.find(ts.isExportAssignment)
  const object = exported && unwrapDefault(exported.expression)
  if (
    !object ||
    !ts.isObjectLiteralExpression(object) ||
    object.properties.length !== domains.length
  )
    throw new Error(
      'Dictionary index must explicitly compose the current local domains.'
    )
  const bindings = []
  for (const domain of domains) {
    const imported = tree.statements.find(
      (node) =>
        ts.isImportDeclaration(node) &&
        [`./${domain}`, `./${domain}/index`, `./${domain}/index.ts`].includes(
          node.moduleSpecifier.text
        )
    )
    const alias = imported?.importClause?.name?.text
    const property = object.properties.find(
      (node) => node.name && propertyName(node.name) === domain
    )
    const value =
      property &&
      (ts.isShorthandPropertyAssignment(property)
        ? property.name
        : ts.isPropertyAssignment(property)
          ? property.initializer
          : null)
    if (!alias || !value || !ts.isIdentifier(value) || value.text !== alias)
      throw new Error(
        `Dictionary index must import ${domain} from its own locale folder; review custom composition.`
      )
    bindings.push({
      domain,
      alias:
        alias === 'Dictionary' ? `dictionaryDomain${bindings.length}` : alias
    })
  }
  return `import type { Dictionary } from '../../types'\n${bindings.map(({ domain, alias }) => `import ${alias} from './${domain}'`).join('\n')}\nexport default { ${bindings.map(({ domain, alias }) => `${JSON.stringify(domain)}: ${alias}`).join(', ')} } satisfies Dictionary\n`
}
