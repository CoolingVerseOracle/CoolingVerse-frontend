/**
 * grid-risk 개발용 폴백 데이터 생성기.
 * 백엔드 장애 또는 데이터 미보유 지역(현재 ingye는 404) 조회 시 화면이 막히지 않도록
 * 시드 고정 의사난수로 항상 같은 격자 분포를 만들어낸다. (mock API 계층이 아니라
 * 명시적 graceful-degradation 경로 — 사용처에서 isFallback으로 표기된다)
 */
import { DEFAULT_PARTICIPATION_RATE } from '@/constants/simulation'
import type {
  GridRiskParams,
  GridRiskPoint,
  GridRiskResponse,
  RegionCode,
  RiskFactor,
  RiskLevel,
} from '@/types/geo'

/** 위험지수 보유 격자 수 — 백엔드 협의값(판교 시드 기준) */
const GRID_COUNT = 1306

interface Bounds {
  latMin: number
  latMax: number
  lngMin: number
  lngMax: number
}

const REGION_BOUNDS: Record<RegionCode, Bounds> = {
  pangyo: { latMin: 37.394, latMax: 37.412, lngMin: 127.098, lngMax: 127.126 },
  ingye: { latMin: 37.256, latMax: 37.272, lngMin: 127.024, lngMax: 127.044 },
}

/** 시드 고정 의사난수 (mulberry32) — 같은 지역이면 항상 같은 격자 배치 */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 출퇴근 이중 피크(M자) 형태의 시간대 가중치 (0.4–1.0) */
function hourWeight(hour: number): number {
  const morning = Math.exp(-((hour - 9) ** 2) / 8)
  const evening = Math.exp(-((hour - 18) ** 2) / 8)
  return 0.4 + 0.6 * Math.max(morning, evening)
}

/** 소수 첫째 자리 반올림 */
function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * 참여율 → 위험지수 감소폭(절대값). 백엔드 SimulationService의 앵커 표와 동일한 값·방식
 * (분석 가이드 시나리오 표 — 개방 효과가 수확 체감이라 구간별 선형 보간).
 * 실모델처럼 전 격자·전 시간대에 같은 점수를 빼는 평행 이동으로 적용한다.
 */
const ANCHOR_RATE = [0, 10, 30, 50, 70, 100]
const ANCHOR_DELTA = [0, 0.36, 0.96, 1.31, 1.52, 1.68]

function riskDelta(rate: number): number {
  const clamped = Math.min(100, Math.max(0, rate))
  const upper = ANCHOR_RATE.findIndex((anchor) => clamped <= anchor)
  if (upper <= 0) return ANCHOR_DELTA[0]
  const t = (clamped - ANCHOR_RATE[upper - 1]) / (ANCHOR_RATE[upper] - ANCHOR_RATE[upper - 1])
  return ANCHOR_DELTA[upper - 1] + t * (ANCHOR_DELTA[upper] - ANCHOR_DELTA[upper - 1])
}

function toLevel(score: number): RiskLevel {
  if (score >= 65) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

function factor(score: number): RiskFactor {
  const clamped = round1(Math.min(100, Math.max(0, score)))
  return { score: clamped, level: toLevel(clamped) }
}

/** 시간·참여율 무관한 지역별 기저 격자 — 좌표와 가중 전 점수 */
interface BasePoint {
  lat: number
  lng: number
  base: number
}

// hour 스크럽·참여율 변경마다 폴백이 재호출되므로, 무거운 좌표·핫스팟 계산은
// 지역당 1회만 수행하고 캐시한다 (시간대·참여율은 스칼라 곱으로만 반영됨)
const baseGridCache = new Map<RegionCode, BasePoint[]>()

function baseGrid(region: RegionCode): BasePoint[] {
  const cached = baseGridCache.get(region)
  if (cached) return cached

  const bounds = REGION_BOUNDS[region]
  const rand = mulberry32(region === 'pangyo' ? 20261306 : 20261307)

  // 핫스팟 3곳 — 시드 고정이라 지역별로 항상 같은 위치
  const hotspots = Array.from({ length: 3 }, () => ({
    lat: bounds.latMin + rand() * (bounds.latMax - bounds.latMin),
    lng: bounds.lngMin + rand() * (bounds.lngMax - bounds.lngMin),
    strength: 0.6 + rand() * 0.4,
  }))

  const latSpan = bounds.latMax - bounds.latMin
  const lngSpan = bounds.lngMax - bounds.lngMin

  const points: BasePoint[] = []
  for (let i = 0; i < GRID_COUNT; i += 1) {
    const lat = bounds.latMin + rand() * latSpan
    const lng = bounds.lngMin + rand() * lngSpan
    // 핫스팟과의 거리 기반 기저 위험도 + 노이즈 (시간대 가중치는 호출 시점에 곱한다)
    let base = 42
    for (const h of hotspots) {
      const d = Math.hypot((lat - h.lat) / latSpan, (lng - h.lng) / lngSpan)
      base += h.strength * 55 * Math.exp(-(d ** 2) / 0.06)
    }
    points.push({ lat, lng, base: base + rand() * 16 - 8 })
  }
  baseGridCache.set(region, points)
  return points
}

export function buildGridRiskFallback(params: GridRiskParams): GridRiskResponse {
  const weight = hourWeight(params.hour)
  const delta = riskDelta(params.participationRate ?? DEFAULT_PARTICIPATION_RATE)

  const grids: GridRiskPoint[] = []
  let total = 0
  for (const point of baseGrid(params.region)) {
    const score = round1(Math.min(100, Math.max(0, point.base * weight)))
    total += score
    grids.push({
      lat: point.lat,
      lng: point.lng,
      riskScore: score,
      projectedRiskScore: round1(Math.max(0, score - delta)),
    })
  }

  const globalRisk = round1(total / GRID_COUNT)

  // 시간대별 M-커브 — 현재 vs 시나리오 적용(절대 차감 평행 이동)
  const meanBase = globalRisk / weight
  const hourlyCurrent = Array.from({ length: 24 }, (_, h) => round1(meanBase * hourWeight(h)))
  const hourlyProjected = hourlyCurrent.map((v) => round1(Math.max(0, v - delta)))

  return {
    hour: params.hour,
    globalRisk,
    globalRiskProjected: round1(Math.max(0, globalRisk - delta)),
    grids,
    breakdown: {
      parking: factor(globalRisk + 18),
      environment: factor(globalRisk - 8),
      traffic: factor(globalRisk - 25),
    },
    hourlyRisk: { current: hourlyCurrent, projected: hourlyProjected },
  }
}
