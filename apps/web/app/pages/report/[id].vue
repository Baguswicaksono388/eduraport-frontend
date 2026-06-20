<script setup lang="ts">
import { Printer, X, ShieldAlert, FileText, CheckCircle } from 'lucide-vue-next'
import { useSchool } from '../../composables/useSchool'
import { useReport } from '../../composables/useReport'
import { useToast } from '../../composables/useToast'

// Disable Nuxt layout for printing
definePageMeta({
  layout: false,
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
const router = useRouter()
const { currentSchoolId } = useSchool()
const { fetchReportDetail } = useReport()
const toast = useToast()

const reportId = route.params.id as string
const reportData = ref<any>(null)
const loading = ref(true)
const selectedTKFormat = ref((route.query.format as string) || 'dinas') // 'dinas' or 'intra'

watch(() => route.query.format, (newFormat) => {
  if (newFormat === 'dinas' || newFormat === 'intra') {
    selectedTKFormat.value = newFormat
  }
})

watch(selectedTKFormat, (newFormat) => {
  if (route.query.format !== newFormat) {
    router.replace({
      query: {
        ...route.query,
        format: newFormat
      }
    })
  }
})

onMounted(async () => {
  const schoolId = (route.query.school_id as string) || currentSchoolId.value
  if (!schoolId) {
    toast.error('Harap pilih unit sekolah terlebih dahulu di dashboard.', 'Error')
    loading.value = false
    return
  }
  
  try {
    const res = await fetchReportDetail(schoolId, reportId)
    if (res.success) {
      reportData.value = res.data
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal memuat detail rapor.', 'Gagal')
  } finally {
    loading.value = false
  }
})

const tkDinasAssessments = computed(() => {
  if (!reportData.value?.assessments) return []
  return reportData.value.assessments.filter((a: any) => 
    !a.template_name || a.template_name.includes('Kurikulum Merdeka') || a.template_name.includes('Dinas')
  )
})

const tkIntraAssessments = computed(() => {
  if (!reportData.value?.assessments) return []
  return reportData.value.assessments.filter((a: any) => 
    a.template_name && a.template_name.includes('Intra')
  )
})

const tkDinasIntraAssessments = computed(() => {
  const intrakurikulerNames = [
    'Nilai Agama & Budi Pekerti',
    'Jati Diri',
    'Dasar-dasar Literasi, Matematika, Sains, Teknologi, Rekayasa, dan Seni'
  ]
  return tkDinasAssessments.value.filter((a: any) => 
    intrakurikulerNames.includes(a.element_name)
  )
})

const tkDinasP5Narrative = computed(() => {
  return tkDinasAssessments.value.find((a: any) => 
    a.element_name.includes('Kokurikuler') || a.element_name.includes('Projek')
  )?.narrative || 'Dalam projek semester ini, ananda aktif berpartisipasi dan menunjukkan nilai-nilai luhur Pancasila meliputi kemandirian, gotong royong, dan berpikir kritis. Ananda mampu menyelesaikan tugas kelompok dengan baik serta menghargai pendapat temannya.'
})

const intraGroup1 = computed(() => {
  const g1Names = [
    'Adaptasi dan Sosialisasi', 'Minat Belajar', 'Kesiapan Belajar', 
    'Kemandirian', 'Rutinitas', 'Kestabilan Emosi', 
    'Ekspresi', 'Percaya Diri', 'Respons', 'Tanggung Jawab'
  ]
  return tkIntraAssessments.value.filter((a: any) => g1Names.includes(a.element_name))
})

const intraGroup2 = computed(() => {
  const g2Names = [
    'Konsentrasi', 'Kooperatif', 'Ketuntasan Tugas', 
    'Rapi', 'Disiplin', 'Kreatif'
  ]
  return tkIntraAssessments.value.filter((a: any) => g2Names.includes(a.element_name))
})

const intraGroup3 = computed(() => {
  const g3Names = [
    'Motorik Kasar', 'Motorik Halus', 'Persepsi Auditori', 
    'Persepsi Visual', 'Keterampilan Berbicara'
  ]
  return tkIntraAssessments.value.filter((a: any) => g3Names.includes(a.element_name))
})

const intraPribadiNarrative = computed(() => 
  tkIntraAssessments.value.find((a: any) => a.element_name.includes('Pribadi & Sikap'))?.narrative || ''
)

const intraMotorikNarrative = computed(() => 
  tkIntraAssessments.value.find((a: any) => a.element_name.includes('Keterampilan Motorik') || a.element_name.includes('Motorik'))?.narrative || ''
)

const intraAgamaNarrative = computed(() => 
  tkIntraAssessments.value.find((a: any) => a.element_name.includes('Keagamaan') || a.element_name.includes('Ibadah'))?.narrative || ''
)

const handlePrint = () => {
  window.print()
}

const handleClose = () => {
  window.close()
}

const formatDate = (dateStr: any) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 p-0 sm:p-6 print:p-0 print:bg-white print:text-black">
    <!-- Floating Toolbar (Hidden during Print) -->
    <div class="max-w-4xl mx-auto mb-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-md flex justify-between items-center print:hidden">
      <div class="flex items-center gap-2">
        <FileText class="text-violet-600" :size="20" />
        <div>
          <h1 class="text-sm font-bold text-slate-900 dark:text-zinc-100">Pratinjau Rapor Digital</h1>
          <p class="text-[10px] text-slate-500">Gunakan tombol print untuk mencetak rapor resmi A4.</p>
        </div>
      </div>
      <div class="flex gap-2 items-center">
        <!-- Dual format toggle for TK level only -->
        <div v-if="reportData?.student?.school_level === 'TK'" class="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-slate-200/60 dark:border-zinc-700 mr-2 print:hidden">
          <button 
            @click="selectedTKFormat = 'dinas'" 
            :class="[
              'px-3 py-1.5 text-[11px] font-bold rounded-md transition-all',
              selectedTKFormat === 'dinas' 
                ? 'bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-sm' 
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            ]"
          >
            Format Dinas
          </button>
          <button 
            @click="selectedTKFormat = 'intra'" 
            :class="[
              'px-3 py-1.5 text-[11px] font-bold rounded-md transition-all',
              selectedTKFormat === 'intra' 
                ? 'bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-sm' 
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            ]"
          >
            Format Sekolah (Intra)
          </button>
        </div>
        <button @click="handlePrint" class="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-750 transition-colors shadow-lg shadow-violet-600/10">
          <Printer :size="14" /> Cetak Rapor
        </button>
        <button @click="handleClose" class="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors">
          <X :size="14" /> Tutup
        </button>
      </div>
    </div>

    <!-- Main Report Container -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-32">
      <div class="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin mb-4"></div>
      <p class="text-xs font-semibold text-slate-500">Memuat berkas rapor...</p>
    </div>

    <div v-else-if="!reportData" class="max-w-md mx-auto text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <ShieldAlert class="mx-auto text-rose-500 mb-3" :size="40" />
      <h2 class="font-bold text-slate-800 dark:text-zinc-200 text-sm">Rapor Tidak Ditemukan</h2>
      <p class="text-xs text-slate-400 mt-1 mb-6">Pastikan ID Rapor dan Unit Sekolah aktif Anda sesuai.</p>
      <button @click="handleClose" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">Kembali</button>
    </div>

    <div v-else class="max-w-4xl mx-auto bg-white dark:bg-zinc-900 border border-slate-300/60 dark:border-zinc-800 rounded-none sm:rounded-2xl p-8 sm:p-12 shadow-sm print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
      
      <!-- Report Header (Logo and School/Student Info) -->
      <div class="text-center border-b-2 border-slate-900 pb-6 mb-8 print:pb-4 print:mb-6">
        <h2 class="text-lg font-black uppercase tracking-wide">{{ reportData.student.school_name }}</h2>
        <p class="text-xs font-semibold">{{ reportData.student.school_address }}</p>
        <p class="text-[10px] text-slate-500 font-medium">NPSN: {{ reportData.student.school_npsn || '-' }} | NSM: {{ reportData.student.school_nsm || '-' }}</p>
      </div>

      <!-- Student & Period Metadata Grid -->
      <div class="grid grid-cols-2 gap-4 text-xs font-semibold mb-8 print:mb-6">
        <div class="space-y-1">
          <div class="flex"><span class="w-24 text-slate-500">Nama Siswa</span><span class="mr-2">:</span><span class="text-slate-900 dark:text-zinc-100 print:text-black">{{ reportData.student.full_name }}</span></div>
          <div class="flex"><span class="w-24 text-slate-500">NIS / NISN</span><span class="mr-2">:</span><span>{{ reportData.student.student_number || '-' }} / {{ reportData.student.national_student_number || '-' }}</span></div>
          <div class="flex"><span class="w-24 text-slate-500">Kelas Rombel</span><span class="mr-2">:</span><span>{{ reportData.student.class_name }}</span></div>
        </div>
        <div class="space-y-1 pl-4 border-l border-slate-200 print:border-slate-300">
          <div class="flex"><span class="w-28 text-slate-500">Tahun Ajaran</span><span class="mr-2">:</span><span>Semester {{ reportData.report.semester === 'odd' ? 'Ganjil' : 'Genap' }}</span></div>
          <div class="flex"><span class="w-28 text-slate-500">Kurikulum</span><span class="mr-2">:</span><span class="uppercase">{{ reportData.student.school_level === 'TK' ? 'Kurikulum Merdeka PAUD' : 'Kurikulum Merdeka' }}</span></div>
          <div class="flex"><span class="w-28 text-slate-500">Tanggal Terbit</span><span class="mr-2">:</span><span>{{ formatDate(reportData.report.generated_at || reportData.report.created_at) }}</span></div>
        </div>
      </div>

      <!-- ─── JENJANG TK / PAUD TEMPLATE ─── -->
      <div v-if="reportData.student.school_level === 'TK'" class="space-y-8 print:space-y-6">
        
        <!-- FORMAT DINAS -->
        <div v-if="selectedTKFormat === 'dinas'" class="space-y-8 print:space-y-6">
          <!-- Intrakurikuler Section -->
          <div>
            <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">I. Program Intrakurikuler (Capaian Pembelajaran)</h3>
            
            <div class="space-y-4">
              <div 
                v-for="asm in tkDinasIntraAssessments" 
                :key="asm.element_id"
                class="bg-slate-50 dark:bg-zinc-950/40 p-4 rounded-lg border border-slate-200/60 dark:border-zinc-800 print:bg-white print:p-0 print:border-none"
              >
                <div class="flex justify-between items-start mb-2">
                  <span class="text-xs font-bold text-slate-900 dark:text-zinc-100 print:text-black">{{ asm.element_name }}</span>
                  <span class="inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-violet-600/10 text-violet-600 border border-violet-500/10 print:border print:border-black print:text-black print:bg-white">
                    Capaian: {{ asm.letter_grade || asm.predicate || 'BSH' }}
                  </span>
                </div>
                <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed text-justify print:text-black">
                  {{ asm.narrative || 'Ananda menunjukkan capaian perkembangan yang sangat baik dalam aspek ini.' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Kokurikuler (Projek P5) Section -->
          <div>
            <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">II. Projek Penguatan Profil Pelajar Pancasila (Kokurikuler)</h3>
            <div class="bg-slate-50 dark:bg-zinc-950/40 p-5 rounded-lg border border-slate-200/60 dark:border-zinc-800 print:bg-white print:p-0 print:border-none space-y-3">
              <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed text-justify print:text-black">
                {{ tkDinasP5Narrative }}
              </p>
            </div>
          </div>
        </div>

        <!-- FORMAT SEKOLAH (INTRA) -->
        <div v-else class="space-y-8 print:space-y-6">
          <!-- Tema & Penilaian Legend Header -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
            <!-- Tema Semester -->
            <div class="bg-slate-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800 print:bg-white print:border-slate-300">
              <h4 class="text-xs font-extrabold text-slate-900 dark:text-zinc-100 print:text-black mb-2 uppercase">Tema – Semester I:</h4>
              <ul class="list-decimal pl-4 text-xs space-y-1 text-slate-600 dark:text-zinc-400 print:text-black">
                <li>Aku Milik Allah</li>
                <li>Pejuang Islam Negeriku</li>
                <li>Eksplorasi Islam #1</li>
                <li>Eksplorasi Islam #2</li>
                <li>Flora Fauna Ciptaan Allah</li>
              </ul>
            </div>

            <!-- Kategori Penilaian Legend -->
            <div class="bg-slate-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800 print:bg-white print:border-slate-300">
              <h4 class="text-xs font-extrabold text-slate-900 dark:text-zinc-100 print:text-black mb-2 uppercase">Kategori Penilaian:</h4>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="flex items-center gap-1.5"><span class="font-black text-violet-650 dark:text-violet-400 print:text-black">BS</span> <span class="text-slate-550 dark:text-zinc-450 print:text-slate-700">: Baik Sekali</span></div>
                <div class="flex items-center gap-1.5"><span class="font-black text-violet-650 dark:text-violet-400 print:text-black">B</span> <span class="text-slate-550 dark:text-zinc-450 print:text-slate-700">: Baik</span></div>
                <div class="flex items-center gap-1.5"><span class="font-black text-violet-650 dark:text-violet-400 print:text-black">C</span> <span class="text-slate-550 dark:text-zinc-450 print:text-slate-700">: Cukup</span></div>
                <div class="flex items-center gap-1.5"><span class="font-black text-violet-650 dark:text-violet-400 print:text-black">K</span> <span class="text-slate-550 dark:text-zinc-450 print:text-slate-700">: Kurang</span></div>
              </div>
            </div>
          </div>

          <!-- Aspek Amatan Checklist Table -->
          <div>
            <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">I. Kategori Perkembangan Kemampuan &amp; Penilaian</h3>
            <table class="w-full text-left border border-slate-900 text-xs">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-900 font-bold">
                  <th class="p-2 border-r border-slate-900 w-12 text-center">No</th>
                  <th class="p-2 border-r border-slate-900">ASPEK AMATAN</th>
                  <th class="p-2 border-r border-slate-900 text-center w-12">K</th>
                  <th class="p-2 border-r border-slate-900 text-center w-12">C</th>
                  <th class="p-2 border-r border-slate-900 text-center w-12">B</th>
                  <th class="p-2 text-center w-12">BS</th>
                </tr>
              </thead>
              <tbody>
                <!-- Group I -->
                <tr class="bg-slate-100 dark:bg-zinc-900/60 font-bold border-b border-slate-900">
                  <td colspan="6" class="p-2">I. Perkembangan Potensi Pribadi</td>
                </tr>
                <tr v-for="(asm, index) in intraGroup1" :key="asm.element_id" class="border-b border-slate-900">
                  <td class="p-2 border-r border-slate-900 text-center">{{ index + 1 }}</td>
                  <td class="p-2 border-r border-slate-900">{{ asm.element_name }}</td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'K'}">
                    <span v-if="asm.letter_grade === 'K'">✓</span>
                  </td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'C'}">
                    <span v-if="asm.letter_grade === 'C'">✓</span>
                  </td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'B'}">
                    <span v-if="asm.letter_grade === 'B'">✓</span>
                  </td>
                  <td class="p-2 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'BS'}">
                    <span v-if="asm.letter_grade === 'BS'">✓</span>
                  </td>
                </tr>

                <!-- Group II -->
                <tr class="bg-slate-100 dark:bg-zinc-900/60 font-bold border-b border-slate-900">
                  <td colspan="6" class="p-2">II. Sikap Belajar</td>
                </tr>
                <tr v-for="(asm, index) in intraGroup2" :key="asm.element_id" class="border-b border-slate-900">
                  <td class="p-2 border-r border-slate-900 text-center">{{ index + 1 }}</td>
                  <td class="p-2 border-r border-slate-900">{{ asm.element_name }}</td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'K'}">
                    <span v-if="asm.letter_grade === 'K'">✓</span>
                  </td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'C'}">
                    <span v-if="asm.letter_grade === 'C'">✓</span>
                  </td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'B'}">
                    <span v-if="asm.letter_grade === 'B'">✓</span>
                  </td>
                  <td class="p-2 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'BS'}">
                    <span v-if="asm.letter_grade === 'BS'">✓</span>
                  </td>
                </tr>

                <!-- Group III -->
                <tr class="bg-slate-100 dark:bg-zinc-900/60 font-bold border-b border-slate-900">
                  <td colspan="6" class="p-2">III. Perkembangan Potensi Kemampuan Dasar</td>
                </tr>
                <tr v-for="(asm, index) in intraGroup3" :key="asm.element_id" class="border-b border-slate-900 last:border-b-0">
                  <td class="p-2 border-r border-slate-900 text-center">{{ index + 1 }}</td>
                  <td class="p-2 border-r border-slate-900">{{ asm.element_name }}</td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'K'}">
                    <span v-if="asm.letter_grade === 'K'">✓</span>
                  </td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'C'}">
                    <span v-if="asm.letter_grade === 'C'">✓</span>
                  </td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'B'}">
                    <span v-if="asm.letter_grade === 'B'">✓</span>
                  </td>
                  <td class="p-2 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'BS'}">
                    <span v-if="asm.letter_grade === 'BS'">✓</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Narasi Pencapaian Hasil Belajar -->
          <div>
            <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">Narasi Pencapaian Hasil Belajar - Semester I</h3>
            <div class="space-y-4">
              <div class="bg-slate-50 dark:bg-zinc-950/40 p-4 rounded-lg border border-slate-200/60 dark:border-zinc-800 print:bg-white print:p-0 print:border-none">
                <span class="text-xs font-bold text-slate-900 dark:text-zinc-100 print:text-black block mb-1.5">1. Catatan Perkembangan Pribadi &amp; Sikap Belajar</span>
                <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed text-justify print:text-black">
                  {{ intraPribadiNarrative || 'Belum ada catatan perkembangan pribadi.' }}
                </p>
              </div>
              <div class="bg-slate-50 dark:bg-zinc-950/40 p-4 rounded-lg border border-slate-200/60 dark:border-zinc-800 print:bg-white print:p-0 print:border-none">
                <span class="text-xs font-bold text-slate-900 dark:text-zinc-100 print:text-black block mb-1.5">2. Catatan Keterampilan Motorik</span>
                <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed text-justify print:text-black">
                  {{ intraMotorikNarrative || 'Belum ada catatan keterampilan motorik.' }}
                </p>
              </div>
              <div class="bg-slate-50 dark:bg-zinc-950/40 p-4 rounded-lg border border-slate-200/60 dark:border-zinc-800 print:bg-white print:p-0 print:border-none">
                <span class="text-xs font-bold text-slate-900 dark:text-zinc-100 print:text-black block mb-1.5">3. Catatan Kegiatan Keagamaan &amp; Ibadah</span>
                <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed text-justify print:text-black">
                  {{ intraAgamaNarrative || 'Belum ada catatan kegiatan keagamaan.' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Bagian Bersama: Ekstrakurikuler, Tumbuh Kembang, Absensi -->
        <!-- Extracurricular Section -->
        <div>
          <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">II. Kegiatan Ekstrakurikuler</h3>
          <table class="w-full text-left border border-slate-900 text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-900 font-bold">
                <th class="p-2 border-r border-slate-900 w-1/3">Kegiatan Ekstrakurikuler</th>
                <th class="p-2 border-r border-slate-900 text-center w-24">Predikat</th>
                <th class="p-2">Deskripsi / Capaian</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ex in reportData.extracurriculars" :key="ex.extracurricular_name" class="border-b border-slate-900 last:border-0">
                <td class="p-2 border-r border-slate-900 font-bold">{{ ex.extracurricular_name }}</td>
                <td class="p-2 border-r border-slate-900 text-center font-black text-violet-600 print:text-black">{{ ex.grade || 'A' }}</td>
                <td class="p-2 leading-relaxed text-slate-600 print:text-black">{{ ex.description }}</td>
              </tr>
              <tr v-if="reportData.extracurriculars.length === 0">
                <td colspan="3" class="p-4 text-center text-slate-400">Tidak mengikuti kegiatan ekstrakurikuler.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Attendance & Physical Growth Grid -->
        <div class="grid grid-cols-2 gap-8 print:gap-6">
          <!-- Physical Growth -->
          <div>
            <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">III. Tumbuh Kembang</h3>
            <table class="w-full text-left border border-slate-900 text-xs">
              <tbody>
                <tr class="border-b border-slate-900">
                  <td class="p-2 border-r border-slate-900 font-bold bg-slate-50 w-1/2">Tinggi Badan</td>
                  <td class="p-2">{{ reportData.student.height ? `${reportData.student.height} cm` : '-' }}</td>
                </tr>
                <tr>
                  <td class="p-2 border-r border-slate-900 font-bold bg-slate-50">Berat Badan</td>
                  <td class="p-2">{{ reportData.student.weight ? `${reportData.student.weight} kg` : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Attendance -->
          <div>
            <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">IV. Kehadiran (Absensi)</h3>
            <table class="w-full text-left border border-slate-900 text-xs">
              <tbody>
                <tr class="border-b border-slate-900">
                  <td class="p-2 border-r border-slate-900 font-bold bg-slate-50 w-1/2">Sakit (S)</td>
                  <td class="p-2 text-center">{{ reportData.attendance.sick }} hari</td>
                </tr>
                <tr class="border-b border-slate-900">
                  <td class="p-2 border-r border-slate-900 font-bold bg-slate-50">Izin (I)</td>
                  <td class="p-2 text-center">{{ reportData.attendance.leave }} hari</td>
                </tr>
                <tr>
                  <td class="p-2 border-r border-slate-900 font-bold bg-slate-50">Tanpa Keterangan (A)</td>
                  <td class="p-2 text-center">{{ reportData.attendance.absent }} hari</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>      <!-- ─── JENJANG SD / SMP / SMA TEMPLATE ─── -->
      <div v-else class="space-y-8 print:space-y-6">
        
        <!-- Subject Grades Table -->
        <div>
          <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">I. Nilai Akademik (Intrakurikuler)</h3>
          <table class="w-full text-left border border-slate-900 text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-900 font-bold">
                <th class="p-2 border-r border-slate-900 w-12 text-center">No</th>
                <th class="p-2 border-r border-slate-900">Mata Pelajaran</th>
                <th class="p-2 border-r border-slate-900 text-center w-16">KKM</th>
                <th class="p-2 border-r border-slate-900 text-center w-16">Nilai</th>
                <th class="p-2 border-r border-slate-900 text-center w-16">Predikat</th>
                <th class="p-2">Deskripsi Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(grade, index) in reportData.finalGrades" :key="grade.subject_id" class="border-b border-slate-900 last:border-0">
                <td class="p-2 border-r border-slate-900 text-center">{{ index + 1 }}</td>
                <td class="p-2 border-r border-slate-900 font-bold">{{ grade.subject_name }}</td>
                <td class="p-2 border-r border-slate-900 text-center">{{ grade.kkm_score ? Number(grade.kkm_score) : 70 }}</td>
                <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'text-rose-600': Number(grade.final_score) < Number(grade.kkm_score || 70)}">
                  {{ grade.final_score ? Number(grade.final_score) : '-' }}
                </td>
                <td class="p-2 border-r border-slate-900 text-center font-black">{{ grade.predicate || '-' }}</td>
                <td class="p-2 leading-relaxed text-slate-650 print:text-black">{{ grade.achievement_description }}</td>
              </tr>
              <tr v-if="reportData.finalGrades.length === 0">
                <td colspan="6" class="p-4 text-center text-slate-400">Tidak ada nilai akademik yang difinalisasi untuk semester ini.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Extracurricular Table -->
        <div>
          <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">II. Kegiatan Ekstrakurikuler</h3>
          <table class="w-full text-left border border-slate-900 text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-900 font-bold">
                <th class="p-2 border-r border-slate-900 w-1/3">Kegiatan Ekstrakurikuler</th>
                <th class="p-2 border-r border-slate-900 text-center w-24">Predikat</th>
                <th class="p-2">Deskripsi / Capaian</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ex in reportData.extracurriculars" :key="ex.extracurricular_name" class="border-b border-slate-900 last:border-0">
                <td class="p-2 border-r border-slate-900 font-bold">{{ ex.extracurricular_name }}</td>
                <td class="p-2 border-r border-slate-900 text-center font-black text-violet-600 print:text-black">{{ ex.grade || 'A' }}</td>
                <td class="p-2 leading-relaxed text-slate-600 print:text-black">{{ ex.description }}</td>
              </tr>
              <tr v-if="reportData.extracurriculars.length === 0">
                <td colspan="3" class="p-4 text-center text-slate-400">Tidak mengikuti kegiatan ekstrakurikuler.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Attendance & Homeroom Notes Grid -->
        <div class="grid grid-cols-3 gap-6">
          
          <!-- Attendance -->
          <div class="col-span-1">
            <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-3">III. Kehadiran</h3>
            <table class="w-full text-left border border-slate-900 text-xs">
              <tbody>
                <tr class="border-b border-slate-900">
                  <td class="p-2 border-r border-slate-900 font-bold bg-slate-50 w-2/3">Sakit (S)</td>
                  <td class="p-2 text-center">{{ reportData.attendance.sick }}</td>
                </tr>
                <tr class="border-b border-slate-900">
                  <td class="p-2 border-r border-slate-900 font-bold bg-slate-50">Izin (I)</td>
                  <td class="p-2 text-center">{{ reportData.attendance.leave }}</td>
                </tr>
                <tr>
                  <td class="p-2 border-r border-slate-900 font-bold bg-slate-50">Tanpa Ket (A)</td>
                  <td class="p-2 text-center">{{ reportData.attendance.absent }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Notes -->
          <div class="col-span-2">
            <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-3">IV. Catatan Wali Kelas</h3>
            <div class="border border-slate-900 p-4 min-h-[92px] text-xs leading-relaxed text-justify text-slate-700 print:text-black">
              {{ reportData.report.homeroom_notes || 'Ananda menunjukkan perilaku sosial yang sangat baik selama semester ini dan memiliki motivasi belajar yang konsisten.' }}
            </div>
          </div>

        </div>

      </div>

      <!-- Signatures Footer -->
      <div class="mt-16 print:mt-12 text-xs font-semibold">
        <div class="grid grid-cols-3 text-center gap-4">
          <div class="space-y-16">
            <p>Orang Tua / Wali Murid</p>
            <p class="border-b border-slate-900 w-3/4 mx-auto pb-1"></p>
          </div>
          <div class="space-y-16">
            <p>Guru Kelas / Wali Kelas</p>
            <p class="border-b border-slate-900 w-3/4 mx-auto pb-1"></p>
          </div>
          <div class="space-y-16">
            <p>Mengetahui,<br>Kepala Sekolah</p>
            <p class="border-b border-slate-900 w-3/4 mx-auto pb-1"></p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style>
@media print {
  body {
    background-color: white;
    color: black;
  }
  .print\:hidden {
    display: none !important;
  }
}
</style>
