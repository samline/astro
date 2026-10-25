import ts from 'typescript'
import { parse, unwrap, propertyName } from './dictionary.mjs'
export {
  parse,
  unwrap,
  propertyName,
  readLiteral,
  dictionary
} from './dictionary.mjs'

export const variable = (tree, name) => {
  for (const statement of tree.statements) {
    if (!ts.isVariableStatement(statement)) continue
    const declaration = statement.declarationList.declarations.find(
      (item) => item.name.getText(tree) === name
    )
    if (declaration) return unwrap(declaration.initializer)
  }
  throw new Error(
    `Expected an explicit ${name} declaration. Review this configuration before continuing.`
  )
}

export const objectProperty = (node, name) => {
  const object = unwrap(node)
  if (!object || !ts.isObjectLiteralExpression(object))
    throw new Error(`Expected an object for ${name}.`)
  if (object.properties.some(ts.isSpreadAssignment))
    throw new Error(
      'Object spreads require explicit review before editing this configuration.'
    )
  return object.properties.find(
    (item) => item.name && propertyName(item.name) === name
  )
}

export const edits = (source, changes) => {
  let boundary = source.length + 1
  for (const { start, end = start, text } of [...changes].sort(
    (a, b) => b.start - a.start
  )) {
    if (end > boundary) throw new Error('Overlapping configuration changes.')
    source = source.slice(0, start) + text + source.slice(end)
    boundary = start
  }
  return source
}

const declaredNames = (tree) => {
  const names = new Set()
  const binding = (node) => {
    if (ts.isIdentifier(node)) names.add(node.text)
    else if (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node))
      for (const item of node.elements)
        if (ts.isBindingElement(item)) binding(item.name)
  }
  for (const statement of tree.statements) {
    if (ts.isVariableStatement(statement))
      for (const item of statement.declarationList.declarations)
        binding(item.name)
    else if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause
      if (clause?.name) binding(clause.name)
      if (clause?.namedBindings) {
        if (ts.isNamespaceImport(clause.namedBindings))
          binding(clause.namedBindings.name)
        else
          for (const item of clause.namedBindings.elements) binding(item.name)
      }
    } else if (statement.name && ts.isIdentifier(statement.name))
      binding(statement.name)
  }
  return names
}

export const importSource = (source, name, module) => {
  const tree = parse(source)
  for (const statement of tree.statements.filter(ts.isImportDeclaration)) {
    const bindings = statement.importClause
    if (
      statement.moduleSpecifier.text === module &&
      bindings?.name?.text === name
    )
      return source
    const names = [
      bindings?.name?.text,
      ...(bindings?.namedBindings && ts.isNamedImports(bindings.namedBindings)
        ? bindings.namedBindings.elements.map((item) => item.name.text)
        : [])
    ]
    if (names.includes(name)) throw new Error(`Import name conflict: ${name}`)
  }
  if (declaredNames(tree).has(name))
    throw new Error(`Import name conflict: ${name}`)
  return `import ${name} from ${JSON.stringify(module)}\n${source}`
}

export const appendProperties = (source, node, properties) => {
  if (!ts.isObjectLiteralExpression(node))
    throw new Error(
      'Expected an explicit object export; review before merging.'
    )
  if (node.properties.some(ts.isSpreadAssignment))
    throw new Error(
      'Object spreads require explicit review before merging new keys.'
    )
  const existing = new Set(
    node.properties
      .filter((item) => item.name)
      .map((item) => propertyName(item.name))
  )
  const additions = Object.entries(properties).filter(
    ([name]) => !existing.has(name)
  )
  if (!additions.length) return source
  const last = node.properties.at(-1)
  const separator =
    last && !source.slice(last.end, node.end - 1).includes(',') ? ',' : ''
  return edits(source, [
    {
      start: node.end - 1,
      text: `${separator}\n${additions.map(([key, value]) => `${JSON.stringify(key)}: ${value}`).join(',\n')}\n`
    }
  ])
}

export const appendExport = (source, exportName, entries) => {
  const tree = parse(source)
  return appendProperties(source, variable(tree, exportName), entries)
}

export const removeImports = (source, modules) => {
  const tree = parse(source)
  return edits(
    source,
    tree.statements
      .filter(
        (node) =>
          ts.isImportDeclaration(node) &&
          modules.includes(node.moduleSpecifier.text)
      )
      .map((node) => ({ start: node.getStart(tree), end: node.end, text: '' }))
  )
}

export const envSchema = (source) => {
  const tree = parse(source, 'astro.config.mjs')
  const assignment = tree.statements.find(ts.isExportAssignment)
  const call = unwrap(assignment?.expression)
  if (
    !call ||
    !ts.isCallExpression(call) ||
    call.expression.getText(tree) !== 'defineConfig'
  )
    throw new Error(
      'Expected export default defineConfig({...}); review the Astro configuration before merging.'
    )
  const env = objectProperty(call.arguments[0], 'env')
  const schema = objectProperty(env?.initializer, 'schema')
  if (!schema || !ts.isObjectLiteralExpression(schema.initializer))
    throw new Error('Expected an explicit env.schema object in Astro config.')
  return schema.initializer
}

export const selectEnvironment = (source, names) => {
  const schema = envSchema(source)
  const values = schema.properties
    .filter((item) => names.has(propertyName(item.name)))
    .map((item) => item.getText())
  return edits(source, [
    {
      start: schema.getStart(),
      end: schema.end,
      text: `{\n${values.join(',\n')}\n}`
    }
  ])
}

export const addEnvironment = (source, reference, names) => {
  const entries = Object.fromEntries(
    envSchema(reference)
      .properties.filter((item) => names.includes(propertyName(item.name)))
      .map((item) => [propertyName(item.name), item.initializer.getText()])
  )
  return appendProperties(source, envSchema(source), entries)
}

export const namedImport = (source, imported, module, local = imported) => {
  const tree = parse(source)
  for (const statement of tree.statements.filter(ts.isImportDeclaration)) {
    const bindings = statement.importClause?.namedBindings
    if (
      bindings &&
      ts.isNamedImports(bindings) &&
      statement.moduleSpecifier.text === module &&
      bindings.elements.some(
        (item) =>
          item.name.text === local &&
          (item.propertyName?.text ?? item.name.text) === imported
      )
    )
      return source
  }
  if (declaredNames(tree).has(local))
    throw new Error(`Import name conflict: ${local}`)
  return `import { ${imported}${local === imported ? '' : ` as ${local}`} } from ${JSON.stringify(module)}\n${source}`
}
