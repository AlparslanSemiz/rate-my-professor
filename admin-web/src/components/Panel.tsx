import { Box, type BoxProps } from '@mantine/core'
import type { HTMLAttributes } from 'react'

type PanelProps = BoxProps & Omit<HTMLAttributes<HTMLDivElement>, keyof BoxProps>

const panelStyle = {
  background: 'linear-gradient(180deg, #171b23 0%, #14171e 100%)',
  border: '1px solid #232935',
  borderRadius: 14,
  boxShadow: '0 1px 2px rgba(0,0,0,0.35), 0 10px 28px rgba(0,0,0,0.16)',
}

export default function Panel({ style, ...rest }: PanelProps) {
  return (
    <Box
      style={{
        ...panelStyle,
        ...style,
      }}
      {...rest}
    />
  )
}
