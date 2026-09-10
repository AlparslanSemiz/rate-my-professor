import axeCore, { type AxeResults, type Result } from 'axe-core'

/**
 * `axe-core` driven directly, with no matcher library in between.
 *
 * `jest-axe` is the usual way to do this and is deliberately not used: its Vitest 4
 * compatibility has not been verified here, and a matcher that swallows the result object
 * would also swallow the readable dump below — which is the part that gets delivered.
 */

/**
 * Rules jsdom cannot answer, switched off by name rather than left to fail or pass by accident.
 *
 * **This is not a list of rules the panel passes.** It is a list of questions this environment
 * cannot be asked, and every one of them is measured in the real browser instead — see
 * `e2e/a11y.spec.ts`. A rule silently returning no violations because the information it needs
 * does not exist is worse than a rule that is off, because only one of the two is visible in a
 * report.
 */
export const RULES_JSDOM_CANNOT_ANSWER: Readonly<Record<string, string>> = {
  // Needs computed colours and a canvas to sample them. jsdom has neither, so axe reports
  // `incomplete` at best and nothing at worst.
  'color-contrast': 'needs layout and canvas: measured in Chromium instead',
  // Needs box geometry. Every element in jsdom is 0x0, so a 20x20 target and a 44x44 target
  // are indistinguishable.
  'target-size': 'needs real box geometry: measured in Chromium instead',
}

/**
 * Runs axe over a rendered tree.
 *
 * @param container the element to scan, as `render()` returned it
 * @returns the full axe result, so the caller asserts on `violations` itself
 */
export async function axe(container: HTMLElement): Promise<AxeResults> {
  return axeCore.run(container, {
    rules: Object.fromEntries(
      Object.keys(RULES_JSDOM_CANNOT_ANSWER).map((rule) => [rule, { enabled: false }]),
    ),
  })
}

/**
 * @param violations what axe found
 * @returns a readable block naming each rule, its impact, and the markup that failed
 *
 * Exists because `expect(violations).toEqual([])` prints a serialised axe object, which is
 * several hundred lines per violation and unreadable in a terminal. The assertion stays exactly
 * that; this is printed beside it.
 */
export function formatViolations(violations: readonly Result[]): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => `      ${node.html}\n        -> ${node.failureSummary ?? ''}`)
        .join('\n')
      return `  [${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help}\n${nodes}`
    })
    .join('\n\n')
}

/**
 * @param container the rendered tree
 * @param label what is being scanned, for the printed report
 * @returns axe's violations, after printing them legibly
 */
export async function violationsIn(container: HTMLElement, label: string): Promise<Result[]> {
  const results = await axe(container)
  if (results.violations.length > 0) {
    console.error(`\naxe: ${label}\n${formatViolations(results.violations)}\n`)
  }
  return results.violations
}
