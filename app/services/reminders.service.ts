import { api } from '~/utils/api'

export interface ReminderPayload {
	type: string
	target: string
	scheduledAt: string
	payload: Record<string, any>
	metadata?: Record<string, any>
}

export const remindersService = {
	async schedule(data: ReminderPayload) {
		return await api("/reminders", {
			method: "POST",
			body: data
		})
	},

	async getById(id: string) {
		return await api(`/reminders/${id}`)
	},
	
	async getAll() {
		return await api<any[]>("/reminders")
	}
}
