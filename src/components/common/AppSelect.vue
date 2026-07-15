<script setup lang="ts">
import type { SelectOption } from '@/types/common'

defineProps<{
  options: SelectOption[]
  /** 셀렉트 앞에 붙는 라벨 (지역 전체 등 필터형 표기용) */
  ariaLabel?: string
}>()

const model = defineModel<string>({ default: '' })
</script>

<template>
  <select
    v-model="model"
    class="app-select"
    :aria-label="ariaLabel"
  >
    <option
      v-for="opt in options"
      :key="opt.value"
      :value="opt.value"
    >
      {{ opt.label }}
    </option>
  </select>
</template>

<style scoped lang="scss">
.app-select {
  appearance: none;
  padding: 9px 32px 9px $space-3;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5' fill='none' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")
    right 10px center no-repeat;
  background-color: $color-surface;
  font-size: $font-size-base;
  color: $color-text;
  cursor: pointer;

  &:focus {
    @include focus-ring;
  }
}
</style>
