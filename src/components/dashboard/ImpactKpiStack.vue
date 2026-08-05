<script setup lang="ts">
import { computed } from 'vue'
import ImpactKpiTile, { type ImpactKind } from './ImpactKpiTile.vue'
import { useSimulationStore } from '@/stores/simulation'
import type { KpiMetric } from '@/types/simulation'

const props = defineProps<{ metrics: KpiMetric[] }>()

const store = useSimulationStore()

/**
 * 라벨 키워드로 v2.1 Impact 3종을 찾는다 — 백엔드 KPI 목록 순서에 의존하지 않기 위함.
 * 현재 백엔드 시드 라벨: "유휴 주차 공급 가능 대수" / "교통 혼잡 완화 예측" / "탄소배출 저감 예측"
 */
const MATCHERS: { kind: ImpactKind; keywords: string[] }[] = [
  { kind: 'parking', keywords: ['주차 공급', '주차면', '주차 자원', '확보'] },
  { kind: 'time', keywords: ['배회', '탐색', '혼잡'] },
  { kind: 'carbon', keywords: ['탄소', 'CO'] },
]

const captionFor = computed<Record<ImpactKind, string>>(() => ({
  parking: `참여율 ${(store.appliedRate ?? store.settings.participationRate).toFixed(0)}% 기준 예측`,
  time: '선택 시간대 기준',
  carbon: '분석 모델 산출값',
}))

const tiles = computed(() => {
  const used = new Set<string>()
  const found: { kind: ImpactKind; metric: KpiMetric }[] = []
  for (const { kind, keywords } of MATCHERS) {
    const metric = props.metrics.find(
      (m) => !used.has(m.id) && keywords.some((k) => m.label.includes(k)),
    )
    if (metric) {
      used.add(metric.id)
      found.push({ kind, metric })
    }
  }
  // 키워드 매칭 실패 시 순서 기반 폴백 — 최대 3개까지 채운다
  if (found.length < 3) {
    const kinds: ImpactKind[] = ['parking', 'time', 'carbon']
    for (const metric of props.metrics) {
      if (found.length >= 3) break
      if (used.has(metric.id)) continue
      const kind = kinds.find((k) => !found.some((f) => f.kind === k))
      if (!kind) break
      used.add(metric.id)
      found.push({ kind, metric })
    }
  }
  return found
})
</script>

<template>
  <section class="impact-stack">
    <header class="impact-stack__header">
      <h3 class="impact-stack__title">
        기대 효과 (Impact)
      </h3>
      <span class="impact-stack__basis">실행 결과 기준</span>
    </header>
    <div class="impact-stack__divider" />
    <div class="impact-stack__tiles">
      <ImpactKpiTile
        v-for="tile in tiles"
        :key="tile.metric.id"
        :kind="tile.kind"
        :label="tile.metric.label"
        :value="tile.metric.value"
        :unit="tile.metric.unit"
        :caption="captionFor[tile.kind]"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.impact-stack {
  @include card;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4;

  &__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: $space-2;
  }

  &__title {
    font-size: $font-size-md;
    font-weight: 700;
    color: $color-text;
  }

  &__basis {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    white-space: nowrap;
  }

  &__divider {
    height: 1px;
    background: $color-border;
  }

  &__tiles {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }
}
</style>
