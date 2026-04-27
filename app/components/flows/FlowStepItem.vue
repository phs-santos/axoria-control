<script setup lang="ts">
import { Trash2, Zap, Globe, Code2 } from 'lucide-vue-next'
import Button from '~/components/ui/Button.vue'

defineProps<{
	step: any
	index: number
}>()

defineEmits(['remove'])
</script>

<template>
	<div class="group relative rounded-xl border bg-card shadow-sm transition-all hover:border-primary/30">
		<!-- Step Header -->
		<div class="flex items-center justify-between bg-muted/20 px-4 py-2 border-b rounded-t-xl">
			<div class="flex items-center gap-3">
				<div
					class="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
					{{ step.order }}
				</div>
				<span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">HTTP Request</span>
			</div>
			<Button variant="ghost" size="icon" class="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100"
				@click="$emit('remove')">
				<Trash2 class="h-4 w-4" />
			</Button>
		</div>

		<div class="p-6 grid gap-6 md:grid-cols-12">
			<!-- Execution Condition -->
			<div class="md:col-span-12">
				<label
					class="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 flex items-center justify-between">
					<span>Condição de Execução (Opcional)</span>
					<span class="text-[9px] italic font-normal normal-case">Ex: context.status === 200</span>
				</label>
				<div class="relative">
					<input v-model="step.condition" placeholder="Deixe vazio para sempre executar"
						class="flex h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-1 text-xs shadow-sm outline-none focus:ring-1 focus:ring-ring pl-8 font-mono" />
					<Zap class="absolute left-2.5 top-2.5 h-4 w-4 text-primary/50" />
				</div>
			</div>

			<!-- URL and Method -->
			<div class="md:col-span-2">
				<label class="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block">Método</label>
				<select v-model="step.method"
					class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring">
					<option>GET</option>
					<option>POST</option>
					<option>PUT</option>
					<option>PATCH</option>
					<option>DELETE</option>
				</select>
			</div>
			<div class="md:col-span-10">
				<label class="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block">URL do Endpoint</label>
				<div class="relative">
					<input v-model="step.url" placeholder="https://api.exemplo.com/v1/{{recurso}}"
						class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring pl-8 font-mono text-[13px]" />
					<Globe class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
				</div>
			</div>

			<!-- Editors -->
			<div class="md:col-span-4">
				<label class="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block">Headers (JSON)</label>
				<div class="relative group/editor">
					<textarea v-model="step.headers" placeholder='{ "Authorization": "Bearer {{token}}" }' rows="6"
						class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm outline-none focus:ring-1 focus:ring-ring resize-none" />
					<Code2 class="absolute right-2 top-2 h-3 w-3 text-muted-foreground opacity-30" />
				</div>
			</div>

			<div class="md:col-span-8">
				<div class="flex items-center justify-between mb-1.5">
					<label class="text-[10px] font-bold uppercase text-muted-foreground block">JSON Body</label>
					<span class="text-[9px] text-muted-foreground italic" v-pre>Suporta {{variaveis}}</span>
				</div>
				<div class="relative group/editor">
					<textarea v-model="step.body" placeholder='{ "email": "{{user_email}}" }' rows="6"
						class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm outline-none focus:ring-1 focus:ring-ring resize-none" />
					<Code2 class="absolute right-2 top-2 h-3 w-3 text-muted-foreground opacity-30" />
				</div>
			</div>

			<!-- Mapping -->
			<div class="md:col-span-12">
				<label class="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block">Mapeamento de Resposta
					(JSON)</label>
				<div class="space-y-4">
					<textarea v-model="step.responseMapping" placeholder='{ "var_nome": "data.user.name" }' rows="3"
						class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm outline-none focus:ring-1 focus:ring-ring" />
					<div class="flex items-center gap-2 px-1">
						<input type="checkbox" v-model="step.stopOnFailure"
							class="rounded border-input text-primary focus:ring-primary" />
						<span class="text-[10px] font-medium text-muted-foreground">Parar execução se este passo falhar</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
