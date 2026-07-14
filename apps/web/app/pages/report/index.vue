<script setup lang="ts">
import { ClipboardCheck, FileText, CheckCircle, AlertCircle, Play, Eye, ArrowUpRight, ShieldCheck, Printer } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal } from '@eduraport/ui'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useClass } from '../../composables/useClass'
import { useReport } from '../../composables/useReport'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'

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

const { isSchoolLocked, selectedFoundationId, selectedSchoolId, foundations, schools, initContext, onFoundationChange } = useSchoolContext()
const { academicYears, fetchAcademicYears } = useAcademicYear()
const { classes, fetchClasses } = useClass()
const { reportsList, fetchReports, generateReports, updateReportStatus, fetchReportAssessments, saveReportAssessments } = useReport()
const { user: currentUser } = useAuth()
const toast = useToast()

const selectedAcademicYearId = ref('')
const selectedClassId = ref('')
const selectedSemester = ref('odd') // odd, even

const loading = ref(false)
const generating = ref(false)
const printFormat = ref('dinas') // 'dinas' or 'intra'

const isTKSchool = computed(() => {
  const school = schools.value.find(s => s.id === selectedSchoolId.value)
  return school?.level === 'TK'
})

onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    await loadSchoolData(schoolId)
  }
})

const loadSchoolData = async (schoolId: string) => {
  loading.value = true
  try {
    await Promise.all([
      fetchAcademicYears(schoolId),
      fetchClasses(schoolId)
    ])
    
    if (academicYears.value.length > 0) {
      const activeYear = academicYears.value.find(y => y.is_active)
      selectedAcademicYearId.value = activeYear ? activeYear.id : academicYears.value[0].id
    } else {
      selectedAcademicYearId.value = ''
    }
    selectedClassId.value = ''
  } catch (error) {
    console.error('Failed loading school details:', error)
  } finally {
    loading.value = false
  }
}

watch(selectedFoundationId, (newVal) => onFoundationChange(newVal))

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await loadSchoolData(newVal)
  } else {
    academicYears.value = []
    classes.value = []
    selectedAcademicYearId.value = ''
    selectedClassId.value = ''
  }
})

const filteredClassesList = computed(() => {
  if (!classes.value) return []
  let list = classes.value
  
  if (selectedAcademicYearId.value) {
    list = list.filter(c => c.academic_year_id === selectedAcademicYearId.value)
  } else {
    return []
  }

  if (['super_admin', 'principal', 'tu', 'treasurer'].includes(currentUser.value?.role)) {
    return list
  }
  
  return list.filter(c => c.homeroom_teacher_id === currentUser.value?.id)
})

watch(filteredClassesList, (newVal) => {
  if (newVal.length > 0) {
    selectedClassId.value = newVal[0].id
  } else {
    selectedClassId.value = ''
  }
})

const loadReports = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value || !selectedAcademicYearId.value) return
  loading.value = true
  try {
    await fetchReports(
      selectedSchoolId.value,
      selectedClassId.value,
      selectedAcademicYearId.value,
      selectedSemester.value
    )
  } catch (e: any) {
    toast.error(e?.message || 'Gagal memuat daftar rapor.', 'Gagal')
  } finally {
    loading.value = false
  }
}

watch([selectedClassId, selectedSemester], async () => {
  await loadReports()
})

const handleGenerate = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value || !selectedAcademicYearId.value) return
  generating.value = true
  try {
    const payload = {
      class_id: selectedClassId.value,
      academic_year_id: selectedAcademicYearId.value,
      semester: selectedSemester.value
    }
    const res = await generateReports(selectedSchoolId.value, payload)
    if (res.success) {
      toast.success('Draft rapor kelas berhasil dibuat/diperbarui.', 'Sukses')
      await loadReports()
    }
  } catch (e: any) {
    toast.error(e?.message || 'Gagal generate rapor kelas.', 'Gagal')
  } finally {
    generating.value = false
  }
}

const handleStatusChange = async (reportId: string, status: string) => {
  if (!selectedSchoolId.value || !selectedClassId.value || !selectedAcademicYearId.value) return
  
  let confirmMsg = 'Apakah Anda yakin ingin mengirim laporan ini?'
  if (status === 'approved') confirmMsg = 'Apakah Anda yakin menyetujui rapor siswa ini?'
  if (status === 'published') confirmMsg = 'Apakah Anda yakin untuk menerbitkan rapor siswa ini ke portal orang tua?'
  
  if (!confirm(confirmMsg)) return

  try {
    const res = await updateReportStatus(
      selectedSchoolId.value,
      reportId,
      selectedClassId.value,
      selectedAcademicYearId.value,
      selectedSemester.value,
      status
    )
    if (res.success) {
      toast.success(`Status rapor berhasil diubah ke ${status}.`, 'Berhasil')
    }
  } catch (e: any) {
    toast.error(e?.message || 'Gagal memperbarui status rapor.', 'Gagal')
  }
}

const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-350 border-slate-200/60 dark:border-zinc-700',
    submitted: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    published: 'bg-violet-600/10 text-violet-600 dark:text-violet-400 border-violet-500/20'
  }
  return classes[status] || 'bg-slate-100 text-slate-600'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Draft Wali Kelas',
    submitted: 'Menunggu Approval',
    approved: 'Disetujui Kepsek',
    published: 'Diterbitkan (Ortu)'
  }
  return labels[status] || status
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Cetak & Manajemen Rapor</h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Generate draft rapor, approval Kepala Sekolah, dan cetak format resmi e-raport Kurikulum Merdeka.</p>
      </div>
      <div class="flex gap-2 flex-wrap" v-if="selectedClassId">
        <BaseButton variant="primary" @click="handleGenerate" :disabled="generating" class="py-2.5 px-4 text-xs font-bold shadow-lg shadow-violet-600/15">
          <Play class="mr-1.5" :size="14" /> {{ generating ? 'Memproses...' : 'Generate / Refresh Draft Rapor' }}
        </BaseButton>
      </div>
    </div>

    <!-- Filters Bar -->
    <div v-if="!isSchoolLocked" class="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Yayasan</label>
        <select v-model="selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
          <option value="" disabled>Pilih Yayasan</option>
          <option v-for="found in foundations" :key="found.id" :value="found.id">{{ found.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" :disabled="!selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
          <option value="" disabled>Pilih Unit Sekolah</option>
          <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tahun Ajaran</label>
        <select v-model="selectedAcademicYearId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
          <option value="" disabled>Pilih Tahun Ajaran</option>
          <option v-for="year in academicYears" :key="year.id" :value="year.id">
            {{ year.name }} {{ year.is_active ? '(Aktif)' : '' }}
          </option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kelas</label>
        <select v-model="selectedClassId" :disabled="filteredClassesList.length === 0" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
          <option value="" disabled>Pilih Kelas</option>
          <option v-for="c in filteredClassesList" :key="c.id" :value="c.id">{{ c.class_name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Semester</label>
        <select v-model="selectedSemester" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
          <option value="odd">Ganjil</option>
          <option value="even">Genap</option>
        </select>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!selectedClassId" class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-16 text-center text-slate-400 dark:text-zinc-500">
      <FileText class="mx-auto mb-3 opacity-40 text-violet-600" :size="40" />
      <h3 class="font-bold text-slate-700 dark:text-zinc-300 text-sm">Belum Ada Kelas yang Dipilih</h3>
      <p class="text-xs mt-1 max-w-sm mx-auto">Silakan tentukan unit sekolah, tahun ajaran, dan kelas rombel untuk memuat status rapor siswa.</p>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="py-20 text-center text-slate-400">
      <div class="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin mx-auto mb-3"></div>
      <p class="text-xs font-semibold">Memuat data rapor...</p>
    </div>

    <!-- Main Content Grid -->
    <div v-else class="space-y-6">
      <!-- Format Selector for TK School -->
      <div v-if="isTKSchool && reportsList.length > 0" class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-zinc-100">Pilihan Format Cetak Rapor</h4>
          <p class="text-xs text-slate-500 dark:text-zinc-400">Pilih format template yang ingin digunakan saat melihat atau mencetak rapor.</p>
        </div>
        <div class="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-1 border border-slate-200 dark:border-zinc-700">
          <button 
            @click="printFormat = 'dinas'" 
            type="button"
            :class="[
              'px-4 py-2 text-xs font-bold rounded-md transition-all',
              printFormat === 'dinas' 
                ? 'bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-sm' 
                : 'text-slate-650 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            ]"
          >
            Format Dinas
          </button>
          <button 
            @click="printFormat = 'intra'" 
            type="button"
            :class="[
              'px-4 py-2 text-xs font-bold rounded-md transition-all',
              printFormat === 'intra' 
                ? 'bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-sm' 
                : 'text-slate-655 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            ]"
          >
            Format Sekolah (Intra)
          </button>
        </div>
      </div>
      <div v-if="reportsList.length === 0" class="py-16 text-center text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
        <AlertCircle class="mx-auto mb-2 text-amber-500 opacity-80" :size="32" />
        <p class="text-xs font-bold text-slate-700 dark:text-zinc-300">Draft Rapor Belum Di-generate</p>
        <p class="text-[10px] mt-1 mb-4">Tekan tombol 'Generate / Refresh Draft Rapor' di kanan atas untuk membuat draf dokumen awal.</p>
        <BaseButton variant="primary" @click="handleGenerate" :disabled="generating" class="py-2 px-3 text-xs font-bold">
          Buat Draft Rapor Kelas
        </BaseButton>
      </div>

      <div v-else class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                <th class="p-4 pl-6">Nama Murid</th>
                <th class="p-4">NIS / NISN</th>
                <th class="p-4 text-center">Status Rapor</th>
                <th class="p-4 text-right pr-6">Aksi & Workflow</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-150 dark:divide-zinc-850">
              <tr v-for="rep in reportsList" :key="rep.student_id" class="hover:bg-slate-50/20 dark:hover:bg-zinc-900/20 transition-colors">
                <td class="p-4 pl-6">
                  <span class="font-bold text-slate-900 dark:text-zinc-100 text-xs block leading-snug">{{ rep.full_name }}</span>
                </td>
                <td class="p-4 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  {{ rep.student_number || '-' }} / {{ rep.national_student_number || '-' }}
                </td>
                <td class="p-4 text-center">
                  <span v-if="rep.report_id" class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border" :class="getStatusBadgeClass(rep.status)">
                    {{ getStatusLabel(rep.status) }}
                  </span>
                  <span v-else class="text-[10px] font-bold text-rose-500">
                    Belum Terdaftar
                  </span>
                </td>
                <td class="p-4 text-right pr-6">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- Read action -->
                    <NuxtLink 
                      v-if="rep.report_id"
                      :to="`/report/${rep.report_id}?school_id=${selectedSchoolId}&format=${printFormat}`" 
                      target="_blank"
                      class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-250 hover:bg-slate-200 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      <Eye :size="12" /> Lihat Rapor
                    </NuxtLink>


                    <!-- Wali kelas: Submit draft -->
                    <button 
                      v-if="rep.report_id && rep.status === 'draft' && ['teacher', 'super_admin'].includes(currentUser?.role)"
                      @click="handleStatusChange(rep.report_id, 'submitted')"
                      class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white hover:bg-amber-600 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      <ArrowUpRight :size="12" /> Submit Draft
                    </button>

                    <!-- Principal: Approve submitted -->
                    <button 
                      v-if="rep.report_id && rep.status === 'submitted' && ['principal', 'super_admin'].includes(currentUser?.role)"
                      @click="handleStatusChange(rep.report_id, 'approved')"
                      class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-[10px] font-bold transition-colors shadow-sm"
                    >
                      <ShieldCheck :size="12" /> Approve
                    </button>

                    <!-- Principal: Publish approved -->
                    <button 
                      v-if="rep.report_id && rep.status === 'approved' && ['principal', 'super_admin'].includes(currentUser?.role)"
                      @click="handleStatusChange(rep.report_id, 'published')"
                      class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 text-white hover:bg-violet-700 rounded-lg text-[10px] font-bold transition-colors shadow-sm"
                    >
                      <CheckCircle :size="12" /> Publish
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>


  </div>
</template>
