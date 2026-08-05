<script setup lang="ts">
import HourChip from './HourChip.vue'

defineProps<{ hour: number }>()

const heatmap = defineModel<boolean>('heatmap', { required: true })
const cluster = defineModel<boolean>('cluster', { required: true })
</script>

<template>
  <div class="map-layer-controls">
    <button
      type="button"
      class="map-layer-controls__toggle"
      :class="{ 'map-layer-controls__toggle--active': heatmap }"
      :aria-pressed="heatmap"
      @click="heatmap = !heatmap"
    >
      히트맵
    </button>
    <button
      type="button"
      class="map-layer-controls__toggle"
      :class="{ 'map-layer-controls__toggle--active': cluster }"
      :aria-pressed="cluster"
      @click="cluster = !cluster"
    >
      클러스터
    </button>
    <HourChip
      class="map-layer-controls__hour"
      :hour="hour"
    />
  </div>
</template>

<style scoped lang="scss">
.map-layer-controls {
  display: flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.95);

  &__toggle {
    padding: $space-1 $space-3;
    border: none;
    border-radius: $radius-sm;
    background: $color-primary-soft;
    color: $color-primary;
    font-size: $font-size-xs;
    font-weight: 500;
    cursor: pointer;

    &--active {
      background: $color-primary;
      color: #fff;
    }

    &:focus-visible {
      @include focus-ring;
    }
  }

  &__hour {
    margin-left: $space-1;
    background: $color-surface;
    border: 1px solid $color-border;
    color: $color-text;
  }
}
</style>
