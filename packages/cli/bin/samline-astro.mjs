#!/usr/bin/env node
import { main } from '../lib/cli.mjs'

main().catch((error) => {
  console.error(`\n@samline/astro: ${error.message}`)
  process.exitCode = 1
})
