import type { Paginated } from '@/types/common'
import type {
  CreateScenarioRequest,
  Scenario,
  ScenarioDetail,
  ScenarioFilter,
  UpdateScenarioMetadataRequest,
} from '@/types/scenario'
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
  // participation(lt10/gte10)은 백엔드 PR #12부터 지원 — 실동작 검증 완료 (이슈 #4)
  if (filter.participation !== 'all') params.set('participation', filter.participation)

  return http<Paginated<Scenario>>(`/scenarios?${params.toString()}`)
}

/** 시나리오 저장 — 서버가 결과(공급·위험지수·CO2)를 계산해 스냅샷으로 함께 저장한다 */
export async function createScenario(payload: CreateScenarioRequest): Promise<ScenarioDetail> {
  return http<ScenarioDetail>('/scenarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** 시나리오 상세("열기") — 설정과 결과 스냅샷을 함께 반환한다 */
export async function fetchScenario(id: string): Promise<ScenarioDetail> {
  return http<ScenarioDetail>(`/scenarios/${id}`)
}

/** 이름·메모 부분 수정 — 설정·결과 스냅샷은 불변, 없으면 404(HttpError) */
export async function updateScenarioMetadata(
  id: string,
  payload: UpdateScenarioMetadataRequest,
): Promise<ScenarioDetail> {
  return http<ScenarioDetail>(`/scenarios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

/** 시나리오 삭제 — 성공 204 / 없으면 404(HttpError) */
export async function deleteScenario(id: string): Promise<void> {
  await http<void>(`/scenarios/${id}`, { method: 'DELETE' })
}
