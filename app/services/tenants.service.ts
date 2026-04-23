import { api } from '~/utils/api'

export interface PlanQuotas {
  maxUsers: number
  maxApiKeys: number
  maxStorageMB: number
}

export interface Tenant {
  id: string
  name: string
  slug: string
  status: 'ACTIVE' | 'SUSPENDED'
  planQuotas: PlanQuotas
  createdAt: string
}

export const tenantsService = {
  async getAll() {
    return await api<Tenant[]>("/tenants")
  },

  async create(data: { name: string; slug: string; plan: string }) {
    return await api<Tenant>("/tenants", {
      method: "POST",
      body: data
    })
  },

  async switchContext(tenantId: string, userId: string) {
    return await api(`/tenants/${tenantId}/switch`, {
      method: "POST",
      body: { userId }
    })
  }
}
