<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
    HardDrive, 
    Upload, 
    Search, 
    MoreVertical, 
    FileText, 
    Image as ImageIcon, 
    File as FileIcon, 
    Trash2, 
    Download, 
    Copy,
    Loader2,
    Grid,
    List,
    ExternalLink
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import Button from '~/components/ui/Button.vue'
import { storageService, type StorageFile } from '~/services/storage.service'

const viewMode = ref<'grid' | 'list'>('grid')
const searchQuery = ref('')
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const { data: files, refresh, pending } = useAsyncData('storage-files', () => storageService.getAll())

const filteredFiles = computed(() => {
    if (!files.value) return []
    if (!searchQuery.value) return files.value
    return files.value.filter(f => f.originalName.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

const handleUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement
    if (!target.files?.length) return

    uploading.value = true
    try {
        for (const file of Array.from(target.files)) {
            await storageService.upload(file)
        }
        toast.success("Upload concluído")
        refresh()
    } catch (err) {
        toast.error("Falha ao enviar arquivo")
    } finally {
        uploading.value = false
        if (fileInput.value) fileInput.value.value = ''
    }
}

const deleteFile = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este arquivo?")) return
    
    try {
        await storageService.delete(id)
        toast.success("Arquivo excluído")
        refresh()
    } catch (err) {
        toast.error("Falha ao excluir arquivo")
    }
}

const copyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("Link copiado para a área de transferência")
}

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return ImageIcon
    if (mime.includes('pdf') || mime.includes('text')) return FileText
    return FileIcon
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between gap-4 flex-wrap">
            <div>
                <h1 class="text-2xl font-bold tracking-tight">Armazenamento</h1>
                <p class="text-muted-foreground">Gerencie seus arquivos, assets e uploads.</p>
            </div>
            <div class="flex items-center gap-2">
                <input type="file" ref="fileInput" class="hidden" multiple @change="handleUpload" />
                <Button @click="fileInput?.click()" :disabled="uploading">
                    <Loader2 v-if="uploading" class="mr-2 h-4 w-4 animate-spin" />
                    <Upload v-else class="mr-2 h-4 w-4" />
                    Fazer Upload
                </Button>
            </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-sm">
            <div class="relative flex-1 max-w-md">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input v-model="searchQuery" placeholder="Pesquisar arquivos..." 
                    class="w-full bg-muted/50 border rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div class="flex border rounded-lg overflow-hidden shrink-0">
                <button @click="viewMode = 'grid'" :class="viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background'" class="p-2 transition-colors">
                    <Grid class="h-4 w-4" />
                </button>
                <button @click="viewMode = 'list'" :class="viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background'" class="p-2 transition-colors">
                    <List class="h-4 w-4" />
                </button>
            </div>
        </div>

        <!-- Content -->
        <div v-if="pending" class="flex items-center justify-center py-20">
            <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>

        <div v-else-if="!filteredFiles.length" class="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/10">
            <div class="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                <HardDrive class="h-8 w-8" />
            </div>
            <h3 class="text-xl font-bold">Nenhum arquivo encontrado</h3>
            <p class="text-muted-foreground max-w-xs mx-auto mt-2">Faça upload de arquivos para começar a gerenciar seus assets.</p>
        </div>

        <!-- GRID VIEW -->
        <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div v-for="file in filteredFiles" :key="file.id" 
                class="group relative rounded-xl border bg-card hover:bg-muted/50 transition-all overflow-hidden flex flex-col shadow-sm hover:shadow-md">
                
                <!-- Preview Area -->
                <div class="aspect-square bg-muted/30 flex items-center justify-center relative overflow-hidden border-b">
                    <img v-if="file.mimeType.startsWith('image/')" :src="file.url" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <component v-else :is="getFileIcon(file.mimeType)" class="h-10 w-10 text-muted-foreground opacity-40" />
                    
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button @click="copyLink(file.url)" class="p-2 bg-white rounded-full text-black hover:bg-primary hover:text-white transition-colors" title="Copiar Link">
                            <Copy class="h-4 w-4" />
                        </button>
                        <a :href="file.url" target="_blank" class="p-2 bg-white rounded-full text-black hover:bg-primary hover:text-white transition-colors" title="Visualizar">
                            <ExternalLink class="h-4 w-4" />
                        </a>
                        <button @click="deleteFile(file.id)" class="p-2 bg-white rounded-full text-destructive hover:bg-destructive hover:text-white transition-colors" title="Excluir">
                            <Trash2 class="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div class="p-3">
                    <p class="text-xs font-bold truncate mb-0.5" :title="file.originalName">{{ file.originalName }}</p>
                    <p class="text-[10px] text-muted-foreground">{{ formatSize(file.size) }}</p>
                </div>
            </div>
        </div>

        <!-- LIST VIEW -->
        <div v-else class="rounded-xl border bg-card overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <table class="w-full text-sm">
                <thead class="border-b bg-muted/50 text-left">
                    <tr>
                        <th class="px-4 py-3 font-medium text-muted-foreground">Nome</th>
                        <th class="px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                        <th class="px-4 py-3 font-medium text-muted-foreground">Tamanho</th>
                        <th class="px-4 py-3 font-medium text-muted-foreground">Data</th>
                        <th class="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="file in filteredFiles" :key="file.id" class="hover:bg-muted/30 transition-colors">
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-3">
                                <component :is="getFileIcon(file.mimeType)" class="h-4 w-4 text-primary" />
                                <span class="font-medium truncate max-w-[200px] md:max-w-md" :title="file.originalName">{{ file.originalName }}</span>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-xs text-muted-foreground">{{ file.mimeType }}</td>
                        <td class="px-4 py-3 text-xs text-muted-foreground">{{ formatSize(file.size) }}</td>
                        <td class="px-4 py-3 text-xs text-muted-foreground">{{ new Date(file.createdAt).toLocaleDateString() }}</td>
                        <td class="px-4 py-3 text-right">
                            <div class="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" class="h-8 w-8" @click="copyLink(file.url)">
                                    <Copy class="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" class="h-8 w-8" @click="deleteFile(file.id)">
                                    <Trash2 class="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
