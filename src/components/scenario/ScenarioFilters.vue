<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import { REGIONS } from '@/constants/regions'
import { useScenarioStore } from '@/stores/scenario'
import type { SelectOption } from '@/types/common'

const store = useScenarioStore()

// 검색은 명시적 트리거 방식 (이슈 #17) — 타이핑은 로컬 상태에만 쌓이고,
// 검색 버튼 클릭 또는 Enter(form submit)에서만 필터에 반영되어 요청이 나간다
const keywordInput = ref(store.filter.keyword)

function onSearch(): void {
  const next = keywordInput.value.trim()
  if (store.filter.keyword !== next) {
    store.filter.keyword = next // 필터 watcher가 1페이지 리셋 + 재조회
  } else if (store.filter.page !== 1) {
    store.filter.page = 1 // page watcher가 재조회
  } else {
    void store.load() // 같은 조건 재검색 — 명시적으로 새로고침
  }
}

// 지역 필터는 활성 지역 자연키(pangyo/bucheon) 표준 — 비활성 인계동은 '전체'에서 이력으로 노출
const regionOptions: SelectOption[] = [
  { label: '지역 전체', value: 'all' },
  ...REGIONS.map((r) => ({ label: r.label, value: r.code })),
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
      <form
        class="scenario-filters__search-form"
        role="search"
        @submit.prevent="onSearch"
      >
        <AppInput
          v-model="keywordInput"
          type="search"
          class="scenario-filters__search"
          placeholder="시나리오명 검색"
        >
          <template #icon>
            <span aria-hidden="true">🔍</span>
          </template>
        </AppInput>
        <AppButton
          type="submit"
          variant="secondary"
        >
          검색
        </AppButton>
      </form>
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

  &__search-form {
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  &__search {
    width: 260px;
  }
}
</style>
