const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

function corsHeaders(res) {
  return {
    'Access-Control-Allow-Origin': res.req.headers.origin ?? '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type,Accept,Origin,X-Requested-With',
    Vary: 'Origin',
  }
}

export function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...corsHeaders(res) })
  res.end(JSON.stringify(body))
}

export function sendNoContent(res) {
  res.writeHead(204, corsHeaders(res))
  res.end()
}

export async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf8')
  return text ? JSON.parse(text) : {}
}

export function getPathParts(url) {
  return url.pathname.split('/').filter(Boolean)
}

export function iso(value) {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}
