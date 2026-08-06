import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TOAST_DURATION_MS, useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    // 모듈 레벨 상태 정리 — 남은 토스트를 모두 소멸시킨다
    vi.runAllTimers()
    const { toasts, dismiss } = useToast()
    toasts.value.forEach((t) => dismiss(t.id))
    vi.useRealTimers()
  })

  it('show()로 추가된 토스트는 표시 시간이 지나면 자동 소멸한다', () => {
    const { toasts, show } = useToast()
    show('저장되었습니다')
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('저장되었습니다')
    expect(toasts.value[0].tone).toBe('success')

    vi.advanceTimersByTime(TOAST_DURATION_MS)
    expect(toasts.value).toHaveLength(0)
  })

  it('dismiss()는 해당 토스트만 제거한다', () => {
    const { toasts, show, dismiss } = useToast()
    show('첫 번째')
    show('두 번째', 'error')
    expect(toasts.value).toHaveLength(2)

    dismiss(toasts.value[0].id)
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('두 번째')
    expect(toasts.value[0].tone).toBe('error')
  })
})
