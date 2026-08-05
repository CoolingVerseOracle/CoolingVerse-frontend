/**
 * grid-risk 개발용 폴백 데이터 생성기.
 * 백엔드 GET /simulate/grid-risk 미구현/장애 시 프론트 개발·리뷰가 막히지 않도록
 * 시드 고정 의사난수로 항상 같은 격자 분포를 만들어낸다. (mock API 계층이 아니라
 * 명시적 graceful-degradation 경로 — 사용처에서 isFallback으로 표기된다)
 */
import type { GridRiskPoint, GridRiskResponse, RegionCode, RiskFactor, RiskLevel } from '@/types/geo'

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

function toLevel(score: number): RiskLevel {
  if (score >= 65) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

function factor(score: number): RiskFactor {
  const clamped = Math.round(Math.min(100, Math.max(0, score)) * 10) / 10
  return { score: clamped, level: toLevel(clamped) }
}

export function buildGridRiskFallback(params: { hour: number; region: RegionCode }): GridRiskResponse {
  const bounds = REGION_BOUNDS[params.region]
  const seed = params.region === 'pangyo' ? 20261306 : 20261307
  const rand = mulberry32(seed)
  const weight = hourWeight(params.hour)

  // 핫스팟 3곳 — 시드 고정이라 지역별로 항상 같은 위치
  const hotspots = Array.from({ length: 3 }, () => ({
    lat: bounds.latMin + rand() * (bounds.latMax - bounds.latMin),
    lng: bounds.lngMin + rand() * (bounds.lngMax - bounds.lngMin),
    strength: 0.6 + rand() * 0.4,
  }))

  const latSpan = bounds.latMax - bounds.latMin
  const lngSpan = bounds.lngMax - bounds.lngMin

  const grids: GridRiskPoint[] = []
  let total = 0
  for (let i = 0; i < GRID_COUNT; i += 1) {
    const lat = bounds.latMin + rand() * latSpan
    const lng = bounds.lngMin + rand() * lngSpan
    // 핫스팟과의 거리 기반 기저 위험도 + 노이즈, 시간대 가중치 적용
    let base = 42
    for (const h of hotspots) {
      const d = Math.hypot((lat - h.lat) / latSpan, (lng - h.lng) / lngSpan)
      base += h.strength * 55 * Math.exp(-(d ** 2) / 0.06)
    }
    const score = Math.min(100, Math.max(0, (base + rand() * 16 - 8) * weight))
    const rounded = Math.round(score * 10) / 10
    total += rounded
    grids.push({ lat, lng, riskScore: rounded })
  }

  const globalRisk = Math.round((total / GRID_COUNT) * 10) / 10

  // 시간대별 M-커브 — 현재 vs 시나리오 적용(완화율 15% 가정)
  const meanBase = globalRisk / weight
  const hourlyCurrent = Array.from({ length: 24 }, (_, h) => Math.round(meanBase * hourWeight(h) * 10) / 10)
  const hourlyProjected = hourlyCurrent.map((v) => Math.round(v * 0.85 * 10) / 10)

  return {
    hour: params.hour,
    globalRisk,
    grids,
    breakdown: {
      parking: factor(globalRisk + 18),
      environment: factor(globalRisk - 8),
      traffic: factor(globalRisk - 25),
    },
    hourlyRisk: { current: hourlyCurrent, projected: hourlyProjected },
  }
}
