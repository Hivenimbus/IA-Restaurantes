<script setup lang="ts">
import { 
  HomeIcon, 
  ClipboardDocumentListIcon, 
  ArrowRightOnRectangleIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'

const { user, logout } = useAuth()
const route = useRoute()

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Cardápio', href: '/menu', icon: ClipboardDocumentListIcon },
  { name: 'Clientes', href: '/clients', icon: UserGroupIcon },
]

const handleLogout = async () => {
  await logout()
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <!-- Navigation -->
    <nav class="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <div class="flex-shrink-0 flex items-center gap-2">
              <div class="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                R
              </div>
              <h1 class="text-xl font-bold text-slate-800 hidden sm:block">
                {{ user?.establishment_name || 'Restaurante' }}
              </h1>
            </div>
            
            <div class="hidden sm:ml-8 sm:flex sm:space-x-4">
              <NuxtLink 
                v-for="item in navigation" 
                :key="item.name" 
                :to="item.href"
                :class="[
                  route.path === item.href 
                    ? 'border-indigo-500 text-slate-900' 
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
                  'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200'
                ]"
              >
                <component :is="item.icon" class="h-4 w-4 mr-2" />
                {{ item.name }}
              </NuxtLink>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="hidden sm:flex flex-col items-end mr-2">
              <span class="text-sm font-medium text-slate-700">{{ user?.email }}</span>
            </div>
            <button @click="handleLogout" class="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Sair">
              <ArrowRightOnRectangleIcon class="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      <!-- Mobile menu -->
      <div class="sm:hidden border-t border-slate-200 bg-slate-50">
        <div class="space-y-1 pt-2 pb-3">
          <NuxtLink 
            v-for="item in navigation" 
            :key="item.name" 
            :to="item.href"
            :class="[
              route.path === item.href 
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                : 'border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800',
              'block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center'
            ]"
          >
            <component :is="item.icon" class="h-5 w-5 mr-3" />
            {{ item.name }}
          </NuxtLink>
        </div>
      </div>
    </nav>

    <main class="py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
  </div>
</template>

