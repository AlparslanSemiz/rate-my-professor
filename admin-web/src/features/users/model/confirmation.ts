import type { MantineColor } from '@mantine/core'
import type { User } from '@/api/users'

export type ConfirmAction = 'block' | 'unblock' | 'delete'

export interface ConfirmConfig {
  title: string
  description: string
  confirmLabel: string
  confirmColor: MantineColor
  onConfirm: () => Promise<void>
}

export function getUserConfirmation(
  action: ConfirmAction,
  user: User,
  handlers: Record<ConfirmAction, () => Promise<void>>,
): ConfirmConfig {
  const confirmations: Record<ConfirmAction, ConfirmConfig> = {
    block: {
      title: 'Block user',
      description: `Block ${user.username}? They will lose access to the platform. You can unblock them later.`,
      confirmLabel: 'Block user',
      confirmColor: 'orange',
      onConfirm: handlers.block,
    },
    unblock: {
      title: 'Unblock user',
      description: `Unblock ${user.username}? They will regain access to the platform.`,
      confirmLabel: 'Unblock user',
      confirmColor: 'green',
      onConfirm: handlers.unblock,
    },
    delete: {
      title: 'Delete account',
      description: `Permanently delete ${user.username}'s account? This action cannot be undone.`,
      confirmLabel: 'Delete permanently',
      confirmColor: 'red',
      onConfirm: handlers.delete,
    },
  }

  return confirmations[action]
}
