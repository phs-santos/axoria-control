import { api } from '~/utils/api'

export interface FlowStep {
	id?: string
	order: number
	method: string
	url: string
	headers?: Record<string, string>
	body?: any
	responseMapping?: Record<string, string>
	stopOnFailure?: boolean
}

export interface WebhookFlow {
	id: string
	name: string
	description?: string
	triggerEvents: string[]
	isActive: boolean
	stepsCount?: number
	createdAt?: string
}

export const flowsService = {
	async getAll() {
		return await api<WebhookFlow[]>("/webhook-flows")
	},

	async getById(id: string) {
		const flows = await this.getAll()
		const flow = flows.find(f => f.id === id)
		if (!flow) throw new Error("Fluxo não encontrado")
		return flow
	},

	async create(data: Partial<WebhookFlow>) {
		return await api<WebhookFlow>("/webhook-flows", {
			method: "POST",
			body: data
		})
	},

	async delete(id: string) {
		return await api(`/webhook-flows/${id}`, { method: "DELETE" })
	},

	async execute(id: string, payload: any = {}) {
		return await api(`/webhook-flows/${id}/execute`, {
			method: "POST",
			body: payload
		})
	},

	async getSteps(flowId: string) {
		return await api<FlowStep[]>(`/webhook-flows/${flowId}/steps`)
	},

	async addStep(flowId: string, step: FlowStep) {
		return await api(`/webhook-flows/${flowId}/steps`, {
			method: "POST",
			body: step
		})
	}
}
