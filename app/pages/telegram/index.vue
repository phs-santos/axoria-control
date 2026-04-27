<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Send, Loader2 } from 'lucide-vue-next'
import {
    DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle
} from 'radix-vue'
import { toast } from 'vue-sonner'
import { api, ApiError } from '~/utils/api'
import { cn } from '~/utils/utils'
import Button from '~/components/ui/Button.vue'

interface Bot {
    id: string;
    name: string;
    username?: string;
    isActive: boolean;
    createdAt?: string;
}

const isBotDialogOpen = ref(false)
const isSendDialogOpen = ref(false)
const botForm = ref({ name: "", token: "" })
const sendForm = ref({ botId: "", chatId: "", message: "" })
const loadingBot = ref(false)
const loadingSend = ref(false)
const selectedBotId = ref<string | null>(null)

const { data: bots, refresh, pending, error } = useAsyncData('telegram-bots', () => api<Bot[]>("/telegram/bots"))

const { data: chats, pending: pendingChats, refresh: refreshChats } = useAsyncData(
    'telegram-chats',
    () => selectedBotId.value ? api<any[]>(`/telegram/chats?botId=${selectedBotId.value}`) : Promise.resolve([]),
    { watch: [selectedBotId] }
)

const handleViewChats = (botId: string) => {
    selectedBotId.value = botId
}

const handleCreateBot = async () => {
    loadingBot.value = true
    try {
        await api<Bot>("/telegram/bots", { method: "POST", body: botForm.value })
        isBotDialogOpen.value = false
        botForm.value = { name: "", token: "" }
        refresh()
        toast.success("Bot registrado")
    } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Erro ao registrar bot")
    } finally {
        loadingBot.value = false
    }
}

const handleSendMessage = async () => {
    loadingSend.value = true
    try {
        await api("/telegram/send", { method: "POST", body: sendForm.value })
        isSendDialogOpen.value = false
        sendForm.value = { botId: "", chatId: "", message: "" }
        toast.success("Mensagem enviada")
    } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Erro ao enviar mensagem")
    } finally {
        loadingSend.value = false
    }
}
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-start justify-between gap-4 flex-wrap">
            <div>
                <h1 class="text-2xl font-semibold tracking-tight">Telegram</h1>
                <p class="text-sm text-muted-foreground">Gerencie bots e envie mensagens.</p>
            </div>
            <div class="flex gap-2">
                <DialogRoot v-model:open="isSendDialogOpen">
                    <Button variant="outline" @click="isSendDialogOpen = true">
                        <Send class="mr-2 h-4 w-4" /> Enviar
                    </Button>
                    <DialogPortal>
                        <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                        <DialogContent
                            class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-lg outline-none">
                            <DialogTitle class="text-lg font-semibold">Enviar mensagem</DialogTitle>
                            <form @submit.prevent="handleSendMessage" class="space-y-4 mt-4">
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Bot</label>
                                    <select v-model="sendForm.botId" required
                                        class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                        <option value="" disabled>Selecione um bot</option>
                                        <option v-for="b in bots" :key="b.id" :value="b.id">{{ b.name }}</option>
                                    </select>
                                </div>
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Chat ID</label>
                                    <input v-model="sendForm.chatId" required
                                        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
                                </div>
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Mensagem</label>
                                    <textarea v-model="sendForm.message" required
                                        class="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"></textarea>
                                </div>
                                <div class="flex justify-end gap-2 mt-6">
                                    <Button variant="outline" type="button"
                                        @click="isSendDialogOpen = false">Cancelar</Button>
                                    <Button type="submit" :disabled="loadingSend">
                                        <Loader2 v-if="loadingSend" class="mr-2 h-4 w-4 animate-spin" />
                                        Enviar
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </DialogPortal>
                </DialogRoot>

                <DialogRoot v-model:open="isBotDialogOpen">
                    <Button @click="isBotDialogOpen = true">
                        <Plus class="mr-2 h-4 w-4" /> Novo Bot
                    </Button>
                    <DialogPortal>
                        <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                        <DialogContent
                            class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-lg outline-none">
                            <DialogTitle class="text-lg font-semibold">Registrar bot</DialogTitle>
                            <form @submit.prevent="handleCreateBot" class="space-y-4 mt-4">
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Nome</label>
                                    <input v-model="botForm.name" required
                                        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
                                </div>
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Token</label>
                                    <input v-model="botForm.token" type="password" required
                                        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
                                </div>
                                <div class="flex justify-end gap-2 mt-6">
                                    <Button variant="outline" type="button"
                                        @click="isBotDialogOpen = false">Cancelar</Button>
                                    <Button type="submit" :disabled="loadingBot">
                                        <Loader2 v-if="loadingBot" class="mr-2 h-4 w-4 animate-spin" />
                                        Salvar
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </DialogPortal>
                </DialogRoot>
            </div>
        </div>

        <div class="rounded-xl border bg-card overflow-hidden shadow">
            <table class="w-full text-sm">
                <thead class="border-b bg-muted/50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                        <th class="px-4 py-3 text-left font-medium text-muted-foreground">Username</th>
                        <th class="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                        <th class="px-4 py-3 text-left font-medium text-muted-foreground">Criado em</th>
                        <th class="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-if="pending">
                        <td colspan="4" class="px-4 py-8 text-center text-muted-foreground">Carregando...</td>
                    </tr>
                    <tr v-else-if="error">
                        <td colspan="4" class="px-4 py-8 text-center text-destructive">Erro ao carregar bots.</td>
                    </tr>
                    <tr v-else-if="!bots?.length">
                        <td colspan="4" class="px-4 py-8 text-center text-muted-foreground">Nenhum bot registrado.</td>
                    </tr>
                    <tr v-for="b in bots" :key="b.id">
                        <td class="px-4 py-3 font-medium">{{ b.name }}</td>
                        <td class="px-4 py-3 text-muted-foreground">{{ b.username ? `@${b.username}` : "—" }}</td>
                        <td class="px-4 py-3">
                            <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                :class="b.isActive ? 'bg-primary text-primary-foreground' : 'border border-input bg-background'">
                                {{ b.isActive ? "Ativo" : "Inativo" }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-xs text-muted-foreground">
                            {{ b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "—" }}
                        </td>
                        <td class="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm" @click="handleViewChats(b.id)"
                                :class="cn(selectedBotId === b.id && 'bg-muted')">
                                Chats
                            </Button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Chats Section -->
        <div v-if="selectedBotId" class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold">Chats do Bot ({{bots?.find(b => b.id === selectedBotId)?.name}})
                </h2>
                <Button variant="ghost" size="sm" @click="selectedBotId = null">Fechar</Button>
            </div>

            <div class="rounded-xl border bg-card overflow-hidden shadow">
                <table class="w-full text-sm">
                    <thead class="border-b bg-muted/50">
                        <tr>
                            <th class="px-4 py-3 text-left font-medium text-muted-foreground">Chat ID</th>
                            <th class="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                            <th class="px-4 py-3 text-left font-medium text-muted-foreground">Nome/Título</th>
                            <th class="px-4 py-3 text-left font-medium text-muted-foreground">Username</th>
                            <th class="px-4 py-3 text-left font-medium text-muted-foreground">Última msg</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-if="pendingChats">
                            <td colspan="5" class="px-4 py-8 text-center text-muted-foreground">Carregando chats...</td>
                        </tr>
                        <tr v-else-if="!chats?.length">
                            <td colspan="5" class="px-4 py-8 text-center text-muted-foreground">Nenhum chat encontrado
                                para este bot.</td>
                        </tr>
                        <tr v-for="c in chats" :key="c.id" class="hover:bg-muted/50 transition-colors">
                            <td class="px-4 py-3 font-mono text-xs">{{ c.externalChatId }}</td>
                            <td class="px-4 py-3">
                                <span class="capitalize">{{ c.type }}</span>
                            </td>
                            <td class="px-4 py-3">
                                {{ c.title || `${c.firstName || ''} ${c.lastName || ''}`.trim() || '—' }}
                            </td>
                            <td class="px-4 py-3 text-muted-foreground">{{ c.username ? `@${c.username}` : "—" }}</td>
                            <td class="px-4 py-3 text-xs text-muted-foreground">
                                {{ c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : "—" }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
