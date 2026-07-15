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
    throw new HttpError(res.status, `요청 실패 (${res.status}): ${path}`)
  }
  return res.json() as Promise<T>
}
