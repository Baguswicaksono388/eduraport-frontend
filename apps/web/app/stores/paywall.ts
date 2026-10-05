import { defineStore } from 'pinia'

export const usePaywallStore = defineStore('paywall', {
  state: () => ({
    isVisible: false,
    title: 'Akses Terkunci',
    message: 'Fitur ini membutuhkan langganan aktif atau kuota Anda telah habis. Silakan upgrade paket Anda untuk melanjutkan.',
    requiredPlan: 'PRO / ADD-ON',
    forceUpgrade: false
  }),
  actions: {
    showPaywall(options?: { title?: string; message?: string; requiredPlan?: string; forceUpgrade?: boolean }) {
      if (options?.title) this.title = options.title
      if (options?.message) this.message = options.message
      if (options?.requiredPlan) this.requiredPlan = options.requiredPlan
      if (options?.forceUpgrade !== undefined) this.forceUpgrade = options.forceUpgrade
      this.isVisible = true
    },
    hidePaywall() {
      this.isVisible = false
    }
  }
})
