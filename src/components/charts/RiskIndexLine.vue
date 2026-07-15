<script setup lang="ts">
import { computed } from 'vue'
import BaseChart from './BaseChart.vue'
import { chartColors, useEchartsTheme } from '@/composables/useEchartsTheme'
import type { SimulationResult } from '@/types/simulation'
import type { EChartsOption } from 'echarts'

const props = defineProps<{ data: SimulationResult['riskTrend'] }>()

const { axisCommon } = useEchartsTheme()

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
  yAxis: { type: 'value', min: 60, ...axisCommon },
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
