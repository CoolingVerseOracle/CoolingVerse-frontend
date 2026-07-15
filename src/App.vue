<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BlankLayout from '@/layouts/BlankLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const route = useRoute()
const layout = computed(() => (route.meta.public ? BlankLayout : DefaultLayout))
</script>

<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>
