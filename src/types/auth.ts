/**
 * 경량 인증 — 백엔드가 환경변수의 고정 ID/PW만 대조한다.
 * JWT/refresh token 없음: 성공 여부(+ 선택적 정적 토큰)만 주고받는다.
 */
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  /** 백엔드가 요청 검증용 정적 토큰을 발급하는 경우에만 존재 */
  token?: string
  message?: string
}
