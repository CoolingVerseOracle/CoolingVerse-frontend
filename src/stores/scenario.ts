import { reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { deleteScenario, fetchScenarios } from '@/api/scenarios'
import { HttpError } from '@/api/http'
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

  // 늦게 도착한 이전 응답이 최신 목록을 덮어쓰지 않도록 최신 요청만 반영
  let requestSeq = 0

  async function load(): Promise<void> {
    const seq = ++requestSeq
    loading.value = true
    try {
      const res = await fetchScenarios({ ...filter })
      if (seq !== requestSeq) return
      scenarios.value = res.items
      total.value = res.total
      selectedIds.value = new Set()
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  // 필터 변경 시 1페이지로 되돌리고 재조회.
  // page가 이미 1이면 직접 조회하고, 아니면 페이지 리셋이 page watcher를 통해
  // 조회를 트리거하므로 어느 경우든 load()는 정확히 1회 실행된다.
  watch(
    () => [filter.region, filter.participation, filter.timeSlot, filter.keyword, filter.sort, filter.pageSize],
    () => {
      if (filter.page === 1) void load()
      else filter.page = 1
    },
  )
  watch(
    () => filter.page,
    () => void load(),
  )

  /** 삭제 후 목록 재조회. 404(이미 삭제됨)도 재조회로 수습하고 결과를 알린다 */
  async function remove(id: string): Promise<'deleted' | 'notFound'> {
    let outcome: 'deleted' | 'notFound' = 'deleted'
    try {
      await deleteScenario(id)
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) outcome = 'notFound'
      else throw err
    }
    // 마지막 페이지의 마지막 행을 지웠으면 한 페이지 앞으로 (page watcher가 재조회)
    if (scenarios.value.length === 1 && filter.page > 1) filter.page -= 1
    else await load()
    return outcome
  }

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

  return { filter, scenarios, total, loading, selectedIds, load, remove, toggleSelect, toggleSelectAll }
})
