<script setup lang="ts">
defineProps<{ title: string }>()

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <div
      class="app-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      @click.self="emit('close')"
      @keydown.esc="emit('close')"
    >
      <div class="app-modal__card">
        <header class="app-modal__header">
          <h3 class="app-modal__title">
            {{ title }}
          </h3>
          <button
            class="app-modal__close"
            type="button"
            aria-label="닫기"
            @click="emit('close')"
          >
            ✕
          </button>
        </header>
        <div class="app-modal__body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.app-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
  background: rgb(15 23 42 / 45%);

  &__card {
    width: 100%;
    max-width: 420px;
    background: $color-surface;
    border-radius: $radius-md;
    box-shadow: 0 20px 40px rgb(15 23 42 / 20%);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-4;
    border-bottom: 1px solid $color-border;
  }

  &__title {
    font-size: $font-size-base;
    font-weight: 600;
    color: $color-text;
  }

  &__close {
    color: $color-text-muted;

    &:hover {
      color: $color-text;
    }
  }

  &__body {
    padding: $space-4;
  }
}
</style>
