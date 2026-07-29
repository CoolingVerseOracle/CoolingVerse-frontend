import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/dashboard' },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/scenarios',
      name: 'scenarios',
      component: () => import('@/views/ScenarioManagementView.vue'),
    },
    // 미매칭 경로는 대시보드로 (비인증이면 가드가 로그인으로 재라우팅)
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

// 경량 인증 가드 — sessionStorage 기반 플래그만 확인 (JWT/만료 검사 없음)
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
