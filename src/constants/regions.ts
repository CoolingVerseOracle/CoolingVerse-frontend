import type { RegionCode } from '@/types/geo'

export interface RegionOption {
  code: RegionCode
  label: string
  center: { lat: number; lng: number }
  zoom: number
}

/**
 * 분석 대상 지역 — 지도 센터링과 시나리오 카드 지역 선택에 공용.
 * 분석 영역 바운딩박스는 상수가 아니라 지역별 grid-risk 응답에서 산출한다
 * (dashboard 스토어 gridBounds) — 지역이 추가되면 여기엔 센터·줌만 등록하면 된다.
 */
export const REGIONS: RegionOption[] = [
  { code: 'pangyo', label: '판교', center: { lat: 37.4004, lng: 127.1122 }, zoom: 14 },
  { code: 'bucheon', label: '부천', center: { lat: 37.5034, lng: 126.766 }, zoom: 13 },
  { code: 'sanbon', label: '군포 산본', center: { lat: 37.358, lng: 126.932 }, zoom: 14 },
  { code: 'ilsan', label: '고양 일산', center: { lat: 37.68, lng: 126.76 }, zoom: 13 },
]

export function regionByCode(code: RegionCode): RegionOption {
  return REGIONS.find((r) => r.code === code) ?? REGIONS[0]
}

export function isActiveRegion(code: string | null | undefined): code is RegionCode {
  return REGIONS.some((region) => region.code === code)
}

/** 구버전 백엔드 목록에는 regionCode가 없으므로 표시명까지 함께 판별한다. */
export function isExecutableScenarioRegion(
  code: string | null | undefined,
  displayName: string,
): boolean {
  if (code) return isActiveRegion(code)
  return (
    displayName === '판교' ||
    displayName === '판교테크노밸리' ||
    displayName === '부천' ||
    displayName === '군포 산본' ||
    displayName === '고양 일산'
  )
}

/** 분석 기준 월 선택지 — 항상 1–12월 전체. 연도는 고정(직전 년도 데이터 기준)이라 선택지 없음 */
export const ANALYSIS_MONTHS: number[] = Array.from({ length: 12 }, (_, i) => i + 1)
