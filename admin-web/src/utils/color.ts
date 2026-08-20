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

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}
