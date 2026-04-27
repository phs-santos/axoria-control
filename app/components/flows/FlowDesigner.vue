<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps<{
	nodes: any[]
	edges: any[]
}>()

const nodesModel = defineModel<any[]>('nodes', { default: () => [] })
const edgesModel = defineModel<any[]>('edges', { default: () => [] })

defineEmits(['node-drag-stop'])
</script>

<template>
	<div class="flex-1 min-h-0 relative rounded-2xl border bg-card overflow-hidden shadow-sm h-[calc(100vh-250px)]">
		<ClientOnly>
			<VueFlow v-model:nodes="nodesModel" v-model:edges="edgesModel" @node-drag-stop="$emit('node-drag-stop', $event)"
				:fit-view-on-init="true">
				<Background />
				<Controls />
			</VueFlow>

			<template #fallback>
				<div class="flex h-full items-center justify-center bg-muted/5">
					<div class="flex flex-col items-center gap-2">
						<Loader2 class="h-8 w-8 animate-spin text-primary/20" />
						<span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Iniciando
							Designer...</span>
					</div>
				</div>
			</template>
		</ClientOnly>
		<slot />
		<div
			class="absolute bottom-4 right-4 z-10 bg-background/80 backdrop-blur border rounded-lg p-3 text-[10px] text-muted-foreground shadow-sm">
			Dica: Arraste os nós para organizar seu fluxo visualmente.
		</div>
	</div>
</template>
