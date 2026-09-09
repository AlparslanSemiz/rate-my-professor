import type { ReactNode } from 'react'
import { Box, Text } from '@mantine/core'
import { chrome } from '@/theme'
import { detailCardStyle } from './detailStyles'

/** A labelled block inside a log entry's details modal. */
export default function DetailSection({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <Box style={detailCardStyle}>
      <Text size="xs" fw={600} c={chrome.textDim} tt="uppercase" mb={6}>
        {label}
      </Text>
      {children}
    </Box>
  )
}
