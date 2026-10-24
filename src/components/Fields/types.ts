export interface FieldAppearance {
  /** Translated, visible label. */
  label: string
  help?: string
  error?: string
  variant?: 'floating' | 'basic'
  fieldSize?: 'sm' | 'md'
  fieldClass?: string
}

export type InputType =
  | 'text'
  | 'email'
  | 'tel'
  | 'url'
  | 'search'
  | 'password'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'month'
  | 'week'
  | 'time'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectGroup {
  label: string
  options: readonly SelectOption[]
  disabled?: boolean
}

export type SelectEntry = SelectOption | SelectGroup
