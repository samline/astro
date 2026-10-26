import ts from 'typescript'
import {
  removeImports,
  importSource,
  namedImport,
  appendExport,
  appendProperties,
  parse,
  variable,
  edits
} from '../syntax.mjs'
import { read } from '../files.mjs'

const replaceOnce = (source, previous, next) => {
  if (source.split(previous).length !== 2)
    throw new Error(
      `Template boundary changed: ${previous.slice(0, 60)}. Update the recipe before proceeding.`
    )
  return source.replace(previous, next)
}
const imports = {
  themes: ['@/components/Theme/Init.astro', '@/config/theme'],
  gtm: [
    '@/components/GTM/Head.astro',
    '@/components/GTM/Consent.astro',
    'astro:env/server'
  ],
  pageloader: ['@/components/PageLoader/index.astro']
}

export const coreLayout = async (template, selected) => {
  let source = await read(template, 'src/layouts/Main.astro')
  const end = source.indexOf('\n---', 4)
  let front = source.slice(4, end)
  for (const [feature, modules] of Object.entries(imports))
    if (!selected.includes(feature)) front = removeImports(front, modules)
  front = namedImport(front, 'localeDirections', '@/i18n/config')
  source = '---\n' + front + source.slice(end)
  source = replaceOnce(
    source,
    '  lang={locale}',
    '  lang={locale}\n  dir={localeDirections[locale]}'
  )
  if (!selected.includes('themes')) {
    source = replaceOnce(
      source,
      "  data-theme={themeConfig.defaultPreference === 'dark' ? 'dark' : 'light'}",
      "  data-theme='light'"
    )
    source = replaceOnce(source, '    <ThemeInit />', '')
  }
  if (!selected.includes('gtm')) {
    source = replaceOnce(source, '    <GTMHead />', '')
    source = replaceOnce(
      source,
      '    {GTM_ENABLED && GTM_ID?.trim() && <GTMConsent />}',
      ''
    )
  }
  if (!selected.includes('pageloader'))
    source = replaceOnce(source, '    <PageLoader />', '')
  return source
}

/** Narrow additive edits: preserve the rest of a customized document. */
export const mountLayout = (source, selected) => {
  if (!source.startsWith('---\n'))
    throw new Error(
      'Main.astro needs explicit frontmatter before adding layout integrations.'
    )
  const end = source.indexOf('\n---', 4)
  if (end < 0) throw new Error('Missing layout frontmatter boundary.')
  let front = source.slice(4, end),
    markup = source.slice(end)
  const mount = (tag, element) => {
    const matches = [
      ...markup.matchAll(new RegExp(`<${tag}(?:\\s[^>]*?)?>`, 'g'))
    ]
    if (matches.length !== 1)
      throw new Error(
        `Cannot safely locate one <${tag}> in Main.astro. Review the proposed component mount.`
      )
    markup =
      markup.slice(0, matches[0].index + matches[0][0].length) +
      '\n    ' +
      element +
      markup.slice(matches[0].index + matches[0][0].length)
  }
  if (selected.includes('themes')) {
    front = importSource(front, 'ThemeInit', '@/components/Theme/Init.astro')
    mount('head', '<ThemeInit />')
  }
  if (selected.includes('gtm')) {
    front = importSource(front, 'GTMHead', '@/components/GTM/Head.astro')
    front = importSource(front, 'GTMConsent', '@/components/GTM/Consent.astro')
    front = namedImport(front, 'GTM_ENABLED', 'astro:env/server')
    front = namedImport(front, 'GTM_ID', 'astro:env/server')
    mount('head', '<GTMHead />')
    mount('body', '{GTM_ENABLED && GTM_ID?.trim() && <GTMConsent />}')
  }
  if (selected.includes('pageloader')) {
    front = importSource(
      front,
      'PageLoader',
      '@/components/PageLoader/index.astro'
    )
    mount('body', '<PageLoader />')
  }
  return '---\n' + front + markup
}

export const welcomeSection = async (template, selected) => {
  if (!selected.includes('welcome'))
    return `---\nimport Section from '@/components/Section/index.astro'\nimport Box from '@/components/Box/index.astro'\nimport H from '@/components/H/index.astro'\nimport { getDictionary } from '@/i18n'\nconst dictionary = getDictionary(Astro.currentLocale)\n---\n<Section id='home' aria-labelledby='home-title'><Box><H level={1} id='home-title'>{dictionary.site.title}</H></Box></Section>\n`
  return read(template, 'src/sections/Welcome/index.astro')
}

export const demoHeader = async (template, selected) => {
  let source = await read(template, 'src/sections/DemoHeader/index.astro')
  for (const [feature, name, module] of [
    ['themes', 'ThemeSwitch', '@/components/Theme/Switch.astro'],
    [
      'language-picker',
      'LanguagePicker',
      '@/components/LanguagePicker/index.astro'
    ]
  ]) {
    if (selected.includes(feature)) continue
    const end = source.indexOf('\n---', 4)
    source =
      '---\n' +
      removeImports(source.slice(4, end), [module]) +
      source.slice(end)
    source = replaceOnce(
      source,
      name === 'ThemeSwitch'
        ? '<ThemeSwitch />'
        : '<LanguagePicker path={path} />',
      ''
    )
  }
  return source
}

/** A core-only page must not import or mount any optional demo source. */
export const minimalPage = `---
import type { GetStaticPaths } from 'astro'
import Home from '@/sections/Home/index.astro'
import Main from '@/layouts/Main.astro'
import { defaultLocale, locales } from '@/i18n/config'

export const getStaticPaths = (() =>
  locales.map((locale) => ({
    params: { locale: locale === defaultLocale ? undefined : locale }
  }))) satisfies GetStaticPaths
---

<Main path='/'>
  <Home />
</Main>
`

export const authSettings = async (template, mode) => {
  let source = await read(template, 'src/server/auth/settings.ts')
  source = removeImports(
    source,
    ['external', 'database', 'oauth']
      .filter((item) => item !== mode)
      .map((item) => `./providers/${item}`)
  )
  const node = variable(parse(source), 'providers')
  return edits(source, [
    { start: node.getStart(), end: node.end, text: `{ ${mode} }` }
  ])
}

export const contactWithoutCaptcha = (source) => {
  source = removeImports(source, ['../../server/captcha'])
  const start = source.indexOf('    if (!(await verifyCaptcha(captchaToken)))')
  const end = source.indexOf('    try {', start)
  if (start < 0 || end < 0)
    throw new Error('Contact verification boundary changed.')
  source = source.slice(0, start) + source.slice(end)
  return source.replace('website, captchaToken', 'website')
}

export const addContactCaptcha = (source) => {
  if (source.includes('verifyCaptcha'))
    throw new Error(
      'Contact already contains a verification hook; review it before adding another.'
    )
  const anchor =
    '    if (website.trim()) return { success: true, message: copy.success }'
  source = replaceOnce(
    source,
    anchor,
    anchor +
      `\n    if (!(await verifyCaptcha(captchaToken))) {\n      throw new ActionError({ code: 'BAD_REQUEST', message: dictionary.captcha.invalid })\n    }`
  )
  if (!source.includes('website'))
    throw new Error(
      'Contact handler shape changed; review CAPTCHA integration.'
    )
  source = replaceOnce(
    source,
    '{ locale, name, email, phone, message, website }',
    '{ locale, name, email, phone, message, website, captchaToken }'
  )
  return namedImport(source, 'verifyCaptcha', '../../server/captcha')
}

export const registerAction = (source, name) =>
  appendExport(
    namedImport(source, name, `./${name}`),
    'server',
    { [name]: name },
    { rejectExisting: true }
  )

export const contactSchemaWithoutCaptcha = (source) => {
  const tree = parse(source)
  const changes = []
  const removeItem = (items, item) => {
    const index = items.indexOf(item)
    const next = items[index + 1]
    const previous = items[index - 1]
    changes.push(
      next
        ? { start: item.getStart(tree), end: next.getStart(tree), text: '' }
        : previous
          ? { start: previous.end, end: item.end, text: '' }
          : { start: item.getStart(tree), end: item.end, text: '' }
    )
  }
  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node))
      for (const property of node.properties)
        if (property.name?.getText(tree) === 'captchaToken')
          removeItem(node.properties, property)
    if (ts.isArrayLiteralExpression(node))
      for (const item of node.elements)
        if (
          ts.isArrayLiteralExpression(item) &&
          item.elements[0]?.text === 'captchaToken'
        )
          removeItem(node.elements, item)
    ts.forEachChild(node, visit)
  }
  visit(tree)
  if (changes.length !== 2)
    throw new Error(
      'Contact CAPTCHA schema boundary changed; review before generating.'
    )
  return edits(source, changes)
}

export const addContactCaptchaSchema = (source, reference) => {
  const find = (text) => {
    const tree = parse(text)
    let object, limits
    const visit = (node) => {
      if (
        ts.isObjectLiteralExpression(node) &&
        node.properties.some((item) => item.name?.getText(tree) === 'website')
      )
        object = node
      if (
        ts.isArrayLiteralExpression(node) &&
        node.elements.some(
          (item) =>
            ts.isArrayLiteralExpression(item) &&
            item.elements[0]?.text === 'message'
        )
      )
        limits = node
      ts.forEachChild(node, visit)
    }
    visit(tree)
    if (!object || !limits)
      throw new Error(
        'Contact input schema was customized; review the proposed CAPTCHA field/limit.'
      )
    return { object, limits }
  }
  const original = find(reference)
  const field = original.object.properties.find(
    (item) => item.name?.getText() === 'captchaToken'
  )
  let current = find(source)
  source = appendProperties(source, current.object, {
    captchaToken: field.initializer.getText()
  })
  current = find(source)
  const last = current.limits.elements.at(-1)
  const changes = [
    {
      start: current.limits.end - 1,
      text: `\n['captchaToken', 2048]\n`
    }
  ]
  if (!current.limits.elements.hasTrailingComma)
    changes.push({ start: last.end, text: ',' })
  return edits(source, changes)
}

export const mergeAuthMiddleware = (source) => {
  const tree = parse(source, 'src/middleware.ts')
  const middleware = variable(tree, 'onRequest')
  source = edits(source, [
    {
      start: middleware.getStart(tree),
      end: middleware.end,
      text: `sequence(authMiddleware, ${middleware.getText(tree)})`
    }
  ])
  source = namedImport(source, 'sequence', 'astro:middleware')
  return namedImport(source, 'authMiddleware', './server/auth/middleware')
}

/** Never promote an inactive transport just because another Action is added. */
export const actionRegistrations = (
  activeSource,
  inactiveSource,
  names,
  deployment
) => {
  const files = new Map()
  let active = activeSource ?? 'export const server = {}\n'
  let inactive = (inactiveSource ?? 'export const server = {}\n').replace(
    /^\/\/ (?=(?:import|export))/gm,
    ''
  )
  let activeChanged = false,
    inactiveChanged = false
  for (const name of names) {
    const supported =
      deployment !== 'static' &&
      !(deployment === 'cloudflare' && name === 'contact')
    if (supported) {
      active = registerAction(active, name)
      activeChanged = true
    } else {
      inactive = registerAction(inactive, name)
      inactiveChanged = true
    }
  }
  if (activeChanged) files.set('src/actions/index.ts', active)
  if (inactiveChanged)
    files.set(
      'src/actions/index.ts.example',
      inactive
        .split('\n')
        .map((line) => (line && !line.startsWith('//') ? '// ' + line : line))
        .join('\n')
    )
  return files
}
