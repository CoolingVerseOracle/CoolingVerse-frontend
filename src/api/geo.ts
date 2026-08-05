import type { GridRiskParams, GridRiskResponse } from '@/types/geo'
import { http } from './http'
import { buildGridRiskFallback } from './gridRiskFallback'

export interface GridRiskResult {
  data: GridRiskResponse
  /** 백엔드 대신 개발용 폴백 데이터를 사용했는지 여부 — UI에 "샘플 데이터"로 표기 */
  isFallback: boolean
}

/**
 * 시간대·지역별 격자 위험지수 조회 — GET /simulate/grid-risk (backend PR #17·#20).
 * 응답에는 위험지수 보유 격자만 포함된다(판교 1,306개) — 그 외 격자는 렌더링하지 않는다.
 * 백엔드가 아직 판교만 데이터를 보유해 ingye는 404가 온다 — 그 경우와 장애,
 * 빈 격자 응답(로컬 H2 등 risk_index 미보유 DB) 시에는 폴백 데이터로 대체하고
 * "샘플 데이터"를 표기한다.
 */
export async function fetchGridRisk(params: GridRiskParams): Promise<GridRiskResult> {
  try {
    const query = new URLSearchParams({ hour: String(params.hour), region: params.region })
    if (params.participationRate != null) {
      query.set('participationRate', String(params.participationRate))
    }
    const data = await http<GridRiskResponse>(`/simulate/grid-risk?${query}`)
    if (data.grids.length > 0) return { data, isFallback: false }
    console.warn('[geo] grid-risk 응답에 격자가 없습니다 — 개발용 폴백 데이터로 대체합니다.')
  } catch (error) {
    console.warn('[geo] grid-risk API 실패 — 개발용 폴백 데이터로 대체합니다.', error)
  }
  return { data: buildGridRiskFallback(params), isFallback: true }
}
