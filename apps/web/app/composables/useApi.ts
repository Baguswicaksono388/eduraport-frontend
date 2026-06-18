export const useApi = () => {
  const config = useRuntimeConfig()
  const token = useCookie('auth_token', { maxAge: 60 * 60 * 24 * 7 })
  const refreshToken = useCookie('refresh_token', { maxAge: 60 * 60 * 24 * 30 })

  const fetcher = async (url: string, options: any = {}) => {
    const headers = {
      ...options.headers,
    }

    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }

    try {
      const response = await $fetch(url, {
        baseURL: config.public.apiBase,
        ...options,
        headers,
      })
      return response
    } catch (error: any) {
      // Handle 401 and attempt refresh
      if (error.response?.status === 401 && refreshToken.value && !options._retry) {
        try {
          const refreshResponse: any = await $fetch('/auth/refresh', {
            baseURL: config.public.apiBase,
            method: 'POST',
            body: { refresh_token: refreshToken.value }
          })

          if (refreshResponse.success) {
            token.value = refreshResponse.data.access_token
            refreshToken.value = refreshResponse.data.refresh_token

            // Retry original request with new token
            return await fetcher(url, { ...options, _retry: true })
          }
        } catch (refreshError) {
          console.error('Session expired. Please login again.')
        }
      }

      // If refresh fails or no refresh token, cleanup and redirect
      if (error.response?.status === 401) {
        token.value = null
        refreshToken.value = null
        if (import.meta.client) {
          window.location.href = '/login'
        }
      }
      
      // Extract custom backend error message if available
      if (error.data) {
        const customMessage = error.data.message || error.data.error?.message;
        if (customMessage) {
          error.message = customMessage;
        }
      }

      throw error
    }
  }

  return {
    fetcher
  }
}
