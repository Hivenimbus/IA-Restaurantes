<script setup lang="ts">
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Aguardando': return 'bg-yellow-100 text-yellow-800'
    case 'Em preparação': return 'bg-blue-100 text-blue-800'
    case 'Enviado': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900">
          {{ user?.establishment_name || 'Dashboard Restaurante' }}
        </h1>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">{{ user?.email }}</span>
          <button @click="handleLogout" class="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
            Sair
          </button>
        </div>
      </div>
    </header>

    <main>
      <div class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <!-- Orders List -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="order in orders" :key="order.id" class="overflow-hidden bg-white shadow rounded-lg border border-gray-200">
            <div class="px-4 py-5 sm:p-6">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-lg font-medium leading-6 text-gray-900">Pedido #{{ order.id }}</h3>
                  <p class="text-sm text-gray-500">{{ new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</p>
                </div>
                <span :class="[getStatusColor(order.status), 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium']">
                  {{ order.status }}
                </span>
              </div>
              
              <div class="space-y-3">
                <div>
                  <p class="text-sm font-medium text-gray-500">Cliente</p>
                  <p class="text-sm text-gray-900">{{ order.customerName }}</p>
                </div>
                
                <div>
                  <p class="text-sm font-medium text-gray-500">Itens</p>
                  <p class="text-sm text-gray-900">{{ order.items }}</p>
                </div>

                <div v-if="order.observations">
                  <p class="text-sm font-medium text-gray-500">Observações</p>
                  <p class="text-sm text-yellow-600 bg-yellow-50 p-2 rounded mt-1">{{ order.observations }}</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm font-medium text-gray-500">Pagamento</p>
                    <p class="text-sm text-gray-900">{{ order.paymentMethod }}</p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-500">Total</p>
                    <p class="text-lg font-bold text-green-600">R$ {{ order.total.toFixed(2) }}</p>
                  </div>
                </div>

                <div>
                  <p class="text-sm font-medium text-gray-500">Endereço</p>
                  <p class="text-sm text-gray-900 truncate" :title="order.address">{{ order.address }}</p>
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-6 pt-4 border-t border-gray-100">
                <p class="text-xs text-gray-500 mb-2">Alterar Status:</p>
                <div class="flex gap-2">
                  <button 
                    v-for="status in statusOptions" 
                    :key="status"
                    @click="updateStatus(order.id, status)"
                    :class="[
                      order.status === status ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                      'px-2 py-1 rounded text-xs font-medium transition-colors'
                    ]"
                  >
                    {{ status }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
