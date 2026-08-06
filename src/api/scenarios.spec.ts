import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import type { ScenarioFilter } from '@/types/scenario'
import { http } from '@/api/http'
import { fetchScenarios } from '@/api/scenarios'

// http 계층은 스텁 — fetchScenarios가 조립한 URL만 검증한다
vi.mock('@/api/http', () => ({ http: vi.fn() }))

const httpMock = http as Mock

/** 조립된 요청 경로의 쿼리스트링을 URLSearchParams로 되돌린다 */
function queryOf(): URLSearchParams {
  const path = httpMock.mock.calls.at(-1)?.[0] as string
  return new URLSearchParams(path.split('?')[1] ?? '')
}

function makeFilter(overrides: Partial<ScenarioFilter> = {}): ScenarioFilter {
  return {
    region: 'all',
    participation: 'all',
    keyword: '',
    sort: 'updatedDesc',
    page: 1,
    pageSize: 10,
    ...overrides,
  }
}

describe('fetchScenarios 쿼리스트링 조립', () => {
  beforeEach(() => {
    httpMock.mockReset()
    httpMock.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10 })
  })

  it('기본값은 sort/page/pageSize만 보내고 선택 필터는 생략한다', async () => {
    await fetchScenarios(makeFilter())
    const q = queryOf()
    expect(q.get('sort')).toBe('updatedDesc')
    expect(q.get('page')).toBe('1')
    expect(q.get('pageSize')).toBe('10')
    expect(q.has('keyword')).toBe(false)
    expect(q.has('region')).toBe(false)
    expect(q.has('participation')).toBe(false)
  })

  it('keyword는 trim해서 싣고, 공백뿐이면 생략한다', async () => {
    await fetchScenarios(makeFilter({ keyword: '  표준  ' }))
    expect(queryOf().get('keyword')).toBe('표준')

    await fetchScenarios(makeFilter({ keyword: '   ' }))
    expect(queryOf().has('keyword')).toBe(false)
  })

  it("region은 'all'이면 생략, 값이 있으면 그대로 싣는다", async () => {
    await fetchScenarios(makeFilter({ region: 'all' }))
    expect(queryOf().has('region')).toBe(false)

    await fetchScenarios(makeFilter({ region: 'pangyo' }))
    expect(queryOf().get('region')).toBe('pangyo')
  })

  it("participation은 'all'이 아닐 때만 싣는다", async () => {
    await fetchScenarios(makeFilter({ participation: 'gte10' }))
    expect(queryOf().get('participation')).toBe('gte10')

    await fetchScenarios(makeFilter({ participation: 'all' }))
    expect(queryOf().has('participation')).toBe(false)
  })
})
