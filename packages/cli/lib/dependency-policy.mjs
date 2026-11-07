// The selected Forms recipe follows current releases, including newly published majors.
// Keep the exemption local to these two explicit latest dependencies.
export const withLatestFormsPolicy = (source = '') => {
  const names = ['@samline/forms', '@samline/formatter']
  const lines = source.trimEnd().split('\n')
  const key = lines.findIndex((line) =>
    /^(?:['"])?minimumReleaseAgeExclude(?:['"])?:/.test(line)
  )
  if (key < 0)
    return (
      source.trimEnd() +
      (source.trim() ? '\n\n' : '') +
      '# Forms and Formatter follow the current latest tag, including fresh releases.\n' +
      'minimumReleaseAgeExclude:\n' +
      names.map((name) => `  - '${name}'`).join('\n') +
      '\n'
    )
  if (!/^minimumReleaseAgeExclude:\s*(?:#.*)?$/.test(lines[key]))
    throw new Error(
      'Review minimumReleaseAgeExclude in pnpm-workspace.yaml: use a block list to add the latest Forms/Formatter policy without replacing custom settings.'
    )
  let end = key + 1
  while (
    end < lines.length &&
    (!/^\S/.test(lines[end]) || /^[-#]/.test(lines[end]))
  )
    end++
  const entries = lines.slice(key + 1, end)
  const indent =
    entries.find((line) => /^\s*-\s+/.test(line))?.match(/^(\s*)-/)?.[1] ?? '  '
  const existing = entries.map(
    (line) =>
      line.match(
        /^\s*-\s*(['"]?)(@samline\/(?:forms|formatter))\1\s*(?:#.*)?$/
      )?.[2]
  )
  lines.splice(
    end,
    0,
    ...names
      .filter((name) => !existing.includes(name))
      .map((name) => `${indent}- '${name}'`)
  )
  return lines.join('\n') + '\n'
}
