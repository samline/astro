import { defineMiddleware } from 'astro:middleware'
import { authMiddleware } from './server/auth/middleware'

export const onRequest = defineMiddleware(authMiddleware)
