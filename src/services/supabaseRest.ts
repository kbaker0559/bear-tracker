export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export type ConnectionResult = {
  ok: boolean;
  message: string;
};

function cleanUrl(url: string): string {
  return url.replace(/\/$/, '');
}

export async function testSupabaseConnection(config: SupabaseConfig): Promise<ConnectionResult> {
  if (!config.url || !config.anonKey) {
    return { ok: false, message: 'Missing Supabase URL or anon key.' };
  }

  try {
    const response = await fetch(`${cleanUrl(config.url)}/rest/v1/players?select=id&limit=1`, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`
      }
    });

    if (!response.ok) {
      return { ok: false, message: `Supabase replied ${response.status}: ${response.statusText}` };
    }

    return { ok: true, message: 'Connected to Supabase players table.' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Unknown connection error.' };
  }
}

export async function pushPlayers(config: SupabaseConfig, players: Array<{ id: string; name: string; handicap: number; quota: number; pin: string; active: boolean }>): Promise<ConnectionResult> {
  if (!config.url || !config.anonKey) {
    return { ok: false, message: 'Missing Supabase URL or anon key.' };
  }

  const response = await fetch(`${cleanUrl(config.url)}/rest/v1/players`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify(players.map((p) => ({
      id: p.id,
      name: p.name,
      handicap: p.handicap,
      quota: p.quota,
      pin: p.pin,
      active: p.active
    })))
  });

  if (!response.ok) {
    return { ok: false, message: `Player sync failed ${response.status}: ${response.statusText}` };
  }

  return { ok: true, message: `Pushed ${players.length} players to Supabase.` };
}
