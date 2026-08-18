import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchSimulationResult, runSimulation } from '@/api/simulation'
import { DEFAULT_PARTICIPATION_RATE } from '@/constants/simulation'
import type { SimulationResult, SimulationSettings } from '@/types/simulation'
import { isActiveRegion } from '@/constants/regions'
import { HttpError } from '@/api/http'
import type { RegionCode } from '@/types/geo'

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
  /**
   * 마지막 조회·실행 실패 사유. 실패를 조용히 삼키면 이전 지역 결과가 그대로 남아
   * "실행했는데 아무 반응이 없다"로 보이므로(평촌 앵커 누락 때 실제로 발생) 화면에 드러낸다.
   */
  const error = ref<string | null>(null)

  /** 실패 사유 문구 — 백엔드가 400 본문에 실어 준 message를 그대로 쓴다 */
  function reasonOf(err: unknown): string {
    if (err instanceof HttpError) return err.message
    return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }

  async function loadInitial(): Promise<void> {
    if (result.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      result.value = await fetchSimulationResult(settings.region ?? 'pangyo', settings.month ?? 10)
    } catch (err) {
      // 호출부가 전부 fire-and-forget이라 여기서 상태로 남긴다 (대시보드가 오류 문구를 렌더)
      error.value = reasonOf(err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 지역 전환 — 이전 지역 결과를 비우고 새 지역 기준값을 받는다.
   * 비우지 않으면 판교 결과가 평촌 화면에 그대로 남아 다른 지역 수치로 오해된다.
   */
  async function selectRegion(region: RegionCode): Promise<void> {
    if (settings.region === region) return
    settings.region = region
    result.value = null
    appliedRate.value = null
    await loadInitial()
  }

  /** 실패 시 rethrow — 시나리오 "열기"(ScenarioTable)가 예외로 이동을 막는 계약이다 */
  async function run(): Promise<void> {
    running.value = true
    error.value = null
    try {
      result.value = await runSimulation({ ...settings })
      appliedRate.value = settings.participationRate
    } catch (err) {
      error.value = reasonOf(err)
      throw err
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

  return {
    settings, result, loading, running, appliedRate, error,
    loadInitial, selectRegion, run, applyScenario,
  }
})
