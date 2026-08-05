<script setup lang="ts">
import type { SelectOption } from '@/types/common'

defineProps<{
  options: SelectOption[]
  /** 칩 앞에 붙는 파란 라벨 (예: "지역") */
  prefix?: string
  /** kebab(aria-label)으로 전달 — AppSelect과 동일한 패턴 */
  ariaLabel?: string
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <label class="chip-select">
    <span
      v-if="prefix"
      class="chip-select__prefix"
    >{{ prefix }}</span>
    <select
      v-model="model"
      class="chip-select__select"
      :aria-label="ariaLabel"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <span
      class="chip-select__caret"
      aria-hidden="true"
    >▾</span>
  </label>
</template>

<style scoped lang="scss">
.chip-select {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-2;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  background: $color-primary-soft;
  cursor: pointer;

  &:focus-within {
    @include focus-ring;
  }

  &__prefix {
    font-size: $font-size-xs;
    font-weight: 500;
    color: $color-primary;
    white-space: nowrap;
  }

  &__select {
    appearance: none;
    border: none;
    background: transparent;
    font-size: $font-size-xs;
    font-weight: 500;
    color: $color-text;
    cursor: pointer;
    outline: none;
  }

  &__caret {
    font-size: $font-size-xs;
    color: $color-primary;
  }
}
</style>
