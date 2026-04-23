<script setup lang="ts">
import { KeyRound, Users, Webhook, Send, Activity } from 'lucide-vue-next'
import { api } from '~/utils/api'

interface HealthResponse {
	status?: string;
	mode?: string;
	database?: string;
	storage_usage?: string;
	uptime?: string;
	timestamp?: string;
}

const { data: health, pending: healthPending, error: healthError } = useAsyncData('health', () =>
	api<HealthResponse>("/../health", { auth: false }).catch(() =>
		api<HealthResponse>("/health", { auth: false })
	)
)

const { data: apiKeys, pending: apiKeysPending } = useAsyncData('api-keys', () => api<any[]>("/auth/api-keys"))
const { data: users, pending: usersPending } = useAsyncData('users', () => api<any[]>("/users"))
const { data: bots, pending: botsPending } = useAsyncData('bots', () => api<any[]>("/telegram/bots"))

const stats = computed(() => [
	{ label: "API Keys", icon: KeyRound, value: apiKeys.value?.length ?? "—", loading: apiKeysPending.value },
	{ label: "Usuários", icon: Users, value: users.value?.length ?? "—", loading: usersPending.value },
	{ label: "Bots Telegram", icon: Send, value: bots.value?.length ?? "—", loading: botsPending.value },
])
</script>

<template>
	<div class="space-y-6">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Visão geral</h1>
			<p class="text-sm text-muted-foreground">Resumo dos recursos da sua conta.</p>
		</div>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div v-for="s in stats" :key="s.label" class="rounded-xl border bg-card text-card-foreground shadow">
				<div class="p-6 flex flex-row items-center justify-between pb-2 space-y-0">
					<h3 class="text-sm font-medium text-muted-foreground">{{ s.label }}</h3>
					<component :is="s.icon" class="h-4 w-4 text-muted-foreground" />
				</div>
				<div class="p-6 pt-0">
					<div class="text-2xl font-bold">
						{{ s.loading ? "..." : s.value }}
					</div>
				</div>
			</div>
		</div>

		<div class="rounded-xl border bg-card text-card-foreground shadow">
			<div class="p-6 flex flex-col space-y-1.5 pb-4">
				<h3 class="flex items-center gap-2 text-base font-semibold leading-none tracking-tight">
					<Activity class="h-4 w-4" /> Saúde do sistema
				</h3>
			</div>
			<div class="p-6 pt-0">
				<div v-if="healthPending" class="text-sm text-muted-foreground">Carregando...</div>
				<div v-else-if="healthError" class="text-sm text-destructive">Não foi possível carregar.</div>
				<div v-else class="grid gap-3 sm:grid-cols-2">
					<div class="rounded-md border bg-muted/30 px-3 py-2">
						<div class="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
						<div class="mt-0.5 text-sm font-medium">
							<span
								class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
								:class="health?.status === 'ok' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'">
								{{ health?.status ?? "—" }}
							</span>
						</div>
					</div>
					<div class="rounded-md border bg-muted/30 px-3 py-2">
						<div class="text-xs uppercase tracking-wide text-muted-foreground">Modo</div>
						<div class="mt-0.5 text-sm font-medium">{{ health?.mode ?? "—" }}</div>
					</div>
					<div class="rounded-md border bg-muted/30 px-3 py-2">
						<div class="text-xs uppercase tracking-wide text-muted-foreground">Banco de dados</div>
						<div class="mt-0.5 text-sm font-medium">{{ health?.database ?? "—" }}</div>
					</div>
					<div class="rounded-md border bg-muted/30 px-3 py-2">
						<div class="text-xs uppercase tracking-wide text-muted-foreground">Armazenamento</div>
						<div class="mt-0.5 text-sm font-medium">{{ health?.storage_usage ?? "—" }}</div>
					</div>
					<div class="rounded-md border bg-muted/30 px-3 py-2">
						<div class="text-xs uppercase tracking-wide text-muted-foreground">Uptime</div>
						<div class="mt-0.5 text-sm font-medium">{{ health?.uptime ?? "—" }}</div>
					</div>
					<div class="rounded-md border bg-muted/30 px-3 py-2">
						<div class="text-xs uppercase tracking-wide text-muted-foreground">Timestamp</div>
						<div class="mt-0.5 text-sm font-medium">{{ health?.timestamp ?? "—" }}</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
