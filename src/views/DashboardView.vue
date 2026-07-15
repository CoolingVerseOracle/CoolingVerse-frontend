<script setup lang="ts">
import { onMounted } from 'vue'
import BaseCard from '@/components/common/BaseCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import KpiCardRow from '@/components/dashboard/KpiCardRow.vue'
import ScenarioSettingsPanel from '@/components/dashboard/ScenarioSettingsPanel.vue'
import MapPanel from '@/components/dashboard/MapPanel.vue'
import MetricChangePanel from '@/components/dashboard/MetricChangePanel.vue'
import ParticipationDonut from '@/components/charts/ParticipationDonut.vue'
import HourlyParkingLine from '@/components/charts/HourlyParkingLine.vue'
import RiskIndexLine from '@/components/charts/RiskIndexLine.vue'
import { useSimulationStore } from '@/stores/simulation'

const store = useSimulationStore()

onMounted(() => {
  void store.loadInitial()
})

function onDownloadReport(): void {
  // TODO: 리포트 다운로드 API 연동
  window.alert('리포트 다운로드는 백엔드 연동 후 제공됩니다.')
}
</script>

<template>
  <div class="dashboard-view">
    <header class="dashboard-view__header">
      <div>
        <h2 class="dashboard-view__title">
          종합 시뮬레이션 대시보드
        </h2>
        <p class="dashboard-view__subtitle">
          현재 적용 중인 시나리오를 바탕으로 예측된 정책 효과입니다.
        </p>
      </div>
      <div class="dashboard-view__actions">
        <AppButton variant="secondary">
          📅 2023.10 기준
        </AppButton>
        <AppButton
          variant="secondary"
          @click="onDownloadReport"
        >
          ⬇ 리포트 다운로드
        </AppButton>
      </div>
    </header>

    <template v-if="store.result">
      <KpiCardRow :metrics="store.result.kpis" />

      <div class="dashboard-view__middle">
        <ScenarioSettingsPanel />
        <MapPanel />
        <MetricChangePanel :metrics="store.result.metricChanges" />
      </div>

      <div class="dashboard-view__charts">
        <BaseCard title="주차 지원 현황">
          <ParticipationDonut :data="store.result.participation" />
        </BaseCard>
        <BaseCard title="시간대별 유휴 주차 자원량 예측">
          <HourlyParkingLine :data="store.result.hourlySupply" />
        </BaseCard>
        <BaseCard title="시나리오별 도시 교통·환경 위험지수 변화">
          <RiskIndexLine :data="store.result.riskTrend" />
        </BaseCard>
      </div>
    </template>
    <p
      v-else
      class="dashboard-view__loading"
    >
      데이터를 불러오는 중입니다…
    </p>
  </div>
</template>

<style scoped lang="scss">
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: $space-5;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $space-4;
  }

  &__title {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-text;
  }

  &__subtitle {
    margin-top: $space-1;
    font-size: $font-size-base;
    color: $color-text-secondary;
  }

  &__actions {
    display: flex;
    gap: $space-2;
  }

  &__middle {
    display: grid;
    grid-template-columns: 250px 1fr 250px;
    gap: $space-4;

    @media (max-width: 1080px) {
      grid-template-columns: 1fr;
    }
  }

  &__charts {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $space-4;

    @media (max-width: 1080px) {
      grid-template-columns: 1fr;
    }
  }

  &__loading {
    padding: $space-8;
    text-align: center;
    color: $color-text-muted;
  }
}
</style>
