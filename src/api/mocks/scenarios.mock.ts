import type { Scenario } from '@/types/scenario'

/** Figma 시나리오 관리(1:394) 표 데이터를 그대로 옮긴 목 목록 */
export const mockScenarios: Scenario[] = [
  {
    id: 'sc-1',
    name: '판교 평일 주간 10%',
    region: '판교테크노벨리',
    conditions: '10%, 09~18시',
    supplyDelta: 420,
    riskBefore: 78.4,
    riskAfter: 69.2,
    updatedAt: '2026.07.12',
  },
  {
    id: 'sc-2',
    name: '대단지 우선 개방',
    region: '판교테크노벨리',
    conditions: '300세대 이상, 15%',
    supplyDelta: 510,
    riskBefore: 78.4,
    riskAfter: 66.8,
    updatedAt: '2026.07.11',
  },
  {
    id: 'sc-3',
    name: '인계동 저녁 개방',
    region: '수원 인계동',
    conditions: '10%, 18~23시',
    supplyDelta: 230,
    riskBefore: 72.1,
    riskAfter: 67.9,
    updatedAt: '2026.07.10',
  },
]
