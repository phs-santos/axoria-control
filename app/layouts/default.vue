<script setup lang="ts">
import {
	LayoutDashboard,
	KeyRound,
	Users,
	Webhook,
	Send,
	Activity,
	LogOut,
	Menu,
	Building2,
	ChevronRight,
	History,
	Bell,
	HardDrive
} from 'lucide-vue-next'
import Button from '~/components/ui/Button.vue'
import SplashScreen from '~/components/SplashScreen.vue'

const { user, logout } = useAuth()
const route = useRoute()
const isReady = ref(false)

const NAV = [
	{ to: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
	{ to: "/api-keys", label: "API Keys", icon: KeyRound },
	{ to: "/users", label: "Usuários", icon: Users },
	{ to: "/flows", label: "Fluxos", icon: Send },
	{ to: "/tenants", label: "Empresas", icon: Building2 },
	{ to: "/telegram", label: "Telegram", icon: Send },
	{ to: "/reminders", label: "Lembretes", icon: Bell },
	{ to: "/storage", label: "Arquivos", icon: HardDrive },
	{ to: "/audit", label: "Auditoria", icon: History },
	{ to: "/health", label: "Sistema", icon: Activity },
]

const handleLogout = () => {
	logout()
	navigateTo('/login')
}

const currentNav = computed(() => {
	return NAV.find(item => route.path.startsWith(item.to))
})

// Aguarda a montagem do componente para evitar Hydration Mismatch
// e garantir que o estado de auth foi lido do localStorage/cookie
onMounted(() => {
	setTimeout(() => {
		isReady.value = true
	}, 1000) // 1s de splash screen para um feeling premium
})
</script>

<template>
	<div class="min-h-screen bg-background font-sans antialiased text-foreground">
		<!-- Splash Screen Inicial -->
		<Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0"
			enter-to-class="opacity-100" leave-active-class="transition duration-500 ease-in"
			leave-from-class="opacity-100" leave-to-class="opacity-0">
			<SplashScreen v-if="!isReady" />
		</Transition>

		<!-- App Layout (Renderiza apenas quando isReady é true para evitar saltos) -->
		<div v-show="isReady" class="flex min-h-screen">
			<!-- Sidebar -->
			<aside
				class="hidden md:flex w-64 flex-col border-r bg-card/50 backdrop-blur-xl text-card-foreground fixed h-full z-30">
				<div class="flex h-14 items-center border-b px-6 gap-3">
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20">
						A
					</div>
					<div class="min-w-0">
						<h2 class="text-sm font-bold truncate leading-tight">Control Center</h2>
						<p class="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Enterprise
							API</p>
					</div>
				</div>

				<nav class="flex-1 overflow-y-auto p-4">
					<div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-3 mb-3">Menu
						Principal
					</div>
					<div class="space-y-1">
						<NuxtLink v-for="item in NAV" :key="item.to" :to="item.to"
							class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary"
							:class="{ 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary hover:text-white': route.path.startsWith(item.to) }">
							<component :is="item.icon" class="h-4 w-4" />
							<span class="flex-1">{{ item.label }}</span>
							<ChevronRight v-if="route.path.startsWith(item.to)" class="h-3 w-3 opacity-50" />
						</NuxtLink>
					</div>
				</nav>

				<div class="mt-auto border-t p-4 space-y-4">
					<ClientOnly>
						<div class="flex items-center gap-3 px-2 py-2">
							<div
								class="h-9 w-9 rounded-full bg-linear-to-tr from-primary to-primary/60 flex items-center justify-center text-white font-bold text-xs shadow-md">
								{{ user?.name?.charAt(0) || 'U' }}
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-bold truncate leading-tight">{{ user?.name || 'Usuário' }}</p>
								<p class="text-[10px] text-muted-foreground truncate">{{ user?.email }}</p>
							</div>
						</div>
						<template #fallback>
							<div class="flex items-center gap-3 px-2 py-2 animate-pulse">
								<div class="h-9 w-9 rounded-full bg-muted"></div>
								<div class="flex-1 space-y-2">
									<div class="h-3 w-20 bg-muted rounded"></div>
									<div class="h-2 w-32 bg-muted rounded"></div>
								</div>
							</div>
						</template>
					</ClientOnly>
					<Button variant="ghost"
						class="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive group"
						@click="handleLogout">
						<LogOut class="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
						Sair da conta
					</Button>
				</div>
			</aside>

			<!-- Main Content Area -->
			<div class="flex flex-1 flex-col min-w-0 md:ml-64">
				<header
					class="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-8">
					<Button variant="ghost" size="icon" class="md:hidden">
						<Menu class="h-5 w-5" />
					</Button>

					<div class="flex flex-1 items-center gap-2">
						<span class="text-muted-foreground/40 text-sm font-medium">Home</span>
						<ChevronRight class="h-3 w-3 text-muted-foreground/20" />
						<span class="text-sm font-bold text-foreground">{{ currentNav?.label || 'Dashboard' }}</span>
					</div>

					<div class="flex items-center gap-2">
						<div class="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
						<span class="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Live
							System</span>
					</div>
				</header>

				<main class="flex-1 p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
					<slot />
				</main>
			</div>
		</div>
	</div>
</template>

<style>
/* Smooth transitions para o conteúdo das páginas */
.page-enter-active,
.page-leave-active {
	transition: all 0.2s;
}

.page-enter-from,
.page-leave-to {
	opacity: 0;
	filter: blur(1rem);
}
</style>
