<script setup lang="ts">
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
    errorMsg.value = e.data?.statusMessage || e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Registrar Restaurante
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="-space-y-px rounded-md shadow-sm">
          <div>
            <label for="establishment-name" class="sr-only">Nome do Estabelecimento</label>
            <input id="establishment-name" name="establishment" type="text" required v-model="establishmentName" class="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3" placeholder="Nome do Estabelecimento">
          </div>
          <div>
            <label for="email-address" class="sr-only">Email</label>
            <input id="email-address" name="email" type="email" autocomplete="email" required v-model="email" class="relative block w-full border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3" placeholder="Email">
          </div>
          <div>
            <label for="password" class="sr-only">Senha</label>
            <input id="password" name="password" type="password" autocomplete="new-password" required v-model="password" class="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3" placeholder="Senha">
          </div>
        </div>

        <div v-if="errorMsg" class="text-red-500 text-sm text-center">
          {{ errorMsg }}
        </div>

        <div>
          <button type="submit" :disabled="loading" class="group relative flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50">
            <span v-if="loading">Carregando...</span>
            <span v-else>Registrar</span>
          </button>
        </div>
        <div class="text-center text-sm">
          <NuxtLink to="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
            Já tem uma conta? Entre aqui
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>
