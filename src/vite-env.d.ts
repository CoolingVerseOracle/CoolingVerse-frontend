/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 백엔드 API 서버 주소 (미설정 시 동일 오리진 상대 경로) */
  readonly VITE_API_BASE_URL?: string
  /** 네이버 지도(NCP Maps) 클라이언트 키 — 미설정 시 지도 플레이스홀더로 동작 */
  readonly VITE_NAVER_MAP_CLIENT_ID?: string
  /** 'true'면 grid-risk API 대신 개발용 폴백 격자 데이터를 사용 */
  readonly VITE_USE_GRID_FALLBACK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
