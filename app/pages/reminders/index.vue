<script setup lang="ts">
import { ref } from 'vue'
import { Bell, Loader2, Plus, Calendar, Mail, Send, Clock, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import {
    DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle
} from 'radix-vue'
import { toast } from 'vue-sonner'
import Button from '~/components/ui/Button.vue'
import { remindersService, type ReminderPayload } from '~/services/reminders.service'

const isCreateDialogOpen = ref(false)
const loading = ref(false)

const formData = ref<ReminderPayload>({
    type: 'telegram',
    target: '',
    scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    payload: { text: '', botId: '' }
})

const selectedBotId = ref('')
const { data: bots } = useAsyncData('telegram-bots-reminders', () => api<any[]>("/telegram/bots"))
const { data: chats, refresh: refreshChats } = useAsyncData(
    'telegram-chats-reminders',
    () => selectedBotId.value ? api<any[]>(`/telegram/chats?botId=${selectedBotId.value}`) : Promise.resolve([]),
    { watch: [selectedBotId] }
)

const { data: reminders, refresh, pending } = useAsyncData('reminders-list', () => remindersService.getAll())

const scheduleReminder = async () => {
    loading.value = true
    try {
        const payloadToSubmit = {
            ...formData.value,
            scheduledAt: new Date(formData.value.scheduledAt).toISOString()
        }

        if (formData.value.type === 'telegram') {
            payloadToSubmit.payload.botId = selectedBotId.value
        }

        if (formData.value.type === 'email') {
            payloadToSubmit.payload = {
                subject: "Lembrete",
                body: formData.value.payload.text
            }
        }

        await remindersService.schedule(payloadToSubmit)
        toast.success("Lembrete agendado com sucesso")
        isCreateDialogOpen.value = false
        
        // Reset form
        formData.value = {
            type: 'telegram',
            target: '',
            scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
            payload: { text: '' }
        }
        
        refresh()
    } catch (err) {
        toast.error("Falha ao agendar lembrete")
    } finally {
        loading.value = false
    }
}

const getStatusClass = (status: string) => {
    switch (status) {
        case 'sent': return 'bg-green-500/10 text-green-500'
        case 'failed': return 'bg-destructive/10 text-destructive'
        case 'canceled': return 'bg-muted text-muted-foreground'
        default: return 'bg-primary/10 text-primary animate-pulse'
    }
}

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'sent': return 'Enviado'
        case 'failed': return 'Falhou'
        case 'canceled': return 'Cancelado'
        default: return 'Pendente'
    }
}
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold tracking-tight">Lembretes</h1>
                <p class="text-muted-foreground">Agende notificações e alertas automáticos.</p>
            </div>

            <DialogRoot v-model:open="isCreateDialogOpen">
                <Button @click="isCreateDialogOpen = true">
                    <Plus class="mr-2 h-4 w-4" /> Novo Lembrete
                </Button>
                <DialogPortal>
                    <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                    <DialogContent
                        class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-lg outline-none">
                        <DialogTitle class="text-lg font-semibold">Agendar novo lembrete</DialogTitle>
                        
                        <form @submit.prevent="scheduleReminder" class="space-y-4 mt-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Canal</label>
                                    <select v-model="formData.type"
                                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary">
                                        <option value="telegram">Telegram</option>
                                        <option value="email">E-mail</option>
                                    </select>
                                </div>
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Data e Hora</label>
                                    <input v-model="formData.scheduledAt" type="datetime-local" required
                                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary" />
                                </div>
                            </div>

                            <div class="space-y-2" v-if="formData.type === 'telegram'">
                                <label class="text-sm font-medium">Bot do Telegram</label>
                                <select v-model="selectedBotId" required
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary">
                                    <option value="" disabled>Selecione o bot emissor</option>
                                    <option v-for="b in bots" :key="b.id" :value="b.id">{{ b.name }} (@{{ b.username }})</option>
                                </select>
                            </div>

                            <div class="space-y-2">
                                <label class="text-sm font-medium">Destinatário</label>
                                <template v-if="formData.type === 'telegram'">
                                    <select v-model="formData.target" required :disabled="!selectedBotId"
                                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary disabled:opacity-50">
                                        <option value="" disabled>{{ selectedBotId ? 'Selecione o chat de destino' : 'Selecione um bot primeiro' }}</option>
                                        <option v-for="c in chats" :key="c.id" :value="c.externalChatId">
                                            {{ c.title || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.externalChatId }}
                                        </option>
                                    </select>
                                </template>
                                <template v-else>
                                    <input v-model="formData.target" type="email" 
                                        placeholder="E-mail do destinatário"
                                        required
                                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary" />
                                </template>
                            </div>

                            <div class="space-y-2">
                                <label class="text-sm font-medium">Mensagem</label>
                                <textarea v-model="formData.payload.text" rows="3" placeholder="O que o sistema deve lembrar?" required
                                    class="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary resize-none"></textarea>
                            </div>

                            <div class="flex justify-end gap-2 mt-6">
                                <Button variant="outline" type="button" @click="isCreateDialogOpen = false">Cancelar</Button>
                                <Button type="submit" :disabled="loading">
                                    <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                                    <Bell v-else class="mr-2 h-4 w-4" />
                                    Agendar
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </DialogPortal>
            </DialogRoot>
        </div>

        <!-- Table View -->
        <div class="rounded-xl border bg-card overflow-hidden shadow-sm">
            <table class="w-full text-sm">
                <thead class="border-b bg-muted/50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium text-muted-foreground">Canal</th>
                        <th class="px-4 py-3 text-left font-medium text-muted-foreground">Mensagem</th>
                        <th class="px-4 py-3 text-left font-medium text-muted-foreground">Agendado para</th>
                        <th class="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                        <th class="px-4 py-3 text-right font-medium text-muted-foreground">Destino</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-if="pending">
                        <td colspan="5" class="px-4 py-12 text-center">
                            <Loader2 class="h-6 w-6 animate-spin mx-auto text-primary" />
                        </td>
                    </tr>
                    
                    <tr v-else-if="!reminders?.length">
                        <td colspan="5" class="px-4 py-20 text-center">
                            <div class="max-w-[200px] mx-auto opacity-50 flex flex-col items-center">
                                <Bell class="h-10 w-10 mb-4" />
                                <p class="text-base font-medium">Nenhum lembrete</p>
                                <p class="text-xs text-muted-foreground">Você ainda não agendou nenhum lembrete para o futuro.</p>
                            </div>
                        </td>
                    </tr>

                    <tr v-for="r in reminders" :key="r.id" class="hover:bg-muted/50 transition-colors">
                        <td class="px-4 py-4">
                            <div class="flex items-center gap-2">
                                <div class="h-8 w-8 rounded-lg flex items-center justify-center bg-muted">
                                    <Send v-if="r.type === 'telegram'" class="h-4 w-4 text-sky-500" />
                                    <Mail v-else class="h-4 w-4 text-amber-500" />
                                </div>
                                <span class="capitalize font-medium">{{ r.type }}</span>
                            </div>
                        </td>
                        <td class="px-4 py-4">
                            <p class="truncate max-w-[300px] text-muted-foreground" :title="r.payload.text || r.payload.body">
                                {{ r.payload.text || r.payload.body }}
                            </p>
                        </td>
                        <td class="px-4 py-4">
                            <div class="flex items-center gap-1.5 text-xs">
                                <Calendar class="h-3.5 w-3.5 text-muted-foreground" />
                                {{ new Date(r.scheduledAt).toLocaleDateString() }}
                                <Clock class="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                                {{ new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                            </div>
                        </td>
                        <td class="px-4 py-4">
                            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                                :class="getStatusClass(r.status)">
                                <CheckCircle2 v-if="r.status === 'sent'" class="h-2.5 w-2.5 mr-1" />
                                <AlertCircle v-if="r.status === 'failed'" class="h-2.5 w-2.5 mr-1" />
                                {{ getStatusLabel(r.status) }}
                            </span>
                        </td>
                        <td class="px-4 py-4 text-right font-mono text-[10px] text-muted-foreground">
                            {{ r.target }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
