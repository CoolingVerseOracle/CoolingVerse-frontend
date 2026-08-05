<script setup lang="ts">
import { onMounted, watch } from 'vue'
import ScenarioControlCard from '@/components/dashboard/ScenarioControlCard.vue'
import ImpactKpiStack from '@/components/dashboard/ImpactKpiStack.vue'
import MapPanel from '@/components/dashboard/MapPanel.vue'
import MCurveCard from '@/components/dashboard/MCurveCard.vue'
import RiskBreakdownCard from '@/components/dashboard/RiskBreakdownCard.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useSimulationStore } from '@/stores/simulation'

const store = useSimulationStore()
const dashboard = useDashboardStore()

onMounted(() => {
  void store.loadInitial()
  void dashboard.loadGridRisk()
})

// 스크러버·지역 변경 → 격자 위험지수 재조회 (드래그 연타 대응 디바운스)
watch([() => dashboard.selectedHour, () => store.settings.region], () => {
  dashboard.loadGridRiskDebounced()
})

// 시뮬레이션 실행 완료 → 적용 참여율로 재조회 (지도 projected·M-커브 반영)
watch(
  () => store.appliedRate,
  () => void dashboard.loadGridRisk(),
)
</script>

<template>
  <div class="dashboard-v2">
    <template v-if="store.result">
      <div class="dashboard-v2__grid">
        <section class="dashboard-v2__left">
          <ScenarioControlCard />
          <ImpactKpiStack :metrics="store.result.kpis" />
        </section>
        <section class="dashboard-v2__center">
          <MapPanel />
        </section>
        <section class="dashboard-v2__right">
          <MCurveCard />
          <RiskBreakdownCard />
        </section>
      </div>
    </template>
    <p
      v-else
      class="dashboard-v2__loading"
    >
      데이터를 불러오는 중입니다…
    </p>
  </div>
</template>

<style scoped lang="scss">
.dashboard-v2 {
  &__grid {
    display: grid;
    grid-template-columns: 360px minmax(0, 1fr) 320px;
    grid-template-areas: 'left center right';
    gap: $space-4;
    align-items: stretch;

    // 그리드 아이템 기본 min-width:auto가 지도·차트 캔버스의 트랙 축소를 막는 것 방지
    > * {
      min-width: 0;
    }
  }

  &__left {
    grid-area: left;
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__center {
    grid-area: center;
    min-height: 560px;
    display: flex;
    flex-direction: column;

    > * {
      flex: 1;
    }
  }

  &__right {
    grid-area: right;
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  // 중간 폭: 지도를 첫 행 전체로, 좌·우 패널을 아래 2열로
  @include below($bp-lg) {
    &__grid {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      grid-template-areas:
        'center center'
        'left right';
    }

    &__center {
      min-height: 480px;
    }
  }

  @include below($bp-md) {
    &__grid {
      gap: $space-3;
    }
  }

  // 좁은 폭: 지도 → 시나리오 → 리스크 순 1열
  @include below($bp-sm) {
    &__grid {
      grid-template-columns: 1fr;
      grid-template-areas:
        'center'
        'left'
        'right';
    }

    &__center {
      min-height: 420px;
    }
  }

  &__loading {
    padding: $space-8;
    text-align: center;
    color: $color-text-muted;
  }
}
</style>
