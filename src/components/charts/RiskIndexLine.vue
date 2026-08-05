<script setup lang="ts">
import { computed } from 'vue'
import BaseChart from './BaseChart.vue'
import { chartColors, useEchartsTheme } from '@/composables/useEchartsTheme'
import type { SimulationResult } from '@/types/simulation'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: SimulationResult['riskTrend']
  /** 24H 스크러버 선택 시간 — 지정 시 해당 라벨 위치에 세로 마커 표시 */
  selectedHour?: number
}>()

const { axisCommon } = useEchartsTheme()

// 라벨이 24개가 아닐 수 있어(예: "00시/06시…" 희소 라벨) 시간 비율로 가장 가까운 라벨에 스냅한다
const markLabel = computed<string | null>(() => {
  if (props.selectedHour == null || !props.data.labels.length) return null
  const count = props.data.labels.length
  if (count === 24) return props.data.labels[props.selectedHour]
  const index = Math.round((props.selectedHour / 23) * (count - 1))
  return props.data.labels[index]
})

const option = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: {
    bottom: 0,
    icon: 'rect',
    itemWidth: 14,
    itemHeight: 2,
    textStyle: { color: chartColors.text, fontSize: 12 },
  },
  grid: { left: 8, right: 16, top: 16, bottom: 32, containLabel: true },
  xAxis: { type: 'category', data: props.data.labels, boundaryGap: false, ...axisCommon },
  yAxis: { type: 'value', scale: true, ...axisCommon },
  series: [
    {
      name: '현재',
      type: 'line',
      data: props.data.current,
      lineStyle: { color: chartColors.danger, width: 2, type: 'dashed' },
      itemStyle: { color: chartColors.danger },
      showSymbol: false,
    },
    {
      name: '시나리오 적용',
      type: 'line',
      data: props.data.projected,
      lineStyle: { color: chartColors.success, width: 2.5 },
      itemStyle: { color: chartColors.success },
      showSymbol: false,
      ...(markLabel.value != null && {
        markLine: {
          silent: true,
          symbol: 'none',
          label: { show: false },
          lineStyle: { color: chartColors.primary, type: 'solid', width: 1.5 },
          data: [{ xAxis: markLabel.value }],
        },
      }),
    },
  ],
}))
</script>

<template>
  <BaseChart
    :option="option"
    :height="240"
  />
</template>
