import { Box, Text } from '@mantine/core'
import type { CSSProperties, ElementType } from 'react'
import Panel from './Panel'
import { chrome } from '@/theme'

/** Centred in the card's tinted square, which is `STAT_ICON_SIZE` across. */
const CARD_ICON_SIZE = 18


const STAT_ICON_SIZE = 36
const STAT_ICON_RADIUS = 8
const statIconBaseStyle: CSSProperties = {
  width: STAT_ICON_SIZE,
  height: STAT_ICON_SIZE,
  borderRadius: STAT_ICON_RADIUS,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

interface StatIconProps {
  icon: ElementType
  accent: string
  floating?: boolean
}

function StatIcon({ icon: Icon, accent, floating }: StatIconProps) {
  return (
    <Box
      style={{
        ...statIconBaseStyle,
        background: `${accent}18`,
        ...(floating ? { position: 'absolute', top: 16, right: 16 } : {}),
      }}
    >
      <Icon size={CARD_ICON_SIZE} color={accent} />
    </Box>
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
        <Text fw={700} c={chrome.textBright} style={{ fontSize: 22, lineHeight: 1 }}>
          {value}
        </Text>
        <Text size="xs" c={chrome.textDim} mt={2}>
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
      <Text size="xs" c={chrome.textDim} mb={8} tt="uppercase" fw={500} style={{ letterSpacing: '0.05em' }}>
        {label}
      </Text>
      <Text fw={700} c={chrome.textBright} mb={4} style={{ fontSize: 28, lineHeight: 1 }}>
        {value}
      </Text>
      <Text size="xs" c={chrome.textFaint}>
        {sub}
      </Text>
    </Panel>
  )
}
