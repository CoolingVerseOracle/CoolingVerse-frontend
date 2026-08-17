import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchSimulationResult, runSimulation } from '@/api/simulation'
import { DEFAULT_PARTICIPATION_RATE } from '@/constants/simulation'
import type { SimulationResult, SimulationSettings } from '@/types/simulation'
import { isActiveRegion } from '@/constants/regions'

/** 비활성 지역 시나리오 실행 시도 — 호출부는 메시지 문자열이 아닌 instanceof로 분기한다 */
export class InactiveRegionError extends Error {
  constructor(region: string | null | undefined) {
    super(`비활성 지역 시나리오는 실행할 수 없습니다: ${region}`)
    this.name = 'InactiveRegionError'
  }
}

/** 대시보드 — 시나리오 설정 폼 + 시뮬레이션 결과(KPI/차트) */
export const useSimulationStore = defineStore('simulation', () => {
  const settings = reactive<SimulationSettings>({
    openToPublic: true,
    // 시뮬레이션 대상이 미개방(입주민 전용) 단지라 false면 기대효과가 전부 0이 된다.
    // v2.1에서 개방 대상 체크박스가 제거되어 1차 범위에서는 true 고정 (PR #28 백엔드 리뷰)
    residentsOnly: true,
    participationRate: DEFAULT_PARTICIPATION_RATE,
    openFrom: '09:00',
    openTo: '18:00',
    commercialRadiusM: 500,
    region: 'pangyo',
    month: 10,
  })

  const result = ref<SimulationResult | null>(null)
  const loading = ref(false)
  const running = ref(false)
  /** 마지막 실행에 반영된 참여율 — 슬라이더 값과 구분해 "현재 n%" 표기에 사용 (실행 전 null) */
  const appliedRate = ref<number | null>(null)

  async function loadInitial(): Promise<void> {
    if (result.value || loading.value) return
    loading.value = true
    try {
      result.value = await fetchSimulationResult(settings.region ?? 'pangyo', settings.month ?? 10)
    } finally {
      loading.value = false
    }
  }

  async function run(): Promise<void> {
    running.value = true
    try {
      result.value = await runSimulation({ ...settings })
      appliedRate.value = settings.participationRate
    } finally {
      running.value = false
    }
  }

  /**
   * 저장된 시나리오 "열기" — 설정을 복원하고 결과를 재계산한다.
   * 완료 후 result가 채워지므로 대시보드 진입 시 loadInitial()은 건너뛰어진다.
   */
  async function applyScenario(saved: SimulationSettings): Promise<void> {
    if (!isActiveRegion(saved.region ?? 'pangyo')) {
      throw new InactiveRegionError(saved.region)
    }
    // 지역이 없는 구버전 저장분은 판교로 정규화한다.
    // 월은 10월로 강제 — 선택지가 10월로 고정된 임시 조치(이슈 #42) 동안 다른 월로
    // 저장된 시나리오를 복원하면 UI에서 되돌릴 수 없는 상태가 되므로 함께 고정한다.
    // 개방 대상 2종은 v2.1에 조작 UI가 없어 true 고정 — false로 저장된 구버전 스냅샷을
    // 복원하면 기대효과가 전부 0이 되는 문제(PR #28 리뷰)가 되살아나므로 함께 고정한다
    Object.assign(settings, saved, {
      region: saved.region ?? 'pangyo',
      month: 10,
      openToPublic: true,
      residentsOnly: true,
    })
    await run()
  }

  return { settings, result, loading, running, appliedRate, loadInitial, run, applyScenario }
})
