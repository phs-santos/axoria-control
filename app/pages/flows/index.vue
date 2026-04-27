<script setup lang="ts">
import {
	Plus,
	Play,
	Trash2,
	Settings2,
	ArrowRight,
	Loader2,
	Box,
	Zap,
	Activity
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import Button from '~/components/ui/Button.vue'
import { flowsService, type WebhookFlow } from '~/services/flows.service'

const flows = ref<WebhookFlow[]>([])
const loading = ref(true)
const creating = ref(false)
const showCreate = ref(false)

const newFlow = ref({
	name: "",
	description: "",
	triggerEvents: [] as string[]
})

const eventInput = ref("")

const addEvent = () => {
	if (eventInput.value && !newFlow.value.triggerEvents.includes(eventInput.value)) {
		newFlow.value.triggerEvents.push(eventInput.value)
		eventInput.value = ""
	}
}

const removeEvent = (event: string) => {
	newFlow.value.triggerEvents = newFlow.value.triggerEvents.filter(e => e !== event)
}

const SUGGESTED_TRIGGERS = [
	'user.created',
	'user.updated',
	'telegram.message_received',
	'telegram.command_received',
	'reminder.due',
	'flow.completed',
	'storage.file_uploaded'
]

const toggleTrigger = (event: string) => {
	if (newFlow.value.triggerEvents.includes(event)) {
		removeEvent(event)
	} else {
		newFlow.value.triggerEvents.push(event)
	}
}

const fetchFlows = async () => {
	loading.value = true
	try {
		flows.value = await flowsService.getAll()
	} catch (err) {
		toast.error("Falha ao carregar fluxos")
	} finally {
		loading.value = false
	}
}

const createFlow = async () => {
	if (!newFlow.value.name) return
	creating.value = true
	try {
		const flow = await flowsService.create(newFlow.value)
		toast.success("Fluxo criado com sucesso")
		showCreate.value = false
		newFlow.value = { name: "", description: "", triggerEvents: [] }
		navigateTo(`/flows/${flow.id}`)
	} catch (err) {
		toast.error("Falha ao criar fluxo")
	} finally {
		creating.value = false
	}
}

const deleteFlow = async (id: string) => {
	if (!confirm("Deseja excluir este fluxo?")) return
	try {
		await flowsService.delete(id)
		toast.success("Fluxo removido")
		fetchFlows()
	} catch (err) {
		toast.error("Falha ao remover fluxo")
	}
}

const executeFlow = async (id: string) => {
	try {
		await flowsService.execute(id, { trigger: "manual_panel" })
		toast.success("Execução iniciada em background")
	} catch (err) {
		toast.error("Falha ao iniciar execução")
	}
}

onMounted(fetchFlows)
</script>

<template>
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Fluxos de Orquestração</h1>
				<p class="text-muted-foreground">Orquestre múltiplas requisições HTTP baseadas em eventos.</p>
			</div>
			<Button @click="showCreate = true">
				<Plus class="mr-2 h-4 w-4" />
				Novo Fluxo
			</Button>
		</div>

		<div v-if="loading" class="flex flex-col items-center justify-center py-20 text-muted-foreground">
			<Loader2 class="h-8 w-8 animate-spin mb-4" />
			Carregando fluxos...
		</div>

		<div v-else-if="flows.length === 0"
			class="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
			<div class="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
				<Zap class="h-6 w-6" />
			</div>
			<p class="text-lg font-medium">Nenhum fluxo encontrado</p>
			<p class="text-sm text-muted-foreground mb-6">Comece criando um fluxo para automatizar processos.</p>
			<Button variant="outline" @click="showCreate = true">
				Criar meu primeiro fluxo
			</Button>
		</div>

		<div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			<div v-for="flow in flows" :key="flow.id"
				class="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
				<div class="flex justify-between items-start mb-4">
					<div class="h-10 w-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
						:class="flow.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'">
						<Zap class="h-5 w-5" v-if="flow.triggerEvents.length > 0" />
						<Activity class="h-5 w-5" v-else />
					</div>
					<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
						<Button variant="ghost" size="icon" class="h-8 w-8" @click.stop="executeFlow(flow.id)">
							<Play class="h-4 w-4 text-green-500" />
						</Button>
						<Button variant="ghost" size="icon" class="h-8 w-8 text-destructive"
							@click.stop="deleteFlow(flow.id)">
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>
				</div>

				<div class="space-y-1">
					<div class="flex items-center gap-2">
						<h3 class="font-semibold leading-none">{{ flow.name }}</h3>
						<span v-if="!flow.isActive"
							class="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase font-bold text-muted-foreground">Inativo</span>
					</div>
					<p class="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
						{{ flow.description || 'Sem descrição' }}
					</p>
				</div>

				<!-- Trigger Events Tags -->
				<div v-if="flow.triggerEvents.length > 0" class="mt-4 flex flex-wrap gap-1">
					<span v-for="event in flow.triggerEvents" :key="event"
						class="text-[10px] bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded-full">
						{{ event }}
					</span>
				</div>

				<div class="mt-6 flex items-center justify-between border-t pt-4">
					<div class="flex items-center text-xs text-muted-foreground font-medium">
						<Box class="mr-1.5 h-3.5 w-3.5" />
						{{ flow.stepsCount }} {{ flow.stepsCount === 1 ? 'passo' : 'passos' }}
					</div>
					<NuxtLink :to="`/flows/${flow.id}`">
						<Button variant="ghost" size="sm"
							class="h-8 group-hover:bg-primary group-hover:text-primary-foreground">
							Configurar
							<ArrowRight class="ml-1 h-3 w-3" />
						</Button>
					</NuxtLink>
				</div>
			</div>
		</div>

		<!-- Create Modal -->
		<div v-if="showCreate"
			class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
			<div
				class="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg animate-in fade-in zoom-in duration-200">
				<h2 class="text-xl font-bold mb-1">Novo Fluxo</h2>
				<p class="text-sm text-muted-foreground mb-6">Defina como e quando este fluxo será disparado.</p>

				<form @submit.prevent="createFlow" class="space-y-4">
					<div class="space-y-2">
						<label class="text-sm font-medium">Nome do Fluxo</label>
						<input v-model="newFlow.name" placeholder="Ex: Sincronizar Novo Usuário" required
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium">Eventos de Gatilho (Trigger)</label>
						<div class="flex gap-2">
							<input v-model="eventInput" placeholder="ex: user.created" @keydown.enter.prevent="addEvent"
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
							<Button type="button" variant="outline" size="sm" @click="addEvent">Add</Button>
						</div>
						<div class="flex flex-wrap gap-1 mt-2">
							<span v-for="event in newFlow.triggerEvents" :key="event"
								class="inline-flex items-center gap-1 text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
								{{ event }}
								<button type="button" @click="removeEvent(event)"
									class="hover:text-destructive">×</button>
							</span>
						</div>
						<p class="text-[10px] text-muted-foreground italic">Deixe vazio para disparo apenas manual via
							API.</p>

						<div class="mt-3">
							<label
								class="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Sugestões</label>
							<div class="flex flex-wrap gap-1">
								<button v-for="st in SUGGESTED_TRIGGERS" :key="st" type="button"
									@click="toggleTrigger(st)"
									class="text-[9px] border px-2 py-0.5 rounded-full transition-all"
									:class="newFlow.triggerEvents.includes(st) ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:border-primary/30'">
									{{ st }}
								</button>
							</div>
						</div>
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium">Descrição</label>
						<textarea v-model="newFlow.description" placeholder="Explique o objetivo deste fluxo..."
							rows="2"
							class="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
					</div>

					<div class="flex justify-end gap-3 pt-4 border-t">
						<Button variant="ghost" type="button" @click="showCreate = false">Cancelar</Button>
						<Button type="submit" :disabled="creating">
							<Loader2 v-if="creating" class="mr-2 h-4 w-4 animate-spin" />
							Criar Fluxo
						</Button>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>
