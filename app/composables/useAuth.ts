import { authClient } from "../lib/auth-client"

export const useAuth = () => {
  const router = useRouter()

  const { data: sessionData, refresh } = useAsyncData('user-session', async () => {
    try {
      // Use Nuxt's $fetch to avoid HTTP roundtrips during SSR (calls internal nitro handler directly)
      const data = await $fetch('/api/auth/get-session', {
        headers: import.meta.server ? useRequestHeaders(['cookie']) as HeadersInit : undefined
      }).catch(() => null)
      
      return data as any
    } catch (e) {
      return null
    }
  })

  const user = computed(() => sessionData.value?.user ?? null)
  const session = computed(() => sessionData.value?.session ?? null)

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password
      })
      if (error) throw error
      await refresh()
      return data
    } catch (e) {
      throw e
    }
  }

  const register = async (email: string, password: string, establishmentName: string) => {
    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name: establishmentName // Mapping establishment name to user name
      })
      if (error) throw error
      await refresh()
    } catch (e) {
      throw e
    }
  }

  const logout = async () => {
    try {
      await authClient.signOut()
      await refresh()
      router.push('/login')
    } catch (e) {
      console.error(e)
    }
  }

  const fetchUser = async () => {
    await refresh()
  }

  return {
    user,
    session,
    login,
    register,
    logout,
    fetchUser
  }
}
