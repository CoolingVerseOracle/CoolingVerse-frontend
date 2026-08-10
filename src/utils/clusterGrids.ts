/**
 * 지도 클러스터 버킷팅 유틸 — MapPanel 클러스터 핀의 셀 크기·집계 로직 (이슈 #24).
 * 네이버 SDK와 무관한 순수 계산이라 분리해 단위 테스트한다.
 */

/** 기준 줌(지역 기본 줌 14)에서의 버킷 셀 크기 (도 단위, 약 400m) */
export const CLUSTER_BASE_ZOOM = 14
export const CLUSTER_BASE_CELL = 0.004

/**
 * 줌 1단계당 지도 축척이 2배이므로 셀도 절반씩 세분화한다.
 * 하한 0.000125°(줌 19 상당)는 격자 간격(약 0.0006°)보다 작아 최대 줌 부근에서는
 * 버킷이 사실상 개별 격자로 풀린다 — 별도 모드 없이 자연스럽게 개별 표시가 된다.
 */
export function cellSizeForZoom(zoom: number): number {
  const cell = CLUSTER_BASE_CELL / 2 ** (zoom - CLUSTER_BASE_ZOOM)
  return Math.min(0.032, Math.max(0.000125, cell))
}

export interface ClusterPoint {
  lat: number
  lng: number
  score: number
}

export interface ClusterBucket {
  /** 소속 격자 평균 좌표 — 핀 위치이자 클릭 확대 목적지 */
  lat: number
  lng: number
  count: number
  meanScore: number
  maxScore: number
}

/** 셀 크기 기준으로 격자를 버킷팅해 평균 좌표·평균/최대 위험지수를 집계 */
export function bucketGrids(points: ClusterPoint[], cell: number): ClusterBucket[] {
  interface Acc {
    latSum: number
    lngSum: number
    scoreSum: number
    maxScore: number
    count: number
  }
  const buckets = new Map<string, Acc>()
  for (const p of points) {
    const key = `${Math.floor(p.lat / cell)}:${Math.floor(p.lng / cell)}`
    const bucket = buckets.get(key) ?? { latSum: 0, lngSum: 0, scoreSum: 0, maxScore: -Infinity, count: 0 }
    bucket.latSum += p.lat
    bucket.lngSum += p.lng
    bucket.scoreSum += p.score
    bucket.maxScore = Math.max(bucket.maxScore, p.score)
    bucket.count += 1
    buckets.set(key, bucket)
  }
  return [...buckets.values()].map((b) => ({
    lat: b.latSum / b.count,
    lng: b.lngSum / b.count,
    count: b.count,
    meanScore: b.scoreSum / b.count,
    maxScore: b.maxScore,
  }))
}
