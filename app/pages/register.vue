<script setup lang="ts">
import { LockClosedIcon, EnvelopeIcon, BuildingStorefrontIcon } from '@heroicons/vue/24/solid'
const { register, user } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const establishmentName = ref('')
const loading = ref(false)
const errorMsg = ref('')

// If already logged in, redirect
watchEffect(() => {
  if (user.value) {
    router.push('/dashboard')
  }
})

const handleRegister = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    await register(email.value, password.value, establishmentName.value)
    router.push('/dashboard')
  } catch (e: any) {
    errorMsg.value = e.body?.message || e.message || 'Erro ao criar conta.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
      <div class="text-center">
        <div class="mx-auto h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center">
          <BuildingStorefrontIcon class="h-6 w-6 text-indigo-600" />
        </div>
        <h2 class="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">
          Crie sua conta
        </h2>
        <p class="mt-2 text-sm text-slate-500">
          Comece a gerenciar seu restaurante hoje
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-4">
          <div>
            <label for="establishment-name" class="block text-sm font-medium text-slate-700">Nome do Estabelecimento</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BuildingStorefrontIcon class="h-5 w-5 text-slate-400" />
              </div>
              <input id="establishment-name" name="establishment" type="text" required v-model="establishmentName" 
                class="block w-full pl-10 sm:text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-3" 
                placeholder="Ex: Pizzaria do João">
            </div>
          </div>

          <div>
            <label for="email-address" class="block text-sm font-medium text-slate-700">Email</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon class="h-5 w-5 text-slate-400" />
              </div>
              <input id="email-address" name="email" type="email" autocomplete="email" required v-model="email" 
                class="block w-full pl-10 sm:text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-3" 
                placeholder="seu@email.com">
            </div>
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-slate-700">Senha</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon class="h-5 w-5 text-slate-400" />
              </div>
              <input id="password" name="password" type="password" autocomplete="new-password" required v-model="password" 
                class="block w-full pl-10 sm:text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-3" 
                placeholder="••••••••">
            </div>
          </div>
        </div>

        <div v-if="errorMsg" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">{{ errorMsg }}</h3>
            </div>
          </div>
        </div>

        <div>
          <button type="submit" :disabled="loading" 
            class="group w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30">
            <span v-if="loading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Criando conta...
            </span>
            <span v-else>Registrar</span>
          </button>
        </div>
        
        <div class="text-center pt-2">
          <p class="text-sm text-slate-600">
            Já tem uma conta? 
            <NuxtLink to="/login" class="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
              Faça login
            </NuxtLink>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>
