// FS Studio Maker — carregador do sistema de avaliações.
// Este arquivo NÃO substitui o supabase-config.js atual.
// Ele apenas usa a configuração já existente em window.FS_SUPABASE.

document.addEventListener("DOMContentLoaded", () => {
  const path = (location.pathname || "/").toLowerCase();

  const addCss = (href) => {
    if (document.querySelector(`link[href^="${href.split('?')[0]}"]`)) return;
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = href;
    document.head.appendChild(css);
  };

  const addScript = (src) => {
    if (document.querySelector(`script[src^="${src.split('?')[0]}"]`)) return;
    const script = document.createElement("script");
    script.src = src;
    document.body.appendChild(script);
  };

  if (path.endsWith("/admin.html") || path.endsWith("/admin")) {
    addCss("admin-reviews.css?v=2");
    addScript("admin-reviews.js?v=2");
    return;
  }

  if (path.endsWith("/ajustador-etiquetas.html") || path.endsWith("/ajustador-etiquetas")) return;

  if (path.endsWith("/catalogo.html") || path.endsWith("/catalogo")) {
    addCss("catalog-ratings.css?v=2");
    addScript("catalog-ratings.js?v=3");
    return;
  }

  if (path === "/" || path.endsWith("/index.html") || path.endsWith("/index")) {
    addCss("reviews.css?v=2");
    addScript("reviews.js?v=2");
  }
});
