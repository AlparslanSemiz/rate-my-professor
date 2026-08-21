import { Box, Text, type CSSProperties } from '@mantine/core'
import BrandMark from '../../components/BrandMark'
import { PANEL_NAME, PRODUCT_NAME } from '../../constants/branding'

const BORDER_COLOR = '#1e2028'
const brandRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

export default function SidebarHeader() {
  return (
    <Box px={20} py={20} style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}>
      <div style={brandRowStyle}>
        <BrandMark />
        <div>
          <Text fw={600} size="sm" c="#f1f5f9" lh={1.2}>
            {PRODUCT_NAME}
          </Text>
          <Text size="xs" c="#6b7280" lh={1.2}>
            {PANEL_NAME}
          </Text>
        </div>
      </div>
    </Box>
  )
}
