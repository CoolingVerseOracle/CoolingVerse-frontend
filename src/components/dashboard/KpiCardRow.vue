<script setup lang="ts">
import KpiCard from './KpiCard.vue'
import type { KpiMetric } from '@/types/simulation'

defineProps<{ metrics: KpiMetric[] }>()
</script>

<template>
  <div class="kpi-card-row">
    <KpiCard
      v-for="metric in metrics"
      :key="metric.id"
      :metric="metric"
    />
  </div>
</template>

<style scoped lang="scss">
.kpi-card-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: $space-4;

  @include below($bp-lg) {
    grid-template-columns: repeat(3, 1fr);
  }

  @include below($bp-md) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include below($bp-sm) {
    grid-template-columns: 1fr;
  }
}
</style>
