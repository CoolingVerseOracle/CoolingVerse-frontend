/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 백엔드 API 서버 주소 (미설정 시 동일 오리진 상대 경로) */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
