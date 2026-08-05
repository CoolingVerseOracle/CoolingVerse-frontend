import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchSimulationResult, runSimulation } from '@/api/simulation'
import type { SimulationResult, SimulationSettings } from '@/types/simulation'

/** 대시보드 — 시나리오 설정 폼 + 시뮬레이션 결과(KPI/차트) */
export const useSimulationStore = defineStore('simulation', () => {
  const settings = reactive<SimulationSettings>({
    openToPublic: true,
    residentsOnly: false,
    participationRate: 45,
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
      result.value = await fetchSimulationResult()
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
    // 지역·월이 없는 구버전 저장분은 기본값으로 되돌린다(이전 시나리오 값 잔류 방지)
    Object.assign(settings, { region: 'pangyo', month: 10 }, saved)
    await run()
  }

  return { settings, result, loading, running, appliedRate, loadInitial, run, applyScenario }
})
