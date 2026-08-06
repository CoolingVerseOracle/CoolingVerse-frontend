/** 분석 대상 지역 코드 */
export type RegionCode = 'pangyo' | 'ingye'

/** grid-risk 조회 파라미터 — 실 API와 폴백 생성기가 공유 */
export interface GridRiskParams {
  hour: number
  region: RegionCode
  /** 마지막 실행에 반영된 참여율(%) — 실행 전이면 null, 쿼리에서 생략 */
  participationRate?: number | null
}

/** 위험지수 보유 격자 1개 — 위험지수 없는 격자는 응답에 포함되지 않는다 */
export interface GridRiskPoint {
  lat: number
  lng: number
  /** 격자 위험 지수 (0–100) */
  riskScore: number
  /** 참여율 적용 후 위험 지수 (0–100) — 초기 버전은 전 격자 동일 감쇠 */
  projectedRiskScore: number
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

/** GET /simulate/grid-risk 응답 — 백엔드 GridRiskDtos.java와 1:1 (backend PR #17·#20) */
export interface GridRiskResponse {
  /** 조회 시간대 (0–23) */
  hour: number
  /** 평균 격자 위험 지수 (0–100) */
  globalRisk: number
  /** 참여율 적용 후 평균 격자 위험 지수 (0–100) */
  globalRiskProjected: number
  /** 위험지수 보유 격자만 (판교 기준 1,306개) */
  grids: GridRiskPoint[]
  breakdown: RiskBreakdown
  /** 시간대별 평균 위험지수 커브 — 현재 vs 시나리오 적용 */
  hourlyRisk: HourlyRiskCurve
}
