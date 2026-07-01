import { Text } from '@mantine/core'
import type { ElementType } from 'react'
import Panel from './Panel'

interface StatIconProps {
  icon: ElementType
  accent: string
  floating?: boolean
}

function StatIcon({ icon: Icon, accent, floating }: StatIconProps) {
  return (
    <Panel
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: `${accent}18`,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...(floating ? { position: 'absolute', top: 16, right: 16 } : {}),
      }}
    >
      <Icon size={18} color={accent} />
    </Panel>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: ElementType
  accent: string
}

export default function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <Panel style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <StatIcon icon={icon} accent={accent} />
      <div>
        <Text fw={700} c="#f1f5f9" style={{ fontSize: 22, lineHeight: 1 }}>
          {value}
        </Text>
        <Text size="xs" c="#6b7280" mt={2}>
          {label}
        </Text>
      </div>
    </Panel>
  )
}

interface StatCardDetailedProps extends StatCardProps {
  sub: string
}

export function StatCardDetailed({ label, value, sub, icon, accent }: StatCardDetailedProps) {
  return (
    <Panel style={{ padding: '20px 20px', position: 'relative', overflow: 'hidden' }}>
      <StatIcon icon={icon} accent={accent} floating />
      <Text size="xs" c="#6b7280" mb={8} tt="uppercase" fw={500} style={{ letterSpacing: '0.05em' }}>
        {label}
      </Text>
      <Text fw={700} c="#f1f5f9" mb={4} style={{ fontSize: 28, lineHeight: 1 }}>
        {value}
      </Text>
      <Text size="xs" c="#4b5563">
        {sub}
      </Text>
    </Panel>
  )
}
