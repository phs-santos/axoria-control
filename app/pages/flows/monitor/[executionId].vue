<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { AlertCircle, Info, Activity } from 'lucide-vue-next'
import { API_BASE_URL } from '~/utils/api'

const route = useRoute()
const executionId = route.params.executionId as string

interface FlowLog {
	id?: string
	message: string
	level: 'INFO' | 'ERROR' | 'WARN'
	data?: any
	timestamp?: string
}

interface SocketMessage {
	event: 'connected' | 'flow_started' | 'flow_progress' | 'flow_log' | 'flow_finished'
	data: any
	timestamp: string
}

const status = ref<'CONNECTING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DISCONNECTED'>('CONNECTING')
const currentStep = ref(0)
const totalSteps = ref(0)
const logs = ref<FlowLog[]>([])
const ws = ref<WebSocket | null>(null)

const progressPercentage = computed(() => {
	if (totalSteps.value === 0) return 0
	return Math.round((currentStep.value / totalSteps.value) * 100)
})

onMounted(() => {
	// Converte a URL da API (http/https) para ws/wss
	const wsUrl = new URL(API_BASE_URL)
	wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:'

	const monitorUrl = `${wsUrl.origin}/api/monitor/${executionId}`

	ws.value = new WebSocket(monitorUrl)

	ws.value.onopen = () => {
		status.value = 'RUNNING'
		logs.value.push({ message: 'Conectado ao monitor em tempo real.', level: 'INFO', timestamp: new Date().toISOString() })
	}

	ws.value.onmessage = (event) => {
		try {
			const payload: SocketMessage = JSON.parse(event.data)

			switch (payload.event) {
				case 'connected':
					break;
				case 'flow_started':
					totalSteps.value = payload.data.totalSteps || 0
					logs.value.push({ message: 'Execução do fluxo iniciada.', level: 'INFO', timestamp: payload.timestamp })
					break;
				case 'flow_progress':
					currentStep.value = payload.data.currentStep
					logs.value.push({
						message: payload.data.message,
						level: 'INFO',
						data: payload.data.data,
						timestamp: payload.timestamp
					})
					break;
				case 'flow_log':
					logs.value.push({
						message: payload.data.message,
						level: payload.data.level,
						data: payload.data.data,
						timestamp: payload.data.createdAt || payload.timestamp
					})
					break;
				case 'flow_finished':
					status.value = payload.data.status
					logs.value.push({
						message: `Execução finalizada com status: ${status.value}`,
						level: status.value === 'COMPLETED' ? 'INFO' : 'ERROR',
						timestamp: payload.timestamp
					})
					break;
			}
		} catch (err) {
			console.error("Erro ao parsear mensagem do WebSocket", err)
		}
	}

	ws.value.onclose = () => {
		if (status.value === 'RUNNING') status.value = 'DISCONNECTED'
		logs.value.push({ message: 'Conexão com o monitor encerrada/perdida.', level: 'WARN', timestamp: new Date().toISOString() })
	}
})

onUnmounted(() => {
	if (ws.value) {
		ws.value.close()
	}
})

const getLogIcon = (level: string) => {
	if (level === 'ERROR') return AlertCircle
	if (level === 'WARN') return AlertCircle
	return Info
}

const getLogColor = (level: string) => {
	if (level === 'ERROR') return 'text-destructive bg-destructive/10 border-destructive/20'
	if (level === 'WARN') return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
	return 'text-primary bg-primary/10 border-primary/20'
}
</script>

<template>
	<div class="max-w-4xl mx-auto space-y-6 pb-12">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Monitor de Execução</h1>
				<p class="text-muted-foreground font-mono text-sm mt-1">ID: {{ executionId }}</p>
			</div>

			<div class="flex items-center gap-3">
				<span
					class="text-sm font-medium flex items-center gap-2 bg-card px-4 py-2 rounded-full border shadow-sm">
					<span class="relative flex h-3 w-3">
						<span v-if="status === 'RUNNING' || status === 'CONNECTING'"
							class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
							:class="status === 'CONNECTING' ? 'bg-yellow-400' : 'bg-green-400'"></span>
						<span class="relative inline-flex rounded-full h-3 w-3" :class="{
							'bg-yellow-500': status === 'CONNECTING',
							'bg-green-500': status === 'RUNNING',
							'bg-blue-500': status === 'COMPLETED',
							'bg-red-500': status === 'FAILED',
							'bg-gray-500': status === 'DISCONNECTED'
						}"></span>
					</span>
					{{ status }}
				</span>
			</div>
		</div>

		<!-- Progresso -->
		<div class="rounded-xl border bg-card p-6 shadow-sm">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm font-medium">Progresso do Fluxo</span>
				<span class="text-sm font-bold">{{ progressPercentage }}%</span>
			</div>
			<div class="w-full bg-muted rounded-full h-3 overflow-hidden">
				<div class="bg-primary h-3 transition-all duration-500 ease-out"
					:style="{ width: `${progressPercentage}%` }">
				</div>
			</div>
			<div class="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
				<span>Passo {{ currentStep }} de {{ totalSteps || '?' }}</span>
			</div>
		</div>

		<!-- Timeline de Logs -->
		<div class="rounded-xl border bg-card shadow-sm overflow-hidden">
			<div class="p-4 border-b bg-muted/30">
				<h3 class="font-semibold text-sm flex items-center gap-2">
					<Activity class="h-4 w-4 text-primary" />
					Timeline de Eventos
				</h3>
			</div>
			<div class="p-6">
				<div
					class="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-border before:to-transparent">
					<div v-for="(log, idx) in logs" :key="idx"
						class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active animate-in slide-in-from-bottom-2 duration-300 fade-in">
						<!-- Icon -->
						<div class="flex items-center justify-center w-10 h-10 rounded-full border shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"
							:class="getLogColor(log.level)">
							<component :is="getLogIcon(log.level)" class="h-4 w-4" />
						</div>

						<!-- Card -->
						<div
							class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
							<div class="flex items-center justify-between mb-1">
								<span class="font-bold text-sm"
									:class="log.level === 'ERROR' ? 'text-destructive' : ''">{{ log.level
									}}</span>
								<span
									class="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">{{
										log.timestamp
											? new Date(log.timestamp).toLocaleTimeString() : '' }}</span>
							</div>
							<p class="text-sm text-foreground/80 mt-2">{{ log.message }}</p>

							<div v-if="log.data"
								class="mt-3 p-3 rounded-lg bg-muted/50 overflow-x-auto border border-border/50">
								<pre
									class="text-[10px] font-mono text-muted-foreground">{{ JSON.stringify(log.data, null, 2) }}</pre>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
