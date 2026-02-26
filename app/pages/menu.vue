<script setup lang="ts">
import { 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  PhotoIcon,
  TagIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  LinkIcon,
  ArrowUpTrayIcon,
  ClipboardDocumentListIcon
} from '@heroicons/vue/24/outline'

const { user, fetchUser } = useAuth()
const menuItems = ref<any[]>([])
const loading = ref(true)
const showModal = ref(false)
const showSettingsModal = ref(false) // New Modal
const saving = ref(false)
const savingSettings = ref(false) // New loading state
const removingFile = ref(false) // Handle file removal state
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const searchQuery = ref('')
const selectedFile = ref<File | null>(null) // File handling

const form = ref({
  name: '',
  description: '',
  price: '',
  category: '',
  imageUrl: '',
  isAvailable: true,
  isPromotion: false,
  promotionalPrice: ''
})

const discountPercentage = ref('')

const calculatePercentage = () => {
    const price = parseFloat(String(form.value.price).replace(',', '.'))
    const promo = parseFloat(String(form.value.promotionalPrice).replace(',', '.'))
    if (!isNaN(price) && !isNaN(promo) && price > 0) {
        let pct = ((price - promo) / price) * 100
        discountPercentage.value = pct.toFixed(0)
    } else {
        discountPercentage.value = ''
    }
}

const calculatePromoPrice = () => {
    const price = parseFloat(String(form.value.price).replace(',', '.'))
    const pct = parseFloat(String(discountPercentage.value).replace(',', '.'))
    if (!isNaN(price) && !isNaN(pct)) {
        let promo = price - (price * (pct / 100))
        form.value.promotionalPrice = promo.toFixed(2)
    } else {
        form.value.promotionalPrice = ''
    }
}

const onPromotionChange = () => {
  if (!form.value.isPromotion) {
    form.value.promotionalPrice = ''
    discountPercentage.value = ''
  } else {
    calculatePercentage()
  }
}


const settingsForm = ref({
  menuLink: '',
  menuFileUrl: ''
})

const categories = ['Lanches', 'Bebidas', 'Sobremesas', 'Pratos', 'Porções', 'Outros']

onMounted(async () => {
  if (!user.value) await fetchUser()
  if (!user.value) return navigateTo('/login')
  await Promise.all([fetchMenuItems(), fetchSettings()])
})

const fetchSettings = async () => {
  try {
    const data = await $fetch('/api/menu/settings')
    settingsForm.value = {
      menuLink: data.menuLink || '',
      menuFileUrl: data.menuFileUrl || ''
    }
  } catch (e) {
    console.error('Failed to fetch settings', e)
  }
}

const fetchMenuItems = async () => {
  try {
    loading.value = true
    const data = await $fetch('/api/menu')
    menuItems.value = (data as any[]) || []
  } catch (e) {
    console.error('Failed to fetch menu items', e)
  } finally {
    loading.value = false
  }
}

const filteredMenuItems = computed(() => {
  if (!searchQuery.value) return menuItems.value
  const query = searchQuery.value.toLowerCase()
  return menuItems.value.filter((item: any) => 
    item.name.toLowerCase().includes(query) || 
    item.description?.toLowerCase().includes(query)
  )
})

const openModal = (item?: any) => {
  if (item) {
    isEditing.value = true
    editingId.value = item.id
    form.value = { 
      ...item, 
      isPromotion: item.isPromotion || false, 
      promotionalPrice: item.promotionalPrice || '' 
    }
    if (form.value.isPromotion && form.value.price && form.value.promotionalPrice) {
      const price = parseFloat(form.value.price)
      const promo = parseFloat(form.value.promotionalPrice)
      if (price > 0) discountPercentage.value = (((price - promo) / price) * 100).toFixed(0)
    } else {
      discountPercentage.value = ''
    }
  } else {
    isEditing.value = false
    editingId.value = null
    form.value = { 
      name: '', 
      description: '', 
      price: '', 
      category: 'Lanches', 
      imageUrl: '',
      isAvailable: true,
      isPromotion: false,
      promotionalPrice: ''
    }
    discountPercentage.value = ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveItem = async () => {
  saving.value = true
  try {
    const payload = { ...form.value }
    if (!payload.isPromotion || payload.promotionalPrice === '') {
      payload.promotionalPrice = null
    } else {
      // Ensure it's passed as a string/number that DB accepts
      payload.promotionalPrice = String(payload.promotionalPrice)
    }

    if (isEditing.value && editingId.value) {
      await $fetch(`/api/menu/${editingId.value}`, {
        method: 'PUT',
        body: payload
      })
    } else {
      await $fetch('/api/menu', {
        method: 'POST',
        body: payload
      })
    }
    await fetchMenuItems()
    closeModal()
  } catch (e) {
    alert('Erro ao salvar item.')
  } finally {
    saving.value = false
  }
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length) {
    selectedFile.value = target.files[0]
  }
}

const saveSettings = async () => {
  savingSettings.value = true
  try {
    let uploadedUrl = settingsForm.value.menuFileUrl

    if (selectedFile.value) {
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      
      const uploadRes = await $fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      uploadedUrl = uploadRes.url
    }

    await $fetch('/api/menu/settings', {
      method: 'POST',
      body: {
        menuLink: settingsForm.value.menuLink,
        menuFileUrl: uploadedUrl
      }
    })
    
    // Refresh to ensure sync
    await fetchSettings() 
    showSettingsModal.value = false
    selectedFile.value = null // Reset
    alert('Configurações salvas com sucesso!')
  } catch (e) {
    console.error(e)
    alert('Erro ao salvar configurações.')
  } finally {
    savingSettings.value = false
  }
}

const removeFile = async () => {
  if (!settingsForm.value.menuFileUrl) return
  if (!confirm('Tem certeza que deseja remover o arquivo atual? Isso não poderá ser desfeito.')) return

  removingFile.value = true
  try {
    // Extract filename from URL (assumes basic formatting like http://bucket.com/filename)
    const urlParts = settingsForm.value.menuFileUrl.split('/')
    let filename = urlParts[urlParts.length - 1]

    // Specifically for local minio format: http://endpoint:port/bucket_name/filename
    // Or AWS: https://bucket.s3.region.amazonaws.com/filename
    // Either way, the URL ends with the filename.
    
    // Safely check if filename exists
    if (!filename) {
        throw new Error('Filename could not be extracted')
    }

    // Safety check if there are query parameters
    if (filename.includes('?')) {
        filename = filename.split('?')[0]
    }

    // Call S3 delete endpoint
    await $fetch('/api/upload', {
      method: 'DELETE',
      body: { filename }
    })

    // Set local file form to empty string
    settingsForm.value.menuFileUrl = ''
    
    // Save settings implicitly to remove reference from DB immediately
    await $fetch('/api/menu/settings', {
      method: 'POST',
      body: {
        menuLink: settingsForm.value.menuLink,
        menuFileUrl: ''
      }
    })

    // Update form to reflect
    await fetchSettings()
    alert('Arquivo removido com sucesso!')
  } catch (e) {
    console.error('Failed to remove file:', e)
    alert('Erro ao remover o arquivo.')
  } finally {
    removingFile.value = false
  }
}

const toggleAvailability = async (item: any) => {
  // Optimistic update
  const originalStatus = item.isAvailable
  item.isAvailable = !item.isAvailable
  
  try {
    await $fetch(`/api/menu/${item.id}`, {
      method: 'PUT',
      body: { ...item, isAvailable: item.isAvailable }
    })
  } catch (e) {
    // Revert on error
    item.isAvailable = originalStatus
    alert('Erro ao atualizar disponibilidade.')
  }
}

const deleteItem = async (id: string) => {
  if (!confirm('Tem certeza que deseja excluir este item?')) return
  
  try {
    await $fetch(`/api/menu/${id}`, { method: 'DELETE' })
    await fetchMenuItems()
  } catch (e) {
    alert('Erro ao excluir item.')
  }
}
</script>

<template>
  <AppLayout>
    <div class="sm:flex sm:items-center sm:justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Cardápio</h1>
        <p class="mt-2 text-sm text-slate-600">Gerencie os produtos disponíveis para venda.</p>
      </div>
      <div class="mt-4 sm:mt-0 flex gap-3">
         <button @click="showSettingsModal = true" class="inline-flex items-center justify-center rounded-lg bg-white border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
          <LinkIcon class="-ml-0.5 mr-2 h-5 w-5 text-slate-500" />
          Mídia / Link
        </button>
        <button @click="openModal()" class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors">
          <PlusIcon class="-ml-0.5 mr-2 h-5 w-5" />
          Novo Item
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="mb-8 max-w-md">
      <div class="relative rounded-md shadow-sm">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon class="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <input 
          type="text" 
          v-model="searchQuery" 
          class="block w-full rounded-md border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" 
          placeholder="Buscar item pelo nome..."
        >
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div v-for="i in 4" :key="i" class="animate-pulse bg-white rounded-xl h-64 border border-slate-200"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredMenuItems.length === 0" class="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
      <div class="mx-auto h-12 w-12 text-slate-400">
        <ClipboardDocumentListIcon class="h-12 w-12" />
      </div>
      <h3 class="mt-2 text-sm font-semibold text-slate-900">Nenhum item encontrado</h3>
      <p class="mt-1 text-sm text-slate-500">{{ searchQuery ? 'Tente buscar com outro termo.' : 'Comece adicionando novos produtos.' }}</p>
      <div class="mt-6" v-if="!searchQuery">
        <button @click="openModal()" class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
          <PlusIcon class="-ml-0.5 mr-1.5 h-5 w-5" />
          Adicionar Item
        </button>
      </div>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div v-for="item in filteredMenuItems" :key="item.id" class="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
        
        <!-- Image placeholder or actual image -->
        <div class="aspect-h-1 aspect-w-1 w-full overflow-hidden bg-slate-200 xl:aspect-h-8 xl:aspect-w-7 h-48 relative">
          <img 
            v-if="item.imageUrl && item.imageUrl.trim() !== ''" 
            :src="item.imageUrl" 
            :alt="item.name" 
            class="h-full w-full object-cover object-center group-hover:opacity-90 transition-opacity"
            :class="{'opacity-50 grayscale': !item.isAvailable}"
          />
          <div v-else class="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400" :class="{'opacity-50 grayscale': !item.isAvailable}">
            <PhotoIcon class="h-12 w-12" />
          </div>
          <span class="absolute top-2 right-2 inline-flex items-center rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm">
            {{ item.category }}
          </span>
          <div v-if="!item.isAvailable" class="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <span class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Indisponível</span>
          </div>
        </div>

        <div class="p-4 flex-1 flex flex-col">
          <div class="flex justify-between items-start">
            <h3 class="text-lg font-bold text-slate-900 truncate flex-1" :title="item.name" :class="{'text-slate-500': !item.isAvailable}">
              {{ item.name }}
            </h3>
          </div>
          
          <p class="mt-1 text-sm text-slate-500 line-clamp-2 flex-1">{{ item.description || 'Sem descrição.' }}</p>
          
          <div class="mt-4 flex items-center justify-between">
            <div class="flex flex-col">
              <p v-if="item.isPromotion && item.promotionalPrice" class="text-sm text-slate-400 line-through">R$ {{ Number(item.price).toFixed(2) }}</p>
              <p class="text-lg font-bold text-emerald-600" :class="{'text-emerald-600/50': !item.isAvailable}">
                R$ {{ item.isPromotion && item.promotionalPrice ? Number(item.promotionalPrice).toFixed(2) : Number(item.price).toFixed(2) }}
              </p>
            </div>
            <div class="flex gap-2">
              <button @click.stop="toggleAvailability(item)" :class="[item.isAvailable ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-50']" class="p-1.5 rounded-md transition-colors" :title="item.isAvailable ? 'Marcar como Indisponível' : 'Marcar como Disponível'">
                <div v-if="item.isAvailable" class="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center">
                  <div class="h-2.5 w-2.5 rounded-full bg-current"></div>
                </div>
                <div v-else class="h-5 w-5 rounded-full border-2 border-slate-300"></div>
              </button>
              <button @click="openModal(item)" class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Editar">
                <PencilSquareIcon class="h-5 w-5" />
              </button>
              <button @click="deleteItem(item.id)" class="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Excluir">
                <TrashIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal (New/Edit Item) -->
    <div v-if="showModal" class="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"></div>
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
             <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 class="text-xl font-semibold leading-6 text-slate-900" id="modal-title">
                    {{ isEditing ? 'Editar Item' : 'Novo Item' }}
                  </h3>
                   <div class="mt-6 space-y-4">
                    <div>
                      <label for="name" class="block text-sm font-medium leading-6 text-slate-900">Nome</label>
                      <div class="mt-1">
                        <input type="text" name="name" id="name" v-model="form.name" required class="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3">
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label for="price" class="block text-sm font-medium leading-6 text-slate-900">Preço (R$)</label>
                        <div class="relative mt-1 rounded-md shadow-sm">
                          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span class="text-slate-500 sm:text-sm">R$</span>
                          </div>
                          <input type="number" name="price" id="price" v-model="form.price" step="0.01" class="block w-full rounded-md border-0 py-1.5 pl-9 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="0.00">
                        </div>
                      </div>

                      <div>
                        <label for="category" class="block text-sm font-medium leading-6 text-slate-900">Categoria</label>
                        <select id="category" name="category" v-model="form.category" class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                          <option v-for="cat in categories" :key="cat">{{ cat }}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label for="description" class="block text-sm font-medium leading-6 text-slate-900">Descrição</label>
                      <div class="mt-1">
                        <textarea id="description" name="description" rows="3" v-model="form.description" class="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"></textarea>
                      </div>
                    </div>

                    <div>
                      <label for="image_url" class="block text-sm font-medium leading-6 text-slate-900">URL da Imagem</label>
                      <div class="mt-1">
                        <input type="text" name="imageUrl" id="imageUrl" v-model="form.imageUrl" class="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3" placeholder="https://exemplo.com/foto.jpg">
                      </div>
                    </div>

                    <div class="relative flex gap-x-3">
                      <div class="flex h-6 items-center">
                        <input id="isAvailable" name="isAvailable" type="checkbox" v-model="form.isAvailable" class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600">
                      </div>
                      <div class="text-sm leading-6">
                        <label for="isAvailable" class="font-medium text-slate-900">Disponível para venda</label>
                        <p class="text-slate-500">Se desmarcado, este item não aparecerá para os clientes.</p>
                      </div>
                    </div>

                    <div class="relative flex gap-x-3 mt-4">
                      <div class="flex h-6 items-center">
                        <input id="isPromotion" name="isPromotion" type="checkbox" v-model="form.isPromotion" @change="onPromotionChange" class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600">
                      </div>
                      <div class="text-sm leading-6">
                        <label for="isPromotion" class="font-medium text-slate-900">Item em Promoção</label>
                        <p class="text-slate-500">Ative para configurar um preço com desconto.</p>
                      </div>
                    </div>

                    <div v-if="form.isPromotion" class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                      <div>
                        <label for="promotionalPrice" class="block text-sm font-medium leading-6 text-slate-900">Preço Promocional (R$)</label>
                        <div class="relative mt-1 rounded-md shadow-sm">
                          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span class="text-slate-500 sm:text-sm">R$</span>
                          </div>
                          <input type="number" name="promotionalPrice" id="promotionalPrice" v-model="form.promotionalPrice" @input="calculatePercentage" step="0.01" class="block w-full rounded-md border-0 py-1.5 pl-9 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="0.00">
                        </div>
                      </div>

                      <div>
                        <label for="discountPercentage" class="block text-sm font-medium leading-6 text-slate-900">Desconto (%)</label>
                        <div class="relative mt-1 rounded-md shadow-sm">
                          <input type="number" name="discountPercentage" id="discountPercentage" v-model="discountPercentage" @input="calculatePromoPrice" step="1" class="block w-full rounded-md border-0 py-1.5 pl-3 pr-9 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="0">
                          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <span class="text-slate-500 sm:text-sm">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button type="button" @click="saveItem" :disabled="saving" class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50">
                {{ saving ? 'Salvando...' : 'Salvar' }}
              </button>
              <button type="button" @click="closeModal" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal (Settings: Link/Media) -->
    <div v-if="showSettingsModal" class="relative z-50">
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"></div>
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
             <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
               
               <!-- Modal Header -->
               <div class="flex items-center gap-3 mb-6">
                 <div class="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <LinkIcon class="h-6 w-6" />
                 </div>
                 <div>
                    <h3 class="text-xl font-semibold leading-6 text-slate-900">Mídia e Links</h3>
                    <p class="text-sm text-slate-500">Adicione links ou arquivos do seu cardápio digital.</p>
                 </div>
               </div>
               
               <div class="space-y-6">
                 <!-- Link Input -->
                 <div>
                    <label class="block text-sm font-medium text-slate-900 mb-2">Link Externo</label>
                    <div class="relative rounded-md shadow-sm">
                      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <LinkIcon class="h-5 w-5 text-slate-400" />
                      </div>
                      <input 
                        type="url" 
                        v-model="settingsForm.menuLink" 
                        class="block w-full rounded-md border-0 py-2 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" 
                        placeholder="https://meucardapio.com.br"
                      >
                    </div>
                    <p class="mt-1 text-xs text-slate-500">Ex: Link do Instagram, Site ou Notion.</p>
                 </div>

                 <div class="relative">
                    <div class="absolute inset-0 flex items-center" aria-hidden="true">
                      <div class="w-full border-t border-slate-200"></div>
                    </div>
                    <div class="relative flex justify-center">
                      <span class="bg-white px-2 text-sm text-slate-500">OU</span>
                    </div>
                 </div>

                 <!-- File Upload -->
                 <div>
                    <label class="block text-sm font-medium text-slate-900 mb-2">Arquivo do Cardápio (PDF ou Imagem)</label>
                    
                    <div class="flex items-center justify-center w-full">
                        <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div class="flex flex-col items-center justify-center pt-5 pb-6">
                                <ArrowUpTrayIcon class="w-8 h-8 mb-2 text-slate-400" />
                                <p class="mb-1 text-sm text-slate-500"><span class="font-semibold">Clique para enviar</span></p>
                                <p class="text-xs text-slate-500">PDF, PNG ou JPG</p>
                                <p v-if="selectedFile" class="mt-2 text-xs font-semibold text-emerald-600">Selecionado: {{ selectedFile.name }}</p>
                            </div>
                            <input id="dropzone-file" type="file" class="hidden" @change="handleFileChange" accept="image/*,.pdf" />
                        </label>
                    </div>

                    <div v-if="settingsForm.menuFileUrl" class="mt-3 flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div class="flex items-center gap-2 overflow-hidden">
                          <div class="h-8 w-8 bg-indigo-100 rounded flex items-center justify-center text-indigo-700 flex-shrink-0">
                            <TagIcon class="h-4 w-4" />
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-slate-900 truncate">Arquivo Atual</p>
                            <a :href="settingsForm.menuFileUrl" target="_blank" class="text-xs text-indigo-600 hover:text-indigo-500 truncate block">{{ settingsForm.menuFileUrl }}</a>
                          </div>
                        </div>
                        <button @click="removeFile" :disabled="removingFile" class="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50" title="Remover Arquivo">
                          <TrashIcon class="h-5 w-5" />
                        </button>
                    </div>
                 </div>
               </div>

             </div>
             <div class="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
               <button type="button" @click="saveSettings" :disabled="savingSettings" class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50">
                 {{ savingSettings ? 'Salvando...' : 'Salvar Configurações' }}
               </button>
               <button type="button" @click="showSettingsModal = false" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto">Cancelar</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
