import { Box, type BoxProps } from '@mantine/core'
import type { AriaRole, KeyboardEventHandler, MouseEventHandler, ReactNode } from 'react'

type PanelProps = BoxProps & {
  children?: ReactNode
  onClick?: MouseEventHandler<HTMLDivElement>
  onMouseEnter?: MouseEventHandler<HTMLDivElement>
  onMouseLeave?: MouseEventHandler<HTMLDivElement>
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>
  role?: AriaRole
  tabIndex?: number
  'aria-label'?: string
}

export default function Panel({ style, ...rest }: PanelProps) {
  return (
    <Box
      style={{
        background: '#161b22',
        border: '1px solid #21262d',
        borderRadius: 12,
        ...style,
      }}
      {...rest}
    />
  )
}
