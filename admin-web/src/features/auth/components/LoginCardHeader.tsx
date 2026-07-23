import { Box, Text, type CSSProperties } from '@mantine/core'
import { IconShield } from '@tabler/icons-react'
import type { LoginStep } from '../hooks/useLoginFlow'

const brandRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 28,
}
const brandMarkStyle: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 9,
  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
        <Box style={brandMarkStyle}>
          <IconShield size={20} color="white" />
        </Box>
        <div>
          <Text fw={600} c="#f1f5f9" size="sm" lh={1.2}>
            Admin Panel
          </Text>
          <Text size="xs" c="#4b5563" lh={1.2}>
            Admin toolkit
          </Text>
        </div>
      </div>
      <Text fw={700} c="#f1f5f9" mb={4} style={titleStyle}>
        Sign in
      </Text>
      <Text size="sm" c="#6b7280" mb={24}>
        {step === 'email'
          ? "Pop in your KIT student email and we'll send over a login code."
          : `We just sent a code to ${email} — enter it below.`}
      </Text>
    </>
  )
}
