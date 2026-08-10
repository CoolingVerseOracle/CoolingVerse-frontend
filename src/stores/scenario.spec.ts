import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import type { Paginated } from '@/types/common'
import type { Scenario } from '@/types/scenario'
import { deleteScenario, fetchScenarios } from '@/api/scenarios'
import { HttpError } from '@/api/http'
import { useScenarioStore } from '@/stores/scenario'

vi.mock('@/api/scenarios', () => ({ fetchScenarios: vi.fn(), deleteScenario: vi.fn() }))

const fetchMock = fetchScenarios as Mock
const deleteMock = deleteScenario as Mock

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

describe('useScenarioStore 일괄 삭제 (removeSelected)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(page([]))
    deleteMock.mockReset()
    deleteMock.mockResolvedValue(undefined)
  })

  it('선택된 모든 id에 단건 DELETE를 호출하고 목록을 재조회한다', async () => {
    const store = useScenarioStore()
    store.toggleSelect('1')
    store.toggleSelect('2')

    const result = await store.removeSelected()

    expect(deleteMock.mock.calls.map((c) => c[0]).sort()).toEqual(['1', '2'])
    expect(result).toEqual({ deleted: 2, missing: 0, failed: 0 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('부분 실패 시 실패 건수를 구분해 반환하고 재조회는 그대로 수행한다', async () => {
    const store = useScenarioStore()
    deleteMock.mockImplementation((id: string) => {
      if (id === '2') return Promise.reject(new HttpError(404, 'not found'))
      if (id === '3') return Promise.reject(new Error('network'))
      return Promise.resolve()
    })
    store.toggleSelect('1')
    store.toggleSelect('2')
    store.toggleSelect('3')

    const result = await store.removeSelected()

    expect(result).toEqual({ deleted: 1, missing: 1, failed: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('선택이 비어 있으면 아무 호출도 하지 않는다', async () => {
    const store = useScenarioStore()
    const result = await store.removeSelected()
    expect(result).toEqual({ deleted: 0, missing: 0, failed: 0 })
    expect(deleteMock).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('마지막 페이지의 전 행을 지우면 페이지를 앞으로 보정한다', async () => {
    const store = useScenarioStore()

    // 2페이지에 2건만 있는 상태(총 12건, pageSize 10)를 만든다
    fetchMock.mockResolvedValue({
      items: [makeScenario('11'), makeScenario('12')],
      total: 12,
      page: 2,
      pageSize: 10,
    })
    store.filter.page = 2
    await flush()
    fetchMock.mockClear()

    store.toggleSelect('11')
    store.toggleSelect('12')
    await store.removeSelected()
    await flush()

    // page watcher가 1페이지 재조회를 트리거한다
    expect(store.filter.page).toBe(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
