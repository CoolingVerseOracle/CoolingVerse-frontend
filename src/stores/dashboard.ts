import { computed, ref } from 'vue'
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

  const gridRisk = ref<GridRiskResponse | null>(null)
  const gridLoading = ref(false)
  const gridIsFallback = ref(false)

  const globalRisk = computed(() => gridRisk.value?.globalRisk ?? null)
  /** 참여율 적용 후 평균 위험지수 — 시뮬레이션 실행 전(appliedRate null)에는 표시하지 않는다 */
  const globalRiskProjected = computed(() => {
    const simulation = useSimulationStore()
    if (simulation.appliedRate == null) return null
    return gridRisk.value?.globalRiskProjected ?? null
  })
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
    const simulation = useSimulationStore()
    const seq = ++requestSeq
    gridLoading.value = true
    try {
      const { data, isFallback } = await fetchGridRisk({
        hour: selectedHour.value,
        region: simulation.settings.region ?? 'pangyo',
        // 마지막 실행에 반영된 참여율 — projected 계산 입력 (실행 전이면 생략)
        participationRate: simulation.appliedRate,
      })
      if (seq !== requestSeq) return
      gridRisk.value = data
      gridIsFallback.value = isFallback
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
