import type { MantineColor } from '@mantine/core'
import type { User, UserStatus } from '@/api/users'

/** The three account actions that ask before they act. */
export type ConfirmAction = 'block' | 'unblock' | 'delete'

/**
 * The colour each account action is drawn in, wherever it appears.
 *
 * The dialog and the button that opens it are two places one decision was made. They agreed
 * by luck — `'orange'` for block and `'green'` for unblock were written out in both — and
 * nothing would have caught them drifting apart.
 */
export const USER_ACTION_COLORS: Readonly<Record<ConfirmAction, MantineColor>> = Object.freeze({
  block: 'orange',
  unblock: 'green',
  delete: 'red',
})

/**
 * Which of the two the block button offers, given where the account stands.
 *
 * @param status the account's status
 * @returns `unblock` for a blocked account, `block` for any other
 */
export function blockToggleAction(status: UserStatus): Extract<ConfirmAction, 'block' | 'unblock'> {
  return status === 'BLOCKED' ? 'unblock' : 'block'
}

/** Everything the confirmation dialog needs: what it says, how it looks, and what it does. */
export interface ConfirmConfig {
  title: string
  description: string
  confirmLabel: string
  confirmColor: MantineColor
  onConfirm: () => Promise<void>
}

/**
 * The wording and colour for one account action, bound to the handler that performs it.
 *
 * The wording is the point rather than boilerplate: blocking is reversible and says so,
 * deleting is not and says that instead. Keeping the three together means the copy cannot
 * drift from the colour, which is what happened when each button chose both for itself.
 *
 * @param action which action is being confirmed
 * @param user the account it is about, named in the description
 * @param handlers what to run on confirmation, one per action
 * @returns the dialog's configuration
 */
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
      confirmColor: USER_ACTION_COLORS.block,
      onConfirm: handlers.block,
    },
    unblock: {
      title: 'Unblock user',
      description: `Unblock ${user.username}? They will regain access to the platform.`,
      confirmLabel: 'Unblock user',
      confirmColor: USER_ACTION_COLORS.unblock,
      onConfirm: handlers.unblock,
    },
    delete: {
      title: 'Delete account',
      description: `Permanently delete ${user.username}'s account? This action cannot be undone.`,
      confirmLabel: 'Delete permanently',
      confirmColor: USER_ACTION_COLORS.delete,
      onConfirm: handlers.delete,
    },
  }

  return confirmations[action]
}
