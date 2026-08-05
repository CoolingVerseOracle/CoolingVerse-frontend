<script setup lang="ts">
const ITEMS = [
  { key: 'open', label: '개방 가능 지역' },
  { key: 'congested', label: '혼잡 지역' },
  { key: 'danger', label: '고위험' },
] as const
</script>

<template>
  <div class="map-legend">
    <span
      v-for="item in ITEMS"
      :key="item.key"
      class="map-legend__item"
    >
      <i
        class="map-legend__dot"
        :class="`map-legend__dot--${item.key}`"
      />
      {{ item.label }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.map-legend {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-2 $space-3;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.94);

  &__item {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    font-size: $font-size-xs;
    color: $color-text-secondary;
    white-space: nowrap;
  }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;

    &--open {
      background: $color-primary;
    }

    &--congested {
      background: $color-warning;
    }

    &--danger {
      background: $color-danger;
    }
  }
}
</style>
