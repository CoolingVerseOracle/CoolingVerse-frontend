<script setup lang="ts">
import BeforeAfterBars from '@/components/charts/BeforeAfterBars.vue'
import type { BeforeAfterMetric } from '@/types/simulation'

defineProps<{ metrics: BeforeAfterMetric[] }>()
</script>

<template>
  <section class="metric-change-panel">
    <header class="metric-change-panel__header">
      <span
        class="metric-change-panel__icon"
        aria-hidden="true"
      >📊</span>
      <h3 class="metric-change-panel__title">
        주요 지표 변화
      </h3>
    </header>
    <div class="metric-change-panel__body">
      <BeforeAfterBars
        v-for="metric in metrics"
        :key="metric.id"
        :metric="metric"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.metric-change-panel {
  @include card;
  padding: $space-4;

  &__header {
    display: flex;
    align-items: center;
    gap: $space-2;
    margin-bottom: $space-4;
  }

  &__icon {
    color: $color-primary;
  }

  &__title {
    font-size: $font-size-base;
    font-weight: 600;
    color: $color-text;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $space-6;
  }
}
</style>
