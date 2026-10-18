<script setup lang="ts">
import {
  BarChart3,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  Info,
  CalendarCheck,
  Send,
  HelpCircle,
  X,
  ExternalLink,
  SlidersHorizontal,
  Check,
  TrendingUp,
  AlertCircle,
  HeartHandshake
} from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseInput, BaseModal, BaseDateInput } from '@eduraport/ui'
import MoodAnalytics from '../components/scanner/MoodAnalytics.vue'
import { useApi } from '../composables/useApi'
import { useSchoolContext } from '../composables/useSchoolContext'
import { useClass } from '../composables/useClass'
import { useAcademicYear } from '../composables/useAcademicYear'
import { useToast } from '../composables/useToast'

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

const { fetcher } = useApi()
const { isSchoolLocked, selectedFoundationId, selectedSchoolId, foundations, schools, initContext, onFoundationChange } = useSchoolContext()
const { classes, fetchClasses } = useClass()
const { academicYears, fetchAcademicYears } = useAcademicYear()
const toast = useToast()

// Date helpers
const getTodayStr = () => new Date().toISOString().split('T')[0]
const getFirstDayOfMonthStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const toDateInputStr = (val: any): string => {
  if (!val) return ''
  if (typeof val === 'string') {
    if (val.includes('T')) return val.split('T')[0]
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
    const d = new Date(val)
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    return val.substring(0, 10)
  }
  if (val instanceof Date) {
    const y = val.getFullYear()
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const day = String(val.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return String(val)
}

// State & Filters
const route = useRoute()
const isLoading = ref(true)
const activeTab = ref<'audit' | 'classes' | 'students' | 'mood'>(
  (route.query.tab as any) === 'mood' ? 'mood' : 'audit'
)
const startDate = ref(getFirstDayOfMonthStr())
const endDate = ref(getTodayStr())
const selectedClassId = ref('')
const selectedAcademicYearId = ref('')
const selectedSemester = ref<'1' | '2'>('1')
const searchQuery = ref('')

const currentAcademicYear = computed(() => {
  if (!selectedAcademicYearId.value) return null
  return academicYears.value.find((y: any) => y.id === selectedAcademicYearId.value) || null
})

const syncDatesWithAcademicYear = (ay: any) => {
  if (!ay) return
  const start = toDateInputStr(ay.start_date)
  const end = toDateInputStr(ay.end_date)
  if (!start || !end) return

  startDate.value = start
  const today = getTodayStr()
  if (ay.is_active && today >= start && today <= end) {
    endDate.value = today
  } else if (today < start) {
    endDate.value = start
  } else {
    endDate.value = end
  }
}

// Analytics Response Data
const analytics = ref<{
  startDate: string
  endDate: string
  effective_days_count: number
  effective_days: string[]
  submission_rate: number
  total_expected_submissions: number
  total_actual_submissions: number
  missing_submissions: Array<{
    date: string
    day_name: string
    class_id: string
    class_name: string
    status: string
    reason: string
  }>
  class_recap: Array<{
    class_id: string
    class_name: string
    total_students: number
    effective_days: number
    missing_days_count: number
    average_attendance_percentage: number
    total_hadir: number
    total_sakit: number
    total_izin: number
    total_alpa: number
    total_terlambat: number
  }>
  student_recap: Array<{
    student_id: string
    full_name: string
    student_number: string
    class_id: string
    class_name: string
    hadir: number
    sakit: number
    izin: number
    alpa: number
    terlambat: number
    total_recorded: number
    effective_days_count: number
    attendance_percentage: number
  }>
  available_classes?: Array<{
    id: string
    class_name: string
    level?: string
  }>
}>({
  startDate: '',
  endDate: '',
  available_classes: [],
  effective_days_count: 0,
  effective_days: [],
  submission_rate: 0,
  total_expected_submissions: 0,
  total_actual_submissions: 0,
  missing_submissions: [],
  class_recap: [],
  student_recap: []
})

// Sync Modal State
const showSyncModal = ref(false)
const isSyncing = ref(false)
const syncSemester = ref<'1' | '2'>('1')
const adjustments = ref<Record<string, { sick: number; leave: number; absent: number; note: string }>>({})
const syncStudentSearch = ref('')

// Quick Date Range Preset
const applyPreset = (preset: 'this_month' | 'last_month' | 'sem1' | 'sem2' | 'full_year') => {
  const ay = currentAcademicYear.value
  const today = getTodayStr()

  if (preset === 'full_year' && ay) {
    startDate.value = toDateInputStr(ay.start_date)
    endDate.value = ay.is_active && today >= toDateInputStr(ay.start_date) && today <= toDateInputStr(ay.end_date)
      ? today
      : toDateInputStr(ay.end_date)
  } else if (preset === 'this_month') {
    const now = new Date()
    const year = now.getFullYear()
    const monthStr = String(now.getMonth() + 1).padStart(2, '0')
    let s = `${year}-${monthStr}-01`
    let e = today

    if (ay) {
      const ayStart = toDateInputStr(ay.start_date)
      const ayEnd = toDateInputStr(ay.end_date)
      if (s < ayStart) s = ayStart
      if (e > ayEnd) e = ayEnd
      if (s > e) {
        s = ayStart
        e = ayEnd
      }
    }
    startDate.value = s
    endDate.value = e
  } else if (preset === 'last_month') {
    const now = new Date()
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayPrev = new Date(now.getFullYear(), now.getMonth(), 0)
    let s = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`
    let e = `${lastDayPrev.getFullYear()}-${String(lastDayPrev.getMonth() + 1).padStart(2, '0')}-${String(lastDayPrev.getDate()).padStart(2, '0')}`
    if (ay) {
      const ayStart = toDateInputStr(ay.start_date)
      const ayEnd = toDateInputStr(ay.end_date)
      if (s < ayStart) s = ayStart
      if (e > ayEnd) e = ayEnd
      if (s > e) {
        s = ayStart
        e = ayEnd
      }
    }
    startDate.value = s
    endDate.value = e
  } else if (preset === 'sem1') {
    if (ay) {
      const ayStart = toDateInputStr(ay.start_date)
      const startYear = parseInt(ayStart.split('-')[0])
      startDate.value = ayStart
      const sem1End = `${startYear}-12-31`
      const ayEnd = toDateInputStr(ay.end_date)
      endDate.value = sem1End > ayEnd ? ayEnd : sem1End
    } else {
      const year = new Date().getFullYear()
      startDate.value = `${year}-07-01`
      endDate.value = `${year}-12-31`
    }
    syncSemester.value = '1'
    selectedSemester.value = '1'
  } else if (preset === 'sem2') {
    if (ay) {
      const ayEnd = toDateInputStr(ay.end_date)
      const endYear = parseInt(ayEnd.split('-')[0])
      const sem2Start = `${endYear}-01-01`
      const ayStart = toDateInputStr(ay.start_date)
      startDate.value = sem2Start < ayStart ? ayStart : sem2Start
      endDate.value = ayEnd
    } else {
      const year = new Date().getFullYear()
      startDate.value = `${year}-01-01`
      endDate.value = `${year}-06-30`
    }
    syncSemester.value = '2'
    selectedSemester.value = '2'
  }
  loadAnalytics()
}

// Load Analytics
const loadAnalytics = async () => {
  if (!selectedSchoolId.value) return
  isLoading.value = true

  try {
    const schoolId = selectedSchoolId.value
    const params = new URLSearchParams()
    if (startDate.value) params.append('startDate', startDate.value)
    if (endDate.value) params.append('endDate', endDate.value)
    if (selectedClassId.value) params.append('classId', selectedClassId.value)
    if (selectedAcademicYearId.value) params.append('academicYearId', selectedAcademicYearId.value)

    const res: any = await fetcher(`/school/${schoolId}/attendance/analytics/summary?${params.toString()}`)
    if (res && res.data) {
      analytics.value = res.data
    }
  } catch (err: any) {
    toast.error(err?.message || 'Gagal memuat analitik presensi.')
  } finally {
    isLoading.value = false
  }
}

// Filtered classes by academic year and having active students
const filteredClasses = computed(() => {
  if (analytics.value.available_classes && analytics.value.available_classes.length > 0) {
    return analytics.value.available_classes
  }
  if (!selectedAcademicYearId.value) return classes.value
  return classes.value.filter((c: any) => c.academic_year_id === selectedAcademicYearId.value)
})

const onAcademicYearChange = async () => {
  if (selectedClassId.value) {
    const cls = classes.value.find((c: any) => c.id === selectedClassId.value)
    if (cls && selectedAcademicYearId.value && cls.academic_year_id !== selectedAcademicYearId.value) {
      selectedClassId.value = ''
    }
  }
  const ay = currentAcademicYear.value
  if (ay) {
    syncDatesWithAcademicYear(ay)
  }
  await loadAnalytics()
}

// Filtered lists
const filteredMissingSubmissions = computed(() => {
  let list = analytics.value.missing_submissions || []
  if (selectedClassId.value) {
    list = list.filter((m) => m.class_id === selectedClassId.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((m) => m.class_name.toLowerCase().includes(q) || m.date.includes(q) || m.day_name.toLowerCase().includes(q))
  }
  return list
})

const filteredStudentRecap = computed(() => {
  let list = analytics.value.student_recap || []
  if (selectedClassId.value) {
    list = list.filter((s) => s.class_id === selectedClassId.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.student_number && s.student_number.toLowerCase().includes(q)) ||
        s.class_name.toLowerCase().includes(q)
    )
  }
  return list
})

const filteredSyncStudents = computed(() => {
  let list = analytics.value.student_recap || []
  if (selectedClassId.value) {
    list = list.filter((s) => s.class_id === selectedClassId.value)
  }
  if (syncStudentSearch.value.trim()) {
    const q = syncStudentSearch.value.toLowerCase()
    list = list.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.student_number && s.student_number.toLowerCase().includes(q)) ||
        s.class_name.toLowerCase().includes(q)
    )
  }
  return list
})

// Initialize adjustments object
const initAdjustments = () => {
  const map: Record<string, { sick: number; leave: number; absent: number; note: string }> = {}
  for (const st of analytics.value.student_recap) {
    map[st.student_id] = {
      sick: 0,
      leave: 0,
      absent: 0,
      note: ''
    }
  }
  adjustments.value = map
}

const openSyncModal = () => {
  initAdjustments()
  showSyncModal.value = true
}

const executeSyncToHomeroom = async () => {
  if (!selectedSchoolId.value) return
  isSyncing.value = true

  try {
    const payloadAdjustments = Object.entries(adjustments.value)
      .filter(([_, v]) => (v.sick > 0 || v.leave > 0 || v.absent > 0))
      .map(([student_id, v]) => ({
        student_id,
        additional_sick: Number(v.sick) || 0,
        additional_leave: Number(v.leave) || 0,
        additional_absent: Number(v.absent) || 0,
        note: v.note || 'Kompensasi pra-onboarding'
      }))

    const res: any = await fetcher(`/school/${selectedSchoolId.value}/attendance/analytics/sync-to-homeroom`, {
      method: 'POST',
      body: JSON.stringify({
        semester: syncSemester.value,
        academicYearId: selectedAcademicYearId.value || undefined,
        classId: selectedClassId.value || undefined,
        startDate: startDate.value,
        endDate: endDate.value,
        adjustments: payloadAdjustments
      })
    })

    if (res?.success) {
      toast.success(res.message || 'Berhasil menyinkronkan data presensi ke Rapor Semester!')
      showSyncModal.value = false
    } else {
      toast.error(res?.message || 'Gagal sinkronisasi data rapor.')
    }
  } catch (err: any) {
    toast.error(err?.message || 'Terjadi kesalahan saat menyinkronkan ke rapor.')
  } finally {
    isSyncing.value = false
  }
}

// Navigation to daily attendance input
const goToAttendanceInput = (classId: string, date: string) => {
  navigateTo(`/student/attendance?classId=${classId}&date=${date}`)
}

// On mount
onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    selectedSchoolId.value = schoolId
    await Promise.all([
      fetchClasses(schoolId),
      fetchAcademicYears(schoolId)
    ])
    // Determine active academic year
    const activeYear = academicYears.value.find((y: any) => y.is_active)
    if (activeYear) {
      selectedAcademicYearId.value = activeYear.id
      syncDatesWithAcademicYear(activeYear)
    }
    await loadAnalytics()
  }
})

// Watchers
watch(selectedSchoolId, async (newId) => {
  if (newId) {
    await Promise.all([
      fetchClasses(newId),
      fetchAcademicYears(newId)
    ])
    await loadAnalytics()
  }
})

watch(() => route.query.tab, (newTab) => {
  if (newTab === 'mood' || newTab === 'audit' || newTab === 'classes' || newTab === 'students') {
    activeTab.value = newTab as any
  }
})
</script>

<template>
  <div class="space-y-6 pb-16">
    <!-- Header Page -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="p-2 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            <BarChart3 class="w-6 h-6" />
          </span>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Analitik & Rekapitulasi Presensi
          </h1>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Audit kepatuhan pengisian presensi guru, pantau hari bolong sekolah, dan sinkronkan rekap ke Rapor Semester.
        </p>
      </div>

      <!-- Header Actions -->
      <div class="flex flex-wrap items-center gap-2.5">
        <BaseButton
          variant="outline"
          size="sm"
          :loading="isLoading"
          @click="loadAnalytics"
          class="gap-1.5 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          <span>Segarkan Data</span>
        </BaseButton>

        <BaseButton
          variant="primary"
          size="sm"
          class="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/20"
          @click="openSyncModal"
        >
          <Sparkles class="w-4 h-4 text-amber-300" />
          <span>Sinkronkan ke Rapor</span>
        </BaseButton>
      </div>
    </div>

    <!-- Filter & Date Controls Card -->
    <BaseCard overflow="visible" class="p-5 border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl shadow-sm relative z-30 overflow-visible">
      <div class="space-y-4">
        <!-- School Selector (if multi-school) -->
        <div v-if="!isSchoolLocked && schools.length > 1" class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div v-if="foundations.length > 1">
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Yayasan</label>
            <select
              v-model="selectedFoundationId"
              @change="onFoundationChange"
              class="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
            >
              <option v-for="f in foundations" :key="f.id" :value="f.id">{{ f.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Unit Sekolah</label>
            <select
              v-model="selectedSchoolId"
              class="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
            >
              <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
        </div>

        <!-- Filter Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <!-- Class Filter -->
          <div>
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers class="w-3.5 h-3.5 text-slate-400" />
              <span>Rombongan Belajar</span>
            </label>
            <select
              v-model="selectedClassId"
              @change="loadAnalytics"
              class="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Semua Rombel (Seluruh Kelas)</option>
              <option v-for="c in filteredClasses" :key="c.id" :value="c.id">{{ c.class_name }}</option>
            </select>
          </div>

          <!-- Academic Year Filter -->
          <div>
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <CalendarCheck class="w-3.5 h-3.5 text-slate-400" />
              <span>Tahun Ajaran</span>
            </label>
            <select
              v-model="selectedAcademicYearId"
              @change="onAcademicYearChange"
              class="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Semua Tahun Ajaran</option>
              <option v-for="y in academicYears" :key="y.id" :value="y.id">
                {{ y.name }} {{ y.is_active ? '★ (Aktif)' : '' }}
              </option>
            </select>
            <p v-if="currentAcademicYear" class="mt-1 text-[11px] text-violet-600 dark:text-violet-400 font-medium">
              Rentang TA: {{ toDateInputStr(currentAcademicYear.start_date) }} s/d {{ toDateInputStr(currentAcademicYear.end_date) }}
            </p>
          </div>

          <!-- Start Date -->
          <div>
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-slate-400" />
              <span>Dari Tanggal</span>
            </label>
            <BaseDateInput
              v-model="startDate"
              :min="currentAcademicYear ? toDateInputStr(currentAcademicYear.start_date) : undefined"
              :max="currentAcademicYear ? toDateInputStr(currentAcademicYear.end_date) : undefined"
              @update:model-value="loadAnalytics"
              placeholder="Pilih Tanggal Mulai"
            />
          </div>

          <!-- End Date -->
          <div>
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-slate-400" />
              <span>Sampai Tanggal</span>
            </label>
            <BaseDateInput
              v-model="endDate"
              :min="currentAcademicYear ? toDateInputStr(currentAcademicYear.start_date) : undefined"
              :max="currentAcademicYear ? toDateInputStr(currentAcademicYear.end_date) : undefined"
              @update:model-value="loadAnalytics"
              placeholder="Pilih Tanggal Akhir"
            />
          </div>
        </div>

        <!-- Quick Presets -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <SlidersHorizontal class="w-3.5 h-3.5" />
            <span class="font-medium">Rentang Cepat:</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-if="currentAcademicYear"
              type="button"
              @click="applyPreset('full_year')"
              class="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-medium transition-colors"
            >
              1 Tahun Ajaran Penuh
            </button>
            <button
              type="button"
              @click="applyPreset('sem1')"
              class="px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-medium transition-colors"
            >
              Semester 1 (Ganjil)
            </button>
            <button
              type="button"
              @click="applyPreset('sem2')"
              class="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium transition-colors"
            >
              Semester 2 (Genap)
            </button>
            <button
              type="button"
              @click="applyPreset('this_month')"
              class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Bulan Ini
            </button>
            <button
              type="button"
              @click="applyPreset('last_month')"
              class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Bulan Lalu
            </button>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Executive KPI Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Card 1: Submission Rate -->
      <BaseCard class="p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm relative overflow-hidden group">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kepatuhan Guru</span>
          <span
            class="px-2 py-0.5 rounded-full text-xs font-bold"
            :class="analytics.submission_rate >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : analytics.submission_rate >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'"
          >
            {{ analytics.submission_rate }}%
          </span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {{ analytics.total_actual_submissions }}
          </span>
          <span class="text-xs text-slate-500 dark:text-slate-400">
            / {{ analytics.total_expected_submissions }} Hari Kelas
          </span>
        </div>
        <!-- Progress bar -->
        <div class="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="analytics.submission_rate >= 80 ? 'bg-emerald-500' : analytics.submission_rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'"
            :style="{ width: `${Math.min(analytics.submission_rate, 100)}%` }"
          ></div>
        </div>
        <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
          Rasio pengisian presensi oleh guru wali kelas
        </p>
      </BaseCard>

      <!-- Card 2: Hari Efektif Belajar -->
      <BaseCard class="p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hari Efektif</span>
          <span class="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <CalendarCheck class="w-4 h-4" />
          </span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {{ analytics.effective_days_count }}
          </span>
          <span class="text-xs text-slate-500 dark:text-slate-400">Hari Belajar</span>
        </div>
        <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
          Sudah mengecualikan libur nasional & kalender khusus pesantren
        </p>
      </BaseCard>

      <!-- Card 3: Hari Bolong (Missing Days Alert) -->
      <BaseCard
        class="p-5 border rounded-2xl shadow-sm relative overflow-hidden transition-all"
        :class="analytics.missing_submissions.length > 0 ? 'border-amber-300 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20' : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider" :class="analytics.missing_submissions.length > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'">
            Hari Belum Diabsen
          </span>
          <span class="p-1.5 rounded-lg" :class="analytics.missing_submissions.length > 0 ? 'bg-amber-200/60 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'">
            <AlertTriangle class="w-4 h-4" />
          </span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-3xl font-black tracking-tight" :class="analytics.missing_submissions.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'">
            {{ analytics.missing_submissions.length }}
          </span>
          <span class="text-xs text-slate-500 dark:text-slate-400">Kasus Lupa Diisi</span>
        </div>
        <p class="text-[11px] mt-3" :class="analytics.missing_submissions.length > 0 ? 'text-amber-700 dark:text-amber-300/80 font-medium' : 'text-slate-400 dark:text-slate-500'">
          {{ analytics.missing_submissions.length > 0 ? 'Perlu tindakan input susulan oleh guru/TU' : 'Hebat! Semua hari efektif sudah diabsen' }}
        </p>
      </BaseCard>

      <!-- Card 4: Total Rombel & Siswa -->
      <BaseCard class="p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cakupan Data</span>
          <span class="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
            <Users class="w-4 h-4" />
          </span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {{ analytics.student_recap.length }}
          </span>
          <span class="text-xs text-slate-500 dark:text-slate-400">
            Siswa ({{ analytics.class_recap.length }} Rombel)
          </span>
        </div>
        <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
          Siap diekspor atau disinkronkan ke rapor wali kelas
        </p>
      </BaseCard>
    </div>

    <!-- Main Navigation Tabs -->
    <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
      <button
        type="button"
        @click="activeTab = 'audit'"
        class="pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap"
        :class="activeTab === 'audit' ? 'border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'"
      >
        <AlertTriangle class="w-4 h-4" />
        <span>Audit Kepatuhan Guru</span>
        <span
          v-if="analytics.missing_submissions.length > 0"
          class="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400"
        >
          {{ analytics.missing_submissions.length }}
        </span>
      </button>

      <button
        type="button"
        @click="activeTab = 'classes'"
        class="pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap"
        :class="activeTab === 'classes' ? 'border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'"
      >
        <Layers class="w-4 h-4" />
        <span>Rekapitulasi Rombel</span>
        <span class="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          {{ analytics.class_recap.length }}
        </span>
      </button>

      <button
        type="button"
        @click="activeTab = 'students'"
        class="pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap"
        :class="activeTab === 'students' ? 'border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'"
      >
        <Users class="w-4 h-4" />
        <span>Rekapitulasi Siswa & Rapor</span>
        <span class="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          {{ analytics.student_recap.length }}
        </span>
      </button>

      <button
        type="button"
        @click="activeTab = 'mood'"
        class="pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap"
        :class="activeTab === 'mood' ? 'border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'"
      >
        <HeartHandshake class="w-4 h-4" />
        <span>Mood Emosi & Care Alert</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400">
          Live Heatmap
        </span>
      </button>
    </div>

    <!-- TAB 1: AUDIT KEPATUHAN GURU & HARI BOLONG -->
    <div v-if="activeTab === 'audit'" class="space-y-4">
      <!-- Search & Notice bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 p-4 rounded-2xl">
        <div class="flex items-start gap-3">
          <Info class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 class="text-sm font-bold text-slate-900 dark:text-white">
              Deteksi Hari Bolong (Missing Submissions)
            </h4>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Menampilkan daftar tanggal hari efektif sekolah di mana guru belum menginput data absensi harian. Klik <b>"Input Presensi Sekarang"</b> untuk melengkapi data secara instan.
            </p>
          </div>
        </div>
        <div class="sm:w-64">
          <BaseInput
            v-model="searchQuery"
            placeholder="Cari kelas atau tanggal..."
            class="text-xs"
          >
            <template #prefix>
              <Search class="w-3.5 h-3.5 text-slate-400" />
            </template>
          </BaseInput>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredMissingSubmissions.length === 0"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center"
      >
        <div class="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
          <CheckCircle2 class="w-8 h-8" />
        </div>
        <h3 class="text-base font-bold text-slate-900 dark:text-white">
          Kepatuhan Sempurna 100%!
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
          Tidak ditemukan hari belajar yang terlupa pada rentang tanggal ini. Seluruh rombongan belajar telah diabsen dengan tertib.
        </p>
      </div>

      <!-- Missing Submissions Table -->
      <div v-else class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table class="w-full text-left text-sm text-slate-700 dark:text-slate-300">
          <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="px-5 py-3.5">Tanggal Bolong</th>
              <th class="px-5 py-3.5">Hari</th>
              <th class="px-5 py-3.5">Kelas / Rombel</th>
              <th class="px-5 py-3.5">Status Pengisian</th>
              <th class="px-5 py-3.5 text-right">Aksi Tindak Lanjut</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="(item, idx) in filteredMissingSubmissions"
              :key="idx"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td class="px-5 py-4 font-mono font-medium text-slate-900 dark:text-white text-xs">
                {{ item.date }}
              </td>
              <td class="px-5 py-4 font-medium">
                {{ item.day_name }}
              </td>
              <td class="px-5 py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Layers class="w-3.5 h-3.5 text-violet-500" />
                  {{ item.class_name }}
                </span>
              </td>
              <td class="px-5 py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                  <AlertCircle class="w-3.5 h-3.5" />
                  Belum Ada Data Input
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <BaseButton
                  size="sm"
                  variant="outline"
                  class="gap-1.5 text-xs text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-700/50 hover:bg-violet-50 dark:hover:bg-violet-950/40"
                  @click="goToAttendanceInput(item.class_id, item.date)"
                >
                  <span>Input Presensi</span>
                  <ArrowRight class="w-3.5 h-3.5" />
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 2: REKAPITULASI ROMBEL & KELAS -->
    <div v-if="activeTab === 'classes'" class="space-y-4">
      <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table class="w-full text-left text-sm text-slate-700 dark:text-slate-300">
          <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="px-5 py-3.5">Nama Kelas</th>
              <th class="px-5 py-3.5 text-center">Siswa</th>
              <th class="px-5 py-3.5 text-center">Hari Efektif</th>
              <th class="px-5 py-3.5 text-center">Hari Bolong</th>
              <th class="px-5 py-3.5 text-center">% Rata-rata</th>
              <th class="px-5 py-3.5 text-center text-emerald-600 dark:text-emerald-400">Hadir</th>
              <th class="px-5 py-3.5 text-center text-blue-600 dark:text-blue-400">Sakit</th>
              <th class="px-5 py-3.5 text-center text-amber-600 dark:text-amber-400">Izin</th>
              <th class="px-5 py-3.5 text-center text-rose-600 dark:text-rose-400">Alpa</th>
              <th class="px-5 py-3.5 text-center text-purple-600 dark:text-purple-400">Terlambat</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="c in analytics.class_recap"
              :key="c.class_id"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td class="px-5 py-4 font-bold text-slate-900 dark:text-white">
                {{ c.class_name }}
              </td>
              <td class="px-5 py-4 text-center font-semibold">
                {{ c.total_students }}
              </td>
              <td class="px-5 py-4 text-center text-slate-500 font-mono text-xs">
                {{ c.effective_days }}
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-bold"
                  :class="c.missing_days_count > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'"
                >
                  {{ c.missing_days_count }}
                </span>
              </td>
              <td class="px-5 py-4 text-center font-bold">
                <span
                  class="px-2.5 py-1 rounded-lg text-xs"
                  :class="c.average_attendance_percentage >= 85 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'"
                >
                  {{ c.average_attendance_percentage }}%
                </span>
              </td>
              <td class="px-5 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                {{ c.total_hadir }}
              </td>
              <td class="px-5 py-4 text-center font-medium text-blue-600 dark:text-blue-400">
                {{ c.total_sakit }}
              </td>
              <td class="px-5 py-4 text-center font-medium text-amber-600 dark:text-amber-400">
                {{ c.total_izin }}
              </td>
              <td class="px-5 py-4 text-center font-bold text-rose-600 dark:text-rose-400">
                {{ c.total_alpa }}
              </td>
              <td class="px-5 py-4 text-center font-medium text-purple-600 dark:text-purple-400">
                {{ c.total_terlambat }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 3: REKAPITULASI SISWA & SINKRONISASI RAPOR -->
    <div v-if="activeTab === 'students'" class="space-y-4">
      <!-- Search & Sync CTA Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div class="sm:w-80">
          <BaseInput
            v-model="searchQuery"
            placeholder="Cari nama atau NIS siswa..."
            class="text-xs"
          >
            <template #prefix>
              <Search class="w-3.5 h-3.5 text-slate-400" />
            </template>
          </BaseInput>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan {{ filteredStudentRecap.length }} Siswa
          </span>
          <BaseButton
            variant="primary"
            size="sm"
            class="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            @click="openSyncModal"
          >
            <Sparkles class="w-4 h-4 text-amber-300" />
            <span>Sinkronkan ke Rapor</span>
          </BaseButton>
        </div>
      </div>

      <!-- Students Table -->
      <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table class="w-full text-left text-sm text-slate-700 dark:text-slate-300">
          <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="px-5 py-3.5">NIS</th>
              <th class="px-5 py-3.5">Nama Lengkap Siswa</th>
              <th class="px-5 py-3.5">Kelas</th>
              <th class="px-5 py-3.5 text-center text-emerald-600 dark:text-emerald-400">Hadir (H)</th>
              <th class="px-5 py-3.5 text-center text-blue-600 dark:text-blue-400">Sakit (S)</th>
              <th class="px-5 py-3.5 text-center text-amber-600 dark:text-amber-400">Izin (I)</th>
              <th class="px-5 py-3.5 text-center text-rose-600 dark:text-rose-400">Alpa (A)</th>
              <th class="px-5 py-3.5 text-center text-purple-600 dark:text-purple-400">Terlambat</th>
              <th class="px-5 py-3.5 text-center">% Kehadiran</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="s in filteredStudentRecap"
              :key="s.student_id"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td class="px-5 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                {{ s.student_number || '-' }}
              </td>
              <td class="px-5 py-4 font-bold text-slate-900 dark:text-white">
                {{ s.full_name }}
              </td>
              <td class="px-5 py-4 text-xs font-medium">
                {{ s.class_name }}
              </td>
              <td class="px-5 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                {{ s.hadir }}
              </td>
              <td class="px-5 py-4 text-center font-medium text-blue-600 dark:text-blue-400">
                {{ s.sakit }}
              </td>
              <td class="px-5 py-4 text-center font-medium text-amber-600 dark:text-amber-400">
                {{ s.izin }}
              </td>
              <td class="px-5 py-4 text-center font-bold text-rose-600 dark:text-rose-400">
                {{ s.alpa }}
              </td>
              <td class="px-5 py-4 text-center font-medium text-purple-600 dark:text-purple-400">
                {{ s.terlambat }}
              </td>
              <td class="px-5 py-4 text-center font-bold">
                <span
                  class="px-2 py-0.5 rounded-full text-xs"
                  :class="s.attendance_percentage >= 85 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'"
                >
                  {{ s.attendance_percentage }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 4: MOOD EMOSI & CARE ALERT -->
    <div v-if="activeTab === 'mood'" class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-violet-500/10 dark:bg-violet-950/25 border border-violet-500/20 dark:border-violet-900/50 rounded-2xl">
        <div class="flex items-start gap-3">
          <HeartHandshake class="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
          <div>
            <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Analitik Mood Emosional & Care Alert Siswa</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-600 dark:text-violet-300">
                Terintegrasi Satu Pintu
              </span>
            </h4>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Heatmap emosi harian (senang, sedih, kesal, lelah) hasil check-in presensi scanner, grafik tren individu, dan tindak lanjut Care Alert ke BK atau Catatan Anekdot TK.
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm min-h-[500px]">
        <MoodAnalytics 
          :school-id="selectedSchoolId"
          :class-id="selectedClassId"
          :start-date="startDate"
          :end-date="endDate"
          :sync-with-parent-filters="true"
        />
      </div>
    </div>

    <!-- MODAL SINKRONISASI RAPOR (MID-YEAR ONBOARDING SOLUTION) -->
    <BaseModal
      v-model="showSyncModal"
      title="Sinkronisasi Presensi ke Rapor Semester"
      size="xl"
    >
      <div class="space-y-5">
        <!-- Callout Banner: Mid-Year Onboarding Solution -->
        <div class="p-4 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/25 space-y-2">
          <div class="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
            <Sparkles class="w-4 h-4 text-amber-400" />
            <span>Solusi Sekolah Baru Bergabung (Mid-Year Onboarding)</span>
          </div>
          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Jika sekolah Anda baru menggunakan aplikasi di pertengahan semester (misal: <b>bulan September</b>), data presensi harian bulan Juli–Agustus yang belum tercatat dapat Anda lengkapi melalui kolom <b>Kompensasi Manual</b> di bawah ini. Nilai akumulasi akan langsung masuk ke lembar Rapor Semester resmi murid!
          </p>
        </div>

        <!-- Semester & Range Selection -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Target Semester Rapor</label>
            <select
              v-model="syncSemester"
              class="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
            >
              <option value="1">Semester 1 (Ganjil)</option>
              <option value="2">Semester 2 (Genap)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Cari Siswa untuk Kompensasi</label>
            <BaseInput
              v-model="syncStudentSearch"
              placeholder="Ketik nama murid..."
              class="text-xs"
            >
              <template #prefix>
                <Search class="w-3.5 h-3.5 text-slate-400" />
              </template>
            </BaseInput>
          </div>
        </div>

        <!-- Compensation Table -->
        <div class="overflow-x-auto max-h-96 rounded-xl border border-slate-200 dark:border-slate-800">
          <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead class="bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th class="px-4 py-2.5">Siswa</th>
                <th class="px-3 py-2.5 text-center">Rekap Harian</th>
                <th class="px-3 py-2.5 text-center text-blue-600 dark:text-blue-400">+ Tambah Sakit</th>
                <th class="px-3 py-2.5 text-center text-amber-600 dark:text-amber-400">+ Tambah Izin</th>
                <th class="px-3 py-2.5 text-center text-rose-600 dark:text-rose-400">+ Tambah Alpa</th>
                <th class="px-4 py-2.5 text-center font-bold">Total Rapor Akhir</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr
                v-for="st in filteredSyncStudents"
                :key="st.student_id"
                class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
              >
                <td class="px-4 py-3">
                  <div class="font-bold text-slate-900 dark:text-white">{{ st.full_name }}</div>
                  <div class="text-[10px] text-slate-400 font-mono">{{ st.student_number || '-' }} • {{ st.class_name }}</div>
                </td>
                <td class="px-3 py-3 text-center text-[11px] font-mono">
                  H:{{ st.hadir }} | S:{{ st.sakit }} | I:{{ st.izin }} | A:{{ st.alpa }}
                </td>
                <td class="px-3 py-3 text-center">
                  <input
                    v-if="adjustments[st.student_id]"
                    type="number"
                    min="0"
                    v-model.number="adjustments[st.student_id].sick"
                    class="w-16 text-center text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1"
                  />
                </td>
                <td class="px-3 py-3 text-center">
                  <input
                    v-if="adjustments[st.student_id]"
                    type="number"
                    min="0"
                    v-model.number="adjustments[st.student_id].leave"
                    class="w-16 text-center text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1"
                  />
                </td>
                <td class="px-3 py-3 text-center">
                  <input
                    v-if="adjustments[st.student_id]"
                    type="number"
                    min="0"
                    v-model.number="adjustments[st.student_id].absent"
                    class="w-16 text-center text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1"
                  />
                </td>
                <td class="px-4 py-3 text-center font-mono font-bold text-violet-600 dark:text-violet-400">
                  <span v-if="adjustments[st.student_id]">
                    S:{{ st.sakit + (adjustments[st.student_id].sick || 0) }} |
                    I:{{ st.izin + (adjustments[st.student_id].leave || 0) }} |
                    A:{{ st.alpa + (adjustments[st.student_id].absent || 0) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <BaseButton
            variant="outline"
            size="sm"
            @click="showSyncModal = false"
            :disabled="isSyncing"
          >
            Batal
          </BaseButton>
          <BaseButton
            variant="primary"
            size="sm"
            :loading="isSyncing"
            @click="executeSyncToHomeroom"
            class="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Check class="w-4 h-4" />
            <span>Konfirmasi & Sinkronkan Sekarang</span>
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
