import { http } from 'msw'
import type { User, Warning } from '@/api/users'
import { apiUrl } from '../apiUrl'
import { db } from '../db'
import { CURSOR_WITHOUT_LIMIT_MESSAGE, failure, ok, paginate } from '../envelope'

/**
 * `/users`, including the filtering and paging the listing actually depends on.
 *
 * The filters are applied rather than acknowledged. A handler that ignored `q` would let a
 * test assert that typing a search narrowed the table while the narrowing was really the
 * fixture being small — which proves nothing about the request the screen sent.
 */

const NO_SUCH_USER = 'No such user'
const INVALID_STATUS = 'Invalid user status'

const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED']

function joinedAt(user: User): number {
  return new Date(user.joined).getTime()
}

function matches(user: User, url: URL): boolean {
  const query = url.searchParams.get('q')?.trim().toLowerCase()
  const status = url.searchParams.get('status')
  const role = url.searchParams.get('role')

  if (query && !`${user.username} ${user.kitEmail}`.toLowerCase().includes(query)) return false
  if (status && user.status !== status) return false
  if (role && user.role !== role) return false
  return true
}

function withEnvelope(user: User) {
  return { success: true, message: 'Success', ...user }
}

/**
 * A warning as the backend puts it on the wire, with the issuer nested under `createdFrom`.
 *
 * The store holds the flattened shape a screen reads, because that is what a test wants to
 * write; the handler puts it back the way it arrives, so `toWarning` runs for real. Serving
 * the flattened shape directly would skip the mapper entirely and let a rename in
 * `createdFrom` pass every test — the same class of gap as `F-002`.
 */
function toWireWarning(warning: Warning) {
  return {
    id: warning.id,
    userID: warning.userID,
    message: warning.message,
    createdAt: warning.createdAt,
    createdFrom: {
      id: warning.issuedBy,
      name: warning.issuedByName,
      createdAt: warning.createdAt,
    },
  }
}

export const usersHandlers = [
  http.get(apiUrl('/users'), ({ request }) => {
    const url = new URL(request.url)

    const status = url.searchParams.get('status')
    // Deleted accounts are anonymised and excluded from the listing entirely, so asking for
    // them is a refusal rather than an empty page.
    if (status && !VALID_STATUSES.includes(status)) return failure(400, INVALID_STATUS)

    const filtered = db.users.filter((user) => matches(user, url))
    const sorted = [...filtered].sort((left, right) =>
      url.searchParams.get('sort') === 'oldest'
        ? joinedAt(left) - joinedAt(right)
        : joinedAt(right) - joinedAt(left),
    )

    const page = paginate(sorted, url, (user) => user.id)
    if (!page) return failure(400, CURSOR_WITHOUT_LIMIT_MESSAGE)

    return ok({ users: page.items, nextCursor: page.nextCursor })
  }),

  http.get(apiUrl('/users/:id'), ({ params }) => {
    const user = db.users.find((candidate) => candidate.id === params.id)
    return user ? ok(withEnvelope(user)) : failure(404, NO_SUCH_USER)
  }),

  http.patch(apiUrl('/users/:id'), async ({ params, request }) => {
    const user = db.users.find((candidate) => candidate.id === params.id)
    if (!user) return failure(404, NO_SUCH_USER)

    const update = (await request.json()) as Partial<User>
    Object.assign(user, update)
    return ok({}, 'Updated')
  }),

  http.delete(apiUrl('/users/:id'), ({ params }) => {
    const index = db.users.findIndex((candidate) => candidate.id === params.id)
    if (index === -1) return failure(404, NO_SUCH_USER)
    db.users.splice(index, 1)
    return ok({}, 'Deleted')
  }),

  http.patch(apiUrl('/users/:id/block'), ({ params }) => {
    const user = db.users.find((candidate) => candidate.id === params.id)
    if (!user) return failure(404, NO_SUCH_USER)
    user.status = 'BLOCKED'
    return ok({}, 'Blocked')
  }),

  http.patch(apiUrl('/users/:id/unblock'), ({ params }) => {
    const user = db.users.find((candidate) => candidate.id === params.id)
    if (!user) return failure(404, NO_SUCH_USER)
    user.status = 'ACTIVE'
    return ok({}, 'Unblocked')
  }),

  http.get(apiUrl('/users/:id/warnings'), ({ params }) =>
    ok({ warnings: (db.warnings[String(params.id)] ?? []).map(toWireWarning) }),
  ),

  http.post(apiUrl('/users/:id/warnings'), async ({ params, request }) => {
    const id = String(params.id)
    const user = db.users.find((candidate) => candidate.id === id)
    if (!user) return failure(404, NO_SUCH_USER)

    const { message } = (await request.json()) as { message: string }
    const warnings = (db.warnings[id] ??= [])
    warnings.unshift({
      id: `warning-${warnings.length + 1}`,
      userID: id,
      message,
      createdAt: new Date(0).toISOString(),
      issuedBy: 'admin-1',
      issuedByName: 'Admin User',
    })
    user.warnings = warnings.length
    return ok({}, 'Warned')
  }),

  http.patch(apiUrl('/users/:id/warnings/:warningId'), async ({ params, request }) => {
    const warning = db.warnings[String(params.id)]?.find((item) => item.id === params.warningId)
    if (!warning) return failure(404, 'No such warning')

    const { message } = (await request.json()) as { message: string }
    warning.message = message
    return ok({}, 'Updated')
  }),

  http.delete(apiUrl('/users/:id/warnings/:warningId'), ({ params }) => {
    const id = String(params.id)
    const warnings = db.warnings[id] ?? []
    const index = warnings.findIndex((item) => item.id === params.warningId)
    if (index === -1) return failure(404, 'No such warning')
    warnings.splice(index, 1)

    const user = db.users.find((candidate) => candidate.id === id)
    if (user) user.warnings = warnings.length
    return ok({}, 'Withdrawn')
  }),
]
