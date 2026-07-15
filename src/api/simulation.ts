import type { SimulationResult, SimulationSettings } from '@/types/simulation'
import { defaultSimulationResult, runMockSimulation } from './mocks/simulation.mock'

const MOCK_DELAY_MS = 500

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** 대시보드 초기 데이터 — 목 구현. 실제 연동 시 http() 호출로 교체 */
export async function fetchSimulationResult(): Promise<SimulationResult> {
  await delay(MOCK_DELAY_MS)
  return defaultSimulationResult
}

/** 시뮬레이션 실행 — 목 구현. 실제 연동 시 http() 호출로 교체 */
export async function runSimulation(settings: SimulationSettings): Promise<SimulationResult> {
  await delay(MOCK_DELAY_MS)
  return runMockSimulation(settings)
}
