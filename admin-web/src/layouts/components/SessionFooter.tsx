import { Box, Divider, Text, UnstyledButton, type CSSProperties } from '@mantine/core'
import { IconCircleFilled } from '@tabler/icons-react'
import type { AuthUser } from '@/context/AuthContextValue'
import { KIT } from '@/constants/colors'
import { withAlpha } from '@/utils/color'
import { chrome } from '@/theme'

/** The "signed in" dot. Small enough to read as punctuation rather than as an icon. */
const STATUS_DOT_SIZE = 8


const ACTIVE_COLOR = KIT.green
const BORDER_COLOR = chrome.borderSubtle
const sessionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
}
const sessionInfoStyle: CSSProperties = { flex: 1, minWidth: 0 }
/**
 * The border and wash were written as `rgba(239,68,68,…)` — `#ef4444`, a brighter red than
 * the `KIT.red` the label itself uses. The control was drawn in two different reds. It is
 * one now, derived from the accent, which is slightly softer than it was.
 */
const logoutButtonStyle: CSSProperties = {
  fontSize: 11,
  color: KIT.red,
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: 4,
  border: `1px solid ${withAlpha(KIT.red, 0.25)}`,
  background: withAlpha(KIT.red, 0.06),
  lineHeight: 1,
  display: 'inline-block',
}

export default function SessionFooter({
  user,
  onLogout,
}: {
  user: AuthUser | null
  onLogout: () => Promise<void>
}) {
  return (
    <div>
      <Divider color={BORDER_COLOR} />
      <Box px={16} py={14}>
        <div style={sessionRowStyle}>
          <Box style={{ paddingTop: 3 }}>
            <IconCircleFilled size={STATUS_DOT_SIZE} color={ACTIVE_COLOR} />
          </Box>
          <div style={sessionInfoStyle}>
            <Text size="xs" c={chrome.textFaint} lh={1.3}>
              Signed in as
            </Text>
            {/* The name the backend reports, refreshed from `/auth/me` on every load. When it
                reports none, the email is shown instead — the old fallback was the literal
                word "Admin", which the backend never said and which read as a real name. */}
            <Text size="xs" fw={500} c={KIT.green} lh={1.3} truncate>
              {user?.name || user?.email || 'Unknown account'}
            </Text>
            {user?.name && (
              <Text size="xs" c={chrome.iconFaint} lh={1.3} mt={4} truncate>
                {user.email}
              </Text>
            )}
            <UnstyledButton onClick={onLogout} mt={10} style={logoutButtonStyle}>
              Sign out
            </UnstyledButton>
          </div>
        </div>
      </Box>
    </div>
  )
}
