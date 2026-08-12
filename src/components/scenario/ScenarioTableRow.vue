<script setup lang="ts">
import AppCheckbox from '@/components/common/AppCheckbox.vue'
import { computed } from 'vue'
import type { Scenario } from '@/types/scenario'
import { isExecutableScenarioRegion } from '@/constants/regions'

const props = defineProps<{
  scenario: Scenario
  selected: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
  open: [id: string]
  edit: [id: string]
  remove: [id: string]
}>()

const selectedProxy = computed({
  get: () => props.selected,
  set: () => emit('toggle', props.scenario.id),
})
const executable = computed(() =>
  isExecutableScenarioRegion(props.scenario.regionCode, props.scenario.region),
)
</script>

<template>
  <tr class="scenario-row">
    <td class="scenario-row__check">
      <AppCheckbox v-model="selectedProxy" />
    </td>
    <td class="scenario-row__name">
      {{ scenario.name }}
    </td>
    <td>
      {{ scenario.region }}
      <span
        v-if="!executable"
        class="scenario-row__legacy"
      >이력</span>
    </td>
    <td>{{ scenario.participationRate }}%</td>
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
        :disabled="!executable"
        :title="executable ? '시나리오 열기' : '비활성 지역의 과거 이력은 실행할 수 없습니다.'"
        @click="emit('open', scenario.id)"
      >
        {{ executable ? '열기' : '실행 불가' }}
      </button>
      <button
        class="scenario-row__action"
        type="button"
        @click="emit('edit', scenario.id)"
      >
        수정
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

    &:disabled {
      color: $color-text-muted;
      cursor: not-allowed;
      background: transparent;
    }

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

  &__legacy {
    margin-left: $space-1;
    padding: 2px 6px;
    border-radius: $radius-sm;
    background: $color-bg;
    color: $color-text-muted;
    font-size: $font-size-xs;
  }
}
</style>
