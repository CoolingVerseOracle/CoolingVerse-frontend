<script setup lang="ts">
import { onMounted } from 'vue'
import ScenarioFilters from '@/components/scenario/ScenarioFilters.vue'
import ScenarioTable from '@/components/scenario/ScenarioTable.vue'
import { useScenarioStore } from '@/stores/scenario'

const store = useScenarioStore()

onMounted(() => {
  void store.load()
})
</script>

<template>
  <div class="scenario-management-view">
    <header class="scenario-management-view__header">
      <h2 class="scenario-management-view__title">
        시나리오 관리
      </h2>
      <p class="scenario-management-view__subtitle">
        저장한 정책 시나리오를 조회하고 다시 분석할 수 있습니다.
      </p>
    </header>

    <ScenarioFilters />
    <ScenarioTable />
  </div>
</template>

<style scoped lang="scss">
.scenario-management-view {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &__header {
    margin-bottom: $space-2;
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
}
</style>
