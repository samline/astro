import ts from 'typescript'

export const parse = (source, file = 'source.ts') => {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
  if (tree.parseDiagnostics.length)
    throw new Error(
      `Cannot safely parse ${file}: ${ts.flattenDiagnosticMessageText(tree.parseDiagnostics[0].messageText, ' ')}`
    )
  return tree
}

export const unwrap = (node) => {
  while (
    node &&
    (ts.isSatisfiesExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isParenthesizedExpression(node))
  )
    node = node.expression
  return node
}

export const propertyName = (node) => {
  if (
    ts.isIdentifier(node) ||
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node)
  ) {
    if (node.text === '__proto__')
      throw new Error('Prototype dictionary keys require manual review.')
    return node.text
  }
  throw new Error('Computed dictionary/configuration keys need manual review.')
}

export const readLiteral = (expression) => {
  const node = unwrap(expression)
  if (!node) throw new Error('Missing static value.')
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text
  if (ts.isNumericLiteral(node)) return Number(node.text)
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false
  if (node.kind === ts.SyntaxKind.NullKeyword) return null
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  )
    return -Number(node.operand.text)
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(readLiteral)
  if (ts.isObjectLiteralExpression(node)) {
    const result = Object.create(null)
    for (const item of node.properties) {
      if (!ts.isPropertyAssignment(item))
        throw new Error(
          'Dictionary spreads, shorthand and methods need manual review; no project code was executed.'
        )
      const key = propertyName(item.name)
      if (Object.hasOwn(result, key)) throw new Error(`Duplicate key: ${key}`)
      result[key] = readLiteral(item.initializer)
    }
    return result
  }
  throw new Error(
    'Dynamic dictionary values need manual review; no project code was executed.'
  )
}

export const dictionary = (source, file) => {
  const tree = parse(source, file)
  const exported = tree.statements.find(ts.isExportAssignment)
  if (!exported)
    throw new Error(`Expected a default dictionary object: ${file}`)
  return readLiteral(exported.expression)
}
