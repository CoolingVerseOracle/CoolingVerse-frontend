<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    type?: 'text' | 'password' | 'search' | 'number'
    placeholder?: string
    /** password 타입일 때 표시/숨김 토글 노출 */
    revealable?: boolean
  }>(),
  { type: 'text', placeholder: '', revealable: false },
)

const model = defineModel<string | number>({ default: '' })
const revealed = ref(false)

function currentType(): string {
  if (props.type === 'password' && revealed.value) return 'text'
  return props.type
}
</script>

<template>
  <div class="app-input">
    <span
      v-if="$slots.icon"
      class="app-input__icon"
    >
      <slot name="icon" />
    </span>
    <input
      v-model="model"
      class="app-input__field"
      :class="{ 'app-input__field--with-icon': $slots.icon }"
      :type="currentType()"
      :placeholder="placeholder"
    >
    <button
      v-if="type === 'password' && revealable"
      class="app-input__reveal"
      type="button"
      :aria-label="revealed ? '비밀번호 숨기기' : '비밀번호 표시'"
      @click="revealed = !revealed"
    >
      <slot
        name="reveal-icon"
        :revealed="revealed"
      />
    </button>
  </div>
</template>

<style scoped lang="scss">
.app-input {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;

  &__icon {
    position: absolute;
    left: $space-3;
    display: inline-flex;
    align-items: center;
    pointer-events: none;
  }

  &__field {
    width: 100%;
    padding: 11px $space-3;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    background: $color-surface;
    font-size: $font-size-base;
    color: $color-text;

    &::placeholder {
      color: $color-text-muted;
    }

    &:focus {
      @include focus-ring;
    }

    &--with-icon {
      padding-left: 41px;
    }
  }

  &__reveal {
    position: absolute;
    right: $space-3;
    display: inline-flex;
    align-items: center;
    color: $color-text-muted;
  }
}
</style>
