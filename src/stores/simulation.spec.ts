import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { fetchSimulationResult, runSimulation } from '@/api/simulation'
import { HttpError } from '@/api/http'
import { useSimulationStore } from '@/stores/simulation'
import type { SimulationResult } from '@/types/simulation'

vi.mock('@/api/simulation', () => ({
  fetchSimulationResult: vi.fn(),
  runSimulation: vi.fn(),
}))

const initialMock = fetchSimulationResult as Mock
const runMock = runSimulation as Mock

/** KPI 첫 장의 값만 지역 식별용으로 쓰는 최소 결과 */
function makeResult(supply: number): SimulationResult {
  return {
    kpis: [{ id: 'supply', label: '유휴 주차 공급 가능 대수', value: supply, unit: '면', baseline: null, note: '', tone: 'positive' }],
    metricChanges: [],
    participation: { rate: 30, segments: [] },
    hourlySupply: [],
    riskTrend: { labels: [], current: [], projected: [] },
  }
}

describe('simulation 스토어', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('지역을 바꾸면 이전 지역 결과를 비우고 새 지역 기준값을 받는다', async () => {
    initialMock.mockResolvedValueOnce(makeResult(15418))
    const store = useSimulationStore()
    await store.loadInitial()
    store.appliedRate = 45

    initialMock.mockResolvedValueOnce(makeResult(9999))
    await store.selectRegion('pyeongchon')

    expect(initialMock).toHaveBeenLastCalledWith('pyeongchon', 10)
    expect(store.result?.kpis[0].value).toBe(9999)
    // 실행 참여율은 지역과 함께 초기화되어야 "현재 n%" 캡션이 다른 지역 값으로 남지 않는다
    expect(store.appliedRate).toBeNull()
  })

  it('지역 기준값 조회가 실패하면 이전 지역 결과가 남지 않고 사유가 노출된다', async () => {
    initialMock.mockResolvedValueOnce(makeResult(15418))
    const store = useSimulationStore()
    await store.loadInitial()

    initialMock.mockRejectedValueOnce(new HttpError(400, '해당 지역은 정책 효과 시뮬레이션을 아직 지원하지 않습니다: pyeongchon'))
    await store.selectRegion('pyeongchon')

    expect(store.result).toBeNull()
    expect(store.error).toContain('정책 효과 시뮬레이션')
  })

  it('실행 실패는 사유를 남기고 예외를 그대로 던진다 (시나리오 열기가 이동을 막는 계약)', async () => {
    const store = useSimulationStore()
    runMock.mockRejectedValueOnce(new HttpError(400, '지역 데이터 조회에 실패했습니다: pyeongchon'))

    await expect(store.run()).rejects.toBeInstanceOf(HttpError)
    expect(store.error).toContain('지역 데이터 조회에 실패했습니다')
    expect(store.running).toBe(false)
  })

  it('실행에 성공하면 사유가 지워지고 참여율이 반영된다', async () => {
    const store = useSimulationStore()
    store.settings.participationRate = 45
    runMock.mockResolvedValueOnce(makeResult(20000))

    await store.run()

    expect(store.error).toBeNull()
    expect(store.appliedRate).toBe(45)
  })
})
