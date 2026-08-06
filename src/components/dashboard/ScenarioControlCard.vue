<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import ChipSelect from './ChipSelect.vue'
import ScenarioSaveModal from './ScenarioSaveModal.vue'
import { ANALYSIS_MONTHS, REGIONS } from '@/constants/regions'
import { useToast } from '@/composables/useToast'
import { useSimulationStore } from '@/stores/simulation'
import type { RegionCode } from '@/types/geo'
import type { SelectOption } from '@/types/common'

const store = useSimulationStore()

const regionOptions: SelectOption[] = REGIONS.map((r) => ({ label: r.label, value: r.code }))
const monthOptions: SelectOption[] = ANALYSIS_MONTHS.map((m) => ({ label: `${m}월`, value: String(m) }))

// 연도는 변경 불가 — 항상 직전 년도 데이터 기준임을 칩 prefix로만 표시
const dataYearLabel = `${new Date().getFullYear() - 1}년`

// ChipSelect는 string 모델 — 스토어의 타입 필드와 변환 프록시로 연결
const region = computed<string>({
  get: () => store.settings.region ?? 'pangyo',
  set: (v) => {
    store.settings.region = v as RegionCode
  },
})
const month = computed<string>({
  get: () => String(store.settings.month ?? 10),
  set: (v) => {
    store.settings.month = Number(v)
  },
})

/** 마지막 실행에 반영된 참여율 캡션 — 실행 전에는 표시 생략 */
const appliedRateLabel = computed(() =>
  store.appliedRate != null ? `현재 ${store.appliedRate.toFixed(1)}%` : '',
)

const saveModalOpen = ref(false)
const toast = useToast()

function onSaved(name: string): void {
  saveModalOpen.value = false
  toast.show(`'${name}' 시나리오가 저장되었습니다. 시나리오 관리에서 확인할 수 있습니다.`)
}
</script>

<template>
  <section class="scenario-card">
    <header class="scenario-card__header">
      <h3 class="scenario-card__title">
        주차장 개방 시나리오
      </h3>
      <div class="scenario-card__chips">
        <ChipSelect
          v-model="region"
          :options="regionOptions"
          prefix="지역"
          aria-label="분석 대상 지역"
        />
        <ChipSelect
          v-model="month"
          :options="monthOptions"
          :prefix="dataYearLabel"
          aria-label="분석 기준 월"
        />
      </div>
    </header>

    <div class="scenario-card__divider" />

    <div class="scenario-card__rate">
      <span class="scenario-card__label">목표 참여율</span>
      <p class="scenario-card__value">
        <strong>{{ store.settings.participationRate.toFixed(1) }}</strong>
        <span class="scenario-card__unit">%</span>
      </p>
      <p class="scenario-card__note">
        변경 후 실행 시 결과에 반영됩니다.
      </p>
      <input
        v-model.number="store.settings.participationRate"
        class="scenario-card__slider"
        type="range"
        min="0"
        max="100"
        step="5"
        aria-label="목표 참여율"
        :style="{ '--fill': `${store.settings.participationRate}%` }"
      >
      <div class="scenario-card__slider-captions">
        <span>{{ appliedRateLabel }}</span>
        <span class="scenario-card__slider-max">완전 개방 100%</span>
      </div>
    </div>

    <div class="scenario-card__info">
      <p class="scenario-card__info-title">
        참여율만 시나리오에 저장됩니다.
      </p>
      <p class="scenario-card__info-sub">
        저장은 결과를 변경하지 않습니다.
      </p>
    </div>

    <div class="scenario-card__actions">
      <AppButton
        block
        :disabled="store.running"
        @click="store.run()"
      >
        시뮬레이션 실행
      </AppButton>
      <AppButton
        variant="secondary"
        block
        @click="saveModalOpen = true"
      >
        시나리오 저장
      </AppButton>
    </div>

    <ScenarioSaveModal
      v-if="saveModalOpen"
      @close="saveModalOpen = false"
      @saved="onSaved"
    />
  </section>
</template>

<style scoped lang="scss">
.scenario-card {
  @include card;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-2;
    flex-wrap: wrap;
  }

  &__title {
    font-size: $font-size-md;
    font-weight: 700;
    color: $color-text;
  }

  &__chips {
    display: flex;
    gap: $space-2;
  }

  &__divider {
    height: 1px;
    background: $color-border;
  }

  &__label {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__value {
    display: flex;
    align-items: baseline;
    gap: $space-1;

    strong {
      font-size: 38px;
      font-weight: 700;
      color: $color-primary;
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
    }
  }

  &__unit {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-primary;
  }

  &__note {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__slider {
    width: 100%;
    height: 8px;
    margin-top: $space-2;
    appearance: none;
    border-radius: 4px;
    // --fill(현재 값 %)까지 active 트랙을 채운다
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

  &__slider-captions {
    display: flex;
    justify-content: space-between;
    margin-top: $space-1;
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__slider-max {
    color: $color-success;
    font-weight: 500;
  }

  &__info {
    padding: $space-2 $space-3;
    border-radius: $radius-md;
    background: $color-primary-soft;
  }

  &__info-title {
    font-size: $font-size-xs;
    font-weight: 500;
    color: $color-primary;
  }

  &__info-sub {
    margin-top: 2px;
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }
}
</style>
