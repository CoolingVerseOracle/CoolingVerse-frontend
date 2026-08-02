import type { Paginated } from '@/types/common'
import type { Scenario, ScenarioFilter } from '@/types/scenario'
import { http } from './http'

/** 시나리오 목록 조회 — 검색·정렬·페이지네이션은 서버가 처리한다 */
export async function fetchScenarios(filter: ScenarioFilter): Promise<Paginated<Scenario>> {
  const params = new URLSearchParams({
    sort: filter.sort,
    page: String(filter.page),
    pageSize: String(filter.pageSize),
  })

  const keyword = filter.keyword.trim()
  if (keyword) params.set('keyword', keyword)
  if (filter.region !== 'all') params.set('region', filter.region)
  // participation/timeSlot은 아직 백엔드 미지원 파라미터 — 서버가 무시하며,
  // 쿼리 지원이 추가되면 프론트 변경 없이 동작한다 (이슈 #4)
  if (filter.participation !== 'all') params.set('participation', filter.participation)
  if (filter.timeSlot !== 'all') params.set('timeSlot', filter.timeSlot)

  return http<Paginated<Scenario>>(`/scenarios?${params.toString()}`)
}
