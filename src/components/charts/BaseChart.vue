<script setup lang="ts">
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import type { EChartsOption } from 'echarts'

use([CanvasRenderer, BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent])

withDefaults(defineProps<{ option: EChartsOption; height?: number }>(), { height: 220 })
</script>

<template>
  <VChart
    class="base-chart"
    :option="option"
    :style="{ height: `${height}px` }"
    autoresize
  />
</template>

<style scoped lang="scss">
.base-chart {
  width: 100%;
}
</style>
