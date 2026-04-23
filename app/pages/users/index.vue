<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Loader2, Search, ChevronDown } from 'lucide-vue-next'
import {
	DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle,
	CollapsibleRoot, CollapsibleTrigger, CollapsibleContent
} from 'radix-vue'
import { toast } from 'vue-sonner'
import { api, ApiError } from '~/utils/api'
import Button from '~/components/ui/Button.vue'

interface User {
	id: string;
	name: string;
	email: string;
	role?: string;
	tenantId?: string;
	createdAt?: string;
}

const search = ref("")
const isDialogOpen = ref(false)
const form = ref({ name: "", email: "", password: "", tenantId: "" })
const loading = ref(false)

const { data: users, refresh, pending, error } = useAsyncData('users', () => api<User[]>("/users"))

const filteredUsers = computed(() => {
	const data = users.value ?? []
	const q = search.value.trim().toLowerCase()
	if (!q) return data
	return data.filter(u =>
		u.name?.toLowerCase().includes(q) ||
		u.email?.toLowerCase().includes(q) ||
		u.role?.toLowerCase().includes(q)
	)
})

const handleCreate = async () => {
	loading.value = true
	try {
		await api<User>("/users", {
			method: "POST",
			auth: false,
			body: {
				name: form.value.name,
				email: form.value.email,
				password: form.value.password,
				tenantId: form.value.tenantId || undefined,
			},
		})
		isDialogOpen.value = false
		form.value = { name: "", email: "", password: "", tenantId: "" }
		refresh()
		toast.success("Usuário criado")
	} catch (e) {
		toast.error(e instanceof ApiError ? e.message : "Erro ao criar")
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<div class="space-y-6">
		<div class="flex items-start justify-between gap-4 flex-wrap">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Usuários</h1>
				<p class="text-sm text-muted-foreground">Gerencie membros do sistema.</p>
			</div>

			<DialogRoot v-model:open="isDialogOpen">
				<Button @click="isDialogOpen = true">
					<Plus class="mr-2 h-4 w-4" /> Novo usuário
				</Button>
				<DialogPortal>
					<DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
					<DialogContent
						class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-lg outline-none">
						<DialogTitle class="text-lg font-semibold">Criar usuário</DialogTitle>

						<form @submit.prevent="handleCreate" class="space-y-4 mt-4">
							<div class="space-y-2">
								<label class="text-sm font-medium">Nome</label>
								<input v-model="form.name" required
									class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
							</div>
							<div class="space-y-2">
								<label class="text-sm font-medium">Email</label>
								<input v-model="form.email" type="email" required
									class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
							</div>
							<div class="space-y-2">
								<label class="text-sm font-medium">Senha (mínimo 8)</label>
								<input v-model="form.password" type="password" minlength="8" required
									class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
							</div>
							<div class="space-y-2">
								<label class="text-sm font-medium">Tenant ID (opcional)</label>
								<input v-model="form.tenantId"
									class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
							</div>
							<div class="flex justify-end gap-2 mt-6">
								<Button variant="outline" type="button" @click="isDialogOpen = false">Cancelar</Button>
								<Button type="submit" :disabled="loading">
									<Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
									Criar
								</Button>
							</div>
						</form>
					</DialogContent>
				</DialogPortal>
			</DialogRoot>
		</div>

		<div class="relative max-w-sm">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<input v-model="search" placeholder="Buscar por nome, email ou role..."
				class="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
		</div>

		<!-- Desktop Table -->
		<div class="hidden md:block rounded-xl border bg-card overflow-hidden">
			<table class="w-full text-sm">
				<thead class="border-b bg-muted/50">
					<tr>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Role</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Criado em
						</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					<tr v-if="pending">
						<td colspan="4" class="px-4 py-8 text-center text-muted-foreground">Carregando...</td>
					</tr>
					<tr v-else-if="error">
						<td colspan="4" class="px-4 py-8 text-center text-destructive">Erro ao carregar usuários.</td>
					</tr>
					<tr v-else-if="!filteredUsers.length">
						<td colspan="4" class="px-4 py-8 text-center text-muted-foreground">Nenhum usuário encontrado.
						</td>
					</tr>
					<tr v-for="u in filteredUsers" :key="u.id">
						<td class="px-4 py-3 font-medium">{{ u.name }}</td>
						<td class="px-4 py-3 text-muted-foreground">{{ u.email }}</td>
						<td class="px-4 py-3 hidden lg:table-cell">
							<span
								class="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
								{{ u.role ?? "—" }}
							</span>
						</td>
						<td class="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
							{{ u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—" }}
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Mobile Cards -->
		<div class="md:hidden space-y-3">
			<div v-for="u in filteredUsers" :key="u.id" class="rounded-xl border bg-card">
				<CollapsibleRoot v-slot="{ open }">
					<CollapsibleTrigger class="flex w-full items-center justify-between p-4 text-left outline-none">
						<div class="min-w-0 flex-1">
							<div class="font-medium truncate">{{ u.name }}</div>
							<div class="text-xs text-muted-foreground truncate">{{ u.email }}</div>
						</div>
						<div class="flex items-center gap-2">
							<span
								class="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
								{{ u.role ?? "—" }}
							</span>
							<ChevronDown
								:class="cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')" />
						</div>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div class="space-y-3 border-t bg-muted/30 p-4 text-sm">
							<div>
								<div class="text-xs font-medium text-muted-foreground uppercase">Criado em</div>
								<div>{{ u.createdAt ? new Date(u.createdAt).toLocaleString() : "—" }}</div>
							</div>
							<div v-if="u.tenantId">
								<div class="text-xs font-medium text-muted-foreground uppercase">Tenant</div>
								<code class="text-xs break-all">{{ u.tenantId }}</code>
							</div>
							<div>
								<div class="text-xs font-medium text-muted-foreground uppercase">ID</div>
								<code class="text-xs break-all">{{ u.id }}</code>
							</div>
						</div>
					</CollapsibleContent>
				</CollapsibleRoot>
			</div>
		</div>
	</div>
</template>
