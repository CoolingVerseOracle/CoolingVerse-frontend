<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppLogo from '@/components/common/AppLogo.vue'
import { useAuthStore } from '@/stores/auth'
import iconUser from '@/assets/icons/icon-user.svg'
import iconLock from '@/assets/icons/icon-lock.svg'
import iconEyeOff from '@/assets/icons/icon-eye-off.svg'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const submitting = ref(false)
const errorMessage = ref('')

async function onSubmit(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    const res = await auth.login(username.value, password.value)
    if (res.ok) {
      void router.push({ name: 'dashboard' })
    } else {
      errorMessage.value = res.message ?? '로그인에 실패했습니다.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-view">
    <div class="login-view__panel">
      <header class="login-view__header">
        <AppLogo :size="37" />
        <h1 class="login-view__title">
          유휴 주차자원 활용 정책 시뮬레이션 플랫폼
        </h1>
      </header>

      <form
        class="login-view__form"
        @submit.prevent="onSubmit"
      >
        <div class="login-view__inputs">
          <AppInput
            v-model="username"
            placeholder="사용자 계정 입력"
          >
            <template #icon>
              <img
                :src="iconUser"
                alt=""
                width="14"
              >
            </template>
          </AppInput>
          <AppInput
            v-model="password"
            type="password"
            revealable
            placeholder="사용자 비밀번호 입력"
          >
            <template #icon>
              <img
                :src="iconLock"
                alt=""
                width="14"
              >
            </template>
            <template #reveal-icon>
              <img
                :src="iconEyeOff"
                alt=""
                width="18"
              >
            </template>
          </AppInput>
        </div>

        <p
          v-if="errorMessage"
          class="login-view__error"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <AppButton
          type="submit"
          block
          :disabled="submitting"
        >
          로그인
        </AppButton>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: $space-4;

  &__panel {
    display: flex;
    flex-direction: column;
    gap: $space-8;
    width: 100%;
    max-width: 400px;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-3;
  }

  &__title {
    font-size: $font-size-xl;
    font-weight: 500;
    letter-spacing: -0.6px;
    line-height: 36px;
    color: $color-text;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__inputs {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  &__error {
    font-size: $font-size-sm;
    color: $color-danger;
  }
}
</style>
