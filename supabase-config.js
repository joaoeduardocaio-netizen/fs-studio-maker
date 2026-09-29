window.FS_SUPABASE = Object.freeze({
  url: "https://jdwvulfnscdhvemidrof.supabase.co",
  publishableKey: "sb_publishable_e0b3UIp_U4p8GI4Z-fLVUA_ogaWdS03",
  adminEmail: "fs.studiomaker@gmail.com",
  whatsapp: "393287036017"
});

// Carrega as estatísticas sem precisar alterar as páginas atuais do site.
document.addEventListener("DOMContentLoaded", () => {
  const path = (location.pathname || "/").toLowerCase();

  if (path.endsWith("/admin.html") || path.endsWith("/admin")) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "admin-analytics.css?v=1";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = "admin-analytics.js?v=1";
    document.body.appendChild(script);
    return;
  }

  if (path.endsWith("/ajustador-etiquetas.html") || path.endsWith("/ajustador-etiquetas")) return;

  const script = document.createElement("script");
  script.src = "site-analytics.js?v=1";
  document.body.appendChild(script);
});
