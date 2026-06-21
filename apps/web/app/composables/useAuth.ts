import { useApi } from './useApi'

export const useAuth = () => {
  const { fetcher } = useApi()
  const token = useCookie('auth_token', { maxAge: 60 * 60 * 24 * 7 }) // 1 week
  const refreshToken = useCookie('refresh_token', { maxAge: 60 * 60 * 24 * 30 }) // 30 days
  const user = useState<any>('user', () => null)
  const loading = useState('auth_loading', () => false)

  const login = async (credentials: any) => {
    loading.value = true
    try {
      const response: any = await fetcher('/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      if (response.success) {
        token.value = response.data.accessToken
        refreshToken.value = response.data.refreshToken
        user.value = response.data.user
        
        // Ensure cookie state is propagated before making authenticated requests
        await new Promise(resolve => setTimeout(resolve, 50))
        
        return { success: true }
      }

      return { success: false, error: response.message || 'Login gagal' }
    } catch (error: any) {
      return { success: false, error: error.data?.error?.message || 'Login gagal' }
    } finally {
      loading.value = false
    }
  }

  const register = async (data: any) => {
    loading.value = true
    try {
      const response: any = await fetcher('/auth/register', {
        method: 'POST',
        body: data
      })
      
      if (response.success) {
        return { success: true }
      }

      return { success: false, error: response.message || 'Registrasi gagal' }
    } catch (error: any) {
      return { success: false, error: error.data?.error?.message || 'Registrasi gagal' }
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    token.value = null
    refreshToken.value = null
    user.value = null
    navigateTo('/login')
  }

  const fetchUser = async () => {
    if (!token.value) return
    try {
      const response: any = await fetcher('/auth/me')
      if (response.success) {
        user.value = response.data
      }
    } catch (error) {
      token.value = null
      refreshToken.value = null
      user.value = null
    }
  }

  const changePassword = async (data: any) => {
    try {
      const response: any = await fetcher('/auth/change-password', {
        method: 'POST',
        body: data
      })
      if (response.success) {
        return { success: true }
      }
      return { success: false, error: response.message || 'Gagal mengubah password' }
    } catch (error: any) {
      return { success: false, error: error.data?.message || error.data?.error?.message || 'Gagal mengubah password' }
    }
  }

  return {
    user,
    token,
    loading,
    login,
    register,
    logout,
    fetchUser,
    changePassword,
    isAuthenticated: computed(() => !!token.value)
  }
}

