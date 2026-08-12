<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppCheckbox from '@/components/common/AppCheckbox.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import ScenarioMetaEditModal from './ScenarioMetaEditModal.vue'
import ScenarioTableRow from './ScenarioTableRow.vue'
import { fetchScenario } from '@/api/scenarios'
import { HttpError } from '@/api/http'
import { useScenarioStore } from '@/stores/scenario'
import { useSimulationStore } from '@/stores/simulation'
import { useToast } from '@/composables/useToast'
import type { SelectOption } from '@/types/common'
import { isActiveRegion } from '@/constants/regions'

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
    if (!isActiveRegion(detail.settings.region ?? 'pangyo')) {
      window.alert('수원 인계동은 과거 이력만 보존되며 현재 시뮬레이션을 실행할 수 없습니다.')
      return
    }
    await simulationStore.applyScenario(detail.settings)
    void router.push({ name: 'dashboard' })
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) {
      window.alert('이미 삭제된 시나리오입니다. 목록을 갱신합니다.')
      void store.load()
    } else if (err instanceof Error && err.message.includes('비활성 지역')) {
      window.alert('비활성 지역의 과거 시나리오는 실행할 수 없습니다.')
    } else {
      window.alert('시나리오를 여는 데 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  } finally {
    opening.value = false
  }
}

/** "수정" — 이름·메모 경량 편집 모달. 저장 후 현재 페이지·필터를 유지한 채 재조회 */
const editingId = ref<string | null>(null)

function onEditSaved(): void {
  editingId.value = null
  void store.load()
}

function onEditMissing(): void {
  editingId.value = null
  window.alert('이미 삭제된 시나리오입니다. 목록을 갱신합니다.')
  void store.load()
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

/**
 * 선택 일괄 삭제 (이슈 #17) — 배치 API가 없어 스토어가 단건 DELETE를 반복 호출한다.
 * 부분 실패 시 성공분만 반영하고 실패 건수를 토스트로 안내 — 실패분은 목록에 남는다
 */
const toast = useToast()
const bulkRemoving = ref(false)

async function onRemoveSelected(): Promise<void> {
  const count = store.selectedIds.size
  if (!count || bulkRemoving.value) return
  if (!window.confirm(`선택한 시나리오 ${count}건을 삭제할까요?`)) return
  bulkRemoving.value = true
  try {
    const { deleted, missing, failed } = await store.removeSelected()
    // 404(이미 삭제됨)도 목록에서 사라지므로 삭제 성공으로 묶어 안내한다
    const gone = deleted + missing
    if (failed === 0) toast.show(`시나리오 ${gone}건을 삭제했습니다.`)
    else if (gone === 0) toast.show('삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'error')
    else toast.show(`${gone}건을 삭제했지만 ${failed}건은 실패했습니다. 실패한 항목은 목록에 남아 있습니다.`, 'error')
  } catch {
    // 삭제 자체는 allSettled로 수습되므로 여기 오는 건 목록 재조회 실패뿐
    toast.show('목록 갱신에 실패했습니다. 잠시 후 새로고침해 주세요.', 'error')
  } finally {
    bulkRemoving.value = false
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
    <div
      v-if="store.selectedIds.size > 0"
      class="scenario-table__bulk"
    >
      <span class="scenario-table__bulk-count">
        <strong>{{ store.selectedIds.size }}</strong>건 선택됨
      </span>
      <AppButton
        variant="secondary"
        class="scenario-table__bulk-delete"
        :disabled="bulkRemoving"
        @click="onRemoveSelected"
      >
        {{ bulkRemoving ? '삭제 중…' : '선택 삭제' }}
      </AppButton>
    </div>
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
            @edit="editingId = $event"
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

    <ScenarioMetaEditModal
      v-if="editingId"
      :scenario-id="editingId"
      @close="editingId = null"
      @saved="onEditSaved"
      @missing="onEditMissing"
    />
  </section>
</template>

<style scoped lang="scss">
.scenario-table {
  @include card;
  overflow: hidden;

  // 선택이 있을 때만 나타나는 일괄 작업 바
  &__bulk {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
    padding: $space-2 $space-4;
    border-bottom: 1px solid $color-border;
    background: $color-bg;
  }

  &__bulk-count {
    font-size: $font-size-sm;
    color: $color-text-secondary;

    strong {
      color: $color-text;
    }
  }

  &__bulk-delete {
    color: $color-danger;
  }

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
