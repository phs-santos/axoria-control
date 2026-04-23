<script setup lang="ts">
import { ref } from 'vue'
import { Bell, Loader2, Plus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import Button from '~/components/ui/Button.vue'
import { remindersService, type ReminderPayload } from '~/services/reminders.service'

const loading = ref(false)
const formData = ref<ReminderPayload>({
	type: 'telegram',
	target: '',
	scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
	payload: { text: '' }
})

const scheduleReminder = async () => {
	loading.value = true
	try {
		const payloadToSubmit = {
			...formData.value,
			scheduledAt: new Date(formData.value.scheduledAt).toISOString()
		}
		
		// If email, adapt payload structure based on swagger example
		if (formData.value.type === 'email') {
			payloadToSubmit.payload = {
				subject: "Lembrete",
				body: formData.value.payload.text
			}
		}

		await remindersService.schedule(payloadToSubmit)
		toast.success("Lembrete agendado com sucesso")
		// Reset form
		formData.value.target = ''
		formData.value.payload.text = ''
	} catch (err) {
		toast.error("Falha ao agendar lembrete")
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<div class="space-y-6 max-w-2xl mx-auto">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Lembretes</h1>
				<p class="text-muted-foreground">Agende notificações e alertas para o futuro.</p>
			</div>
		</div>

		<div class="rounded-xl border bg-card p-6 shadow-sm">
			<form @submit.prevent="scheduleReminder" class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<label class="text-sm font-medium">Tipo</label>
						<select v-model="formData.type" class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring">
							<option value="telegram">Telegram</option>
							<option value="email">E-mail</option>
						</select>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium">Data e Hora</label>
						<input v-model="formData.scheduledAt" type="datetime-local" required class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring" />
					</div>
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium">Destino (ID do Chat ou E-mail)</label>
					<input v-model="formData.target" type="text" placeholder="Ex: 123456789 ou contato@axoria.digital" required class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring" />
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium">Mensagem do Lembrete</label>
					<textarea v-model="formData.payload.text" rows="3" placeholder="O que deseja lembrar?" required class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"></textarea>
				</div>

				<Button type="submit" class="w-full" :disabled="loading">
					<Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
					<Plus v-else class="mr-2 h-4 w-4" />
					Agendar Lembrete
				</Button>
			</form>
		</div>
	</div>
</template>
