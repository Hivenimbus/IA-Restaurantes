<script setup lang="ts">
import { 
  ArrowRightOnRectangleIcon, 
  MapPinIcon, 
  BanknotesIcon, 
  ClipboardDocumentListIcon,
  ClockIcon,
  ShoppingBagIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

const { user, logout, fetchUser } = useAuth()
const router = useRouter()

const orders = ref<any[]>([])
const requests = ref<any[]>([])
const loading = ref(true)
const activeTab = ref<'active' | 'history'>('active')
const historySearchQuery = ref('')

const statusOptions = ['Aguardando', 'Em preparação', 'Enviado']

const isAutomaticMode = ref(false)
const averageWaitTime = ref(30)
const savingSettings = ref(false)

let refreshInterval: ReturnType<typeof setInterval>

onMounted(async () => {
  if (!user.value) {
    await fetchUser()
  }
  
  if (!user.value) {
    return navigateTo('/login')
  }

  await Promise.all([fetchOrders(), fetchRequests(), fetchSettings()])

  // Start polling every 5 seconds for new orders/requests
  refreshInterval = setInterval(() => {
    fetchOrders(true) // background = true (no loading flash)
    fetchRequests()
  }, 5000)
})

const fetchSettings = async () => {
  try {
    const data: any = await $fetch('/api/settings')
    isAutomaticMode.value = data.isAutomaticMode || false
    averageWaitTime.value = data.averageWaitTime || 30
  } catch (e) {
    console.error('Failed to fetch settings', e)
  }
}

const updateSettings = async () => {
  savingSettings.value = true
  try {
    await $fetch('/api/settings', {
      method: 'POST',
      body: {
        isAutomaticMode: isAutomaticMode.value,
        averageWaitTime: averageWaitTime.value
      }
    })
  } catch (e) {
    console.error('Failed to update settings', e)
    alert('Erro ao salvar configurações do modo automático')
  } finally {
    savingSettings.value = false
  }
}

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})

const fetchRequests = async () => {
  try {
    const data = await $fetch('/api/requests')
    requests.value = data as any[]
  } catch (e) {
    console.error('Failed to fetch requests', e)
  }
}

const approveRequest = async (req: any) => {
  if (!confirm('Aprovar esta solicitação?')) return
  try {
    await $fetch(`/api/requests/${req.id}`, {
      method: 'PUT',
      body: { status: 'approved' }
    })
    await fetchRequests()
    await fetchOrders() // Update orders as status might change
  } catch (e) {
    alert('Erro ao aprovar solicitação')
  }
}

const rejectRequest = async (req: any) => {
  if (!confirm('Rejeitar esta solicitação?')) return
  try {
    await $fetch(`/api/requests/${req.id}`, {
      method: 'PUT',
      body: { status: 'rejected' }
    })
    await fetchRequests()
  } catch (e) {
    alert('Erro ao rejeitar solicitação')
  }
}

const dismissRequest = async (req: any) => {
  try {
    await $fetch(`/api/requests/${req.id}`, {
      method: 'PUT',
      body: { dismissed: true }
    })
    await fetchRequests()
  } catch (e) {
    alert('Erro ao fechar notificação')
  }
}

const fetchOrders = async (background = false) => {
  if (!background) loading.value = true
  try {
    const data = await $fetch('/api/orders')
    orders.value = data as any[]
  } catch (e) {
    console.error('Failed to fetch orders', e)
  } finally {
    if (!background) loading.value = false
  }
}

const activeOrders = computed(() => {
  return orders.value.filter(o => o.status !== 'Entregue' && o.status !== 'Cancelado')
})

const historyOrders = computed(() => {
  let list = orders.value.filter(o => o.status === 'Entregue' || o.status === 'Cancelado')
  
  if (historySearchQuery.value) {
    const query = historySearchQuery.value.toLowerCase()
    list = list.filter(o => o.customerName?.toLowerCase().includes(query))
  }
  
  return list
})

const currentList = computed(() => {
  return activeTab.value === 'active' ? activeOrders.value : historyOrders.value
})

const updateStatus = async (orderId: number, newStatus: string) => {
  const order = orders.value.find(o => o.id === orderId)
  if (!order) return

  const oldStatus = order.status
  // Optimistic update
  if (newStatus === 'Entregue' || newStatus === 'Cancelado') {
    // We don't remove from the main list, just let the computed properties handle visibility
    // But since the status changes, it will move from active to history automatically
    order.status = newStatus
    order.completedAt = new Date().toISOString()
  } else {
    order.status = newStatus
  }

  try {
    await $fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: { status: newStatus }
    })
  } catch (e) {
    // Revert
    order.status = oldStatus
    alert('Erro ao atualizar status.')
  }
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Aguardando': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    case 'Em preparação': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Enviado': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'Entregue': return 'bg-green-50 text-green-700 border-green-200'
    case 'Cancelado': return 'bg-red-50 text-red-700 border-red-200'
    default: return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

const formatItems = (items: any[]) => {
  if (!items || items.length === 0) return 'Sem itens'
  return items.map(i => `${i.quantity}x ${i.itemName}`).join(', ')
}

const stats = computed(() => {
  return [
    { name: 'Total de Pedidos', value: orders.value.length, icon: ClipboardDocumentListIcon, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Aguardando', value: activeOrders.value.filter(o => o.status === 'Aguardando').length, icon: ClockIcon, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { name: 'Em Preparação', value: activeOrders.value.filter(o => o.status === 'Em preparação').length, icon: ShoppingBagIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
  ]
})
</script>

<template>
  <AppLayout>
    <div class="sm:flex sm:items-center sm:justify-between mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div class="flex items-center gap-4">
        <div class="flex items-start gap-2">
          <div>
            <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              Modo de Operação
            </h2>
            <p class="text-sm text-slate-500">Defina como o sistema deve lidar com o fluxo de pedidos.</p>
          </div>
        </div>
        
        <div class="ml-4 flex items-center gap-3">
          <div class="flex items-center bg-slate-100 p-1 rounded-lg">
            <button 
              @click="isAutomaticMode = false; updateSettings()"
              :class="[!isAutomaticMode ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700', 'px-4 py-2 rounded-md text-sm transition-all']"
            >
              Padrão
            </button>
            <button 
              @click="isAutomaticMode = true; updateSettings()"
              :class="[isAutomaticMode ? 'bg-indigo-600 shadow-sm text-white font-semibold' : 'text-slate-500 hover:text-slate-700', 'px-4 py-2 rounded-md text-sm transition-all flex items-center gap-2']"
            >
              Automático
            </button>
          </div>
          
          <div class="group relative flex items-center">
            <InformationCircleIcon class="h-5 w-5 text-slate-400 hover:text-indigo-500 cursor-help transition-colors" />
            <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 md:w-96 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
              <div class="bg-slate-800 text-white text-xs rounded-xl p-4 shadow-xl">
                <p class="font-semibold mb-2 text-indigo-300">Entenda os modos:</p>
                <ul class="space-y-2 text-slate-300">
                  <li><strong class="text-white">Padrão:</strong> Você atualiza os status dos pedidos e responde às solicitações de edição/cancelamento manualmente.</li>
                  <li><strong class="text-white">Automático:</strong> Pedidos avançam de "Em preparação" para "Enviado" sozinhos no tempo definido. As solicitações são auto-respondidas dependendo se o pedido já saiu para entrega.</li>
                </ul>
              </div>
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-slate-800"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="isAutomaticMode" class="mt-4 sm:mt-0 flex items-center gap-3">
        <label class="text-sm font-medium text-slate-700">Tempo de Espera (min):</label>
        <div class="flex items-center gap-2">
          <input 
            type="number" 
            v-model="averageWaitTime" 
            min="1"
            class="block w-20 rounded-md border-0 py-1.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
          <button @click="updateSettings()" :disabled="savingSettings" class="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-indigo-100 transition disabled:opacity-50">
            Salvar
          </button>
        </div>
      </div>
    </div>

    <!-- Requests Alert Section -->
    <div v-if="requests.length > 0" class="mb-8 space-y-4">
      <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
        <ExclamationTriangleIcon class="h-5 w-5 text-amber-500" />
        Solicitações Pendentes
      </h2>
      <div v-for="req in requests" :key="req.id" class="bg-amber-50 rounded-xl p-4 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 class="font-medium text-amber-900">
            {{ req.requestType === 'cancellation' ? 'Solicitação de Cancelamento' : 'Solicitação de Alteração' }}
            <span class="text-sm font-normal text-amber-700">- Pedido #{{ req.orderId }}</span>
          </h3>
          <p class="text-sm text-amber-800 mt-1">
             <strong>Cliente:</strong> {{ req.order.customerName }} <br>
             <span v-if="req.details"><strong>Detalhes:</strong> {{ req.details }}</span>
          </p>
        </div>
        <div class="flex items-center gap-3">
           <template v-if="req.status === 'pending'">
             <button @click="approveRequest(req)" class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition">Aprovar</button>
             <button @click="rejectRequest(req)" class="px-4 py-2 bg-red-100 text-red-700 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-200 transition">Rejeitar</button>
           </template>
           <template v-else>
             <span v-if="req.status === 'approved'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                <CheckIcon class="h-4 w-4" /> Aceito Automaticamente
             </span>
             <span v-else-if="req.status === 'rejected'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                <XMarkIcon class="h-4 w-4" /> Rejeitado Automaticamente
             </span>
             <button @click="dismissRequest(req)" class="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition">Fechar</button>
           </template>
        </div>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
      <div v-for="stat in stats" :key="stat.name" class="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-100">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <component :is="stat.icon" class="h-6 w-6" :class="stat.color" aria-hidden="true" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-slate-500 truncate">{{ stat.name }}</dt>
                <dd>
                  <div class="text-lg font-bold text-slate-900">{{ stat.value }}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-slate-200 mb-6">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <button 
          @click="activeTab = 'active'"
          :class="[
            activeTab === 'active'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
            'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors'
          ]"
        >
          <ClipboardDocumentListIcon class="-ml-0.5 mr-2 h-5 w-5" :class="activeTab === 'active' ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-500'" />
          <span>Em Andamento</span>
          <span v-if="activeOrders.length > 0" class="ml-3 hidden rounded-full bg-indigo-100 py-0.5 px-2.5 text-xs font-medium text-indigo-600 md:inline-block">{{ activeOrders.length }}</span>
        </button>
        <button 
          @click="activeTab = 'history'"
          :class="[
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
            'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors'
          ]"
        >
          <ArchiveBoxIcon class="-ml-0.5 mr-2 h-5 w-5" :class="activeTab === 'history' ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-500'" />
          <span>Histórico</span>
          <span v-if="historyOrders.length > 0" class="ml-3 hidden rounded-full bg-slate-100 py-0.5 px-2.5 text-xs font-medium text-slate-600 md:inline-block">{{ historyOrders.length }}</span>
        </button>
      </nav>
    </div>

    <!-- Header & Filter for History -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <h2 class="text-lg font-bold text-slate-800">{{ activeTab === 'active' ? 'Pedidos Recentes' : 'Histórico de Pedidos' }}</h2>
      
      <div v-if="activeTab === 'history'" class="relative rounded-md shadow-sm max-w-xs w-full">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon class="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <input 
          type="text" 
          v-model="historySearchQuery" 
          class="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" 
          placeholder="Buscar cliente..." 
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && orders.length === 0" class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
       <div v-for="i in 3" :key="i" class="animate-pulse bg-white rounded-xl h-64 border border-slate-200"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="currentList.length === 0" class="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
      <div class="mx-auto h-12 w-12 text-slate-400">
        <ClipboardDocumentListIcon class="h-12 w-12" />
      </div>
      <h3 class="mt-2 text-sm font-semibold text-slate-900">Nenhum pedido encontrado</h3>
      <p class="mt-1 text-sm text-slate-500">
        {{ activeTab === 'active' ? 'Aguarde a IA enviar os pedidos do WhatsApp.' : (historySearchQuery ? 'Nenhum cliente encontrado com esse nome.' : 'Você ainda não concluiu nenhum pedido.') }}
      </p>
    </div>

    <!-- Orders Grid -->
    <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="order in currentList" :key="order.id" class="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300 flex flex-col">
        
        <!-- Card Header -->
        <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-bold text-slate-900">#{{ order.id }}</span>
              <span class="text-xs text-slate-400">•</span>
              <span class="text-sm">{{ new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-700">
              <UserIcon class="h-4 w-4 text-slate-400" />
              <span class="text-sm font-medium">{{ order.customerName }}</span>
            </div>
            <div v-if="order.customerPhone" class="flex items-center gap-1.5 text-slate-700 mt-1">
              <PhoneIcon class="h-4 w-4 text-slate-400" />
              <span class="text-sm">{{ order.customerPhone }}</span>
            </div>
          </div>
          <span :class="[getStatusStyles(order.status), 'px-2.5 py-1 rounded-full text-xs font-semibold border']">
            {{ order.status }}
          </span>
        </div>

        <!-- Card Body -->
        <div class="px-6 py-5 flex-1 space-y-4">
          <!-- Items -->
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Itens do Pedido</p>
            <p class="text-sm text-slate-800 leading-relaxed">{{ formatItems(order.orderItems) }}</p>
          </div>

          <!-- Observations -->
          <div v-if="order.observations" class="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
            <p class="text-xs font-semibold text-yellow-700 mb-1 flex items-center gap-1">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Observação
            </p>
            <p class="text-sm text-slate-700 italic">{{ order.observations }}</p>
          </div>

          <!-- Details Grid -->
          <div class="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pagamento</p>
              <div class="flex items-center gap-1.5 text-slate-700">
                <BanknotesIcon class="h-4 w-4 text-slate-400" />
                <span class="text-sm">{{ order.paymentMethod }}</span>
              </div>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total</p>
              <p class="text-lg font-bold text-emerald-600">R$ {{ Number(order.total).toFixed(2) }}</p>
            </div>
          </div>

          <!-- Address -->
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Entrega</p>
            <div class="flex items-start gap-1.5 text-slate-600">
              <MapPinIcon class="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <span class="text-sm leading-tight">{{ order.address }}</span>
            </div>
          </div>
        </div>

        <!-- Card Footer / Actions (Only for Active Orders) -->
        <div v-if="activeTab === 'active'" class="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl overflow-x-auto">
          <div class="flex items-center justify-between gap-4">
            <!-- Status Toggles -->
            <div v-if="!isAutomaticMode" class="flex gap-2 flex-1">
              <button 
                v-for="status in statusOptions" 
                :key="status"
                @click="updateStatus(order.id, status)"
                :class="[
                  order.status === status 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-600 ring-offset-2' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
                  'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 text-center whitespace-nowrap'
                ]"
              >
                {{ status }}
              </button>
            </div>

            <!-- Terminal Actions -->
            <div class="flex gap-2 border-l border-slate-200 pl-4">
              <button 
                @click="updateStatus(order.id, 'Entregue')"
                class="p-2 rounded-lg bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors"
                title="Concluir Pedido (Entregue)"
              >
                <CheckIcon class="h-5 w-5" />
              </button>
              <button 
                @click="updateStatus(order.id, 'Cancelado')"
                class="p-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors"
                title="Cancelar Pedido"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        <!-- Footer for History (No Actions, just info) -->
        <div v-else class="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
           <p class="text-xs text-slate-500 text-center">
             {{ order.status === 'Cancelado' ? 'Cancelado' : 'Finalizado' }} em 
             <span class="font-medium">
               {{ order.completedAt ? new Date(order.completedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A' }}
             </span>
           </p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
