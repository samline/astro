import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// Advisory design lint: cheap, deterministic source patterns that usually mean
// a default nobody chose. It reads class names and CSS text only, so it cannot
// judge rendered contrast or layout; check the rendered result for those.
// Silence a deliberate use on the same or previous line with:
//   design-ignore: <rule-id> <reason>
export const designRules = [
  {
    id: 'gradient-text',
    message:
      'Texto con degradado: da énfasis con peso o tamaño y un color sólido.',
    pattern:
      /\bbg-clip-text\b[^"'`]*\btext-transparent\b|\btext-transparent\b[^"'`]*\bbg-clip-text\b|background-clip\s*:\s*text/
  },
  {
    id: 'side-accent-border',
    message:
      'Borde de acento grueso en un solo lado: usa un acento más sutil o elimínalo.',
    pattern:
      /\bborder-(?:l|r|s|e)-(?:[2-9]\b|\[(?:(?:[2-9]|\d{2,})px|0?\.(?:1[2-9]|[2-9])\d*rem|[1-9][\d.]*rem)\])|border-(?:left|right|inline-start|inline-end)(?:-width)?\s*:\s*(?:(?:[2-9]|\d{2,})px|0?\.(?:1[2-9]|[2-9])\d*rem)/
  },
  {
    id: 'zero-offset-glow',
    message:
      'Sombra sin desplazamiento (halo de color): usa una elevación neutra con desplazamiento.',
    pattern:
      /\b(?:drop-)?shadow-\[0_0_|(?:box|text)-shadow\s*:\s*0(?:px)?\s+0(?:px)?\s+[1-9]/
  },
  {
    id: 'decorative-ping',
    message:
      'Indicador que pulsa: resérvalo para datos que realmente cambian en vivo.',
    pattern: /\banimate-ping\b/
  },
  {
    id: 'bounce-easing',
    message:
      'Rebote o easing elástico: prefiere una desaceleración exponencial suave.',
    pattern: /\banimate-bounce\b/
  },
  {
    id: 'justified-text',
    message:
      'Texto justificado: genera espacios irregulares; alinea al inicio.',
    pattern: /\btext-justify\b|text-align\s*:\s*justify/
  },
  {
    id: 'crushed-tracking',
    message: 'Espaciado entre letras menor a -0.04em: pierde legibilidad.',
    pattern:
      /\btracking-tighter\b|tracking-\[-0?\.(?:0[5-9]|[1-9])|letter-spacing\s*:\s*-0?\.(?:0[5-9]|[1-9])\d*em/
  }
]

const extensions = new Set(['.astro', '.css'])
// The reason must start with a letter or digit, so a bare '-->' or '*/' is not one.
const ignored = /design-ignore:\s*([a-z-]+)\s+[\p{L}\d]/u

/** Return advisory findings for one source file. */
export const findDesignIssues = (source) => {
  const lines = source.split('\n')
  const issues = []
  lines.forEach((text, index) => {
    for (const rule of designRules) {
      if (!rule.pattern.test(text)) continue
      const exempt = [text, lines[index - 1] ?? '']
        .map((line) => line.match(ignored)?.[1])
        .includes(rule.id)
      if (!exempt)
        issues.push({ line: index + 1, rule: rule.id, message: rule.message })
    }
  })
  return issues
}

const checkDirectory = async (directory) => {
  const issues = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) issues.push(...(await checkDirectory(file)))
    else if (extensions.has(path.extname(entry.name)))
      for (const issue of findDesignIssues(await readFile(file, 'utf8')))
        issues.push({ file, ...issue })
  }
  return issues
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const strict = process.argv.includes('--strict')
  const issues = await checkDirectory(path.resolve('src'))
  for (const issue of issues)
    console.warn(
      `${path.relative(process.cwd(), issue.file)}:${issue.line}: [${issue.rule}] ${issue.message}`
    )
  if (!issues.length) console.log('design: sin patrones por revisar.')
  else {
    console.warn(
      `\ndesign: ${issues.length} hallazgo(s) por revisar. Corrige o documenta la excepción con "design-ignore: <regla> <motivo>".`
    )
    if (strict) process.exitCode = 1
  }
}
