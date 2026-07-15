<script setup lang="ts">
import AppSelect from '@/components/common/AppSelect.vue'
import type { SelectOption } from '@/types/common'

const regions: SelectOption[] = [
  { label: '판교테크노벨리', value: 'pangyo' },
  { label: '수원 인계동', value: 'ingye' },
]

const model = defineModel<string>({ default: 'pangyo' })
</script>

<template>
  <div class="region-selector">
    <span
      class="region-selector__pin"
      aria-hidden="true"
    >📍</span>
    <AppSelect
      v-model="model"
      :options="regions"
      aria-label="지역 선택"
    />
  </div>
</template>

<style scoped lang="scss">
.region-selector {
  display: inline-flex;
  align-items: center;
  gap: $space-1;

  &__pin {
    font-size: $font-size-sm;
  }
}
</style>
