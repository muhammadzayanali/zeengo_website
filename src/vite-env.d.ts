/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL_LOCAL: string
  readonly VITE_API_BASE_URL_PRODUCTION: string
  readonly VITE_WHATSAPP_PHONE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
