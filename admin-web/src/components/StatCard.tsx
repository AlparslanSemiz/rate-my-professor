import { Box, Text } from '@mantine/core'
import type { ElementType } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon: ElementType
  accent: string
  sub?: string
}

export default function StatCard({ label, value, icon: Icon, accent, sub }: StatCardProps) {
  return (
    <Box
      style={{
        background: '#161b22',
        border: '1px solid #21262d',
        borderRadius: 12,
        padding: sub ? '20px 20px' : '16px 20px',
        display: sub ? 'block' : 'flex',
        alignItems: 'center',
        gap: 14,
        position: sub ? 'relative' : undefined,
        overflow: sub ? 'hidden' : undefined,
      }}
    >
      <Box
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${accent}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...(sub ? { position: 'absolute', top: 16, right: 16 } : {}),
        }}
      >
        <Icon size={18} color={accent} />
      </Box>
      {sub ? (
        <>
          <Text size="xs" c="#6b7280" mb={8} tt="uppercase" fw={500} style={{ letterSpacing: '0.05em' }}>
            {label}
          </Text>
          <Text fw={700} c="#f1f5f9" mb={4} style={{ fontSize: 28, lineHeight: 1 }}>
            {value}
          </Text>
          <Text size="xs" c="#4b5563">
            {sub}
          </Text>
        </>
      ) : (
        <div>
          <Text fw={700} c="#f1f5f9" style={{ fontSize: 22, lineHeight: 1 }}>
            {value}
          </Text>
          <Text size="xs" c="#6b7280" mt={2}>
            {label}
          </Text>
        </div>
      )}
    </Box>
  )
}
