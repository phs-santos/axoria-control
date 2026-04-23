<template>
	<div class="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background">
		<div class="relative flex flex-col items-center">
			<!-- Logo ou Ícone Principal -->
			<div
				class="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20 animate-pulse">
				<span class="text-2xl font-bold italic text-white">A</span>
			</div>

			<!-- Indicador de Carregamento -->
			<div class="flex flex-col items-center gap-4">
				<div class="flex items-center gap-2">
					<div class="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
					<div class="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
					<div class="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"></div>
				</div>
				<p class="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
					Iniciando Control Center
				</p>
			</div>
		</div>

		<!-- Rodapé Minimalista -->
		<div class="absolute bottom-10 text-[9px] font-medium text-muted-foreground/40">
			AXORIA SERVICES &copy; 2026
		</div>
	</div>
</template>

<style scoped>
@keyframes pulse {

	0%,
	100% {
		transform: scale(1);
		opacity: 1;
	}

	50% {
		transform: scale(1.05);
		opacity: 0.8;
	}
}
</style>
