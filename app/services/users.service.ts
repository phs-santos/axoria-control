import { api } from '~/utils/api'

export interface User {
  id: string
  email: string
  name: string
  role: 'ROOT' | 'ADMIN' | 'USER'
  isActive: boolean
  createdAt: string
}

export const usersService = {
  async getAll() {
    return await api<User[]>("/users")
  },

  async create(data: Partial<User>) {
    return await api<User>("/users", {
      method: "POST",
      body: data
    })
  },

  async delete(id: string) {
    return await api(`/users/${id}`, { method: "DELETE" })
  }
}
