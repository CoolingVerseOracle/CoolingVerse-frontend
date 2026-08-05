import type { GridRiskResponse, RegionCode } from '@/types/geo'
import { http } from './http'
import { buildGridRiskFallback } from './gridRiskFallback'

export interface GridRiskResult {
  data: GridRiskResponse
  /** 백엔드 대신 개발용 폴백 데이터를 사용했는지 여부 — UI에 "샘플 데이터"로 표기 */
  isFallback: boolean
}

const useFallbackOnly = import.meta.env.VITE_USE_GRID_FALLBACK === 'true'

/**
 * 시간대·지역별 격자 위험지수 조회.
 * 백엔드 계약(협의 중): GET /simulate/grid-risk?hour=13&region=pangyo
 * 응답에는 위험지수 보유 격자만 포함된다 — 그 외 격자는 렌더링하지 않는다.
 */
export async function fetchGridRisk(params: { hour: number; region: RegionCode }): Promise<GridRiskResult> {
  if (!useFallbackOnly) {
    try {
      const query = new URLSearchParams({ hour: String(params.hour), region: params.region })
      // 미구현 상태의 백엔드가 401을 반환해도 세션 로그아웃으로 번지지 않게 한다 — 폴백으로 처리
      const data = await http<GridRiskResponse>(`/simulate/grid-risk?${query}`, {}, { notifyUnauthorized: false })
      return { data, isFallback: false }
    } catch (error) {
      console.warn('[geo] grid-risk API 실패 — 개발용 폴백 데이터로 대체합니다.', error)
    }
  }
  return { data: buildGridRiskFallback(params), isFallback: true }
}
