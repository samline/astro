import type { FieldAppearance } from './types'

export const fieldAttributes = (
  id: string | null | undefined,
  help: FieldAppearance['help'],
  describedBy?: string | null
) => {
  const controlId = id ?? `field-${crypto.randomUUID()}`
  const descriptions = [
    describedBy,
    help ? `${controlId}-help` : undefined,
    `${controlId}-error`
  ]
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
  return {
    id: controlId,
    'aria-describedby': [...new Set(descriptions)].join(' ')
  }
}
