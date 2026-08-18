import { describe, expect, it } from 'vitest'
import { ANALYSIS_MONTHS, isExecutableScenarioRegion } from './regions'

describe('시나리오 지역 하위 호환성', () => {
  it('구버전 백엔드가 regionCode를 주지 않아도 판교 시나리오는 실행 가능하다', () => {
    expect(isExecutableScenarioRegion(undefined, '판교테크노밸리')).toBe(true)
    expect(isExecutableScenarioRegion(undefined, '판교')).toBe(true)
    expect(isExecutableScenarioRegion(undefined, '성남 분당')).toBe(true)
  })

  it('인계동 과거 이력은 regionCode 유무와 무관하게 실행하지 않는다', () => {
    expect(isExecutableScenarioRegion(undefined, '수원 인계동')).toBe(false)
    expect(isExecutableScenarioRegion('ingye', '수원 인계동')).toBe(false)
  })

  it('신규 부천 자연키는 실행 가능하다', () => {
    expect(isExecutableScenarioRegion('bucheon', '부천')).toBe(true)
  })

  it('1기 신도시 비교지역(산본·일산)은 코드·표시명 모두 실행 가능하다', () => {
    expect(isExecutableScenarioRegion('sanbon', '군포 산본')).toBe(true)
    expect(isExecutableScenarioRegion('ilsan', '고양 일산')).toBe(true)
    expect(isExecutableScenarioRegion(undefined, '군포 산본')).toBe(true)
  })

  it('안양 평촌은 코드·표시명 모두 실행 가능하다', () => {
    expect(isExecutableScenarioRegion('pyeongchon', '안양 평촌')).toBe(true)
    expect(isExecutableScenarioRegion(undefined, '안양 평촌')).toBe(true)
  })
})

describe('분석 기준 월 선택지', () => {
  it('월별 데이터 적재 전까지 10월만 노출한다 (이슈 #42 임시 조치)', () => {
    expect(ANALYSIS_MONTHS).toEqual([10])
  })
})
