import { Box, type BoxProps } from '@mantine/core'
import type { HTMLAttributes } from 'react'

type PanelProps = BoxProps & Omit<HTMLAttributes<HTMLDivElement>, keyof BoxProps>

/**
 * The panel surface every screen is built out of.
 *
 * The resting look lives in `.panel` rather than in an inline style: an inline style beats any
 * class rule, so as long as the background sat here, no `:hover` rule could change it and
 * every hovering surface had to re-implement the effect in JavaScript. A caller's own `style`
 * still overrides, exactly as before.
 */
export default function Panel({ className, style, ...rest }: PanelProps) {
  return (
    <Box className={className ? `panel ${className}` : 'panel'} style={style} {...rest} />
  )
}
