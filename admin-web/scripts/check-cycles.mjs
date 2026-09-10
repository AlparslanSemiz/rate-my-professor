/**
 * Fails when `src/` holds a cyclic import.
 *
 * `docs/class-diagram.md` claims the panel has no dependency cycles. That claim was checked
 * once, by hand, and only between packages — it missed three cycles inside features, because
 * a type had been declared on the module that renders it and the modules it renders imported
 * the parent back for it.
 *
 * Those three were `import type`, so they were erased at build time and nothing failed. They
 * were still cycles in the module graph, which is what a design review reads, and the only
 * way to keep the claim true is to check it on every run rather than believe it.
 *
 * Deliberately no dependency: this walks the same import syntax `tsc` resolves, and adding a
 * package to answer a question a 60-line script answers is not worth the supply chain.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const ROOT = 'src'
const ALIAS = '@/'
/** Extensions and index files a bare specifier may resolve to, in the order `tsc` tries. */
const RESOLUTIONS = ['', '.ts', '.tsx', '/index.ts', '/index.tsx']
const IMPORT_PATTERN = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(entry.name) && !entry.name.includes('.test.') ? [path] : []
  })
}

function resolveModule(base) {
  for (const suffix of RESOLUTIONS) {
    const candidate = base + suffix
    try {
      if (statSync(candidate).isFile()) return relative(process.cwd(), candidate)
    } catch {
      // Not this candidate; try the next resolution.
    }
  }
  return null
}

function importsOf(file) {
  const source = readFileSync(file, 'utf8')
  const targets = new Set()
  for (const [, specifier] of source.matchAll(IMPORT_PATTERN)) {
    const base = specifier.startsWith(ALIAS)
      ? join(ROOT, specifier.slice(ALIAS.length))
      : specifier.startsWith('.')
        ? resolve(dirname(file), specifier)
        : null
    // Anything else is a package, which cannot take part in a cycle inside src/.
    const target = base && resolveModule(base)
    if (target) targets.add(target)
  }
  return [...targets]
}

const files = sourceFiles(ROOT)
const graph = new Map(files.map((file) => [file, importsOf(file)]))

const VISITING = 1
const DONE = 2
const state = new Map()
const stack = []
const cycles = []

function walk(file) {
  state.set(file, VISITING)
  stack.push(file)
  for (const target of graph.get(file) ?? []) {
    if (state.get(target) === VISITING) {
      cycles.push([...stack.slice(stack.indexOf(target)), target])
    } else if (!state.has(target)) {
      walk(target)
    }
  }
  stack.pop()
  state.set(file, DONE)
}

for (const file of files) if (!state.has(file)) walk(file)

if (cycles.length > 0) {
  console.error(`Cyclic imports in ${ROOT}/ (${cycles.length}):\n`)
  for (const cycle of cycles) console.error(`  ${cycle.join('\n    -> ')}\n`)
  console.error('Move the shared declaration into a module both sides can depend on.')
  process.exit(1)
}

console.log(`No cyclic imports: ${files.length} files, ${[...graph.values()].flat().length} edges.`)
