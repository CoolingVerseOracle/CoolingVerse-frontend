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
    () => [filter.region, filter.participation, filter.keyword, filter.sort, filter.pageSize],
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

  /** 일괄 삭제 결과 — 부분 실패 시 사용처가 실패 건수를 안내할 수 있게 구분해 반환 */
  interface RemoveSelectedResult {
    /** 실제 삭제된 건수 */
    deleted: number
    /** 이미 삭제되어 있던(404) 건수 — 목록에서는 사라지므로 삭제와 동일하게 수습된다 */
    missing: number
    /** 네트워크/서버 오류로 남아 있는 건수 */
    failed: number
  }

  /**
   * 선택된 시나리오 일괄 삭제 — 백엔드에 배치 엔드포인트가 없어 단건 DELETE를
   * 병렬 반복 호출한다 (이슈 #17). 부분 실패해도 성공분은 그대로 두고 목록만
   * 재조회한다 — 실패분은 목록에 남아 다시 시도할 수 있다
   */
  async function removeSelected(): Promise<RemoveSelectedResult> {
    const ids = [...selectedIds.value]
    const result: RemoveSelectedResult = { deleted: 0, missing: 0, failed: 0 }
    if (!ids.length) return result

    const settled = await Promise.allSettled(ids.map((id) => deleteScenario(id)))
    for (const s of settled) {
      if (s.status === 'fulfilled') result.deleted += 1
      else if (s.reason instanceof HttpError && s.reason.status === 404) result.missing += 1
      else result.failed += 1
    }

    // 삭제로 현재 페이지가 범위를 벗어났으면 마지막 페이지로 보정 (page watcher가 재조회)
    const remaining = Math.max(0, total.value - result.deleted - result.missing)
    const maxPage = Math.max(1, Math.ceil(remaining / filter.pageSize))
    if (filter.page > maxPage) filter.page = maxPage
    else await load()
    return result
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

  return {
    filter,
    scenarios,
    total,
    loading,
    selectedIds,
    load,
    remove,
    removeSelected,
    toggleSelect,
    toggleSelectAll,
  }
})
