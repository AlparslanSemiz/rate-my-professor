import { adminActor, insertAuditLog } from '../audit.mjs'
import { withTransaction } from '../db.mjs'
import { readBody, sendJson } from '../http.mjs'

const VALID_CONTENT_STATUSES = new Set(['VISIBLE', 'HIDDEN'])
const MAX_CONTENT_LENGTH = 10_000

/**
 * Parses a partial content edit. An omitted field is left alone and at least one has to be
 * supplied, matching the backend's `ContentUpdateRequest`.
 */
export function parseContentUpdate(body) {
  const requested = {}

  if (body.content !== undefined) {
    const content = String(body.content).trim()
    if (!content || content.length > MAX_CONTENT_LENGTH) {
      return { error: 'Invalid content' }
    }
    requested.content = content
  }
  if (body.status !== undefined) {
    const status = String(body.status)
    if (!VALID_CONTENT_STATUSES.has(status)) {
      return { error: 'Invalid content status' }
    }
    requested.status = status
  }
  if (Object.keys(requested).length === 0) {
    return { error: 'No update supplied' }
  }
  return { requested }
}

function buildChanges(row, requested) {
  const changes = {}
  const assignments = []
  const values = []

  for (const [field, nextValue] of Object.entries(requested)) {
    if (row[field] === nextValue) continue
    changes[field] = { before: row[field], after: nextValue }
    values.push(nextValue)
    assignments.push(`${field} = $${values.length}`)
  }
  return { changes, assignments, values }
}

/**
 * Applies an edit to a comment or an answer. Both tables carry the same two editable columns,
 * so the caller only supplies the table, the audit action and how to label the target.
 */
export async function updateContent(req, res, { id, table, action, targetType, label, admin, notFound }) {
  const parsed = parseContentUpdate(await readBody(req))
  if (parsed.error) {
    return sendJson(res, 400, { message: parsed.error, success: false })
  }

  const found = await withTransaction(async (client) => {
    const existing = await client.query(`SELECT * FROM ${table} WHERE id = $1 FOR UPDATE`, [id])
    const row = existing.rows[0]
    if (!row) return false

    const update = buildChanges(row, parsed.requested)
    if (update.assignments.length === 0) return true

    update.values.push(id)
    await client.query(
      `UPDATE ${table} SET ${update.assignments.join(', ')} WHERE id = $${update.values.length}`,
      update.values,
    )
    await insertAuditLog(client, {
      actor: adminActor(admin),
      action,
      target: { type: targetType, id, label: await label(client, row) },
      changes: update.changes,
    })
    return true
  })

  if (!found) return sendJson(res, 404, { message: notFound, success: false })
  return sendJson(res, 200, { message: `Updated ${targetType.toLowerCase()} successfully`, success: true })
}

/** Removes a comment or an answer outright. Hiding it is the `status` edit, not this. */
export async function deleteContent(res, { id, table, action, targetType, label, admin, notFound, metadata }) {
  const found = await withTransaction(async (client) => {
    const existing = await client.query(`SELECT * FROM ${table} WHERE id = $1 FOR UPDATE`, [id])
    const row = existing.rows[0]
    if (!row) return false

    const targetLabel = await label(client, row)
    const extra = metadata ? await metadata(client, row) : {}
    await client.query(`DELETE FROM ${table} WHERE id = $1`, [id])
    await insertAuditLog(client, {
      actor: adminActor(admin),
      action,
      target: { type: targetType, id, label: targetLabel },
      changes: { exists: { before: true, after: false } },
      metadata: extra,
    })
    return true
  })

  if (!found) return sendJson(res, 404, { message: notFound, success: false })
  return sendJson(res, 200, { message: `Deleted ${targetType.toLowerCase()} successfully`, success: true })
}
