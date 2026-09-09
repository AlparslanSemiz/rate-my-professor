import type { ContentStatus, ReportReason, ReportStatus, Severity } from '@/domain/moderation'
import type { UserRole, UserStatus } from '@/domain/user'
import { routes } from './routes'

/**
 * KIT's colours at the pastel end of the ramps defined in `src/theme.ts` — shade 3 of each.
 *
 * This is the palette for anything that takes a colour as a plain string rather than as a
 * Mantine `color` prop: stat-card accents, severity bars, section colours, icon tints. Mantine
 * components go through the theme instead, so the two stay the same colour by construction.
 *
 * Neutral chrome — panel backgrounds, borders, body text — is not here. It is not accent
 * colour, and pulling it in would make every grey a decision.
 */
export const KIT = {
  /** KIT-Grün. The panel's primary. */
  green: '#66c0b4',
  /** Maigrün. */
  lime: '#adc766',
  /** KIT-Blau. */
  blue: '#90a2cc',
  /** Lila. */
  grape: '#c870b0',
  /** Orange. */
  orange: '#ecc376',
  /** Gelb, pulled down from the published value so it reads as a warning, not a highlighter. */
  yellow: '#e8dc66',
  /** Rot. */
  red: '#c77a7b',
  /** Cyan-Blau. */
  cyan: '#7bc7ec',
  /** For a value that carries no state of its own. */
  neutral: '#6b7482',
} as const

/**
 * KIT-Grün exactly as the institute publishes it, for the one place that needs the
 * unsoftened value: the gradient on the page-header accent bar, which runs from the pastel
 * `KIT.green` down to this. Everywhere else uses the ramp in `src/theme/palette.ts`.
 */
export const KIT_GREEN_PUBLISHED = '#009682'

/**
 * The colour a section is drawn in, keyed by its route. The dashboard's module cards, its
 * stat cards and the sidebar all read it from here: they used to hold their own copies, so
 * the same section could be one colour on the dashboard and another in the navigation.
 */
export const moduleAccent: Record<string, string> = {
  [routes.dashboard]: KIT.green,
  [routes.catalog]: KIT.lime,
  [routes.users]: KIT.blue,
  [routes.comments]: KIT.grape,
  [routes.feedback]: KIT.orange,
}

/** For the oversight views, which are not modules and have no colour of their own. */
export const DEFAULT_ACCENT = KIT.green

export const roleColor: Record<UserRole, string> = {
  ADMIN: 'blue',
  STUDENT: 'gray',
}

export const roleAccent: Record<UserRole, string> = {
  ADMIN: KIT.blue,
  STUDENT: KIT.neutral,
}

export const userStatusColor: Record<UserStatus, string> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  BLOCKED: 'red',
  DELETED: 'dark',
}

export const severityColor: Record<Severity, string> = {
  LOW: 'gray',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
}

export const severityAccent: Record<Severity, string> = {
  LOW: KIT.neutral,
  MEDIUM: KIT.yellow,
  HIGH: KIT.orange,
  CRITICAL: KIT.red,
}

export const reportStatusColor: Record<ReportStatus, string> = {
  OPEN: 'red',
  REVIEWED: 'blue',
  DISMISSED: 'gray',
  ACTION_TAKEN: 'green',
}

export const contentStatusColor: Record<ContentStatus, string> = {
  VISIBLE: 'green',
  HIDDEN: 'orange',
  DELETED: 'dark',
}

export const reportReasonColor: Record<ReportReason, string> = {
  SPAM: 'yellow',
  INSULT: 'orange',
  HARASSMENT: 'red',
  HATE_SPEECH: 'red',
  PERSONAL_INFORMATION: 'grape',
  OFF_TOPIC: 'gray',
  INAPPROPRIATE_CONTENT: 'orange',
  OTHER: 'gray',
}
