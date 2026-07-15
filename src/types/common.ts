/** 지표 방향: 개선(down이 좋은 지표 포함)을 UI 색상으로 구분하기 위한 톤 */
export type MetricTone = 'positive' | 'negative' | 'warning' | 'neutral'

export interface SelectOption<T extends string | number = string> {
  label: string
  value: T
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
