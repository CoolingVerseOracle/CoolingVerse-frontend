<script setup lang="ts">
defineProps<{
  globalRisk: number | null
  /** 참여율 적용 후 평균 지수 — 시뮬레이션 실행 전이면 null(미표시) */
  projectedRisk: number | null
  stateLabel: string
  isFallback: boolean
}>()
</script>

<template>
  <div class="map-risk-summary">
    <p class="map-risk-summary__label">
      평균 격자 위험 지수
      <span
        v-if="isFallback"
        class="map-risk-summary__sample"
      >샘플 데이터</span>
    </p>
    <p class="map-risk-summary__value">
      <strong>{{ globalRisk != null ? globalRisk.toFixed(1) : '–' }}</strong>
      <span class="map-risk-summary__max">/ 100</span>
    </p>
    <p
      v-if="projectedRisk != null"
      class="map-risk-summary__projected"
    >
      시나리오 적용 후 <strong>{{ projectedRisk.toFixed(1) }}</strong>
    </p>
    <p
      v-if="stateLabel"
      class="map-risk-summary__state"
    >
      {{ stateLabel }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.map-risk-summary {
  min-width: 172px;
  padding: $space-3;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.96);

  &__label {
    display: flex;
    align-items: center;
    gap: $space-1;
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__sample {
    padding: 0 $space-1;
    border-radius: $radius-sm;
    background: $color-warning-soft;
    color: $color-warning;
    font-size: 10px;
    font-weight: 600;
  }

  &__value {
    display: flex;
    align-items: baseline;
    gap: $space-2;
    margin-top: $space-1;

    strong {
      font-size: $font-size-kpi;
      font-weight: 700;
      color: $color-danger;
      font-variant-numeric: tabular-nums;
    }
  }

  &__max {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-text;
  }

  &__projected {
    margin-top: 2px;
    font-size: $font-size-xs;
    color: $color-text-secondary;

    strong {
      color: $color-success;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
  }

  &__state {
    display: inline-block;
    margin-top: $space-2;
    padding: $space-1 $space-2;
    border-radius: $radius-sm;
    background: $color-danger-soft;
    color: $color-danger;
    font-size: $font-size-xs;
    font-weight: 500;
  }
}
</style>
