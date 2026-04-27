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
	Code2,
	Layout
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import Button from '~/components/ui/Button.vue'
import { flowsService, type WebhookFlow, type FlowStep } from '~/services/flows.service'

const route = useRoute()
const flowId = route.params.id as string

interface EditableFlowStep extends Omit<FlowStep, 'headers' | 'responseMapping' | 'body'> {
	headers: string
	responseMapping: string
	body: string
	condition: string
}

const flow = ref<WebhookFlow | null>(null)
const steps = ref<EditableFlowStep[]>([])
const stepsToDelete = ref<string[]>([])
const loading = ref(true)
const saving = ref(false)
const executing = ref(false)
const viewMode = ref<'list' | 'visual'>('list')

const { onConnect, addEdges, onNodeDragStop } = useVueFlow()
const nodes = ref<any[]>([])
const edges = ref<any[]>([])

const fetchFlowData = async () => {
	loading.value = true
	try {
		const [flowData, stepsData] = await Promise.all([
			flowsService.getById(flowId),
			flowsService.getSteps(flowId)
		])
		flow.value = flowData
		// Garantir que body, headers e mapping sejam strings para o editor se necessário, 
		// ou lidar com eles como objetos e usar JSON.stringify no v-model
		steps.value = stepsData.sort((a, b) => a.order - b.order).map(s => ({
			...s,
			body: typeof s.body === 'object' ? JSON.stringify(s.body, null, 2) : s.body || "",
			headers: typeof s.headers === 'object' ? JSON.stringify(s.headers, null, 2) : JSON.stringify({}, null, 2),
			responseMapping: typeof s.responseMapping === 'object' ? JSON.stringify(s.responseMapping, null, 2) : JSON.stringify({}, null, 2),
			condition: s.condition || ""
		}))

		// Sync with Visual Flow
		syncToGraph()
	} catch (err) {
		toast.error("Falha ao carregar dados do fluxo")
		navigateTo('/flows')
	} finally {
		loading.value = false
	}
}

const syncToGraph = () => {
	const layout = (flow.value as any)?.visualLayout || {}
	nodes.value = steps.value.map((step, index) => ({
		id: step.id || `temp-${index}`,
		label: `${step.order}. ${step.method} ${step.url.split('/').pop() || 'Request'}`,
		position: layout[step.id || `temp-${index}`]?.position || { x: 250, y: index * 100 + 50 },
		data: { stepIndex: index }
	}))

	edges.value = []
	for (let i = 0; i < nodes.value.length - 1; i++) {
		edges.value.push({
			id: `e${i}-${i + 1}`,
			source: nodes.value[i].id,
			target: nodes.value[i + 1].id,
			animated: true
		})
	}
}

const handleNodeDrag = (event: any) => {
	if (!flow.value) return
	const { node } = event
	if (!flow.value.visualLayout) (flow.value as any).visualLayout = {}
		; (flow.value as any).visualLayout[node.id] = { position: node.position }
}

const addNewStep = () => {
	const maxOrder = steps.value.reduce((max, s) => Math.max(max, s.order), 0)
	steps.value.push({
		order: maxOrder + 1,
		method: "POST",
		url: "",
		headers: JSON.stringify({}, null, 2),
		body: "",
		responseMapping: JSON.stringify({}, null, 2),
		condition: "",
		stopOnFailure: false
	})
}

const removeStep = (index: number) => {
	const step = steps.value[index]
	if (step && step.id) {
		stepsToDelete.value.push(step.id)
	}
	steps.value.splice(index, 1)
	steps.value.forEach((s, i) => s.order = i + 1)
}

const saveChanges = async () => {
	saving.value = true
	try {
		// 1. Remover passos excluídos
		for (const id of stepsToDelete.value) {
			await flowsService.deleteStep(flowId, id)
		}
		stepsToDelete.value = []

		// 2. Salvar/Atualizar passos
		for (const step of steps.value) {
			const payload = {
				...step,
				body: step.body ? JSON.parse(step.body as string) : null,
				headers: step.headers ? JSON.parse(step.headers as string) : {},
				responseMapping: step.responseMapping ? JSON.parse(step.responseMapping as string) : {},
				condition: step.condition || undefined
			}

			if (step.id) {
				await flowsService.updateStep(flowId, step.id, payload)
			} else {
				await flowsService.addStep(flowId, payload as FlowStep)
			}
		}

		toast.success("Fluxo sincronizado com sucesso")

		// Salvar Layout Visual
		if (flow.value && (flow.value as any).visualLayout) {
			await flowsService.update(flowId, { visualLayout: (flow.value as any).visualLayout })
		}

		await fetchFlowData()
	} catch (err: any) {
		console.error(err)
		toast.error("Erro ao salvar: " + (err.message || "Erro desconhecido"))
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
			<div class="flex border rounded-lg overflow-hidden h-9">
				<button @click="viewMode = 'list'"
					:class="viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'"
					class="px-3 text-xs font-medium transition-colors">
					Lista
				</button>
				<button @click="viewMode = 'visual'"
					:class="viewMode === 'visual' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'"
					class="px-3 text-xs font-medium transition-colors">
					Visual
				</button>
			</div>
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

	<div v-else class="space-y-4 h-[calc(100vh-250px)]">
		<!-- Visual View -->
		<div v-if="viewMode === 'visual'" class="h-full border rounded-xl bg-muted/5 overflow-hidden relative">
			<VueFlow v-model:nodes="nodes" v-model:edges="edges" @node-drag-stop="handleNodeDrag"
				:fit-view-on-init="true">
				<Background />
				<Controls />
			</VueFlow>
			<div
				class="absolute bottom-4 right-4 z-10 bg-background/80 backdrop-blur border rounded-lg p-3 text-[10px] text-muted-foreground shadow-sm">
				Dica: Arraste os nós para organizar seu fluxo visualmente.
			</div>
		</div>

		<!-- List View -->
		<div v-else class="space-y-4 overflow-y-auto pr-2">
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
						<!-- Execution Condition -->
						<div class="md:col-span-12">
							<label
								class="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 flex items-center justify-between">
								<span>Condição de Execução (Opcional)</span>
								<span class="text-[9px] italic font-normal normal-case">Ex: vars.status === 'ok' ou
									now.hour > 8</span>
							</label>
							<div class="relative">
								<input v-model="step.condition" placeholder="Deixe vazio para sempre executar"
									class="flex h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-1 text-xs shadow-sm outline-none focus:ring-1 focus:ring-ring pl-8 font-mono" />
								<Zap class="absolute left-2.5 top-2.5 h-4 w-4 text-primary/50" />
							</div>
						</div>

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

						<!-- Headers Editor -->
						<div class="md:col-span-4">
							<label class="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block">Headers
								(JSON)</label>
							<div class="relative group/editor">
								<textarea v-model="step.headers" placeholder='{ "Authorization": "Bearer {{token}}" }'
									rows="6"
									class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm outline-none focus:ring-1 focus:ring-ring resize-none" />
								<Code2 class="absolute right-2 top-2 h-3 w-3 text-muted-foreground opacity-30" />
							</div>
						</div>

						<!-- Body Editor -->
						<div class="md:col-span-8">
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
						<div class="md:col-span-12">
							<label class="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block">Mapeamento
								de Resposta (JSON)</label>
							<div class="space-y-4">
								<textarea v-model="step.responseMapping" placeholder='{ "var_nome": "data.user.name" }'
									rows="3"
									class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm outline-none focus:ring-1 focus:ring-ring" />
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
