<script setup lang="ts">
// 지도 플레이스홀더 — 실제 지도 API(Google Maps/TMap) 연동 전까지 자리만 잡는다.
// 연동 시 이 컴포넌트 내부만 교체하면 된다.
</script>

<template>
  <section class="map-panel">
    <div class="map-panel__placeholder">
      <span
        class="map-panel__pin"
        aria-hidden="true"
      >🗺️</span>
      <p class="map-panel__text">
        판교테크노벨리 공간 분석 지도
      </p>
      <p class="map-panel__hint">
        지도 API 연동 예정
      </p>
    </div>
    <footer class="map-panel__legend">
      <span class="map-panel__legend-item"><i class="map-panel__dot map-panel__dot--open" /> 개방 아파트</span>
      <span class="map-panel__legend-item"><i class="map-panel__dot map-panel__dot--congested" /> 혼잡 지역</span>
    </footer>
  </section>
</template>

<style scoped lang="scss">
.map-panel {
  @include card;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 420px;
  overflow: hidden;

  &__placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-2;
    flex: 1;
    background:
      linear-gradient(rgba(226, 232, 240, 0.4) 1px, transparent 1px),
      linear-gradient(90deg, rgba(226, 232, 240, 0.4) 1px, transparent 1px);
    background-size: 24px 24px;
    background-color: #eef4ee;
  }

  &__pin {
    font-size: 32px;
  }

  &__text {
    font-size: $font-size-base;
    font-weight: 600;
    color: $color-text-secondary;
  }

  &__hint {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__legend {
    display: flex;
    justify-content: flex-end;
    gap: $space-4;
    padding: $space-2 $space-3;
    background: $color-surface;
  }

  &__legend-item {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &--open {
      background: $color-primary;
    }

    &--congested {
      background: #f97316;
    }
  }
}
</style>
