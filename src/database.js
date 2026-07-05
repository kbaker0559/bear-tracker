// Bear Tracker database adapter v1.1
// This file documents the browser database API used by index.html.

export async function testConnection(client) {
  const { data, error } = await client.from('players').select('id').limit(1)
  if (error) throw error
  return data
}

export async function loadPlayers(client) {
  const { data, error } = await client
    .from('players')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function upsertPlayers(client, players) {
  const rows = players.map((p) => ({
    id: p.id,
    name: p.name,
    handicap: p.handicap,
    quota: p.quota,
    pin: p.pin,
    active: p.active,
    is_admin: Boolean(p.isAdmin),
    updated_at: new Date().toISOString(),
  }))
  const { data, error } = await client.from('players').upsert(rows).select('*')
  if (error) throw error
  return data
}
