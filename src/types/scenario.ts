/** 시나리오 관리 테이블 1행 */
export interface Scenario {
  id: string
  name: string
  /** 대상 지역 (판교테크노벨리, 수원 인계동 …) */
  region: string
  /** 주요 조건 요약 (10%, 09~18시 …) */
  conditions: string
  /** 공급 증감(면) */
  supplyDelta: number
  /** 위험지수 변화 */
  riskBefore: number
  riskAfter: number
  /** 수정일 (YYYY.MM.DD) */
  updatedAt: string
}

export interface ScenarioFilter {
  region: string
  participation: string
  timeSlot: string
  keyword: string
  sort: 'updatedDesc' | 'updatedAsc'
  page: number
  pageSize: number
}
