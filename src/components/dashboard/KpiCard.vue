<script setup lang="ts">
import StatusPill from '@/components/common/StatusPill.vue'
import type { KpiMetric } from '@/types/simulation'

defineProps<{ metric: KpiMetric }>()
</script>

<template>
  <article class="kpi-card">
    <p class="kpi-card__label">
      {{ metric.label }}
    </p>
    <p class="kpi-card__value">
      <strong>{{ metric.value }}</strong>
      <span
        v-if="metric.unit"
        class="kpi-card__unit"
      >{{ metric.unit }}</span>
      <s
        v-if="metric.baseline !== undefined"
        class="kpi-card__baseline"
      >{{ metric.baseline }}</s>
    </p>
    <StatusPill :tone="metric.tone">
      {{ metric.badge }}
    </StatusPill>
  </article>
</template>

<style scoped lang="scss">
.kpi-card {
  @include card;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-4;

  &__label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }

  &__value {
    display: flex;
    align-items: baseline;
    gap: $space-1;

    strong {
      font-size: $font-size-kpi;
      font-weight: 700;
      color: $color-text;
      line-height: 1.1;
    }
  }

  &__unit {
    font-size: $font-size-base;
    color: $color-text;
  }

  &__baseline {
    margin-left: $space-1;
    font-size: $font-size-base;
    color: $color-text-muted;
  }
}
</style>
