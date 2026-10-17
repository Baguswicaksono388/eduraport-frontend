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
  Layers,
  Settings,
  X,
  Plus,
  Edit2,
  CheckSquare,
  RotateCcw,
  CheckCheck,
  Sunrise,
  Sunset
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
  fetchSchoolAssignedMutabaahItems,
  recordMutabaahBulk,
  fetchMutabaahByDate,
  fetchFoundationMutabaahItems,
  createFoundationMutabaahItem,
  updateFoundationMutabaahItem,
  deleteFoundationMutabaahItem,
  fetchFoundationSchoolAssignments,
  saveSchoolMutabaahAssignments,
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
  selectedClassId.value = ''
  await loadPesantrenAnalytics()
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const filterByClass = async (classId: string, schoolId?: string) => {
  if (schoolId && schoolId !== selectedSchoolId.value) {
    selectedSchoolId.value = schoolId
  }
  isFoundationAggregate.value = false
  selectedClassId.value = classId
  await loadPesantrenAnalytics()
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const resetClassFilter = async () => {
  selectedClassId.value = ''
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

// Dynamic Mutaba'ah State Model
interface StudentMutabaahState {
  check_data: Record<string, boolean>
  is_excused: boolean
  notes: string
}
const ibadahGrid = ref<Record<string, StudentMutabaahState>>({})
const assignedMutabaahItems = ref<any[]>([])
const loadingAssignedItems = ref(false)

// Unsaved Changes & Filter States for Mutaaba'ah
const hasUnsavedChanges = ref(false)
const ibadahSearch = ref('')
const ibadahStatusFilter = ref<'all' | 'hadir' | 'uzur' | 'incomplete'>('all')

const markIbadahChanged = () => {
  hasUnsavedChanges.value = true
}

// Master Yayasan Management Modal States
const showMasterModal = ref(false)
const masterTab = ref<'items' | 'assignments'>('items')
const foundationMasterItems = ref<any[]>([])
const loadingFoundationItems = ref(false)
const schoolAssignmentsData = ref<any[]>([])
const selectedAssignSchoolId = ref<string>('')
const savingAssignment = ref(false)

const masterItemForm = ref({
  id: '',
  name: '',
  category: 'fardhu',
  target_gender: 'all',
  is_active: true
})
const isEditingMasterItem = ref(false)
const savingMasterItem = ref(false)

const loadAssignedMutabaahItems = async (schoolId: string) => {
  if (!schoolId) return
  loadingAssignedItems.value = true
  try {
    assignedMutabaahItems.value = await fetchSchoolAssignedMutabaahItems(schoolId)
  } catch (err) {
    console.error('Failed loading assigned mutabaah items:', err)
  } finally {
    loadingAssignedItems.value = false
  }
}

const openMasterModal = async () => {
  if (!selectedFoundationId.value) {
    toast.error('Pilih yayasan terlebih dahulu.')
    return
  }
  showMasterModal.value = true
  await loadFoundationMasterData()
}

const loadFoundationMasterData = async () => {
  if (!selectedFoundationId.value) return
  loadingFoundationItems.value = true
  try {
    foundationMasterItems.value = await fetchFoundationMutabaahItems(selectedFoundationId.value)
    schoolAssignmentsData.value = await fetchFoundationSchoolAssignments(selectedFoundationId.value)
    if (!selectedAssignSchoolId.value && schools.value.length > 0) {
      selectedAssignSchoolId.value = selectedSchoolId.value || schools.value[0].id
    }
  } catch (err) {
    console.error('Failed fetching master items:', err)
  } finally {
    loadingFoundationItems.value = false
  }
}

const resetMasterItemForm = () => {
  masterItemForm.value = {
    id: '',
    name: '',
    category: 'fardhu',
    target_gender: 'all',
    is_active: true
  }
  isEditingMasterItem.value = false
}

const editMasterItem = (item: any) => {
  masterItemForm.value = {
    id: item.id,
    name: item.name,
    category: item.category,
    target_gender: item.target_gender || 'all',
    is_active: item.is_active ?? true
  }
  isEditingMasterItem.value = true
}

const handleSaveMasterItem = async () => {
  if (!masterItemForm.value.name.trim()) {
    toast.error('Nama amalan wajib diisi')
    return
  }
  if (!selectedFoundationId.value) return

  savingMasterItem.value = true
  try {
    if (isEditingMasterItem.value && masterItemForm.value.id) {
      await updateFoundationMutabaahItem(selectedFoundationId.value, masterItemForm.value.id, {
        name: masterItemForm.value.name,
        category: masterItemForm.value.category,
        target_gender: masterItemForm.value.target_gender,
        is_active: masterItemForm.value.is_active
      })
      toast.success('Amalan mutaaba\'ah berhasil diperbarui')
    } else {
      await createFoundationMutabaahItem(selectedFoundationId.value, {
        name: masterItemForm.value.name,
        category: masterItemForm.value.category,
        target_gender: masterItemForm.value.target_gender,
        order_index: foundationMasterItems.value.length + 1,
        is_active: true
      })
      toast.success('Amalan mutaaba\'ah baru berhasil ditambahkan')
    }
    resetMasterItemForm()
    await loadFoundationMasterData()
    if (selectedSchoolId.value) {
      await loadAssignedMutabaahItems(selectedSchoolId.value)
      if (selectedClassId.value) await loadCurrentData()
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan amalan')
  } finally {
    savingMasterItem.value = false
  }
}

const handleDeleteMasterItem = async (item: any) => {
  if (!confirm(`Hapus amalan "${item.name}" dari master yayasan?`)) return
  if (!selectedFoundationId.value) return

  try {
    await deleteFoundationMutabaahItem(selectedFoundationId.value, item.id)
    toast.success('Amalan mutaaba\'ah berhasil dihapus')
    await loadFoundationMasterData()
    if (selectedSchoolId.value) {
      await loadAssignedMutabaahItems(selectedSchoolId.value)
      if (selectedClassId.value) await loadCurrentData()
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal menghapus amalan')
  }
}

const handleSaveSchoolAssignments = async () => {
  if (!selectedAssignSchoolId.value || !selectedFoundationId.value) return
  savingAssignment.value = true
  try {
    const schoolData = schoolAssignmentsData.value.find(s => s.school_id === selectedAssignSchoolId.value)
    if (!schoolData) return

    const payload = schoolData.assigned_items.map((item: any, idx: number) => ({
      master_item_id: item.id,
      is_mandatory: item.is_mandatory ?? true,
      order_index: idx + 1,
      is_active: item.is_assigned ?? false
    }))

    await saveSchoolMutabaahAssignments(selectedFoundationId.value, {
      school_id: selectedAssignSchoolId.value,
      assignments: payload
    })
    toast.success('Penugasan amalan ke unit sekolah berhasil disimpan')
    if (selectedSchoolId.value === selectedAssignSchoolId.value) {
      await loadAssignedMutabaahItems(selectedSchoolId.value)
      if (selectedClassId.value) await loadCurrentData()
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan penugasan')
  } finally {
    savingAssignment.value = false
  }
}

const toggleStudentExcused = (studentId: string) => {
  if (!ibadahGrid.value[studentId]) return
  ibadahGrid.value[studentId].is_excused = !ibadahGrid.value[studentId].is_excused
  hasUnsavedChanges.value = true
  if (ibadahGrid.value[studentId].is_excused) {
    for (const item of assignedMutabaahItems.value) {
      if (item.category === 'fardhu') {
        ibadahGrid.value[studentId].check_data[item.id] = false
      }
    }
    toast.info('Santri ditandai Uzur Syar\'i / Sakit. Kewajiban sholat fardhu dikecualikan otomatis.')
  } else {
    toast.info('Status santri dikembalikan ke Hadir.')
  }
}

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
    await Promise.all([
      fetchAcademicYears(schoolId),
      loadAssignedMutabaahItems(schoolId)
    ])

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
  if (activeTab.value === 'analytics') {
    if (selectedClassId.value && !newVal.some((c: any) => c.id === selectedClassId.value)) {
      selectedClassId.value = ''
    }
    return
  }
  if (newVal.length > 0) {
    if (!selectedClassId.value || !newVal.some((c: any) => c.id === selectedClassId.value)) {
      selectedClassId.value = newVal[0].id
    }
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
    if (assignedMutabaahItems.value.length === 0 && selectedSchoolId.value) {
      await loadAssignedMutabaahItems(selectedSchoolId.value)
    }

    const existing = await fetchMutabaahByDate(
      selectedSchoolId.value,
      targetDate,
      selectedClassId.value
    )
    const existingMap = new Map(existing.map((e: any) => [e.student_id, e]))

    const newGrid: any = {}
    for (const s of classStudents.value) {
      const saved = existingMap.get(s.id)
      if (saved && saved.record_id) {
        newGrid[s.id] = {
          check_data: saved.check_data || {},
          is_excused: !!saved.is_excused,
          notes: saved.notes || ''
        }
      } else {
        const defaultChecks: Record<string, boolean> = {}
        for (const item of assignedMutabaahItems.value) {
          defaultChecks[item.id] = item.category === 'fardhu'
        }
        newGrid[s.id] = {
          check_data: defaultChecks,
          is_excused: false,
          notes: ''
        }
      }
    }
    ibadahGrid.value = newGrid
    hasUnsavedChanges.value = false
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

// Check all Fardhu Prayers for all non-excused students
const setAllFardhu = () => {
  const fardhuItems = assignedMutabaahItems.value.filter(i => i.category === 'fardhu')
  if (fardhuItems.length === 0) {
    toast.error('Tidak ada amalan bertipe fardhu yang ditugaskan ke unit sekolah ini.')
    return
  }

  for (const s of classStudents.value) {
    if (ibadahGrid.value[s.id] && !ibadahGrid.value[s.id].is_excused) {
      if (!ibadahGrid.value[s.id].check_data) {
        ibadahGrid.value[s.id].check_data = {}
      }
      for (const item of fardhuItems) {
        ibadahGrid.value[s.id].check_data[item.id] = true
      }
    }
  }
  hasUnsavedChanges.value = true
  toast.success('Seluruh sholat fardhu berjamaah berhasil dicentang.')
}

// Student initials avatar helper
const getInitials = (name: string) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// Filtered student list in Mutaaba'ah tab
const filteredClassStudents = computed(() => {
  let list = classStudents.value || []
  if (ibadahSearch.value.trim()) {
    const q = ibadahSearch.value.toLowerCase().trim()
    list = list.filter((s: any) =>
      (s.full_name && s.full_name.toLowerCase().includes(q)) ||
      (s.student_number && s.student_number.toLowerCase().includes(q))
    )
  }

  if (ibadahStatusFilter.value === 'hadir') {
    list = list.filter((s: any) => !ibadahGrid.value[s.id]?.is_excused)
  } else if (ibadahStatusFilter.value === 'uzur') {
    list = list.filter((s: any) => !!ibadahGrid.value[s.id]?.is_excused)
  } else if (ibadahStatusFilter.value === 'incomplete') {
    list = list.filter((s: any) => {
      const state = ibadahGrid.value[s.id]
      if (!state) return true
      if (state.is_excused) {
        return assignedMutabaahItems.value
          .filter(i => i.category !== 'fardhu')
          .some(i => !state.check_data?.[i.id])
      }
      return assignedMutabaahItems.value.some(i => !state.check_data?.[i.id])
    })
  }
  return list
})

// Informative KPI Statistics for Mutaaba'ah Header
const ibadahStats = computed(() => {
  const total = classStudents.value.length
  if (total === 0) {
    return {
      total: 0,
      hadir: 0,
      uzur: 0,
      fardhuCompletionPct: 0,
      overallCompletionPct: 0,
      completedStudents: 0
    }
  }

  let hadir = 0
  let uzur = 0
  let totalFardhuSlots = 0
  let completedFardhuSlots = 0
  let totalApplicableSlots = 0
  let completedSlots = 0
  let completedStudents = 0

  const fardhuItems = assignedMutabaahItems.value.filter(i => i.category === 'fardhu')
  const nonFardhuItems = assignedMutabaahItems.value.filter(i => i.category !== 'fardhu')

  for (const s of classStudents.value) {
    const state = ibadahGrid.value[s.id]
    const isExcused = !!state?.is_excused
    let studentApplicable = 0
    let studentDone = 0

    if (isExcused) {
      uzur++
      for (const item of nonFardhuItems) {
        totalApplicableSlots++
        studentApplicable++
        if (state?.check_data?.[item.id]) {
          completedSlots++
          studentDone++
        }
      }
    } else {
      hadir++
      for (const item of fardhuItems) {
        totalFardhuSlots++
        totalApplicableSlots++
        studentApplicable++
        if (state?.check_data?.[item.id]) {
          completedFardhuSlots++
          completedSlots++
          studentDone++
        }
      }
      for (const item of nonFardhuItems) {
        totalApplicableSlots++
        studentApplicable++
        if (state?.check_data?.[item.id]) {
          completedSlots++
          studentDone++
        }
      }
    }

    if (studentApplicable > 0 && studentDone === studentApplicable) {
      completedStudents++
    }
  }

  const fardhuCompletionPct = totalFardhuSlots > 0 ? Math.round((completedFardhuSlots / totalFardhuSlots) * 100) : 100
  const overallCompletionPct = totalApplicableSlots > 0 ? Math.round((completedSlots / totalApplicableSlots) * 100) : 100

  return {
    total,
    hadir,
    uzur,
    fardhuCompletionPct,
    overallCompletionPct,
    completedStudents
  }
})

// Item Display Helpers (Icon, Name, Theme)
const getItemName = (item: any) => item.name || item.title || 'Amalan'

const getItemIconComponent = (item: any) => {
  const name = getItemName(item).toLowerCase()
  if (name.includes('shubuh') || name.includes('subuh')) return Sunrise
  if (name.includes('dzuhur') || name.includes('dhuhur')) return Sun
  if (name.includes('ashar') || name.includes('asar')) return Sun
  if (name.includes('maghrib')) return Sunset
  if (name.includes('isya')) return Moon
  if (name.includes('dhuha')) return Sun
  if (name.includes('tahajjud') || name.includes('qiyam')) return Moon
  if (name.includes('tilawah') || name.includes('qur\'an') || name.includes('tadarus')) return BookOpen
  if (name.includes('tahfidz')) return BookMarked
  if (name.includes('zikir') || name.includes('doa') || name.includes('wirid')) return Sparkles
  return CheckSquare
}

const getItemColorTheme = (item: any) => {
  const name = getItemName(item).toLowerCase()
  if (name.includes('shubuh') || name.includes('subuh')) return 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800'
  if (name.includes('dzuhur')) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
  if (name.includes('ashar')) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800'
  if (name.includes('maghrib')) return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
  if (name.includes('isya')) return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
  if (item.category === 'fardhu') return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
  if (item.category === 'sunnah') return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
  return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800'
}

// Column Live Stats
const getColumnStats = (itemId: string, category: string) => {
  let applicableTotal = 0
  let checkedCount = 0

  for (const s of classStudents.value) {
    const state = ibadahGrid.value[s.id]
    if (state?.is_excused && category === 'fardhu') {
      continue
    }
    applicableTotal++
    if (state?.check_data?.[itemId]) {
      checkedCount++
    }
  }

  const pct = applicableTotal > 0 ? Math.round((checkedCount / applicableTotal) * 100) : 0
  return {
    checked: checkedCount,
    total: applicableTotal,
    pct
  }
}

// Toggle an entire amalan column for all active students
const toggleColumn = (item: any) => {
  const { checked, total } = getColumnStats(item.id, item.category)
  const isAllChecked = total > 0 && checked === total
  const targetState = !isAllChecked

  for (const s of classStudents.value) {
    if (!ibadahGrid.value[s.id]) {
      ibadahGrid.value[s.id] = { check_data: {}, is_excused: false, notes: '' }
    }
    const state = ibadahGrid.value[s.id]
    if (state.is_excused && item.category === 'fardhu') {
      continue
    }
    if (!state.check_data) state.check_data = {}
    state.check_data[item.id] = targetState
  }

  hasUnsavedChanges.value = true
  const name = getItemName(item)
  if (targetState) {
    toast.success(`Seluruh santri hadir dicentang untuk: ${name}`)
  } else {
    toast.info(`Centang amalan ${name} dibatalkan untuk seluruh santri`)
  }
}

// Student Row Progress Helper
const getStudentProgress = (studentId: string) => {
  const state = ibadahGrid.value[studentId]
  if (!state) return { completed: 0, total: 0, pct: 0 }

  let total = 0
  let completed = 0

  for (const item of assignedMutabaahItems.value) {
    if (state.is_excused && item.category === 'fardhu') {
      continue
    }
    total++
    if (state.check_data?.[item.id]) {
      completed++
    }
  }

  const pct = total > 0 ? Math.round((completed / total) * 100) : 100
  return { completed, total, pct }
}

// Toggle all amalan for a single student
const toggleStudentAll = (studentId: string) => {
  const state = ibadahGrid.value[studentId]
  if (!state) return

  const { completed, total } = getStudentProgress(studentId)
  const targetState = completed < total

  if (!state.check_data) state.check_data = {}

  for (const item of assignedMutabaahItems.value) {
    if (state.is_excused && item.category === 'fardhu') {
      state.check_data[item.id] = false
    } else {
      state.check_data[item.id] = targetState
    }
  }

  hasUnsavedChanges.value = true
}

// Reset all checks in the class
const resetAllIbadahChecks = () => {
  if (!confirm('Apakah Anda yakin ingin mengosongkan seluruh checklist amalan untuk rombel ini pada tanggal yang dipilih?')) {
    return
  }
  for (const s of classStudents.value) {
    if (ibadahGrid.value[s.id]) {
      ibadahGrid.value[s.id].check_data = {}
    }
  }
  hasUnsavedChanges.value = true
  toast.info('Seluruh checklist amalan kelas berhasil dikosongkan.')
}

// Save Bulk Ibadah
const handleSaveBulkIbadah = async () => {
  if (!selectedSchoolId.value) return
  if (classStudents.value.length === 0) return

  saving.value = true
  try {
    const payloadRecords = classStudents.value.map(s => {
      const current = ibadahGrid.value[s.id] || { check_data: {}, is_excused: false, notes: '' }
      return {
        student_id: s.id,
        check_data: current.check_data || {},
        is_excused: !!current.is_excused,
        notes: current.notes || null
      }
    })

    const res: any = await recordMutabaahBulk(selectedSchoolId.value, {
      date: selectedDate.value || todayDate,
      records: payloadRecords
    })

    if (res.success) {
      hasUnsavedChanges.value = false
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
          <option :value="''">{{ activeTab === 'analytics' ? 'Semua Kelas (Agregasi Unit)' : 'Pilih Kelas' }}</option>
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
            <span v-else-if="selectedClassId" class="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Filter :size="12" /> Filter Rombel: {{ classes.find((c: any) => c.id === selectedClassId)?.class_name || 'Kelas' }}
              <button
                type="button"
                @click="resetClassFilter"
                class="ml-1 text-emerald-700 hover:text-rose-600 dark:text-emerald-300 dark:hover:text-rose-400 font-black cursor-pointer transition text-xs"
                title="Tampilkan Seluruh Kelas Unit Ini"
              >✕</button>
            </span>
            <span v-else class="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck :size="12" /> Unit: {{ schools.find((s: any) => s.id === selectedSchoolId)?.name || 'Sekolah Terpilih' }} (Semua Kelas)
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
              @click="isFoundationAggregate = false; selectedClassId = ''; loadPesantrenAnalytics()"
              :class="[
                'px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1.5',
                !isFoundationAggregate
                  ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              ]"
              title="Analitik Seluruh Kelas Untuk Unit Sekolah Terpilih"
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

      <div v-else-if="analyticsData" class="space-y-6">
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
              <span class="text-2xl font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.overview?.total_setoran ?? 0 }}</span>
              <span class="text-xs text-slate-500">kali setoran</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs">
              <span class="text-slate-500 dark:text-zinc-400">{{ analyticsData.overview?.active_tahfidz_students ?? 0 }} santri aktif</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {{ analyticsData.overview?.pass_rate ?? 0 }}% Lulus
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
              <span class="text-2xl font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.overview?.avg_score ?? analyticsData.overview?.avg_tahfidz_score ?? 0 }}</span>
              <span class="text-xs text-slate-500">/ 100</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs">
              <span class="text-slate-500 dark:text-zinc-400">Kualitas Tajwid & Makhraj</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {{ !analyticsData.overview?.total_setoran ? '-' : ((analyticsData.overview?.avg_score ?? analyticsData.overview?.avg_tahfidz_score ?? 0) >= 90 ? 'Mutqin / Mumtaz' : ((analyticsData.overview?.avg_score ?? analyticsData.overview?.avg_tahfidz_score ?? 0) >= 80 ? 'Jayyid Jiddan' : 'Jayyid')) }}
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
              <span class="text-2xl font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.overview?.fardhu_compliance_rate ?? 0 }}%</span>
              <span class="text-xs text-slate-500">berjamaah</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-slate-500 dark:text-zinc-400 font-medium">
                  {{ Math.max(0, (analyticsData.overview?.active_ibadah_students ?? 0) - (analyticsData.overview?.excused_count ?? 0)) }} Wajib
                </span>
                <span
                  v-if="analyticsData.overview?.excused_count"
                  class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-100/80 dark:border-rose-900/40 flex items-center gap-1"
                  :title="`${analyticsData.overview.excused_count} santriwati berhalangan/uzur syar'i dikecualikan dari sholat fardhu`"
                >
                  <span>🌸</span>
                  <span>{{ analyticsData.overview.excused_count }} Uzur</span>
                </span>
              </div>
              <span :class="[
                'px-1.5 py-0.5 rounded text-[10px] font-bold',
                (analyticsData.overview?.fardhu_compliance_rate ?? 0) >= 80 ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
              ]">
                {{ !analyticsData.overview?.total_ibadah_entries ? '-' : ((analyticsData.overview?.fardhu_compliance_rate ?? 0) >= 80 ? 'Sangat Tertib' : 'Perlu Pendisiplinan') }}
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
              <span class="text-2xl font-black text-slate-900 dark:text-zinc-100">{{ analyticsData.overview?.total_ibadah_entries ?? 0 }}</span>
              <span class="text-xs text-slate-500">sesi checklist</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs">
              <span class="text-slate-500 dark:text-zinc-400">{{ analyticsData.overview?.active_ibadah_students ?? 0 }} santri terdata</span>
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

            <div v-if="!analyticsData.juz_distribution || analyticsData.juz_distribution.length === 0" class="py-12 text-center text-slate-400">
              <BookMarked class="mx-auto mb-2 opacity-30 text-emerald-600" :size="32" />
              <p class="text-xs">Belum ada data setoran tahfidz pada rentang filter ini.</p>
            </div>

            <div v-else class="space-y-4">
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                <div
                  v-for="j in (analyticsData.juz_distribution || [])"
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

            <div v-if="!analyticsData.fluency_breakdown || analyticsData.fluency_breakdown.length === 0" class="py-12 text-center text-slate-400">
              <p class="text-xs">Belum ada rekapan kelancaran santri.</p>
            </div>

            <div v-else class="space-y-3.5">
              <div v-for="f in (analyticsData.fluency_breakdown || [])" :key="f.fluency_level || f.name" class="space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-700 dark:text-zinc-300">{{ f.fluency_level || f.name }}</span>
                  <span class="font-extrabold text-slate-900 dark:text-zinc-100">
                    {{ f.count }} setoran ({{ f.percentage ?? (analyticsData.overview?.total_setoran ? Math.round((f.count / analyticsData.overview.total_setoran) * 100) : 0) }}%)
                  </span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="[
                      (f.fluency_level || f.name) === 'Mutqin' ? 'bg-emerald-500' : (
                        (f.fluency_level || f.name) === 'Mumtaz' ? 'bg-teal-500' : (
                          (f.fluency_level || f.name) === 'Jayyid Jiddan' ? 'bg-sky-500' : (
                            (f.fluency_level || f.name) === 'Jayyid' ? 'bg-amber-500' : 'bg-rose-500'
                          )
                        )
                      )
                    ]"
                    :style="{ width: `${f.percentage ?? (analyticsData.overview?.total_setoran ? Math.round((f.count / analyticsData.overview.total_setoran) * 100) : 0)}%` }"
                  ></div>
                </div>
              </div>

              <!-- Status Kelulusan Mini Box -->
              <div class="pt-3 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-2 gap-2 text-center">
                <div class="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40">
                  <span class="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Lulus Munaqasyah</span>
                  <span class="text-base font-black text-emerald-700 dark:text-emerald-400">
                    {{ analyticsData.status_breakdown?.find((s: any) => (s.status || s.name) === 'Lulus')?.count || 0 }} sesi
                  </span>
                </div>
                <div class="p-2 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/40">
                  <span class="block text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase">Perlu Muroja'ah</span>
                  <span class="text-base font-black text-rose-700 dark:text-rose-400">
                    {{ (analyticsData.status_breakdown?.find((s: any) => (s.status || s.name) === 'Belum Lulus')?.count || 0) + (analyticsData.status_breakdown?.find((s: any) => (s.status || s.name) === 'Muroja\'ah')?.count || 0) }} sesi
                  </span>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Section 3: Matriks Kepatuhan Amalan Mutaaba'ah (Dinamis dari Backend) -->
        <BaseCard stripe class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <div class="flex items-center gap-2">
              <Sun class="text-amber-500" :size="18" />
              <h3 class="font-black text-sm text-slate-900 dark:text-zinc-100">Matriks Kedisiplinan Mutaaba'ah Ibadah Santri</h3>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs text-slate-500 dark:text-zinc-400">
                Total {{ analyticsData.ibadah_matrix?.total_records || 0 }} catatan
              </span>
              <span
                v-if="analyticsData.overview?.excused_count"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-100 dark:border-rose-900/40 flex items-center gap-1"
                :title="`${analyticsData.overview.excused_count} santriwati berhalangan/uzur syar'i dikecualikan dari sholat fardhu`"
              >
                <span>🌸</span>
                <span>{{ analyticsData.overview.excused_count }} Uzur Syar'i (Dikecualikan Fardhu)</span>
              </span>
            </div>
          </div>

          <div v-if="!analyticsData.ibadah_matrix?.items?.length" class="py-8 text-center text-slate-400">
            <Clock class="mx-auto mb-2 opacity-30 text-amber-500" :size="28" />
            <p class="text-xs">Belum ada amalan mutaaba'ah yang tercatat atau ditugaskan.</p>
          </div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div
              v-for="item in (analyticsData.ibadah_matrix?.items || [])"
              :key="item.id"
              class="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/40 text-center space-y-1.5 hover:border-emerald-500/50 transition"
            >
              <div class="flex items-center justify-between gap-1 text-[10px]">
                <span class="font-bold truncate text-slate-700 dark:text-zinc-300" :title="item.title">{{ item.title }}</span>
                <span
                  :class="[
                    'px-1.5 py-0.2 rounded text-[9px] font-extrabold shrink-0 uppercase',
                    item.category === 'fardhu'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                  ]"
                >
                  {{ item.category }}
                </span>
              </div>
              <p class="text-lg font-black text-slate-900 dark:text-zinc-100">{{ item.compliance_rate }}%</p>
              <div class="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  :class="[
                    'h-full rounded-full transition-all duration-500',
                    item.category === 'fardhu' ? 'bg-emerald-500' : 'bg-amber-500'
                  ]"
                  :style="{ width: `${item.compliance_rate}%` }"
                ></div>
              </div>
              <div class="text-[9px] text-slate-400 flex items-center justify-between">
                <span class="font-bold text-slate-600 dark:text-zinc-300">{{ item.total_completed }} selesai</span>
                <span v-if="item.category === 'fardhu' && (item.excused_count || analyticsData.overview?.excused_count)" class="flex items-center gap-0.5 font-medium">
                  <span>{{ item.total_eligible_records }} wajib</span>
                  <span class="text-rose-500 dark:text-rose-400 font-bold" :title="`${item.excused_count || analyticsData.overview?.excused_count} santriwati uzur syar'i dikecualikan`">(+{{ item.excused_count || analyticsData.overview?.excused_count }}🌸)</span>
                </span>
                <span v-else>{{ item.total_eligible_records }} santri</span>
              </div>
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

            <div v-if="!analyticsData.top_students || analyticsData.top_students.length === 0" class="py-12 text-center text-slate-400">
              <p class="text-xs">Belum ada setoran tercatat untuk menentukan santri teraktif.</p>
            </div>

            <div v-else class="space-y-2.5">
              <div
                v-for="(s, idx) in (analyticsData.top_students || [])"
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

            <div v-if="!analyticsData.students_needing_support || analyticsData.students_needing_support.length === 0" class="py-12 text-center text-slate-400">
              <CheckCircle2 class="mx-auto mb-2 text-emerald-500 opacity-60" :size="32" />
              <p class="text-xs text-emerald-600 font-bold">Alhamdulillah, seluruh santri lulus setoran dengan nilai baik!</p>
            </div>

            <div v-else class="space-y-2.5">
              <div
                v-for="s in (analyticsData.students_needing_support || [])"
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
              {{ analyticsData.school_comparison?.length || 0 }} Unit Terdaftar
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
                  v-for="s in (analyticsData.school_comparison || [])"
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
        <BaseCard v-if="analyticsData.class_comparison?.length" stripe class="space-y-4">
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
                  v-for="c in (analyticsData.class_comparison || [])"
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
                      @click="filterByClass(c.class_id, c.school_id)"
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
      </div>
    </div>

    <!-- TAB 1: INPUT SETORAN TAHFIDZ -->
    <div v-show="activeTab === 'tahfidz'" class="space-y-6">
      <!-- Empty State (When no class is selected) -->
      <div
        v-if="!selectedClassId"
        class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-16 text-center text-slate-400 dark:text-zinc-500 shadow-sm"
      >
        <BookOpen class="mx-auto mb-3 opacity-40 text-emerald-600" :size="40" />
        <h3 class="font-bold text-slate-700 dark:text-zinc-300 text-sm">Belum Ada Kelas yang Dipilih</h3>
        <p class="text-xs mt-1 max-w-sm mx-auto">
          Silakan tentukan unit sekolah, tahun ajaran, dan kelas rombel/kamar di atas untuk mengelola setoran tahfidz santri.
        </p>
      </div>

      <!-- Main Content when class is selected -->
      <div v-else class="space-y-6">
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
    </div>

    <!-- TAB 2: MUTAABA'AH IBADAH SANTRI (BULK CHECKLIST DINAMIS) -->
    <div v-show="activeTab === 'ibadah'" class="space-y-6">
      <!-- Empty State (When no class is selected) -->
      <div
        v-if="!selectedClassId"
        class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-16 text-center text-slate-400 dark:text-zinc-500 shadow-sm"
      >
        <Clock class="mx-auto mb-3 opacity-40 text-indigo-600" :size="40" />
        <h3 class="font-bold text-slate-700 dark:text-zinc-300 text-sm">Belum Ada Kelas yang Dipilih</h3>
        <p class="text-xs mt-1 max-w-sm mx-auto">
          Silakan tentukan unit sekolah, tahun ajaran, dan kelas rombel/kamar di atas untuk mengisi checklist mutaaba'ah ibadah santri.
        </p>
      </div>

      <!-- Main Ibadah Content when class is selected -->
      <div v-else class="space-y-6">
        <!-- Section 1: Live Executive Summary KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- KPI 1: Total Santri Rombel -->
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Santri Rombel</span>
              <span class="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Users :size="16" />
              </span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl font-black text-slate-900 dark:text-zinc-100">{{ ibadahStats.total }}</span>
              <span class="text-xs text-slate-500">santri terdaftar</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs font-semibold">
              <span class="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span> {{ ibadahStats.hadir }} Hadir
              </span>
              <span class="text-rose-500 dark:text-rose-400 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-rose-400"></span> {{ ibadahStats.uzur }} Uzur Syar'i
              </span>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
          </div>

          <!-- KPI 2: Kepatuhan Sholat Fardhu -->
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Kepatuhan Sholat Fardhu</span>
              <span class="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                <CheckCircle2 :size="16" />
              </span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl font-black text-slate-900 dark:text-zinc-100">{{ ibadahStats.fardhuCompletionPct }}%</span>
              <span class="text-xs text-slate-500">berjamaah</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs font-semibold">
              <span class="text-slate-500 dark:text-zinc-400">Evaluasi Fardhu</span>
              <span
                :class="[
                  'px-1.5 py-0.5 rounded text-[10px] font-bold',
                  ibadahStats.fardhuCompletionPct >= 80
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                ]"
              >
                {{ ibadahStats.fardhuCompletionPct >= 80 ? 'Sangat Tertib' : 'Perlu Didisiplinkan' }}
              </span>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
          </div>

          <!-- KPI 3: Kelengkapan Amalan Harian -->
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Kelengkapan Amalan</span>
              <span class="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                <Sparkles :size="16" />
              </span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl font-black text-slate-900 dark:text-zinc-100">{{ ibadahStats.completedStudents }}</span>
              <span class="text-xs text-slate-500">/ {{ ibadahStats.total }} santri selesai</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs font-semibold">
              <span class="text-slate-500 dark:text-zinc-400">Total Progres</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {{ ibadahStats.overallCompletionPct }}% Terlaksana
              </span>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400"></div>
          </div>

          <!-- KPI 4: Status Sinkronisasi Data -->
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Status Penyimpanan</span>
              <span
                :class="[
                  'p-2 rounded-lg',
                  hasUnsavedChanges
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                ]"
              >
                <Save :size="16" />
              </span>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <span
                v-if="hasUnsavedChanges"
                class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"
              ></span>
              <span
                v-else
                class="w-2.5 h-2.5 rounded-full bg-emerald-500"
              ></span>
              <span class="text-lg font-black text-slate-900 dark:text-zinc-100">
                {{ hasUnsavedChanges ? 'Belum Disimpan' : 'Tersimpan Rapi' }}
              </span>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs">
              <span class="text-slate-500 dark:text-zinc-400">
                {{ hasUnsavedChanges ? 'Ada checklist diubah' : 'Sinkron dengan server' }}
              </span>
              <span
                :class="[
                  'px-1.5 py-0.5 rounded text-[10px] font-bold',
                  hasUnsavedChanges
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                ]"
              >
                {{ hasUnsavedChanges ? 'Draft Lokal' : 'Tersinkron' }}
              </span>
            </div>
            <div
              class="absolute bottom-0 left-0 right-0 h-1"
              :class="hasUnsavedChanges ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-indigo-500 to-purple-400'"
            ></div>
          </div>
        </div>

        <!-- Section 2: Main Checklist Card & Interactive Controls -->
        <BaseCard stripe class="border-t-4 border-t-indigo-600 space-y-4">
          <!-- Action Toolbar Header -->
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <div class="flex items-center gap-2">
                <span class="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Clock :size="18" />
                </span>
                <h3 class="font-black text-base text-slate-900 dark:text-zinc-100">
                  Checklist Mutaaba'ah Sholat & Ibadah Massal
                </h3>
              </div>
              <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                <span>Tanggal: <strong class="text-slate-800 dark:text-zinc-200">{{ formatIndoDate(selectedDate || todayDate) }}</strong></span>
                <span class="text-slate-300 dark:text-zinc-700">&bull;</span>
                <span>Unit: <strong class="text-slate-800 dark:text-zinc-200">{{ schools.find((s: any) => s.id === selectedSchoolId)?.name || 'Sekolah' }}</strong></span>
                <span class="text-slate-300 dark:text-zinc-700">&bull;</span>
                <span>Rombel: <strong class="text-slate-800 dark:text-zinc-200">{{ classes.find((c: any) => c.id === selectedClassId)?.class_name || 'Kelas' }}</strong></span>
              </p>
            </div>

            <!-- Toolbar Buttons -->
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-if="canManageFoundationMaster"
                type="button"
                @click="openMasterModal"
                class="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Kelola bank amalan yayasan dan penugasan per unit sekolah"
              >
                <Settings :size="14" />
                <span>Atur Amalan Yayasan</span>
              </button>

              <button
                type="button"
                @click="setAllFardhu"
                class="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Centang seluruh sholat fardhu 5 waktu untuk santri yang hadir (santriwati uzur dikecualikan otomatis)"
              >
                <Check :size="14" class="text-emerald-600" />
                <span>Centang Fardhu Semua</span>
              </button>

              <button
                type="button"
                @click="resetAllIbadahChecks"
                class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Kosongkan seluruh checklist amalan pada tanggal ini"
              >
                <RotateCcw :size="14" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                @click="handleSaveBulkIbadah"
                :disabled="saving"
                class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer relative"
              >
                <RefreshCw v-if="saving" :size="14" class="animate-spin" />
                <Save v-else :size="14" />
                <span>{{ saving ? 'Menyimpan...' : 'Simpan Seluruh Data' }}</span>
                <span
                  v-if="hasUnsavedChanges"
                  class="w-2 h-2 rounded-full bg-amber-300 animate-ping absolute -top-1 -right-1"
                  title="Ada perubahan belum tersimpan"
                ></span>
              </button>
            </div>
          </div>

          <!-- Empty State if no assigned items for this school -->
          <div v-if="assignedMutabaahItems.length === 0" class="py-12 text-center text-slate-400">
            <AlertCircle class="mx-auto mb-2 text-amber-500 opacity-60" :size="32" />
            <p class="text-sm font-bold text-slate-700 dark:text-zinc-300">Belum Ada Amalan yang Ditugaskan untuk Sekolah Ini</p>
            <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Yayasan perlu memilih dan menugaskan amalan dari Bank Amalan Yayasan agar muncul di form checklist harian santri.
            </p>
            <button
              v-if="canManageFoundationMaster"
              type="button"
              @click="openMasterModal"
              class="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Settings :size="14" />
              <span>Buka Pengaturan Amalan Yayasan</span>
            </button>
          </div>

          <!-- Search & Filter Filter Bar -->
          <div v-else class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-2">
            <!-- Search Input -->
            <div class="relative flex-1 max-w-xs">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="14" />
              <input
                type="text"
                v-model="ibadahSearch"
                placeholder="Cari nama santri / NIS..."
                class="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400"
              />
              <button
                v-if="ibadahSearch"
                type="button"
                @click="ibadahSearch = ''"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-xs"
              >
                &times;
              </button>
            </div>

            <!-- Filter Status Tabs -->
            <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/70 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                @click="ibadahStatusFilter = 'all'"
                :class="[
                  'px-3 py-1 rounded-lg transition cursor-pointer whitespace-nowrap',
                  ibadahStatusFilter === 'all'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                ]"
              >
                Semua ({{ classStudents.length }})
              </button>
              <button
                type="button"
                @click="ibadahStatusFilter = 'hadir'"
                :class="[
                  'px-3 py-1 rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-1',
                  ibadahStatusFilter === 'hadir'
                    ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-emerald-600'
                ]"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Hadir ({{ ibadahStats.hadir }})</span>
              </button>
              <button
                type="button"
                @click="ibadahStatusFilter = 'uzur'"
                :class="[
                  'px-3 py-1 rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-1',
                  ibadahStatusFilter === 'uzur'
                    ? 'bg-white dark:bg-zinc-900 text-rose-700 dark:text-rose-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-rose-600'
                ]"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                <span>🌸 Uzur ({{ ibadahStats.uzur }})</span>
              </button>
              <button
                type="button"
                @click="ibadahStatusFilter = 'incomplete'"
                :class="[
                  'px-3 py-1 rounded-lg transition cursor-pointer whitespace-nowrap',
                  ibadahStatusFilter === 'incomplete'
                    ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-amber-600'
                ]"
              >
                ⏳ Belum Lengkap
              </button>
            </div>
          </div>

          <!-- Student Checklist Matrix Table -->
          <div v-if="assignedMutabaahItems.length > 0" class="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-xl relative max-h-[70vh]">
            <table class="w-full text-left text-xs border-collapse">
              <!-- Sticky Table Header with Informative Prayer Details -->
              <thead class="sticky top-0 bg-slate-50/95 dark:bg-zinc-900/95 backdrop-blur-md z-20 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
                <tr>
                  <!-- Kolom 1: Nama Santri (Sticky Left) -->
                  <th class="py-3 px-3.5 sticky left-0 bg-slate-50/95 dark:bg-zinc-900/95 backdrop-blur-md z-30 min-w-[200px] border-r border-slate-200/60 dark:border-zinc-800/60">
                    <div class="flex items-center justify-between">
                      <span class="font-extrabold uppercase text-[10px] tracking-wider text-slate-600 dark:text-zinc-300">
                        Nama Santri
                      </span>
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                        {{ filteredClassStudents.length }}
                      </span>
                    </div>
                  </th>

                  <!-- Kolom 2: Status Uzur / Haid -->
                  <th class="py-3 px-2 text-center min-w-[100px] border-r border-slate-200/60 dark:border-zinc-800/60" title="Status Uzur Syar'i (Haid/Sakit) untuk santriwati">
                    <div class="flex flex-col items-center">
                      <span class="font-extrabold uppercase text-[10px] tracking-wider text-slate-600 dark:text-zinc-300">
                        Uzur / Haid
                      </span>
                      <span class="text-[9px] text-slate-400 font-semibold mt-0.5">
                        {{ ibadahStats.uzur }} Uzur
                      </span>
                    </div>
                  </th>

                  <!-- Kolom Amalan Dinamis -->
                  <th
                    v-for="item in assignedMutabaahItems"
                    :key="item.id"
                    class="py-2.5 px-3 text-center min-w-[125px] border-r border-slate-200/60 dark:border-zinc-800/60 group"
                  >
                    <div class="flex flex-col items-center gap-1">
                      <!-- Amalan Icon + Name -->
                      <div class="flex items-center gap-1.5 font-black text-slate-800 dark:text-zinc-100 text-[11px]">
                        <component
                          :is="getItemIconComponent(item)"
                          :size="14"
                          :class="[
                            'shrink-0',
                            item.category === 'fardhu'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : (item.category === 'sunnah' ? 'text-amber-500' : 'text-purple-500')
                          ]"
                        />
                        <span class="truncate max-w-[100px]" :title="getItemName(item)">
                          {{ getItemName(item) }}
                        </span>
                      </div>

                      <!-- Category Badge -->
                      <span
                        :class="[
                          'text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded tracking-wider',
                          item.category === 'fardhu'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : (item.category === 'sunnah' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300')
                        ]"
                      >
                        {{ item.category }}
                      </span>

                      <!-- Column Live Completion Stat & 1-Click Action -->
                      <div class="flex items-center gap-1 mt-0.5">
                        <span
                          class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                          title="Jumlah santri yang telah melaksanakan amalan ini"
                        >
                          {{ getColumnStats(item.id, item.category).checked }}/{{ getColumnStats(item.id, item.category).total }}
                        </span>

                        <button
                          type="button"
                          @click="toggleColumn(item)"
                          class="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-emerald-600 transition cursor-pointer"
                          :title="`Klik untuk centang/batal seluruh kolom: ${getItemName(item)}`"
                        >
                          <CheckCheck :size="12" />
                        </button>
                      </div>
                    </div>
                  </th>

                  <!-- Kolom Progres Santri -->
                  <th class="py-3 px-3 text-center min-w-[110px] border-r border-slate-200/60 dark:border-zinc-800/60">
                    <span class="font-extrabold uppercase text-[10px] tracking-wider text-slate-600 dark:text-zinc-300">
                      Progres
                    </span>
                  </th>

                  <!-- Kolom Catatan Musyrif -->
                  <th class="py-3 px-3 min-w-[180px]">
                    <span class="font-extrabold uppercase text-[10px] tracking-wider text-slate-600 dark:text-zinc-300">
                      Catatan Musyrif
                    </span>
                  </th>
                </tr>
              </thead>

              <!-- Table Body -->
              <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                <tr
                  v-for="s in filteredClassStudents"
                  :key="s.id"
                  class="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition group"
                  :class="{ 'bg-rose-50/20 dark:bg-rose-950/10': ibadahGrid[s.id]?.is_excused }"
                >
                  <!-- Kolom 1: Nama Santri (Sticky Left) -->
                  <td class="py-2.5 px-3.5 whitespace-nowrap sticky left-0 bg-white dark:bg-zinc-900 group-hover:bg-slate-50/90 dark:group-hover:bg-zinc-800/90 z-10 border-r border-slate-200/60 dark:border-zinc-800/60">
                    <div class="flex items-center gap-2.5">
                      <!-- Avatar with Initials & Gender Theme -->
                      <div
                        :class="[
                          'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs',
                          s.gender === 'P'
                            ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-800'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        ]"
                      >
                        {{ getInitials(s.full_name) }}
                      </div>

                      <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                          <p class="font-bold text-slate-900 dark:text-zinc-100 text-xs truncate max-w-[140px]" :title="s.full_name">
                            {{ s.full_name }}
                          </p>
                          <span
                            v-if="s.gender === 'P'"
                            class="px-1 py-0.2 rounded text-[8px] font-extrabold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300"
                            title="Santriwati (Akhwat)"
                          >
                            P
                          </span>
                        </div>
                        <p class="text-[10px] text-slate-400 font-mono">{{ s.student_number || 'NIS -' }}</p>
                      </div>

                      <!-- 1-Click Row Check All -->
                      <button
                        type="button"
                        @click="toggleStudentAll(s.id)"
                        class="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                        title="Centang/batal seluruh amalan santri ini"
                      >
                        <CheckCheck :size="13" />
                      </button>
                    </div>
                  </td>

                  <!-- Kolom 2: Uzur / Haid Toggle -->
                  <td class="py-2.5 px-2 text-center whitespace-nowrap border-r border-slate-200/60 dark:border-zinc-800/60">
                    <button
                      type="button"
                      @click="toggleStudentExcused(s.id)"
                      :class="[
                        'px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer border shadow-2xs inline-flex items-center gap-1',
                        ibadahGrid[s.id]?.is_excused
                          ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800 ring-2 ring-rose-400/20'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                      ]"
                      :title="ibadahGrid[s.id]?.is_excused ? 'Klik untuk membatalkan status uzur' : 'Klik jika santriwati berhalangan syar\'i (haid/sakit)'"
                    >
                      <span v-if="ibadahGrid[s.id]?.is_excused">🌸 Uzur Syar'i</span>
                      <span v-else class="flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Hadir</span>
                      </span>
                    </button>
                  </td>

                  <!-- Kolom Amalan Dinamis Checkboxes -->
                  <td
                    v-for="item in assignedMutabaahItems"
                    :key="item.id"
                    class="py-2.5 px-2 text-center border-r border-slate-200/60 dark:border-zinc-800/60"
                  >
                    <!-- Jika Santri Uzur Syar'i & Amalan Fardhu -> Dikecualikan Syar'i -->
                    <span
                      v-if="ibadahGrid[s.id]?.is_excused && item.category === 'fardhu'"
                      class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50 cursor-not-allowed select-none"
                      title="Santriwati sedang berhalangan syar'i (tidak wajib sholat fardhu & tidak dihitung alpha)"
                    >
                      🌸 Dikecualikan
                    </span>

                    <!-- Checkbox Amalan -->
                    <label
                      v-else
                      class="inline-flex items-center justify-center p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        v-if="ibadahGrid[s.id] && ibadahGrid[s.id].check_data"
                        v-model="ibadahGrid[s.id].check_data[item.id]"
                        @change="markIbadahChanged"
                        class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer accent-emerald-600 transition"
                        :title="`${s.full_name} - ${getItemName(item)}`"
                      />
                    </label>
                  </td>

                  <!-- Kolom Progres Santri -->
                  <td class="py-2.5 px-3 text-center border-r border-slate-200/60 dark:border-zinc-800/60">
                    <div class="flex flex-col items-center gap-1">
                      <span
                        :class="[
                          'text-[10px] font-extrabold px-1.5 py-0.2 rounded font-mono',
                          getStudentProgress(s.id).pct === 100
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : (getStudentProgress(s.id).pct >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400')
                        ]"
                      >
                        {{ getStudentProgress(s.id).completed }}/{{ getStudentProgress(s.id).total }} ({{ getStudentProgress(s.id).pct }}%)
                      </span>
                      <div class="w-16 bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all duration-300"
                          :class="getStudentProgress(s.id).pct === 100 ? 'bg-emerald-500' : (getStudentProgress(s.id).pct >= 50 ? 'bg-amber-500' : 'bg-slate-400')"
                          :style="{ width: `${getStudentProgress(s.id).pct}%` }"
                        ></div>
                      </div>
                    </div>
                  </td>

                  <!-- Kolom Catatan Musyrif -->
                  <td class="py-2.5 px-3">
                    <input
                      type="text"
                      v-if="ibadahGrid[s.id]"
                      v-model="ibadahGrid[s.id].notes"
                      @input="markIbadahChanged"
                      placeholder="Catatan sholat/ibadah..."
                      class="w-full min-w-[160px] bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-[11px] outline-none focus:border-indigo-500 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 transition"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- MODAL: KELOLA BANK AMALAN YAYASAN & PENUGASAN SEKOLAH -->
    <div
      v-if="showMasterModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        class="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/80">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Settings :size="20" />
            </div>
            <div>
              <h3 class="font-black text-base text-slate-900 dark:text-zinc-100">
                Pengaturan Bank Amalan Mutaaba'ah Yayasan
              </h3>
              <p class="text-xs text-slate-400">
                Kelola master item amalan yayasan dan penugasan ke unit sekolah di bawah naungan.
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="showMasterModal = false"
            class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X :size="20" />
          </button>
        </div>

        <!-- Modal Sub-Tab Bar -->
        <div class="flex border-b border-slate-200 dark:border-zinc-800 px-6 bg-slate-50/30 dark:bg-zinc-900/40">
          <button
            type="button"
            @click="activeMasterTab = 'items'"
            :class="[
              'px-4 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer',
              activeMasterTab === 'items'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400'
            ]"
          >
            <CheckSquare :size="15" />
            <span>Bank Amalan Yayasan (Master)</span>
          </button>
          <button
            type="button"
            @click="activeMasterTab = 'assign'"
            :class="[
              'px-4 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer',
              activeMasterTab === 'assign'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400'
            ]"
          >
            <Building2 :size="15" />
            <span>Penugasan ke Unit Sekolah</span>
          </button>
        </div>

        <!-- Modal Body Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- TAB 1: BANK AMALAN YAYASAN -->
          <div v-show="activeMasterTab === 'items'" class="space-y-6">
            <!-- Form Input / Edit Item -->
            <div class="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-xs text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Plus :size="14" class="text-purple-600" />
                  <span>{{ isEditingMasterItem ? 'Ubah Data Amalan' : 'Tambah Amalan Baru' }}</span>
                </h4>
                <button
                  v-if="isEditingMasterItem"
                  type="button"
                  @click="resetMasterItemForm"
                  class="text-[11px] text-slate-400 hover:underline cursor-pointer"
                >
                  Batal Edit
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div class="sm:col-span-2">
                  <label class="block font-bold text-slate-600 dark:text-zinc-400 mb-1">Nama Amalan *</label>
                  <input
                    type="text"
                    v-model="masterItemForm.name"
                    placeholder="Contoh: Sholat Dhuha, Dzikir Pagi"
                    class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-purple-600 text-slate-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label class="block font-bold text-slate-600 dark:text-zinc-400 mb-1">Kategori *</label>
                  <select
                    v-model="masterItemForm.category"
                    class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-purple-600 text-slate-900 dark:text-zinc-100"
                  >
                    <option value="fardhu">Fardhu (Wajib)</option>
                    <option value="sunnah">Sunnah</option>
                    <option value="tahfidz">Tahfidz & Murojaah</option>
                    <option value="adab_karakter">Adab & Karakter</option>
                    <option value="kedisiplinan">Kedisiplinan</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-slate-600 dark:text-zinc-400 mb-1">Target Santri</label>
                  <select
                    v-model="masterItemForm.target_gender"
                    class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-purple-600 text-slate-900 dark:text-zinc-100"
                  >
                    <option value="all">Semua (Putra & Putri)</option>
                    <option value="male">Khusus Santri Putra</option>
                    <option value="female">Khusus Santri Putri</option>
                  </select>
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  @click="handleSaveMasterItem"
                  :disabled="savingMasterItem || !masterItemForm.name.trim()"
                  class="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Save :size="14" />
                  <span>{{ isEditingMasterItem ? 'Perbarui Amalan' : 'Simpan Amalan ke Bank' }}</span>
                </button>
              </div>
            </div>

            <!-- List Amalan Yayasan -->
            <div class="space-y-2">
              <h4 class="font-bold text-xs text-slate-700 dark:text-zinc-300">
                Daftar Amalan Terdaftar ({{ foundationMasterItems.length }} Amalan)
              </h4>

              <div v-if="foundationMasterItems.length === 0" class="py-8 text-center text-slate-400 text-xs">
                Belum ada master amalan. Buat baru di formulir atas.
              </div>

              <div v-else class="divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                <div
                  v-for="(item, idx) in foundationMasterItems"
                  :key="item.id"
                  class="p-3.5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition text-xs"
                >
                  <div class="flex items-center gap-3">
                    <span class="w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                      {{ item.order_index ?? (idx + 1) }}
                    </span>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-900 dark:text-zinc-100">{{ item.name }}</span>
                        <span
                          :class="[
                            'px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase',
                            item.category === 'fardhu'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                          ]"
                        >
                          {{ item.category }}
                        </span>
                        <span
                          v-if="item.target_gender && item.target_gender !== 'all'"
                          class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                        >
                          {{ item.target_gender === 'female' ? 'Santriwati' : 'Santriwan' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <button
                      type="button"
                      @click="editMasterItem(item)"
                      class="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer"
                      title="Edit Amalan"
                    >
                      <Edit2 :size="14" />
                    </button>
                    <button
                      type="button"
                      @click="handleDeleteMasterItem(item)"
                      class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Hapus Amalan"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: PENUGASAN KE UNIT SEKOLAH -->
          <div v-show="activeMasterTab === 'assign'" class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
              <div class="flex items-center gap-2">
                <Building2 class="text-purple-600" :size="18" />
                <span class="text-xs font-bold text-slate-800 dark:text-zinc-200">Pilih Unit Sekolah:</span>
              </div>
              <select
                v-model="selectedAssignSchoolId"
                class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:border-purple-600 text-slate-900 dark:text-zinc-100 min-w-[200px]"
              >
                <option v-for="sc in schools" :key="sc.id" :value="sc.id">{{ sc.name }}</option>
              </select>
            </div>

            <!-- Table Assignment Checklist -->
            <div class="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-semibold text-[10px] uppercase tracking-wider bg-slate-50/50 dark:bg-zinc-900/50">
                    <th class="py-2.5 px-3">Nama Amalan</th>
                    <th class="py-2.5 px-2 text-center">Kategori</th>
                    <th class="py-2.5 px-3 text-center">Aktif di Sekolah</th>
                    <th class="py-2.5 px-3 text-center">Wajib Diisi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/60">
                  <template v-if="currentSchoolAssignments">
                    <tr
                      v-for="item in currentSchoolAssignments.assigned_items"
                      :key="item.id"
                      class="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition"
                    >
                      <td class="py-2.5 px-3">
                        <p class="font-bold text-slate-900 dark:text-zinc-100">{{ item.name }}</p>
                      </td>
                      <td class="py-2.5 px-2 text-center">
                        <span
                          :class="[
                            'px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase',
                            item.category === 'fardhu'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                          ]"
                        >
                          {{ item.category }}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          v-model="item.is_assigned"
                          class="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                        />
                      </td>
                      <td class="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          v-model="item.is_mandatory"
                          :disabled="!item.is_assigned"
                          class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer disabled:opacity-40"
                        />
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                @click="handleSaveSchoolAssignments"
                :disabled="savingAssignment || !selectedAssignSchoolId"
                class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-md"
              >
                <Save :size="14" />
                <span>Simpan Penugasan Sekolah</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
