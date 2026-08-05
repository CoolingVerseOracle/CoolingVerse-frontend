<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppCheckbox from '@/components/common/AppCheckbox.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import ScenarioTableRow from './ScenarioTableRow.vue'
import { fetchScenario } from '@/api/scenarios'
import { HttpError } from '@/api/http'
import { useScenarioStore } from '@/stores/scenario'
import { useSimulationStore } from '@/stores/simulation'
import type { SelectOption } from '@/types/common'

const store = useScenarioStore()
const simulationStore = useSimulationStore()
const router = useRouter()

const opening = ref(false)

/** "열기" — 대시보드 설정을 덮어쓰므로 확인 후, 상세를 받아 설정을 복원·재계산한 뒤 대시보드로 이동 */
async function onOpen(id: string): Promise<void> {
  if (opening.value) return
  if (!window.confirm('저장하지 않은 설정이 있다면 덮어씌워집니다. 계속할까요?')) return
  opening.value = true
  try {
    const detail = await fetchScenario(id)
    await simulationStore.applyScenario(detail.settings)
    void router.push({ name: 'dashboard' })
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) {
      window.alert('이미 삭제된 시나리오입니다. 목록을 갱신합니다.')
      void store.load()
    } else {
      window.alert('시나리오를 여는 데 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  } finally {
    opening.value = false
  }
}

async function onRemove(id: string): Promise<void> {
  const target = store.scenarios.find((s) => s.id === id)
  if (!window.confirm(`'${target?.name ?? id}' 시나리오를 삭제할까요?`)) return
  try {
    const outcome = await store.remove(id)
    if (outcome === 'notFound') {
      window.alert('이미 삭제된 시나리오입니다. 목록을 갱신했습니다.')
    }
  } catch {
    window.alert('삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.')
  }
}

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
    <div class="scenario-table__scroll">
      <table>
        <thead>
          <tr>
            <th class="scenario-table__check">
              <AppCheckbox v-model="allSelected" />
            </th>
            <th>시나리오명</th>
            <th>대상 지역</th>
            <th>참여율</th>
            <th>공급 증감</th>
            <th>위험지수 변화</th>
            <th>수정일</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <ScenarioTableRow
            v-for="scenario in store.scenarios"
            :key="scenario.id"
            :scenario="scenario"
            :selected="store.selectedIds.has(scenario.id)"
            @toggle="store.toggleSelect"
            @open="onOpen"
            @remove="onRemove"
          />
          <tr v-if="!store.loading && store.scenarios.length === 0">
            <td
              class="scenario-table__empty"
              colspan="8"
            >
              조건에 맞는 시나리오가 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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

  &__scroll {
    overflow-x: auto;
  }

  table {
    width: 100%;
    min-width: 720px;
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
    flex-wrap: wrap;
    gap: $space-3;
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
