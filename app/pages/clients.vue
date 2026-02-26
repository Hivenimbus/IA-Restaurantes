<script setup lang="ts">
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  PencilSquareIcon,
  TrashIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon
} from '@heroicons/vue/24/outline'

const { user } = useAuth()
const clients = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')

const showEditModal = ref(false)
const editingClient = ref<any>(null)
const savings = ref(false)
const form = ref({
  name: '',
  phone: '',
  address: ''
})

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

const openEditModal = (client: any) => {
  editingClient.value = client
  form.value = {
    name: client.name,
    phone: client.phone,
    address: client.address || ''
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingClient.value = null
  form.value = { name: '', phone: '', address: '' }
}

const saveClient = async () => {
  if (!editingClient.value) return
  
  savings.value = true
  try {
    await $fetch(`/api/clients/${editingClient.value.id}`, {
      method: 'PUT',
      body: form.value
    })
    await fetchClients()
    closeEditModal()
  } catch (e: any) {
    alert(e.data?.statusMessage || 'Erro ao salvar cliente.')
  } finally {
    savings.value = false
  }
}

const showDeleteModal = ref(false)
const clientToDelete = ref<any>(null)

const deleteClient = (client: any) => {
  clientToDelete.value = client
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!clientToDelete.value) return
  
  savings.value = true
  try {
    await $fetch(`/api/clients/${clientToDelete.value.id}`, {
      method: 'DELETE'
    })
    await fetchClients()
    showDeleteModal.value = false
    clientToDelete.value = null
  } catch (e: any) {
    alert(e.data?.statusMessage || 'Erro ao excluir cliente.')
  } finally {
    savings.value = false
  }
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
      <div v-for="client in filteredClients" :key="client.id" class="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300 p-6 flex flex-col justify-between group">
        <div>
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-sm font-medium text-slate-900">{{ client.name }}</h3>
              <p class="text-xs text-slate-500">Cliente desde {{ new Date(client.createdAt).toLocaleDateString() }}</p>
            </div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click="openEditModal(client)" class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Editar">
                <PencilSquareIcon class="h-4 w-4" />
              </button>
              <button @click="deleteClient(client)" class="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Excluir">
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center text-sm text-slate-600">
              <PhoneIcon class="h-4 w-4 mr-2 text-slate-400" />
              {{ client.phone }}
            </div>
            <div class="flex gap-4">
              <div class="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <CurrencyDollarIcon class="h-4 w-4 mr-1 text-emerald-500" />
                R$ {{ Number(client.cashback || 0).toFixed(2) }} Cashback
              </div>
              <div class="flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                <ShoppingBagIcon class="h-4 w-4 mr-1 text-indigo-500" />
                {{ client.orderCount || 0 }} {{ client.orderCount === 1 ? 'Pedido' : 'Pedidos' }}
              </div>
            </div>
            <div v-if="client.address" class="flex items-start text-sm text-slate-600">
              <MapPinIcon class="h-4 w-4 mr-2 text-slate-400 mt-0.5" />
              <span class="leading-tight">{{ client.address }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="client.lastOrder" class="flex items-center text-sm text-slate-600 pt-2 border-t border-slate-100 mt-4">
           <ClockIcon class="h-4 w-4 mr-2 text-slate-400" />
           <span class="text-xs w-full">
             Último pedido: {{ client.lastOrder ? new Date(client.lastOrder.createdAt).toLocaleDateString() : 'N/A' }}
             <span v-if="client.lastOrder" class="block text-slate-500 text-xs mt-1 font-medium truncate" :title="formatItems(client.lastOrder.orderItems)">
               {{ formatItems(client.lastOrder.orderItems) }}
             </span>
           </span>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"></div>

      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 class="text-xl font-semibold leading-6 text-slate-900" id="modal-title">
                    Editar Cliente
                  </h3>
                  <div class="mt-6 space-y-4">
                    <div>
                      <label for="name" class="block text-sm font-medium leading-6 text-slate-900">Nome</label>
                      <div class="mt-1">
                        <input type="text" name="name" id="name" v-model="form.name" required class="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3">
                      </div>
                    </div>

                    <div>
                      <label for="phone" class="block text-sm font-medium leading-6 text-slate-900">Telefone</label>
                      <div class="mt-1">
                        <input type="text" name="phone" id="phone" v-model="form.phone" required class="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3">
                      </div>
                    </div>

                    <div>
                      <label for="address" class="block text-sm font-medium leading-6 text-slate-900">Endereço</label>
                      <div class="mt-1">
                        <input type="text" name="address" id="address" v-model="form.address" class="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button type="button" @click="saveClient" :disabled="savings" class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50">
                {{ savings ? 'Salvando...' : 'Salvar' }}
              </button>
              <button type="button" @click="closeEditModal" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"></div>
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <TrashIcon class="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 class="text-base font-semibold leading-6 text-slate-900" id="modal-title">Excluir Cliente</h3>
                  <div class="mt-2">
                    <p class="text-sm text-slate-500">
                      Tem certeza que deseja excluir o cliente <strong>{{ clientToDelete?.name }}</strong>? Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button type="button" @click="confirmDelete" :disabled="savings" class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50">
                {{ savings ? 'Excluindo...' : 'Excluir' }}
              </button>
              <button type="button" @click="showDeleteModal = false" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </AppLayout>
</template>
