<script setup lang="ts">
import { Users, Plus, Trash2, Edit2, School, Search, Download, Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, LayoutGrid, History, TrendingUp } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput, BaseDateInput } from '@eduraport/ui'
import { useStudent } from '../../composables/useStudent'
import { useParent } from '../../composables/useParent'
import { useClass } from '../../composables/useClass'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useToast } from '../../composables/useToast'
import { useApi } from '../../composables/useApi'

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
const { students, totalStudents, studentsMeta, fetchStudents, createStudent, updateStudent, deleteStudent, downloadTemplate, importStudents, promoteClass } = useStudent()
const { classes, fetchClasses } = useClass()
const { academicYears, fetchAcademicYears } = useAcademicYear()
const { parents, fetchParents, createParent, updateParent, deleteParent } = useParent()
const { page, itemPerPage } = usePagination(10)
const toast = useToast()

const selectedAcademicYearId = ref('')
const selectedClassFilter = ref('') // for table filter
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showImportModal = ref(false)
const searchQuery = ref('')
const importFile = ref<File | null>(null)
const importLoading = ref(false)
const importResult = ref<{ success: number; failed: number; errors: string[] } | null>(null)
const downloadLoading = ref(false)

const showMassPromotionModal = ref(false)
const massPromotionSourceClassId = ref('')
const massPromotionTargetClassId = ref('')
const selectedStudentIds = ref<string[]>([])
const massPromotionLoading = ref(false)

const openMassPromotionModal = () => {
  showMassPromotionModal.value = true
  massPromotionSourceClassId.value = selectedClassFilter.value === '__none__' ? '' : selectedClassFilter.value
  massPromotionTargetClassId.value = ''
  selectedStudentIds.value = []
}

const modalAvailableStudents = computed(() => {
  // Use all students without being affected by the main table's search text
  return students.value.filter((s: any) => 
    massPromotionSourceClassId.value ? s.class_id === massPromotionSourceClassId.value : !s.class_id
  )
})

const toggleAllStudents = () => {
  const available = modalAvailableStudents.value
  if (selectedStudentIds.value.length === available.length && available.length > 0) {
    selectedStudentIds.value = []
  } else {
    selectedStudentIds.value = available.map((s: any) => s.id)
  }
}

const handleMassPromotion = async () => {
  if (!massPromotionTargetClassId.value) {
    toast.error('Silakan pilih kelas tujuan', 'Error')
    return
  }
  if (selectedStudentIds.value.length === 0) {
    toast.error('Pilih minimal satu siswa', 'Error')
    return
  }
  
  massPromotionLoading.value = true
  try {
    const res = await promoteClass(selectedSchoolId.value, selectedStudentIds.value, massPromotionTargetClassId.value)
    if (res.success) {
      toast.success(res.message || 'Siswa berhasil dinaikkan kelas', 'Sukses')
      showMassPromotionModal.value = false
    } else {
      toast.error(res.message || 'Gagal menaikkan kelas siswa', 'Error')
    }
  } catch (error: any) {
    toast.error('Terjadi kesalahan saat memproses data', 'Error')
  } finally {
    massPromotionLoading.value = false
  }
}

const showHistoryModal = ref(false)
const selectedStudentHistory = ref<any>(null)
const historyLoading = ref(false)

const openHistoryModal = async (student: any) => {
  if (!student.foundation_person_id) {
    toast.error('Siswa ini belum terhubung dengan data Yayasan.', 'Informasi')
    return
  }
  
  showHistoryModal.value = true
  historyLoading.value = true
  selectedStudentHistory.value = null
  
  try {
    const { fetcher } = useApi()
    const fid = selectedFoundationId.value || 'my' // fallback if needed
    const res: any = await fetcher(`/foundation/${fid}/workspace/persons/${student.foundation_person_id}/history`)
    if (res.success) {
      selectedStudentHistory.value = res.data
    }
  } catch (e: any) {
    toast.error('Gagal memuat riwayat siswa')
    showHistoryModal.value = false
  } finally {
    historyLoading.value = false
  }
}

const studentForm = reactive({
  full_name: '',
  student_number: '',
  national_student_number: '',
  gender: 'Laki-laki',
  religion: '',
  birth_date: '',
  address: '',
  status: 'active',
  weight: 0,
  height: 0,
  class_id: ''
})

const editingStudentId = ref('')
const editForm = reactive({
  full_name: '',
  student_number: '',
  national_student_number: '',
  gender: 'Laki-laki',
  religion: '',
  birth_date: '',
  address: '',
  status: 'active',
  weight: 0,
  height: 0,
  class_id: ''
})


// Classes filtered by selected academic year (for dropdowns)
const filteredClasses = computed(() => {
  if (!classes.value) return []
  if (!selectedAcademicYearId.value) return classes.value
  return classes.value.filter((c: any) => c.academic_year_id === selectedAcademicYearId.value)
})

const formattedAllClasses = computed(() => {
  if (!classes.value) return []
  return classes.value.map((c: any) => {
    const year = academicYears.value.find((y: any) => y.id === c.academic_year_id)
    return {
      ...c,
      display_name: `${c.class_name} (${c.level || '-'}) - ${year ? year.name : 'Unknown Year'}`
    }
  })
})

onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    await loadSchoolData(schoolId)
  }
})

const loadSchoolData = async (schoolId: string) => {
  await Promise.all([
    fetchStudents(schoolId, page.value, itemPerPage.value),
    fetchAcademicYears(schoolId),
    fetchClasses(schoolId)
  ])
  // Pre-select active academic year
  const activeYear = academicYears.value.find(y => y.is_active)
  if (activeYear) {
    selectedAcademicYearId.value = activeYear.id
  } else if (academicYears.value.length > 0) {
    selectedAcademicYearId.value = academicYears.value[0].id
  }
}

watch([page, itemPerPage, selectedClassFilter, selectedAcademicYearId], () => {
  if (selectedSchoolId.value) {
    fetchStudents(selectedSchoolId.value, page.value, itemPerPage.value, searchQuery.value, selectedClassFilter.value === '__none__' ? '__none__' : selectedClassFilter.value, selectedAcademicYearId.value)
  }
})

let searchTimeout: any
watch(searchQuery, (newVal) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    if (selectedSchoolId.value) {
      fetchStudents(selectedSchoolId.value, page.value, itemPerPage.value, newVal, selectedClassFilter.value === '__none__' ? '__none__' : selectedClassFilter.value, selectedAcademicYearId.value)
    }
  }, 500)
})

watch(selectedFoundationId, (newVal) => onFoundationChange(newVal))

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    selectedClassFilter.value = ''
    selectedAcademicYearId.value = ''
    await loadSchoolData(newVal)
  } else {
    students.value = []
    classes.value = []
    academicYears.value = []
  }
})

const resetCreateForm = () => {
  Object.assign(studentForm, {
    full_name: '',
    student_number: '',
    national_student_number: '',
    gender: 'Laki-laki',
    religion: '',
    birth_date: '',
    address: '',
    status: 'active',
    weight: 0,
    height: 0,
    class_id: ''
  })
}

const handleCreateStudent = async () => {
  try {
    const payload: any = { ...studentForm }
    if (!payload.class_id) delete payload.class_id
    const res = await createStudent(selectedSchoolId.value, payload)
    if (res.success) {
      showCreateModal.value = false
      resetCreateForm()
      toast.success('Siswa baru berhasil ditambahkan.', 'Berhasil')
    }
  } catch (e: any) {
    if (e.data?.errors) {
      const errorMsg = Object.entries(e.data.errors)
        .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
        .join('\n')
      toast.error(`Gagal menambah siswa:\n${errorMsg}`, 'Gagal')
    } else {
      toast.error(e?.message ?? 'Gagal menambah siswa', 'Gagal')
    }
  }
}

const openEditModal = (student: any) => {
  editingStudentId.value = student.id
  Object.assign(editForm, {
    full_name: student.full_name,
    student_number: student.student_number || '',
    national_student_number: student.national_student_number || '',
    gender: student.gender || 'Laki-laki',
    religion: student.religion || '',
    birth_date: student.birth_date ? new Date(student.birth_date).toISOString().split('T')[0] : '',
    address: student.address || '',
    status: student.status || 'active',
    weight: student.weight ? Number(student.weight) : 0,
    height: student.height ? Number(student.height) : 0,
    class_id: student.class_id || ''
  })
  showEditModal.value = true
}

const handleUpdateStudent = async () => {
  try {
    const payload: any = { ...editForm }
    if (!payload.class_id) payload.class_id = null
    const res = await updateStudent(selectedSchoolId.value, editingStudentId.value, payload)
    if (res.success) {
      showEditModal.value = false
      toast.success('Data siswa berhasil diperbarui.', 'Berhasil')
    }
  } catch (e: any) {
    if (e.data?.errors) {
      const errorMsg = Object.entries(e.data.errors)
        .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
        .join('\n')
      toast.error(`Gagal mengubah profil siswa:\n${errorMsg}`, 'Gagal')
    } else {
      toast.error(e?.message ?? 'Gagal mengubah profil siswa', 'Gagal')
    }
  }
}

const handleDeleteStudent = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus data Siswa ini?')) {
    try {
      await deleteStudent(selectedSchoolId.value, id)
      toast.success('Siswa berhasil dihapus.', 'Berhasil')
    } catch (e: any) {
      toast.error(e?.message ?? 'Gagal menghapus siswa', 'Gagal')
    }
  }
}

const handleDownloadTemplate = async () => {
  if (!selectedSchoolId.value) return
  downloadLoading.value = true
  try {
    await downloadTemplate(selectedSchoolId.value)
  } catch (e: any) {
    toast.error(e?.message ?? 'Gagal mengunduh template', 'Gagal')
  } finally {
    downloadLoading.value = false
  }
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  importFile.value = target.files?.[0] ?? null
  importResult.value = null
}

const handleImport = async () => {
  if (!importFile.value || !selectedSchoolId.value) return
  importLoading.value = true
  importResult.value = null
  try {
    const res: any = await importStudents(selectedSchoolId.value, importFile.value)
    importResult.value = res.data
  } catch (e: any) {
    if (e.data?.errors) {
      const errorList = Object.entries(e.data.errors).flatMap(([field, msgs]: any) =>
        msgs.map((msg: string) => `${field}: ${msg}`)
      )
      importResult.value = {
        success: 0,
        failed: errorList.length,
        errors: errorList
      }
    } else {
      toast.error(e?.message ?? 'Import gagal', 'Gagal')
    }
  } finally {
    importLoading.value = false
  }
}

const filteredStudents = computed(() => {
  return students.value
})

// Stats
const studentsWithClass = computed(() => students.value.filter(s => s.class_id).length)
const studentsWithoutClass = computed(() => students.value.filter(s => !s.class_id).length)
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Kelola Siswa</h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Kelola profil murid, penempatan kelas, data fisik, dan detail orang tua siswa.</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <BaseButton variant="outline" @click="handleDownloadTemplate" :disabled="!selectedSchoolId || downloadLoading" class="py-2.5 px-4 text-xs font-bold">
          <Download class="mr-1.5" :size="14" />
          {{ downloadLoading ? 'Mengunduh...' : 'Unduh Template' }}
        </BaseButton>
        <BaseButton variant="outline" @click="showImportModal = true" :disabled="!selectedSchoolId" class="py-2.5 px-4 text-xs font-bold">
          <Upload class="mr-1.5" :size="14" /> Import Excel
        </BaseButton>
        <BaseButton variant="outline" @click="openMassPromotionModal()" :disabled="!selectedSchoolId" class="py-2.5 px-4 text-xs font-bold border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/30">
          <TrendingUp class="mr-1.5" :size="14" /> Naik Kelas Massal
        </BaseButton>
        <BaseButton variant="primary" @click="showCreateModal = true; resetCreateForm()" :disabled="!selectedSchoolId" class="py-2.5 px-4 text-xs font-bold">
          <Plus class="mr-1.5" :size="14" /> Siswa Baru
        </BaseButton>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-3 gap-4" v-if="selectedSchoolId">
      <div class="bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-slate-200/60 dark:border-zinc-800 p-4 backdrop-blur-md">
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Total Siswa</p>
        <p class="text-3xl font-black text-slate-900 dark:text-zinc-100 mt-1">{{ totalStudents }}</p>
      </div>
      <div class="bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50 p-4 backdrop-blur-md">
        <p class="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Sudah di Kelas</p>
        <p class="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{{ studentsWithClass }}</p>
      </div>
      <div class="bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/50 p-4 backdrop-blur-md">
        <p class="text-[10px] font-bold uppercase tracking-widest text-amber-500">Belum di Kelas</p>
        <p class="text-3xl font-black text-amber-700 dark:text-amber-400 mt-1">{{ studentsWithoutClass }}</p>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="flex flex-col md:flex-row gap-4 bg-white/80 dark:bg-zinc-900/80 p-4 rounded-lg border border-slate-200/60 dark:border-zinc-800 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.03)] backdrop-blur-md">
      <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Foundation Selection -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 pl-1">Yayasan</label>
          <select v-model="selectedFoundationId" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
            <option v-for="f in foundations" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>

        <!-- School Selection -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 pl-1">Unit Sekolah</label>
          <select v-model="selectedSchoolId" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
            <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }} ({{ s.level }})</option>
          </select>
        </div>

        <!-- Academic Year filter -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 pl-1">Tahun Ajaran</label>
          <select v-model="selectedAcademicYearId" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
            <option value="">Semua Tahun Ajaran</option>
            <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.name }}</option>
          </select>
        </div>

        <!-- Class filter -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 pl-1">Filter Kelas</label>
          <select v-model="selectedClassFilter" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
            <option value="">Semua Kelas</option>
            <option value="__none__">— Belum di Kelas —</option>
            <option v-for="c in filteredClasses" :key="c.id" :value="c.id">{{ c.class_name }} ({{ c.level }})</option>
          </select>
        </div>
      </div>

      <!-- Search Input -->
      <div class="flex flex-col gap-1.5 md:w-72 justify-end">
        <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 pl-1 invisible">Cari</label>
        <div class="relative">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" :size="14" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Cari siswa, NIS, atau NISN..." 
            class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold transition-all outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
          />
        </div>
      </div>
    </div>

    <!-- Students Table -->
    <div class="bg-white/80 dark:bg-zinc-900/80 rounded-lg border border-slate-200/60 dark:border-zinc-800 overflow-hidden shadow-[0_2px_12px_-3px_rgba(0,0,0,0.03)] backdrop-blur-md">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200/50 dark:border-zinc-850 bg-slate-50/60 dark:bg-zinc-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th class="px-6 py-4">Nama Lengkap</th>
              <th class="px-6 py-4">NIS / NISN</th>
              <th class="px-6 py-4">Kelas</th>
              <th class="px-6 py-4">Gender</th>
              <th class="px-6 py-4">Tinggi / Berat</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-zinc-850">
            <tr 
              v-for="student in (selectedClassFilter === '__none__' ? students.filter(s => !s.class_id) : filteredStudents)" 
              :key="student.id" 
              class="text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50/30 dark:hover:bg-zinc-900/20 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm">
                    {{ student.full_name[0] }}
                  </div>
                  <div>
                    <p class="font-bold text-sm text-slate-900 dark:text-zinc-100">{{ student.full_name }}</p>
                    <p class="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5">Agama: {{ student.religion || '-' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="text-slate-900 dark:text-zinc-100">{{ student.student_number || '-' }}</p>
                <p class="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5">NISN: {{ student.national_student_number || '-' }}</p>
              </td>
              <td class="px-6 py-4">
                <span v-if="student.class_name" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-900/50">
                  <LayoutGrid :size="10" />
                  {{ student.class_name }}
                  <span class="opacity-60">· {{ student.class_level }}</span>
                </span>
                <span v-else class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                  Belum di Kelas
                </span>
              </td>
              <td class="px-6 py-4">
                {{ student.gender || '-' }}
              </td>
              <td class="px-6 py-4">
                <span v-if="student.height || student.weight">
                  {{ student.height || '-' }} cm / {{ student.weight || '-' }} kg
                </span>
                <span v-else class="text-slate-400">-</span>
              </td>
              <td class="px-6 py-4">
                <span class="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border"
                  :class="[
                    student.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-950'
                      : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-950'
                  ]"
                >
                  {{ student.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openHistoryModal(student)" class="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors" title="Riwayat Akademik">
                    <History :size="14" />
                  </button>
                  <button @click="openEditModal(student)" class="p-1.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    <Edit2 :size="14" />
                  </button>
                  <button @click="handleDeleteStudent(student.id)" class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="(selectedClassFilter === '__none__' ? students.filter(s => !s.class_id) : filteredStudents).length === 0">
              <td colspan="7" class="text-center py-16 text-slate-400 font-medium">
                <Users class="mx-auto text-slate-300 dark:text-zinc-700 mb-3" :size="40" />
                <p class="text-xs">Tidak ada data siswa ditemukan</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <AppPagination
        v-if="studentsMeta"
        v-model:page="page"
        v-model:itemPerPage="itemPerPage"
        :totalItem="studentsMeta.total_item"
        :totalPage="studentsMeta.total_page"
        :listPagination="studentsMeta.list_pagination"
      />
    </div>

    <!-- Create Student Modal -->
    <BaseModal :show="showCreateModal" title="Tambah Siswa Baru" @close="showCreateModal = false">
      <form @submit.prevent="handleCreateStudent" class="space-y-4">
        <BaseInput v-model="studentForm.full_name" label="Nama Lengkap" placeholder="Budi Santoso" required />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="studentForm.student_number" label="NIS" placeholder="10293" />
          <BaseInput v-model="studentForm.national_student_number" label="NISN" placeholder="0098765432" />
        </div>

        <!-- Class Assignment -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">
            Masukkan ke Kelas
          </label>
          <select v-model="studentForm.class_id" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
            <option value="">— Belum di Kelas —</option>
            <option v-for="c in filteredClasses" :key="c.id" :value="c.id">
              {{ c.class_name }} · {{ c.level }}
            </option>
          </select>
          <p v-if="filteredClasses.length === 0" class="text-[10px] text-amber-600 dark:text-amber-400 px-1">
            ⚠ Tidak ada kelas aktif. Buat kelas terlebih dahulu di menu Data Kelas.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Jenis Kelamin</label>
            <select v-model="studentForm.gender" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
          <BaseInput v-model="studentForm.religion" label="Agama" placeholder="Islam" />
        </div>
        <div class="grid grid-cols-3 gap-4">
          <BaseDateInput class="col-span-2" v-model="studentForm.birth_date" label="Tanggal Lahir" />
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Status</label>
            <select v-model="studentForm.status" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="studentForm.height" label="Tinggi Badan (cm)" type="number" placeholder="110" />
          <BaseInput v-model="studentForm.weight" label="Berat Badan (kg)" type="number" placeholder="20" />
        </div>
        <BaseInput v-model="studentForm.address" label="Alamat" placeholder="Jl. Anggrek No. 12" />
        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showCreateModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Siswa</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Edit Student Modal -->
    <BaseModal :show="showEditModal" title="Edit Profil Siswa" @close="showEditModal = false">
      <form @submit.prevent="handleUpdateStudent" class="space-y-4">
        <BaseInput v-model="editForm.full_name" label="Nama Lengkap" placeholder="Budi Santoso" required />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="editForm.student_number" label="NIS" placeholder="10293" />
          <BaseInput v-model="editForm.national_student_number" label="NISN" placeholder="0098765432" />
        </div>

        <!-- Class Assignment -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">
            Kelas
            <span v-if="editForm.class_id" class="ml-2 font-normal normal-case text-violet-500">
              (saat ini: {{ classes.find(c => c.id === editForm.class_id)?.class_name || '—' }})
            </span>
          </label>
          <select v-model="editForm.class_id" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
            <option value="">— Belum di Kelas —</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">
              {{ c.class_name }} · {{ c.level }}
            </option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Jenis Kelamin</label>
            <select v-model="editForm.gender" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
          <BaseInput v-model="editForm.religion" label="Agama" placeholder="Islam" />
        </div>
        <div class="grid grid-cols-3 gap-4">
          <BaseDateInput class="col-span-2" v-model="editForm.birth_date" label="Tanggal Lahir" />
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Status</label>
            <select v-model="editForm.status" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="editForm.height" label="Tinggi Badan (cm)" type="number" placeholder="110" />
          <BaseInput v-model="editForm.weight" label="Berat Badan (kg)" type="number" placeholder="20" />
        </div>
        <BaseInput v-model="editForm.address" label="Alamat" placeholder="Jl. Anggrek No. 12" />
        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showEditModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Perubahan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Import Excel Modal -->
    <BaseModal :show="showImportModal" title="Import Data Siswa via Excel" @close="showImportModal = false; importResult = null; importFile = null">
      <div class="space-y-5">
        <!-- Instructions -->
        <div class="flex items-start gap-3 p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-100 dark:border-violet-900/50">
          <FileSpreadsheet class="text-violet-500 shrink-0 mt-0.5" :size="18" />
          <div class="text-xs text-violet-700 dark:text-violet-300">
            <p class="font-bold mb-1">Panduan Import</p>
            <ol class="list-decimal ml-4 space-y-0.5 text-violet-600 dark:text-violet-400">
              <li>Unduh template Excel terlebih dahulu melalui tombol <strong>Unduh Template</strong>.</li>
              <li>Buka sheet <strong>DATA KELAS</strong> — salin <strong>ID Kelas</strong> yang ingin di-assign.</li>
              <li>Isi data siswa di sheet <strong>PENGISIAN DATA</strong> mulai baris ke-10.</li>
              <li>Kolom <strong>Nama Lengkap</strong> wajib diisi. Kolom <strong>ID Kelas</strong> opsional — kosongkan jika belum assign kelas.</li>
              <li>Upload file yang telah diisi kembali di sini.</li>
            </ol>
          </div>
        </div>

        <!-- File picker -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Pilih File Excel (.xlsx)</label>
          <label class="flex items-center gap-3 cursor-pointer border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-lg px-4 py-5 hover:border-violet-400 dark:hover:border-violet-600 transition-colors group">
            <Upload class="text-slate-400 group-hover:text-violet-500 transition-colors" :size="20" />
            <div class="flex-1 min-w-0">
              <p v-if="importFile" class="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">{{ importFile.name }}</p>
              <p v-else class="text-sm text-slate-400 dark:text-zinc-500">Klik untuk memilih file atau seret ke sini</p>
            </div>
            <input type="file" accept=".xlsx,.xls" class="hidden" @change="onFileChange" />
          </label>
        </div>

        <!-- Import result -->
        <div v-if="importResult" class="space-y-2">
          <div class="flex gap-3">
            <div class="flex-1 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-lg px-4 py-3">
              <CheckCircle class="text-emerald-500" :size="16" />
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Berhasil</p>
                <p class="text-xl font-black text-emerald-700 dark:text-emerald-300">{{ importResult.success }}</p>
              </div>
            </div>
            <div class="flex-1 flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-lg px-4 py-3">
              <AlertCircle class="text-rose-500" :size="16" />
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Gagal</p>
                <p class="text-xl font-black text-rose-700 dark:text-rose-300">{{ importResult.failed }}</p>
              </div>
            </div>
          </div>
          <div v-if="importResult.errors.length > 0" class="bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-100 dark:border-rose-900/50 p-3 max-h-40 overflow-y-auto">
            <p class="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-2">Detail Error</p>
            <ul class="space-y-1">
              <li v-for="(err, i) in importResult.errors" :key="i" class="text-xs text-rose-700 dark:text-rose-300 flex gap-2">
                <X :size="11" class="shrink-0 mt-0.5" /> {{ err }}
              </li>
            </ul>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showImportModal = false; importResult = null; importFile = null">Tutup</BaseButton>
          <BaseButton variant="primary" @click="handleImport" :disabled="!importFile || importLoading">
            <Upload class="mr-1.5" :size="14" />
            {{ importLoading ? 'Sedang Import...' : 'Mulai Import' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- History Modal -->
    <BaseModal :show="showHistoryModal" title="Riwayat Siswa" @close="showHistoryModal = false">
      <div v-if="historyLoading" class="text-center py-8 text-slate-500">Memuat riwayat...</div>
      <div v-else-if="selectedStudentHistory" class="space-y-4">
        <div class="bg-slate-50 dark:bg-zinc-900 p-4 rounded-lg border border-slate-200 dark:border-zinc-800">
          <p class="font-bold text-slate-900 dark:text-white">{{ selectedStudentHistory.person.full_name }}</p>
          <p class="text-xs text-slate-500">NISN: {{ selectedStudentHistory.person.national_student_number || '-' }}</p>
        </div>
        
        <div v-for="school in selectedStudentHistory.history" :key="school.id" class="border-l-2 border-violet-500 pl-4 py-2 relative">
          <div class="absolute -left-[5px] top-4 w-2 h-2 rounded-full bg-violet-600"></div>
          <h3 class="font-bold text-sm text-slate-800 dark:text-zinc-200">{{ school.school_name }} <span class="text-xs text-slate-400 font-normal">({{ school.school_level }})</span></h3>
          <div class="mt-2 space-y-2">
            <div v-for="cls in school.class_histories" :key="cls.changed_at" class="text-xs bg-slate-50 dark:bg-zinc-900/50 p-2 rounded flex justify-between items-center border border-slate-100 dark:border-zinc-800">
              <div>
                <span class="font-bold text-violet-600 dark:text-violet-400">{{ cls.class_name }}</span>
                <span class="text-slate-400 ml-2">TA: {{ cls.academic_year_name || '-' }}</span>
              </div>
              <span class="text-[10px] text-slate-400">{{ new Date(cls.changed_at).toLocaleDateString('id-ID') }}</span>
            </div>
            <div v-if="school.class_histories.length === 0" class="text-xs text-slate-400 italic">Belum ada riwayat kelas</div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8 text-slate-500">Gagal memuat riwayat</div>
      <div class="flex justify-end pt-4">
        <BaseButton variant="outline" @click="showHistoryModal = false">Tutup</BaseButton>
      </div>
    </BaseModal>

    <!-- Mass Promotion Modal -->
    <BaseModal :show="showMassPromotionModal" title="Kenaikan Kelas Massal" @close="showMassPromotionModal = false" custom-class="max-w-4xl w-full">
      <div class="space-y-4">
        <div class="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-lg border border-violet-100 dark:border-violet-900/50 flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <TrendingUp class="text-violet-600 dark:text-violet-400" :size="20" />
            <h3 class="font-bold text-violet-900 dark:text-violet-100">Proses Kenaikan Kelas</h3>
          </div>
          <p class="text-xs text-violet-700 dark:text-violet-300">
            Pilih kelas asal untuk melihat daftar siswa, kemudian centang siswa yang ingin dipindahkan ke kelas tujuan.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 pl-1">Pilih Kelas Asal</label>
            <select v-model="massPromotionSourceClassId" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
              <option value="">— Belum di Kelas —</option>
              <option v-for="c in formattedAllClasses" :key="c.id" :value="c.id">{{ c.display_name }}</option>
            </select>
          </div>
          
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 pl-1">Pilih Kelas Tujuan</label>
            <select v-model="massPromotionTargetClassId" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
              <option value="" disabled>— Pilih Kelas Tujuan —</option>
              <option v-for="c in formattedAllClasses" :key="c.id" :value="c.id">{{ c.display_name }}</option>
            </select>
          </div>
        </div>

        <!-- Student List for Promotion -->
        <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden flex flex-col h-[400px]">
          <div class="bg-slate-50 dark:bg-zinc-950 p-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <input type="checkbox" :checked="selectedStudentIds.length > 0 && selectedStudentIds.length === modalAvailableStudents.length" @change="toggleAllStudents" class="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 dark:focus:ring-violet-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
              <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Semua ({{ modalAvailableStudents.length }} Siswa)</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-1 bg-violet-100 text-violet-700 rounded-full dark:bg-violet-900/30 dark:text-violet-400">
              {{ selectedStudentIds.length }} Terpilih
            </span>
          </div>
          
          <div class="flex-1 overflow-auto p-2 space-y-1">
            <label 
              v-for="student in modalAvailableStudents" 
              :key="student.id"
              class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
              :class="selectedStudentIds.includes(student.id) ? 'bg-violet-50/50 border-violet-200 dark:bg-violet-900/10 dark:border-violet-800' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800'"
            >
              <input type="checkbox" :value="student.id" v-model="selectedStudentIds" class="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 dark:focus:ring-violet-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
              <div class="flex-1">
                <p class="text-sm font-bold text-slate-800 dark:text-zinc-200">{{ student.full_name }}</p>
                <p class="text-[10px] text-slate-500 dark:text-zinc-400">{{ student.student_number || '-' }} | {{ student.national_student_number || '-' }}</p>
              </div>
            </label>
            
            <div v-if="modalAvailableStudents.length === 0" class="text-center py-10">
              <p class="text-xs font-medium text-slate-400">Tidak ada siswa di kelas asal ini.</p>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end gap-2 pt-4">
          <BaseButton type="button" variant="outline" @click="showMassPromotionModal = false" class="py-2.5 px-4 text-xs font-bold">
            Batal
          </BaseButton>
          <BaseButton type="button" variant="primary" @click="handleMassPromotion" :disabled="massPromotionLoading || selectedStudentIds.length === 0 || !massPromotionTargetClassId" class="py-2.5 px-4 text-xs font-bold">
            {{ massPromotionLoading ? 'Memproses...' : 'Proses Kenaikan Kelas' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>

  </div>
</template>
