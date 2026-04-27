<script setup lang="ts">
import { Plus, Globe, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useVueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

// Sub-components
import FlowHeader from '~/components/flows/FlowHeader.vue'
import FlowDesigner from '~/components/flows/FlowDesigner.vue'
import FlowExecutionConsole from '~/components/flows/FlowExecutionConsole.vue'
import FlowStepItem from '~/components/flows/FlowStepItem.vue'
import FlowSchedules from '~/components/flows/FlowSchedules.vue'
import FlowScheduleDialog from '~/components/flows/FlowScheduleDialog.vue'

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
const activeNodeId = ref<string | null>(null)
const executionLogs = ref<any[]>([])
const showLogs = ref(false)
const activeTab = ref<'designer' | 'steps' | 'schedules'>('designer')

const { onConnect, addEdges, onNodeDragStop, setNodes } = useVueFlow()
const nodes = ref<any[]>([])
const edges = ref<any[]>([])

const { data: schedules, refresh: refreshSchedules } = useAsyncData(`flow-schedules-${flowId}`, () => flowsService.getSchedules(flowId))

const isScheduleDialogOpen = ref(false)
const scheduleForm = ref({ name: '', cronExpression: '0 8 * * 1' })
const addingSchedule = ref(false)

const createSchedule = async () => {
	addingSchedule.value = true
	try {
		await flowsService.createSchedule(flowId, scheduleForm.value)
		toast.success("Agendamento criado")
		isScheduleDialogOpen.value = false
		scheduleForm.value = { name: '', cronExpression: '0 8 * * 1' }
		refreshSchedules()
	} catch (err) {
		toast.error("Erro ao criar agendamento")
	} finally {
		addingSchedule.value = false
	}
}

const deleteSchedule = async (sid: string) => {
	if (!confirm("Excluir este agendamento?")) return
	try {
		await flowsService.deleteSchedule(flowId, sid)
		toast.success("Agendamento removido")
		refreshSchedules()
	} catch (err) {
		toast.error("Erro ao excluir")
	}
}

const fetchFlowData = async () => {
	loading.value = true
	try {
		const [flowData, stepsData] = await Promise.all([
			flowsService.getById(flowId),
			flowsService.getSteps(flowId)
		])
		flow.value = flowData
		steps.value = stepsData.sort((a, b) => a.order - b.order).map(s => ({
			...s,
			body: typeof s.body === 'object' ? JSON.stringify(s.body, null, 2) : s.body || "",
			headers: typeof s.headers === 'object' ? JSON.stringify(s.headers, null, 2) : JSON.stringify({}, null, 2),
			responseMapping: typeof s.responseMapping === 'object' ? JSON.stringify(s.responseMapping, null, 2) : JSON.stringify({}, null, 2),
			condition: s.condition || ""
		}))

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
		for (const id of stepsToDelete.value) {
			await flowsService.deleteStep(flowId, id)
		}
		stepsToDelete.value = []

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
	executionLogs.value = []
	showLogs.value = true
	try {
		const result = await flowsService.execute(flowId)
		const executionId = (result as any).id

		if (executionId) {
			const wsUrl = API_BASE_URL.replace('http', 'ws').replace('/api', '') + `/api/monitor/${executionId}`
			const ws = new WebSocket(wsUrl)

			ws.onmessage = (event) => {
				const payload = JSON.parse(event.data)
				if (payload.event === 'flow_progress') {
					const stepId = payload.data.stepId
					if (stepId) activeNodeId.value = stepId
				}
				if (payload.event === 'flow_log') {
					executionLogs.value.push(payload.data)
				}
				if (payload.event === 'flow_finished') {
					activeNodeId.value = null
					ws.close()
				}
			}
		}
	} catch (err: any) {
		toast.error("Falha ao iniciar teste: " + (err.message || "Erro"))
	} finally {
		executing.value = false
	}
}

watch(activeNodeId, (newId) => {
	nodes.value = nodes.value.map(n => ({
		...n,
		style: {
			...n.style,
			border: n.id === newId ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
			boxShadow: n.id === newId ? '0 0 15px var(--color-primary)' : 'none',
			transition: 'all 0.3s ease'
		}
	}))
})

onMounted(fetchFlowData)
</script>

<template>
	<div class="space-y-6 mx-auto pb-20">
		<FlowHeader :flow="flow" v-model:activeTab="activeTab" :saving="saving" :executing="executing" @test="testFlow"
			@save="saveChanges" />

		<!-- Designer View -->
		<FlowDesigner v-if="activeTab === 'designer'" v-model:nodes="nodes" v-model:edges="edges"
			@node-drag-stop="handleNodeDrag">
			<FlowExecutionConsole :show="showLogs" :logs="executionLogs" @close="showLogs = false" />
		</FlowDesigner>

		<!-- Steps List View -->
		<div v-if="activeTab === 'steps'" class="space-y-4 overflow-y-auto pr-2">
			<div v-if="steps.length === 0" class="text-center py-16 border-2 border-dashed rounded-xl bg-muted/10">
				<Globe class="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
				<h3 class="text-lg font-medium">Nenhum passo configurado</h3>
				<Button variant="outline" @click="addNewStep">
					<Plus class="mr-2 h-4 w-4" /> Adicionar Primeiro Passo
				</Button>
			</div>

			<div v-else class="space-y-6">
				<FlowStepItem v-for="(step, index) in steps" :key="index" :step="step" :index="index"
					@remove="removeStep(index)" />

				<Button variant="outline" class="w-full border-dashed py-8 border-2" @click="addNewStep">
					<Plus class="mr-2 h-4 w-4" /> Adicionar Novo Passo na Sequência
				</Button>
			</div>
		</div>

		<!-- Schedules View -->
		<FlowSchedules v-if="activeTab === 'schedules'" :schedules="schedules ?? []" @create="isScheduleDialogOpen = true"
			@delete="deleteSchedule" />

		<!-- Schedule Modal -->
		<FlowScheduleDialog v-model:open="isScheduleDialogOpen" :form="scheduleForm" :loading="addingSchedule"
			@submit="createSchedule" />
	</div>
</template>

