import { Box, Text, type CSSProperties } from '@mantine/core'
import { IconShield } from '@tabler/icons-react'

const BORDER_COLOR = '#1e2028'
const brandRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}
const brandMarkStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  background: 'linear-gradient(135deg, #34d17a, #16a34a)',
  boxShadow: '0 4px 14px rgba(34,197,94,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

export default function SidebarHeader() {
  return (
    <Box px={20} py={20} style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}>
      <div style={brandRowStyle}>
        <Box style={brandMarkStyle}>
          <IconShield size={18} color="white" />
        </Box>
        <div>
          <Text fw={600} size="sm" c="#f1f5f9" lh={1.2}>
            Admin Panel
          </Text>
          <Text size="xs" c="#4b5563" lh={1.2}>
            Admin toolkit
          </Text>
        </div>
      </div>
    </Box>
  )
}
