<script setup lang="ts">
import { computed } from 'vue'
import BaseChart from './BaseChart.vue'
import { chartColors, useEchartsTheme } from '@/composables/useEchartsTheme'
import type { ChartPoint } from '@/types/simulation'
import type { EChartsOption } from 'echarts'

const props = defineProps<{ data: ChartPoint[] }>()

const { axisCommon } = useEchartsTheme()

const option = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis', valueFormatter: (v) => `${v}면` },
  grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
  xAxis: {
    type: 'category',
    data: props.data.map((p) => p.label),
    boundaryGap: false,
    ...axisCommon,
  },
  yAxis: { type: 'value', ...axisCommon },
  series: [
    {
      type: 'line',
      data: props.data.map((p) => p.value),
      smooth: false,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      lineStyle: { color: chartColors.primary, width: 2.5 },
      itemStyle: { color: chartColors.primary },
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
