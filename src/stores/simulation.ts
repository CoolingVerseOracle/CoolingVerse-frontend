import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchSimulationResult, runSimulation } from '@/api/simulation'
import type { SimulationResult, SimulationSettings } from '@/types/simulation'

/** 대시보드 — 시나리오 설정 폼 + 시뮬레이션 결과(KPI/차트) */
export const useSimulationStore = defineStore('simulation', () => {
  const settings = reactive<SimulationSettings>({
    openToPublic: true,
    residentsOnly: false,
    participationRate: 45,
    openFrom: '09:00',
    openTo: '18:00',
    commercialRadiusM: 500,
  })

  const result = ref<SimulationResult | null>(null)
  const loading = ref(false)
  const running = ref(false)

  async function loadInitial(): Promise<void> {
    if (result.value || loading.value) return
    loading.value = true
    try {
      result.value = await fetchSimulationResult()
    } finally {
      loading.value = false
    }
  }

  async function run(): Promise<void> {
    running.value = true
    try {
      result.value = await runSimulation({ ...settings })
    } finally {
      running.value = false
    }
  }

  return { settings, result, loading, running, loadInitial, run }
})
