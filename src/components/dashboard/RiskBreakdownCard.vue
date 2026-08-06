<script setup lang="ts">
import { computed } from 'vue'
import HourChip from './HourChip.vue'
import { useDashboardStore } from '@/stores/dashboard'
import type { RiskFactor, RiskLevel } from '@/types/geo'

const dashboard = useDashboardStore()

const LEVEL_LABELS: Record<RiskLevel, string> = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
}

interface RiskRow {
  key: string
  label: string
  factor: RiskFactor
}

const rows = computed<RiskRow[]>(() => {
  const breakdown = dashboard.breakdown
  if (!breakdown) return []
  return [
    { key: 'parking', label: '주차 수요 압박', factor: breakdown.parking },
    { key: 'environment', label: '환경 민감도', factor: breakdown.environment },
    { key: 'traffic', label: '교통 혼잡도', factor: breakdown.traffic },
  ]
})
</script>

<template>
  <section class="risk-breakdown">
    <header class="risk-breakdown__header">
      <h3 class="risk-breakdown__title">
        현재 시간대 리스크
      </h3>
      <HourChip :hour="dashboard.selectedHour" />
    </header>
    <div class="risk-breakdown__divider" />

    <div class="risk-breakdown__summary">
      <p class="risk-breakdown__summary-label">
        글로벌 위험지수
      </p>
      <p class="risk-breakdown__summary-value">
        <strong>{{ dashboard.globalRisk != null ? dashboard.globalRisk.toFixed(1) : '–' }}</strong>
        <span>/ 100</span>
      </p>
      <p
        v-if="dashboard.globalRiskProjected != null"
        class="risk-breakdown__summary-projected"
      >
        시나리오 적용 후 <strong>{{ dashboard.globalRiskProjected.toFixed(1) }}</strong>
      </p>
      <p
        v-if="dashboard.riskStateLabel"
        class="risk-breakdown__summary-state"
      >
        {{ dashboard.riskStateLabel }}
      </p>
    </div>

    <div
      v-for="row in rows"
      :key="row.key"
      class="risk-breakdown__row"
    >
      <div class="risk-breakdown__row-head">
        <span class="risk-breakdown__row-label">{{ row.label }}</span>
        <span
          class="risk-breakdown__row-level"
          :class="`risk-breakdown__row-level--${row.factor.level}`"
        >
          {{ LEVEL_LABELS[row.factor.level] }}
        </span>
      </div>
      <div
        class="risk-breakdown__track"
        role="progressbar"
        :aria-label="row.label"
        :aria-valuenow="Math.round(row.factor.score)"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="risk-breakdown__fill"
          :class="`risk-breakdown__fill--${row.factor.level}`"
          :style="{ width: `${Math.min(100, Math.max(0, row.factor.score))}%` }"
        />
      </div>
    </div>

    <div class="risk-breakdown__footnote">
      <p class="risk-breakdown__footnote-title">
        24H 스크러버 선택 시간과 동기화
      </p>
      <p class="risk-breakdown__footnote-sub">
        조회 상태이며 시나리오 저장에는 포함되지 않습니다.
      </p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.risk-breakdown {
  @include card;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding: $space-4;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-2;
  }

  &__title {
    font-size: $font-size-md;
    font-weight: 700;
    color: $color-text;
  }

  &__divider {
    height: 1px;
    background: $color-border;
  }

  &__summary {
    padding: $space-3 $space-4;
    border-radius: $radius-md;
    background: $color-danger-soft;
  }

  &__summary-label {
    font-size: $font-size-xs;
    font-weight: 500;
    color: $color-danger;
  }

  &__summary-value {
    display: flex;
    align-items: baseline;
    gap: $space-2;
    margin-top: $space-1;

    strong {
      font-size: 30px;
      font-weight: 700;
      color: $color-danger;
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
    }

    span {
      font-size: $font-size-sm;
      font-weight: 600;
      color: $color-text;
    }
  }

  &__summary-projected {
    margin-top: 2px;
    font-size: $font-size-xs;
    color: $color-text-secondary;

    strong {
      color: $color-success;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
  }

  &__summary-state {
    margin-top: $space-2;
    font-size: $font-size-xs;
    font-weight: 500;
    color: $color-danger;
  }

  &__row {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  &__row-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__row-label {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__row-level {
    font-size: $font-size-xs;
    font-weight: 600;

    &--high {
      color: $color-danger;
    }

    &--medium {
      color: $color-warning;
    }

    &--low {
      color: $color-primary;
    }
  }

  &__track {
    height: 8px;
    border-radius: 4px;
    background: $color-border;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;

    &--high {
      background: $color-danger;
    }

    &--medium {
      background: $color-warning;
    }

    &--low {
      background: $color-primary;
    }
  }

  &__footnote {
    padding: $space-2 $space-3;
    border-radius: $radius-md;
    background: $color-primary-soft;
  }

  &__footnote-title {
    font-size: $font-size-xs;
    font-weight: 500;
    color: $color-primary;
  }

  &__footnote-sub {
    margin-top: 2px;
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }
}
</style>
