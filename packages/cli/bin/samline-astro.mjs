#!/usr/bin/env node
import { main } from '../lib/cli.mjs'

main().catch((error) => {
  console.error(`\nSAM Astro: ${error.message}`)
  process.exitCode = 1
})
