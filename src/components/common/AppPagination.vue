<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  total: number
  pageSize: number
}>()

const page = defineModel<number>({ default: 1 })

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

// 첫/끝 페이지 + 현재 페이지 ±2만 노출하고 사이 간격은 … 으로 축약
const pages = computed<(number | 'ellipsis')[]>(() => {
  const count = pageCount.value
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)

  const shown = new Set([1, count])
  for (let p = page.value - 2; p <= page.value + 2; p++) {
    if (p >= 1 && p <= count) shown.add(p)
  }

  const result: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of [...shown].sort((a, b) => a - b)) {
    if (p - prev === 2) result.push(prev + 1)
    else if (p - prev > 2) result.push('ellipsis')
    result.push(p)
    prev = p
  }
  return result
})
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
    <template
      v-for="(p, i) in pages"
      :key="typeof p === 'number' ? p : `ellipsis-${i}`"
    >
      <button
        v-if="typeof p === 'number'"
        class="app-pagination__page"
        :class="{ 'app-pagination__page--active': p === page }"
        type="button"
        @click="page = p"
      >
        {{ p }}
      </button>
      <span
        v-else
        class="app-pagination__ellipsis"
        aria-hidden="true"
      >…</span>
    </template>
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

  &__ellipsis {
    min-width: 28px;
    text-align: center;
    font-size: $font-size-sm;
    color: $color-text-secondary;
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
