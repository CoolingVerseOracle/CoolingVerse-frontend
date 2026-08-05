<script setup lang="ts">
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import { useScenarioStore } from '@/stores/scenario'
import type { SelectOption } from '@/types/common'

const store = useScenarioStore()

// 백엔드 canonical 지역 값 기준 (현재 시드는 분당구 단일 — 지역 확장 시 목록 API 분리 검토)
const regionOptions: SelectOption[] = [
  { label: '지역 전체', value: 'all' },
  { label: '성남시 분당구', value: '성남시 분당구' },
]

const participationOptions: SelectOption[] = [
  { label: '참여율 전체', value: 'all' },
  { label: '10% 미만', value: 'lt10' },
  { label: '10% 이상', value: 'gte10' },
]

const sortOptions: SelectOption[] = [
  { label: '최근 수정일순', value: 'updatedDesc' },
  { label: '오래된 수정일순', value: 'updatedAsc' },
]
</script>

<template>
  <div class="scenario-filters">
    <div class="scenario-filters__left">
      <AppSelect
        v-model="store.filter.region"
        :options="regionOptions"
        aria-label="지역 필터"
      />
      <AppSelect
        v-model="store.filter.participation"
        :options="participationOptions"
        aria-label="참여율 필터"
      />
      <AppInput
        v-model="store.filter.keyword"
        type="search"
        class="scenario-filters__search"
        placeholder="시나리오명 검색"
      >
        <template #icon>
          <span aria-hidden="true">🔍</span>
        </template>
      </AppInput>
    </div>
    <AppSelect
      v-model="store.filter.sort"
      :options="sortOptions"
      aria-label="정렬"
    />
  </div>
</template>

<style scoped lang="scss">
.scenario-filters {
  @include card;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-4;

  &__left {
    display: flex;
    align-items: center;
    gap: $space-2;
    flex-wrap: wrap;
  }

  &__search {
    width: 260px;
  }
}
</style>
