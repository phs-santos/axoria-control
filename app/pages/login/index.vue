<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Loader2 } from 'lucide-vue-next'
import Button from '~/components/ui/Button.vue'
import { ApiError } from '~/utils/api'

definePageMeta({
	layout: false
})

const { loginWithPassword, isAuthenticated } = useAuth()
const route = useRoute()

// Redirect if already authenticated
if (isAuthenticated.value) {
	const target = (route.query.redirect as string) || "/dashboard"
	navigateTo(target)
}

const email = ref("")
const password = ref("")
const loading = ref(false)

const goNext = () => {
	const target = (route.query.redirect as string) || "/dashboard"
	// Force a full reload to ensure everything is fresh
	window.location.href = target
}

const submitPassword = async () => {
	loading.value = true
	try {
		await loginWithPassword(email.value, password.value)
		toast.success("Login realizado")
		goNext()
	} catch (err) {
		const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Falha no login"
		toast.error(msg)
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<div class="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
		<div class="w-full max-w-md">
			<div class="mb-8 text-center">
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold">
					A
				</div>
				<h1 class="text-2xl font-semibold tracking-tight">Axoria Admin</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					Acesse o painel para gerenciar sua conta
				</p>
			</div>

			<div class="rounded-xl border bg-card p-6 shadow-sm">
				<form @submit.prevent="submitPassword" class="space-y-4">
					<div class="space-y-2">
						<label for="email" class="text-sm font-medium">Email</label>
						<input id="email" v-model="email" type="email" required
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
					</div>
					<div class="space-y-2">
						<label for="password" class="text-sm font-medium">Senha</label>
						<input id="password" v-model="password" type="password" required
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
					</div>
					<Button type="submit" class="w-full" :disabled="loading">
						<Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
						Entrar
					</Button>
				</form>
			</div>

			<p class="mt-6 text-center text-xs text-muted-foreground">
				Conectado a <span class="font-mono">services.axoria.digital</span>
			</p>
		</div>
	</div>
</template>
