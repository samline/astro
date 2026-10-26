// Keep overflow regions reachable before JavaScript loads, including native tables.
const accessibleOverflow = () => {
  const visit = (node) => {
    if (
      node.type === 'element' &&
      (node.tagName === 'pre' || node.tagName === 'table')
    )
      node.properties = { ...node.properties, tabIndex: 0 }
    for (const child of node.children ?? []) visit(child)
  }
  return visit
}
export default accessibleOverflow
