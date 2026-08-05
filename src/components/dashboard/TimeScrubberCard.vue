<script setup lang="ts">
import HourChip from './HourChip.vue'

const hour = defineModel<number>({ required: true })

const TICKS = [0, 6, 12, 18, 23]

function onInput(event: Event): void {
  hour.value = Number((event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="time-scrubber">
    <header class="time-scrubber__header">
      <h3 class="time-scrubber__title">
        24H 시간대별 시뮬레이션
      </h3>
      <span class="time-scrubber__badge">조회 조건 · 저장 제외</span>
      <HourChip
        class="time-scrubber__hour"
        :hour="hour"
      />
    </header>
    <p class="time-scrubber__hint">
      시간대는 지도·M-커브 조회에만 반영됩니다.
    </p>
    <input
      class="time-scrubber__range"
      type="range"
      min="0"
      max="23"
      step="1"
      :value="hour"
      aria-label="조회 시간대"
      :style="{ '--fill': `${(hour / 23) * 100}%` }"
      @input="onInput"
    >
    <div class="time-scrubber__ticks">
      <span
        v-for="tick in TICKS"
        :key="tick"
      >{{ String(tick).padStart(2, '0') }}시</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.time-scrubber {
  padding: $space-3 $space-4;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.97);

  &__header {
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  &__title {
    font-size: $font-size-base;
    font-weight: 700;
    color: $color-text;
  }

  &__badge {
    padding: 2px $space-2;
    border-radius: 999px;
    background: $color-primary-soft;
    color: $color-primary;
    font-size: 10px;
    font-weight: 500;
    white-space: nowrap;
  }

  &__hour {
    margin-left: auto;
  }

  &__hint {
    margin-top: $space-1;
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__range {
    width: 100%;
    height: 8px;
    margin-top: $space-3;
    appearance: none;
    border-radius: 4px;
    // --fill(선택 시간 비율)까지 active 트랙을 채운다
    background: linear-gradient(
      to right,
      $color-primary var(--fill, 0%),
      $color-primary-soft var(--fill, 0%)
    );
    cursor: pointer;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      border: 2px solid $color-primary;
      border-radius: 50%;
      background: $color-surface;
      box-shadow: $shadow-card;
    }

    &::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border: 2px solid $color-primary;
      border-radius: 50%;
      background: $color-surface;
      box-shadow: $shadow-card;
    }

    &:focus-visible {
      @include focus-ring;
    }
  }

  &__ticks {
    display: flex;
    justify-content: space-between;
    margin-top: $space-1;
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }
}
</style>
