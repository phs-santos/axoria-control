<script setup lang="ts">
import { Layout } from 'lucide-vue-next'

defineProps<{
	show: boolean
	logs: any[]
}>()

defineEmits(['close'])
</script>

<template>
	<div v-if="show"
		class="absolute top-4 right-4 z-20 w-80 max-h-[80%] bg-background/95 backdrop-blur border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-4">
		<div class="p-3 border-b flex items-center justify-between bg-muted/50">
			<span class="text-xs font-bold uppercase tracking-wider">Console de Execução</span>
			<button @click="$emit('close')" class="text-muted-foreground hover:text-foreground">
				<Layout class="h-3 w-3" />
			</button>
		</div>
		<div class="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-[10px]">
			<div v-if="logs.length === 0" class="text-muted-foreground italic">Aguardando início...</div>
			<div v-for="(log, i) in logs" :key="i" :class="log.level === 'ERROR' ? 'text-red-500' : 'text-foreground'">
				<span class="text-muted-foreground">[{{ new Date(log.createdAt).toLocaleTimeString() }}]</span>
				{{ log.message }}
			</div>
		</div>
	</div>
</template>
