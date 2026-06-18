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
      <div class="flex gap-2">
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
        
        <!-- Intrakurikuler Section -->
        <div>
          <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">I. Program Intrakurikuler (Capaian Pembelajaran)</h3>
          
          <div class="space-y-4">
            <div 
              v-for="asm in reportData.assessments.filter((a: any) => a.subject_type === 'intrakurikuler' || !a.subject_type)" 
              :key="asm.element_id"
              class="bg-slate-50 dark:bg-zinc-950/40 p-4 rounded-lg border border-slate-200/60 dark:border-zinc-855 print:bg-white print:p-0 print:border-none"
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
          <div class="bg-slate-50 dark:bg-zinc-950/40 p-5 rounded-lg border border-slate-200/60 dark:border-zinc-855 print:bg-white print:p-0 print:border-none space-y-3">
            <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed text-justify print:text-black">
              Dalam projek semester ini, ananda aktif berpartisipasi dan menunjukkan nilai-nilai luhur Pancasila meliputi kemandirian, gotong royong, dan berpikir kritis. Ananda mampu menyelesaikan tugas kelompok dengan baik serta menghargai pendapat temannya.
            </p>
          </div>
        </div>

        <!-- Extracurricular Section -->
        <div>
          <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">III. Kegiatan Ekstrakurikuler</h3>
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
            <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">IV. Tumbuh Kembang</h3>
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
            <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">V. Kehadiran (Absensi)</h3>
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

      </div>

      <!-- ─── JENJANG SD / SMP / SMA TEMPLATE ─── -->
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
