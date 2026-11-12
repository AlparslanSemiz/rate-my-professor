import type { ReactNode } from 'react'
import { Box, Text } from '@mantine/core'
import { chrome } from '@/theme'
import { detailCardStyle } from './detailStyles'

/**
 * A labelled block inside a details modal.
 *
 * Shared rather than log-specific since 2026-09-10: the rating detail view draws the same
 * card, and one card drawn two ways is how a panel stops looking like one panel. It moved
 * here from `features/logs/components/details` when the second caller arrived, rather than
 * being imported across features.
 */
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
