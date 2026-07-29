/**
 * fetch 기반 경량 HTTP 래퍼.
 * - baseURL: VITE_API_BASE_URL
 * - 인증: 백엔드가 로그인 응답으로 정적 토큰을 준 경우에만 헤더에 실어 보낸다.
 *   (JWT/refresh/재시도 인터셉터 없음 — 경량 인증 정책)
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

let staticToken: string | null = null

export function setAuthToken(token: string | null): void {
  staticToken = token
}

// 401 공통 처리 — 모든 요청이 지나는 이 계층에서 한 번만 처리한다.
// (스토어를 직접 import하면 http → store 순환 참조가 생기므로 콜백 등록 방식)
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (staticToken) headers.set('Authorization', `Bearer ${staticToken}`)

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  if (!res.ok) {
    // 토큰 무효(서버 재시작 포함) — 세션을 정리하고 로그인 화면으로 보낸다
    if (res.status === 401) onUnauthorized?.()
    throw new HttpError(res.status, `요청 실패 (${res.status}): ${path}`)
  }
  // DELETE 등 body 없는 응답(204)은 json 파싱을 건너뛴다
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
