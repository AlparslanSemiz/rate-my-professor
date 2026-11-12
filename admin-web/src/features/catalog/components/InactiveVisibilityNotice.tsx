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
 * **What this said until 2026-09-10, and why it changed.** The catalogue used to read
 * `GET /data/lectures` and `GET /data/professor`, which serve active records only, so saving
 * this took the record out of the only list the panel had and there was no way back: the
 * `PATCH` that would undo it needs the id, and the id was on the row that had just vanished.
 * The notice existed to warn about a door that locked behind you.
 *
 * The screen now reads the `/all` pair, so the record is still there and the status filter is
 * what decides whether it is on screen. The warning is still worth making - the row does leave
 * the default view, and it stops being offered to students - but it is now a description of
 * where it went rather than of something irreversible. `F-006`.
 */
export default function InactiveVisibilityNotice({ noun }: { noun: 'lecture' | 'professor' }) {
  return (
    <Alert icon={<IconAlertTriangle size={iconSize.inline} />} color="yellow" radius="md" styles={noticeStyles}>
      Saving this as Inactive takes the {noun} out of the app and out of this screen's default
      view. To find it again, or to switch it back on, set the status filter above the table to
      Inactive or All.
    </Alert>
  )
}
