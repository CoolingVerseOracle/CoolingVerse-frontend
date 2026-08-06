import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import type { Paginated } from '@/types/common'
import type { Scenario } from '@/types/scenario'
import { fetchScenarios } from '@/api/scenarios'
import { useScenarioStore } from '@/stores/scenario'

vi.mock('@/api/scenarios', () => ({ fetchScenarios: vi.fn() }))

const fetchMock = fetchScenarios as Mock

function makeScenario(id: string): Scenario {
  return {
    id,
    name: `시나리오 ${id}`,
    region: '판교테크노밸리',
    participationRate: 30,
    supplyDelta: 0,
    riskBefore: 0,
    riskAfter: 0,
    updatedAt: '2026.07.31',
  }
}

function page(items: Scenario[]): Paginated<Scenario> {
  return { items, total: items.length, page: 1, pageSize: 10 }
}

/** watch(pre) 콜백 + 이어지는 page watch + load()의 마이크로태스크까지 흘려보낸다 */
async function flush(): Promise<void> {
  await nextTick()
  await Promise.resolve()
  await Promise.resolve()
}

describe('useScenarioStore 조회 트리거', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(page([]))
  })

  it('1페이지에서 필터를 바꾸면 load가 정확히 1회 실행된다', async () => {
    const store = useScenarioStore()
    store.filter.keyword = '표준'
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(store.filter.page).toBe(1)
  })

  it('2페이지 이상에서 필터를 바꾸면 page가 1로 리셋되고 load는 1회만 실행된다 (#7 이중 로드 회귀)', async () => {
    const store = useScenarioStore()

    // 2페이지로 이동한 뒤의 로드는 무시
    store.filter.page = 2
    await flush()
    fetchMock.mockClear()

    // 필터 변경 → page 리셋과 재조회가 겹쳐도 load는 단 1회여야 한다
    store.filter.region = 'pangyo'
    await flush()

    expect(store.filter.page).toBe(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('늦게 도착한 이전 응답이 최신 목록을 덮어쓰지 않는다 (requestSeq 가드)', async () => {
    const store = useScenarioStore()

    const resolvers: Array<(v: Paginated<Scenario>) => void> = []
    fetchMock.mockImplementation(() => new Promise((res) => resolvers.push(res)))

    void store.load() // seq 1 (느린 이전 요청)
    void store.load() // seq 2 (최신 요청)

    // 최신 응답(2번)이 먼저 도착
    resolvers[1](page([makeScenario('B')]))
    await flush()
    // 이전 응답(1번)이 뒤늦게 도착 — 무시되어야 함
    resolvers[0](page([makeScenario('A')]))
    await flush()

    expect(store.scenarios.map((s) => s.id)).toEqual(['B'])
  })
})
