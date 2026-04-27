import { api } from '~/utils/api'

export interface FlowStep {
	id?: string
	order: number
	method: string
	url: string
	headers?: Record<string, string>
	body?: any
	responseMapping?: Record<string, string>
	condition?: string
	stopOnFailure?: boolean
}

export interface WebhookFlow {
	id: string
	name: string
	description?: string
	triggerEvents: string[]
	isActive: boolean
	visualLayout?: any
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

	async update(id: string, data: Partial<WebhookFlow>) {
		return await api<WebhookFlow>(`/webhook-flows/${id}`, {
			method: "PATCH",
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
	},

	async updateStep(flowId: string, stepId: string, step: Partial<FlowStep>) {
		return await api(`/webhook-flows/${flowId}/steps/${stepId}`, {
			method: "PATCH",
			body: step
		})
	},

	async deleteStep(flowId: string, stepId: string) {
		return await api(`/webhook-flows/${flowId}/steps/${stepId}`, {
			method: "DELETE"
		})
	},

	async getSchedules(flowId: string) {
		return await api<any[]>(`/webhook-flows/${flowId}/schedules`)
	},

	async createSchedule(flowId: string, data: any) {
		return await api(`/webhook-flows/${flowId}/schedules`, {
			method: "POST",
			body: data
		})
	},

	async deleteSchedule(flowId: string, scheduleId: string) {
		return await api(`/webhook-flows/${flowId}/schedules/${scheduleId}`, {
			method: "DELETE"
		})
	}
}
