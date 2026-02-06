/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_ENABLE_MOCK?: string;
  readonly [key: `VITE_MOCK_${string}`]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
