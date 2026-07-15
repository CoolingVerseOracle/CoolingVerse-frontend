<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
</script>

<template>
  <div class="default-layout">
    <AppHeader />
    <main class="default-layout__content">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
.default-layout {
  min-height: 100%;
  background: $color-bg;

  &__content {
    max-width: $content-max-width;
    margin: 0 auto;
    padding: $space-6 $space-4;
  }
}
</style>
