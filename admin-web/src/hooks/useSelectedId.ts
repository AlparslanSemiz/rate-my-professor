import { useCallback, useState } from 'react'

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
