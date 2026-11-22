<script setup lang="ts">
import { useOnline } from '@vueuse/core'
import { WifiOff, Wifi } from 'lucide-vue-next'

const isOnline = useOnline()
const showBackOnline = ref(false)

watch(isOnline, (online, wasOnline) => {
  if (online && !wasOnline) {
    showBackOnline.value = true
    setTimeout(() => {
      showBackOnline.value = false
    }, 3500)
  }
})
</script>

<template>
  <div>
    <!-- Offline Alert -->
    <Transition
      enter-active-class="transition duration-300 ease-out transform"
      enter-from-class="-translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in transform"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-full opacity-0"
    >
      <aside
        v-if="!isOnline"
        role="status"
        aria-live="polite"
        class="fixed top-0 inset-x-0 z-50 bg-amber-600 text-white px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between gap-3 safe-top"
      >
        <div class="flex items-center gap-2 max-w-xl mx-auto w-full">
          <WifiOff :size="16" class="shrink-0 animate-pulse" />
          <span>Mode Offline: Anda tetap dapat melihat data yang sudah dimuat. Draf tersimpan di perangkat.</span>
        </div>
      </aside>
    </Transition>

    <!-- Restored Online Toast -->
    <Transition
      enter-active-class="transition duration-300 ease-out transform"
      enter-from-class="-translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in transform"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-full opacity-0"
    >
      <aside
        v-if="showBackOnline"
        role="status"
        aria-live="polite"
        class="fixed top-0 inset-x-0 z-50 bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between gap-3 safe-top"
      >
        <div class="flex items-center gap-2 max-w-xl mx-auto w-full">
          <Wifi :size="16" class="shrink-0" />
          <span>Koneksi kembali terhubung. Data siap disinkronkan.</span>
        </div>
      </aside>
    </Transition>
  </div>
</template>
