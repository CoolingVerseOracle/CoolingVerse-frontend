<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppModal from '@/components/common/AppModal.vue'
import { createScenario } from '@/api/scenarios'
import { regionByCode } from '@/constants/regions'
import { useSimulationStore } from '@/stores/simulation'

const emit = defineEmits<{ close: []; saved: [name: string] }>()

const store = useSimulationStore()

// 요약은 v2.1 카드에서 실제로 조작 가능한 값(참여율·지역·월)만 보여준다.
// 구 설정(개방 시간·상업시설 반경)은 조작 UI가 없어 노출하지 않는다 (이슈 #25)
const summaryLabel = computed(() => {
  const regionLabel = regionByCode(store.settings.region ?? 'pangyo').label
  const dataYear = new Date().getFullYear() - 1
  return `참여율 ${store.settings.participationRate}% · ${regionLabel} · ${dataYear}년 ${store.settings.month ?? 10}월`
})

const name = ref('')
const memo = ref('')
const saving = ref(false)
const errorMessage = ref('')

async function onSubmit(): Promise<void> {
  const trimmed = name.value.trim()
  if (!trimmed) {
    errorMessage.value = '시나리오 이름을 입력해 주세요.'
    return
  }
  saving.value = true
  errorMessage.value = ''
  try {
    await createScenario({
      name: trimmed,
      memo: memo.value.trim() || undefined,
      settings: { ...store.settings },
    })
    emit('saved', trimmed)
  } catch {
    errorMessage.value = '저장에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppModal
    title="시나리오 저장"
    @close="emit('close')"
  >
    <form
      class="save-modal"
      @submit.prevent="onSubmit"
    >
      <label class="save-modal__field">
        <span class="save-modal__label">시나리오 이름 <em aria-hidden="true">*</em></span>
        <AppInput
          v-model="name"
          placeholder="예: 3단계 적극 개방안 보완"
        />
      </label>

      <label class="save-modal__field">
        <span class="save-modal__label">메모 (선택)</span>
        <textarea
          v-model="memo"
          class="save-modal__memo"
          rows="3"
          placeholder="정책 배경, 참고 사항 등"
        />
      </label>

      <p class="save-modal__summary">
        현재 설정 — {{ summaryLabel }}
        <br>저장 시 서버가 결과(공급·위험지수·CO2)를 계산해 함께 보관합니다.
      </p>

      <p
        v-if="errorMessage"
        class="save-modal__error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <div class="save-modal__actions">
        <AppButton
          variant="secondary"
          type="button"
          @click="emit('close')"
        >
          취소
        </AppButton>
        <AppButton
          type="submit"
          :disabled="saving"
        >
          저장
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<style scoped lang="scss">
.save-modal {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &__field {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text-secondary;

    em {
      color: $color-danger;
      font-style: normal;
    }
  }

  &__memo {
    padding: 11px $space-3;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    background: $color-surface;
    font-size: $font-size-base;
    font-family: inherit;
    color: $color-text;
    resize: vertical;

    &::placeholder {
      color: $color-text-muted;
    }

    &:focus {
      @include focus-ring;
    }
  }

  &__summary {
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: 1.6;
  }

  &__error {
    font-size: $font-size-sm;
    color: $color-danger;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $space-2;
  }
}
</style>
