import { ref, computed } from 'vue'

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Global reactive state shared across all components and pages
const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const isInstalled = ref(false)
const showPrompt = ref(false)
const isIos = ref(false)
const isMobile = ref(false)
const showInstructions = ref(false)
const isInitialized = ref(false)

export const usePwaInstall = () => {
  const initPwa = () => {
    if (import.meta.server || isInitialized.value) return
    isInitialized.value = true

    // Check if already running in standalone PWA mode
    const isStandalone = 
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof window !== 'undefined' && (window.navigator as unknown as { standalone?: boolean }).standalone === true)

    if (isStandalone) {
      isInstalled.value = true
      return
    }

    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase()
      isIos.value = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream
      isMobile.value = window.innerWidth < 768 || /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)

      // Listen for browser install prompt (Chromium / Android)
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault()
        deferredPrompt.value = e as BeforeInstallPromptEvent
        // Auto show if on mobile and not recently dismissed
        checkAutoPrompt()
      })

      // Listen for app installed event
      window.addEventListener('appinstalled', () => {
        isInstalled.value = true
        showPrompt.value = false
        deferredPrompt.value = null
      })

      // Check auto-prompt for mobile devices
      if (isMobile.value) {
        checkAutoPrompt()
      }
    }
  }

  const checkAutoPrompt = () => {
    if (isInstalled.value || showPrompt.value) return
    try {
      const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_at')
      if (dismissedAt) {
        const hours = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60)
        if (hours < 24) return // Don't show again for 24h
      }
    } catch {
      // Ignore localStorage security errors
    }

    // Delay slightly for smooth page entry
    setTimeout(() => {
      if (!isInstalled.value) {
        showPrompt.value = true
      }
    }, 1200)
  }

  const installApp = async () => {
    if (deferredPrompt.value) {
      try {
        await deferredPrompt.value.prompt()
        const choice = await deferredPrompt.value.userChoice
        if (choice.outcome === 'accepted') {
          showPrompt.value = false
          isInstalled.value = true
        }
        deferredPrompt.value = null
      } catch (err) {
        console.warn('PWA install prompt error:', err)
        showInstructions.value = true
      }
    } else {
      // Fallback instruction for iOS Safari or Chrome when prompt not available
      showInstructions.value = true
    }
  }

  const dismissPrompt = () => {
    showPrompt.value = false
    showInstructions.value = false
    try {
      localStorage.setItem('pwa_prompt_dismissed_at', Date.now().toString())
    } catch {
      // Ignore
    }
  }

  const openPrompt = () => {
    showPrompt.value = true
    showInstructions.value = false
  }

  return {
    deferredPrompt,
    isInstalled,
    showPrompt,
    isIos,
    isMobile,
    showInstructions,
    canInstall: computed(() => !isInstalled.value),
    initPwa,
    installApp,
    dismissPrompt,
    openPrompt
  }
}
