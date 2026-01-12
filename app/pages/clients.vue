<script setup lang="ts">
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

const { user } = useAuth()
const clients = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')

definePageMeta({
  middleware: 'auth'
})

onMounted(async () => {
  await fetchClients()
})

const fetchClients = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/clients')
    clients.value = data as any[]
  } catch (e) {
    console.error('Failed to fetch clients', e)
  } finally {
    loading.value = false
  }
}

const filteredClients = computed(() => {
  if (!searchQuery.value) return clients.value
  
  const query = searchQuery.value.toLowerCase()
  return clients.value.filter(c => 
    c.name.toLowerCase().includes(query) || 
    c.phone.toLowerCase().includes(query)
  )
})

const formatItems = (items: any[]) => {
  if (!items || items.length === 0) return 'Sem itens'
  return items.map(i => `${i.quantity}x ${i.itemName}`).join(', ')
}
</script>

<template>
  <AppLayout>
    <div class="sm:flex sm:items-center sm:justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Meus Clientes</h1>
        <p class="mt-2 text-sm text-slate-600">
          Gerencie a base de clientes que já fizeram pedidos.
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <div class="relative rounded-md shadow-sm max-w-xs w-full">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon class="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <input 
            type="text" 
            v-model="searchQuery" 
            class="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" 
            placeholder="Buscar nome ou telefone..." 
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 6" :key="i" class="animate-pulse bg-white rounded-xl h-48 border border-slate-200"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="clients.length === 0" class="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
      <div class="mx-auto h-12 w-12 text-slate-400">
        <UserGroupIcon class="h-12 w-12" />
      </div>
      <h3 class="mt-2 text-sm font-semibold text-slate-900">Nenhum cliente encontrado</h3>
      <p class="mt-1 text-sm text-slate-500">
        Os clientes serão cadastrados automaticamente quando fizerem o primeiro pedido.
      </p>
    </div>

    <!-- Clients Grid -->
    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="client in filteredClients" :key="client.id" class="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300 p-6">
        <div class="flex items-center space-x-3 mb-4">
          <div>
            <h3 class="text-sm font-medium text-slate-900">{{ client.name }}</h3>
            <p class="text-xs text-slate-500">Cliente desde {{ new Date(client.createdAt).toLocaleDateString() }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center text-sm text-slate-600">
            <PhoneIcon class="h-4 w-4 mr-2 text-slate-400" />
            {{ client.phone }}
          </div>
          <div v-if="client.address" class="flex items-start text-sm text-slate-600">
            <MapPinIcon class="h-4 w-4 mr-2 text-slate-400 mt-0.5" />
            <span class="leading-tight">{{ client.address }}</span>
          </div>
          <div v-if="client.lastOrder" class="flex items-center text-sm text-slate-600 pt-2 border-t border-slate-100 mt-3">
             <ClockIcon class="h-4 w-4 mr-2 text-slate-400" />
             <span class="text-xs">
               Último pedido: {{ client.lastOrder ? new Date(client.lastOrder.createdAt).toLocaleDateString() : 'N/A' }}
               <span v-if="client.lastOrder" class="block text-slate-500 text-xs mt-1 font-medium truncate">
                 {{ formatItems(client.lastOrder.orderItems) }}
               </span>
             </span>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
