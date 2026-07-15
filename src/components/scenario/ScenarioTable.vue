<script setup lang="ts">
import { computed } from 'vue'
import AppCheckbox from '@/components/common/AppCheckbox.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import ScenarioTableRow from './ScenarioTableRow.vue'
import { useScenarioStore } from '@/stores/scenario'
import type { SelectOption } from '@/types/common'

const store = useScenarioStore()

const pageSizeOptions: SelectOption[] = [
  { label: '10', value: '10' },
  { label: '20', value: '20' },
  { label: '50', value: '50' },
]

const allSelected = computed({
  get: () => store.scenarios.length > 0 && store.selectedIds.size === store.scenarios.length,
  set: () => store.toggleSelectAll(),
})

const pageSizeProxy = computed({
  get: () => String(store.filter.pageSize),
  set: (v: string) => {
    store.filter.pageSize = Number(v)
  },
})
</script>

<template>
  <section class="scenario-table">
    <table>
      <thead>
        <tr>
          <th class="scenario-table__check">
            <AppCheckbox v-model="allSelected" />
          </th>
          <th>시나리오명</th>
          <th>대상 지역</th>
          <th>주요 조건</th>
          <th>공급 증감</th>
          <th>위험지수 변화</th>
          <th>수정일</th>
        </tr>
      </thead>
      <tbody>
        <ScenarioTableRow
          v-for="scenario in store.scenarios"
          :key="scenario.id"
          :scenario="scenario"
          :selected="store.selectedIds.has(scenario.id)"
          @toggle="store.toggleSelect"
        />
        <tr v-if="!store.loading && store.scenarios.length === 0">
          <td
            class="scenario-table__empty"
            colspan="7"
          >
            조건에 맞는 시나리오가 없습니다.
          </td>
        </tr>
      </tbody>
    </table>

    <footer class="scenario-table__footer">
      <span class="scenario-table__total">
        총 <strong>{{ store.total }}</strong>건
      </span>
      <div class="scenario-table__paging">
        <label class="scenario-table__page-size">
          페이지당 보기:
          <AppSelect
            v-model="pageSizeProxy"
            :options="pageSizeOptions"
            aria-label="페이지당 보기"
          />
        </label>
        <AppPagination
          v-model="store.filter.page"
          :total="store.total"
          :page-size="store.filter.pageSize"
        />
      </div>
    </footer>
  </section>
</template>

<style scoped lang="scss">
.scenario-table {
  @include card;
  overflow: hidden;

  table {
    width: 100%;
  }

  thead {
    background: $color-bg;

    th {
      padding: $space-3;
      font-size: $font-size-sm;
      font-weight: 500;
      color: $color-text-secondary;
      text-align: left;
      border-bottom: 1px solid $color-border;
    }
  }

  &__check {
    width: 40px;
  }

  &__empty {
    padding: $space-8;
    text-align: center;
    color: $color-text-muted;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-3 $space-4;
  }

  &__total {
    font-size: $font-size-sm;
    color: $color-text-secondary;

    strong {
      color: $color-text;
    }
  }

  &__paging {
    display: flex;
    align-items: center;
    gap: $space-4;
  }

  &__page-size {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }
}
</style>
