<script setup lang="ts">
import logoCloud from '@/assets/icons/logo-cloud.svg'

withDefaults(defineProps<{ size?: number }>(), { size: 28 })
</script>

<template>
  <img
    class="app-logo"
    :src="logoCloud"
    alt="유휴 주차자원 활용 정책 시뮬레이션 플랫폼 로고"
    :style="{ width: `${size}px` }"
  >
</template>

<style scoped lang="scss">
.app-logo {
  height: auto;
}
</style>
