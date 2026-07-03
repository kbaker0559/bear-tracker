// Bear Tracker database wrapper v1.2
// This file is intentionally safe: if Supabase is not configured, the app can keep using local storage.

(function () {
  const cfg = window.BEAR_TRACKER_CONFIG || {};
  const hasConfig = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && cfg.liveSyncEnabled);

  window.BearTrackerDB = {
    isLiveEnabled() {
      return hasConfig && Boolean(window.supabase);
    },

    client() {
      if (!this.isLiveEnabled()) return null;
      return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    },

    async healthCheck() {
      const client = this.client();
      if (!client) return { ok: false, mode: "local", message: "Live sync not configured." };
      const { error } = await client.from("leagues").select("id").limit(1);
      if (error) return { ok: false, mode: "supabase", message: error.message };
      return { ok: true, mode: "supabase", message: "Live database connected." };
    }
  };
})();
