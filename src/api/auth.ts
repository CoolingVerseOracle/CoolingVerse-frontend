import type { LoginRequest, LoginResponse } from '@/types/auth'
import { http } from './http'

/**
 * 로그인 — 백엔드가 환경변수의 고정 ID/PW를 대조한다. JWT/refresh 없음.
 * 실패도 HTTP 200 + `{ success: false, message }` 로 오므로 본문의 success로 판단한다.
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  return http<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
