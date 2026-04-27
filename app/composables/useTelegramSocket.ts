import { ref, onMounted, onUnmounted } from 'vue'
import { API_BASE_URL } from '~/utils/api'
import { toast } from 'vue-sonner'

export interface TelegramMessageUpdate {
    botId: string
    botName: string
    chatId: number
    text: string
    from: {
        id: number
        first_name: string
        last_name?: string
        username?: string
    }
}

export function useTelegramSocket() {
    const socket = ref<WebSocket | null>(null)
    const isConnected = ref(false)
    const lastMessage = ref<TelegramMessageUpdate | null>(null)

    const connect = () => {
        if (process.server) return

        const wsUrl = API_BASE_URL.replace('http', 'ws') + '/telegram/updates'
        console.log(`[TelegramWS] Conectando em ${wsUrl}...`)
        
        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
            console.log('[TelegramWS] Conectado.')
            isConnected.value = true
        }

        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data)
                if (payload.event === 'telegram.message_received') {
                    lastMessage.value = payload.data
                    
                    // Notificação Global (Sonner)
                    toast.info(`Telegram: ${payload.data.botName}`, {
                        description: `${payload.data.from.first_name}: ${payload.data.text}`,
                        duration: 5000,
                        action: {
                            label: 'Ver',
                            onClick: () => {
                                // Pode adicionar navegação aqui se desejar
                                console.log('Abrir chat:', payload.data.chatId)
                            }
                        }
                    })
                }
            } catch (err) {
                console.error('[TelegramWS] Erro ao processar mensagem:', err)
            }
        }

        ws.onclose = () => {
            console.log('[TelegramWS] Conexão fechada. Tentando reconectar em 5s...')
            isConnected.value = false
            setTimeout(connect, 5000)
        }

        ws.onerror = (err) => {
            console.error('[TelegramWS] Erro na conexão:', err)
        }

        socket.value = ws
    }

    onMounted(() => {
        connect()
    })

    onUnmounted(() => {
        if (socket.value) {
            socket.value.close()
        }
    })

    return {
        isConnected,
        lastMessage
    }
}
