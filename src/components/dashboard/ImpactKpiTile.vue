<script setup lang="ts">
import { computed } from 'vue'

export type ImpactKind = 'parking' | 'time' | 'carbon'

const props = defineProps<{
  kind: ImpactKind
  label: string
  value: number
  unit: string
  caption: string
}>()

const BADGES: Record<ImpactKind, string> = {
  parking: 'P',
  time: 'M',
  carbon: 'CO₂',
}

const badgeText = computed(() => BADGES[props.kind])

const formattedValue = computed(() =>
  Number.isInteger(props.value) ? props.value.toLocaleString() : props.value.toFixed(1),
)
</script>

<template>
  <div
    class="impact-tile"
    :class="`impact-tile--${kind}`"
  >
    <p class="impact-tile__label">
      {{ label }}
    </p>
    <p class="impact-tile__value">
      <strong>{{ formattedValue }}</strong>
      <span class="impact-tile__unit">{{ unit }}</span>
    </p>
    <p class="impact-tile__caption">
      {{ caption }}
    </p>
    <span
      class="impact-tile__badge"
      aria-hidden="true"
    >{{ badgeText }}</span>
  </div>
</template>

<style scoped lang="scss">
.impact-tile {
  position: relative;
  padding: $space-4;
  border-radius: $radius-md;

  &--parking {
    background: $color-primary-soft;

    .impact-tile__caption,
    .impact-tile__badge {
      color: $color-primary;
    }
  }

  &--time {
    background: $color-warning-soft;

    .impact-tile__caption,
    .impact-tile__badge {
      color: $color-warning;
    }
  }

  &--carbon {
    background: $color-success-soft;

    .impact-tile__caption,
    .impact-tile__badge {
      color: $color-success;
    }
  }

  &__label {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__value {
    display: flex;
    align-items: baseline;
    gap: $space-2;
    margin-top: $space-2;

    strong {
      font-size: 28px;
      font-weight: 700;
      color: $color-text;
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
    }
  }

  &__unit {
    font-size: $font-size-sm;
    font-weight: 500;
    color: $color-text;
  }

  &__caption {
    margin-top: $space-2;
    font-size: $font-size-xs;
    font-weight: 500;
  }

  &__badge {
    position: absolute;
    top: $space-4;
    right: $space-4;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: $color-surface;
    box-shadow: $shadow-card;
    font-size: $font-size-xs;
    font-weight: 700;
  }
}
</style>
