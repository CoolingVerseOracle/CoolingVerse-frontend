import type { Paginated } from '@/types/common'
import type { Scenario, ScenarioFilter } from '@/types/scenario'
import { mockScenarios } from './mocks/scenarios.mock'

const MOCK_DELAY_MS = 300

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const parseDate = (d: string) => d.replaceAll('.', '')

/** 시나리오 목록 조회 — 목 구현(필터/검색/정렬/페이지네이션 포함). 실제 연동 시 http() 호출로 교체 */
export async function fetchScenarios(filter: ScenarioFilter): Promise<Paginated<Scenario>> {
  await delay(MOCK_DELAY_MS)

  let items = [...mockScenarios]

  if (filter.region !== 'all') {
    items = items.filter((s) => s.region === filter.region)
  }
  if (filter.keyword.trim()) {
    const kw = filter.keyword.trim().toLowerCase()
    items = items.filter((s) => s.name.toLowerCase().includes(kw))
  }

  items.sort((a, b) =>
    filter.sort === 'updatedDesc'
      ? parseDate(b.updatedAt).localeCompare(parseDate(a.updatedAt))
      : parseDate(a.updatedAt).localeCompare(parseDate(b.updatedAt)),
  )

  const total = items.length
  const start = (filter.page - 1) * filter.pageSize

  return {
    items: items.slice(start, start + filter.pageSize),
    total,
    page: filter.page,
    pageSize: filter.pageSize,
  }
}
