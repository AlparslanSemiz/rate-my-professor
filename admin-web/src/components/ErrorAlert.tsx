import { Alert } from '@mantine/core'
import { IconAlertCircle, IconAlertTriangle } from '@tabler/icons-react'
import { KIT } from '@/constants/colors'
import { withAlpha } from '@/utils/color'
import { iconSize } from '@/theme'

/**
 * What the message is telling the operator, which decides colour, icon and how loudly a
 * screen reader says it.
 *
 * `error` is the default because it is what every existing caller means: an action did not
 * happen. `warning` is for a condition the operator can carry on through.
 */
export type AlertLevel = 'error' | 'warning'

interface ErrorAlertProps {
  message: string
  mb?: number
  /** Defaults to `error`. */
  level?: AlertLevel
  /** When given, the alert carries a close button that calls this. */
  onDismiss?: () => void
  /** The close button's accessible name. Required whenever `onDismiss` is given. */
  dismissLabel?: string
}

/**
 * Red is spent on "a thing did not happen", so a condition the operator can work through is
 * yellow instead — `KIT.yellow` is already described in `constants/colors.ts` as pulled down
 * to read as a warning rather than a highlighter. Colour carries the state, per `DESIGN.md`.
 *
 * `role` follows the level and not the component. Mantine's `Alert` defaults to `alert`, which
 * is assertive and interrupts a screen reader mid-sentence — right for a failed action the
 * operator just triggered, wrong for a notice that appears unprompted during a page load.
 *
 * The red is the literal `rgba(239,68,68,…)` rather than `KIT.red`. That is a genuine
 * divergence from the no-hex-literal rule, it predates this component's second level, and
 * correcting it restyles seventeen call sites — so it is recorded in `docs/DESIGN.md` and
 * `docs/TODO.md` rather than changed here.
 */
/**
 * Mantine draws the close button at 20x20. WCAG 2.2 SC 2.5.8 asks for 24x24 CSS pixels, and
 * this is the one control the panel offers inside an alert, so it is the one that has to
 * clear it.
 */
const DISMISS_TARGET_SIZE = 24

const dismissStyle = {
  minWidth: DISMISS_TARGET_SIZE,
  minHeight: DISMISS_TARGET_SIZE,
  width: DISMISS_TARGET_SIZE,
  height: DISMISS_TARGET_SIZE,
}

const LEVELS = {
  error: {
    color: 'red',
    role: undefined,
    Icon: IconAlertCircle,
    styles: {
      root: {
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.2)',
      },
      closeButton: dismissStyle,
    },
  },
  warning: {
    color: 'yellow',
    role: 'status',
    Icon: IconAlertTriangle,
    styles: {
      root: {
        background: withAlpha(KIT.yellow, 0.08),
        border: `1px solid ${withAlpha(KIT.yellow, 0.2)}`,
      },
      closeButton: dismissStyle,
    },
  },
} as const

export default function ErrorAlert({
  message,
  mb = 12,
  level = 'error',
  onDismiss,
  dismissLabel,
}: ErrorAlertProps) {
  if (!message) return null

  const { color, role, Icon, styles } = LEVELS[level]

  return (
    <Alert
      icon={<Icon size={iconSize.inline} />}
      color={color}
      role={role}
      mb={mb}
      radius="md"
      styles={styles}
      withCloseButton={onDismiss !== undefined}
      onClose={onDismiss}
      closeButtonLabel={dismissLabel}
    >
      {message}
    </Alert>
  )
}
