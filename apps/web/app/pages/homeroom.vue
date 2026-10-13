<script setup lang="ts">
import { 
  Users, 
  Calendar, 
  LayoutGrid, 
  BookOpen, 
  CheckCircle, 
  Download, 
  Upload, 
  Save, 
  FileSpreadsheet, 
  AlertCircle, 
  ClipboardCheck, 
  Award, 
  FileText,
  X,
  Camera,
  CalendarRange,
  Check,
  CheckCircle2,
  Paperclip,
  Eye,
  Clock
} from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal } from '@eduraport/ui'
import { useAcademicYear } from '../composables/useAcademicYear'
import { useClass } from '../composables/useClass'
import { useHomeroom } from '../composables/useHomeroom'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_cookie') // fallback or auth check
      const auth_token = useCookie('auth_token')
      if (!auth_token.value && !token.value) {
        return navigateTo('/login')
      }
    }
  ]
})

const { isSchoolLocked, selectedFoundationId, selectedSchoolId, foundations, schools, initContext, onFoundationChange } = useSchoolContext()
const { academicYears, fetchAcademicYears } = useAcademicYear()
const { classes, fetchClasses } = useClass()
const { 
  homeroomStudents, 
  activeExtracurriculars, 
  leaveRequests,
  fetchHomeroomData, 
  saveHomeroomData, 
  downloadTemplate, 
  importTemplate,
  fetchClassLeaveRequests,
  fetchSchoolLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest
} = useHomeroom()
const { user: currentUser } = useAuth()
const toast = useToast()
const route = useRoute()

const selectedAcademicYearId = ref('')
const selectedClassId = ref('')
const selectedSemester = ref('odd') // odd, even

const activeTab = ref(route.query.tab === 'leave_requests' ? 'leave_requests' : 'attendance') // attendance, extracurricular, notes, photos, leave_requests
const loading = ref(false)
const saving = ref(false)

const showImportModal = ref(false)
const importFile = ref<File | null>(null)
const importLoading = ref(false)
const importResult = ref<{ success: boolean; importedCount: number; errors?: any } | null>(null)

// Local copy for direct bindings in grid
const studentDataList = ref<any[]>([])

const selectedSchool = computed(() => {
  return schools.value.find(s => s.id === selectedSchoolId.value)
})

const isTKSchool = computed(() => {
  return selectedSchool.value?.level === 'TK'
})

// Populate local grid when API states change
watch(homeroomStudents, (newVal) => {
  studentDataList.value = newVal.map(s => {
    let photos = []
    if (Array.isArray(s.activity_photos)) {
      photos = [...s.activity_photos]
    } else if (typeof s.activity_photos === 'string' && s.activity_photos) {
      try {
        photos = JSON.parse(s.activity_photos)
      } catch {
        photos = []
      }
    }
    while (photos.length < 3) photos.push('')
    photos = photos.slice(0, 3)

    return {
      student_id: s.student_id,
      full_name: s.full_name,
      student_number: s.student_number,
      national_student_number: s.national_student_number,
      attendance: {
        sick: s.sick ?? 0,
        leave: s.leave ?? 0,
        absent: s.absent ?? 0
      },
      extracurricular: {
        extracurricular_id: s.extracurricular_id || '',
        grade: s.grade || '',
        description: s.description || ''
      },
      homeroom_notes: s.homeroom_notes || '',
      activity_photos: photos
    }
  })
}, { deep: true })

onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    await loadSchoolData(schoolId)
    if (activeTab.value === 'leave_requests') {
      await loadLeaves()
    }
  }
})

const loadSchoolData = async (schoolId: string) => {
  loading.value = true
  try {
    await Promise.all([
      fetchAcademicYears(schoolId),
      fetchClasses(schoolId),
      fetchSchoolLeaveRequests(schoolId)
    ])
    
    if (academicYears.value.length > 0) {
      const activeYear = academicYears.value.find(y => y.is_active)
      selectedAcademicYearId.value = activeYear ? activeYear.id : academicYears.value[0].id
    } else {
      selectedAcademicYearId.value = ''
    }
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
    studentDataList.value = []
  }
})

watch(() => route.query.tab, (newTab) => {
  if (newTab === 'leave_requests') {
    activeTab.value = 'leave_requests'
    loadLeaves()
  }
})

// Filter classes based on role and active years
const filteredClassesList = computed(() => {
  if (!classes.value || classes.value.length === 0) return []
  let list = classes.value
  
  // Filter by selected academic year if matched
  if (selectedAcademicYearId.value) {
    const yearFiltered = list.filter(c => c.academic_year_id === selectedAcademicYearId.value)
    if (yearFiltered.length > 0) {
      list = yearFiltered
    }
  }

  // Staff and admin roles see all classes
  const adminRoles = ['super_admin', 'principal', 'tu', 'treasurer', 'user', 'solo_teacher', 'vice_principal_curriculum']
  if (adminRoles.includes(currentUser.value?.role)) {
    return list
  }
  
  // Teachers prefer assigned homeroom classes, but fallback to all classes if unassigned
  const homeroomList = list.filter(c => c.homeroom_teacher_id === currentUser.value?.id)
  return homeroomList.length > 0 ? homeroomList : list
})

// Automatically pick first available class for user
watch(filteredClassesList, (newVal) => {
  if (newVal.length > 0) {
    if (!newVal.some(c => c.id === selectedClassId.value)) {
      selectedClassId.value = newVal[0].id
    }
  } else {
    selectedClassId.value = ''
    studentDataList.value = []
  }
}, { immediate: true })

const loadHomeroomDataList = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value || !selectedAcademicYearId.value) return
  loading.value = true
  try {
    await fetchHomeroomData(
      selectedSchoolId.value, 
      selectedClassId.value, 
      selectedAcademicYearId.value, 
      selectedSemester.value
    )
  } catch (e: any) {
    toast.error(e?.message || 'Gagal memuat data akademik kelas.', 'Gagal')
  } finally {
    loading.value = false
  }
}

const leaveFilterStatus = ref('all') // all, pending, approved, rejected
const leaveProcessingId = ref<string | null>(null)
const selectedLeaveAttachment = ref<string | null>(null)
const leaveLoading = ref(false)

const pendingLeaveCount = computed(() => {
  return leaveRequests.value.filter(r => r.status === 'pending').length
})

const filteredLeaveRequests = computed(() => {
  if (leaveFilterStatus.value === 'all') return leaveRequests.value
  return leaveRequests.value.filter(r => r.status === leaveFilterStatus.value)
})

const loadLeaves = async () => {
  if (!selectedSchoolId.value) return
  leaveLoading.value = true
  try {
    if (selectedClassId.value) {
      await fetchClassLeaveRequests(selectedSchoolId.value, selectedClassId.value)
    } else {
      await fetchSchoolLeaveRequests(selectedSchoolId.value)
    }
  } finally {
    leaveLoading.value = false
  }
}

const handleApproveLeave = async (req: any) => {
  if (!selectedSchoolId.value) return
  leaveProcessingId.value = req.id
  try {
    const res = await approveLeaveRequest(selectedSchoolId.value, req.id, selectedClassId.value || undefined)
    if (res.success) {
      toast.success(`Pengajuan izin untuk ${req.student_name} telah disetujui.`, 'Disetujui')
      await loadLeaves()
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyetujui izin.', 'Error')
  } finally {
    leaveProcessingId.value = null
  }
}

const handleRejectLeave = async (req: any) => {
  if (!selectedSchoolId.value) return
  leaveProcessingId.value = req.id
  try {
    const res = await rejectLeaveRequest(selectedSchoolId.value, req.id, selectedClassId.value || undefined)
    if (res.success) {
      toast.info(`Pengajuan izin untuk ${req.student_name} ditolak.`, 'Ditolak')
      await loadLeaves()
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal menolak izin.', 'Error')
  } finally {
    leaveProcessingId.value = null
  }
}

watch([selectedClassId, selectedSemester], async () => {
  await Promise.all([
    loadHomeroomDataList(),
    loadLeaves()
  ])
})

const handleSave = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value || !selectedAcademicYearId.value) return
  saving.value = true
  try {
    const payload = {
      academic_year_id: selectedAcademicYearId.value,
      semester: selectedSemester.value,
      students: studentDataList.value.map(s => ({
        student_id: s.student_id,
        attendance: {
          sick: Math.max(0, parseInt(s.attendance.sick) || 0),
          leave: Math.max(0, parseInt(s.attendance.leave) || 0),
          absent: Math.max(0, parseInt(s.attendance.absent) || 0)
        },
        extracurricular: s.extracurricular.extracurricular_id ? {
          extracurricular_id: s.extracurricular.extracurricular_id,
          grade: s.extracurricular.grade || null,
          description: s.extracurricular.description || null
        } : null,
        homeroom_notes: s.homeroom_notes || null,
        activity_photos: s.activity_photos || []
      }))
    }
    const res = await saveHomeroomData(selectedSchoolId.value, selectedClassId.value, payload)
    if (res.success) {
      toast.success('Data akademik berhasil disimpan.', 'Sukses')
    }
  } catch (e: any) {
    toast.error(e?.message || 'Gagal menyimpan data akademik.', 'Gagal')
  } finally {
    saving.value = false
  }
}

const handleDownload = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value || !selectedAcademicYearId.value) return
  try {
    await downloadTemplate(
      selectedSchoolId.value, 
      selectedClassId.value, 
      selectedAcademicYearId.value, 
      selectedSemester.value
    )
  } catch (e: any) {
    toast.error(e?.message || 'Gagal mengunduh template Excel.', 'Gagal')
  }
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  importFile.value = target.files?.[0] ?? null
  importResult.value = null
}

const handleImport = async () => {
  if (!importFile.value || !selectedSchoolId.value || !selectedClassId.value || !selectedAcademicYearId.value) return
  importLoading.value = true
  importResult.value = null
  try {
    const res: any = await importTemplate(
      selectedSchoolId.value, 
      selectedClassId.value, 
      selectedAcademicYearId.value, 
      selectedSemester.value, 
      importFile.value
    )
    if (res.success) {
      importResult.value = {
        success: true,
        importedCount: res.data?.importedCount || 0
      }
      await loadHomeroomDataList()
    }
  } catch (e: any) {
    if (e.data?.errors) {
      importResult.value = {
        success: false,
        importedCount: 0,
        errors: e.data.errors
      }
    } else {
      toast.error(e?.message ?? 'Gagal mengimport data Excel.', 'Gagal')
    }
  } finally {
    importLoading.value = false
  }
}

// ─── PHOTO UPLOAD & CANVAS COMPRESSION LOGIC ───
const handlePhotoUpload = (event: Event, studentId: string, slotIndex: number) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.error('Berkas harus berupa gambar.', 'Error')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height
      const MAX_SIZE = 800

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width
          width = MAX_SIZE
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height
          height = MAX_SIZE
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        const base64 = canvas.toDataURL('image/jpeg', 0.8)
        
        const student = studentDataList.value.find(s => s.student_id === studentId)
        if (student) {
          if (!student.activity_photos) {
            student.activity_photos = ['', '', '']
          }
          student.activity_photos[slotIndex] = base64
        }
      }
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removePhoto = (studentId: string, slotIndex: number) => {
  const student = studentDataList.value.find(s => s.student_id === studentId)
  if (student && student.activity_photos) {
    student.activity_photos[slotIndex] = ''
  }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Portal Wali Kelas</h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Kelola Kehadiran/Absensi, Nilai Ekstrakurikuler, dan Catatan Rapor untuk kelas bimbingan Anda.</p>
      </div>
      <div class="flex gap-2 flex-wrap" v-if="selectedClassId">
        <BaseButton variant="outline" @click="handleDownload" class="py-2.5 px-4 text-xs font-bold">
          <Download class="mr-1.5" :size="14" /> Unduh Template
        </BaseButton>
        <BaseButton variant="outline" @click="showImportModal = true" class="py-2.5 px-4 text-xs font-bold">
          <Upload class="mr-1.5" :size="14" /> Import Excel
        </BaseButton>
        <BaseButton variant="primary" @click="handleSave" :disabled="saving || studentDataList.length === 0" class="py-2.5 px-4 text-xs font-bold">
          <Save class="mr-1.5" :size="14" /> {{ saving ? 'Menyimpan...' : 'Simpan Semua' }}
        </BaseButton>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="!isSchoolLocked" class="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Yayasan</label>
        <select v-model="selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Yayasan</option>
          <option v-for="found in foundations" :key="found.id" :value="found.id">{{ found.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" :disabled="!selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Unit Sekolah</option>
          <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tahun Ajaran</label>
        <select v-model="selectedAcademicYearId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Tahun Ajaran</option>
          <option v-for="year in academicYears" :key="year.id" :value="year.id">
            {{ year.name }} {{ year.is_active ? '(Aktif)' : '' }}
          </option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kelas Rombel</label>
        <select v-model="selectedClassId" :disabled="filteredClassesList.length === 0" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Kelas</option>
          <option v-for="c in filteredClassesList" :key="c.id" :value="c.id">
            {{ c.class_name || c.name }}
          </option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Semester</label>
        <select v-model="selectedSemester" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
          <option value="odd">Ganjil (Odd)</option>
          <option value="even">Genap (Even)</option>
        </select>
      </div>
    </div>

    <!-- Navigation Tabs (Always Visible) -->
    <div class="flex border-b border-slate-200 dark:border-zinc-800/80 gap-6 overflow-x-auto">
      <button 
        @click="activeTab = 'attendance'" 
        class="pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 shrink-0"
        :class="[
          activeTab === 'attendance'
            ? 'border-violet-600 text-violet-600 dark:text-violet-400'
            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
        ]"
      >
        <ClipboardCheck :size="14" /> Kehadiran (Absensi)
      </button>
      <button 
        @click="activeTab = 'extracurricular'" 
        class="pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 shrink-0"
        :class="[
          activeTab === 'extracurricular'
            ? 'border-violet-600 text-violet-600 dark:text-violet-400'
            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
        ]"
      >
        <Award :size="14" /> Nilai Ekstrakurikuler
      </button>
      <button 
        @click="activeTab = 'notes'" 
        class="pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 shrink-0"
        :class="[
          activeTab === 'notes'
            ? 'border-violet-600 text-violet-600 dark:text-violet-400'
            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
        ]"
      >
        <FileText :size="14" /> Catatan Wali Kelas
      </button>
      <button 
        v-if="isTKSchool"
        @click="activeTab = 'photos'" 
        class="pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 shrink-0"
        :class="[
          activeTab === 'photos'
            ? 'border-violet-600 text-violet-600 dark:text-violet-400'
            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
        ]"
      >
        <Camera :size="14" /> Foto Kegiatan (TK)
      </button>
      <button 
        @click="activeTab = 'leave_requests'; loadLeaves()" 
        class="pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 shrink-0"
        :class="[
          activeTab === 'leave_requests'
            ? 'border-violet-600 text-violet-600 dark:text-violet-400'
            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
        ]"
      >
        <CalendarRange :size="14" /> Izin Siswa (Wali Murid)
        <span 
          v-if="pendingLeaveCount > 0" 
          class="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold animate-pulse"
        >
          {{ pendingLeaveCount }}
        </span>
      </button>
    </div>

    <!-- Tab 5: Leave Requests Container (Always Accessible) -->
    <div v-if="activeTab === 'leave_requests'" class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
      <div class="p-5 space-y-4">
        <!-- Filter & Header Summary -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h4 class="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
              <CalendarRange class="text-violet-500" :size="18" />
              Permohonan Izin & Sakit Siswa
              <span v-if="!selectedClassId" class="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 px-2 py-0.5 rounded-full font-semibold">Semua Kelas</span>
              <span v-else class="text-[10px] bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 px-2 py-0.5 rounded-full font-semibold">Kelas Terpilih</span>
            </h4>
            <p class="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              Tinjau dan setujui/tolak permohonan izin atau sakit yang diajukan wali murid secara real-time.
            </p>
          </div>

          <!-- Status Filter Pills -->
          <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg text-xs font-semibold">
            <button
              @click="leaveFilterStatus = 'all'"
              class="px-2.5 py-1 rounded-md transition"
              :class="leaveFilterStatus === 'all' ? 'bg-white dark:bg-zinc-900 shadow-sm text-slate-900 dark:text-zinc-100' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'"
            >
              Semua ({{ leaveRequests.length }})
            </button>
            <button
              @click="leaveFilterStatus = 'pending'"
              class="px-2.5 py-1 rounded-md transition flex items-center gap-1"
              :class="leaveFilterStatus === 'pending' ? 'bg-white dark:bg-zinc-900 shadow-sm text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'"
            >
              Menunggu
              <span v-if="pendingLeaveCount > 0" class="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                {{ pendingLeaveCount }}
              </span>
            </button>
            <button
              @click="leaveFilterStatus = 'approved'"
              class="px-2.5 py-1 rounded-md transition"
              :class="leaveFilterStatus === 'approved' ? 'bg-white dark:bg-zinc-900 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'"
            >
              Disetujui
            </button>
            <button
              @click="leaveFilterStatus = 'rejected'"
              class="px-2.5 py-1 rounded-md transition"
              :class="leaveFilterStatus === 'rejected' ? 'bg-white dark:bg-zinc-900 shadow-sm text-rose-600 dark:text-rose-400' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'"
            >
              Ditolak
            </button>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="leaveLoading" class="py-12 text-center text-slate-400">
          <div class="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p class="text-xs">Memuat permohonan izin...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredLeaveRequests.length === 0" class="py-16 text-center text-slate-400 dark:text-zinc-500">
          <CheckCircle2 class="mx-auto mb-2 text-emerald-500/70" :size="32" />
          <p class="text-xs font-bold text-slate-700 dark:text-zinc-300">Tidak ada pengajuan izin dengan status ini.</p>
          <p class="text-[11px] text-slate-400 mt-0.5">Seluruh permohonan dari wali murid telah tertangani atau belum ada yang diajukan.</p>
        </div>

        <!-- Leave Requests Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/30 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                <th class="p-3.5 pl-4">Siswa</th>
                <th class="p-3.5">Kelas</th>
                <th class="p-3.5">Rentang Tanggal</th>
                <th class="p-3.5">Alasan / Keterangan</th>
                <th class="p-3.5 text-center">Dokumen / Surat</th>
                <th class="p-3.5 text-center">Status</th>
                <th class="p-3.5 text-right pr-4">Aksi / Tindakan</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in filteredLeaveRequests"
                :key="item.id"
                class="border-b border-slate-100 dark:border-zinc-800/80 last:border-0 hover:bg-slate-50/30 dark:hover:bg-zinc-900/30 transition-colors"
              >
                <td class="p-3.5 pl-4">
                  <span class="font-bold text-slate-800 dark:text-zinc-200 text-xs block leading-snug">{{ item.student_name }}</span>
                  <span class="text-[10px] text-slate-400 dark:text-zinc-500">NIS/NISN: {{ item.student_number || '-' }} / {{ item.national_student_number || '-' }}</span>
                </td>
                <td class="p-3.5">
                  <span class="text-xs font-semibold text-slate-700 dark:text-zinc-300">{{ item.class_name || '-' }}</span>
                </td>
                <td class="p-3.5">
                  <div class="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300">
                    <Calendar :size="13" class="text-violet-500 shrink-0" />
                    <span>{{ item.start_date }} <span class="text-slate-400">s/d</span> {{ item.end_date }}</span>
                  </div>
                </td>
                <td class="p-3.5 max-w-xs">
                  <p class="text-xs text-slate-700 dark:text-zinc-300 line-clamp-2" :title="item.reason">
                    {{ item.reason }}
                  </p>
                </td>
                <td class="p-3.5 text-center">
                  <button
                    v-if="item.attachment_url"
                    @click="selectedLeaveAttachment = item.attachment_url"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 transition"
                  >
                    <Paperclip :size="12" /> Lihat Surat
                  </button>
                  <span v-else class="text-[10px] text-slate-400 italic">Tanpa lampiran</span>
                </td>
                <td class="p-3.5 text-center">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                    :class="{
                      'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50': item.status === 'pending',
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50': item.status === 'approved',
                      'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50': item.status === 'rejected'
                    }"
                  >
                    {{ item.status === 'pending' ? 'Menunggu' : (item.status === 'approved' ? 'Disetujui' : 'Ditolak') }}
                  </span>
                </td>
                <td class="p-3.5 text-right pr-4">
                  <div class="flex items-center justify-end gap-1.5">
                    <template v-if="item.status === 'pending'">
                      <button
                        @click="handleApproveLeave(item)"
                        :disabled="leaveProcessingId === item.id"
                        class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <Check :size="13" /> Setujui
                      </button>
                      <button
                        @click="handleRejectLeave(item)"
                        :disabled="leaveProcessingId === item.id"
                        class="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <X :size="13" /> Tolak
                      </button>
                    </template>
                    <template v-else>
                      <span class="text-[10px] text-slate-400 font-medium mr-2">Selesai diproses</span>
                      <button
                        v-if="item.status === 'rejected'"
                        @click="handleApproveLeave(item)"
                        :disabled="leaveProcessingId === item.id"
                        class="px-2 py-0.5 text-[10px] font-semibold text-emerald-600 hover:underline"
                      >
                        Ubah ke Setuju
                      </button>
                      <button
                        v-if="item.status === 'approved'"
                        @click="handleRejectLeave(item)"
                        :disabled="leaveProcessingId === item.id"
                        class="px-2 py-0.5 text-[10px] font-semibold text-rose-600 hover:underline"
                      >
                        Ubah ke Tolak
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Empty State for Academic Tabs when no class is selected -->
    <div v-else-if="!selectedClassId" class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-16 text-center text-slate-400 dark:text-zinc-500">
      <LayoutGrid class="mx-auto mb-3 opacity-40 animate-pulse text-violet-600 dark:text-violet-400" :size="40" />
      <h3 class="font-bold text-slate-700 dark:text-zinc-300 text-sm">Belum Ada Kelas yang Dipilih</h3>
      <p class="text-xs mt-1 max-w-sm mx-auto">Silakan pilih Unit Sekolah, Tahun Ajaran, dan Kelas Rombel untuk memuat formulir input akademik.</p>
    </div>

    <!-- Main Grid Content for Academic Tabs -->
    <div v-else class="space-y-6">

      <!-- Loading Overlay -->
      <div v-if="loading" class="py-20 text-center text-slate-400">
        <div class="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin mx-auto mb-3"></div>
        <p class="text-xs font-semibold">Memuat data siswa...</p>
      </div>

      <div v-else-if="studentDataList.length === 0" class="py-20 text-center text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
        <Users class="mx-auto mb-2 opacity-50" :size="32" />
        <p class="text-xs font-bold">Tidak ada siswa yang terdaftar dalam kelas ini.</p>
        <p class="text-[10px] mt-1">Harap hubungkan siswa ke kelas ini terlebih dahulu lewat halaman Data Siswa.</p>
      </div>

      <!-- Data Forms -->
      <div v-else class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        
        <!-- Tab 1: Attendance -->
        <div v-if="activeTab === 'attendance'" class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                <th class="p-4 pl-6">Nama Siswa</th>
                <th class="p-4 text-center">Sakit</th>
                <th class="p-4 text-center">Izin</th>
                <th class="p-4 text-center">Alpha</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in studentDataList" :key="student.student_id" class="border-b border-slate-100 dark:border-zinc-800/80 last:border-0 hover:bg-slate-50/20 dark:hover:bg-zinc-900/20 transition-colors">
                <td class="p-4 pl-6">
                  <span class="font-bold text-slate-800 dark:text-zinc-200 text-sm block leading-snug">{{ student.full_name }}</span>
                  <span class="text-[10px] text-slate-400 dark:text-zinc-500">NIS/NISN: {{ student.student_number || '-' }} / {{ student.national_student_number || '-' }}</span>
                </td>
                <td class="p-4 text-center">
                  <input 
                    type="number" 
                    v-model.number="student.attendance.sick" 
                    min="0"
                    class="w-20 bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-center text-xs font-semibold outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                  />
                </td>
                <td class="p-4 text-center">
                  <input 
                    type="number" 
                    v-model.number="student.attendance.leave" 
                    min="0"
                    class="w-20 bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-center text-xs font-semibold outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                  />
                </td>
                <td class="p-4 text-center">
                  <input 
                    type="number" 
                    v-model.number="student.attendance.absent" 
                    min="0"
                    class="w-20 bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-center text-xs font-semibold outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tab 2: Extracurricular -->
        <div v-if="activeTab === 'extracurricular'" class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                <th class="p-4 pl-6 w-1/4">Nama Siswa</th>
                <th class="p-4 w-1/4">Ekstrakurikuler</th>
                <th class="p-4 w-1/6">Nilai / Predikat</th>
                <th class="p-4 pr-6">Keterangan / Capaian</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in studentDataList" :key="student.student_id" class="border-b border-slate-100 dark:border-zinc-800/80 last:border-0 hover:bg-slate-50/20 dark:hover:bg-zinc-900/20 transition-colors">
                <td class="p-4 pl-6">
                  <span class="font-bold text-slate-800 dark:text-zinc-200 text-sm block leading-snug">{{ student.full_name }}</span>
                  <span class="text-[10px] text-slate-400 dark:text-zinc-500">NIS: {{ student.student_number || '-' }}</span>
                </td>
                <td class="p-4">
                  <select v-model="student.extracurricular.extracurricular_id" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
                    <option value="">Tidak Mengikuti Ekskul</option>
                    <option v-for="e in activeExtracurriculars" :key="e.id" :value="e.id">{{ e.name }}</option>
                  </select>
                </td>
                <td class="p-4">
                  <input 
                    type="text" 
                    v-model="student.extracurricular.grade"
                    :disabled="!student.extracurricular.extracurricular_id"
                    placeholder="Nilai (misal: A)"
                    class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 disabled:opacity-40"
                  />
                </td>
                <td class="p-4 pr-6">
                  <input 
                    type="text" 
                    v-model="student.extracurricular.description"
                    :disabled="!student.extracurricular.extracurricular_id"
                    placeholder="Keterangan pencapaian ekskul"
                    class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 disabled:opacity-40"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tab 3: Notes -->
        <div v-if="activeTab === 'notes'" class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                <th class="p-4 pl-6 w-1/4">Nama Siswa</th>
                <th class="p-4 pr-6">Catatan Rapor Wali Kelas</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in studentDataList" :key="student.student_id" class="border-b border-slate-100 dark:border-zinc-800/80 last:border-0 hover:bg-slate-50/20 dark:hover:bg-zinc-900/20 transition-colors">
                <td class="p-4 pl-6">
                  <span class="font-bold text-slate-800 dark:text-zinc-200 text-sm block leading-snug">{{ student.full_name }}</span>
                  <span class="text-[10px] text-slate-400 dark:text-zinc-500">NIS/NISN: {{ student.student_number || '-' }}</span>
                </td>
                <td class="p-4 pr-6">
                  <textarea 
                    v-model="student.homeroom_notes"
                    rows="2"
                    placeholder="Tuliskan catatan perkembangan umum perkembangan murid..."
                    class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 resize-none leading-relaxed"
                  ></textarea>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tab 4: Photos (TK) -->
        <div v-if="activeTab === 'photos' && isTKSchool" class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                <th class="p-4 pl-6 w-1/4">Nama Siswa</th>
                <th class="p-4 pr-6">Foto Kegiatan (Maksimal 3 Foto)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in studentDataList" :key="student.student_id" class="border-b border-slate-100 dark:border-zinc-800/80 last:border-0 hover:bg-slate-50/20 dark:hover:bg-zinc-900/20 transition-colors">
                <td class="p-4 pl-6">
                  <span class="font-bold text-slate-800 dark:text-zinc-200 text-sm block leading-snug">{{ student.full_name }}</span>
                  <span class="text-[10px] text-slate-400 dark:text-zinc-500">NIS/NISN: {{ student.student_number || '-' }}</span>
                </td>
                <td class="p-4 pr-6">
                  <div class="grid grid-cols-3 gap-4 max-w-2xl">
                    <div v-for="idx in [0, 1, 2]" :key="idx" class="relative group aspect-[16/9] border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
                      <!-- Image preview -->
                      <template v-if="student.activity_photos && student.activity_photos[idx]">
                        <img :src="student.activity_photos[idx]" class="w-full h-full object-cover" />
                        <button 
                          @click="removePhoto(student.student_id, idx)"
                          class="absolute top-1.5 right-1.5 bg-rose-600/90 text-white rounded-full p-1 hover:bg-rose-700 transition-colors shadow shadow-black/25"
                        >
                          <X :size="12" />
                        </button>
                      </template>
                      
                      <!-- Upload input -->
                      <template v-else>
                        <label class="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 transition-colors">
                          <Camera class="text-slate-400 dark:text-zinc-500 mb-1" :size="16" />
                          <span class="text-[9px] font-bold text-slate-400 dark:text-zinc-500">Pilih Foto {{ idx + 1 }}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            class="hidden" 
                            @change="handlePhotoUpload($event, student.student_id, idx)" 
                          />
                        </label>
                      </template>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Import Excel Modal -->
    <BaseModal :show="showImportModal" title="Import Data Akademik Rapor Kelas via Excel" @close="showImportModal = false; importResult = null; importFile = null">
      <div class="space-y-5">
        <!-- Instructions -->
        <div class="flex items-start gap-3 p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-100 dark:border-violet-900/50">
          <FileSpreadsheet class="text-violet-500 shrink-0 mt-0.5" :size="18" />
          <div class="text-xs text-violet-700 dark:text-violet-300">
            <p class="font-bold mb-1">Panduan Import</p>
            <ol class="list-decimal ml-4 space-y-0.5 text-violet-600 dark:text-violet-400">
              <li>Unduh template Excel ter-update terlebih dahulu dengan menekan tombol <strong>Unduh Template</strong> di halaman ini.</li>
              <li>Isi atau edit baris data siswa yang terletak di bagian bawah (baris ke-9 dan seterusnya).</li>
              <li>Jangan merubah kolom <strong>ID Siswa</strong>, NIS, NISN, atau Nama agar sinkronisasi data tidak gagal.</li>
              <li>Unggah file Excel hasil pengisian Anda di sini.</li>
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
              <p v-else class="text-sm text-slate-400 dark:text-zinc-555 truncate">Klik untuk memilih file atau seret ke sini</p>
            </div>
            <input type="file" accept=".xlsx,.xls" class="hidden" @change="onFileChange" />
          </label>
        </div>

        <!-- Import result -->
        <div v-if="importResult" class="space-y-2 animate-in fade-in duration-300">
          <div v-if="importResult.success" class="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-lg px-4 py-3">
            <CheckCircle class="text-emerald-500 shrink-0" :size="18" />
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Sukses</p>
              <p class="text-xs font-semibold text-emerald-700 dark:text-emerald-350">Berhasil meng-import data rapor untuk {{ importResult.importedCount }} siswa.</p>
            </div>
          </div>
          
          <div v-else class="space-y-2">
            <div class="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-lg px-4 py-3">
              <AlertCircle class="text-rose-500 shrink-0" :size="18" />
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Import Gagal</p>
                <p class="text-xs font-semibold text-rose-700 dark:text-rose-350">Terdapat error data pada file template Excel Anda.</p>
              </div>
            </div>
            
            <div v-if="importResult.errors" class="bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-100 dark:border-rose-900/50 p-3 max-h-40 overflow-y-auto">
              <p class="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-2">Detail Error</p>
              <ul class="space-y-1">
                <template v-for="(errs, rowKey) in importResult.errors" :key="rowKey">
                  <li v-for="(err, i) in errs" :key="i" class="text-xs text-rose-750 dark:text-rose-300 flex gap-2">
                    <X :size="11" class="shrink-0 mt-0.5" /> <strong>{{ rowKey }}</strong>: {{ err }}
                  </li>
                </template>
              </ul>
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showImportModal = false; importResult = null; importFile = null">Tutup</BaseButton>
          <BaseButton variant="primary" @click="handleImport" :disabled="!importFile || importLoading">
            <Upload class="mr-1.5" :size="14" />
            {{ importLoading ? 'Sedang Import...' : 'Mulai Import' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal Lampiran Surat Izin Siswa -->
    <BaseModal :show="!!selectedLeaveAttachment" title="Lampiran Surat Dokter / Keterangan" @close="selectedLeaveAttachment = null">
      <div class="space-y-4 text-center">
        <div class="max-h-[70vh] overflow-auto rounded-lg border border-slate-200 dark:border-zinc-800 p-2 bg-slate-50 dark:bg-zinc-950">
          <img 
            :src="selectedLeaveAttachment || ''" 
            alt="Lampiran Surat" 
            class="max-w-full h-auto mx-auto rounded shadow-sm"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <a :href="selectedLeaveAttachment || '#'" target="_blank" class="px-3 py-1.5 text-xs font-semibold text-violet-600 hover:underline flex items-center gap-1">
            <Eye :size="13" /> Buka Tab Baru
          </a>
          <BaseButton variant="outline" size="sm" @click="selectedLeaveAttachment = null">Tutup</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
