<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCheckbox from '@/components/common/AppCheckbox.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import { useSimulationStore } from '@/stores/simulation'
import type { SelectOption } from '@/types/common'

const store = useSimulationStore()

// AppInput은 string|number를 내보내므로 number 필드는 프록시로 변환한다
const radius = computed<string | number>({
  get: () => store.settings.commercialRadiusM,
  set: (v) => {
    store.settings.commercialRadiusM = Number(v) || 0
  },
})

const hourOptions: SelectOption[] = Array.from({ length: 24 }, (_, h) => {
  const label = `${String(h).padStart(2, '0')}:00`
  return { label, value: label }
})

function onSave(): void {
  // TODO: 시나리오 저장 API 연동 (pr: 시나리오 관리 화면에서 조회)
  window.alert('시나리오 저장은 백엔드 연동 후 제공됩니다.')
}
</script>

<template>
  <section class="settings-panel">
    <header class="settings-panel__header">
      <span
        class="settings-panel__header-icon"
        aria-hidden="true"
      >⚙</span>
      <h3 class="settings-panel__title">
        시나리오 설정
      </h3>
    </header>

    <div class="settings-panel__body">
      <fieldset class="settings-panel__group">
        <legend class="settings-panel__label">
          개방 대상 아파트
        </legend>
        <AppCheckbox
          v-model="store.settings.openToPublic"
          label="외부인 개방 아파트"
        />
        <AppCheckbox
          v-model="store.settings.residentsOnly"
          label="입주민 전용 아파트"
        />
      </fieldset>

      <div class="settings-panel__group settings-panel__group--row">
        <span class="settings-panel__label">예상 참여율</span>
        <strong class="settings-panel__rate">{{ store.settings.participationRate }}%</strong>
      </div>

      <div class="settings-panel__group">
        <span class="settings-panel__label">개방 운영 시간</span>
        <div class="settings-panel__time-range">
          <AppSelect
            v-model="store.settings.openFrom"
            :options="hourOptions"
            aria-label="운영 시작 시간"
          />
          <AppSelect
            v-model="store.settings.openTo"
            :options="hourOptions"
            aria-label="운영 종료 시간"
          />
        </div>
      </div>

      <div class="settings-panel__group">
        <span class="settings-panel__label">상업시설 반경</span>
        <div class="settings-panel__radius">
          <AppInput
            v-model="radius"
            type="number"
          />
          <span class="settings-panel__radius-unit">m</span>
        </div>
      </div>
    </div>

    <footer class="settings-panel__footer">
      <AppButton
        block
        :disabled="store.running"
        @click="store.run()"
      >
        ▸ 시뮬레이션 실행
      </AppButton>
      <AppButton
        variant="secondary"
        block
        @click="onSave"
      >
        시나리오 저장
      </AppButton>
    </footer>
  </section>
</template>

<style scoped lang="scss">
.settings-panel {
  @include card;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-4;
    background: $color-primary-soft;
    border-bottom: 1px solid $color-border;
    border-radius: $radius-md $radius-md 0 0;
  }

  &__header-icon {
    color: $color-primary;
  }

  &__title {
    font-size: $font-size-base;
    font-weight: 600;
    color: $color-text;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $space-5;
    flex: 1;
    padding: $space-4;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    border: none;

    &--row {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }

  &__rate {
    font-size: $font-size-base;
    font-weight: 700;
    color: $color-primary;
  }

  &__time-range {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-2;
  }

  &__radius {
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  &__radius-unit {
    color: $color-text-secondary;
  }

  &__footer {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    padding: $space-4;
    border-top: 1px solid $color-border;
  }
}
</style>
