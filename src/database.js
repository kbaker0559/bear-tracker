// Bear Tracker database adapter starter.
// This keeps the app logic separate from Supabase so we can switch between
// local test mode and live Saturday mode.

(function () {
  function hasLiveConfig() {
    const cfg = window.BEAR_TRACKER_CONFIG || {};
    return Boolean(cfg.liveModeEnabled && cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  }

  async function createClient() {
    if (!hasLiveConfig()) return null;
    const cfg = window.BEAR_TRACKER_CONFIG;
    return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  }

  window.BearTrackerDatabase = {
    hasLiveConfig,
    createClient,
    async connectionStatus() {
      const client = await createClient();
      if (!client) return { ok: false, mode: "local", message: "Live database not configured." };
      const { error } = await client.from("players").select("id", { count: "exact", head: true });
      if (error) return { ok: false, mode: "live", message: error.message };
      return { ok: true, mode: "live", message: "Connected to Supabase." };
    }
  };
})();
