<script setup lang="ts">
import { RISK_INDEX_LEVELS } from '@/utils/riskLevels'
</script>

<template>
  <div class="map-legend">
    <span
      v-for="item in RISK_INDEX_LEVELS"
      :key="item.key"
      class="map-legend__item"
    >
      <i
        class="map-legend__dot"
        :style="{ backgroundColor: item.color }"
      />
      {{ item.label }} · {{ item.rangeLabel }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.map-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: $space-4;
  padding: $space-2 $space-3;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.94);

  // 오버레이 폭이 한 줄 폭보다 좁으면 세로 배치로 전환한다.
  // flex-wrap 줄바꿈은 absolute 배치 특성상 박스가 가용 폭 전체로 늘어나
  // 내용 주변 여백이 한쪽으로 쏠리므로 쓰지 않는다.
  @container map-overlays (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: $space-1;
  }

  &__item {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    font-size: $font-size-xs;
    color: $color-text-secondary;
    white-space: nowrap;
  }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
}
</style>
