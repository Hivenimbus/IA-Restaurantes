export const useAuth = () => {
  const user = useState('user', () => null)
  const router = useRouter()

  const login = async (email, password) => {
    try {
      const { user: userData } = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })
      user.value = userData
      return userData
    } catch (e) {
      throw e
    }
  }

  const register = async (email, password, establishmentName) => {
    try {
      await $fetch('/api/auth/register', {
        method: 'POST',
        body: { email, password, establishment_name: establishmentName }
      })
      // Auto login after register
      await login(email, password)
    } catch (e) {
      throw e
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
      router.push('/login')
    } catch (e) {
      console.error(e)
    }
  }

  const fetchUser = async () => {
    try {
      const { user: userData } = await $fetch('/api/auth/me')
      user.value = userData
    } catch (e) {
      user.value = null
    }
  }

  return {
    user,
    login,
    register,
    logout,
    fetchUser
  }
}

