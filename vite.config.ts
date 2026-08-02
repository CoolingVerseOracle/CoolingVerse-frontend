import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/styles/variables" as *;\n@use "@/assets/styles/mixins" as *;\n`,
      },
    },
  },
  // 스토어/유틸 로직 단위 테스트 — DOM 불필요하므로 기본 node 환경 유지 (경량)
  test: {
    include: ['src/**/*.spec.ts'],
  },
})
