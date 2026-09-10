import { createTheme } from '@mantine/core'
import { components } from './components'
import { kitColors } from './palette'

export { chrome } from './chrome'
export type { ChromeToken } from './chrome'
export { iconSize } from './iconSize'

export const theme = createTheme({
  primaryColor: 'green',
  // Filled surfaces have to carry white text; the pastel end of the ramp cannot. Shade 7 in
  // dark mode keeps a primary button readable while badges stay soft.
  primaryShade: { light: 6, dark: 7 },
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontWeight: '650',
  },
  radius: {
    xs: '6px',
    sm: '9px',
    md: '12px',
    lg: '16px',
    xl: '22px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.14)',
    md: '0 1px 2px rgba(0,0,0,0.35), 0 10px 28px rgba(0,0,0,0.16)',
    lg: '0 2px 4px rgba(0,0,0,0.4), 0 18px 44px rgba(0,0,0,0.28)',
  },
  colors: kitColors,
  components,
})
