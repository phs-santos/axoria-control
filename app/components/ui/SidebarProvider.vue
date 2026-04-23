<script setup lang="ts">
import { ref, provide } from 'vue'
import { cn } from '~/utils/utils'

// Sidebar State
const isOpen = ref(true)
const isMobile = ref(false)

const toggleSidebar = () => {
  isOpen.value = !isOpen.value
}

provide('sidebar', {
  isOpen,
  isMobile,
  toggleSidebar
})

defineProps<{
  class?: string
}>()
</script>

<template>
  <div :class="cn('flex min-h-screen w-full bg-muted/30', $props.class)">
    <slot />
  </div>
</template>
