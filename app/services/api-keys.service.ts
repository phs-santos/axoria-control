import { api } from '~/utils/api'

export interface ApiKey {
  id: string
  name: string
  key?: string
  lastUsedAt?: string
  createdAt: string
}

export const apiKeysService = {
  async getAll() {
    return await api<ApiKey[]>("/api-keys")
  },

  async create(data: { name: string }) {
    return await api<ApiKey>("/api-keys", {
      method: "POST",
      body: data
    })
  },

  async delete(id: string) {
    return await api(`/api-keys/${id}`, { method: "DELETE" })
  }
}
