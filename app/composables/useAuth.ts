import { authClient } from "../lib/auth-client"

export const useAuth = () => {
  const router = useRouter()

  const { data: sessionData, refresh } = useAsyncData('user-session', async () => {
    try {
      const { data } = await authClient.getSession(
        import.meta.server ? {
          fetchOptions: {
            headers: useRequestHeaders(['cookie']) as HeadersInit,
            baseURL: useRequestURL().origin
          }
        } : undefined
      )
      return data
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
