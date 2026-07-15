import { reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { fetchScenarios } from '@/api/scenarios'
import type { Scenario, ScenarioFilter } from '@/types/scenario'

/** 시나리오 관리 — 목록/필터/정렬/페이지네이션 */
export const useScenarioStore = defineStore('scenario', () => {
  const filter = reactive<ScenarioFilter>({
    region: 'all',
    participation: 'all',
    timeSlot: 'all',
    keyword: '',
    sort: 'updatedDesc',
    page: 1,
    pageSize: 10,
  })

  const scenarios = ref<Scenario[]>([])
  const total = ref(0)
  const loading = ref(false)
  const selectedIds = ref<Set<string>>(new Set())

  async function load(): Promise<void> {
    loading.value = true
    try {
      const res = await fetchScenarios({ ...filter })
      scenarios.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  // 필터 변경 시 1페이지로 되돌리고 재조회
  watch(
    () => [filter.region, filter.participation, filter.timeSlot, filter.keyword, filter.sort, filter.pageSize],
    () => {
      filter.page = 1
      void load()
    },
  )
  watch(
    () => filter.page,
    () => void load(),
  )

  function toggleSelect(id: string): void {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
  }

  function toggleSelectAll(): void {
    selectedIds.value =
      selectedIds.value.size === scenarios.value.length
        ? new Set()
        : new Set(scenarios.value.map((s) => s.id))
  }

  return { filter, scenarios, total, loading, selectedIds, load, toggleSelect, toggleSelectAll }
})
