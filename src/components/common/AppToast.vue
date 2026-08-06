<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <div
      class="app-toast"
      aria-live="polite"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="app-toast__item"
          :class="`app-toast__item--${toast.tone}`"
          role="status"
        >
          <span class="app-toast__message">{{ toast.message }}</span>
          <button
            class="app-toast__close"
            type="button"
            aria-label="알림 닫기"
            @click="dismiss(toast.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.app-toast {
  position: fixed;
  bottom: $space-4;
  left: 50%;
  transform: translateX(-50%);
  z-index: 110; // AppModal(100) 위 — 모달이 떠 있어도 알림이 보인다
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  pointer-events: none;

  &__item {
    display: flex;
    align-items: center;
    gap: $space-3;
    max-width: 420px;
    padding: $space-3 $space-4;
    border-radius: $radius-md;
    background: $color-text;
    color: $color-surface;
    font-size: $font-size-sm;
    box-shadow: 0 8px 24px rgb(15 23 42 / 25%);
    pointer-events: auto;

    &--success {
      border-left: 4px solid $color-success;
    }

    &--error {
      border-left: 4px solid $color-danger;
    }
  }

  &__message {
    line-height: 1.5;
  }

  &__close {
    flex-shrink: 0;
    color: $color-surface;
    opacity: 0.7;

    &:hover {
      opacity: 1;
    }
  }
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
