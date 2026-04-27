import { api } from '~/utils/api'

export interface StorageFile {
    id: string
    originalName: string
    fileName: string
    mimeType: string
    size: number
    url: string
    createdAt: string
}

export const storageService = {
    async getAll() {
        return await api<StorageFile[]>("/storage")
    },

    async upload(file: File) {
        const formData = new FormData()
        formData.append('file', file)
        
        return await api<StorageFile>("/storage/upload", {
            method: "POST",
            body: formData
        })
    },

    async delete(id: string) {
        return await api(`/storage/${id}`, {
            method: "DELETE"
        })
    }
}
