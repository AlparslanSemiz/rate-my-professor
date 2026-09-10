import { Text, type CSSProperties } from '@mantine/core'
import BrandMark from '@/components/BrandMark'
import { PANEL_NAME, PRODUCT_NAME } from '@/constants/branding'
import type { LoginStep } from '../hooks/useLoginFlow'
import { chrome } from '@/theme'

const brandRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 28,
}
const titleStyle: CSSProperties = { fontSize: 22 }

export default function LoginCardHeader({
  step,
  email,
}: {
  step: LoginStep
  email: string
}) {
  return (
    <>
      <div style={brandRowStyle}>
        <BrandMark size={36} />
        <div>
          <Text fw={600} c={chrome.textBright} size="sm" lh={1.2}>
            {PRODUCT_NAME}
          </Text>
          <Text size="xs" c={chrome.textDim} lh={1.2}>
            {PANEL_NAME}
          </Text>
        </div>
      </div>
      <Text fw={700} c={chrome.textBright} mb={4} style={titleStyle}>
        Sign in
      </Text>
      <Text size="sm" c={chrome.textDim} mb={24}>
        {step === 'email'
          ? "Pop in your KIT student email and we'll send over a login code."
          : `We just sent a code to ${email}. Enter it below.`}
      </Text>
    </>
  )
}
