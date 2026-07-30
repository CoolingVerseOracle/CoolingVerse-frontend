import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from '@/api/http'
import { useAuthStore } from '@/stores/auth'
import '@/assets/styles/main.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 401(구 토큰·서버 재시작) 시 세션 정리 후 로그인 화면으로 — Pinia 활성화 이후 등록
setUnauthorizedHandler(() => {
  useAuthStore().logout()
  void router.push({ name: 'login' })
})

app.mount('#app')
