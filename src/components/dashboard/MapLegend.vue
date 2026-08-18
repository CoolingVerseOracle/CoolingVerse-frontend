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
  // 지도(오버레이 영역) 폭을 넘으면 잘리는 대신 줄바꿈한다 — 우측 정렬 유지
  flex-wrap: wrap;
  justify-content: flex-end;
  max-width: 100%;
  gap: $space-1 $space-4;
  padding: $space-2 $space-3;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.94);

  // 중간 폭 화면: 항목 간격을 줄여 한 줄 유지 폭을 낮춘다
  @include below($bp-md) {
    gap: $space-1 $space-2;
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
