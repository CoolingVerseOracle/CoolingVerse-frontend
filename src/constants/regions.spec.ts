import { describe, expect, it } from 'vitest'
import { expandBounds } from './regions'
import type { GeoBounds } from '@/types/geo'

describe('expandBounds', () => {
  const base: GeoBounds = { latMin: 37.3, latMax: 37.4, lngMin: 127.0, lngMax: 127.2 }

  it('중심을 고정한 채 가로·세로 폭을 배율만큼 키운다', () => {
    const expanded = expandBounds(base, 2)
    expect(expanded.latMax - expanded.latMin).toBeCloseTo(0.2, 10)
    expect(expanded.lngMax - expanded.lngMin).toBeCloseTo(0.4, 10)
    // 중심 불변
    expect((expanded.latMin + expanded.latMax) / 2).toBeCloseTo(37.35, 10)
    expect((expanded.lngMin + expanded.lngMax) / 2).toBeCloseTo(127.1, 10)
  })

  it('배율 1이면 원본과 같다', () => {
    const same = expandBounds(base, 1)
    expect(same.latMin).toBeCloseTo(base.latMin, 10)
    expect(same.latMax).toBeCloseTo(base.latMax, 10)
    expect(same.lngMin).toBeCloseTo(base.lngMin, 10)
    expect(same.lngMax).toBeCloseTo(base.lngMax, 10)
  })
})
