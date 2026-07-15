import type { SimulationResult, SimulationSettings } from '@/types/simulation'

/** Figma 대시보드(1:29) 수치를 그대로 옮긴 기본 결과 */
export const defaultSimulationResult: SimulationResult = {
  kpis: [
    {
      id: 'supply',
      label: '유휴 주차 공급 가능 대수',
      value: 420,
      unit: '면',
      badge: '+45면',
      tone: 'positive',
    },
    {
      id: 'illegalParking',
      label: '불법주정차 감소 예측',
      value: -12.4,
      unit: '%',
      badge: '개선 중',
      tone: 'warning',
    },
    {
      id: 'congestion',
      label: '교통 혼잡 완화 예측',
      value: -8.2,
      unit: '%',
      badge: '원활',
      tone: 'neutral',
    },
    {
      id: 'carbon',
      label: '탄소배출 저감 예측',
      value: -15.6,
      unit: '%',
      badge: '우수',
      tone: 'positive',
    },
    {
      id: 'risk',
      label: '도시 교통·환경 위험지수',
      value: 69.2,
      unit: '',
      baseline: 78.4,
      badge: '위험도 감소',
      tone: 'negative',
    },
  ],
  metricChanges: [
    { id: 'risk', label: '위험지수', before: 78.4, after: 69.2, deltaLabel: '-12%', tone: 'negative' },
    { id: 'illegal', label: '불법주정차 건수', before: 100, after: 85, deltaLabel: '-15%', tone: 'warning' },
    { id: 'supplyRate', label: '주차 공급률', before: 68, after: 90, deltaLabel: '+22%', tone: 'positive' },
  ],
  participation: {
    rate: 85,
    segments: [
      { label: '개방', value: 55 },
      { label: '예정', value: 30 },
      { label: '미참여', value: 15 },
    ],
  },
  hourlySupply: [
    { label: '09시', value: 180 },
    { label: '10시', value: 240 },
    { label: '11시', value: 320 },
    { label: '12시', value: 405 },
    { label: '13시', value: 420 },
    { label: '14시', value: 385 },
    { label: '15시', value: 300 },
    { label: '16시', value: 245 },
    { label: '17시', value: 210 },
    { label: '18시', value: 165 },
    { label: '19시', value: 150 },
    { label: '20시', value: 140 },
    { label: '21시', value: 130 },
  ],
  riskTrend: {
    labels: ['1주차', '2주차', '3주차', '4주차'],
    current: [78.4, 77.8, 77.1, 76.6],
    projected: [78.4, 74.9, 71.5, 69.2],
  },
}

/** 설정값에 따라 약간의 변화를 준 결과를 돌려주는 목 시뮬레이터 */
export function runMockSimulation(settings: SimulationSettings): SimulationResult {
  const factor = settings.participationRate / 45
  const base = defaultSimulationResult

  const scale = (v: number) => Math.round(v * factor * 10) / 10

  return {
    ...base,
    kpis: base.kpis.map((kpi) =>
      kpi.id === 'supply'
        ? { ...kpi, value: Math.round(kpi.value * factor) }
        : kpi.id === 'risk'
          ? kpi
          : { ...kpi, value: scale(kpi.value) },
    ),
    hourlySupply: base.hourlySupply.map((p) => ({
      ...p,
      value: Math.round(p.value * factor),
    })),
  }
}
