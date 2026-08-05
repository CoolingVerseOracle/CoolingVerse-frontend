<script setup lang="ts">
import { computed } from 'vue'
import HourChip from './HourChip.vue'
import RiskIndexLine from '@/components/charts/RiskIndexLine.vue'
import { useDashboardStore } from '@/stores/dashboard'
import type { SimulationResult } from '@/types/simulation'

const dashboard = useDashboardStore()

// grid-risk의 24시간 커브를 차트 데이터로 변환 (simulation.riskTrend는 참여율 축이라 시간대 카드에 부적합)
const curveData = computed<SimulationResult['riskTrend'] | null>(() => {
  const hourly = dashboard.gridRisk?.hourlyRisk
  if (!hourly?.current.length) return null
  return {
    labels: hourly.current.map((_, h) => `${String(h).padStart(2, '0')}시`),
    current: hourly.current,
    projected: hourly.projected,
  }
})
</script>

<template>
  <section class="m-curve-card">
    <header class="m-curve-card__header">
      <div>
        <h3 class="m-curve-card__title">
          시간대별 Risk Score (M-커브)
        </h3>
        <p class="m-curve-card__subtitle">
          시나리오 적용에 따른 위험도 완화
        </p>
      </div>
      <HourChip :hour="dashboard.selectedHour" />
    </header>
    <div class="m-curve-card__divider" />
    <RiskIndexLine
      v-if="curveData"
      :data="curveData"
      :selected-hour="dashboard.selectedHour"
    />
    <p
      v-else
      class="m-curve-card__empty"
    >
      시간대별 위험지수를 불러오는 중입니다…
    </p>
  </section>
</template>

<style scoped lang="scss">
.m-curve-card {
  @include card;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4;
  min-width: 0;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $space-2;
  }

  &__title {
    font-size: $font-size-sm;
    font-weight: 700;
    color: $color-text;
  }

  &__subtitle {
    margin-top: 2px;
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__divider {
    height: 1px;
    background: $color-border;
  }

  &__empty {
    padding: $space-6 0;
    text-align: center;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}
</style>
