import { checkTranslations } from './check-translations.mjs'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parsers } from 'prettier-plugin-astro'

const textAttributes = new Set([
  'alt',
  'title',
  'placeholder',
  'aria-label',
  'aria-description',
  'label',
  'summary'
])

const hasLiteralText = (node) => {
  if (!node) return false
  if (node.type === 'Literal') return String(node.value ?? '').trim().length > 0
  if (node.type === 'JSXExpressionContainer')
    return hasLiteralText(node.expression)
  if (node.type === 'TemplateLiteral')
    return node.quasis.some((part) =>
      (part.value?.cooked ?? part.value?.raw ?? '').trim()
    )
  if (node.type === 'ConditionalExpression')
    return hasLiteralText(node.consequent) || hasLiteralText(node.alternate)
  if (node.type === 'LogicalExpression') return hasLiteralText(node.right)
  return false
}

/** Check rendered markup, not developer comments, URLs or CSS strings. */
export const findUntranslatedText = (source) => {
  const ast = parsers.astro.parse(source, {})
  const issues = []
  const seen = new WeakSet()
  const report = (node) => {
    const line = source.slice(0, node.start).split('\n').length
    issues.push({ line, text: source.slice(node.start, node.end) })
  }
  const visit = (node) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return
    seen.add(node)
    if (node.type === 'JSXElement') {
      const name = node.openingElement.name.name
      if (name === 'style' || name === 'script') return
      if (name === 'meta') {
        const attributes = node.openingElement.attributes
        const key = attributes.find((attribute) =>
          ['name', 'property'].includes(attribute.name?.name)
        )?.value?.value
        if (
          [
            'description',
            'og:title',
            'og:description',
            'og:site_name',
            'og:image:alt',
            'twitter:image:alt',
            'twitter:title',
            'twitter:description'
          ].includes(key)
        ) {
          const content = attributes.find(
            (attribute) => attribute.name?.name === 'content'
          )
          if (hasLiteralText(content?.value)) report(content)
        }
      }
    }
    if (node.type === 'JSXText' && node.value.trim()) report(node)
    if (
      node.type === 'JSXExpressionContainer' &&
      hasLiteralText(node.expression)
    )
      report(node)
    if (node.type === 'JSXAttribute') {
      if (textAttributes.has(node.name?.name) && hasLiteralText(node.value))
        report(node)
      return
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') visit(value)
    }
  }
  visit(ast.template)
  return issues
}

const checkDirectory = async (directory) => {
  let failures = 0
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) failures += await checkDirectory(file)
    else if (entry.name.endsWith('.astro')) {
      for (const issue of findUntranslatedText(await readFile(file, 'utf8'))) {
        console.error(
          `${file}:${issue.line}: Mueve el texto al diccionario: ${issue.text.trim()}`
        )
        failures++
      }
    }
  }
  return failures
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const translationIssues = await checkTranslations()
  for (const issue of translationIssues) console.error(issue)
  const failures =
    translationIssues.length + (await checkDirectory(path.resolve('src')))
  if (failures) process.exitCode = 1
  else console.log('i18n: plantillas sin textos literales visibles.')
}
