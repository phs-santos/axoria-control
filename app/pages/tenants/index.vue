<script setup lang="ts">
import { 
  Plus, 
  Building2, 
  Users, 
  KeyRound, 
  HardDrive,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Settings
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import Button from '~/components/ui/Button.vue'
import { tenantsService, type Tenant } from '~/services/tenants.service'

const tenants = ref<Tenant[]>([])
const loading = ref(true)
const showCreate = ref(false)
const creating = ref(false)

const newTenant = ref({
  name: "",
  slug: "",
  plan: "standard"
})

const fetchTenants = async () => {
  loading.value = true
  try {
    tenants.value = await tenantsService.getAll()
  } catch (err) {
    toast.error("Acesso negado. Requer privilégios ROOT.")
  } finally {
    loading.value = false
  }
}

const createTenant = async () => {
  creating.value = true
  try {
    await tenantsService.create(newTenant.value)
    toast.success("Empresa cadastrada")
    showCreate.value = false
    fetchTenants()
  } catch (err) {
    toast.error("Falha ao cadastrar empresa")
  } finally {
    creating.value = false
  }
}

const switchContext = async (tenantId: string) => {
  try {
    const { user } = useAuth()
    if (!user.value?.id) return
    
    await tenantsService.switchContext(tenantId, user.value.id)
    toast.success("Contexto alterado com sucesso")
    window.location.reload()
  } catch (err) {
    toast.error("Falha ao alternar contexto")
  }
}

onMounted(fetchTenants)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Administração de Empresas</h1>
        <p class="text-muted-foreground">Gerencie tenants, quotas e isolamento de dados.</p>
      </div>
      <Button @click="showCreate = true">
        <Plus class="mr-2 h-4 w-4" />
        Nova Empresa
      </Button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 class="h-8 w-8 animate-spin mb-4" />
    </div>

    <div v-else class="grid gap-6">
      <div 
        v-for="tenant in tenants" 
        :key="tenant.id"
        class="group relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
      >
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Building2 class="h-6 w-6" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-lg leading-tight">{{ tenant.name }}</h3>
                <span 
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  :class="tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                >
                  {{ tenant.status }}
                </span>
              </div>
              <p class="text-sm text-muted-foreground">Slug: <span class="font-mono">{{ tenant.slug }}</span></p>
            </div>
          </div>

          <div class="flex flex-wrap gap-6 text-sm text-muted-foreground border-t md:border-t-0 pt-4 md:pt-0">
            <div class="flex items-center gap-1.5">
              <Users class="h-4 w-4" />
              <span>{{ tenant.planQuotas.maxUsers }} usuários</span>
            </div>
            <div class="flex items-center gap-1.5">
              <KeyRound class="h-4 w-4" />
              <span>{{ tenant.planQuotas.maxApiKeys }} chaves</span>
            </div>
            <div class="flex items-center gap-1.5">
              <HardDrive class="h-4 w-4" />
              <span>{{ tenant.planQuotas.maxStorageMB }} MB</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="switchContext(tenant.id)">
              <ExternalLink class="mr-2 h-4 w-4" />
              Acessar
            </Button>
            <Button variant="ghost" size="icon" class="h-9 w-9">
              <Settings class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div class="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg animate-in fade-in zoom-in duration-200">
        <h2 class="text-xl font-bold mb-1 text-foreground">Registrar Nova Empresa</h2>
        <p class="text-sm text-muted-foreground mb-6">Configure o nome e a identificação única do tenant.</p>
        
        <form @submit.prevent="createTenant" class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Nome Fantasia</label>
            <input 
              v-model="newTenant.name"
              placeholder="Ex: Axoria Tech Ltda"
              required
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Slug (URL ID)</label>
            <input 
              v-model="newTenant.slug"
              placeholder="ex: axoria-tech"
              required
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4 pt-2">
            <div class="col-span-2 text-xs font-bold uppercase text-muted-foreground mb-1">Plano Inicial</div>
            <div class="border rounded-md p-3 cursor-pointer hover:bg-muted/50 border-primary bg-primary/5">
              <div class="font-bold text-sm">Standard</div>
              <div class="text-[10px] text-muted-foreground">5 Users · 3 Keys</div>
            </div>
            <div class="border rounded-md p-3 cursor-pointer hover:bg-muted/50">
              <div class="font-bold text-sm">Enterprise</div>
              <div class="text-[10px] text-muted-foreground">Ilimitado · 50 Keys</div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="ghost" type="button" @click="showCreate = false">Cancelar</Button>
            <Button type="submit" :disabled="creating">
              <Loader2 v-if="creating" class="mr-2 h-4 w-4 animate-spin" />
              Cadastrar Empresa
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
