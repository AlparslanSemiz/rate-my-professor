import type { KeyboardEvent } from 'react'

export function activateOnEnterOrSpace(
  event: KeyboardEvent<HTMLElement>,
  activate: () => void
): void {
  if (event.key !== 'Enter' && event.key !== ' ') return

  event.preventDefault()
  activate()
}
