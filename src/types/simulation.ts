import type { MetricTone } from './common'

/** 대시보드 KPI 카드 1장 */
export interface KpiMetric {
  id: string
  label: string
  value: number
  /** 표시 단위 (면, %, 점 등) */
  unit: string
  /** 69.2 옆의 78.4처럼 비교 기준값이 있는 경우 */
  baseline?: number
  /** 카드 하단 배지 텍스트 (+45, 개선 중, 원활 …) */
  badge: string
  tone: MetricTone
}

/** 시나리오 설정 폼 값 */
export interface SimulationSettings {
  /** 외부인 개방 아파트 포함 여부 */
  openToPublic: boolean
  /** 입주민 전용 아파트 포함 여부 */
  residentsOnly: boolean
  /** 예상 참여율(%) */
  participationRate: number
  /** 개방 운영 시작/종료 (HH:mm) */
  openFrom: string
  openTo: string
  /** 상업시설 반경(m) */
  commercialRadiusM: number
}

/** before/after 비교 바 1쌍 */
export interface BeforeAfterMetric {
  id: string
  label: string
  before: number
  after: number
  /** 우측 상단 증감 표기 (-12%, +22% …) */
  deltaLabel: string
  tone: MetricTone
}

export interface ChartPoint {
  label: string
  value: number
}

/** 주차 지원 현황 도넛 */
export interface ParticipationBreakdown {
  /** 중앙 표기 지원율(%) */
  rate: number
  segments: { label: string; value: number }[]
}

export interface SimulationResult {
  kpis: KpiMetric[]
  metricChanges: BeforeAfterMetric[]
  participation: ParticipationBreakdown
  /** 시간대별 유휴 주차 자원량 예측 */
  hourlySupply: ChartPoint[]
  /** 시나리오별 위험지수 변화 — 현재 vs 예측 */
  riskTrend: {
    labels: string[]
    current: number[]
    projected: number[]
  }
}
