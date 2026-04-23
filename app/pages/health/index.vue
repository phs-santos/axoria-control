<script setup lang="ts">
import { Activity, RefreshCw } from 'lucide-vue-next'
import { api } from '~/utils/api'
import Button from '~/components/ui/Button.vue'

interface Health {
	status?: string;
	mode?: string;
	database?: string;
	storage_usage?: string;
	uptime?: string;
	timestamp?: string;
}

const { data, pending, error, refresh } = useAsyncData('health-page', async () => {
	try {
		const res = await fetch("https://services.axoria.digital/health", {
			headers: { Accept: "application/json" },
		})
		if (!res.ok) {
			return api<Health>("/health", { auth: false })
		}
		return (await res.json()) as Health
	} catch {
		return api<Health>("/health", { auth: false })
	}
})

// Auto refresh every 30s
let timer: any
onMounted(() => {
	timer = setInterval(() => refresh(), 30000)
})
onUnmounted(() => {
	clearInterval(timer)
})
</script>

<template>
	<div class="space-y-6">
		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Sistema</h1>
				<p class="text-sm text-muted-foreground">Status em tempo real da API.</p>
			</div>
			<Button variant="outline" size="sm" @click="refresh()" :disabled="pending">
				<RefreshCw :class="['mr-2 h-4 w-4', pending ? 'animate-spin' : '']" />
				Atualizar
			</Button>
		</div>

		<div class="rounded-xl border bg-card text-card-foreground shadow">
			<div class="p-6 flex flex-col space-y-1.5 pb-4">
				<h3 class="flex items-center gap-2 text-base font-semibold leading-none tracking-tight">
					<Activity class="h-4 w-4" /> Health Check
				</h3>
			</div>
			<div class="p-6 pt-0">
				<div v-if="pending && !data" class="text-sm text-muted-foreground">Carregando...</div>
				<div v-else-if="error" class="text-sm text-destructive">Erro ao buscar status</div>
				<div v-else class="grid gap-3 sm:grid-cols-2">
					<div class="rounded-md border bg-muted/30 px-3 py-2">
						<div class="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
						<div class="mt-0.5 text-sm font-medium">
							<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
								:class="data?.status === 'ok' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'">
								{{ data?.status ?? "—" }}
							</span>
						</div>
					</div>
					<div class="rounded-md border bg-muted/30 px-3 py-2">
						<div class="text-xs uppercase tracking-wide text-muted-foreground">Modo</div>
						<div class="mt-0.5 text-sm font-medium">{{ data?.mode ?? "—" }}</div>
					</div>
					<div class="rounded-md border bg-muted/30 px-3 py-2">
						<div class="text-xs uppercase tracking-wide text-muted-foreground">Banco de dados</div>
						<div class="mt-0.5 text-sm font-medium">{{ data?.database ?? "—" }}</div>
					</div>
					<div class="rounded-md border bg-muted/30 px-3 py-2">
						<div class="text-xs uppercase tracking-wide text-muted-foreground">Armazenamento</div>
						<div class="mt-0.5 text-sm font-medium">{{ data?.storage_usage ?? "—" }}</div>
					</div>
					<div class="rounded-md border bg-muted/30 px-3 py-2">
						<div class="text-xs uppercase tracking-wide text-muted-foreground">Uptime</div>
						<div class="mt-0.5 text-sm font-medium">{{ data?.uptime ?? "—" }}</div>
					</div>
					<div class="rounded-md border bg-muted/30 px-3 py-2">
						<div class="text-xs uppercase tracking-wide text-muted-foreground">Timestamp</div>
						<div class="mt-0.5 text-sm font-medium">{{ data?.timestamp ?? "—" }}</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
