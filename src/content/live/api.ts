import type {
  LiveLoader,
  LoadCollectionContext,
  LoadEntryContext
} from 'astro/loaders'
import type { z } from 'astro/zod'

export interface ApiLiveLoaderOptions<
  Source,
  Data extends Record<string, unknown>,
  EntryFilter extends { id: string },
  CollectionFilter extends Record<string, unknown>
> {
  name: string
  inputSchema: z.ZodType<Source>
  schema: z.ZodType<Data>
  id: (item: Source) => string
  map: (item: Source) => Data
  loadCollection: (
    context: LoadCollectionContext<CollectionFilter>
  ) => Promise<readonly unknown[]>
  loadEntry: (
    context: LoadEntryContext<EntryFilter>
  ) => Promise<unknown | undefined>
  errors?: { collection: string; entry: string }
}

/** Astro integration: validate upstream data and mapped entries without storing a snapshot. */
export const apiLiveLoader = <
  Source,
  Data extends Record<string, unknown>,
  EntryFilter extends { id: string } = { id: string },
  CollectionFilter extends Record<string, unknown> = Record<string, never>
>(
  options: ApiLiveLoaderOptions<Source, Data, EntryFilter, CollectionFilter>
): LiveLoader<Data, EntryFilter, CollectionFilter> => {
  if (!options.name.trim()) throw new Error('A live loader requires a name.')
  const toEntry = (value: unknown) => {
    const source = options.inputSchema.parse(value)
    const id = options.id(source)
    if (typeof id !== 'string' || !id.trim())
      throw new Error('An entry requires a stable nonempty ID.')
    return { id, data: options.schema.parse(options.map(source)) }
  }
  return {
    name: options.name,
    loadCollection: async (context) => {
      try {
        const source = await options.loadCollection(context)
        if (!Array.isArray(source))
          throw new Error('Expected a collection array.')
        const ids = new Set<string>()
        const entries = source.map((value) => {
          const entry = toEntry(value)
          if (ids.has(entry.id)) throw new Error('Duplicate entry ID.')
          ids.add(entry.id)
          return entry
        })
        return { entries }
      } catch {
        return {
          error: new Error(
            options.errors?.collection ?? 'Unable to load live content.'
          )
        }
      }
    },
    loadEntry: async (context) => {
      try {
        const source = await options.loadEntry(context)
        if (source === undefined) return undefined
        const entry = toEntry(source)
        if (entry.id !== context.filter.id)
          throw new Error('Unexpected entry ID.')
        return entry
      } catch {
        return {
          error: new Error(
            options.errors?.entry ?? 'Unable to load the live entry.'
          )
        }
      }
    }
  }
}
