import type { RegionCode } from '@/types/geo'

export interface RegionOption {
  code: RegionCode
  label: string
  center: { lat: number; lng: number }
  zoom: number
}

/** 분석 대상 지역 — 지도 센터링과 시나리오 카드 지역 선택에 공용 */
export const REGIONS: RegionOption[] = [
  { code: 'pangyo', label: '판교', center: { lat: 37.4004, lng: 127.1122 }, zoom: 14 },
  { code: 'ingye', label: '수원 인계동', center: { lat: 37.2635, lng: 127.0323 }, zoom: 14 },
]

export function regionByCode(code: RegionCode): RegionOption {
  return REGIONS.find((r) => r.code === code) ?? REGIONS[0]
}

/** 분석 기준 월 선택지 — 항상 1–12월 전체. 연도는 고정(직전 년도 데이터 기준)이라 선택지 없음 */
export const ANALYSIS_MONTHS: number[] = Array.from({ length: 12 }, (_, i) => i + 1)
