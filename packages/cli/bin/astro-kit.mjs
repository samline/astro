#!/usr/bin/env node
import { main } from '../lib/cli.mjs'

main().catch((error) => {
  console.error(`\nAstro Kit: ${error.message}`)
  process.exitCode = 1
})
