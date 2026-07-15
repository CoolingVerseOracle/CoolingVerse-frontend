import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 인증 없이 접근 가능한 라우트 (로그인 등) */
    public?: boolean
  }
}
