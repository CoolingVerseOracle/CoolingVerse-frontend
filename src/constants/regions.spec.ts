import { describe, expect, it } from 'vitest'
import { isExecutableScenarioRegion } from './regions'

describe('시나리오 지역 하위 호환성', () => {
  it('구버전 백엔드가 regionCode를 주지 않아도 판교 시나리오는 실행 가능하다', () => {
    expect(isExecutableScenarioRegion(undefined, '판교테크노밸리')).toBe(true)
    expect(isExecutableScenarioRegion(undefined, '판교')).toBe(true)
  })

  it('인계동 과거 이력은 regionCode 유무와 무관하게 실행하지 않는다', () => {
    expect(isExecutableScenarioRegion(undefined, '수원 인계동')).toBe(false)
    expect(isExecutableScenarioRegion('ingye', '수원 인계동')).toBe(false)
  })

  it('신규 부천 자연키는 실행 가능하다', () => {
    expect(isExecutableScenarioRegion('bucheon', '부천')).toBe(true)
  })
})
