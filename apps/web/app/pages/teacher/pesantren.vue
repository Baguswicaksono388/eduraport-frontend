<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import {
  BookMarked,
  BookOpen,
  Clock,
  Sparkles,
  CheckCircle2,
  Award,
  Sun,
  Moon,
  Users,
  Save,
  Trash2,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  ShieldCheck,
  Filter,
  FileText,
  Search,
  BarChart3,
  TrendingUp,
  UserCheck,
  Trophy,
  Activity,
  Percent,
  Building2,
  Layers
} from 'lucide-vue-next'
import { BaseCard, BaseButton } from '@eduraport/ui'
import AppPagination from '../../components/AppPagination.vue'
import { useSchoolContext } from '../../composables/useSchoolContext'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useClass } from '../../composables/useClass'
import { usePesantren } from '../../composables/usePesantren'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'

definePageMeta({
  roles: ['super_admin', 'principal', 'teacher', 'tu', 'user', 'solo_teacher'],
  middleware: [
    function () {
      const token = useCookie('auth_token')
      if (!token.value) return navigateTo('/login')
    }
  ]
})

const toast = useToast()
const { user: currentUser } = useAuth()
const { isSchoolLocked, selectedFoundationId, selectedSchoolId, foundations, schools, initContext, onFoundationChange } = useSchoolContext()
const { academicYears, fetchAcademicYears } = useAcademicYear()
const { classes, fetchClasses, classStudents, fetchClassStudents } = useClass()
const {
  recordTahfidz,
  fetchTahfidzList,
  fetchTahfidzPaginated,
  deleteTahfidz,
  recordIbadahBulk,
  fetchIbadahByDate,
  fetchPesantrenAnalytics
} = usePesantren()

// Date Picker Helpers & Shortcuts
const todayDate = new Date().toISOString().split('T')[0]
const filterDateInputRef = ref<HTMLInputElement | null>(null)
const formDateInputRef = ref<HTMLInputElement | null>(null)

const triggerFilterDatePicker = () => {
  if (filterDateInputRef.value && typeof filterDateInputRef.value.showPicker === 'function') {
    try {
      filterDateInputRef.value.showPicker()
    } catch (_) {}
  }
}

const triggerFormDatePicker = () => {
  if (formDateInputRef.value && typeof formDateInputRef.value.showPicker === 'function') {
    try {
      formDateInputRef.value.showPicker()
    } catch (_) {}
  }
}

const adjustFilterDate = (days: number) => {
  const current = selectedDate.value ? new Date(selectedDate.value) : new Date()
  current.setDate(current.getDate() + days)
  selectedDate.value = current.toISOString().split('T')[0]
}

const formatIndoDate = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch (_) {
    return dateStr
  }
}

const formatIndoDateShort = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  } catch (_) {
    return dateStr
  }
}

// Filter States (Consistent with /report)
const selectedAcademicYearId = ref('')
const selectedClassId = ref('')
const selectedDate = ref(new Date().toISOString().split('T')[0])

// Pagination & Search States (Consistent with /student)
const page = ref(1)
const itemPerPage = ref(10)
const searchQuery = ref('')
const tahfidzMeta = ref<any>(null)

// View & Loading States
const activeTab = ref<'tahfidz' | 'ibadah' | 'analytics'>('tahfidz')
const loading = ref(false)
const saving = ref(false)

// Analytics States & RBAC Aggregation
const isFoundationOwner = computed(() => ['user', 'super_admin', 'owner'].includes(currentUser.value?.role))
const isPrincipal = computed(() => currentUser.value?.role === 'principal')
const isFoundationAggregate = ref(false)

const analyticsData = ref<any>(null)
const loadingAnalytics = ref(false)
const analyticsDateFilter = ref<'all' | '30days' | 'today'>('all')

const loadPesantrenAnalytics = async () => {
  if (!selectedSchoolId.value) return
  loadingAnalytics.value = true
  try {
    let startDate: string | undefined = undefined
    let endDate: string | undefined = undefined

    if (analyticsDateFilter.value === 'today') {
      startDate = todayDate
      endDate = todayDate
    } else if (analyticsDateFilter.value === '30days') {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      startDate = d.toISOString().split('T')[0]
      endDate = todayDate
    }

    const data = await fetchPesantrenAnalytics(selectedSchoolId.value, {
      classId: isFoundationAggregate.value ? undefined : (selectedClassId.value || undefined),
      startDate,
      endDate,
      aggregateFoundation: isFoundationOwner.value && isFoundationAggregate.value
    })
    analyticsData.value = data
  } catch (err: any) {
    console.error('Failed fetching pesantren analytics:', err)
  } finally {
    loadingAnalytics.value = false
  }
}

const drillDownToSchool = async (schoolId: string) => {
  isFoundationAggregate.value = false
  selectedSchoolId.value = schoolId
  await loadPesantrenAnalytics()
}

// Tahfidz Form Model
const tahfidzForm = ref({
  student_id: '',
  date: new Date().toISOString().split('T')[0],
  juz: 30,
  surah: 'Al-Mulk',
  verse_range: '1-15',
  score: 95,
  fluency_level: 'Mutqin',
  status: 'Lulus',
  notes: 'Alhamdulillah bacaan tajwid dan makhraj huruf sangat baik.'
})

// Tahfidz List
const tahfidzRecords = ref<any[]>([])

// Ibadah Grid Model: Record<studentId, { sholat_subuh: boolean, ... }>
const ibadahGrid = ref<Record<string, {
  sholat_subuh: boolean
  sholat_dzuhur: boolean
  sholat_ashar: boolean
  sholat_maghrib: boolean
  sholat_isya: boolean
  sholat_tahajud: boolean
  sholat_dhuha: boolean
  tilawah_quran: boolean
  notes: string
}>>({})

const commonSurahs = [
  'An-Naba', 'An-Nazi\'at', '\'Abasa', 'At-Takwir', 'Al-Infitar',
  'Al-Muthaffifin', 'Al-Insyiqaq', 'Al-Buruj', 'At-Tariq', 'Al-A\'la',
  'Al-Ghasyiyah', 'Al-Fajr', 'Al-Balad', 'Asy-Syams', 'Al-Lail',
  'Adh-Dhuha', 'Al-Insyirah', 'At-Tin', 'Al-\'Alaq', 'Al-Qadr',
  'Al-Bayyinah', 'Az-Zalzalah', 'Al-\'Adiyat', 'Al-Qari\'ah', 'At-Takatsur',
  'Al-\'Ashr', 'Al-Humazah', 'Al-Fil', 'Quraisy', 'Al-Ma\'un',
  'Al-Kautsar', 'Al-Kafirun', 'An-Nashr', 'Al-Lahab', 'Al-Ikhlas',
  'Al-Falaq', 'An-Nas', 'Al-Mulk', 'Al-Qalam', 'Al-Haqqah',
  'Al-Ma\'arij', 'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddatsir'
]

// Initialize school data
onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    await loadSchoolData(schoolId)
  }
})

const loadSchoolData = async (schoolId: string) => {
  loading.value = true
  try {
    await fetchAcademicYears(schoolId)

    if (academicYears.value.length > 0) {
      const activeYear = academicYears.value.find((y: any) => y.is_active)
      selectedAcademicYearId.value = activeYear ? activeYear.id : academicYears.value[0].id
    } else {
      selectedAcademicYearId.value = ''
    }

    if (selectedAcademicYearId.value) {
      await fetchClasses(schoolId, selectedAcademicYearId.value)
    } else {
      await fetchClasses(schoolId)
    }
    selectedClassId.value = ''
  } catch (error) {
    console.error('Failed loading school details for pesantren:', error)
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

watch(selectedAcademicYearId, async (newYearId, oldYearId) => {
  if (newYearId !== oldYearId && newYearId && selectedSchoolId.value) {
    await fetchClasses(selectedSchoolId.value, newYearId)
    if (selectedClassId.value) {
      const classExists = classes.value.find((c: any) => c.id === selectedClassId.value)
      if (!classExists) {
        selectedClassId.value = filteredClassesList.value[0]?.id || ''
      }
    }
  }
})

// Filter classes by Academic Year & Role (Consistent with /report)
const filteredClassesList = computed(() => {
  if (!classes.value) return []
  let list = classes.value

  if (selectedAcademicYearId.value) {
    list = list.filter((c: any) => c.academic_year_id === selectedAcademicYearId.value)
  } else {
    return []
  }

  if (['super_admin', 'principal', 'tu', 'treasurer', 'user'].includes(currentUser.value?.role)) {
    return list
  }

  // For teachers, prefer homeroom classes, but fallback to all academic classes so ustadz tahfidz can access
  const homeroomList = list.filter((c: any) => c.homeroom_teacher_id === currentUser.value?.id)
  return homeroomList.length > 0 ? homeroomList : list
})

watch(filteredClassesList, (newVal) => {
  if (newVal.length > 0) {
    selectedClassId.value = newVal[0].id
  } else {
    selectedClassId.value = ''
  }
})

// When selected class changes, load class students and records
watch(selectedClassId, async (newClassId) => {
  if (activeTab.value === 'analytics') {
    if (selectedSchoolId.value) {
      await loadPesantrenAnalytics()
    }
    return
  }
  if (newClassId && selectedSchoolId.value) {
    loading.value = true
    try {
      await fetchClassStudents(selectedSchoolId.value, newClassId)
      if (classStudents.value.length > 0) {
        tahfidzForm.value.student_id = classStudents.value[0].id
      }
      await loadCurrentData()
    } finally {
      loading.value = false
    }
  } else {
    classStudents.value = []
    tahfidzRecords.value = []
  }
})

// Load tahfidz records with pagination & search (Consistent with /student)
const loadTahfidzRecords = async () => {
  if (!selectedSchoolId.value) return
  loading.value = true
  try {
    const res = await fetchTahfidzPaginated(selectedSchoolId.value, {
      page: page.value,
      itemPerPage: itemPerPage.value,
      date: selectedDate.value || undefined,
      classId: selectedClassId.value || undefined,
      search: searchQuery.value || undefined
    })
    tahfidzRecords.value = res.data || []
    tahfidzMeta.value = {
      page: res.page,
      item_per_page: res.item_per_page,
      total_item: res.total_item,
      total_page: res.total_page,
      list_pagination: res.list_pagination || [10, 25, 50, 100]
    }
  } catch (err) {
    console.error('Failed fetching tahfidz records:', err)
  } finally {
    loading.value = false
  }
}

// Search debounce (400ms) like in /student
let searchTimeout: any
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    loadTahfidzRecords()
  }, 400)
})

// Pagination watchers
watch([page, itemPerPage], () => {
  if (selectedSchoolId.value && selectedClassId.value) {
    loadTahfidzRecords()
  }
})

// Load records when date, class, or tab changes
const loadCurrentData = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value) return
  if (activeTab.value === 'tahfidz') {
    await loadTahfidzRecords()
  } else {
    const targetDate = selectedDate.value || new Date().toISOString().split('T')[0]
    const existing = await fetchIbadahByDate(
      selectedSchoolId.value,
      targetDate,
      selectedClassId.value
    )
    const existingMap = new Map(existing.map((e: any) => [e.student_id, e]))

    const newGrid: any = {}
    for (const s of classStudents.value) {
      const saved = existingMap.get(s.id)
      if (saved) {
        newGrid[s.id] = {
          sholat_subuh: !!saved.sholat_subuh,
          sholat_dzuhur: !!saved.sholat_dzuhur,
          sholat_ashar: !!saved.sholat_ashar,
          sholat_maghrib: !!saved.sholat_maghrib,
          sholat_isya: !!saved.sholat_isya,
          sholat_tahajud: !!saved.sholat_tahajud,
          sholat_dhuha: !!saved.sholat_dhuha,
          tilawah_quran: !!saved.tilawah_quran,
          notes: saved.notes || ''
        }
      } else {
        newGrid[s.id] = {
          sholat_subuh: true,
          sholat_dzuhur: true,
          sholat_ashar: true,
          sholat_maghrib: true,
          sholat_isya: true,
          sholat_tahajud: false,
          sholat_dhuha: false,
          tilawah_quran: true,
          notes: ''
        }
      }
    }
    ibadahGrid.value = newGrid
  }
}

watch(selectedDate, (newDate) => {
  page.value = 1
  if (newDate) {
    tahfidzForm.value.date = newDate
  }
  if (selectedClassId.value) {
    loadCurrentData()
  }
})

watch([activeTab, analyticsDateFilter, isFoundationAggregate], ([newTab]) => {
  if (newTab === 'analytics') {
    if (selectedSchoolId.value) {
      loadPesantrenAnalytics()
    }
  } else if (selectedClassId.value) {
    loadCurrentData()
  }
})

// Submit Tahfidz
const handleSaveTahfidz = async () => {
  if (!selectedSchoolId.value) return
  if (!tahfidzForm.value.student_id) {
    toast.error('Silakan pilih santri terlebih dahulu.')
    return
  }

  saving.value = true
  try {
    const res: any = await recordTahfidz(selectedSchoolId.value, {
      student_id: tahfidzForm.value.student_id,
      date: tahfidzForm.value.date,
      juz: Number(tahfidzForm.value.juz),
      surah: tahfidzForm.value.surah,
      verse_range: tahfidzForm.value.verse_range,
      score: Number(tahfidzForm.value.score),
      fluency_level: tahfidzForm.value.fluency_level,
      status: tahfidzForm.value.status,
      notes: tahfidzForm.value.notes
    })

    if (res.success) {
      toast.success('Setoran hafalan santri berhasil disimpan.')
      await loadTahfidzRecords()
    } else {
      toast.error(res.message || 'Gagal menyimpan setoran.')
    }
  } catch (err: any) {
    toast.error(err.message || 'Terjadi kesalahan sistem.')
  } finally {
    saving.value = false
  }
}

// Delete Tahfidz
const handleDeleteTahfidz = async (id: string) => {
  if (!selectedSchoolId.value) return
  if (!confirm('Yakin ingin menghapus rekapan setoran ini?')) return

  try {
    const res: any = await deleteTahfidz(selectedSchoolId.value, id)
    if (res.success) {
      toast.success('Rekapan setoran berhasil dihapus.')
      await loadTahfidzRecords()
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal menghapus rekapan setoran.')
  }
}

// Check all Fardhu Prayers for all students
const setAllFardhu = () => {
  for (const s of classStudents.value) {
    if (ibadahGrid.value[s.id]) {
      ibadahGrid.value[s.id].sholat_subuh = true
      ibadahGrid.value[s.id].sholat_dzuhur = true
      ibadahGrid.value[s.id].sholat_ashar = true
      ibadahGrid.value[s.id].sholat_maghrib = true
      ibadahGrid.value[s.id].sholat_isya = true
    }
  }
  toast.success('Seluruh sholat fardhu berjamaah berhasil dicentang.')
}

// Save Bulk Ibadah
const handleSaveBulkIbadah = async () => {
  if (!selectedSchoolId.value) return
  if (classStudents.value.length === 0) return

  saving.value = true
  try {
    const payloadRecords = classStudents.value.map(s => {
      const current = ibadahGrid.value[s.id] || {}
      return {
        student_id: s.id,
        sholat_subuh: !!current.sholat_subuh,
        sholat_dzuhur: !!current.sholat_dzuhur,
        sholat_ashar: !!current.sholat_ashar,
        sholat_maghrib: !!current.sholat_maghrib,
        sholat_isya: !!current.sholat_isya,
        sholat_tahajud: !!current.sholat_tahajud,
        sholat_dhuha: !!current.sholat_dhuha,
        tilawah_quran: !!current.tilawah_quran,
        notes: current.notes || null
      }
    })

    const res: any = await recordIbadahBulk(selectedSchoolId.value, {
      date: selectedDate.value,
      records: payloadRecords
    })

    if (res.success) {
      toast.success(`Mutaaba'ah ibadah berhasil disimpan untuk ${payloadRecords.length} santri.`)
    } else {
      toast.error(res.message || 'Gagal menyimpan mutaaba\'ah.')
    }
  } catch (err: any) {
    toast.error(err.message || 'Terjadi kesalahan sistem.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-zinc-800">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
            Form Input Ustadz & Musyrif
          </span>
          <span class="text-xs text-slate-400">Pondok Pesantren & Asrama</span>
        </div>
        <h1 class="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mt-0.5">
          <BookMarked class="text-emerald-600 dark:text-emerald-400" :size="24" />
          Kelola Setoran Tahfidz & Mutaaba'ah Ibadah
        </h1>
        <p class="text-xs text-slate-500 dark:text-zinc-400">
          Catat setoran hafalan santri dan mutaaba'ah sholat berjamaah harian
        </p>
      </div>
    </div>

    <!-- Filters Bar (Identical Layout & Consistency with /report) -->
    <div
      class="grid grid-cols-1 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm"
      :class="!isSchoolLocked ? 'md:grid-cols-5' : 'md:grid-cols-3'"
    >
      <!-- Yayasan Selector (If not locked) -->
      <div v-if="!isSchoolLocked" class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Yayasan</label>
        <select
          v-model="selectedFoundationId"
          class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-emerald-600 text-slate-900 dark:text-zinc-100"
        >
          <option value="" disabled>Pilih Yayasan</option>
          <option v-for="found in foundations" :key="found.id" :value="found.id">{{ found.name }}</option>
        </select>
      </div>

      <!-- School Unit Selector (If not locked) -->
      <div v-if="!isSchoolLocked" class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Unit Sekolah</label>
        <select
          v-model="selectedSchoolId"
          :disabled="!selectedFoundationId"
          class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-emerald-600 text-slate-900 dark:text-zinc-100"
        >
          <option value="" disabled>Pilih Unit Sekolah</option>
          <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>

      <!-- Tahun Ajaran -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tahun Ajaran</label>
        <select
          v-model="selectedAcademicYearId"
          :disabled="!selectedSchoolId"
          class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-emerald-600 text-slate-900 dark:text-zinc-100"
        >
          <option value="" disabled>Pilih Tahun Ajaran</option>
          <option v-for="year in academicYears" :key="year.id" :value="year.id">
            {{ year.name }} {{ year.is_active ? '(Aktif)' : '' }}
          </option>
        </select>
      </div>

      <!-- Kelas / Kamar Asrama -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kelas / Kamar</label>
        <select
          v-model="selectedClassId"
          :disabled="filteredClassesList.length === 0"
          class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-emerald-600 text-slate-900 dark:text-zinc-100"
        >
          <option value="" disabled>Pilih Kelas</option>
          <option v-for="c in filteredClassesList" :key="c.id" :value="c.id">{{ c.class_name }}</option>
        </select>
      </div>

      <!-- Tanggal Mutaaba'ah / Setoran -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between px-1">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
            Tanggal
          </label>
          <div class="flex items-center gap-1.5">
            <button
              v-if="selectedDate"
              type="button"
              @click="selectedDate = ''"
              class="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold transition cursor-pointer"
            >
              Semua Tgl
            </button>
            <button
              v-if="selectedDate !== todayDate"
              type="button"
              @click="selectedDate = todayDate"
              class="text-[10px] text-slate-400 hover:text-emerald-600 font-bold transition cursor-pointer"
            >
              Hari Ini
            </button>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <!-- Prev Day -->
          <button
            type="button"
            @click="adjustFilterDate(-1)"
            :disabled="!selectedDate"
            class="p-2.5 border border-slate-200 dark:border-zinc-800 rounded-lg bg-slate-50/70 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs shrink-0"
            title="Hari Sebelumnya"
          >
            <ChevronLeft :size="14" />
          </button>

          <!-- Clickable Date Picker Container -->
          <div
            @click="triggerFilterDatePicker"
            class="flex-1 flex items-center gap-2 bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:border-emerald-500/80 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/10 cursor-pointer shadow-xs min-w-0"
          >
            <CalendarDays class="text-emerald-600 dark:text-emerald-400 shrink-0" :size="16" />
            <input
              ref="filterDateInputRef"
              type="date"
              v-model="selectedDate"
              class="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-zinc-100 outline-none border-none p-0 cursor-pointer"
            />
          </div>

          <!-- Next Day -->
          <button
            type="button"
            @click="adjustFilterDate(1)"
            :disabled="!selectedDate"
            class="p-2.5 border border-slate-200 dark:border-zinc-800 rounded-lg bg-slate-50/70 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs shrink-0"
            title="Hari Berikutnya"
          >
            <ChevronRight :size="14" />
          </button>
        </div>

        <p v-if="selectedDate" class="text-[10px] text-slate-400 px-1 truncate">
          {{ formatIndoDate(selectedDate) }}
        </p>
        <p v-else class="text-[10px] text-amber-500 font-medium px-1">
          Menampilkan seluruh riwayat tanggal
        </p>
      </div>
    </div>

    <!-- Mode Tabs (Tahfidz, Ibadah, Analitik) -->
    <div class="flex border-b border-slate-200 dark:border-zinc-800 space-x-2 overflow-x-auto">
      <button
        type="button"
        @click="activeTab = 'tahfidz'"
        :class="[
          'flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap',
          activeTab === 'tahfidz'
            ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
            : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:border-slate-300'
        ]"
      >
        <BookOpen :size="16" />
        <span>Input Setoran Tahfidz / Tasmi'</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'ibadah'"
        :class="[
          'flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap',
          activeTab === 'ibadah'
            ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
            : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:border-slate-300'
        ]"
      >
        <Clock :size="16" />
        <span>Mutaaba'ah Ibadah Santri (Checklist Massal)</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'analytics'"
        :class="[
          'flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap',
          activeTab === 'analytics'
            ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
            : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:border-slate-300'
        ]"
      >
        <BarChart3 :size="16" />
        <span>Analitik & Rekap Lembaga (Yayasan / Sekolah)</span>
      </button>
    </div>

    <!-- TAB 3: ANALITIK & REKAP LEMBAGA (YAYASAN / SEKOLAH) -->
    <div v-show="activeTab === 'analytics'" class="space-y-6">
      <!-- Top Executive Banner -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/10 via-emerald-600/5 to-teal-900/10 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl p-4 sm:p-5 shadow-xs">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs flex items-center gap-1.5"
              :class="isFoundationAggregate ? 'bg-indigo-600' : 'bg-emerald-600'"
            >
              <component :is="isFoundationAggregate ? Layers : Building2" :size="12" />
              {{ isFoundationAggregate ? 'Agregasi Seluruh Yayasan' : 'Analitik Unit Sekolah' }}
            </span>
            <span v-if="isFoundationAggregate" class="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
              <Building2 :size="12" /> Cakupan: {{ analyticsData?.foundation_schools?.length || 0 }} Unit Sekolah Terkonsolidasi
            </span>
            <span v-else-if="selectedClassId" class="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <Filter :size="12" /> Filter Rombel: {{ classes.find((c: any) => c.id === selectedClassId)?.class_name || 'Kelas' }}
            </span>
            <span v-else class="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck :size="12" /> Unit: {{ schools.find((s: any) => s.id === selectedSchoolId)?.name || 'Sekolah Terpilih' }}
            </span>
          </div>

          <h2 class="text-lg sm:text-xl font-black text-slate-900 dark:text-zinc-100 mt-1 flex items-center gap-2">
            <TrendingUp class="text-emerald-600 dark:text-emerald-400" :size="20" />
            {{ isFoundationAggregate ? 'Konsolidasi Analisis Seluruh Unit Sekolah Yayasan' : 'Analisis Capaian Tahfidz & Kedisiplinan Ibadah' }}
          </h2>
          <p class="text-xs text-slate-600 dark:text-zinc-400">
            <template v-if="isFoundationAggregate">
              Ringkasan makro dan perbandingan produktivitas seluruh unit sekolah di bawah naungan yayasan.
            </template>
            <template v-else>
              Agregasi makro capaian hafalan santri, sebaran juz, dan kepatuhan sholat fardhu berjamaah untuk Kepala Sekolah & Ustadz.
            </template>
          </p>
        </div>

        <!-- Controls: Foundation Scope Toggle (Role User Only) & Time Range Filter -->
        <div class="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <!-- Toggle Role User/Super Admin: Unit vs Yayasan -->
          <div v-if="isFoundationOwner" class="flex items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-1 text-xs font-semibold shadow-xs">
            <button
              type="button"
              @click="isFoundationAggregate = false"
              :class="[
                'px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1.5',
                !isFoundationAggregate
                  ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              ]"
              title="Analitik Hanya Untuk Unit Sekolah Terpilih"
            >
              <Building2 :size="13" />
              <span>Unit Ini</span>
            </button>
            <button
              type="button"
              @click="isFoundationAggregate = true"
              :class="[
                'px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1.5',
                isFoundationAggregate
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-indigo-600'
              ]"
              title="Agregasi Lintas Seluruh Unit Sekolah Yayasan"
            >
              <Layers :size="13" />
              <span>Semua Sekolah</span>
            </button>
          </div>

          <!-- Role Principal Indicator (Locked to Single School) -->
          <div
            v-else-if="isPrincipal"
            class="px-2.5 py-1.5 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 rounded-lg text-slate-600 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5"
            title="Akses analitik dibatasi khusus untuk unit sekolah yang Anda pimpin"
          >
            <Building2 :size="13" class="text-emerald-600" />
            <span class="max-w-[140px] truncate">{{ schools.find((s: any) => s.id === selectedSchoolId)?.name || 'Unit Anda' }}</span>
          </div>

          <!-- Time Range Filter Pills -->
          <div class="flex items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-1 text-xs font-semibold shadow-xs">
            <button
              type="button"
              @click="analyticsDateFilter = 'all'"
              :class="[
                'px-2.5 py-1 rounded transition cursor-pointer',
                analyticsDateFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-emerald-600'
              ]"
            >
              Semua
            </button>
            <button
              type="button"
              @click="analyticsDateFilter = '30days'"
              :class="[
                'px-2.5 py-1 rounded transition cursor-pointer',
                analyticsDateFilter === '30days'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-emerald-600'
              ]"
            >
              30 Hari
            </button>
            <button
              type="button"
              @click="analyticsDateFilter = 'today'"
              :class="[
                'px-2.5 py-1 rounded transition cursor-pointer',
                analyticsDateFilter === 'today'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-emerald-600'
              ]"
            >
              Hari Ini
            </button>
          </div>

          <button
            type="button"
            @click="loadPesantrenAnalytics"
            :disabled="loadingAnalytics"
            class="p-2 border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Muat Ulang Analisis"
          >
            <RefreshCw :size="16" :class="{ 'animate-spin text-emerald-600': loadingAnalytics }" />
          </button>
        </div>
      </div>

      <!-- Loading State for Analytics -->
      <div v-if="loadingAnalytics" class="py-16 text-center text-slate-400 dark:text-zinc-500">
        <RefreshCw class="mx-auto mb-3 animate-spin text-emerald-600" :size="32" />
        <p class="text-sm font-semibold text-slate-700 dark:text-zinc-300">Menghitung agregasi data analitik pesantren...</p>
      </div>

      <template v-else-if="analyticsData">
        <!-- 4 Executive Stat Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Card 1: Total Setoran -->
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Setoran Tahfidz</span>
              <span class="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                <BookMarked :size="16" />
              </span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.overview.total_setoran }}</span>
              <span class="text-xs text-slate-500">kali setoran</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs">
              <span class="text-slate-500 dark:text-zinc-400">{{ analyticsData.overview.active_tahfidz_students }} santri aktif</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {{ analyticsData.overview.pass_rate }}% Lulus
              </span>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
          </div>

          <!-- Card 2: Rata-rata Skor -->
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Rata-rata Nilai</span>
              <span class="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                <Award :size="16" />
              </span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.overview.avg_score }}</span>
              <span class="text-xs text-slate-500">/ 100</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs">
              <span class="text-slate-500 dark:text-zinc-400">Kualitas Tajwid & Makhraj</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {{ analyticsData.overview.avg_score >= 90 ? 'Mutqin / Mumtaz' : (analyticsData.overview.avg_score >= 80 ? 'Jayyid Jiddan' : 'Jayyid') }}
              </span>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400"></div>
          </div>

          <!-- Card 3: Kepatuhan Sholat Fardhu 5 Waktu -->
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Kepatuhan Sholat Fardhu</span>
              <span class="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                <CheckCircle2 :size="16" />
              </span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.overview.fardhu_compliance_rate }}%</span>
              <span class="text-xs text-slate-500">berjamaah</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs">
              <span class="text-slate-500 dark:text-zinc-400">Rerata 5 Waktu</span>
              <span :class="[
                'px-1.5 py-0.5 rounded text-[10px] font-bold',
                analyticsData.overview.fardhu_compliance_rate >= 80 ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
              ]">
                {{ analyticsData.overview.fardhu_compliance_rate >= 80 ? 'Sangat Tertib' : 'Perlu Pendisiplinan' }}
              </span>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
          </div>

          <!-- Card 4: Total Log Mutaaba'ah -->
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Log Mutaaba'ah</span>
              <span class="p-2 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400">
                <Activity :size="16" />
              </span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.overview.total_ibadah_entries }}</span>
              <span class="text-xs text-slate-500">sesi checklist</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs">
              <span class="text-slate-500 dark:text-zinc-400">{{ analyticsData.overview.active_ibadah_students }} santri terdata</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                Presensi Ibadah
              </span>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-400"></div>
          </div>
        </div>

        <!-- Section 2: Sebaran Capaian Juz & Segmentasi Kelancaran -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Sebaran Capaian Per Juz -->
          <BaseCard stripe class="lg:col-span-2 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div class="flex items-center gap-2">
                <BookOpen class="text-emerald-600" :size="18" />
                <h3 class="font-black text-sm text-slate-900 dark:text-zinc-100">Sebaran Capaian Hafalan Santri per Juz</h3>
              </div>
              <span class="text-[11px] text-slate-400 font-semibold">Distribusi Setoran Al-Qur'an</span>
            </div>

            <div v-if="analyticsData.juz_distribution.length === 0" class="py-12 text-center text-slate-400">
              <BookMarked class="mx-auto mb-2 opacity-30 text-emerald-600" :size="32" />
              <p class="text-xs">Belum ada data setoran tahfidz pada rentang filter ini.</p>
            </div>

            <div v-else class="space-y-4">
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                <div
                  v-for="j in analyticsData.juz_distribution"
                  :key="j.juz"
                  class="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 hover:border-emerald-500/60 transition group cursor-default"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-black text-slate-900 dark:text-zinc-100 group-hover:text-emerald-600">Juz {{ j.juz }}</span>
                    <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                      {{ j.count }}x
                    </span>
                  </div>
                  <div class="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                    <span>Rerata Nilai:</span>
                    <span class="font-bold text-slate-700 dark:text-zinc-200">{{ j.avg_score }}</span>
                  </div>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Segmentasi Tingkat Kelancaran (Fluency Breakdown) -->
          <BaseCard stripe class="lg:col-span-1 space-y-4">
            <div class="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <Award class="text-amber-500" :size="18" />
              <h3 class="font-black text-sm text-slate-900 dark:text-zinc-100">Tingkat Kelancaran (Fluency)</h3>
            </div>

            <div v-if="analyticsData.fluency_breakdown.length === 0" class="py-12 text-center text-slate-400">
              <p class="text-xs">Belum ada rekapan kelancaran santri.</p>
            </div>

            <div v-else class="space-y-3.5">
              <div v-for="f in analyticsData.fluency_breakdown" :key="f.fluency_level" class="space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-700 dark:text-zinc-300">{{ f.fluency_level }}</span>
                  <span class="font-extrabold text-slate-900 dark:text-zinc-100">{{ f.count }} santri ({{ f.percentage }}%)</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="[
                      f.fluency_level === 'Mutqin' ? 'bg-emerald-500' : (
                        f.fluency_level === 'Mumtaz' || f.fluency_level === 'Jayyid Jiddan' ? 'bg-sky-500' : (
                          f.fluency_level === 'Jayyid' ? 'bg-amber-500' : 'bg-rose-500'
                        )
                      )
                    ]"
                    :style="{ width: `${f.percentage}%` }"
                  ></div>
                </div>
              </div>

              <!-- Status Kelulusan Mini Box -->
              <div class="pt-3 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-2 gap-2 text-center">
                <div class="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40">
                  <span class="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Lulus Munaqasyah</span>
                  <span class="text-base font-black text-emerald-700 dark:text-emerald-400">
                    {{ analyticsData.status_breakdown.find((s: any) => s.status === 'Lulus')?.count || 0 }} sesi
                  </span>
                </div>
                <div class="p-2 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/40">
                  <span class="block text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase">Perlu Muroja'ah</span>
                  <span class="text-base font-black text-rose-700 dark:text-rose-400">
                    {{ (analyticsData.status_breakdown.find((s: any) => s.status === 'Belum Lulus')?.count || 0) + (analyticsData.status_breakdown.find((s: any) => s.status === 'Muroja\'ah')?.count || 0) }} sesi
                  </span>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Section 3: Matriks Kepatuhan 8 Ibadah Yaumiyah -->
        <BaseCard stripe class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <div class="flex items-center gap-2">
              <Sun class="text-amber-500" :size="18" />
              <h3 class="font-black text-sm text-slate-900 dark:text-zinc-100">Matriks Kedisiplinan Mutaaba'ah Ibadah Yaumiyah</h3>
            </div>
            <span class="text-xs text-slate-500 dark:text-zinc-400">
              Total {{ analyticsData.ibadah_matrix.total_records }} catatan mutaaba'ah harian
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <!-- Subuh -->
            <div class="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/40 text-center space-y-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sholat Subuh</span>
              <p class="text-lg font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.ibadah_matrix.sholat_subuh }}%</p>
              <div class="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full" :style="{ width: `${analyticsData.ibadah_matrix.sholat_subuh}%` }"></div>
              </div>
              <span class="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">Berjamaah</span>
            </div>

            <!-- Dzuhur -->
            <div class="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/40 text-center space-y-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sholat Dzuhur</span>
              <p class="text-lg font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.ibadah_matrix.sholat_dzuhur }}%</p>
              <div class="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full" :style="{ width: `${analyticsData.ibadah_matrix.sholat_dzuhur}%` }"></div>
              </div>
              <span class="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">Berjamaah</span>
            </div>

            <!-- Ashar -->
            <div class="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/40 text-center space-y-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sholat Ashar</span>
              <p class="text-lg font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.ibadah_matrix.sholat_ashar }}%</p>
              <div class="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full" :style="{ width: `${analyticsData.ibadah_matrix.sholat_ashar}%` }"></div>
              </div>
              <span class="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">Berjamaah</span>
            </div>

            <!-- Maghrib -->
            <div class="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/40 text-center space-y-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sholat Maghrib</span>
              <p class="text-lg font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.ibadah_matrix.sholat_maghrib }}%</p>
              <div class="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full" :style="{ width: `${analyticsData.ibadah_matrix.sholat_maghrib}%` }"></div>
              </div>
              <span class="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">Berjamaah</span>
            </div>

            <!-- Isya -->
            <div class="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/40 text-center space-y-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sholat Isya</span>
              <p class="text-lg font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.ibadah_matrix.sholat_isya }}%</p>
              <div class="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full" :style="{ width: `${analyticsData.ibadah_matrix.sholat_isya}%` }"></div>
              </div>
              <span class="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">Berjamaah</span>
            </div>

            <!-- Tahajud -->
            <div class="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/40 text-center space-y-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Qiyamul Lail</span>
              <p class="text-lg font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.ibadah_matrix.sholat_tahajud }}%</p>
              <div class="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-indigo-500 h-full rounded-full" :style="{ width: `${analyticsData.ibadah_matrix.sholat_tahajud}%` }"></div>
              </div>
              <span class="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400">Tahajud</span>
            </div>

            <!-- Dhuha -->
            <div class="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/40 text-center space-y-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-amber-500">Sholat Dhuha</span>
              <p class="text-lg font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.ibadah_matrix.sholat_dhuha }}%</p>
              <div class="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-amber-500 h-full rounded-full" :style="{ width: `${analyticsData.ibadah_matrix.sholat_dhuha}%` }"></div>
              </div>
              <span class="text-[9px] font-semibold text-amber-600 dark:text-amber-400">Sunnah Pagi</span>
            </div>

            <!-- Tilawah -->
            <div class="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/40 text-center space-y-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-teal-500">Tilawah Quran</span>
              <p class="text-lg font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.ibadah_matrix.tilawah_quran }}%</p>
              <div class="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-teal-500 h-full rounded-full" :style="{ width: `${analyticsData.ibadah_matrix.tilawah_quran}%` }"></div>
              </div>
              <span class="text-[9px] font-semibold text-teal-600 dark:text-teal-400">Tadarus Harian</span>
            </div>
          </div>
        </BaseCard>

        <!-- Section 4: Top Achievers vs Remedial Support Alert -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Leaderboard Santri Berprestasi -->
          <BaseCard stripe class="space-y-3.5">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div class="flex items-center gap-2">
                <Trophy class="text-amber-500" :size="18" />
                <h3 class="font-black text-sm text-slate-900 dark:text-zinc-100">Top 5 Santri Teraktif & Nilai Tertinggi</h3>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 font-bold">
                Prestasi Santri
              </span>
            </div>

            <div v-if="analyticsData.top_students.length === 0" class="py-12 text-center text-slate-400">
              <p class="text-xs">Belum ada setoran tercatat untuk menentukan santri teraktif.</p>
            </div>

            <div v-else class="space-y-2.5">
              <div
                v-for="(s, idx) in analyticsData.top_students"
                :key="s.student_id"
                class="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/50 hover:bg-slate-50 dark:hover:bg-zinc-900 transition"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0"
                    :class="[
                      idx === 0 ? 'bg-amber-500 text-white shadow-xs' : (
                        idx === 1 ? 'bg-slate-300 text-slate-800 dark:bg-zinc-700 dark:text-zinc-200' : (
                          idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                        )
                      )
                    ]"
                  >
                    {{ idx + 1 }}
                  </span>
                  <div>
                    <h4 class="font-bold text-xs text-slate-900 dark:text-zinc-100">{{ s.student_name }}</h4>
                    <p class="text-[11px] text-slate-400">NIS: {{ s.nis || '-' }} • Rombel: {{ s.class_name }}</p>
                  </div>
                </div>

                <div class="text-right">
                  <div class="flex items-center gap-1.5 justify-end">
                    <span class="text-xs font-black text-emerald-600 dark:text-emerald-400">{{ s.total_setoran }}x setoran</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/50 font-bold">Skor: {{ s.avg_score }}</span>
                  </div>
                  <span class="text-[10px] text-slate-400">Capaian: s/d Juz {{ s.max_juz }}</span>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Early Warning System: Santri Perlu Bimbingan -->
          <BaseCard stripe class="space-y-3.5 border-t-4 border-t-rose-500">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div class="flex items-center gap-2">
                <AlertCircle class="text-rose-500" :size="18" />
                <h3 class="font-black text-sm text-slate-900 dark:text-zinc-100">Peringatan Dini: Santri Perlu Pendampingan</h3>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 font-bold">
                Intervensi Remedial
              </span>
            </div>

            <div v-if="analyticsData.students_needing_support.length === 0" class="py-12 text-center text-slate-400">
              <CheckCircle2 class="mx-auto mb-2 text-emerald-500 opacity-60" :size="32" />
              <p class="text-xs text-emerald-600 font-bold">Alhamdulillah, seluruh santri lulus setoran dengan nilai baik!</p>
            </div>

            <div v-else class="space-y-2.5">
              <div
                v-for="s in analyticsData.students_needing_support"
                :key="s.student_id"
                class="p-3 rounded-xl border border-rose-100 dark:border-rose-950/60 bg-rose-50/30 dark:bg-rose-950/20 flex flex-col gap-1.5"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-bold text-xs text-slate-900 dark:text-zinc-100">{{ s.student_name }}</h4>
                    <p class="text-[11px] text-slate-400">NIS: {{ s.nis || '-' }} • Rombel: {{ s.class_name }}</p>
                  </div>
                  <div class="text-right">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      {{ s.remedial_count }}x Remedial / Skor &lt; 75
                    </span>
                    <p class="text-[10px] text-slate-400 mt-0.5">Nilai Terendah: {{ s.lowest_score }}</p>
                  </div>
                </div>
                <div v-if="s.notes" class="text-[11px] text-rose-700 dark:text-rose-400 italic bg-white/70 dark:bg-zinc-900/60 p-2 rounded-lg border border-rose-100/60">
                  Catatan Ustadz: "{{ s.notes }}"
                </div>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Section 5: Komparasi Produktivitas Antar Unit Sekolah Yayasan (Khusus Agregasi Yayasan) -->
        <BaseCard v-if="analyticsData.is_foundation_aggregate && analyticsData.school_comparison?.length" stripe class="space-y-4 border-t-4 border-t-indigo-600">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <div class="flex items-center gap-2">
              <Building2 class="text-indigo-600 dark:text-indigo-400" :size="18" />
              <h3 class="font-black text-sm text-slate-900 dark:text-zinc-100">Komparasi Kinerja Antar Unit Sekolah Yayasan</h3>
            </div>
            <span class="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full">
              {{ analyticsData.school_comparison.length }} Unit Terdaftar
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th class="py-2.5 px-3">Nama Unit Sekolah</th>
                  <th class="py-2.5 px-3 text-center">Jumlah Santri</th>
                  <th class="py-2.5 px-3 text-center">Total Setoran Tahfidz</th>
                  <th class="py-2.5 px-3 text-center">Rata-rata Nilai</th>
                  <th class="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/60">
                <tr
                  v-for="s in analyticsData.school_comparison"
                  :key="s.school_id"
                  class="hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition"
                >
                  <td class="py-3 px-3 font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <Building2 :size="14" class="text-slate-400" />
                    <span>{{ s.school_name }}</span>
                    <span v-if="s.school_id === selectedSchoolId" class="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold rounded">Aktif</span>
                  </td>
                  <td class="py-3 px-3 text-center text-slate-600 dark:text-zinc-300 font-semibold">{{ s.total_students }} santri</td>
                  <td class="py-3 px-3 text-center">
                    <span class="px-2 py-0.5 rounded font-extrabold text-[11px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                      {{ s.total_setoran }} setoran
                    </span>
                  </td>
                  <td class="py-3 px-3 text-center font-bold text-slate-800 dark:text-zinc-200">
                    {{ s.avg_score || 0 }} / 100
                  </td>
                  <td class="py-3 px-3 text-right">
                    <button
                      type="button"
                      @click="drillDownToSchool(s.school_id)"
                      class="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      Buka Rincian Unit Ini →
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>

        <!-- Section 6: Komparasi Performa Antar Rombel / Kamar -->
        <BaseCard stripe class="space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <div class="flex items-center gap-2">
              <BarChart3 class="text-indigo-600" :size="18" />
              <h3 class="font-black text-sm text-slate-900 dark:text-zinc-100">Komparasi Performa Antar Kelas / Kamar Asrama</h3>
            </div>
            <span class="text-xs text-slate-400">Evaluasi Produktivitas Halaqah</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th class="py-2.5 px-3">Nama Kelas / Rombel</th>
                  <th class="py-2.5 px-3 text-center">Jumlah Santri</th>
                  <th class="py-2.5 px-3 text-center">Total Setoran Tahfidz</th>
                  <th class="py-2.5 px-3 text-center">Rata-rata Nilai</th>
                  <th class="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/60">
                <tr
                  v-for="c in analyticsData.class_comparison"
                  :key="c.class_id"
                  class="hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition"
                >
                  <td class="py-3 px-3 font-bold text-slate-900 dark:text-zinc-100">{{ c.class_name }}</td>
                  <td class="py-3 px-3 text-center text-slate-600 dark:text-zinc-300">{{ c.total_students }} santri</td>
                  <td class="py-3 px-3 text-center">
                    <span class="px-2 py-0.5 rounded font-extrabold text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {{ c.total_setoran }} setoran
                    </span>
                  </td>
                  <td class="py-3 px-3 text-center font-bold text-slate-800 dark:text-zinc-200">
                    {{ c.avg_score || 0 }} / 100
                  </td>
                  <td class="py-3 px-3 text-right">
                    <button
                      type="button"
                      @click="selectedClassId = c.class_id"
                      class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Saring Rombel Ini →
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>
      </template>
    </div>

    <!-- Mode Tahfidz & Ibadah (Membutuhkan Kelas Terpilih) -->
    <template v-if="activeTab !== 'analytics'">
      <!-- Empty State (When no class is selected, exactly like /report) -->
      <div
        v-if="!selectedClassId"
        class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-16 text-center text-slate-400 dark:text-zinc-500 shadow-sm"
      >
        <BookOpen class="mx-auto mb-3 opacity-40 text-emerald-600" :size="40" />
        <h3 class="font-bold text-slate-700 dark:text-zinc-300 text-sm">Belum Ada Kelas yang Dipilih</h3>
        <p class="text-xs mt-1 max-w-sm mx-auto">
          Silakan tentukan unit sekolah, tahun ajaran, dan kelas rombel/kamar di atas untuk mengelola setoran tahfidz dan mutaaba'ah santri.
        </p>
      </div>

      <!-- Main Content when class is selected -->
      <template v-else>
        <!-- TAB 1: INPUT SETORAN TAHFIDZ -->
        <div v-show="activeTab === 'tahfidz'" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Input Form Card -->
          <BaseCard stripe class="lg:col-span-1 border-t-4 border-t-emerald-600 space-y-4">
            <div class="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <PlusCircle class="text-emerald-600" :size="18" />
              <h3 class="font-black text-sm text-slate-900 dark:text-zinc-100">Form Setoran Santri</h3>
            </div>

            <form @submit.prevent="handleSaveTahfidz" class="space-y-3.5 text-xs">
              <!-- Pilih Santri -->
              <div>
                <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Nama Santri *</label>
                <select
                  v-model="tahfidzForm.student_id"
                  required
                  class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-900 dark:text-zinc-100"
                >
                  <option v-for="s in classStudents" :key="s.id" :value="s.id">
                    {{ s.full_name }} ({{ s.student_number || 'NIS -' }})
                  </option>
                </select>
              </div>

              <!-- Tanggal Setoran -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block font-bold text-slate-700 dark:text-zinc-300">Tanggal Setoran *</label>
                  <button
                    type="button"
                    @click="tahfidzForm.date = todayDate"
                    class="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    Hari Ini
                  </button>
                </div>
                <div
                  @click="triggerFormDatePicker"
                  class="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold hover:border-emerald-500 focus-within:border-emerald-500 transition cursor-pointer shadow-xs"
                >
                  <CalendarDays class="text-emerald-600 dark:text-emerald-400 shrink-0" :size="15" />
                  <input
                    ref="formDateInputRef"
                    type="date"
                    v-model="tahfidzForm.date"
                    required
                    class="w-full bg-transparent text-xs font-semibold outline-none border-none p-0 text-slate-900 dark:text-zinc-100 cursor-pointer"
                  />
                  <span class="text-[10px] text-slate-400 whitespace-nowrap hidden sm:inline">
                    {{ formatIndoDateShort(tahfidzForm.date) }}
                  </span>
                </div>
              </div>

              <!-- Juz & Surah -->
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Juz (1-30) *</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    v-model.number="tahfidzForm.juz"
                    required
                    class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Nama Surah *</label>
                  <input
                    list="surah-suggestions"
                    type="text"
                    v-model="tahfidzForm.surah"
                    placeholder="Contoh: Al-Mulk"
                    required
                    class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-900 dark:text-zinc-100"
                  />
                  <datalist id="surah-suggestions">
                    <option v-for="surah in commonSurahs" :key="surah" :value="surah" />
                  </datalist>
                </div>
              </div>

              <!-- Rentang Ayat & Nilai -->
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Ayat (Rentang)</label>
                  <input
                    type="text"
                    v-model="tahfidzForm.verse_range"
                    placeholder="Contoh: 1-15"
                    class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Nilai (0-100) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    v-model.number="tahfidzForm.score"
                    required
                    class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <!-- Kelancaran & Status -->
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Predikat</label>
                  <select
                    v-model="tahfidzForm.fluency_level"
                    class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-900 dark:text-zinc-100"
                  >
                    <option value="Mutqin">Mutqin (Sangat Lancar)</option>
                    <option value="Mumtaz">Mumtaz (Istimewa)</option>
                    <option value="Jayyid Jiddan">Jayyid Jiddan (Baik Sekali)</option>
                    <option value="Jayyid">Jayyid (Baik)</option>
                    <option value="Maqbul">Maqbul (Cukup)</option>
                  </select>
                </div>

                <div>
                  <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Status Setoran</label>
                  <select
                    v-model="tahfidzForm.status"
                    class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-900 dark:text-zinc-100"
                  >
                    <option value="Lulus">Lulus</option>
                    <option value="Muroja'ah">Muroja'ah</option>
                    <option value="Belum Lulus">Belum Lulus</option>
                  </select>
                </div>
              </div>

              <!-- Catatan Tajwid -->
              <div>
                <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Catatan Makhraj / Tajwid Ustadz</label>
                <textarea
                  v-model="tahfidzForm.notes"
                  rows="3"
                  placeholder="Evaluasi makharijul huruf, mad, ikhfa, dll..."
                  class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-emerald-500 leading-relaxed text-slate-900 dark:text-zinc-100"
                ></textarea>
              </div>

              <button
                type="submit"
                :disabled="saving"
                class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                <Save :size="15" />
                <span>{{ saving ? 'Menyimpan...' : 'Simpan Setoran Santri' }}</span>
              </button>
            </form>
          </BaseCard>

          <!-- List Riwayat Setoran Card -->
          <BaseCard stripe class="lg:col-span-2 border-t-4 border-t-teal-600 space-y-4">
            <!-- Header Toolbar & Search -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <div class="flex items-center gap-2">
                  <BookMarked class="text-teal-600 dark:text-teal-400" :size="18" />
                  <h3 class="font-black text-sm text-slate-900 dark:text-zinc-100">
                    Riwayat Setoran ({{ tahfidzMeta?.total_item ?? tahfidzRecords.length }} Catatan)
                  </h3>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  Filter: {{ selectedDate ? selectedDate : 'Semua Tanggal' }}
                </p>
              </div>

              <!-- Search Bar (Consistent with /student) -->
              <div class="relative w-full sm:w-60">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="13" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Cari santri, surah..."
                  class="w-full bg-slate-50/70 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold outline-none focus:border-emerald-500 transition-all text-slate-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div v-if="loading" class="flex justify-center py-12">
              <div class="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div v-else-if="tahfidzRecords.length === 0" class="text-center py-12 space-y-2">
              <BookOpen class="mx-auto text-slate-300 dark:text-zinc-600" :size="36" />
              <p class="text-xs font-semibold text-slate-500 dark:text-zinc-400">Belum ada rekapan setoran untuk filter ini.</p>
              <p class="text-[10px] text-slate-400">Gunakan form di samping untuk menginput setoran baru atau ubah kata kunci pencarian.</p>
            </div>

            <div v-else class="space-y-3">
              <div class="overflow-x-auto rounded-xl border border-slate-100 dark:border-zinc-800/80">
                <table class="w-full text-left text-xs">
                  <thead>
                    <tr class="border-b border-slate-200/60 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      <th class="py-3 px-3.5">Santri</th>
                      <th class="py-3 px-3">Tanggal</th>
                      <th class="py-3 px-3">Juz & Surah</th>
                      <th class="py-3 px-3 text-center">Nilai</th>
                      <th class="py-3 px-3">Predikat</th>
                      <th class="py-3 px-3">Ustadz</th>
                      <th class="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                    <tr
                      v-for="rec in tahfidzRecords"
                      :key="rec.id"
                      class="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition"
                    >
                      <td class="py-3 px-3.5">
                        <div class="flex items-center gap-2.5">
                          <div class="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {{ (rec.student_name || 'S')[0] }}
                          </div>
                          <div>
                            <p class="font-bold text-slate-900 dark:text-zinc-100 leading-tight">{{ rec.student_name }}</p>
                            <p class="text-[10px] text-slate-400">{{ rec.class_name || 'Kelas' }} &bull; NIS: {{ rec.nis || '-' }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="py-3 px-3 text-slate-600 dark:text-zinc-400 text-xs whitespace-nowrap">
                        {{ rec.date }}
                      </td>
                      <td class="py-3 px-3 font-semibold text-slate-800 dark:text-zinc-200">
                        Juz {{ rec.juz }} &bull; {{ rec.surah }} {{ rec.verse_range ? `(${rec.verse_range})` : '' }}
                      </td>
                      <td class="py-3 px-3 text-center font-black text-emerald-600 dark:text-emerald-400">
                        {{ rec.score }}
                      </td>
                      <td class="py-3 px-3">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {{ rec.fluency_level }}
                        </span>
                      </td>
                      <td class="py-3 px-3 text-slate-600 dark:text-zinc-400 text-[11px] whitespace-nowrap">
                        {{ rec.ustadz_name || 'Ustadz' }}
                      </td>
                      <td class="py-3 px-3 text-right">
                        <button
                          type="button"
                          @click="handleDeleteTahfidz(rec.id)"
                          class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Hapus Rekapan"
                        >
                          <Trash2 :size="14" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination component identical to /student -->
              <AppPagination
                v-if="tahfidzMeta && tahfidzMeta.total_item > 0"
                v-model:page="page"
                v-model:itemPerPage="itemPerPage"
                :totalItem="tahfidzMeta.total_item"
                :totalPage="tahfidzMeta.total_page"
                :listPagination="tahfidzMeta.list_pagination"
              />
            </div>
          </BaseCard>
        </div>
      </div>

      <!-- TAB 2: MUTAABA'AH IBADAH SANTRI (BULK CHECKLIST) -->
      <div v-show="activeTab === 'ibadah'" class="space-y-6">
        <BaseCard stripe class="border-t-4 border-t-indigo-600 space-y-4">
          <!-- Action Toolbar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h3 class="font-black text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Clock class="text-indigo-600" :size="18" />
                Checklist Mutaaba'ah Sholat & Ibadah Massal
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                Tanggal: <span class="font-bold text-slate-700 dark:text-zinc-300">{{ formatIndoDate(selectedDate || todayDate) }}</span> &bull; Centang sholat fardhu berjamaah dan amalan sunnah santri
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="setAllFardhu"
                class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check :size="14" class="text-emerald-500" />
                <span>Centang 5 Waktu Semua</span>
              </button>

              <button
                type="button"
                @click="handleSaveBulkIbadah"
                :disabled="saving"
                class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
              >
                <Save :size="14" />
                <span>{{ saving ? 'Menyimpan...' : 'Simpan Seluruh Data' }}</span>
              </button>
            </div>
          </div>

          <!-- Student Checklist Matrix Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                  <th class="py-3 px-3">Nama Santri</th>
                  <th class="py-3 px-2 text-center">Subuh</th>
                  <th class="py-3 px-2 text-center">Dzuhur</th>
                  <th class="py-3 px-2 text-center">Ashar</th>
                  <th class="py-3 px-2 text-center">Maghrib</th>
                  <th class="py-3 px-2 text-center">Isya</th>
                  <th class="py-3 px-2 text-center">Tahajud</th>
                  <th class="py-3 px-2 text-center">Dhuha</th>
                  <th class="py-3 px-2 text-center">Tilawah</th>
                  <th class="py-3 px-3">Catatan Musyrif</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                <tr
                  v-for="s in classStudents"
                  :key="s.id"
                  class="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition"
                >
                  <td class="py-3 px-3 whitespace-nowrap">
                    <p class="font-bold text-slate-900 dark:text-zinc-100">{{ s.full_name }}</p>
                    <p class="text-[10px] text-slate-400">{{ s.student_number || 'NIS -' }}</p>
                  </td>

                  <!-- Subuh -->
                  <td class="py-3 px-2 text-center">
                    <input
                      type="checkbox"
                      v-if="ibadahGrid[s.id]"
                      v-model="ibadahGrid[s.id].sholat_subuh"
                      class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    />
                  </td>

                  <!-- Dzuhur -->
                  <td class="py-3 px-2 text-center">
                    <input
                      type="checkbox"
                      v-if="ibadahGrid[s.id]"
                      v-model="ibadahGrid[s.id].sholat_dzuhur"
                      class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    />
                  </td>

                  <!-- Ashar -->
                  <td class="py-3 px-2 text-center">
                    <input
                      type="checkbox"
                      v-if="ibadahGrid[s.id]"
                      v-model="ibadahGrid[s.id].sholat_ashar"
                      class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    />
                  </td>

                  <!-- Maghrib -->
                  <td class="py-3 px-2 text-center">
                    <input
                      type="checkbox"
                      v-if="ibadahGrid[s.id]"
                      v-model="ibadahGrid[s.id].sholat_maghrib"
                      class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    />
                  </td>

                  <!-- Isya -->
                  <td class="py-3 px-2 text-center">
                    <input
                      type="checkbox"
                      v-if="ibadahGrid[s.id]"
                      v-model="ibadahGrid[s.id].sholat_isya"
                      class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    />
                  </td>

                  <!-- Tahajud -->
                  <td class="py-3 px-2 text-center">
                    <input
                      type="checkbox"
                      v-if="ibadahGrid[s.id]"
                      v-model="ibadahGrid[s.id].sholat_tahajud"
                      class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                  </td>

                  <!-- Dhuha -->
                  <td class="py-3 px-2 text-center">
                    <input
                      type="checkbox"
                      v-if="ibadahGrid[s.id]"
                      v-model="ibadahGrid[s.id].sholat_dhuha"
                      class="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                    />
                  </td>

                  <!-- Tilawah -->
                  <td class="py-3 px-2 text-center">
                    <input
                      type="checkbox"
                      v-if="ibadahGrid[s.id]"
                      v-model="ibadahGrid[s.id].tilawah_quran"
                      class="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                    />
                  </td>

                  <!-- Notes -->
                  <td class="py-3 px-3">
                    <input
                      type="text"
                      v-if="ibadahGrid[s.id]"
                      v-model="ibadahGrid[s.id].notes"
                      placeholder="Catatan..."
                      class="w-36 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-[11px] outline-none focus:border-indigo-500 text-slate-900 dark:text-zinc-100"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>
      </div>
    </template>
    </template>
  </div>
</template>
