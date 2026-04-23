import { api } from '~/utils/api'

export interface AuditLog {
	id: string
	userId: string | null
	tenantId: string | null
	action: string
	targetId: string | null
	oldData: Record<string, any> | null
	newData: Record<string, any> | null
	ip: string | null
	userAgent: string | null
	createdAt: string
	updatedAt: string
	deletedAt: string | null
}

export const auditService = {
	async getLogs(params?: { userId?: string, tenantId?: string, action?: string }) {
		const query = new URLSearchParams()
		if (params?.userId) query.append('userId', params.userId)
		if (params?.tenantId) query.append('tenantId', params.tenantId)
		if (params?.action) query.append('action', params.action)
		
		const qs = query.toString()
		return await api<AuditLog[]>(`/audit/audit-logs${qs ? '?' + qs : ''}`)
	}
}
