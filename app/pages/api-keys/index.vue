<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Trash2, Copy, Loader2, Search, ChevronDown, Activity, KeyRound } from 'lucide-vue-next'
import {
	DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription,
	CollapsibleRoot, CollapsibleTrigger, CollapsibleContent
} from 'radix-vue'
import { toast } from 'vue-sonner'
import { api, ApiError } from '~/utils/api'
import Button from '~/components/ui/Button.vue'
import { cn } from '~/utils/utils'

interface ApiKey {
	id: string;
	name: string;
	description?: string;
	mask?: string;
	lastUsedAt?: string | null;
	expiresAt?: string | null;
	usageCount?: number;
	createdAt?: string;
}

interface CreatedKey {
	apiKey: string;
	id: string;
	name: string;
}

const search = ref("")
const isDialogOpen = ref(false)
const name = ref("")
const description = ref("")
const expiresAt = ref("")
const createdKey = ref<CreatedKey | null>(null)
const loading = ref(false)

const { data: apiKeys, refresh, pending, error } = useAsyncData('api-keys', () => api<ApiKey[]>("/auth/api-keys"))

const filteredKeys = computed(() => {
	const data = apiKeys.value ?? []
	const q = search.value.trim().toLowerCase()
	if (!q) return data
	return data.filter(k =>
		k.name?.toLowerCase().includes(q) ||
		k.description?.toLowerCase().includes(q) ||
		k.mask?.toLowerCase().includes(q)
	)
})

const handleCreate = async () => {
	loading.value = true
	try {
		const payload = {
			name: name.value,
			description: description.value || undefined,
			expiresAt: expiresAt.value ? new Date(expiresAt.value).toISOString() : undefined
		}
		const data = await api<CreatedKey>("/auth/api-keys", { method: "POST", body: payload })
		createdKey.value = data
		isDialogOpen.value = false
		name.value = ""
		description.value = ""
		expiresAt.value = ""
		refresh()
		toast.success("API Key criada")
	} catch (e) {
		toast.error(e instanceof ApiError ? e.message : "Erro ao criar")
	} finally {
		loading.value = false
	}
}

const handleRemove = async (id: string, keyName: string) => {
	if (!confirm(`Revogar "${keyName}"?`)) return
	try {
		await api(`/auth/api-keys/${id}`, { method: "DELETE" })
		refresh()
		toast.success("Chave revogada")
	} catch (e) {
		toast.error(e instanceof ApiError ? e.message : "Erro ao revogar")
	}
}

const copyToClipboard = (text: string) => {
	navigator.clipboard.writeText(text)
	toast.success("Copiado")
}
</script>

<template>
	<div class="space-y-6">
		<div class="flex items-start justify-between gap-4 flex-wrap">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">API Keys</h1>
				<p class="text-sm text-muted-foreground">
					Personal Access Tokens para integrações externas.
				</p>
			</div>

			<DialogRoot v-model:open="isDialogOpen">
				<Button @click="isDialogOpen = true">
					<Plus class="mr-2 h-4 w-4" /> Nova API Key
				</Button>
				<DialogPortal>
					<DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
					<DialogContent
						class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-lg outline-none">
						<DialogTitle class="text-lg font-semibold">Gerar nova chave</DialogTitle>
						<DialogDescription class="text-sm text-muted-foreground mt-1">
							A chave completa será exibida apenas uma vez.
						</DialogDescription>

						<form @submit.prevent="handleCreate" class="space-y-4 mt-4">
							<div class="space-y-2">
								<label class="text-sm font-medium">Nome</label>
								<input v-model="name" required
									class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
							</div>
							<div class="space-y-2">
								<label class="text-sm font-medium">Descrição</label>
								<textarea v-model="description"
									class="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"></textarea>
							</div>
							<div class="space-y-2">
								<label class="text-sm font-medium">Expira em (opcional)</label>
								<input v-model="expiresAt" type="datetime-local"
									class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
							</div>
							<div class="flex justify-end gap-2 mt-6">
								<Button variant="outline" type="button" @click="isDialogOpen = false">Cancelar</Button>
								<Button type="submit" :disabled="loading">
									<Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
									Gerar chave
								</Button>
							</div>
						</form>
					</DialogContent>
				</DialogPortal>
			</DialogRoot>
		</div>

		<div v-if="createdKey" class="rounded-xl border border-primary/40 bg-primary/5 p-4">
			<div class="text-sm font-medium">Sua nova chave: {{ createdKey.name }}</div>
			<p class="text-xs text-muted-foreground mt-1">Copie agora — ela não será exibida novamente.</p>
			<div class="mt-3 flex items-center gap-2">
				<code class="flex-1 break-all rounded-md border bg-background px-3 py-2 text-xs font-mono">
          {{ createdKey.apiKey }}
        </code>
				<Button variant="outline" size="icon" @click="copyToClipboard(createdKey.apiKey)">
					<Copy class="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="sm" @click="createdKey = null">Fechar</Button>
			</div>
		</div>

		<div class="relative max-w-sm">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<input v-model="search" placeholder="Buscar por nome, descrição ou máscara..."
				class="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
		</div>

		<!-- Desktop Table -->
		<div class="hidden md:block rounded-xl border bg-card overflow-hidden">
			<table class="w-full text-sm">
				<thead class="border-b bg-muted/50">
					<tr>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Máscara
						</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Usos</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Último
							uso</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Expira
						</th>
						<th class="px-4 py-3 w-12"></th>
					</tr>
				</thead>
				<tbody class="divide-y">
					<tr v-if="pending">
						<td colspan="6" class="px-4 py-8 text-center text-muted-foreground">Carregando...</td>
					</tr>
					<tr v-else-if="error">
						<td colspan="6" class="px-4 py-8 text-center text-destructive">Erro ao carregar chaves.</td>
					</tr>
					<tr v-else-if="!filteredKeys.length">
						<td colspan="6" class="px-4 py-8 text-center text-muted-foreground">Nenhuma chave encontrada.
						</td>
					</tr>
					<tr v-for="k in filteredKeys" :key="k.id">
						<td class="px-4 py-3">
							<div class="font-medium">{{ k.name }}</div>
							<div v-if="k.description" class="text-xs text-muted-foreground">{{ k.description }}</div>
						</td>
						<td class="px-4 py-3 hidden lg:table-cell"><code class="text-xs">{{ k.mask ?? "—" }}</code></td>
						<td class="px-4 py-3">{{ k.usageCount ?? 0 }}</td>
						<td class="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
							{{ k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Nunca" }}
						</td>
						<td class="px-4 py-3 hidden lg:table-cell">
							<span v-if="k.expiresAt"
								class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
								{{ new Date(k.expiresAt).toLocaleDateString() }}
							</span>
							<span v-else class="text-xs text-muted-foreground">Sem expiração</span>
						</td>
						<td class="px-4 py-3">
							<Button variant="ghost" size="icon" @click="handleRemove(k.id, k.name)">
								<Trash2 class="h-4 w-4 text-destructive" />
							</Button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Mobile Cards -->
		<div class="md:hidden space-y-3">
			<div v-for="k in filteredKeys" :key="k.id" class="rounded-xl border bg-card">
				<CollapsibleRoot v-slot="{ open }">
					<CollapsibleTrigger class="flex w-full items-center justify-between p-4 text-left outline-none">
						<div class="min-w-0 flex-1">
							<div class="font-medium truncate">{{ k.name }}</div>
							<code class="text-xs text-muted-foreground">{{ k.mask ?? "—" }}</code>
						</div>
						<div class="flex items-center gap-2">
							<span
								class="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
								{{ k.usageCount ?? 0 }} usos
							</span>
							<ChevronDown
								:class="cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')" />
						</div>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div class="space-y-3 border-t bg-muted/30 p-4 text-sm">
							<div v-if="k.description">
								<div class="text-xs font-medium text-muted-foreground uppercase">Descrição</div>
								<div>{{ k.description }}</div>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<div class="text-xs font-medium text-muted-foreground uppercase">Último uso</div>
									<div>{{ k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Nunca" }}</div>
								</div>
								<div>
									<div class="text-xs font-medium text-muted-foreground uppercase">Expira</div>
									<div>{{ k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : "Sem expiração"
									}}</div>
								</div>
							</div>
							<Button variant="outline" size="sm"
								class="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
								@click="handleRemove(k.id, k.name)">
								<Trash2 class="mr-2 h-4 w-4" /> Revogar chave
							</Button>
						</div>
					</CollapsibleContent>
				</CollapsibleRoot>
			</div>
		</div>
	</div>
</template>
