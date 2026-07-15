<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  total: number
  pageSize: number
}>()

const page = defineModel<number>({ default: 1 })

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const pages = computed(() => Array.from({ length: pageCount.value }, (_, i) => i + 1))
</script>

<template>
  <nav
    class="app-pagination"
    aria-label="페이지네이션"
  >
    <button
      class="app-pagination__nav"
      type="button"
      :disabled="page <= 1"
      aria-label="이전 페이지"
      @click="page = page - 1"
    >
      ‹
    </button>
    <button
      v-for="p in pages"
      :key="p"
      class="app-pagination__page"
      :class="{ 'app-pagination__page--active': p === page }"
      type="button"
      @click="page = p"
    >
      {{ p }}
    </button>
    <button
      class="app-pagination__nav"
      type="button"
      :disabled="page >= pageCount"
      aria-label="다음 페이지"
      @click="page = page + 1"
    >
      ›
    </button>
  </nav>
</template>

<style scoped lang="scss">
.app-pagination {
  display: inline-flex;
  align-items: center;
  gap: $space-1;

  &__nav,
  &__page {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 $space-1;
    border-radius: $radius-sm;
    font-size: $font-size-sm;
    color: $color-text-secondary;

    &:hover:not(:disabled) {
      background: $color-bg;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__page--active {
    background: $color-primary;
    color: #fff;

    &:hover {
      background: $color-primary;
    }
  }
}
</style>
