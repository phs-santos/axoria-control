<script setup lang="ts">
import { Plus, Clock, Trash2 } from 'lucide-vue-next'
import Button from '~/components/ui/Button.vue'

defineProps<{
	schedules: any[]
}>()

defineEmits(['create', 'delete'])
</script>

<template>
	<div class="flex-1 min-h-0 space-y-4 animate-in fade-in slide-in-from-bottom-4">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-bold">Execuções Agendadas</h2>
			<Button size="sm" @click="$emit('create')">
				<Plus class="mr-2 h-4 w-4" /> Novo Agendamento
			</Button>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div v-if="!schedules?.length"
				class="col-span-full py-12 text-center border-2 border-dashed rounded-2xl bg-muted/20">
				<Clock class="mx-auto h-8 w-8 text-muted-foreground opacity-30 mb-2" />
				<p class="text-sm text-muted-foreground italic">Este fluxo ainda não possui agendamentos automáticos.</p>
				<p class="text-[11px] text-muted-foreground mt-1">Crie um agendamento para que este processo rode sozinho em horários específicos.</p>
			</div>

			<div v-for="s in (schedules as any[])" :key="s.id"
				class="p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow relative group">
				<div class="flex items-start justify-between mb-3">
					<div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
						<Clock class="h-5 w-5" />
					</div>
					<Button variant="ghost" size="icon"
						class="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
						@click="$emit('delete', s.id)">
						<Trash2 class="h-4 w-4" />
					</Button>
				</div>
				<h4 class="font-bold text-sm">{{ s.name }}</h4>
				<p class="text-[10px] font-mono text-muted-foreground mt-1">{{ s.cronExpression }}</p>

				<div class="mt-4 pt-4 border-t border-dashed flex items-center justify-between">
					<span class="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Status</span>
					<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold"
						:class="s.isActive ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'">
						{{ s.isActive ? 'Ativo' : 'Inativo' }}
					</span>
				</div>
			</div>
		</div>
	</div>
</template>
