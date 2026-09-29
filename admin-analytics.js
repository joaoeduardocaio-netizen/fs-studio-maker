(() => {
  if (!window.supabase || !window.FS_SUPABASE) return;

  const cfg = window.FS_SUPABASE;
  const analyticsDb = window.supabase.createClient(cfg.url, cfg.publishableKey);
  const q = id => document.getElementById(id);
  const format = new Intl.NumberFormat("pt-BR");

  function safe(value) {
    const span = document.createElement("span");
    span.textContent = String(value ?? "");
    return span.innerHTML;
  }

  function labelPath(path) {
    if (path === "/" || path.endsWith("/index.html")) return "Página inicial";
    if (path.endsWith("/catalogo.html")) return "Catálogo";
    return path;
  }

  function ensurePanel() {
    if (q("analytics-panel")) return;
    const adminView = q("admin-view");
    const adminTop = adminView?.querySelector(".admin-top");
    if (!adminView || !adminTop) return;

    const panel = document.createElement("section");
    panel.id = "analytics-panel";
    panel.className = "analytics-panel";
    panel.setAttribute("aria-labelledby", "analytics-title");
    panel.innerHTML = `
      <div class="analytics-heading">
        <div>
          <span class="eyebrow">Desempenho do site</span>
          <h2 id="analytics-title">Visitas do site</h2>
          <p>Acompanhe os acessos da página inicial e do catálogo. <span id="analytics-status" class="analytics-status"></span></p>
        </div>
        <button id="refresh-analytics" type="button" class="text-button">Atualizar</button>
      </div>
      <div class="analytics-grid">
        <article class="analytics-card"><span>Hoje</span><strong id="analytics-today">—</strong><small>visitantes únicos</small></article>
        <article class="analytics-card"><span>Este mês</span><strong id="analytics-month">—</strong><small>visitantes únicos</small></article>
        <article class="analytics-card"><span>Visualizações no mês</span><strong id="analytics-month-views">—</strong><small>páginas abertas</small></article>
        <article class="analytics-card"><span>Total acumulado</span><strong id="analytics-total">—</strong><small>visitantes únicos</small></article>
      </div>
      <div class="analytics-details">
        <div><h3>Últimos 14 dias</h3><div id="analytics-bars" class="analytics-bars"><p class="analytics-empty">Carregando…</p></div></div>
        <div><h3>Páginas mais acessadas no mês</h3><div id="analytics-pages" class="analytics-pages"><p class="analytics-empty">Carregando…</p></div></div>
      </div>
      <p class="analytics-note">Visitantes únicos são uma estimativa por navegador/dispositivo. O sistema não salva nome, e-mail, IP ou localização do visitante.</p>`;

    adminTop.insertAdjacentElement("afterend", panel);
    q("refresh-analytics")?.addEventListener("click", loadAnalytics);
  }

  function renderDaily(rows) {
    const box = q("analytics-bars");
    if (!box) return;
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) {
      box.innerHTML = '<p class="analytics-empty">Ainda não há dados.</p>';
      return;
    }

    const max = Math.max(1, ...list.map(item => Number(item.visitors) || 0));
    box.innerHTML = list.map(item => {
      const visitors = Number(item.visitors) || 0;
      const views = Number(item.views) || 0;
      const height = visitors ? Math.max(10, Math.round((visitors / max) * 100)) : 4;
      const date = new Date(String(item.date) + "T12:00:00");
      const day = Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const title = safe(`${day}: ${visitors} visitantes · ${views} visualizações`);
      return `<div class="analytics-day" title="${title}"><div class="analytics-bar-track"><span style="height:${height}%"></span></div><b>${safe(day)}</b><small>${format.format(visitors)}</small></div>`;
    }).join("");
  }

  function renderPages(rows) {
    const box = q("analytics-pages");
    if (!box) return;
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) {
      box.innerHTML = '<p class="analytics-empty">Ainda não há páginas registradas neste mês.</p>';
      return;
    }

    box.innerHTML = list.map(item =>
      `<div class="analytics-page"><span>${safe(labelPath(String(item.path || "/")))}</span><b>${format.format(Number(item.views) || 0)} <small>visualizações</small></b></div>`
    ).join("");
  }

  async function loadAnalytics() {
    ensurePanel();
    const button = q("refresh-analytics");
    const status = q("analytics-status");
    if (!q("analytics-panel")) return;

    if (button) {
      button.disabled = true;
      button.textContent = "Atualizando…";
    }
    if (status) {
      status.textContent = "";
      status.className = "analytics-status";
    }

    try {
      const { data: { session } } = await analyticsDb.auth.getSession();
      if (!session) return;

      const { data, error } = await analyticsDb.rpc("get_site_analytics", { p_timezone: "Europe/Rome" });
      if (error) throw error;

      q("analytics-today").textContent = format.format(Number(data?.today_unique) || 0);
      q("analytics-month").textContent = format.format(Number(data?.month_unique) || 0);
      q("analytics-month-views").textContent = format.format(Number(data?.month_views) || 0);
      q("analytics-total").textContent = format.format(Number(data?.total_unique) || 0);
      renderDaily(data?.daily);
      renderPages(data?.top_pages);
      if (status) status.textContent = "Atualizado agora";
    } catch (error) {
      console.error(error);
      if (status) {
        status.textContent = "Não foi possível carregar as estatísticas.";
        status.className = "analytics-status error";
      }
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Atualizar";
      }
    }
  }

  ensurePanel();
  analyticsDb.auth.onAuthStateChange((_event, session) => {
    if (session) setTimeout(loadAnalytics, 0);
  });
  loadAnalytics();
})();
