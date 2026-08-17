import { describe, expect, it } from 'vitest'
import { getRiskIndexLevel } from './riskLevels'

describe('getRiskIndexLevel', () => {
  it.each([
    [74, '위험', '#dc2626'],
    [62, '경계', '#f97316'],
    [54, '주의', '#eab308'],
    [40, '정상', '#16a34a'],
    [39.9, '원활', '#1e90ff'],
  ])('경계값 %s을(를) %s 레벨로 매핑한다', (score, label, color) => {
    const level = getRiskIndexLevel(score)

    expect(level.label).toBe(label)
    expect(level.color).toBe(color)
  })

  it.each([
    [73.9, '경계'],
    [61.9, '주의'],
    [53.9, '정상'],
    [0, '원활'],
    [100, '위험'],
  ])('모든 점수는 정확히 하나의 레벨로 매핑한다', (score, label) => {
    expect(getRiskIndexLevel(score).label).toBe(label)
  })
})
