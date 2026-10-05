import axios from 'axios'
import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { useAuthStore } from '~/stores/auth'
import { usePaywallStore } from '~/stores/paywall'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  
  const api = axios.create({
    baseURL: config.public.apiBase,
  })

  api.interceptors.request.use((request) => {
    // We can only use the store when the app is initialized
    // since we're inside a plugin, we can safely use the store
    const authStore = useAuthStore()
    if (authStore.token) {
      request.headers.Authorization = `Bearer ${authStore.token}`
    }
    return request
  })

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle unauthorized errors, etc.
      if (error.response?.status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        // could redirect to login here
      } else if (
        (error.response?.status === 403 || error.response?.status === 429) &&
        error.response?.data?.code === 'QUOTA_EXCEEDED'
      ) {
        const paywallStore = usePaywallStore()
        paywallStore.showPaywall({
          title: 'Limit Kuota Tercapai',
          message: error.response?.data?.message || 'Anda telah mencapai batas kuota penggunaan. Silakan upgrade paket atau beli add-on untuk melanjutkan.',
          requiredPlan: 'PRO / ADD-ON AI'
        })
      }
      return Promise.reject(error)
    }
  )

  // Provide it globally so we can use $api in components
  return {
    provide: {
      api
    }
  }
})
