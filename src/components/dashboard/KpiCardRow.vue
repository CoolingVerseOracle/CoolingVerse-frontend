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

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
