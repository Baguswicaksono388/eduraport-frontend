<template>
  <div class="h-screen w-full bg-slate-950 text-white flex flex-col font-sans overflow-hidden select-none">
    <!-- Header Toolbar -->
    <header class="p-3 sm:p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center shadow-lg z-20 gap-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/20 font-black text-white text-lg">
            ⚡
          </div>
          <div>
            <h1 class="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              EduScanner <span class="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">Gerbang</span>
            </h1>
            <p class="text-[11px] text-slate-400 font-medium">Presensi Real-time & Mood Siswa</p>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:hidden">
          <span class="text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 border"
                :class="isOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'">
            <span class="w-1.5 h-1.5 rounded-full" :class="isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'"></span>
            {{ isOnline ? 'Online' : 'Offline' }}
          </span>
          <button @click="router.push('/')" class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div class="flex flex-wrap sm:flex-nowrap justify-between sm:justify-end items-center gap-2.5">
        <!-- School Selector -->
        <select v-if="!isSchoolLocked" v-model="currentSchoolId" class="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500">
          <option v-for="school in schools" :key="school.id" :value="school.id">
            {{ school.name }}
          </option>
        </select>

        <!-- UF-2: Button Cari Nama Siswa (Kartu Tertinggal) -->
        <button 
          @click="openManualSearchModal" 
          class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          title="Presensi manual jika siswa lupa membawa kartu QR"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Cari Nama (Kartu Tertinggal)</span>
        </button>

        <!-- Live Feed Drawer Toggle Button -->
        <button 
          @click="showFeedDrawer = !showFeedDrawer" 
          class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors"
        >
          <span>📋 Riwayat ({{ todaySummary.total_present }})</span>
        </button>

        <!-- Status Badge Desktop -->
        <div class="hidden sm:flex items-center gap-2">
          <span class="text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 border"
                :class="isOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'">
            <span class="w-1.5 h-1.5 rounded-full" :class="isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'"></span>
            {{ isOnline ? 'Online' : 'Offline' }}
          </span>
          <button @click="router.push('/')" class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700" title="Keluar">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Top Navigation Tabs -->
    <nav class="bg-slate-900 border-b border-slate-800 flex px-4">
      <button 
        @click="currentTab = 'scan'"
        class="px-5 py-2.5 font-bold text-xs sm:text-sm transition-colors border-b-2 flex items-center gap-2"
        :class="currentTab === 'scan' ? 'text-violet-400 border-violet-400 bg-violet-500/5' : 'text-slate-400 border-transparent hover:text-slate-200'"
      >
        <span>📷 Kamera Gerbang</span>
      </button>
      <button 
        @click="currentTab = 'analytics'"
        class="px-5 py-2.5 font-bold text-xs sm:text-sm transition-colors border-b-2 flex items-center gap-2"
        :class="currentTab === 'analytics' ? 'text-indigo-400 border-indigo-400 bg-indigo-500/5' : 'text-slate-400 border-transparent hover:text-slate-200'"
      >
        <span>🙂 Analitik Mood & Care Alerts</span>
      </button>
    </nav>

    <!-- Main Content Area -->
    <main class="flex-1 relative bg-black flex flex-col overflow-hidden">
      
      <!-- SCANNER TAB -->
      <div v-if="currentTab === 'scan'" class="absolute inset-0 flex items-center justify-center">
        <!-- Live QR Camera Stream -->
        <qrcode-stream
          :constraints="cameraConstraints"
          :paused="scanning || !!pendingMoodScan"
          :track="paintBoundingBox"
          @detect="onDetect"
          @error="onError"
          class="w-full h-full object-cover absolute inset-0"
        >
          <!-- Viewfinder Target Reticle -->
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="w-64 h-64 sm:w-80 sm:h-80 border-2 border-dashed border-violet-400/60 rounded-3xl relative flex items-center justify-center">
              <div class="absolute -top-3 px-3 py-1 bg-slate-900/90 text-[10px] font-bold text-violet-300 rounded-full border border-violet-500/30 uppercase tracking-widest">
                Arahkan Kartu QR Ke Sini
              </div>
              <div class="w-12 h-1 bg-violet-400/70 absolute top-0 left-0 rounded-tl-3xl"></div>
              <div class="w-1 h-12 bg-violet-400/70 absolute top-0 left-0 rounded-tl-3xl"></div>
              <div class="w-12 h-1 bg-violet-400/70 absolute top-0 right-0 rounded-tr-3xl"></div>
              <div class="w-1 h-12 bg-violet-400/70 absolute top-0 right-0 rounded-tr-3xl"></div>
              <div class="w-12 h-1 bg-violet-400/70 absolute bottom-0 left-0 rounded-bl-3xl"></div>
              <div class="w-1 h-12 bg-violet-400/70 absolute bottom-0 left-0 rounded-bl-3xl"></div>
              <div class="w-12 h-1 bg-violet-400/70 absolute bottom-0 right-0 rounded-br-3xl"></div>
              <div class="w-1 h-12 bg-violet-400/70 absolute bottom-0 right-0 rounded-br-3xl"></div>
            </div>
          </div>
        </qrcode-stream>

        <!-- Processing Indicator Overlay -->
        <div v-if="scanning && !pendingMoodScan" class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center z-20">
          <div class="w-14 h-14 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p class="text-sm font-bold text-slate-200 tracking-wide">Membaca Kartu Siswa...</p>
        </div>

        <!-- UF-1: Rich Arrival Feedback Card (Green / Yellow / Blue) -->
        <transition name="slide-down">
          <div 
            v-if="arrivalFeedback" 
            class="absolute top-4 inset-x-4 max-w-lg mx-auto z-40 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200"
            :class="getFeedbackCardClass(arrivalFeedback.check_in_status)"
          >
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner"
                   :class="getFeedbackIconBg(arrivalFeedback.check_in_status)">
                {{ arrivalFeedback.check_in_status === 'terlambat' ? '⏰' : '✅' }}
              </div>
              <div>
                <h3 class="font-black text-base text-white tracking-tight leading-snug">
                  {{ arrivalFeedback.student_name }}
                </h3>
                <p class="text-xs text-white/80 font-medium">
                  {{ arrivalFeedback.class_name || 'Siswa' }} <span v-if="arrivalFeedback.nis">· NIS: {{ arrivalFeedback.nis }}</span>
                </p>
                <div class="flex items-center gap-2 mt-1.5">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border"
                        :class="getFeedbackPillClass(arrivalFeedback.check_in_status)">
                    {{ getFeedbackStatusLabel(arrivalFeedback.check_in_status, arrivalFeedback.late_minutes) }}
                  </span>
                  <span class="text-[11px] text-white/70 font-semibold">
                    {{ arrivalFeedback.time_str }}
                  </span>
                </div>
              </div>
            </div>

            <button @click="arrivalFeedback = null" class="text-white/60 hover:text-white p-1">
              ✕
            </button>
          </div>
        </transition>

        <!-- General Alert Toast -->
        <transition name="fade">
          <div v-if="lastResult" 
               class="absolute inset-x-0 bottom-24 mx-4 max-w-md mx-auto p-3.5 rounded-2xl shadow-2xl backdrop-blur-md border transform transition-all z-30 flex items-center gap-3"
               :class="lastResult.success ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-100' : 'bg-rose-900/90 border-rose-500/40 text-rose-100'">
            <div class="p-1.5 rounded-xl" :class="lastResult.success ? 'bg-emerald-500/20' : 'bg-rose-500/20'">
              <span class="text-lg">{{ lastResult.success ? '✓' : '✕' }}</span>
            </div>
            <div class="flex-1 text-xs font-semibold leading-relaxed">
              {{ lastResult.message }}
            </div>
          </div>
        </transition>

        <!-- UF-1: Mood Selection Dialog (With Prominent Skip Button & 5s Auto-Dismiss) -->
        <transition name="fade">
          <div v-if="pendingMoodScan" class="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-6 animate-in fade-in duration-200">
            <div class="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
              
              <!-- Student Header in Dialog -->
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-lg mb-3">
                {{ pendingMoodScan.student_name ? pendingMoodScan.student_name[0] : '🎒' }}
              </div>
              <h2 class="text-lg sm:text-xl font-black text-white tracking-tight">
                {{ pendingMoodScan.student_name || 'Selamat Datang!' }}
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ pendingMoodScan.class_name ? 'Kelas ' + pendingMoodScan.class_name : 'Presensi Gerbang' }}
              </p>

              <div class="my-6 w-full">
                <p class="text-sm font-bold text-slate-300 mb-4">Bagaimana perasaanmu pagi ini?</p>
                <div class="grid grid-cols-5 gap-2 sm:gap-3 w-full">
                  <button 
                    v-for="m in moodOptions" 
                    :key="m.value" 
                    @click="submitMood(m.value)" 
                    class="flex flex-col items-center p-2.5 sm:p-3 rounded-2xl border transition-all transform active:scale-90 hover:-translate-y-1"
                    :class="m.class"
                  >
                    <span class="text-3xl sm:text-4xl mb-1.5">{{ m.emoji }}</span>
                    <span class="text-[11px] font-black">{{ m.label }}</span>
                  </button>
                </div>
              </div>

              <!-- Fast-Path Skip Button (UF-1: Prevent Queue Bottleneck) -->
              <div class="w-full flex flex-col items-center gap-3">
                <button 
                  @click="skipMood" 
                  class="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <span>⏩ Lewati (Lanjut Antrean)</span>
                </button>

                <!-- 5s Auto-Dismiss Countdown -->
                <p class="text-[11px] text-slate-400 font-medium">
                  Otomatis ditutup dalam <span class="text-violet-400 font-black">{{ moodCountdown }}</span> detik...
                </p>
              </div>

            </div>
          </div>
        </transition>

        <!-- Live Daily Counters Bar Bottom -->
        <div class="absolute bottom-4 inset-x-4 max-w-xl mx-auto z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-xl flex items-center justify-between text-xs">
          <div class="flex items-center gap-3">
            <div class="flex flex-col">
              <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Hadir Hari Ini</span>
              <span class="text-base font-black text-white">{{ todaySummary.total_present }} <span class="text-xs text-slate-400 font-normal">/ {{ todaySummary.total_students }}</span></span>
            </div>
            <div class="h-7 w-px bg-slate-800"></div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                Tepat: {{ todaySummary.on_time }}
              </span>
              <span class="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[10px]">
                Telat: {{ todaySummary.late }}
              </span>
              <span v-if="todaySummary.manual_search > 0" class="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[10px]" title="Input manual">
                Manual: {{ todaySummary.manual_search }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-slate-400 uppercase font-bold">Antrean:</span>
            <span class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-black" :class="pendingCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-300'">
              {{ pendingCount }}
            </span>
          </div>
        </div>

      </div>

      <!-- ANALYTICS TAB -->
      <MoodAnalytics v-else-if="currentTab === 'analytics'" class="absolute inset-0 z-10 bg-slate-50 text-slate-900" />

      <!-- UF-2: Manual Search Modal (Kartu Tertinggal) -->
      <div v-if="showManualSearch" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 flex flex-col max-h-[85vh]">
          
          <div class="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 class="text-base font-black text-white flex items-center gap-2">
                🔍 Presensi Manual (Kartu Tertinggal)
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">Pilih nama siswa yang tidak membawa kartu QR</p>
            </div>
            <button @click="showManualSearch = false" class="p-1.5 text-slate-400 hover:text-white rounded-lg">
              ✕
            </button>
          </div>

          <!-- Search Input -->
          <div class="mt-4 relative">
            <input 
              v-model="manualSearchKeyword"
              type="text" 
              placeholder="Ketik nama atau NIS siswa..." 
              class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              autofocus
            />
            <span v-if="manualSearchKeyword" @click="manualSearchKeyword = ''" class="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer text-xs">
              ✕
            </span>
          </div>

          <!-- Filtered Student List -->
          <div class="mt-4 flex-1 overflow-y-auto divide-y divide-slate-800 pr-1">
            <div 
              v-for="s in filteredCachedStudents" 
              :key="s.student_id" 
              @click="selectManualStudent(s)"
              class="py-3 px-3 rounded-xl hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center justify-between group"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center font-bold text-sm">
                  {{ s.student_name[0] }}
                </div>
                <div>
                  <p class="text-xs sm:text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                    {{ s.student_name }}
                  </p>
                  <p class="text-[11px] text-slate-400">
                    {{ s.class_name || 'Tanpa Kelas' }} <span v-if="s.nis">· NIS: {{ s.nis }}</span>
                  </p>
                </div>
              </div>

              <span class="text-xs px-2.5 py-1 bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-lg font-bold group-hover:bg-violet-600 group-hover:text-white transition-all">
                Pilih Siswa →
              </span>
            </div>

            <div v-if="filteredCachedStudents.length === 0" class="py-12 text-center text-xs text-slate-400">
              Tidak ada siswa yang cocok dengan pencarian "{{ manualSearchKeyword }}".
            </div>
          </div>

          <div class="pt-4 border-t border-slate-800 mt-2 flex justify-between items-center text-[11px] text-slate-400">
            <span>Tercatat {{ cachedStudents.length }} siswa dalam memori offline.</span>
            <button @click="showManualSearch = false" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold">
              Tutup
            </button>
          </div>

        </div>
      </div>

      <!-- Live Recent Scans Drawer -->
      <div v-if="showFeedDrawer" class="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-50 p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 class="text-sm font-black text-white flex items-center gap-2">
              📋 30 Scan Terakhir Hari Ini
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Live feed presensi gerbang</p>
          </div>
          <button @click="showFeedDrawer = false" class="p-1.5 text-slate-400 hover:text-white rounded-lg">
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-y-auto divide-y divide-slate-800/80 my-4 pr-1">
          <div v-for="scan in recentScans" :key="scan.student_id" class="py-2.5 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">{{ MOOD_EMOJIS[scan.mood] || '🎒' }}</span>
              <div>
                <p class="font-bold text-white text-xs truncate max-w-[150px]">{{ scan.student_name }}</p>
                <p class="text-[10px] text-slate-400">{{ scan.class_name || '-' }} · {{ formatTimeShort(scan.check_in_time) }}</p>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold border"
                  :class="getFeedbackPillClass(scan.check_in_status)">
              {{ scan.check_in_status }}
            </span>
          </div>

          <div v-if="recentScans.length === 0" class="py-16 text-center text-xs text-slate-400">
            Belum ada scan masuk hari ini.
          </div>
        </div>

        <button @click="fetchTodaySummary" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700">
          🔄 Muat Ulang Live Feed
        </button>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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

// Scanner State
const scanning = ref(false)
const currentTab = ref('scan')
const cameraConstraints = ref({ facingMode: 'environment' })
const cameraError = ref(null)
const lastResult = ref(null)
const pendingCount = ref(0)
const arrivalFeedback = ref(null)
const pendingMoodScan = ref(null)
const moodCountdown = ref(5)
let countdownTimer = null
let resultTimeout = null
let syncInterval = null
let feedInterval = null

// Manual Search State (UF-2)
const showManualSearch = ref(false)
const manualSearchKeyword = ref('')
const cachedStudents = ref([])

// Live Today Summary & Recent Scans
const showFeedDrawer = ref(false)
const todaySummary = ref({
  total_students: 0,
  total_present: 0,
  on_time: 0,
  late: 0,
  early: 0,
  manual_search: 0
})
const recentScans = ref([])

// Time Rules Cache
const timeRules = ref([])

const MOOD_EMOJIS = {
  senang: '😄',
  biasa: '😐',
  sedih: '😢',
  lelah: '😴',
  kesal: '😠'
}

const moodOptions = [
  { value: 'senang', label: 'Senang', emoji: '😄', class: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20' },
  { value: 'biasa', label: 'Biasa', emoji: '😐', class: 'bg-slate-500/10 border-slate-500/30 text-slate-300 hover:bg-slate-500/20' },
  { value: 'sedih', label: 'Sedih', emoji: '😢', class: 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20' },
  { value: 'lelah', label: 'Lelah', emoji: '😴', class: 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20' },
  { value: 'kesal', label: 'Kesal', emoji: '😠', class: 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20' }
]

// Web Audio API Sound Synthesizer (Zero asset dependency)
const playAudioFeedback = (type) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'success') {
      // Pleasant high-pitched "bip"
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } else if (type === 'warning') {
      // Duplicate warning tone
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(520, ctx.currentTime)
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16)
      osc.start()
      osc.stop(ctx.currentTime + 0.16)
    } else {
      // Rejection / Error tone
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(320, ctx.currentTime)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18)
      osc.start()
      osc.stop(ctx.currentTime + 0.18)
    }
  } catch (e) {
    console.warn('Audio feedback failed or not permitted by browser autoplay policy', e)
  }
}

// Generate UUID v4
const generateScanId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// Lifecycle Hooks
onMounted(async () => {
  await initContext()
  await updatePendingCount()
  await loadBootstrapData()
  await fetchTodaySummary()

  // Periodic background tasks
  syncInterval = setInterval(syncQueue, 5000)
  feedInterval = setInterval(fetchTodaySummary, 15000)
})

onUnmounted(() => {
  clearTimeout(resultTimeout)
  clearInterval(syncInterval)
  clearInterval(feedInterval)
  clearInterval(countdownTimer)
})

watch(currentSchoolId, async (newVal) => {
  if (newVal) {
    await loadBootstrapData()
    await fetchTodaySummary()
  }
})

// Bootstrap Offline Student Cache & Settings
const loadBootstrapData = async () => {
  if (!currentSchoolId.value) return
  try {
    const res = await fetcher(`/school/${currentSchoolId.value}/attendance/scanner/bootstrap`)
    if (res && res.data) {
      timeRules.value = res.data.time_rules || []
      const students = res.data.students || []
      
      // Cache into Dexie studentsCache
      if (students.length > 0) {
        await db.studentsCache.clear()
        await db.studentsCache.bulkPut(students)
      }
      cachedStudents.value = students
    }
  } catch (err) {
    console.warn('Failed to load online bootstrap data, loading from local Dexie cache...', err)
    cachedStudents.value = await db.studentsCache.toArray()
  }
}

// Today Live Summary & Recent Feed
const fetchTodaySummary = async () => {
  if (!currentSchoolId.value || !isOnline.value) return
  try {
    const res = await fetcher(`/school/${currentSchoolId.value}/attendance/scanner/today`)
    if (res && res.data) {
      todaySummary.value = res.data.summary || todaySummary.value
      recentScans.value = res.data.recent_scans || []
    }
  } catch (err) {
    console.warn('Failed to load today scanner summary:', err)
  }
}

const updatePendingCount = async () => {
  pendingCount.value = await db.scanQueue.where('status').equals('pending').count()
}

const showResult = (success, message) => {
  lastResult.value = { success, message }
  clearTimeout(resultTimeout)
  resultTimeout = setTimeout(() => {
    lastResult.value = null
  }, 3500)
}

// Calculate status on client for instantaneous visual feedback
const evaluateScanStatus = (scanDate) => {
  let appliedRule = timeRules.value.find((r) => r.scope_type === 'school')
  let checkInStatus = 'tepat'
  let lateMinutes = 0

  if (appliedRule && appliedRule.on_time_until) {
    const scanH = scanDate.getHours()
    const scanM = scanDate.getMinutes()
    const [onH, onM] = appliedRule.on_time_until.split(':').map(Number)
    const tolerance = appliedRule.late_tolerance_min || 0
    const diffMin = (scanH * 60 + scanM) - (onH * 60 + onM)

    if (appliedRule.check_in_start) {
      const [startH, startM] = appliedRule.check_in_start.split(':').map(Number)
      if ((scanH * 60 + scanM) < (startH * 60 + startM)) {
        checkInStatus = 'awal'
      } else if (diffMin > tolerance) {
        checkInStatus = 'terlambat'
        lateMinutes = diffMin
      }
    } else if (diffMin > tolerance) {
      checkInStatus = 'terlambat'
      lateMinutes = diffMin
    }
  }

  return { checkInStatus, lateMinutes }
}

// UF-1: Handle QR Detection
const onDetect = async (detectedCodes) => {
  if (!detectedCodes) return
  const codes = Array.isArray(detectedCodes) ? detectedCodes : [detectedCodes]
  if (codes.length === 0) return
  
  if (scanning.value || pendingMoodScan.value) {
    return
  }

  const code = codes[0]
  const payload = code.rawValue || code.content
  if (!payload) return

  scanning.value = true
  
  try {
    if (!payload.startsWith('ERQR1:')) {
      playAudioFeedback('error')
      showResult(false, 'Format QR tidak valid.')
      scanning.value = false
      return
    }

    const rawToken = payload.substring(6)
    // Find student in local cache
    let student = await db.studentsCache.where('token').equals(rawToken).first()
    if (!student && cachedStudents.value.length > 0) {
      student = cachedStudents.value.find((s) => s.token === rawToken)
    }

    // UF-6 & AC-1: Revoked or unregistered token must be rejected immediately
    if (!student) {
      playAudioFeedback('error')
      showResult(false, 'Kartu tidak berlaku atau belum terdaftar.')
      scanning.value = false
      return
    }

    const now = new Date()
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    const { checkInStatus, lateMinutes } = evaluateScanStatus(now)

    // Play pleasant bip
    playAudioFeedback('success')

    // Display rich arrival feedback
    arrivalFeedback.value = {
      student_name: student ? student.student_name : 'Siswa Terdaftar',
      class_name: student ? student.class_name : '',
      nis: student ? student.nis : '',
      check_in_status: checkInStatus,
      late_minutes: lateMinutes,
      time_str: timeStr
    }

    // Open Mood dialog with fast-path 5-second countdown
    pendingMoodScan.value = {
      client_scan_id: generateScanId(),
      payload: payload,
      student_id: student?.student_id,
      student_name: student?.student_name,
      class_name: student?.class_name,
      method: 'qr',
      timestamp: now.getTime()
    }

    startMoodCountdown()
  } catch (err) {
    console.error('[Scanner] Error processing scan:', err)
    playAudioFeedback('error')
    showResult(false, 'Terjadi kesalahan pemrosesan scan.')
    scanning.value = false
  }
}

// UF-2: Manual Search (Kartu Tertinggal)
const openManualSearchModal = () => {
  manualSearchKeyword.value = ''
  showManualSearch.value = true
}

const filteredCachedStudents = computed(() => {
  if (!manualSearchKeyword.value.trim()) return cachedStudents.value.slice(0, 20)
  const q = manualSearchKeyword.value.toLowerCase()
  return cachedStudents.value
    .filter((s) => s.student_name.toLowerCase().includes(q) || (s.nis && s.nis.includes(q)))
    .slice(0, 25)
})

const selectManualStudent = (student) => {
  showManualSearch.value = false
  const now = new Date()
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const { checkInStatus, lateMinutes } = evaluateScanStatus(now)

  playAudioFeedback('success')

  arrivalFeedback.value = {
    student_name: student.student_name,
    class_name: student.class_name,
    nis: student.nis,
    check_in_status: checkInStatus,
    late_minutes: lateMinutes,
    time_str: timeStr
  }

  pendingMoodScan.value = {
    client_scan_id: generateScanId(),
    student_id: student.student_id,
    student_name: student.student_name,
    class_name: student.class_name,
    method: 'manual_search',
    timestamp: now.getTime()
  }

  startMoodCountdown()
}

// Mood Dialog Countdown & Actions
const startMoodCountdown = () => {
  moodCountdown.value = 5
  clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    moodCountdown.value--
    if (moodCountdown.value <= 0) {
      clearInterval(countdownTimer)
      skipMood()
    }
  }, 1000)
}

const submitMood = async (mood) => {
  clearInterval(countdownTimer)
  await persistScan(mood)
}

const skipMood = async () => {
  clearInterval(countdownTimer)
  await persistScan(null)
}

const persistScan = async (mood) => {
  if (!pendingMoodScan.value) return
  
  const scanData = {
    client_scan_id: pendingMoodScan.value.client_scan_id,
    payload: pendingMoodScan.value.payload || undefined,
    student_id: pendingMoodScan.value.student_id || undefined,
    student_name: pendingMoodScan.value.student_name || undefined,
    class_name: pendingMoodScan.value.class_name || undefined,
    method: pendingMoodScan.value.method,
    mood: mood || null,
    timestamp: pendingMoodScan.value.timestamp,
    status: 'pending'
  }

  pendingMoodScan.value = null

  try {
    await db.scanQueue.add(scanData)
    await updatePendingCount()

    // Increment local summary count immediately
    todaySummary.value.total_present++
    
    if (isOnline.value) {
      await syncQueue()
    }
  } catch (err) {
    console.error('[Scanner] Failed to save scan to Dexie:', err)
    showResult(false, 'Gagal menyimpan scan ke memori lokal.')
  } finally {
    setTimeout(() => {
      scanning.value = false
    }, 800)
  }
}

// Offline Queue Synchronization (UF-4)
const syncQueue = async () => {
  if (!isOnline.value) return
  if (!currentSchoolId.value) return
  
  const pendingItems = await db.scanQueue.where('status').equals('pending').toArray()
  if (pendingItems.length === 0) return

  try {
    const payloadItems = pendingItems.map((item) => ({
      id: item.client_scan_id,
      client_scan_id: item.client_scan_id,
      payload: item.payload,
      student_id: item.student_id,
      method: item.method,
      mood: item.mood,
      timestamp: item.timestamp
    }))

    const response = await fetcher(`/school/${currentSchoolId.value}/attendance/scans/bulk`, {
      method: 'POST',
      body: payloadItems
    })

    if (response) {
      const idsToDelete = pendingItems.map((item) => item.id).filter(Boolean)
      await db.scanQueue.bulkDelete(idsToDelete)
      await updatePendingCount()
      await fetchTodaySummary()
    }
  } catch (error) {
    console.error('Failed to sync scans:', error)
  }
}

const onError = (err) => {
  console.error('[QR Error]', err)

  // Fallback: If rear camera ('environment') not found, fallback to front camera / default webcam ('user')
  if ((err.name === 'NotFoundError' || err.name === 'OverconstrainedError') && cameraConstraints.value?.facingMode === 'environment') {
    console.warn('[QR Scanner] Kamera belakang tidak ditemukan. Beralih ke webcam/kamera depan...')
    cameraConstraints.value = { facingMode: 'user' }
    return
  }

  playAudioFeedback('error')
  cameraError.value = err.name

  if (err.name === 'NotAllowedError') {
    showResult(false, 'Izin kamera ditolak oleh browser. Pastikan izin kamera aktif.')
  } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
    showResult(false, 'Tidak ada kamera/webcam terdeteksi pada perangkat ini. Silakan gunakan tombol "Cari Nama (Manual)".')
  } else {
    showResult(false, 'Kamera tidak dapat diakses (sedang digunakan aplikasi lain atau non-HTTPS).')
  }
}

const paintBoundingBox = (detectedCodes, ctx) => {
  for (const detectedCode of detectedCodes) {
    const { boundingBox: { x, y, width, height } } = detectedCode
    ctx.lineWidth = 4
    ctx.strokeStyle = '#8b5cf6'
    ctx.strokeRect(x, y, width, height)
  }
}

// Visual Helpers
const getFeedbackCardClass = (status) => {
  switch (status) {
    case 'terlambat':
      return 'bg-amber-950/90 border-amber-500/50 text-amber-50 shadow-amber-950/50'
    case 'awal':
      return 'bg-sky-950/90 border-sky-500/50 text-sky-50 shadow-sky-950/50'
    case 'tepat':
    default:
      return 'bg-emerald-950/90 border-emerald-500/50 text-emerald-50 shadow-emerald-950/50'
  }
}

const getFeedbackIconBg = (status) => {
  switch (status) {
    case 'terlambat': return 'bg-amber-500/20 text-amber-300'
    case 'awal': return 'bg-sky-500/20 text-sky-300'
    case 'tepat':
    default: return 'bg-emerald-500/20 text-emerald-300'
  }
}

const getFeedbackPillClass = (status) => {
  switch (status) {
    case 'terlambat': return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    case 'awal': return 'bg-sky-500/20 text-sky-300 border-sky-500/40'
    case 'tepat':
    default: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  }
}

const getFeedbackStatusLabel = (status, lateMinutes) => {
  if (status === 'terlambat') {
    return lateMinutes > 0 ? `Terlambat ${lateMinutes} Menit` : 'Terlambat'
  }
  if (status === 'awal') return 'Lebih Awal'
  return 'Tepat Waktu'
}

const formatTimeShort = (dStr) => {
  if (!dStr) return ''
  const d = new Date(dStr)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.96);
}
</style>
