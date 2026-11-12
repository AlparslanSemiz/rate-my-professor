/**
 * Fails when a public service, hook or domain type has no documentation.
 *
 * The panel documents unevenly, and it does so in the least useful direction: the leaf
 * services nobody imports carry the contract prose, while the facades the rest of the app
 * actually calls carry none. `UsersService` exposed eleven methods without a word between
 * them; `src/context` had sixteen exports and no doc comment at all.
 *
 * What counts as documented is deliberately shallow: a doc block immediately above the
 * declaration. This cannot tell a contract from a restatement of the signature, and does not
 * try to. It catches the one thing review keeps missing — a symbol nobody wrote anything
 * about — and leaves judging the prose to a person.
 *
 * Private members are exempt on purpose. They are implementation, and documenting them
 * invites the reader to depend on them.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Where the rule applies: the public interfaces of the panel. Components and their props are
 * out of scope, because a props interface is read alongside the JSX that consumes it.
 */
const SCOPES = [
  { dir: 'src/api' },
  { dir: 'src/domain' },
  { dir: 'src/context' },
  { dir: 'src/hooks' },
  { dir: 'src/utils' },
  { dir: 'src/features', only: /\/(model|hooks)\/|Model\.ts$/ },
]

/** Barrels re-export what is documented at its declaration; documenting both would drift. */
const EXEMPT_FILE = /(^|\/)index\.tsx?$/
const EXPORT_DECLARATION =
  /^export\s+(?:default\s+)?(?:abstract\s+)?(?:async\s+)?(?:class|function|const|interface|type|enum)\s+([A-Za-z_$][\w$]*)/
/** A method or accessor on a class: indented two spaces, named, opening a parameter list. */
const CLASS_MEMBER =
  /^ {2}(?:(?:private|protected|public|static|readonly|async|get|set|override)\s+)*([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\s*\(/
const NON_PUBLIC = /^ {2}(?:private|protected)\b/
const DOC_CLOSE = '*/'

function filesIn(dir, only) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
  return entries.flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return filesIn(path, only)
    if (!/\.tsx?$/.test(entry.name) || entry.name.includes('.test.')) return []
    if (EXEMPT_FILE.test(path)) return []
    if (only && !only.test(path)) return []
    return statSync(path).isFile() ? [path] : []
  })
}

/** Whether the lines above a declaration end in a doc block rather than in code. */
function isDocumented(lines, index) {
  for (let i = index - 1; i >= 0; i -= 1) {
    const line = lines[i].trim()
    if (line === '') return false
    if (line.startsWith('//')) continue
    return line.endsWith(DOC_CLOSE)
  }
  return false
}

const undocumented = []

for (const { dir, only } of SCOPES) {
  for (const file of filesIn(dir, only)) {
    const lines = readFileSync(file, 'utf8').split('\n')
    let inClass = false
    lines.forEach((line, index) => {
      if (/^export\s+(?:abstract\s+)?class\b/.test(line)) inClass = true
      else if (line === '}') inClass = false

      const declaration = EXPORT_DECLARATION.exec(line)
      const member = inClass && !NON_PUBLIC.test(line) ? CLASS_MEMBER.exec(line) : null
      const memberName = member && member[1] !== 'constructor' ? member[1] : null
      const name = declaration ? declaration[1] : memberName
      if (!name) return
      if (!isDocumented(lines, index)) undocumented.push(`${file}:${index + 1}  ${name}`)
    })
  }
}

if (undocumented.length > 0) {
  console.error(`Undocumented public symbols (${undocumented.length}):\n`)
  for (const entry of undocumented) console.error(`  ${entry}`)
  console.error('\nEvery public service, hook and domain type states what it does and its contract.')
  process.exit(1)
}

console.log('Every public service, hook and domain type is documented.')
