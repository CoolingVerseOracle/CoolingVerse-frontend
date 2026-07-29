<script setup lang="ts">
import { computed } from 'vue'
import { chartColors } from '@/composables/useEchartsTheme'
import type { BeforeAfterMetric } from '@/types/simulation'
import type { MetricTone } from '@/types/common'

const props = defineProps<{ metric: BeforeAfterMetric }>()

const toneColor: Record<MetricTone, string> = {
  positive: chartColors.primary,
  negative: chartColors.danger,
  warning: chartColors.orange,
  neutral: chartColors.muted,
}

const max = computed(() => Math.max(props.metric.before, props.metric.after))
// before/after가 모두 0이면 0으로 나눠 NaN% 가 되므로 너비 0으로 방어
const beforeWidth = computed(() => (max.value === 0 ? 0 : (props.metric.before / max.value) * 100))
const afterWidth = computed(() => (max.value === 0 ? 0 : (props.metric.after / max.value) * 100))
const afterColor = computed(() => toneColor[props.metric.tone])
</script>

<template>
  <div class="before-after">
    <div class="before-after__head">
      <span class="before-after__label">{{ metric.label }}</span>
      <span
        class="before-after__delta"
        :style="{ color: afterColor }"
      >{{ metric.deltaLabel }}</span>
    </div>
    <div class="before-after__bars">
      <div
        class="before-after__bar before-after__bar--before"
        :style="{ width: `${beforeWidth}%` }"
      />
      <div
        class="before-after__bar"
        :style="{ width: `${afterWidth}%`, background: afterColor }"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.before-after {
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $space-2;
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }

  &__delta {
    font-size: $font-size-sm;
    font-weight: 600;
  }

  &__bars {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  &__bar {
    height: 12px;
    border-radius: 3px;

    &--before {
      background: #cbd5e1;
    }
  }
}
</style>
