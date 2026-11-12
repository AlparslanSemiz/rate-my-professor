import { http } from 'msw'
import { apiUrl } from '../apiUrl'
import { db } from '../db'
import { failure, ok } from '../envelope'

/**
 * `/system/status`, which the dashboard and the users table read their counters from.
 *
 * `db.systemStatus` being `null` means the request itself fails. That is a different thing
 * from a reading whose `counts` are null — the first is "we could not ask", the second is
 * "we asked and the database did not answer" — and the panel shows different things for each.
 */
export const systemHandlers = [
  http.get(apiUrl('/system/status'), () =>
    db.systemStatus ? ok({ ...db.systemStatus }) : failure(503, 'Status unavailable'),
  ),
]
