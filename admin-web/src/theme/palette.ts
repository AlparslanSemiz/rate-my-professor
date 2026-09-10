import type { MantineColorsTuple } from '@mantine/core'

/**
 * KIT's own colours, softened for a dark interface.
 *
 * Every ramp is generated the same way from the institute's published value, which sits at
 * shade 6: shades 0–5 mix it toward white, 7–9 toward the page background. That split is what
 * makes the panel pastel without making it illegible — Mantine's dark scheme draws
 * `variant="light"` badges from shades 3 and 4 (the pastel end) and `variant="filled"`
 * surfaces from shade 8 (dark enough to carry white text). Picking one flat "pastel" value per
 * colour would have had to lose one of those two.
 *
 * `KIT_PALETTE` in `src/constants/colors.ts` holds shade 3 of each ramp for the places that
 * take a colour as a plain string — stat-card accents, severity bars, section colours.
 */
export const kitColors: Record<string, MantineColorsTuple> = {
  // KIT-Grün #009682 — the primary.
  green: ['#dbf0ee', '#b8e2dc', '#8fd1c8', '#66c0b4', '#42b1a2', '#1fa391', '#009682', '#027b6c', '#046257', '#064b44'],
  // Maigrün #77A200.
  lime: ['#ecf2db', '#d9e5b8', '#c3d68f', '#adc766', '#9aba42', '#87ad1f', '#77a200', '#618404', '#4e6907', '#3c500a'],
  // KIT-Blau #4664AA.
  blue: ['#e5e9f3', '#cbd4e7', '#aebbda', '#90a2cc', '#768cc0', '#5c77b4', '#4664aa', '#3a538c', '#304370', '#263456'],
  // Lila #A3107C.
  grape: ['#f2deed', '#e5bcda', '#d796c5', '#c870b0', '#bb4e9e', '#ae2d8c', '#a3107c', '#850f67', '#690f54', '#4f0e42'],
  // Orange #DF9B1B.
  orange: ['#fbf1df', '#f6e3bf', '#f1d39b', '#ecc376', '#e7b556', '#e3a736', '#df9b1b', '#b57f19', '#8e6518', '#6a4d16'],
  // Gelb — KIT's #FCE500 pulled down to #D9C400, because the published value reads as a
  // highlighter on a dark background rather than as a warning.
  yellow: ['#faf7db', '#f4eeb8', '#eee58f', '#e8dc66', '#e3d342', '#decb1f', '#d9c400', '#b09f04', '#8b7e07', '#685f0a'],
  // Rot #A22223.
  red: ['#f2e0e0', '#e5c1c1', '#d69e9e', '#c77a7b', '#ba5b5c', '#ad3d3d', '#a22223', '#841e20', '#691a1d', '#4f161a'],
  // Cyan-Blau #23A1E0.
  cyan: ['#e0f2fb', '#c1e5f6', '#9ed6f1', '#7bc7ec', '#5cb9e8', '#3dace4', '#23a1e0', '#1e83b7', '#1a6992', '#16506f'],
  // Warmer, softer neutrals — less cold GitHub-clone feel.
  dark: ['#c9d1d9', '#adb5c0', '#8a93a1', '#6b7482', '#474e5a', '#2f3540', '#232935', '#171b23', '#12151c', '#0b0d12'],
  gray: ['#eef0f2', '#dde0e4', '#c3c8cf', '#a4abb5', '#858d99', '#6b7482', '#586170', '#464e5b', '#373e49', '#2b313a'],
}
