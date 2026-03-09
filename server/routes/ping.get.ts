export default defineEventHandler(async (event) => {
  const { cloudflare } = event.context
  const DB = cloudflare?.env?.DB as D1Database | undefined

  const headers = getRequestHeaders(event)
  const timestamp = new Date().toISOString()

  const record = {
    ip: headers['cf-connecting-ip'] ?? headers['x-forwarded-for'] ?? 'unknown',
    country: headers['cf-ipcountry'] ?? 'unknown',
    user_agent: headers['user-agent'] ?? 'unknown',
    ray_id: headers['cf-ray'] ?? 'unknown',
    timestamp,
  }

  if (DB) {
    await DB.prepare(`
      INSERT INTO healthcheck (ip, country, user_agent, ray_id, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).bind(record.ip, record.country, record.user_agent, record.ray_id, record.timestamp).run()
  }

  const total = DB
    ? (await DB.prepare('SELECT COUNT(*) as count FROM healthcheck').first<{ count: number }>())?.count ?? 0
    : null

  return {
    message: 'pong',
    timestamp,
    request: record,
    ...(total !== null ? { total_pings: total } : {}),
  }
})
