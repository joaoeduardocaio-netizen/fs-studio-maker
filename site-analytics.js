(() => {
  if (!window.supabase || !window.FS_SUPABASE) return;
  if (navigator.globalPrivacyControl === true || navigator.doNotTrack === "1") return;

  const key = "fs-anonymous-visitor";
  let visitorId = "";

  try {
    visitorId = localStorage.getItem(key) || "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) {
      visitorId = crypto.randomUUID();
      localStorage.setItem(key, visitorId);
    }
  } catch {
    visitorId = crypto.randomUUID();
  }

  const path = (location.pathname || "/").slice(0, 160);
  if (path.startsWith("/admin") || path.startsWith("/ajustador-etiquetas")) return;

  const cfg = window.FS_SUPABASE;
  const analyticsDb = window.supabase.createClient(cfg.url, cfg.publishableKey);

  analyticsDb
    .from("page_views")
    .insert({ visitor_id: visitorId, path })
    .then(({ error }) => {
      if (error) console.debug("Analytics indisponível.");
    })
    .catch(() => {});
})();
