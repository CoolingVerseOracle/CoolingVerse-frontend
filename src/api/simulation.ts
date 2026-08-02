import type { SimulationResult, SimulationSettings } from '@/types/simulation'
import { http } from './http'

/** 대시보드 초기 데이터 — 표준 개방안(30%, 08~19시) 기준 기본 결과 */
export async function fetchSimulationResult(): Promise<SimulationResult> {
  return http<SimulationResult>('/simulate/initial')
}

/** 시뮬레이션 실행 — 현재 슬라이더 설정으로 재계산 */
export async function runSimulation(settings: SimulationSettings): Promise<SimulationResult> {
  return http<SimulationResult>('/simulate', {
    method: 'POST',
    body: JSON.stringify(settings),
  })
}
