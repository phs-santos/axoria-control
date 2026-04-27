<script setup lang="ts">
import { Loader2, Clock } from 'lucide-vue-next'
import {
	DialogRoot,
	DialogPortal,
	DialogOverlay,
	DialogContent,
	DialogTitle,
} from 'radix-vue'
import Button from '~/components/ui/Button.vue'

defineProps<{
	open: boolean
	form: { name: string, cronExpression: string }
	loading: boolean
}>()

defineEmits(['update:open', 'submit'])
</script>

<template>
	<DialogRoot :open="open" @update:open="$emit('update:open', $event)">
		<DialogPortal>
			<DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
			<DialogContent
				class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-lg outline-none">
				<DialogTitle class="text-lg font-semibold">Configurar Novo Agendamento</DialogTitle>
				<form @submit.prevent="$emit('submit')" class="space-y-4 mt-4">
					<div class="space-y-2">
						<label class="text-sm font-medium">Nome (Ex: Sincronização Diária)</label>
						<input v-model="form.name" required placeholder="Dê um nome para este agendamento..."
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary" />
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium">Frequência de Execução (Cron)</label>
						<input v-model="form.cronExpression" required placeholder="0 8 * * 1"
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary font-mono" />
						<div class="bg-muted/30 p-2 rounded text-[10px] space-y-1">
							<p class="font-bold text-muted-foreground uppercase">Exemplos de horários:</p>
							<p>• <code class="bg-muted px-1 rounded">0 8 * * *</code> Todos os dias às 08:00</p>
							<p>• <code class="bg-muted px-1 rounded">0 12 * * 1</code> Toda segunda-feira às 12:00</p>
							<p>• <code class="bg-muted px-1 rounded">*/30 * * * *</code> A cada 30 minutos</p>
						</div>
					</div>
					<div class="flex justify-end gap-2 mt-6">
						<Button variant="outline" type="button" @click="$emit('update:open', false)">Cancelar</Button>
						<Button type="submit" :disabled="loading" class="flex-1">
							<Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
							<Clock v-else class="mr-2 h-4 w-4" />
							Salvar Agendamento
						</Button>
					</div>
				</form>
			</DialogContent>
		</DialogPortal>
	</DialogRoot>
</template>
