import { assert } from './assert'

/**
 * A hex accent at a given opacity, e.g. `withAlpha('#3b82f6', 0.18)`. The accents are stored
 * once as hex in `src/constants/colors.ts`; a surface that needs a wash of the same colour
 * derives it here rather than keeping a second, hand-written `rgba()` copy that drifts the
 * moment the accent changes.
 */
export function withAlpha(hex: string, alpha: number): string {
  const digits = hex.replace('#', '')
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits

  const red = Number.parseInt(full.slice(0, 2), 16)
  const green = Number.parseInt(full.slice(2, 4), 16)
  const blue = Number.parseInt(full.slice(4, 6), 16)

  // Every caller passes a token from `src/theme` or `src/constants/colors.ts`, so a value
  // that does not parse is a typo in one of those rather than anything an operator did.
  // Without this the channels come out `NaN` and the browser silently drops the whole
  // declaration, leaving a surface with no background and nothing in the console.
  assert(
    Number.isFinite(red) && Number.isFinite(green) && Number.isFinite(blue),
    `withAlpha received "${hex}", which is not a hex colour.`,
  )

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}
