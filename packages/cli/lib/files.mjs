import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rmdir,
  rm,
  writeFile,
  rename
} from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

export const read = (root, file) => readFile(path.join(root, file), 'utf8')
export const json = async (root, file = 'package.json') =>
  JSON.parse(await read(root, file))
export const serialize = (value) => JSON.stringify(value, null, 2) + '\n'
export const exists = async (root, file) =>
  Boolean(
    await lstat(path.join(root, file)).catch((error) => {
      if (error.code !== 'ENOENT') throw error
      return null
    })
  )

export const listFiles = async (root, prefix = '') => {
  const result = []
  for (const entry of await readdir(path.join(root, prefix), {
    withFileTypes: true
  })) {
    const file = path.posix.join(prefix, entry.name)
    if (entry.isSymbolicLink())
      throw new Error(`Symlink is not supported: ${file}`)
    if (entry.isDirectory()) result.push(...(await listFiles(root, file)))
    else result.push(file)
  }
  return result
}

export const checkPath = async (root, file) => {
  if (
    !file ||
    file.includes('\\') ||
    path.isAbsolute(file) ||
    file.split('/').some((part) => part === '..' || part === '.')
  )
    throw new Error(`Unsafe project path: ${file}`)
  const destination = path.resolve(root)
  const segments = ['', ...file.split('/')]
  let current = destination
  for (const segment of segments) {
    if (segment) current = path.join(current, segment)
    const stat = await lstat(current).catch((error) => {
      if (error.code !== 'ENOENT') throw error
      return null
    })
    if (stat?.isSymbolicLink())
      throw new Error(`Refusing to edit through symlink: ${current}`)
  }
}

/** Preflight every path before applying any file. Roll back only our own writes. */
export const applyFiles = async (
  root,
  files,
  { dryRun = false, expected = new Map() } = {}
) => {
  for (const [file, old] of expected) {
    if (files.has(file)) continue
    await checkPath(root, file)
    const current = await readFile(path.join(root, file)).catch((error) => {
      if (error.code !== 'ENOENT') throw error
      return null
    })
    if (current === null ? old !== null : old === null || !current.equals(old))
      throw new Error(`File changed during planning: ${file}`)
  }
  const originals = new Map()
  const changed = new Map()
  for (const [file, value] of files) {
    await checkPath(root, file)
    const old = await readFile(path.join(root, file)).catch((error) => {
      if (error.code !== 'ENOENT') throw error
      return null
    })
    if (
      expected.has(file) &&
      !(old === null
        ? expected.get(file) === null
        : old.equals(expected.get(file) ?? Buffer.alloc(0)))
    )
      throw new Error(`File changed during planning: ${file}`)
    const content = Buffer.isBuffer(value) ? value : Buffer.from(value)
    if (old?.equals(content)) continue
    originals.set(file, old)
    changed.set(file, content)
  }
  if (dryRun) return [...changed.keys()]
  const applied = []
  const directories = new Set()
  const temporary = new Set()
  try {
    for (const [file, content] of changed) {
      const target = path.join(root, file)
      let parent = path.dirname(target)
      while (!(await exists(parent, ''))) {
        directories.add(parent)
        parent = path.dirname(parent)
      }
      await mkdir(path.dirname(target), { recursive: true })
      const staging = `${target}.samline-${randomUUID()}.tmp`
      temporary.add(staging)
      await writeFile(staging, content)
      await rename(staging, target)
      temporary.delete(staging)
      applied.push(file)
    }
  } catch (error) {
    for (const file of applied.reverse()) {
      const old = originals.get(file)
      if (old === null) await rm(path.join(root, file), { force: true })
      else await writeFile(path.join(root, file), old)
    }
    for (const file of temporary) await rm(file, { force: true })
    for (const directory of [...directories].sort(
      (a, b) => b.length - a.length
    ))
      await rmdir(directory).catch(() => {})
    throw error
  }
  return [...changed.keys()]
}

/** Capture the exact bytes used to derive an edit, without executing project code. */
export const createReader = (root) => {
  const expected = new Map()
  const capture = async (file) => {
    await checkPath(root, file)
    const content = await readFile(path.join(root, file))
    if (expected.has(file) && !content.equals(expected.get(file)))
      throw new Error(`File changed during planning: ${file}`)
    expected.set(file, content)
    return content.toString('utf8')
  }
  return { read: capture, expected }
}
