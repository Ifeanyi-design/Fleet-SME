/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Flask REST API (default: /api via the dev proxy). */
  readonly VITE_API_URL?: string;
  /** Set to "false" to hit the real API instead of the seed-backed mock. */
  readonly VITE_USE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
