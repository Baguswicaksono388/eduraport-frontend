<template>
  <div class="h-screen w-full bg-slate-900 text-white flex flex-col font-sans overflow-hidden">
    <!-- Header -->
    <div class="p-4 bg-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center shadow-md z-10 gap-3">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold">EduScanner</h1>
        <div class="flex items-center gap-2 sm:hidden">
          <span class="text-sm px-2 py-1 bg-slate-700 rounded-lg" :class="isOnline ? 'text-green-400' : 'text-red-400'">
            {{ isOnline ? 'Online' : 'Offline' }}
          </span>
          <button @click="router.push('/')" class="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div class="flex flex-1 sm:justify-end items-center gap-3">
        <!-- School Selector (Visible only if not locked to a specific school) -->
        <select v-if="!isSchoolLocked" v-model="currentSchoolId" class="flex-1 sm:flex-none sm:w-64 bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option v-for="school in schools" :key="school.id" :value="school.id">
            {{ school.name }}
          </option>
        </select>

        <div class="hidden sm:flex items-center gap-2">
          <span class="text-sm px-2 py-1 bg-slate-700 rounded-lg" :class="isOnline ? 'text-green-400' : 'text-red-400'">
            {{ isOnline ? 'Online' : 'Offline' }}
          </span>
          <button @click="router.push('/')" class="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-slate-800 border-b border-slate-700 flex px-4">
      <button 
        @click="currentTab = 'scan'"
        class="px-6 py-3 font-semibold text-sm transition-colors border-b-2"
        :class="currentTab === 'scan' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-slate-200'"
      >
        📷 Scan QR
      </button>
      <button 
        @click="currentTab = 'analytics'"
        class="px-6 py-3 font-semibold text-sm transition-colors border-b-2"
        :class="currentTab === 'analytics' ? 'text-violet-400 border-violet-400' : 'text-slate-400 border-transparent hover:text-slate-200'"
      >
        🙂 Analitik Mood
      </button>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 relative bg-black flex flex-col overflow-hidden">
      
      <!-- Scanner Tab -->
      <div v-if="currentTab === 'scan'" class="absolute inset-0 flex items-center justify-center">
      <qrcode-stream
        :track="paintBoundingBox"
        @detect="onDetect"
        @error="onError"
        class="w-full h-full object-cover absolute inset-0"
      >
        <div class="absolute inset-0 border-4 border-blue-500/30 pointer-events-none"></div>
      </qrcode-stream>

      <!-- Overlay Status -->
      <div v-if="scanning" class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20">
        <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-lg font-medium text-white">Memproses QR...</p>
      </div>

      <!-- Result Feedback Overlay -->
      <transition name="fade">
        <div v-if="lastResult" 
             class="absolute inset-x-0 bottom-32 mx-4 p-4 rounded-xl shadow-lg transform transition-all z-30"
             :class="lastResult.success ? 'bg-green-600' : 'bg-red-600'">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-white/20 rounded-full">
              <svg v-if="lastResult.success" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-white">{{ lastResult.success ? 'Berhasil!' : 'Gagal' }}</h3>
              <p class="text-white/90 text-sm">{{ lastResult.message }}</p>
            </div>
          </div>
        </div>
      </transition>
      <!-- Mood Selection Overlay -->
      <transition name="fade">
        <div v-if="pendingMoodScan" class="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center z-40 p-6">
          <h2 class="text-2xl font-bold mb-8 text-white text-center">Bagaimana perasaanmu hari ini?</h2>
          <div class="flex flex-wrap justify-center gap-4 w-full max-w-3xl">
            <button @click="submitMood('senang')" class="flex flex-col items-center p-4 bg-green-500/20 border-2 border-green-500 rounded-2xl hover:bg-green-500/40 transition-colors w-[130px]">
              <span class="text-4xl sm:text-5xl mb-2">😄</span>
              <span class="font-semibold text-green-400 text-sm sm:text-base">Senang</span>
            </button>
            <button @click="submitMood('biasa')" class="flex flex-col items-center p-4 bg-yellow-500/20 border-2 border-yellow-500 rounded-2xl hover:bg-yellow-500/40 transition-colors w-[130px]">
              <span class="text-4xl sm:text-5xl mb-2">😐</span>
              <span class="font-semibold text-yellow-400 text-sm sm:text-base">Biasa</span>
            </button>
            <button @click="submitMood('sedih')" class="flex flex-col items-center p-4 bg-blue-500/20 border-2 border-blue-500 rounded-2xl hover:bg-blue-500/40 transition-colors w-[130px]">
              <span class="text-4xl sm:text-5xl mb-2">😢</span>
              <span class="font-semibold text-blue-400 text-sm sm:text-base">Sedih</span>
            </button>
            <button @click="submitMood('lelah')" class="flex flex-col items-center p-4 bg-orange-500/20 border-2 border-orange-500 rounded-2xl hover:bg-orange-500/40 transition-colors w-[130px]">
              <span class="text-4xl sm:text-5xl mb-2">😴</span>
              <span class="font-semibold text-orange-400 text-sm sm:text-base">Lelah</span>
            </button>
            <button @click="submitMood('kesal')" class="flex flex-col items-center p-4 bg-red-500/20 border-2 border-red-500 rounded-2xl hover:bg-red-500/40 transition-colors w-[130px]">
              <span class="text-4xl sm:text-5xl mb-2">😠</span>
              <span class="font-semibold text-red-400 text-sm sm:text-base">Kesal</span>
            </button>
          </div>
          <p class="mt-8 text-slate-400 text-sm text-center">Menunggu input siswa...</p>
        </div>
      </transition>
    </div> <!-- Close Scanner Tab -->
    
    <!-- Analytics Tab -->
    <MoodAnalytics v-else-if="currentTab === 'analytics'" class="absolute inset-0 z-50 bg-white" />

    </div> <!-- Close Main Content Area -->

    <!-- Controls Bottom -->
    <div v-if="currentTab === 'scan'" class="p-6 bg-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
      <div class="flex justify-between items-center mb-2">
        <p class="text-sm text-slate-400">Arahkan kamera ke Kartu QR Siswa</p>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400">Antrean:</span>
          <span class="px-2 py-1 bg-slate-700 rounded-lg text-sm font-bold">{{ pendingCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import MoodAnalytics from '~/components/scanner/MoodAnalytics.vue'
import { QrcodeStream } from 'vue-qrcode-reader'
import { useNetwork } from '@vueuse/core'
import { db } from '~/utils/db'
import { useApi } from '~/composables/useApi'
import { useSchoolContext } from '~/composables/useSchoolContext'

definePageMeta({
  layout: false
})

const router = useRouter()
const { isOnline } = useNetwork()
const { fetcher } = useApi()
const { selectedSchoolId: currentSchoolId, initContext, isSchoolLocked, schools } = useSchoolContext()
const scanning = ref(false)
const currentTab = ref('scan')
const lastResult = ref(null)
const pendingCount = ref(0)
const pendingMoodScan = ref(null) // Menyimpan payload siswa sementara untuk menunggu input mood
let resultTimeout = null
let syncInterval = null

onMounted(async () => {
  await initContext()
  await updatePendingCount()
  syncInterval = setInterval(syncQueue, 5000)
})

onUnmounted(() => {
  clearTimeout(resultTimeout)
  clearInterval(syncInterval)
})

const updatePendingCount = async () => {
  pendingCount.value = await db.scanQueue.where('status').equals('pending').count()
}

const showResult = (success, message) => {
  lastResult.value = { success, message }
  clearTimeout(resultTimeout)
  resultTimeout = setTimeout(() => {
    lastResult.value = null
  }, 3000)
}

const submitMood = async (mood) => {
  if (!pendingMoodScan.value) return
  
  const payload = pendingMoodScan.value
  pendingMoodScan.value = null // tutup overlay mood
  
  try {
    await db.scanQueue.add({
      payload: payload,
      mood: mood,
      timestamp: Date.now(),
      status: 'pending'
    })
    
    await updatePendingCount()
    showResult(true, `Siswa dan mood tercatat.`)
    
    if (isOnline.value) {
      await syncQueue()
    }
  } catch (err) {
    console.error('[Scanner] submitMood error:', err)
    showResult(false, 'Gagal menyimpan scan.')
  } finally {
    setTimeout(() => { scanning.value = false }, 1000)
  }
}

const onDetect = async (detectedCodes) => {
  console.log('[Scanner] onDetect fired:', detectedCodes)
  if (!detectedCodes) return
  // Handle if library emits single object or array
  const codes = Array.isArray(detectedCodes) ? detectedCodes : [detectedCodes]
  if (codes.length === 0) return
  
  if (scanning.value) {
    console.log('[Scanner] Already scanning, ignoring...')
    return
  }

  const code = codes[0]
  const payload = code.rawValue || code.content // fallbacks
  if (!payload) {
    console.log('[Scanner] No rawValue found in code object')
    return
  }

  console.log('[Scanner] Payload detected:', payload)
  scanning.value = true
  
  try {
    if (!payload.startsWith('ERQR1:')) {
      showResult(false, 'Format QR tidak valid.')
      scanning.value = false
      return
    }

    // Tampilkan overlay mood (scanning tetap true agar kamera pause)
    pendingMoodScan.value = payload
    
  } catch (err) {
    console.error('[Scanner] Error processing scan:', err)
    showResult(false, 'Terjadi kesalahan sistem.')
    scanning.value = false
  }
}

const syncQueue = async () => {
  if (!isOnline.value) return
  if (!currentSchoolId.value) return
  
  const pendingItems = await db.scanQueue.where('status').equals('pending').toArray()
  if (pendingItems.length === 0) return

  try {
    const response = await fetcher(`/school/${currentSchoolId.value}/attendance/scans/bulk`, {
      method: 'POST',
      body: pendingItems
    })

    // If success, remove synced items from queue
    if (response) {
      const idsToDelete = pendingItems.map(item => item.id)
      await db.scanQueue.bulkDelete(idsToDelete)
      await updatePendingCount()
    }
  } catch (error) {
    console.error('Failed to sync scans:', error)
    // Optional: mark as failed to stop retrying immediately if it's a 4xx error
    // For now we just leave them as pending to retry on next interval
  }
}

const onError = (err) => {
  console.error('[QR Error]', err)
  if (err.name === 'NotAllowedError') {
    showResult(false, 'Izin kamera ditolak.')
  } else if (err.name === 'NotFoundError') {
    showResult(false, 'Tidak ada kamera terdeteksi.')
  } else {
    showResult(false, 'Kamera bermasalah.')
  }
}

const paintBoundingBox = (detectedCodes, ctx) => {
  for (const detectedCode of detectedCodes) {
    const { boundingBox: { x, y, width, height } } = detectedCode

    ctx.lineWidth = 4
    ctx.strokeStyle = '#3b82f6'
    ctx.strokeRect(x, y, width, height)
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
