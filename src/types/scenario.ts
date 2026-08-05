import type { SimulationSettings } from './simulation'

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
  keyword: string
  sort: 'updatedDesc' | 'updatedAsc'
  page: number
  pageSize: number
}

/** 시나리오 저장 요청 — 이름 + 메모(선택) + 현재 슬라이더 설정 */
export interface CreateScenarioRequest {
  name: string
  memo?: string
  settings: SimulationSettings
}

/** 상세 조회 응답 — 조건(설정)과 결과 스냅샷을 모두 담는다. "열기" 버튼용 */
export interface ScenarioDetail {
  id: string
  name: string
  memo: string
  region: string
  settings: SimulationSettings
  /** 결과 스냅샷: 추가 확보 주차면 */
  addedSupply: number
  riskBefore: number
  riskAfter: number
  /** 결과 스냅샷: 일일 CO2 저감량(kg) */
  carbonReduction: number
  /** "yyyy-MM-dd HH:mm" */
  createdAt: string
  updatedAt: string
}
