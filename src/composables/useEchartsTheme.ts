/** 차트 공통 색상/옵션 — SCSS 토큰(_variables.scss)과 동일한 값 */
export const chartColors = {
  primary: '#1e90ff',
  primaryDark: '#1565d8',
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#f59e0b',
  orange: '#f97316',
  muted: '#94a3b8',
  gridLine: '#e2e8f0',
  text: '#121c2a',
  textMuted: '#94a3b8',
} as const

export function useEchartsTheme() {
  const baseTextStyle = {
    color: chartColors.textMuted,
    fontSize: 12,
    fontFamily:
      "'Pretendard Variable', Pretendard, -apple-system, system-ui, 'Noto Sans KR', sans-serif",
  }

  const axisCommon = {
    axisLine: { lineStyle: { color: chartColors.gridLine } },
    axisTick: { show: false },
    axisLabel: { color: chartColors.textMuted, fontSize: 12 },
    splitLine: { lineStyle: { color: chartColors.gridLine } },
  }

  return { baseTextStyle, axisCommon }
}
