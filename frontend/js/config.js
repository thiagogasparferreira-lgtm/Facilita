/* ==========================================================================
   FACILITA - CONFIG GLOBAL
   Módulo centralizado para URL base da API e utilitários compartilhados.
   Inclua este arquivo ANTES de auth.js, dashboard.js e tool.js.
   ========================================================================== */

const FACILITA_CONFIG = {
  // URL base detectada automaticamente: local ou produção
  API_BASE_URL: (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  )
    ? "http://localhost:8000"
    : "https://facilita-api-backend.onrender.com",

  // Domínio de produção real do frontend
  FRONTEND_URL: "https://facilita-alpha.vercel.app",

  // Chave para persistência de sessão no localStorage
  SESSION_KEY: "facilita_user",
};

// Expõe a URL base globalmente para compatibilidade com scripts existentes
// (auth.js, dashboard.js e tool.js ainda a declaram internamente como fallback)
window.FACILITA_API_BASE_URL = FACILITA_CONFIG.API_BASE_URL;
