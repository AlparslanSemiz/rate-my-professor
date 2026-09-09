import type {
  ManagedAnswer,
  ManagedComment,
  ReportedAnswer,
  ReportedComment,
} from '@/api/moderation'
import type { BugReport } from '@/api/feedback'
import type { AuditLog, AuditMeta } from '@/api/logs'
import type { SystemStatus } from '@/api/system'
import type { User, Warning } from '@/api/users'

/**
 * What the handlers serve, and write back to.
 *
 * A store rather than fixed responses, because the behaviours worth testing are the ones that
 * span two requests: a write followed by the read that should show it, a report whose status
 * change hides the content it names, a second page that continues from the first. A handler
 * returning a constant proves none of those, and the two hand-written stateful `vi.mock`
 * implementations this replaces had already grown into small backends for exactly that reason.
 *
 * Mutable on purpose, and reset between tests by `src/test/msw/server.ts`.
 */
export interface MswDb {
  comments: ManagedComment[]
  answers: ManagedAnswer[]
  commentReports: ReportedComment[]
  answerReports: ReportedAnswer[]
  users: User[]
  warnings: Record<string, Warning[]>
  auditLogs: AuditLog[]
  auditMeta: AuditMeta | null
  bugReports: BugReport[]
  /** Whether the backend holds GitLab credentials; the escalation control is hidden without. */
  gitlabEnabled: boolean
  /** `null` means `/system/status` itself fails, rather than reporting a degraded database. */
  systemStatus: SystemStatus | null
}

function emptyDb(): MswDb {
  return {
    comments: [],
    answers: [],
    commentReports: [],
    answerReports: [],
    users: [],
    warnings: {},
    auditLogs: [],
    auditMeta: null,
    bugReports: [],
    gitlabEnabled: false,
    systemStatus: null,
  }
}

export const db: MswDb = emptyDb()

/**
 * Puts a test's starting state into the store.
 *
 * Copies what it is given, so a test that mutates its own fixture afterwards does not reach
 * into the store — the aliasing bug this codebase already had once, in
 * `createProfessorEditDraft`.
 *
 * @param seed the collections this test needs; anything omitted stays empty
 */
export function seedDb(seed: Partial<MswDb>): void {
  resetDb()
  for (const [key, value] of Object.entries(seed)) {
    if (typeof value === 'boolean') {
      ;(db as unknown as Record<string, unknown>)[key] = value
    } else if (Array.isArray(value)) {
      ;(db as unknown as Record<string, unknown>)[key] = value.map((item) => ({ ...item }))
    } else if (value) {
      ;(db as unknown as Record<string, unknown>)[key] = structuredClone(value)
    }
  }
}

/** Empties the store. Called between tests so one cannot leave state for the next. */
export function resetDb(): void {
  Object.assign(db, emptyDb())
}
