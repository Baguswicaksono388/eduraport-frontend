<script setup lang="ts">
import { Download, X } from 'lucide-vue-next'
import { BaseButton } from '@eduraport/ui'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const showBanner = ref(false)
const isInstalled = ref(false)

onMounted(() => {
  // Check if already in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone) {
    isInstalled.value = true
    return
  }

  // Check if dismissed recently
  const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_at')
  if (dismissedAt) {
    const hours = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60)
    if (hours < 72) return // Don't prompt again for 3 days
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferredPrompt.value = e as BeforeInstallPromptEvent
    showBanner.value = true
  })

  window.addEventListener('appinstalled', () => {
    isInstalled.value = true
    showBanner.value = false
    deferredPrompt.value = null
  })
})

const handleInstall = async () => {
  if (!deferredPrompt.value) return
  await deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') {
    showBanner.value = false
  }
  deferredPrompt.value = null
}

const dismiss = () => {
  showBanner.value = false
  localStorage.setItem('pwa_prompt_dismissed_at', Date.now().toString())
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out transform"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in transform"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="showBanner && !isInstalled"
      class="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-4 flex flex-col gap-3"
      role="banner"
      aria-label="Install App EduRaport"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
            ER
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-900 dark:text-white leading-tight">Pasang EduRaport</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Akses lebih cepat dan lancar tanpa browser.</p>
          </div>
        </div>
        <button
          type="button"
          @click="dismiss"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          aria-label="Tutup prompt"
        >
          <X :size="16" />
        </button>
      </div>

      <div class="flex items-center gap-2 justify-end pt-1">
        <BaseButton variant="ghost" size="sm" @click="dismiss">
          Nanti
        </BaseButton>
        <BaseButton variant="primary" size="sm" @click="handleInstall">
          <Download :size="14" class="mr-1.5" />
          Install Sekarang
        </BaseButton>
      </div>
    </div>
  </Transition>
</template>
