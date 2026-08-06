import { readonly, ref } from 'vue'

export type ToastTone = 'success' | 'error'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

/** 토스트 자동 소멸까지의 표시 시간(ms) */
export const TOAST_DURATION_MS = 4000

// 모듈 레벨 단일 상태 — 어디서 show()를 불러도 AppToast 호스트 하나가 그린다
const toasts = ref<Toast[]>([])
let seq = 0

function dismiss(id: number): void {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

function show(message: string, tone: ToastTone = 'success'): void {
  const id = ++seq
  toasts.value = [...toasts.value, { id, message, tone }]
  setTimeout(() => dismiss(id), TOAST_DURATION_MS)
}

/** 전역 토스트 알림 — window.alert 대체용 비차단 피드백 */
export function useToast() {
  return { toasts: readonly(toasts), show, dismiss }
}
