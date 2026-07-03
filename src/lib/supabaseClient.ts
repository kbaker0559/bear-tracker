// Bear Tracker Supabase client placeholder.
// Install @supabase/supabase-js before enabling live mode.

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export const getSupabaseConfig = (): SupabaseConfig | null => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  return { url, anonKey };
};
