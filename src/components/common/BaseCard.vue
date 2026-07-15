<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <section class="base-card">
    <header
      v-if="title || $slots.header"
      class="base-card__header"
    >
      <slot name="header">
        <h3 class="base-card__title">
          {{ title }}
        </h3>
      </slot>
    </header>
    <div class="base-card__body">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.base-card {
  @include card;
  padding: $space-5;

  &__header {
    margin-bottom: $space-4;
  }

  &__title {
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-text;
  }
}
</style>
