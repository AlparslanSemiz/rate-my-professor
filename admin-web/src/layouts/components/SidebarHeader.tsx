import { Box, Text, type CSSProperties } from '@mantine/core'
import BrandMark from '@/components/BrandMark'
import { PANEL_NAME, PRODUCT_NAME } from '@/constants/branding'
import { chrome } from '@/theme'

const BORDER_COLOR = chrome.borderSubtle
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
          <Text fw={600} size="sm" c={chrome.textBright} lh={1.2}>
            {PRODUCT_NAME}
          </Text>
          <Text size="xs" c={chrome.textDim} lh={1.2}>
            {PANEL_NAME}
          </Text>
        </div>
      </div>
    </Box>
  )
}
