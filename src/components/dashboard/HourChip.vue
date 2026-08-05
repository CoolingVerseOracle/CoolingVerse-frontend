<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ hour: number }>()

const label = computed(() => `${String(props.hour).padStart(2, '0')}:00`)
</script>

<template>
  <span class="hour-chip">{{ label }}</span>
</template>

<style scoped lang="scss">
.hour-chip {
  display: inline-flex;
  align-items: center;
  padding: $space-1 $space-2;
  border-radius: $radius-sm;
  background: $color-primary-soft;
  color: $color-primary;
  font-size: $font-size-xs;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
