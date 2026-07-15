<script setup lang="ts">
import { computed } from 'vue'
import BaseChart from './BaseChart.vue'
import { chartColors } from '@/composables/useEchartsTheme'
import type { ParticipationBreakdown } from '@/types/simulation'
import type { EChartsOption } from 'echarts'

const props = defineProps<{ data: ParticipationBreakdown }>()

const segmentColors = [chartColors.primary, chartColors.orange, '#dbe2ec']

const option = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', valueFormatter: (v) => `${v}%` },
  legend: {
    bottom: 0,
    icon: 'circle',
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { color: chartColors.text, fontSize: 12 },
  },
  series: [
    {
      type: 'pie',
      radius: ['62%', '80%'],
      center: ['50%', '44%'],
      label: { show: false },
      data: props.data.segments.map((seg, i) => ({
        name: seg.label,
        value: seg.value,
        itemStyle: { color: segmentColors[i % segmentColors.length] },
      })),
    },
  ],
}))
</script>

<template>
  <div class="participation-donut">
    <BaseChart
      :option="option"
      :height="240"
    />
    <div class="participation-donut__center">
      <strong class="participation-donut__rate">{{ data.rate }}%</strong>
      <span class="participation-donut__label">지원율</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.participation-donut {
  position: relative;

  &__center {
    position: absolute;
    // 도넛 중심(50%, 44%)에 맞춰 배치
    top: calc(44% - 4px);
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
  }

  &__rate {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-text;
  }

  &__label {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }
}
</style>
