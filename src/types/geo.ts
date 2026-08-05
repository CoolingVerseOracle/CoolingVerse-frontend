/** 분석 대상 지역 코드 */
export type RegionCode = 'pangyo' | 'ingye'

/** 위험지수 보유 격자 1개 — 위험지수 없는 격자는 응답에 포함되지 않는다 */
export interface GridRiskPoint {
  lat: number
  lng: number
  /** 격자 위험 지수 (0–100) */
  riskScore: number
}

export type RiskLevel = 'high' | 'medium' | 'low'

/** 리스크 구성 요소 1개 (주차 수요 압박 / 환경 민감도 / 교통 혼잡도) */
export interface RiskFactor {
  /** 0–100 */
  score: number
  level: RiskLevel
}

export interface RiskBreakdown {
  parking: RiskFactor
  environment: RiskFactor
  traffic: RiskFactor
}

/** 24시간 위험지수 커브 — M-커브 차트용 (current/projected 각 24개, 00~23시) */
export interface HourlyRiskCurve {
  current: number[]
  projected: number[]
}

/** GET /simulate/grid-risk 응답 — 백엔드 협의 중인 제안 계약 */
export interface GridRiskResponse {
  /** 조회 시간대 (0–23) */
  hour: number
  /** 평균 격자 위험 지수 (0–100) */
  globalRisk: number
  /** 위험지수 보유 격자만 (판교 기준 1,306개) */
  grids: GridRiskPoint[]
  breakdown: RiskBreakdown
  /** 시간대별 평균 위험지수 커브 — 현재 vs 시나리오 적용 */
  hourlyRisk: HourlyRiskCurve
}
