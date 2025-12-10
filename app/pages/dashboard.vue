<script setup lang="ts">
import { 
  ArrowRightOnRectangleIcon, 
  MapPinIcon, 
  BanknotesIcon, 
  ClipboardDocumentListIcon,
  ClockIcon,
  ShoppingBagIcon,
  UserIcon
} from '@heroicons/vue/24/outline'

const { user, logout, fetchUser } = useAuth()
const router = useRouter()

const orders = ref([
  {
    id: 101,
    customerName: 'João Silva',
    items: '2x X-Bacon, 1x Coca-Cola 2L',
    total: 58.00,
    address: 'Rua das Flores, 123 - Centro',
    paymentMethod: 'PIX',
    observations: 'Sem cebola no X-Bacon',
    status: 'Aguardando',
    createdAt: new Date(Date.now() - 1000 * 60 * 5) // 5 mins ago
  },
  {
    id: 102,
    customerName: 'Maria Oliveira',
    items: '1x Pizza Calabresa Grande',
    total: 45.00,
    address: 'Av. Paulista, 1500 - Bela Vista',
    paymentMethod: 'Cartão de Crédito',
    observations: '',
    status: 'Em preparação',
    createdAt: new Date(Date.now() - 1000 * 60 * 25) // 25 mins ago
  },
  {
    id: 103,
    customerName: 'Pedro Santos',
    items: '1x Açaí 500ml',
    total: 18.00,
    address: 'Rua Augusta, 500 - Consolação',
    paymentMethod: 'Dinheiro',
    observations: 'Troco para 50',
    status: 'Enviado',
    createdAt: new Date(Date.now() - 1000 * 60 * 45) // 45 mins ago
  }
])

const statusOptions = ['Aguardando', 'Em preparação', 'Enviado']

onMounted(async () => {
  if (!user.value) {
    await fetchUser()
  }
  
  if (!user.value) {
    return navigateTo('/login')
  }
})

const handleLogout = async () => {
  await logout()
}

const updateStatus = (orderId: number, newStatus: string) => {
  const order = orders.value.find(o => o.id === orderId)
  if (order) {
    order.status = newStatus
  }
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Aguardando': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    case 'Em preparação': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Enviado': return 'bg-green-50 text-green-700 border-green-200'
    default: return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

const stats = computed(() => {
  return [
    { name: 'Total de Pedidos', value: orders.value.length, icon: ClipboardDocumentListIcon, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Aguardando', value: orders.value.filter(o => o.status === 'Aguardando').length, icon: ClockIcon, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { name: 'Em Preparação', value: orders.value.filter(o => o.status === 'Em preparação').length, icon: ShoppingBagIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
  ]
})
</script>

<template>
  <AppLayout>
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

    <h2 class="text-lg font-bold text-slate-800 mb-6">Pedidos Recentes</h2>

    <!-- Orders Grid -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="order in orders" :key="order.id" class="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300 flex flex-col">
        
        <!-- Card Header -->
        <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-bold text-slate-900">#{{ order.id }}</span>
              <span class="text-xs text-slate-400">•</span>
              <span class="text-sm text-slate-500">{{ new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-700">
              <UserIcon class="h-4 w-4 text-slate-400" />
              <span class="text-sm font-medium">{{ order.customerName }}</span>
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
            <p class="text-sm text-slate-800 leading-relaxed">{{ order.items }}</p>
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
              <p class="text-lg font-bold text-emerald-600">R$ {{ order.total.toFixed(2) }}</p>
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

        <!-- Card Footer / Actions -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
          <div class="flex gap-2">
            <button 
              v-for="status in statusOptions" 
              :key="status"
              @click="updateStatus(order.id, status)"
              :class="[
                order.status === status 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-600 ring-offset-2' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
                'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 text-center'
              ]"
            >
              {{ status }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
