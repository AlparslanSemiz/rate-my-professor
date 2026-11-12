import { useCallback, useState } from 'react'

/**
 * Which row a modal is open for.
 *
 * `close` deliberately leaves `selectedId` set, so the modal keeps rendering its content while
 * it animates shut instead of flashing empty. The consequence is that `selectedId` outlives
 * the modal, and callers must read it **together with** `opened` rather than on its own —
 * resolving a record from a stale id is how a confirmation dialog ends up naming something the
 * operator has already dismissed.
 *
 * @returns the selected id, whether the modal is open, and the two commands
 */
export function useSelectedId() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [opened, setOpened] = useState(false)

  const open = useCallback((id: string) => {
    setSelectedId(id)
    setOpened(true)
  }, [])

  const close = useCallback(() => {
    setOpened(false)
  }, [])

  return { selectedId, opened, open, close }
}
