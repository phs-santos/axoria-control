<script setup lang="ts">
import {
	Plus,
	Trash2,
	ArrowLeft,
	Loader2,
	Save,
	Play,
	Zap,
	Globe,
	Code2
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import Button from '~/components/ui/Button.vue'
import { flowsService, type WebhookFlow, type FlowStep } from '~/services/flows.service'

const route = useRoute()
const flowId = route.params.id as string

const flow = ref<WebhookFlow | null>(null)
const steps = ref<FlowStep[]>([])
const loading = ref(true)
const saving = ref(false)
const executing = ref(false)

const fetchFlowData = async () => {
	loading.value = true
	try {
		// Buscamos os detalhes do fluxo e os passos em paralelo
		const [flowData, stepsData] = await Promise.all([
			flowsService.getById(flowId),
			flowsService.getSteps(flowId)
		])
		flow.value = flowData
		steps.value = stepsData.sort((a, b) => a.order - b.order)
	} catch (err) {
		toast.error("Falha ao carregar dados do fluxo")
		navigateTo('/flows')
	} finally {
		loading.value = false
	}
}

const addNewStep = () => {
	const maxOrder = steps.value.reduce((max, s) => Math.max(max, s.order), 0)
	steps.value.push({
		order: maxOrder + 1,
		method: "POST",
		url: "",
		headers: {},
		body: null,
		responseMapping: {},
		stopOnFailure: false
	})
}

const removeStep = (index: number) => {
	steps.value.splice(index, 1)
	steps.value.forEach((s, i) => s.order = i + 1)
}

const saveChanges = async () => {
	saving.value = true
	try {
		for (const step of steps.value) {
			if (!step.id) {
				await flowsService.addStep(flowId, step)
			}
		}

		toast.success("Fluxo sincronizado com sucesso")
		fetchFlowData()
	} catch (err) {
		toast.error("Erro ao salvar alterações")
	} finally {
		saving.value = false
	}
}

const testFlow = async () => {
	executing.value = true
	try {
		const payload = { trigger: "manual_test", timestamp: new Date().toISOString() }
		const response = await flowsService.execute(flowId, payload) as any
		const execId = response.executionId || response.id || response.flowId
		if (execId) {
			toast.success("Teste disparado! Redirecionando...")
			navigateTo(`/flows/monitor/${execId}`)
		} else {
			toast.success("Teste disparado! Verifique os logs em breve.")
		}
	} catch (err) {
		toast.error("Erro ao disparar teste")
	} finally {
		executing.value = false
	}
}

onMounted(fetchFlowData)
</script>

<template>
	<div class="space-y-6 max-w-5xl mx-auto pb-20">
		<!-- Breadcrumbs/Header -->
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
			<div class="flex items-center gap-2">
				<Button variant="outline" @click="testFlow" :disabled="executing">
					<Loader2 v-if="executing" class="mr-2 h-4 w-4 animate-spin" />
					<Play v-else class="mr-2 h-4 w-4 text-green-500" />
					Testar
				</Button>
				<Button @click="saveChanges" :disabled="saving">
					<Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
					<Save v-else class="mr-2 h-4 w-4" />
					Salvar
				</Button>
			</div>
		</div>

		<div v-if="loading" class="flex items-center justify-center py-20">
			<Loader2 class="h-8 w-8 animate-spin text-primary" />
		</div>

		<div v-else class="space-y-4">
			<!-- Steps List -->
			<div v-if="steps.length === 0" class="text-center py-16 border-2 border-dashed rounded-xl bg-muted/10">
				<Globe class="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
				<h3 class="text-lg font-medium">Nenhum passo configurado</h3>
				<p class="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">Adicione requisições HTTP que serão
					executadas em sequência quando o fluxo for disparado.</p>
				<Button variant="outline" @click="addNewStep">
					<Plus class="mr-2 h-4 w-4" />
					Adicionar Primeiro Passo
				</Button>
			</div>

			<div v-else class="space-y-6">
				<div v-for="(step, index) in steps" :key="index"
					class="group relative rounded-xl border bg-card shadow-sm transition-all hover:border-primary/30">
					<!-- Step Header -->
					<div class="flex items-center justify-between bg-muted/20 px-4 py-2 border-b rounded-t-xl">
						<div class="flex items-center gap-3">
							<div
								class="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
								{{ step.order }}
							</div>
							<span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">HTTP
								Request</span>
						</div>
						<Button variant="ghost" size="icon"
							class="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100"
							@click="removeStep(index)">
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>

					<div class="p-6 grid gap-6 md:grid-cols-12">
						<!-- URL and Method -->
						<div class="md:col-span-2">
							<label
								class="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block">Método</label>
							<select v-model="step.method"
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring">
								<option>GET</option>
								<option>POST</option>
								<option>PUT</option>
								<option>PATCH</option>
								<option>DELETE</option>
							</select>
						</div>
						<div class="md:col-span-10">
							<label class="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block">URL do
								Endpoint</label>
							<div class="relative">
								<input v-model="step.url" placeholder="https://api.exemplo.com/v1/{{recurso}}"
									class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring pl-8 font-mono text-[13px]" />
								<Globe class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							</div>
						</div>

						<!-- Body Editor -->
						<div class="md:col-span-7">
							<div class="flex items-center justify-between mb-1.5">
								<label class="text-[10px] font-bold uppercase text-muted-foreground block">JSON
									Body</label>
								<span class="text-[9px] text-muted-foreground italic" v-pre>Suporta {{variaveis}}</span>
							</div>
							<div class="relative group/editor">
								<textarea v-model="step.body" placeholder='{ "email": "{{user_email}}" }' rows="6"
									class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm outline-none focus:ring-1 focus:ring-ring resize-none" />
								<Code2 class="absolute right-2 top-2 h-3 w-3 text-muted-foreground opacity-30" />
							</div>
						</div>

						<!-- Response Mapping -->
						<div class="md:col-span-5">
							<label class="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block">Mapeamento
								de Resposta</label>
							<div class="space-y-4">
								<textarea placeholder='{ "var_nome": "data.user.name" }' rows="4"
									class="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm outline-none focus:ring-1 focus:ring-ring" />
								<div class="flex items-center gap-2 px-1">
									<input type="checkbox" v-model="step.stopOnFailure"
										class="rounded border-input text-primary focus:ring-primary" />
									<span class="text-[10px] font-medium text-muted-foreground">Parar execução se este
										passo falhar</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Add Step Button -->
				<Button variant="outline"
					class="w-full border-dashed py-8 border-2 hover:bg-primary/5 hover:border-primary/50"
					@click="addNewStep">
					<Plus class="mr-2 h-4 w-4" />
					Adicionar Novo Passo na Sequência
				</Button>
			</div>
		</div>
	</div>
</template>
