import { describe, expect, it } from 'vitest'
import { CLUSTER_BASE_CELL, CLUSTER_BASE_ZOOM, bucketGrids, cellSizeForZoom } from './clusterGrids'

describe('cellSizeForZoom', () => {
  it('기준 줌에서는 기준 셀 크기를 그대로 쓴다', () => {
    expect(cellSizeForZoom(CLUSTER_BASE_ZOOM)).toBe(CLUSTER_BASE_CELL)
  })

  it('줌 1단계 확대마다 셀이 절반으로 세분화된다', () => {
    expect(cellSizeForZoom(CLUSTER_BASE_ZOOM + 1)).toBeCloseTo(CLUSTER_BASE_CELL / 2, 10)
    expect(cellSizeForZoom(CLUSTER_BASE_ZOOM + 2)).toBeCloseTo(CLUSTER_BASE_CELL / 4, 10)
    expect(cellSizeForZoom(CLUSTER_BASE_ZOOM - 1)).toBeCloseTo(CLUSTER_BASE_CELL * 2, 10)
  })

  it('극단 줌에서는 상·하한으로 고정된다', () => {
    expect(cellSizeForZoom(6)).toBe(0.032)
    expect(cellSizeForZoom(21)).toBe(0.000125)
  })
})

describe('bucketGrids', () => {
  it('같은 셀의 격자를 하나로 묶어 평균 좌표·평균/최대 지수를 집계한다', () => {
    const buckets = bucketGrids(
      [
        { lat: 37.4001, lng: 127.1121, score: 40 },
        { lat: 37.4003, lng: 127.1123, score: 60 },
      ],
      0.004,
    )
    expect(buckets).toHaveLength(1)
    expect(buckets[0].count).toBe(2)
    expect(buckets[0].lat).toBeCloseTo(37.4002, 10)
    expect(buckets[0].lng).toBeCloseTo(127.1122, 10)
    expect(buckets[0].meanScore).toBe(50)
    expect(buckets[0].maxScore).toBe(60)
  })

  it('셀 경계를 넘는 격자는 서로 다른 버킷이 된다', () => {
    const buckets = bucketGrids(
      [
        { lat: 37.4001, lng: 127.1121, score: 40 },
        { lat: 37.4041, lng: 127.1121, score: 60 },
      ],
      0.004,
    )
    expect(buckets).toHaveLength(2)
  })

  it('셀이 작아지면 같은 격자 집합이 더 잘게 나뉜다', () => {
    const points = Array.from({ length: 16 }, (_, i) => ({
      lat: 37.4 + 0.0006 * Math.floor(i / 4),
      lng: 127.11 + 0.0006 * (i % 4),
      score: 50,
    }))
    const coarse = bucketGrids(points, cellSizeForZoom(14))
    const fine = bucketGrids(points, cellSizeForZoom(17))
    expect(coarse.length).toBeLessThan(fine.length)
    // 셀(0.0005°)이 격자 간격(0.0006°)보다 작아지면 전부 개별 격자로 풀린다
    expect(fine).toHaveLength(points.length)
  })

  it('빈 입력이면 빈 배열을 돌려준다', () => {
    expect(bucketGrids([], 0.004)).toEqual([])
  })
})
