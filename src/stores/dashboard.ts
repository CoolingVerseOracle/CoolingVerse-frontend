import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { fetchGridRisk } from '@/api/geo'
import { useSimulationStore } from '@/stores/simulation'
import type { GridRiskResponse } from '@/types/geo'

/**
 * 대시보드 조회 전용 상태 — 시간대·레이어 토글·격자 위험지수.
 * 시나리오 저장 대상이 아니다(피그마 "조회 조건 · 저장 제외").
 * 저장 대상(참여율·지역·월)은 simulation 스토어의 settings가 소유한다.
 */
export const useDashboardStore = defineStore('dashboard', () => {
  const selectedHour = ref(13)
  // 레이어는 기본 표시 — 끄는 것은 사용자가 수동으로
  const heatmapOn = ref(true)
  const clusterOn = ref(true)

  // 응답은 통째로 교체만 하므로 깊은 반응형이 불필요 — 1,306개 격자의 프록시 래핑을 피한다
  const gridRisk = shallowRef<GridRiskResponse | null>(null)
  const gridLoading = ref(false)
  const gridIsFallback = ref(false)
  /** 현재 gridRisk 응답을 만든 참여율 스냅샷 — 실행 전 조회면 null */
  const gridAppliedRate = ref<number | null>(null)

  const globalRisk = computed(() => gridRisk.value?.globalRisk ?? null)
  /** 참여율 적용 후 평균 위험지수 — 참여율 없이 조회한 응답(실행 전)에는 표시하지 않는다 */
  const globalRiskProjected = computed(() =>
    gridAppliedRate.value == null ? null : (gridRisk.value?.globalRiskProjected ?? null),
  )
  const breakdown = computed(() => gridRisk.value?.breakdown ?? null)
  const riskStateLabel = computed(() => {
    const risk = globalRisk.value
    if (risk == null) return ''
    if (risk >= 65) return '주의 · 시나리오 적용 시 감소 예상'
    if (risk >= 40) return '보통 · 시나리오 적용 시 완화'
    return '원활 · 낮은 위험 수준'
  })

  // 스크러버 드래그 연타 대응: 디바운스 + 최신 요청만 반영(늦게 도착한 응답 무시)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let requestSeq = 0

  async function loadGridRisk(): Promise<void> {
    // 대기 중인 디바운스 조회가 있으면 이 즉시 조회로 대체 — 같은 파라미터 이중 요청 방지
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    const simulation = useSimulationStore()
    const seq = ++requestSeq
    // 마지막 실행에 반영된 참여율 — projected 계산 입력 (실행 전이면 생략)
    const participationRate = simulation.appliedRate
    gridLoading.value = true
    try {
      const { data, isFallback } = await fetchGridRisk({
        hour: selectedHour.value,
        region: simulation.settings.region ?? 'pangyo',
        participationRate,
      })
      if (seq !== requestSeq) return
      gridRisk.value = data
      gridIsFallback.value = isFallback
      gridAppliedRate.value = participationRate
    } finally {
      if (seq === requestSeq) gridLoading.value = false
    }
  }

  function loadGridRiskDebounced(delayMs = 300): void {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      void loadGridRisk()
    }, delayMs)
  }

  return {
    selectedHour,
    heatmapOn,
    clusterOn,
    gridRisk,
    gridLoading,
    gridIsFallback,
    globalRisk,
    globalRiskProjected,
    breakdown,
    riskStateLabel,
    loadGridRisk,
    loadGridRiskDebounced,
  }
})
