import { Alert } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import { iconSize } from '@/theme'

const noticeStyles = {
  root: {
    background: 'rgba(252,229,0,0.07)',
    border: '1px solid rgba(252,229,0,0.22)',
  },
}

/**
 * Shown the moment a lecture or professor is switched to Inactive.
 *
 * The catalogue is read from `GET /data/lectures` and `GET /data/professor`, which return
 * active records only — so saving this leaves the record in the database but takes it out of
 * every list this panel can see, including this one. There is no way back from here. Until the
 * backend can serve inactive records to an admin caller (task G1), the operator has to be told
 * before they close the door rather than after.
 */
export default function InactiveVisibilityNotice({ noun }: { noun: 'lecture' | 'professor' }) {
  return (
    <Alert icon={<IconAlertTriangle size={iconSize.inline} />} color="yellow" radius="md" styles={noticeStyles}>
      Saving this as Inactive removes the {noun} from this panel. The catalogue reads return
      active records only, so it cannot be found or switched back on from here; the change has
      to be undone in the database.
    </Alert>
  )
}
