import type { LoginRequest, LoginResponse } from '@/types/auth'

const MOCK_DELAY_MS = 300

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 로그인 — 목 구현.
 * 실제 연동 시: `http<LoginResponse>('/login', { method: 'POST', body: JSON.stringify(payload) })`
 * (백엔드가 환경변수의 고정 ID/PW를 대조한다. JWT/refresh 없음)
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  await delay(MOCK_DELAY_MS)
  if (payload.username.trim() && payload.password.trim()) {
    return { success: true }
  }
  return { success: false, message: '계정 또는 비밀번호를 확인해 주세요.' }
}
