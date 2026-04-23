<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { HardDrive, Upload, Loader2, Trash2, File as FileIcon, Eye, X, Image as ImageIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import Button from '~/components/ui/Button.vue'
import { storageService, type StorageFile } from '~/services/storage.service'

const files = ref<StorageFile[]>([])
const loading = ref(true)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const isPreviewOpen = ref(false)
const previewUrl = ref("")

const openPreview = (url: string) => {
	previewUrl.value = url
	isPreviewOpen.value = true
}

const closePreview = () => {
	isPreviewOpen.value = false
	previewUrl.value = ""
}

const fetchFiles = async () => {
	loading.value = true
	try {
		files.value = await storageService.list()
	} catch (err) {
		toast.error("Falha ao carregar arquivos")
	} finally {
		loading.value = false
	}
}

const triggerUpload = () => {
	fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
	const target = event.target as HTMLInputElement
	if (!target.files?.length) return
	
	const file = target.files[0]
	if (!file) return
	uploading.value = true
	
	try {
		await storageService.upload(file)
		toast.success("Arquivo enviado com sucesso!")
		await fetchFiles()
	} catch (err) {
		toast.error("Erro ao enviar arquivo")
	} finally {
		uploading.value = false
		target.value = '' // reset input
	}
}

const deleteFile = async (id: string) => {
	if (!confirm("Tem certeza que deseja excluir este arquivo?")) return
	
	try {
		await storageService.remove(id)
		toast.success("Arquivo excluído")
		await fetchFiles()
	} catch (err) {
		toast.error("Erro ao excluir arquivo")
	}
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

onMounted(fetchFiles)
</script>

<template>
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Arquivos (Storage)</h1>
				<p class="text-muted-foreground">Gerencie os arquivos da sua empresa.</p>
			</div>
			
			<div class="flex items-center gap-2">
				<input type="file" ref="fileInput" class="hidden" @change="handleFileUpload" />
				<Button @click="triggerUpload" :disabled="uploading">
					<Loader2 v-if="uploading" class="mr-2 h-4 w-4 animate-spin" />
					<Upload v-else class="mr-2 h-4 w-4" />
					Fazer Upload
				</Button>
			</div>
		</div>

		<div class="rounded-xl border bg-card text-card-foreground shadow-sm">
			<div class="relative w-full overflow-auto">
				<table class="w-full caption-bottom text-sm">
					<thead class="[&_tr]:border-b bg-muted/50">
						<tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
							<th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Arquivo</th>
							<th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tamanho</th>
							<th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Data de Envio</th>
							<th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Link</th>
							<th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Ações</th>
						</tr>
					</thead>
					<tbody class="[&_tr:last-child]:border-0">
						<tr v-if="loading" class="border-b transition-colors">
							<td colspan="5" class="p-8 text-center text-muted-foreground">
								<Loader2 class="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
								Carregando arquivos...
							</td>
						</tr>
						<tr v-else-if="files.length === 0" class="border-b transition-colors">
							<td colspan="5" class="p-12 text-center text-muted-foreground">
								<HardDrive class="h-10 w-10 mx-auto mb-4 opacity-20" />
								Nenhum arquivo encontrado.
							</td>
						</tr>
						<tr v-else v-for="file in files" :key="file.id"
							class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
							<td class="p-4 align-middle">
								<div class="flex items-center gap-3">
									<div class="p-2 bg-primary/10 rounded-lg">
										<ImageIcon v-if="file.mimeType?.startsWith('image/')" class="h-4 w-4 text-primary" />
										<FileIcon v-else class="h-4 w-4 text-primary" />
									</div>
									<div class="flex flex-col">
										<span class="font-medium truncate max-w-[200px]" :title="file.originalName">{{ file.originalName }}</span>
										<span class="text-xs text-muted-foreground font-mono truncate max-w-[200px]" :title="file.fileName">{{ file.fileName }}</span>
									</div>
								</div>
							</td>
							<td class="p-4 align-middle font-mono text-xs">{{ formatBytes(file.size) }}</td>
							<td class="p-4 align-middle text-xs">{{ new Date(file.createdAt).toLocaleString('pt-BR') }}</td>
							<td class="p-4 align-middle">
								<a :href="file.url" target="_blank" class="text-xs text-primary hover:underline truncate max-w-[150px] inline-block" :title="file.url">
									{{ file.url }}
								</a>
							</td>
							<td class="p-4 align-middle text-right">
								<Button v-if="file.mimeType?.startsWith('image/')" variant="ghost" size="icon" class="h-8 w-8 text-primary hover:text-primary/90 hover:bg-primary/10 mr-1" @click="openPreview(file.url)" title="Visualizar">
									<Eye class="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10" @click="deleteFile(file.id)" title="Excluir">
									<Trash2 class="h-4 w-4" />
								</Button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
		
		<!-- Modal de Preview -->
		<div v-if="isPreviewOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="closePreview">
			<div class="relative bg-background rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
				<div class="flex items-center justify-between p-4 border-b">
					<h3 class="font-semibold tracking-tight">Visualização da Imagem</h3>
					<Button variant="ghost" size="icon" class="h-8 w-8 rounded-full hover:bg-muted" @click="closePreview">
						<X class="h-4 w-4" />
					</Button>
				</div>
				<div class="p-4 overflow-auto flex-1 flex items-center justify-center bg-muted/20">
					<img :src="previewUrl" class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm" />
				</div>
			</div>
		</div>
	</div>
</template>
