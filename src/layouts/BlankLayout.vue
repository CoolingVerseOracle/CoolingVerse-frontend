<script setup lang="ts"></script>

<template>
  <div class="blank-layout">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.blank-layout {
  min-height: 100%;
  background: $color-surface;
}
</style>
