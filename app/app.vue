<script setup lang="ts">
import { Toaster } from 'vue-sonner'

// Head metadata from __root.tsx
useHead({
  title: 'Axoria — Painel Admin',
  meta: [
    { name: 'description', content: 'Painel administrativo Axoria' }
  ],
  htmlAttrs: {
    lang: 'pt-BR'
  }
})
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster rich-colors position="top-right" />
  </div>
</template>

<style>
/* Global styles are imported in nuxt.config.ts from src/styles.css */
</style>
