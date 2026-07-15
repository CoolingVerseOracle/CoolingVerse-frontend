<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import NavTabs from './NavTabs.vue'
import RegionSelector from './RegionSelector.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const region = ref('pangyo')

function onLogout(): void {
  auth.logout()
  void router.push({ name: 'login' })
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <h1 class="app-header__title">
        유휴 주차자원 활용 정책 시뮬레이션 플랫폼
      </h1>
      <NavTabs class="app-header__tabs" />
      <div class="app-header__actions">
        <RegionSelector v-model="region" />
        <button
          class="app-header__logout"
          type="button"
          @click="onLogout"
        >
          로그아웃
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  background: $color-surface;
  border-bottom: 1px solid $color-border;

  &__inner {
    display: flex;
    align-items: center;
    gap: $space-8;
    max-width: $content-max-width;
    height: $header-height;
    margin: 0 auto;
    padding: 0 $space-4;
  }

  &__title {
    font-size: $font-size-md;
    font-weight: 700;
    color: $color-text;
    white-space: nowrap;
  }

  &__tabs {
    flex: 1;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $space-4;
  }

  &__logout {
    font-size: $font-size-base;
    color: $color-text-secondary;

    &:hover {
      color: $color-text;
    }
  }
}
</style>
