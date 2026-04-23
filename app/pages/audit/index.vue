<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { History, Search, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import Button from '~/components/ui/Button.vue'
import { auditService, type AuditLog } from '~/services/audit.service'

const logs = ref<AuditLog[]>([])
const loading = ref(true)

const fetchLogs = async () => {
	loading.value = true
	try {
		logs.value = await auditService.getLogs()
	} catch (err) {
		toast.error("Falha ao carregar logs de auditoria")
	} finally {
		loading.value = false
	}
}

onMounted(fetchLogs)
</script>

<template>
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Logs de Auditoria</h1>
				<p class="text-muted-foreground">Histórico de ações realizadas no sistema.</p>
			</div>
			<Button variant="outline" @click="fetchLogs" :disabled="loading">
				<Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
				<Search v-else class="mr-2 h-4 w-4" />
				Atualizar
			</Button>
		</div>

		<div class="rounded-xl border bg-card text-card-foreground shadow-sm">
			<div class="relative w-full overflow-auto">
				<table class="w-full caption-bottom text-sm">
					<thead class="[&_tr]:border-b bg-muted/50">
						<tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
							<th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Data/Hora</th>
							<th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ação</th>
							<th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Usuário ID</th>
							<th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tenant ID</th>
							<th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">IP</th>
						</tr>
					</thead>
					<tbody class="[&_tr:last-child]:border-0">
						<tr v-if="loading" class="border-b transition-colors">
							<td colspan="5" class="p-8 text-center text-muted-foreground">
								<Loader2 class="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
								Carregando logs...
							</td>
						</tr>
						<tr v-else-if="logs.length === 0" class="border-b transition-colors">
							<td colspan="5" class="p-8 text-center text-muted-foreground">
								Nenhum log de auditoria encontrado.
							</td>
						</tr>
						<tr v-else v-for="log in logs" :key="log.id"
							class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
							<td class="p-4 align-middle">
								{{ new Date(log.createdAt).toLocaleString('pt-BR') }}
							</td>
							<td class="p-4 align-middle">
								<span class="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
									{{ log.action }}
								</span>
							</td>
							<td class="p-4 align-middle font-mono text-xs">{{ log.userId || '-' }}</td>
							<td class="p-4 align-middle font-mono text-xs">{{ log.tenantId || '-' }}</td>
							<td class="p-4 align-middle text-xs">{{ log.ip || '-' }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>
