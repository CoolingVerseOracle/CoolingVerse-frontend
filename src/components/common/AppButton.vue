<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    block?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', block: false, disabled: false, type: 'button' },
)
</script>

<template>
  <button
    class="app-button"
    :class="[`app-button--${variant}`, { 'app-button--block': block }]"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped lang="scss">
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: 10px $space-4;
  border-radius: $radius-sm;
  font-size: $font-size-base;
  font-weight: 500;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--block {
    width: 100%;
  }

  &--primary {
    background: $color-primary;
    color: #fff;

    &:hover:not(:disabled) {
      background: $color-primary-dark;
    }
  }

  &--secondary {
    background: $color-surface;
    color: $color-text;
    border: 1px solid $color-border;

    &:hover:not(:disabled) {
      border-color: $color-text-muted;
    }
  }

  &--ghost {
    background: transparent;
    color: $color-text-secondary;

    &:hover:not(:disabled) {
      color: $color-text;
    }
  }
}
</style>
