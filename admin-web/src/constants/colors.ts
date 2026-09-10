import { isRefusal, type AuditAction } from '@/domain/auditLog'
import type { ContentStatus, ReportReason, ReportStatus, Severity } from '@/domain/moderation'
import type { UserRole, UserStatus } from '@/domain/user'
import { routes, type Route } from './routes'

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
 * The colour a section is drawn in, keyed by its route. Not exported: the table and the rule
 * for what happens when a route is not in it are one decision, and `accentForRoute` is where
 * that decision is made. It used to be public and typed `Record<string, string>`, so
 * `moduleAccent['/dashbaord']` compiled and yielded `undefined` — and four of the five call
 * sites had no fallback.
 */
const MODULE_ACCENTS: Partial<Record<Route, string>> = Object.freeze({
  [routes.dashboard]: KIT.green,
  [routes.catalog]: KIT.lime,
  [routes.users]: KIT.blue,
  [routes.comments]: KIT.grape,
  [routes.feedback]: KIT.orange,
})

/** For the oversight views, which are not modules and have no colour of their own. */
export const DEFAULT_ACCENT = KIT.green

/**
 * The accent for a section of the panel.
 *
 * @param route the path the section is served at
 * @returns the section's own colour, or `DEFAULT_ACCENT` for the views that have none —
 *          audit logs, help and login, which are oversight rather than modules
 */
export function accentForRoute(route: string): string {
  return MODULE_ACCENTS[route as Route] ?? DEFAULT_ACCENT
}

export const roleColor: Readonly<Record<UserRole, string>> = Object.freeze({
  ADMIN: 'blue',
  STUDENT: 'gray',
})

export const roleAccent: Readonly<Record<UserRole, string>> = Object.freeze({
  ADMIN: KIT.blue,
  STUDENT: KIT.neutral,
})

export const userStatusColor: Readonly<Record<UserStatus, string>> = Object.freeze({
  ACTIVE: 'green',
  INACTIVE: 'gray',
  BLOCKED: 'red',
  DELETED: 'dark',
})

export const severityColor: Readonly<Record<Severity, string>> = Object.freeze({
  LOW: 'gray',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
})

export const severityAccent: Readonly<Record<Severity, string>> = Object.freeze({
  LOW: KIT.neutral,
  MEDIUM: KIT.yellow,
  HIGH: KIT.orange,
  CRITICAL: KIT.red,
})

export const reportStatusColor: Readonly<Record<ReportStatus, string>> = Object.freeze({
  OPEN: 'red',
  REVIEWED: 'blue',
  DISMISSED: 'gray',
  ACTION_TAKEN: 'green',
})

export const contentStatusColor: Readonly<Record<ContentStatus, string>> = Object.freeze({
  VISIBLE: 'green',
  HIDDEN: 'orange',
  DELETED: 'dark',
})

export const reportReasonColor: Readonly<Record<ReportReason, string>> = Object.freeze({
  SPAM: 'yellow',
  INSULT: 'orange',
  HARASSMENT: 'red',
  HATE_SPEECH: 'red',
  PERSONAL_INFORMATION: 'grape',
  OFF_TOPIC: 'gray',
  INAPPROPRIATE_CONTENT: 'orange',
  OTHER: 'gray',
})

/**
 * Whether a catalogue record is offered to students.
 *
 * Written inline as `active ? 'green' : 'gray'` in both catalogue rows, and it was the one
 * state in the panel with no entry here and no row on the Help page either.
 */
export const activeStatusColor: Readonly<Record<'active' | 'inactive', string>> = Object.freeze({
  active: 'green',
  inactive: 'gray',
})

/**
 * The four actions that read as something other than an ordinary edit.
 *
 * Only the exceptions: everything else is decided by {@link auditActionColor}'s suffix rule or
 * falls through to the default. Keyed on `AuditAction`, so an action the backend adds and the
 * domain learns about is a compile-time prompt to decide its colour rather than a silent blue.
 */
const AUDIT_ACTION_COLORS: Partial<Record<AuditAction, string>> = Object.freeze({
  ADMIN_LOGIN: 'green',
  ADMIN_LOGOUT: 'gray',
  USER_BLOCKED: 'orange',
  USER_WARNING_CREATED: 'orange',
})

/** Anything that removed something reads as a removal, whatever it removed. */
const DELETION_ACTION_SUFFIX = '_DELETED'
const DELETION_COLOR = 'red'
const DEFAULT_AUDIT_ACTION_COLOR = 'blue'

/** For an entry whose action is missing or is not a string at all. */
const UNKNOWN_ACTION_COLOR = 'gray'

/**
 * The colour an audit entry's action badge is drawn in.
 *
 * Half table and half rule, and both halves are deliberate. The named actions are exceptions
 * and belong in a table. Deletions are a *class* — the administrative action set grows with
 * every new thing an admin can do, and a deletion has to read as a deletion whether it removed
 * a comment, a lecture or a warning — so that half stays a rule.
 *
 * **Takes `unknown`, and that is a reversal worth explaining.** It was typed on the
 * `AuditAction` union so that a caller could not pass a typo and get blue. Every caller turned
 * out to be a log row handing over `entry.action` straight off the wire, where the union is a
 * claim about the backend rather than about the code — and `F-028` was this function calling
 * `.endsWith` on a value that was not a string, taking the whole screen down through the
 * `ErrorBoundary`. The union protected a mistake nobody was making from a value nobody had
 * checked. `AUDIT_ACTION_COLORS` stays keyed on the union, so the table still says which known
 * actions are exceptions.
 *
 * @param action the recorded action, as it arrived
 * @returns a Mantine colour name; the neutral one when there is no action to colour
 */
export function auditActionColor(action: unknown): string {
  if (typeof action !== 'string' || action === '') return UNKNOWN_ACTION_COLOR
  return (
    AUDIT_ACTION_COLORS[action as AuditAction] ??
    (action.endsWith(DELETION_ACTION_SUFFIX) ? DELETION_COLOR : DEFAULT_AUDIT_ACTION_COLOR)
  )
}

/**
 * The two student actions that are a session event rather than a contribution.
 *
 * A table again, for the same reason as its audit sibling: the named ones are exceptions and
 * everything else is decided by the rules below.
 */
const ACTIVITY_ACTION_COLORS: Readonly<Record<string, string>> = Object.freeze({
  USER_LOGIN: 'violet',
  USER_LOGOUT: 'violet',
  RATING_SUBMITTED: 'yellow',
})

/** A refusal is the one thing on the activity log that did not happen. */
const REFUSAL_COLOR = 'red'
/** Reporting something is not the same kind of act as writing something. */
const REPORT_ACTION_SUFFIX = '_REPORT_CREATED'
const REPORT_COLOR = 'orange'
const DEFAULT_ACTIVITY_ACTION_COLOR = 'teal'

/**
 * The colour an activity entry's action badge is drawn in.
 *
 * The refusal case is the one that carries weight: everything else on that screen is something
 * a student successfully did, so the two entries that record a door being closed have to read
 * differently at a glance.
 *
 * Takes `unknown` for the reason {@link auditActionColor} does — the value is whatever the
 * backend put in the field, and `F-028` was a colour function calling a string method on
 * something that was not one.
 *
 * @param action the recorded action, as it arrived
 * @returns a Mantine colour name; the neutral one when there is no action to colour
 */
export function activityActionColor(action: unknown): string {
  if (typeof action !== 'string' || action === '') return UNKNOWN_ACTION_COLOR
  if (isRefusal(action)) return REFUSAL_COLOR
  return (
    ACTIVITY_ACTION_COLORS[action] ??
    (action.endsWith(REPORT_ACTION_SUFFIX) ? REPORT_COLOR : DEFAULT_ACTIVITY_ACTION_COLOR)
  )
}
