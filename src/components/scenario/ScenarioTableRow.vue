<script setup lang="ts">
import AppCheckbox from '@/components/common/AppCheckbox.vue'
import { computed } from 'vue'
import type { Scenario } from '@/types/scenario'

const props = defineProps<{
  scenario: Scenario
  selected: boolean
}>()

const emit = defineEmits<{ toggle: [id: string] }>()

const selectedProxy = computed({
  get: () => props.selected,
  set: () => emit('toggle', props.scenario.id),
})
</script>

<template>
  <tr class="scenario-row">
    <td class="scenario-row__check">
      <AppCheckbox v-model="selectedProxy" />
    </td>
    <td class="scenario-row__name">
      {{ scenario.name }}
    </td>
    <td>{{ scenario.region }}</td>
    <td>{{ scenario.conditions }}</td>
    <td class="scenario-row__supply">
      +{{ scenario.supplyDelta }}면
    </td>
    <td>
      <span class="scenario-row__risk-before">{{ scenario.riskBefore }}</span>
      <span
        class="scenario-row__arrow"
        aria-hidden="true"
      >→</span>
      <span class="scenario-row__risk-after">{{ scenario.riskAfter }}</span>
    </td>
    <td class="scenario-row__date">
      {{ scenario.updatedAt }}
    </td>
  </tr>
</template>

<style scoped lang="scss">
.scenario-row {
  border-bottom: 1px solid $color-border;

  td {
    padding: $space-4 $space-3;
    font-size: $font-size-base;
    color: $color-text;
  }

  &:hover {
    background: $color-bg;
  }

  &__check {
    width: 40px;
  }

  &__name {
    font-weight: 500;
  }

  &__supply {
    color: $color-success;
    font-weight: 600;
  }

  &__risk-before {
    color: $color-danger;
  }

  &__arrow {
    margin: 0 $space-1;
    color: $color-text-muted;
  }

  &__risk-after {
    color: $color-success;
  }

  &__date {
    color: $color-text-secondary;
  }
}
</style>
