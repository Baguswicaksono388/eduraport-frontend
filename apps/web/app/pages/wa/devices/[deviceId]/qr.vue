<script setup lang="ts">
import { 
  ChevronLeft, 
  QrCode, 
  RefreshCw, 
  CheckCircle2, 
  Loader2, 
  Smartphone,
  ShieldCheck,
  AlertCircle
} from 'lucide-vue-next'
import { BaseCard, BaseButton } from '@eduraport/ui'
import { useSchool } from '../../../../composables/useSchool'
import { useWaDevices } from '../../../../composables/useWaDevices'
import { useToast } from '../../../../composables/useToast'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_token')
      if (!token.value) {
        return navigateTo('/login')
      }
    }
  ]
})

const route = useRoute()
const deviceId = computed(() => (route.params.deviceId as string) || '')
const { currentSchoolId } = useSchool()
const schoolId = computed(() => (route.query.schoolId as string) || currentSchoolId.value || '')

const { getDeviceDetail, useQrSse } = useWaDevices()
const toast = useToast()

const deviceName = ref('WhatsApp Device')
const qrCodeText = ref('')
const connectionStatus = ref('provisioning')
const successRedirectTimer = ref(3)

let sseConn: { connect: () => void; disconnect: () => void } | null = null

const loadDeviceName = async () => {
  if (!schoolId.value) return
  try {
    const res = await getDeviceDetail(schoolId.value, deviceId.value)
    if (res.success) {
      deviceName.value = res.data.device.display_name || 'WhatsApp Device'
      connectionStatus.value = res.data.device.status
    }
  } catch (err: any) {
    console.error('Error fetching device detail:', err)
  }
}

const startSseConnection = () => {
  if (sseConn || !schoolId.value) return

  sseConn = useQrSse(
    schoolId.value,
    deviceId.value,
    (qr) => {
      qrCodeText.value = qr
      connectionStatus.value = 'pairing'
    },
    (status) => {
      connectionStatus.value = status
      if (status === 'connected') {
        startRedirectCountdown()
      }
    }
  )

  sseConn.connect()
}

const qrImageUrl = computed(() => {
  if (!qrCodeText.value) return ''
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeText.value)}`
})

let timerInterval: any = null
const startRedirectCountdown = () => {
  toast.success('Koneksi berhasil! Perangkat WhatsApp telah terhubung.')
  timerInterval = setInterval(() => {
    successRedirectTimer.value--
    if (successRedirectTimer.value <= 0) {
      clearInterval(timerInterval)
      navigateTo('/wa/devices')
    }
  }, 1000)
}

onMounted(async () => {
  await loadDeviceName()
  startSseConnection()
})

onUnmounted(() => {
  if (sseConn) {
    sseConn.disconnect()
  }
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<template>
  <div class="max-w-xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
    <!-- Back Header -->
    <div class="space-y-2">
      <NuxtLink 
        to="/wa/devices" 
        class="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-violet-600 transition-colors font-semibold"
      >
        <ChevronLeft :size="14" />
        Kembali ke Daftar Perangkat
      </NuxtLink>
      <h2 class="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
        Pairing Perangkat
      </h2>
      <p class="text-xs text-slate-500 dark:text-zinc-400">
        Menghubungkan: <span class="font-bold text-slate-700 dark:text-zinc-300">{{ deviceName }}</span>
      </p>
    </div>

    <!-- Main Card -->
    <BaseCard class="qr-container-card p-8 flex flex-col items-center justify-center text-center border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
      <!-- SUCCESS SCREEN -->
      <div 
        v-if="connectionStatus === 'connected'" 
        class="space-y-6 py-6 animate-in zoom-in-95 duration-300"
      >
        <div class="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner shadow-emerald-500/20">
          <ShieldCheck :size="42" />
        </div>
        <div class="space-y-2">
          <h3 class="text-xl font-black text-slate-900 dark:text-zinc-100">Pairing Berhasil!</h3>
          <p class="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
            Perangkat Anda sekarang sudah aktif dan siap digunakan untuk pengiriman antrian pesan anti-ban.
          </p>
        </div>
        <div class="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-zinc-800 py-2 px-4 rounded-lg inline-block">
          Mengalihkan ke dashboard dalam {{ successRedirectTimer }} detik...
        </div>
      </div>

      <!-- PAUSED SCREEN -->
      <div 
        v-else-if="connectionStatus === 'paused'" 
        class="space-y-6 py-6 animate-in zoom-in-95 duration-300"
      >
        <div class="w-20 h-20 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle :size="42" />
        </div>
        <div class="space-y-2">
          <h3 class="text-xl font-bold text-slate-900 dark:text-zinc-100">Perangkat Ditangguhkan</h3>
          <p class="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
            Status perangkat ini sedang paused. Silakan aktifkan (Resume) terlebih dahulu di dashboard.
          </p>
        </div>
        <NuxtLink to="/wa/devices">
          <BaseButton variant="primary">Kembali Ke Daftar</BaseButton>
        </NuxtLink>
      </div>

      <!-- BANNED SCREEN -->
      <div 
        v-else-if="connectionStatus === 'banned'" 
        class="space-y-6 py-6 animate-in zoom-in-95 duration-300"
      >
        <div class="w-20 h-20 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle :size="42" />
        </div>
        <div class="space-y-2">
          <h3 class="text-xl font-bold text-slate-900 dark:text-zinc-100">Perangkat Diblokir</h3>
          <p class="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
            Kredensial diblokir (banned) oleh WhatsApp. Anda harus menghapus perangkat ini dan membuat sesi baru dengan nomor lain.
          </p>
        </div>
        <NuxtLink to="/wa/devices">
          <BaseButton variant="danger">Kembali Ke Daftar</BaseButton>
        </NuxtLink>
      </div>

      <!-- PAIRING / SCAN SCREEN -->
      <div v-else class="space-y-6 w-full flex flex-col items-center">
        <!-- Instruction steps -->
        <div class="space-y-3 max-w-md w-full">
          <h3 class="font-extrabold text-slate-900 dark:text-zinc-100 text-lg">Pindai Kode QR</h3>
          <ol class="text-left text-[11px] text-slate-500 dark:text-zinc-400 space-y-1.5 list-decimal pl-5 font-semibold leading-relaxed">
            <li>Buka aplikasi <span class="text-slate-800 dark:text-zinc-200">WhatsApp</span> di handphone Anda.</li>
            <li>Klik menu <span class="text-slate-800 dark:text-zinc-200">Perangkat Tertaut (Linked Devices)</span>.</li>
            <li>Pilih <span class="text-slate-800 dark:text-zinc-200">Tautkan Perangkat (Link a Device)</span>.</li>
            <li>Arahkan kamera ponsel Anda ke kode QR di bawah ini.</li>
          </ol>
        </div>

        <!-- QR Display frame -->
        <div class="relative w-[280px] h-[280px] border-2 border-slate-100 dark:border-zinc-800 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4 overflow-hidden shadow-inner">
          <div 
            v-if="!qrCodeText" 
            class="flex flex-col items-center justify-center space-y-3"
          >
            <Loader2 class="animate-spin text-violet-600" :size="32" />
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider animate-pulse">Menghubungkan Baileys...</span>
          </div>

          <template v-else>
            <img 
              :src="qrImageUrl" 
              alt="Scan WhatsApp QR" 
              class="w-full h-full object-contain rounded-xl"
            />
          </template>
        </div>

        <!-- Keep connection status -->
        <div class="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
          <Loader2 class="animate-spin text-slate-400" :size="12" />
          Status: Menunggu scan dari ponsel Anda...
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.qr-container-card {
  backdrop-filter: blur(8px);
}
</style>
