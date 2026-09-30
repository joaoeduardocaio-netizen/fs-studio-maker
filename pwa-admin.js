(() => {
  let deferredPrompt = null;
  const buttons = () => [
    document.getElementById("install-app"),
    document.getElementById("install-app-login")
  ].filter(Boolean);
  const loginWrap = () => document.getElementById("install-app-login-wrap");

  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  const isIOS = () =>
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !window.MSStream;

  function showInstallUI() {
    if (isStandalone()) return;
    buttons().forEach(btn => btn.hidden = false);
    const wrap = loginWrap();
    if (wrap) wrap.hidden = false;
  }

  function hideInstallUI() {
    buttons().forEach(btn => btn.hidden = true);
    const wrap = loginWrap();
    if (wrap) wrap.hidden = true;
  }

  function showIOSInstructions() {
    const msg = [
      "Para instalar no iPhone/iPad:",
      "",
      "1. Toque no botão Compartilhar do Safari.",
      "2. Escolha “Adicionar à Tela de Início”.",
      "3. Confirme em “Adicionar”.",
      "",
      "Depois o ícone FS Admin ficará junto dos seus aplicativos."
    ].join("\n");
    alert(msg);
  }

  async function installApp() {
    if (isStandalone()) {
      hideInstallUI();
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === "accepted") hideInstallUI();
      } catch (_) {}
      deferredPrompt = null;
      return;
    }

    if (isIOS()) {
      showIOSInstructions();
      return;
    }

    alert("Se o botão de instalação do navegador ainda não apareceu, atualize esta página uma vez. No Chrome ou Edge, você também pode usar o menu do navegador e escolher “Instalar FS Studio Maker Admin”.");
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    showInstallUI();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    hideInstallUI();
  });

  document.addEventListener("DOMContentLoaded", () => {
    buttons().forEach(btn => btn.addEventListener("click", installApp));

    if (isStandalone()) {
      hideInstallUI();
      document.documentElement.classList.add("pwa-installed");
    } else if (isIOS()) {
      showInstallUI();
    }

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw-admin.js", { scope: "./" })
          .catch(error => console.warn("Não foi possível registrar o app FS Studio Maker:", error));
      });
    }
  });
})();