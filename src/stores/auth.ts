import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { login as loginApi } from '@/api/auth'
import { setAuthToken } from '@/api/http'

const STORAGE_KEY = 'cv.auth'

interface StoredAuth {
  username: string
  token?: string
}

function readStored(): StoredAuth | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredAuth
  } catch {
    return null
  }
}

/**
 * 경량 인증 스토어 — JWT/refresh token 없음.
 * 로그인 성공 여부만 sessionStorage 플래그로 유지하고, 백엔드가
 * 정적 토큰을 준 경우에만 http 계층에 전달한다.
 */
export const useAuthStore = defineStore('auth', () => {
  const stored = readStored()
  const username = ref<string | null>(stored?.username ?? null)

  if (stored?.token) setAuthToken(stored.token)

  const isAuthenticated = computed(() => username.value !== null)

  async function login(id: string, password: string): Promise<{ ok: boolean; message?: string }> {
    const res = await loginApi({ username: id, password })
    if (!res.success) {
      return { ok: false, message: res.message ?? '로그인에 실패했습니다.' }
    }
    username.value = id
    if (res.token) setAuthToken(res.token)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ username: id, token: res.token }))
    return { ok: true }
  }

  function logout(): void {
    username.value = null
    setAuthToken(null)
    sessionStorage.removeItem(STORAGE_KEY)
  }

  return { username, isAuthenticated, login, logout }
})
