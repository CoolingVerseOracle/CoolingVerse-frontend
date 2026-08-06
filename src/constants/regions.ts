import type { GeoBounds, RegionCode } from '@/types/geo'

export interface RegionOption {
  code: RegionCode
  label: string
  center: { lat: number; lng: number }
  zoom: number
  /** 분석 데이터(핵심격자) 바운딩박스 — 경계 실선·영역 외 표시·이동 제한의 기준 */
  bounds: GeoBounds
}

/** 분석 대상 지역 — 지도 센터링과 시나리오 카드 지역 선택에 공용 */
export const REGIONS: RegionOption[] = [
  {
    code: 'pangyo',
    label: '판교',
    center: { lat: 37.4004, lng: 127.1122 },
    zoom: 14,
    // 백엔드 실측 핵심격자 1,306개 바운딩박스 — 분당 밖 이상치 3개 제외 (이슈 #26 코멘트)
    bounds: { latMin: 37.3036, latMax: 37.447, lngMin: 127.0424, lngMax: 127.1771 },
  },
  {
    code: 'ingye',
    label: '수원 인계동',
    center: { lat: 37.2635, lng: 127.0323 },
    zoom: 14,
    // 백엔드 데이터 미보유 지역 — 폴백 격자 범위(gridRiskFallback)와 동일
    bounds: { latMin: 37.256, latMax: 37.272, lngMin: 127.024, lngMax: 127.044 },
  },
]

/** 이동 제한 박스 확장 배율 — 인접 맥락을 볼 수 있게 느슨하게 제한 (이슈 #26 C안, 1.5~2배의 중간값) */
export const MAX_BOUNDS_EXPAND = 1.75

/** 중심을 고정한 채 가로·세로 폭을 배율만큼 키운 바운딩박스 */
export function expandBounds(bounds: GeoBounds, factor: number): GeoBounds {
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

export function regionByCode(code: RegionCode): RegionOption {
  return REGIONS.find((r) => r.code === code) ?? REGIONS[0]
}

/** 분석 기준 월 선택지 — 항상 1–12월 전체. 연도는 고정(직전 년도 데이터 기준)이라 선택지 없음 */
export const ANALYSIS_MONTHS: number[] = Array.from({ length: 12 }, (_, i) => i + 1)
