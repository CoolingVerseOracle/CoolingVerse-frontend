<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppModal from '@/components/common/AppModal.vue'
import { fetchScenario, updateScenarioMetadata } from '@/api/scenarios'
import { HttpError } from '@/api/http'

const props = defineProps<{ scenarioId: string }>()

// missing: 대상이 이미 삭제된 경우(404) — 부모가 목록을 갱신한다
const emit = defineEmits<{ close: []; saved: []; missing: [] }>()

const name = ref('')
const memo = ref('')
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')

// 테이블 행에는 메모가 없으므로 상세를 받아 현재 값을 채운다
onMounted(async () => {
  try {
    const detail = await fetchScenario(props.scenarioId)
    name.value = detail.name
    memo.value = detail.memo
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) {
      emit('missing')
      return
    }
    errorMessage.value = '시나리오 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    loading.value = false
  }
})

async function onSubmit(): Promise<void> {
  const trimmed = name.value.trim()
  if (!trimmed) {
    errorMessage.value = '시나리오 이름을 입력해 주세요.'
    return
  }
  saving.value = true
  errorMessage.value = ''
  try {
    // memo는 빈 문자열도 "메모 지우기"로 의미가 있어 항상 함께 보낸다
    await updateScenarioMetadata(props.scenarioId, { name: trimmed, memo: memo.value.trim() })
    emit('saved')
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) emit('missing')
    else errorMessage.value = '수정에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppModal
    title="시나리오 정보 수정"
    @close="emit('close')"
  >
    <p
      v-if="loading"
      class="meta-edit__loading"
    >
      불러오는 중…
    </p>

    <form
      v-else
      class="meta-edit"
      @submit.prevent="onSubmit"
    >
      <label class="meta-edit__field">
        <span class="meta-edit__label">시나리오 이름 <em aria-hidden="true">*</em></span>
        <AppInput
          v-model="name"
          placeholder="예: 3단계 적극 개방안 보완"
        />
      </label>

      <label class="meta-edit__field">
        <span class="meta-edit__label">메모 (선택)</span>
        <textarea
          v-model="memo"
          class="meta-edit__memo"
          rows="3"
          placeholder="정책 배경, 참고 사항 등"
        />
      </label>

      <p class="meta-edit__hint">
        이름과 메모만 수정됩니다. 설정값과 결과 스냅샷은 바뀌지 않습니다.
      </p>

      <p
        v-if="errorMessage"
        class="meta-edit__error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <div class="meta-edit__actions">
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
.meta-edit {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &__loading {
    padding: $space-4 0;
    text-align: center;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

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

  &__hint {
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
