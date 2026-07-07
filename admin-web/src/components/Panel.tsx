import { Box, type BoxProps } from '@mantine/core'
import type { HTMLAttributes } from 'react'

type PanelProps = BoxProps & Omit<HTMLAttributes<HTMLDivElement>, keyof BoxProps>

const panelStyle = {
  background: '#161b22',
  border: '1px solid #21262d',
  borderRadius: 12,
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
