import type { GeoBounds } from '@/types/geo'

/** 이동 제한 박스 확장 배율 — 인접 맥락을 볼 수 있게 느슨하게 제한 (이슈 #26 C안, 1.5~2배의 중간값) */
export const MAX_BOUNDS_EXPAND = 1.75

/** 중심을 고정한 채 가로·세로 폭을 배율만큼 키운 바운딩박스 */
export function expandBounds(bounds: GeoBounds, factor = MAX_BOUNDS_EXPAND): GeoBounds {
  const latCenter = (bounds.latMin + bounds.latMax) / 2
  const lngCenter = (bounds.lngMin + bounds.lngMax) / 2
  const latHalf = ((bounds.latMax - bounds.latMin) / 2) * factor
  const lngHalf = ((bounds.lngMax - bounds.lngMin) / 2) * factor
  return {
    latMin: latCenter - latHalf,
    latMax: latCenter + latHalf,
    lngMin: lngCenter - lngHalf,
    lngMax: lngCenter + lngHalf,
  }
}

export function boundsEqual(a: GeoBounds, b: GeoBounds): boolean {
  return (
    a.latMin === b.latMin && a.latMax === b.latMax && a.lngMin === b.lngMin && a.lngMax === b.lngMax
  )
}

/** 정렬된 배열의 분위수 — 선형 보간 */
function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q
  const lower = Math.floor(pos)
  const upper = Math.ceil(pos)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (pos - lower)
}

/** IQR 울타리(Q1−1.5·IQR ~ Q3+1.5·IQR) 안에 든 값들의 최소·최대 */
function inlierRange(sorted: number[]): [number, number] {
  const q1 = quantile(sorted, 0.25)
  const q3 = quantile(sorted, 0.75)
  const fence = (q3 - q1) * 1.5
  const inliers = sorted.filter((v) => v >= q1 - fence && v <= q3 + fence)
  const source = inliers.length > 0 ? inliers : sorted
  return [source[0], source[source.length - 1]]
}

/**
 * 격자 좌표들의 바운딩박스 — 축별 IQR 울타리 밖 이상치는 제외한다.
 * (실 데이터에 분석 지역 밖 이상치 격자가 소수 섞여 있어, 단순 min/max를 쓰면
 * 박스가 그쪽으로 확 늘어난다 — 이슈 #26 백엔드 코멘트의 이상치 3개 참고)
 */
export function boundsFromGrids(grids: { lat: number; lng: number }[]): GeoBounds | null {
  if (grids.length === 0) return null
  const lats = grids.map((g) => g.lat).sort((a, b) => a - b)
  const lngs = grids.map((g) => g.lng).sort((a, b) => a - b)
  const [latMin, latMax] = inlierRange(lats)
  const [lngMin, lngMax] = inlierRange(lngs)
  return { latMin, latMax, lngMin, lngMax }
}
