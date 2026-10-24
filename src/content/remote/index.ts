import { defineCollection } from 'astro:content'
import { postSchema } from '../../server/content-api/client'
import { apiPostsLoader, strapiStoresLoader, storeSchema } from './loaders'

export const apiPosts = defineCollection({
  schema: postSchema,
  loader: apiPostsLoader()
})
export const strapiStores = defineCollection({
  schema: storeSchema,
  loader: strapiStoresLoader()
})
