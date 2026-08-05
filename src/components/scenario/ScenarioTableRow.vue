<script setup lang="ts">
import AppCheckbox from '@/components/common/AppCheckbox.vue'
import { computed } from 'vue'
import type { Scenario } from '@/types/scenario'

const props = defineProps<{
  scenario: Scenario
  selected: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
  open: [id: string]
  remove: [id: string]
}>()

const selectedProxy = computed({
  get: () => props.selected,
  set: () => emit('toggle', props.scenario.id),
})

// "45%, 09~18시" → "45%". 운영시간은 v2.1에서 제거된 고정 기본값이라 표시하지 않는다.
// 백엔드가 참여율만 내려주도록 계약이 정리되면 그대로 통과한다.
const participationLabel = computed(() => {
  const match = props.scenario.conditions.match(/\d+(?:\.\d+)?%/)
  return match ? match[0] : props.scenario.conditions
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
    <td>{{ participationLabel }}</td>
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
    <td class="scenario-row__actions">
      <button
        class="scenario-row__action"
        type="button"
        @click="emit('open', scenario.id)"
      >
        열기
      </button>
      <button
        class="scenario-row__action scenario-row__action--danger"
        type="button"
        @click="emit('remove', scenario.id)"
      >
        삭제
      </button>
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

  &__actions {
    white-space: nowrap;
  }

  &__action {
    padding: 4px $space-2;
    border-radius: $radius-sm;
    font-size: $font-size-sm;
    color: $color-primary;

    &:hover {
      background: $color-primary-soft;
    }

    &--danger {
      color: $color-danger;

      &:hover {
        background: $color-danger-soft;
      }
    }
  }
}
</style>
