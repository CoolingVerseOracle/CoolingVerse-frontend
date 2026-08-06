import { describe, expect, it } from 'vitest'
import { boundsFromGrids } from './geoBounds'

/** 본체 격자 — 판교 실데이터와 비슷한 범위에 고르게 분포 */
function makeGrids(count: number): { lat: number; lng: number }[] {
  return Array.from({ length: count }, (_, i) => ({
    lat: 37.3 + (0.15 * i) / (count - 1),
    lng: 127.04 + (0.14 * i) / (count - 1),
  }))
}

describe('boundsFromGrids', () => {
  it('빈 배열이면 null을 반환한다', () => {
    expect(boundsFromGrids([])).toBeNull()
  })

  it('이상치가 없으면 단순 min/max와 같다', () => {
    const bounds = boundsFromGrids(makeGrids(100))
    expect(bounds).not.toBeNull()
    expect(bounds!.latMin).toBeCloseTo(37.3, 10)
    expect(bounds!.latMax).toBeCloseTo(37.45, 10)
    expect(bounds!.lngMin).toBeCloseTo(127.04, 10)
    expect(bounds!.lngMax).toBeCloseTo(127.18, 10)
  })

  it('멀리 떨어진 이상치는 박스에서 제외된다 (이슈 #26 시흥 인근 격자 사례)', () => {
    const grids = [...makeGrids(100), { lat: 37.37, lng: 126.54 }]
    const bounds = boundsFromGrids(grids)
    expect(bounds!.lngMin).toBeCloseTo(127.04, 10)
    // 이상치가 없는 축(lat)은 영향받지 않는다
    expect(bounds!.latMin).toBeCloseTo(37.3, 10)
    expect(bounds!.latMax).toBeCloseTo(37.45, 10)
  })
})
