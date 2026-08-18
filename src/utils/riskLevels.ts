/**
 * 지도에서 위험지수를 일관된 레벨·색상으로 표시하기 위한 기준.
 * 점수 산정에는 관여하지 않으며, API/폴백이 내려준 0–100 점수의 표시 전용이다.
 */
export type RiskIndexLevelKey = 'danger' | 'alert' | 'caution' | 'normal' | 'smooth'

export interface RiskIndexLevel {
  key: RiskIndexLevelKey
  label: string
  /** 이 값 이상부터 현재 레벨에 포함된다. */
  minScore: number
  /** 지도 마커·범례에 공통 적용하는 색상. */
  color: string
  /** 범례·툴팁에 표시할 점수 구간 설명. */
  rangeLabel: string
}

/** 높은 점수부터 선언해 첫 번째 일치 레벨을 반환한다. */
export const RISK_INDEX_LEVELS: readonly RiskIndexLevel[] = [
  { key: 'danger', label: '위험', minScore: 74, color: '#dc2626', rangeLabel: '74점 이상' },
  { key: 'alert', label: '경계', minScore: 62, color: '#f97316', rangeLabel: '62점 이상 ~ 74점 미만' },
  { key: 'caution', label: '주의', minScore: 54, color: '#eab308', rangeLabel: '54점 이상 ~ 62점 미만' },
  { key: 'normal', label: '정상', minScore: 40, color: '#16a34a', rangeLabel: '40점 이상 ~ 54점 미만' },
  { key: 'smooth', label: '원활', minScore: Number.NEGATIVE_INFINITY, color: '#1e90ff', rangeLabel: '40점 미만' },
]

/** 위험지수 하나를 이슈 #44의 표시 레벨 하나로 매핑한다. */
export function getRiskIndexLevel(score: number): RiskIndexLevel {
  return RISK_INDEX_LEVELS.find((level) => score >= level.minScore) ?? RISK_INDEX_LEVELS.at(-1)!
}
