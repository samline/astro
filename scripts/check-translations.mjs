import ts from 'typescript'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import {
  parse,
  unwrap,
  readLiteral,
  dictionary
} from '../packages/cli/lib/dictionary.mjs'

/** Static analysis only: never import application dictionaries or execute config. */
export const checkTranslations = async (root = process.cwd()) => {
  const config = parse(
    await readFile(path.join(root, 'src/i18n/config.ts'), 'utf8')
  )
  const declarations = new Map(
    config.statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) =>
        statement.declarationList.declarations.map((item) => [
          item.name.getText(config),
          item.initializer
        ])
      )
  )
  const resolve = (expression, seen = new Set()) => {
    const node = unwrap(expression)
    if (ts.isIdentifier(node)) {
      if (seen.has(node.text) || !declarations.has(node.text))
        throw new Error(`Unsupported locale expression: ${node.text}`)
      return resolve(declarations.get(node.text), new Set([...seen, node.text]))
    }
    if (ts.isArrayLiteralExpression(node))
      return node.elements.map((item) => resolve(item, seen))
    return readLiteral(node)
  }
  const active = resolve(declarations.get('locales'))
  for (const statement of config.statements) {
    if (
      !ts.isExpressionStatement(statement) ||
      !ts.isCallExpression(statement.expression)
    )
      continue
    const call = statement.expression
    if (
      ts.isPropertyAccessExpression(call.expression) &&
      call.expression.expression.getText(config) === 'locales' &&
      call.expression.name.text === 'push'
    )
      active.push(...call.arguments.map((item) => resolve(item)))
  }
  const allowed = new Set(
    declarations.has('optionalTranslationKeys')
      ? resolve(declarations.get('optionalTranslationKeys'))
      : []
  )
  const issues = []
  if (!Array.isArray(active) || !active.length)
    throw new Error('At least one active locale is required.')
  for (const locale of active) {
    if (
      typeof locale !== 'string' ||
      !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(locale)
    )
      throw new Error('Invalid active locale tag.')
    const folder = path.join(root, 'src/i18n/dictionaries', locale)
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      if (entry.isSymbolicLink())
        throw new Error('Dictionary symlinks require manual review.')
      if (!entry.isDirectory()) continue
      const file = path.join(folder, entry.name, 'index.ts')
      const value = dictionary(await readFile(file, 'utf8'), file)
      const visit = (item, key) => {
        if (typeof item === 'string') {
          if (!item.trim() && !allowed.has(key))
            issues.push(`${locale}:${key}: translation is empty`)
        } else if (Array.isArray(item))
          item.forEach((value, index) => visit(value, `${key}.${index}`))
        else if (item && typeof item === 'object')
          for (const [name, value] of Object.entries(item)) {
            if (key === 'languages' && !active.includes(name)) continue
            visit(value, `${key}.${name}`)
          }
      }
      visit(value, entry.name)
    }
  }
  return issues
}
