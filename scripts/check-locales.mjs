// Fails when a locale is missing a key that English has, or has a key English doesn't.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(import.meta.dirname, '../src/renderer/src/i18n/locales')

// Plural forms differ by language (English has _one and _other, Korean only _other), so compare base keys.
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

function keys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) =>
    child && typeof child === 'object' && !Array.isArray(child)
      ? keys(child, `${prefix}${key}.`)
      : [`${prefix}${key.replace(PLURAL_SUFFIX, '')}`]
  )
}

const load = (file) => JSON.parse(readFileSync(join(dir, file), 'utf8'))
const reference = new Set(keys(load('en.json')))
let failed = false

for (const file of readdirSync(dir).filter((name) => name.endsWith('.json') && name !== 'en.json')) {
  const own = new Set(keys(load(file)))
  const missing = [...reference].filter((key) => !own.has(key))
  const extra = [...own].filter((key) => !reference.has(key))
  if (missing.length || extra.length) {
    failed = true
    if (missing.length) console.error(`${file} is missing: ${missing.join(', ')}`)
    if (extra.length) console.error(`${file} has extra keys: ${extra.join(', ')}`)
  }
}

if (failed) process.exit(1)
console.log(`Locales match (${reference.size} keys).`)
