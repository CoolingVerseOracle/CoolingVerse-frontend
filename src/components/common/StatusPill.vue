<script setup lang="ts">
import type { MetricTone } from '@/types/common'

withDefaults(defineProps<{ tone?: MetricTone }>(), { tone: 'neutral' })
</script>

<template>
  <span
    class="status-pill"
    :class="`status-pill--${tone}`"
  >
    <slot />
  </span>
</template>

<style scoped lang="scss">
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $font-size-xs;
  font-weight: 500;

  &--positive {
    color: $color-success;
  }

  &--negative {
    color: $color-danger;
  }

  &--warning {
    color: $color-warning;
  }

  &--neutral {
    color: $color-primary;
  }
}
</style>
