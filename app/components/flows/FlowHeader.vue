<script setup lang="ts">
import { ArrowLeft, Zap, Loader2, Play, Save } from 'lucide-vue-next'
import Button from '~/components/ui/Button.vue'

defineProps<{
	flow: any
	activeTab: 'designer' | 'steps' | 'schedules'
	saving: boolean
	executing: boolean
}>()

defineEmits(['update:activeTab', 'test', 'save'])
</script>

<template>
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<NuxtLink to="/flows">
				<Button variant="ghost" size="icon" class="h-9 w-9">
					<ArrowLeft class="h-4 w-4" />
				</Button>
			</NuxtLink>
			<div v-if="flow">
				<div class="flex items-center gap-2 mb-1">
					<h1 class="text-2xl font-bold tracking-tight">{{ flow.name }}</h1>
					<span v-if="flow.isActive" class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
				</div>
				<div class="flex items-center gap-3 text-sm text-muted-foreground">
					<div v-if="flow.triggerEvents.length > 0" class="flex items-center gap-1">
						<Zap class="h-3.5 w-3.5 text-primary" />
						{{ flow.triggerEvents.join(', ') }}
					</div>
					<div v-else>Disparo Manual</div>
				</div>
			</div>
		</div>

		<!-- Tab Switcher -->
		<div class="flex items-center bg-muted/50 p-1 rounded-xl border">
			<button v-for="tab in (['designer', 'steps', 'schedules'] as const)" :key="tab"
				@click="$emit('update:activeTab', tab)" :class="activeTab === tab ? 'bg-background shadow-sm' : ''"
				class="px-4 py-1.5 text-xs font-medium rounded-lg transition-all capitalize">
				{{ tab === 'steps' ? 'Passos' : tab === 'schedules' ? 'Agendamentos' : 'Designer' }}
			</button>
		</div>

		<!-- Actions -->
		<div class="flex items-center gap-2">
			<Button variant="outline" @click="$emit('test')" :disabled="executing">
				<Loader2 v-if="executing" class="mr-2 h-4 w-4 animate-spin" />
				<Play v-else class="mr-2 h-4 w-4 text-green-500" />
				Testar
			</Button>
			<Button @click="$emit('save')" :disabled="saving">
				<Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
				<Save v-else class="mr-2 h-4 w-4" />
				Salvar
			</Button>
		</div>
	</div>
</template>
