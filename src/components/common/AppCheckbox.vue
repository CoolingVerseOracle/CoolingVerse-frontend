<script setup lang="ts">
defineProps<{ label?: string }>()

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="app-checkbox">
    <input
      v-model="model"
      class="app-checkbox__input"
      type="checkbox"
    >
    <span
      v-if="label"
      class="app-checkbox__label"
    >{{ label }}</span>
  </label>
</template>

<style scoped lang="scss">
.app-checkbox {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  cursor: pointer;

  &__input {
    width: 16px;
    height: 16px;
    accent-color: $color-primary;
    cursor: pointer;
  }

  &__label {
    font-size: $font-size-base;
    color: $color-text;
  }
}
</style>
