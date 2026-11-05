// Development-only pseudo-locale for layout stress tests. With
// PUBLIC_I18N_PSEUDO=true during `astro dev`, every dictionary string is
// bracketed, accented and lengthened (short labels grow most, as in real
// translations). Text without brackets on the page did not come from a
// dictionary. Production builds never transform copy.

const accents: Record<string, string> = {
  a: 'á',
  e: 'é',
  i: 'í',
  o: 'ö',
  u: 'ü',
  c: 'ç',
  n: 'ñ',
  y: 'ý',
  A: 'Á',
  E: 'É',
  I: 'Í',
  O: 'Ö',
  U: 'Ü',
  C: 'Ç',
  N: 'Ñ',
  Y: 'Ý'
}

// Short strings expand far more than long ones in real translations.
const expansion = (length: number) =>
  length <= 10 ? 0.8 : length <= 20 ? 0.5 : 0.35

const filler = (length: number) => {
  const words: string[] = []
  for (let left = length; left > 0; left -= 6)
    words.push('ŵ'.repeat(Math.min(5, left)))
  return words.join(' ')
}

/** Lengthen one string while keeping `{placeholder}` tokens intact. */
export const pseudoText = (value: string) => {
  if (!value.trim()) return value
  const accented = value
    .split(/(\{[^{}]+\})/)
    .map((part) =>
      part.startsWith('{')
        ? part
        : part.replace(/[a-zA-Z]/g, (char) => accents[char] ?? char)
    )
    .join('')
  const extra = Math.max(2, Math.ceil(value.length * expansion(value.length)))
  return `[${accented} ${filler(extra)}]`
}

const transform = (value: unknown): unknown => {
  if (typeof value === 'string') return pseudoText(value)
  if (Array.isArray(value)) return value.map(transform)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, transform(item)])
    )
  return value
}

const cache = new WeakMap<object, object>()

export const pseudoEnabled = () =>
  import.meta.env.DEV && import.meta.env.PUBLIC_I18N_PSEUDO === 'true'

/** Return the dictionary unchanged unless the dev pseudo-locale is enabled. */
export const withPseudoLocale = <T extends object>(
  dictionary: T,
  enabled = pseudoEnabled()
): T => {
  if (!enabled) return dictionary
  if (!cache.has(dictionary))
    cache.set(dictionary, transform(dictionary) as object)
  return cache.get(dictionary) as T
}
