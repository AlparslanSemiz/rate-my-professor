import { activityActor, recordActivity, requestContext } from '../activity.mjs'
import { adminActor, insertAuditLog } from '../audit.mjs'
import {
  authenticatedUser,
  ensureUserForEmail,
  issueTokenForUser,
  normalizeEmail,
  requireAdmin,
  revokeAdminToken,
} from '../auth-session.mjs'
import { demoLoginCode } from '../config.mjs'
import { query, withTransaction } from '../db.mjs'
import { readBody, sendJson } from '../http.mjs'

export async function handleAuth(req, res, parts) {
  const action = parts[1]

  if (req.method === 'POST' && action === 'request-login') {
    return requestLoginCode(req, res)
  }
  if (req.method === 'POST' && action === 'login') {
    return login(req, res)
  }
  if (req.method === 'POST' && action === 'logout') {
    return logout(req, res)
  }
  if (req.method === 'GET' && action === 'me') {
    return getCurrentUser(req, res)
  }
  return sendJson(res, 404, { message: 'Not found', success: false })
}

async function requestLoginCode(req, res) {
  const body = await readBody(req)
  const email = normalizeEmail(body.email)
  if (!email) {
    return sendJson(res, 400, { message: 'Error, Email is required', success: false })
  }
  if (!email.endsWith('@student.kit.edu')) {
    return sendJson(res, 400, {
      message: "Email must end with '@student.kit.edu'",
      success: false,
    })
  }

  await query(
    `
      INSERT INTO mock_login_codes (email, code, expires_at)
      VALUES ($1, $2, now() + interval '1 day')
      ON CONFLICT (email)
      DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at
    `,
    [email, demoLoginCode],
  )
  await recordActivity({
    type: 'LOGIN_CODE_REQUESTED',
    context: requestContext(req),
    metadata: { email },
  })
  return sendJson(res, 200, {
    message: `Demo login code is ${demoLoginCode}`,
    success: true,
  })
}

async function login(req, res) {
  const body = await readBody(req)
  const email = normalizeEmail(body.email)
  const loginToken = String(body.loginToken ?? '').trim()
  if (!email) {
    return sendJson(res, 400, {
      message: 'Error, Email is required',
      success: false,
      authToken: null,
    })
  }
  if (!loginToken) {
    return sendJson(res, 400, {
      message: 'Error, login token is required',
      success: false,
      authToken: null,
    })
  }

  const code = await query(
    'SELECT * FROM mock_login_codes WHERE email = $1 AND code = $2 AND expires_at > now()',
    [email, loginToken],
  )
  if (!code.rows[0] && loginToken !== demoLoginCode) {
    await recordActivity({
      type: 'USER_LOGIN_FAILED',
      context: requestContext(req),
      metadata: { email },
      outcome: 'FAILURE',
    })
    return sendJson(res, 200, { message: 'Invalid token', success: false, authToken: null })
  }

  const { authToken, user } = await withTransaction(async (client) => {
    const authenticated = await ensureUserForEmail(email, client)
    const issuedToken = await issueTokenForUser(authenticated, client)
    if (authenticated.role === 'ADMIN') {
      await recordAdminLogin(authenticated, client)
    }
    return { authToken: issuedToken, user: authenticated }
  })
  await recordActivity({
    type: 'USER_LOGIN',
    actor: activityActor(user),
    target: { type: 'SESSION', id: user.id, label: `${user.username} session` },
    context: requestContext(req),
    metadata: { method: 'EMAIL_OTP' },
  })
  return sendJson(res, 200, { message: 'Login successful', success: true, authToken })
}

async function recordAdminLogin(admin, client) {
  await insertAuditLog(client, {
    actor: adminActor(admin),
    action: 'ADMIN_LOGIN',
    target: {
      type: 'ADMIN_SESSION',
      id: admin.id,
      label: `${admin.username} admin session`,
    },
    changes: {
      authenticated: { before: false, after: true },
    },
    metadata: {
      method: 'EMAIL_OTP',
    },
  })
}

async function logout(req, res) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const token = req.headers.authorization.slice('Bearer '.length)
  await withTransaction((client) => revokeAdminToken(token, admin, client))
  await recordActivity({
    type: 'USER_LOGOUT',
    actor: activityActor(admin),
    target: { type: 'SESSION', id: admin.id, label: `${admin.username} session` },
    context: requestContext(req),
  })
  return sendJson(res, 200, { message: 'Logged out successfully', success: true })
}

async function getCurrentUser(req, res) {
  const user = await authenticatedUser(req)
  if (!user) {
    return sendJson(res, 200, { message: 'Not logged in', success: false })
  }
  return sendJson(res, 200, {
    message: `Logged in as: ${user.kit_email}`,
    success: true,
  })
}
