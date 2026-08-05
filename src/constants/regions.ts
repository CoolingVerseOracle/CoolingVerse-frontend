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

/** 분석 기준 월 선택지 — 현재 데이터셋은 10월 시드 기준 */
export const ANALYSIS_MONTHS = [10, 11, 12] as const
