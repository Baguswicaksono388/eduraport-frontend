<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSchoolContext } from '~/composables/useSchoolContext'
import { useApi } from '~/composables/useApi'
import QrcodeVue from 'qrcode.vue'

definePageMeta({
  layout: false // Standalone layout for printing
})

const route = useRoute()
const { selectedSchoolId: currentSchoolId, initContext } = useSchoolContext()
const { fetcher } = useApi()

const classId = route.params.id
const loading = ref(true)
const cardsData = ref<any>(null)

const fetchData = async () => {
  if (!currentSchoolId.value) return
  
  loading.value = true
  try {
    const res: any = await fetcher(`/school/${currentSchoolId.value}/attendance/classes/${classId}/qr-cards`)
    if (res.success) {
      cardsData.value = res.data
    }
  } catch (err) {
    console.error('Failed to load cards data', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await initContext()
  fetchData()
})

const printCards = () => {
  window.print()
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white font-sans">
    
    <!-- Action Bar (Hidden when printing) -->
    <div class="max-w-5xl mx-auto mb-8 flex justify-between items-center print:hidden bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div>
        <h1 class="text-xl font-bold text-slate-800">Cetak Kartu QR</h1>
        <p class="text-sm text-slate-500">
          Kelas: <span class="font-bold text-slate-700">{{ cardsData?.className || 'Loading...' }}</span>
        </p>
      </div>
      <div class="flex gap-3">
        <button @click="$router.back()" class="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium text-sm transition-colors">
          Kembali
        </button>
        <button @click="printCards" class="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors flex items-center gap-2 shadow-md shadow-violet-600/20">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print / Simpan PDF
        </button>
      </div>
    </div>

    <!-- Cards Grid Container -->
    <div v-if="loading" class="flex justify-center items-center py-20 print:hidden">
      <div class="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full"></div>
    </div>
    
    <div v-else-if="cardsData && cardsData.students.length > 0" class="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4 print:max-w-none">
      
      <!-- Individual Card -->
      <div v-for="student in cardsData.students" :key="student.id" class="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm flex flex-col items-center p-6 print:break-inside-avoid relative">
        
        <!-- Header -->
        <div class="w-full flex items-center justify-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
            <img v-if="cardsData.school?.logo_url" :src="cardsData.school.logo_url" class="w-full h-full object-cover" />
            <span v-else class="text-slate-400 font-bold text-xs">SKL</span>
          </div>
          <div class="text-center">
            <h2 class="text-sm font-bold text-slate-800 leading-tight uppercase tracking-wide">{{ cardsData.school?.name || 'EduRaport School' }}</h2>
            <p class="text-[10px] text-slate-500 uppercase font-semibold">Kartu Absensi Siswa</p>
          </div>
        </div>

        <!-- Photo -->
        <div class="w-24 h-32 bg-slate-100 mb-4 rounded-xl border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
          <img v-if="student.photo_url" :src="student.photo_url" class="w-full h-full object-cover" />
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <!-- Student Info -->
        <div class="text-center mb-6 w-full">
          <h3 class="font-bold text-slate-800 text-lg leading-tight mb-1 line-clamp-1">{{ student.name }}</h3>
          <p class="text-xs text-slate-500 font-mono">NIS: {{ student.nis_local || '-' }}</p>
          <div class="mt-2 inline-block px-3 py-1 bg-violet-50 text-violet-700 font-bold text-xs rounded-full border border-violet-100">
            Kelas {{ cardsData.className }}
          </div>
        </div>

        <!-- QR Code -->
        <div class="bg-white p-2 rounded-xl border-2 border-slate-100 shadow-sm mb-2">
          <QrcodeVue :value="student.token" :size="120" level="H" class="rounded-lg" />
        </div>
        <p class="text-[8px] text-slate-400 font-mono tracking-widest mt-1">SIMPAN KARTU INI</p>
        
        <!-- Decorative bg -->
        <div class="absolute -bottom-10 -right-10 w-32 h-32 bg-violet-50 rounded-full opacity-50 pointer-events-none"></div>
        <div class="absolute -top-10 -left-10 w-24 h-24 bg-amber-50 rounded-full opacity-50 pointer-events-none"></div>
      </div>

    </div>

    <div v-else class="max-w-5xl mx-auto py-20 text-center bg-white rounded-xl border border-slate-200 print:hidden">
      <p class="text-slate-500">Tidak ada data siswa atau token belum di-generate.</p>
    </div>

  </div>
</template>

<style scoped>
@media print {
  @page {
    margin: 10mm;
    size: A4 portrait;
  }
}
</style>
