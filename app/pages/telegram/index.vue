<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { 
    Plus, 
    Send, 
    Loader2, 
    MessageSquare, 
    ArrowLeft, 
    Bot as BotIcon,
    User,
    Users,
    ChevronRight,
    Search,
    Paperclip,
    Smile,
    MoreVertical
} from 'lucide-vue-next'
import {
    DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle
} from 'radix-vue'
import { toast } from 'vue-sonner'
import { api, ApiError } from '~/utils/api'
import { cn } from '~/utils/utils'
import Button from '~/components/ui/Button.vue'
import { useTelegramSocket } from '~/composables/useTelegramSocket'

interface Bot {
    id: string;
    name: string;
    username?: string;
    isActive: boolean;
    createdAt?: string;
}

interface Chat {
    id: string;
    botId: string;
    externalChatId: string;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    title?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    lastMessageAt: string;
}

interface Message {
    id: string;
    botId: string;
    chatId: string;
    direction: 'inbound' | 'outbound';
    messageText: string;
    fromId?: string;
    fromName?: string;
    createdAt: string;
}

// UI State
type View = 'bots' | 'chats' | 'conversation'
const currentView = ref<View>('bots')
const selectedBot = ref<Bot | null>(null)
const selectedChat = ref<Chat | null>(null)

const isBotDialogOpen = ref(false)
const botForm = ref({ name: "", token: "" })
const loadingBot = ref(false)

const chatSearch = ref("")
const newMessage = ref("")
const sendingMessage = ref(false)
const messageListRef = ref<HTMLElement | null>(null)

// Data Fetching
const { data: bots, refresh: refreshBots, pending: pendingBots } = useAsyncData('telegram-bots', () => api<Bot[]>("/telegram/bots"))

const { data: chats, pending: pendingChats, refresh: refreshChats } = useAsyncData(
    'telegram-chats',
    () => selectedBot.value ? api<Chat[]>(`/telegram/chats?botId=${selectedBot.value.id}`) : Promise.resolve([]),
    { watch: [selectedBot] }
)

const { data: messages, pending: pendingMessages, refresh: refreshMessages } = useAsyncData(
    'telegram-messages',
    () => (selectedBot.value && selectedChat.value) 
        ? api<Message[]>(`/telegram/messages?botId=${selectedBot.value.id}&chatId=${selectedChat.value.externalChatId}`) 
        : Promise.resolve([]),
    { watch: [selectedChat] }
)

// Socket Integration
const { lastMessage: socketMessage } = useTelegramSocket()

watch(socketMessage, (newMsg) => {
    if (!newMsg) return
    
    // Se a mensagem for para o chat aberto, recarregar mensagens
    if (selectedChat.value && String(newMsg.chatId) === selectedChat.value.externalChatId && selectedBot.value?.id === newMsg.botId) {
        refreshMessages()
        scrollToBottom()
    }
    
    // Se estivermos na lista de chats do bot certo, recarregar a lista para atualizar o "última mensagem"
    if (currentView.value === 'chats' && selectedBot.value?.id === newMsg.botId) {
        refreshChats()
    }
})

// Computed
const filteredChats = computed(() => {
    if (!chats.value) return []
    if (!chatSearch.value) return chats.value
    const search = chatSearch.value.toLowerCase()
    return chats.value.filter(c => {
        const name = (c.title || `${c.firstName || ''} ${c.lastName || ''}`).toLowerCase()
        return name.includes(search) || c.username?.toLowerCase().includes(search) || c.externalChatId.includes(search)
    })
})

// Actions
const enterBot = (bot: Bot) => {
    selectedBot.value = bot
    currentView.value = 'chats'
}

const enterChat = (chat: Chat) => {
    selectedChat.value = chat
    currentView.value = 'conversation'
    scrollToBottom()
}

const backToBots = () => {
    selectedBot.value = null
    selectedChat.value = null
    currentView.value = 'bots'
}

const backToChats = () => {
    selectedChat.value = null
    currentView.value = 'chats'
}

const handleCreateBot = async () => {
    loadingBot.value = true
    try {
        await api<Bot>("/telegram/bots", { method: "POST", body: botForm.value })
        isBotDialogOpen.value = false
        botForm.value = { name: "", token: "" }
        refreshBots()
        toast.success("Bot registrado")
    } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Erro ao registrar bot")
    } finally {
        loadingBot.value = false
    }
}

const sendMessage = async () => {
    if (!newMessage.value.trim() || !selectedBot.value || !selectedChat.value) return
    
    sendingMessage.value = true
    try {
        await api("/telegram/send", { 
            method: "POST", 
            body: {
                botId: selectedBot.value.id,
                chatId: selectedChat.value.externalChatId,
                message: newMessage.value
            } 
        })
        newMessage.value = ""
        refreshMessages()
        scrollToBottom()
    } catch (e) {
        toast.error("Falha ao enviar mensagem")
    } finally {
        sendingMessage.value = false
    }
}

const scrollToBottom = () => {
    nextTick(() => {
        if (messageListRef.value) {
            messageListRef.value.scrollTop = messageListRef.value.scrollHeight
        }
    })
}

const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const getChatName = (c: Chat) => {
    return c.title || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Desconhecido'
}

watch(currentView, (val) => {
    if (val === 'conversation') scrollToBottom()
})
</script>

<template>
    <div class="h-[calc(100vh-120px)] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6 shrink-0">
            <div class="flex items-center gap-4">
                <Button v-if="currentView !== 'bots'" variant="ghost" size="icon" @click="currentView === 'conversation' ? backToChats() : backToBots()">
                    <ArrowLeft class="h-5 w-5" />
                </Button>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight">
                        <template v-if="currentView === 'bots'">Telegram</template>
                        <template v-else-if="currentView === 'chats'">{{ selectedBot?.name }}</template>
                        <template v-else-if="currentView === 'conversation'">{{ getChatName(selectedChat!) }}</template>
                    </h1>
                    <p class="text-sm text-muted-foreground">
                        <template v-if="currentView === 'bots'">Gerencie seus bots e conversas.</template>
                        <template v-else-if="currentView === 'chats'">Selecione um chat para responder.</template>
                        <template v-else-if="currentView === 'conversation'">Respondendo via @{{ selectedBot?.username }}</template>
                    </p>
                </div>
            </div>

            <div v-if="currentView === 'bots'">
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
                                    <input v-model="botForm.name" required placeholder="Ex: Atendimento Axoria"
                                        class="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary" />
                                </div>
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Token</label>
                                    <input v-model="botForm.token" type="password" required placeholder="Obtenha no @BotFather"
                                        class="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary" />
                                </div>
                                <div class="flex justify-end gap-2 mt-6">
                                    <Button variant="outline" type="button" @click="isBotDialogOpen = false">Cancelar</Button>
                                    <Button type="submit" :disabled="loadingBot">
                                        <Loader2 v-if="loadingBot" class="mr-2 h-4 w-4 animate-spin" />
                                        Registrar
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </DialogPortal>
                </DialogRoot>
            </div>
        </div>

        <!-- Content Area -->
        <div class="flex-1 min-h-0 relative">
            
            <!-- VIEW: BOTS -->
            <div v-if="currentView === 'bots'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div v-if="pendingBots" v-for="i in 3" :key="i" class="h-48 rounded-2xl border bg-card/50 animate-pulse"></div>
                
                <div v-else v-for="bot in bots" :key="bot.id" 
                    class="group relative rounded-2xl border bg-card hover:bg-muted/50 transition-all cursor-pointer overflow-hidden flex flex-col p-6 shadow-sm hover:shadow-md hover:border-primary/50"
                    @click="enterBot(bot)">
                    <div class="flex items-start justify-between mb-4">
                        <div class="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <BotIcon class="h-6 w-6" />
                        </div>
                        <span class="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                            :class="bot.isActive ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'">
                            {{ bot.isActive ? 'Online' : 'Offline' }}
                        </span>
                    </div>
                    <div>
                        <h3 class="font-bold text-lg leading-tight mb-1">{{ bot.name }}</h3>
                        <p class="text-sm text-muted-foreground">@{{ bot.username || 'pendente...' }}</p>
                    </div>
                    <div class="mt-auto pt-6 flex items-center justify-between text-xs text-muted-foreground border-t border-dashed">
                        <span>Criado em {{ bot.createdAt ? new Date(bot.createdAt).toLocaleDateString() : '—' }}</span>
                        <div class="flex items-center gap-1 text-primary font-bold group-hover:translate-x-1 transition-transform">
                            Entrar <ChevronRight class="h-3 w-3" />
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-if="!pendingBots && !bots?.length" class="col-span-full py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                    <div class="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                        <BotIcon class="h-8 w-8" />
                    </div>
                    <h3 class="text-xl font-bold">Nenhum bot configurado</h3>
                    <p class="text-muted-foreground max-w-xs mx-auto mt-2">Adicione um bot do Telegram usando o token do BotFather para começar.</p>
                </div>
            </div>

            <!-- VIEW: CHATS (LIST) -->
            <div v-if="currentView === 'chats'" class="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
                <div class="flex items-center gap-4 mb-4 shrink-0">
                    <div class="relative flex-1">
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input v-model="chatSearch" placeholder="Pesquisar contatos..." 
                            class="w-full bg-muted/50 border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-muted">
                    <div v-if="pendingChats" v-for="i in 5" :key="i" class="h-20 rounded-xl border bg-card animate-pulse"></div>
                    
                    <div v-else v-for="chat in filteredChats" :key="chat.id" 
                        class="flex items-center gap-4 p-4 rounded-2xl border bg-card hover:bg-muted/50 transition-all cursor-pointer group shadow-sm hover:shadow"
                        @click="enterChat(chat)">
                        <div class="h-12 w-12 rounded-full bg-linear-to-tr from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold overflow-hidden">
                            <Users v-if="chat.type !== 'private'" class="h-5 w-5" />
                            <template v-else>{{ chat.firstName?.charAt(0) || chat.username?.charAt(0) || '?' }}</template>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between gap-2 mb-1">
                                <h4 class="font-bold truncate text-sm">{{ getChatName(chat) }}</h4>
                                <span class="text-[10px] text-muted-foreground whitespace-nowrap">{{ formatTime(chat.lastMessageAt) }}</span>
                            </div>
                            <div class="flex items-center justify-between gap-4">
                                <p class="text-xs text-muted-foreground truncate italic">
                                    {{ chat.username ? `@${chat.username}` : 'ID: ' + chat.externalChatId }}
                                </p>
                                <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MessageSquare class="h-2.5 w-2.5" /> Abrir
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Empty State Chats -->
                    <div v-if="!pendingChats && !filteredChats.length" class="text-center py-20">
                        <p class="text-muted-foreground italic">Nenhuma conversa encontrada.</p>
                    </div>
                </div>
            </div>

            <!-- VIEW: CONVERSATION -->
            <div v-if="currentView === 'conversation'" class="h-full flex flex-col bg-card border rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-300">
                <!-- Chat Header -->
                <div class="p-4 border-b bg-muted/30 flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                            {{ selectedChat?.firstName?.charAt(0) || '?' }}
                        </div>
                        <div>
                            <h4 class="font-bold text-sm">{{ getChatName(selectedChat!) }}</h4>
                            <p class="text-[10px] text-muted-foreground">Telegram {{ selectedChat?.type }}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1">
                        <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground">
                            <Search class="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground">
                            <MoreVertical class="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <!-- Messages -->
                <div ref="messageListRef" class="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/10 scrollbar-thin scrollbar-thumb-muted">
                    <div v-if="pendingMessages" class="flex items-center justify-center h-full">
                        <Loader2 class="h-6 w-6 animate-spin text-primary" />
                    </div>
                    
                    <div v-else v-for="(msg, index) in messages" :key="msg.id" 
                        class="flex flex-col"
                        :class="msg.direction === 'outbound' ? 'items-end' : 'items-start'">
                        
                        <div class="max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm text-sm"
                            :class="msg.direction === 'outbound' 
                                ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                : 'bg-background border rounded-tl-none'">
                            <p class="whitespace-pre-wrap leading-relaxed">{{ msg.messageText }}</p>
                        </div>
                        
                        <span class="text-[9px] text-muted-foreground mt-1 px-1">
                            {{ formatTime(msg.createdAt) }}
                        </span>
                    </div>

                    <!-- Placeholder -->
                    <div v-if="!pendingMessages && !messages?.length" class="h-full flex flex-col items-center justify-center opacity-30 italic">
                        <MessageSquare class="h-10 w-10 mb-2" />
                        <p>Nenhuma mensagem ainda.</p>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="p-4 border-t bg-background shrink-0">
                    <form @submit.prevent="sendMessage" class="flex items-end gap-3">
                        <div class="flex items-center gap-1 shrink-0 pb-1">
                            <Button variant="ghost" size="icon" type="button" class="h-8 w-8 text-muted-foreground hover:text-primary">
                                <Smile class="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" type="button" class="h-8 w-8 text-muted-foreground hover:text-primary">
                                <Paperclip class="h-5 w-5" />
                            </Button>
                        </div>
                        <div class="flex-1">
                            <textarea 
                                v-model="newMessage"
                                @keydown.enter.prevent="!$event.shiftKey && sendMessage()"
                                placeholder="Digite sua mensagem..."
                                class="w-full bg-muted/30 border rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary resize-none max-h-32"
                                rows="1"></textarea>
                        </div>
                        <Button type="submit" size="icon" :disabled="!newMessage.trim() || sendingMessage" 
                            class="h-10 w-10 rounded-full shadow-lg shadow-primary/20 shrink-0">
                            <Loader2 v-if="sendingMessage" class="h-4 w-4 animate-spin" />
                            <Send v-else class="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
/* Transições suaves */
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
}

/* Custom scrollbar for chat feel */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background: #1e293b;
}
</style>
