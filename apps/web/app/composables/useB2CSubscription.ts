import { ref } from 'vue'
import { useApi } from './useApi'

export const useB2CSubscription = () => {
  const { fetcher } = useApi()
  const subscription = useState<any>('b2c_subscription', () => null)
  const loading = useState<boolean>('b2c_subscription_loading', () => false)

  const fetchSubscription = async () => {
    loading.value = true
    try {
      const response: any = await fetcher('/b2c/subscription')
      if (response.success) {
        subscription.value = response.data
      }
    } catch (error) {
      console.error('Failed to fetch B2C subscription:', error)
    } finally {
      loading.value = false
    }
  }

  const upgradeSubscription = async (data: any) => {
    loading.value = true
    try {
      const response: any = await fetcher('/b2c/subscription/upgrade', {
        method: 'POST',
        body: data
      })
      if (response.success) {
        await fetchSubscription()
        return { success: true }
      }
      return { success: false, error: response.message || 'Gagal upgrade' }
    } catch (error: any) {
      return { success: false, error: error.data?.error?.message || 'Gagal upgrade' }
    } finally {
      loading.value = false
    }
  }

  return {
    subscription,
    loading,
    fetchSubscription,
    upgradeSubscription
  }
}
