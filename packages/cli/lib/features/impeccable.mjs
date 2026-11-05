// Impeccable (Apache-2.0, https://github.com/pbakaus/impeccable) is consumed as a
// pinned devDependency. Its skills, hooks and subagents are installed by the
// consumer through `npx impeccable install`; this kit never copies or runs them.

export const impeccableGuidanceHeading = 'Impeccable design tooling'

export const impeccableScripts = {
  'design:detect': 'impeccable detect src'
}

const ignoreStart = '# impeccable-ignore-start'

// Runtime state Impeccable documents as untracked. Shared artifacts
// (config.json, design.json, surfaces/, critique/, PRODUCT.md, DESIGN.md) stay tracked.
const ignoreBlock = `${ignoreStart}
**/.impeccable/config.local.json
**/.impeccable/hook.cache.json
**/.impeccable/hook.pending.json
**/.impeccable/*.png
**/.impeccable/review/
**/.impeccable/questions/
**/.impeccable/live/server.json
**/.impeccable/live/sessions/
**/.impeccable/live/previews/
**/.impeccable/live/annotations/
**/.impeccable/live/cache/
**/.impeccable/live/manual-edit-apply-transaction.json
**/.impeccable/live/manual-edit-events.jsonl
**/.impeccable/live/manual-edit-evidence/
**/.impeccable/live/pending-manual-edits.json
**/.impeccable/live/deferred-svelte-component-accepts.json
**/.impeccable/live/*.png
# impeccable-ignore-end`

export const withImpeccableIgnore = (text) =>
  text.includes(ignoreStart)
    ? text
    : `${text.trimEnd()}\n\n# Impeccable runtime state\n${ignoreBlock}\n`

export const addImpeccableScripts = (manifest) => {
  manifest.scripts ??= {}
  for (const [name, command] of Object.entries(impeccableScripts))
    manifest.scripts[name] ??= command
}

// Returns the portable guidance section (heading included) from an agent file.
export const guidanceSection = (text, heading) => {
  const start = text.indexOf(`## ${heading}\n`)
  if (start < 0) return null
  const next = text.indexOf('\n## ', start + 3)
  return text.slice(start, next < 0 ? undefined : next + 1).trimEnd()
}
