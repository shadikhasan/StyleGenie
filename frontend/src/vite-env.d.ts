/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SYSTEM_DESIGN_URL?: string;
  readonly VITE_FIGMA_FILE_URL?: string;
  readonly VITE_PRODUCT_REQUIREMENTS_URL?: string;
  readonly VITE_PITCH_DECK_URL?: string;
  readonly VITE_STAGING_CLIENT_EMAIL?: string;
  readonly VITE_STAGING_CLIENT_PASSWORD?: string;
  readonly VITE_STAGING_STYLIST_EMAIL?: string;
  readonly VITE_STAGING_STYLIST_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
