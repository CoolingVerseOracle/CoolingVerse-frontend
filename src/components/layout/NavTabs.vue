<script setup lang="ts">
const tabs = [
  { name: 'dashboard', label: '대시보드' },
  { name: 'scenarios', label: '시나리오 관리' },
]

// v2.1 디자인의 세 번째 메뉴 — 라우트 신설 전까지 비활성 표기만 한다
const disabledTabs = [{ label: '분석 기준' }]
</script>

<template>
  <nav
    class="nav-tabs"
    aria-label="주요 메뉴"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.name"
      class="nav-tabs__tab"
      active-class="nav-tabs__tab--active"
      :to="{ name: tab.name }"
    >
      {{ tab.label }}
    </RouterLink>
    <span
      v-for="tab in disabledTabs"
      :key="tab.label"
      class="nav-tabs__tab nav-tabs__tab--disabled"
      aria-disabled="true"
      title="준비 중"
    >
      {{ tab.label }}
    </span>
  </nav>
</template>

<style scoped lang="scss">
.nav-tabs {
  display: flex;
  gap: $space-6;

  &__tab {
    padding: $space-2 0;
    font-size: $font-size-base;
    color: $color-text-secondary;
    border-bottom: 2px solid transparent;

    &:hover {
      color: $color-text;
    }

    &--active {
      color: $color-primary;
      font-weight: 600;
      border-bottom-color: $color-primary;
    }

    &--disabled {
      color: $color-text-muted;
      cursor: not-allowed;

      &:hover {
        color: $color-text-muted;
      }
    }
  }
}
</style>
