<script setup lang="ts">
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  BookOpen, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Settings, 
  DollarSign, 
  Settings2, 
  FileSignature, 
  Search,
  Check,
  X,
  CalendarRange,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useTeacher } from '../composables/useTeacher'
import { useAcademicYear } from '../composables/useAcademicYear'
import { useLeave } from '../composables/useLeave'
import { useAuth } from '../composables/useAuth'
import { useApi } from '../composables/useApi'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_cookie')
      if (!token.value) {
        const altToken = useCookie('auth_token')
        if (!altToken.value) {
          return navigateTo('/login')
        }
      }
    }
  ]
})

const { isSchoolLocked, selectedFoundationId, selectedSchoolId, foundations, schools, initContext, onFoundationChange } = useSchoolContext()
const { teachers, fetchTeachers } = useTeacher()
const { academicYears, fetchAcademicYears } = useAcademicYear()
const { 
  leaveTypes, 
  leaveQuotas, 
  leaveRequests, 
  leaveRequestsMeta,
  vacancies,
  fetchLeaveTypes, 
  createLeaveType, 
  updateLeaveType, 
  deleteLeaveType, 
  fetchLeaveQuotas, 
  updateLeaveQuota, 
  initializeLeaveQuotas,
  fetchLeaveRequests, 
  createLeaveRequest, 
  updateLeaveRequest,
  decideLeaveRequest, 
  cancelLeaveRequest,
  fetchSubstitutionRecap,
  fetchVacancies,
  confirmSubstitution,
  declineSubstitution
} = useLeave()
const { page, itemPerPage } = usePagination(10)
const { page: replacementsPage, itemPerPage: replacementsItemPerPage } = usePagination(10)
const { fetcher } = useApi()

const quotaTeachers = ref<any[]>([])
const quotaTeachersPage = ref(1)
const quotaTeachersLoading = ref(false)
const quotaTeachersHasMore = ref(true)
const teacherListContainer = ref<HTMLElement | null>(null)

const checkAndLoadMore = async () => {
  await nextTick()
  const container = teacherListContainer.value
  if (container) {
    if (container.scrollHeight <= container.clientHeight && quotaTeachersHasMore.value && !quotaTeachersLoading.value) {
      await loadQuotaTeachers(false)
      await checkAndLoadMore()
    }
  }
}

const loadQuotaTeachers = async (reset = false) => {
  if (!selectedSchoolId.value) return
  if (quotaTeachersLoading.value) return
  if (!reset && !quotaTeachersHasMore.value) return

  quotaTeachersLoading.value = true
  if (reset) {
    quotaTeachersPage.value = 1
    quotaTeachers.value = []
    quotaTeachersHasMore.value = true
  }

  try {
    const url = `/school/${selectedSchoolId.value}/teacher`
    const query = {
      page: quotaTeachersPage.value,
      item_per_page: 10
    }
    const res: any = await fetcher(url, { query })
    if (res.success) {
      const data = res.data?.data || res.data || []
      if (reset) {
        quotaTeachers.value = data
      } else {
        quotaTeachers.value = [...quotaTeachers.value, ...data]
      }
      
      const totalItem = res.data?.total_item || data.length || 0
      if (data.length < 10 || quotaTeachers.value.length >= totalItem) {
        quotaTeachersHasMore.value = false
      } else {
        quotaTeachersHasMore.value = true
      }
      
      if (!selectedQuotaTeacherId.value && quotaTeachers.value.length > 0) {
        selectedQuotaTeacherId.value = quotaTeachers.value[0].id
      }
      
      quotaTeachersPage.value++
      
      if (reset) {
        checkAndLoadMore()
      }
    }
  } catch (error) {
    console.error('Failed to load quota teachers:', error)
  } finally {
    quotaTeachersLoading.value = false
  }
}

const handleScroll = (event: Event) => {
  const container = event.target as HTMLElement
  if (container.scrollHeight - container.scrollTop <= container.clientHeight + 10) {
    if (!quotaTeachersLoading.value && quotaTeachersHasMore.value) {
      loadQuotaTeachers(false)
    }
  }
}

const { user } = useAuth()

const selectedAcademicYearId = ref('')
const activeTab = ref<'requests' | 'quotas' | 'types' | 'recap'>('requests')

// Modals toggles
const showCreateRequestModal = ref(false)
const showDecideRequestModal = ref(false)
const showCancelRequestModal = ref(false)
const showCreateTypeModal = ref(false)
const showEditTypeModal = ref(false)
const showEditQuotaModal = ref(false)
const showInitQuotaModal = ref(false)

const initQuotaForm = reactive({
  employee_id: '',
  academic_year_id: '',
  join_date: '',
  prorate_mode: 'full', // 'full' | 'prorate' | 'custom'
  quotas: [] as Array<{ leave_type_id: string, leave_type_name: string, quota_default: number, quota_days: number }>
})

const errorMessage = ref('')
const successMessage = ref('')

// Forms
const requestForm = reactive({
  employee_id: '',
  leave_type_id: '',
  start_date: '',
  end_date: '',
  reason: ''
})

const showEditRequestModal = ref(false)
const editRequestForm = reactive({
  id: '',
  employee_id: '',
  leave_type_id: '',
  start_date: '',
  end_date: '',
  reason: ''
})

const decisionForm = reactive({
  requestId: '',
  status: 'approved' as 'approved' | 'rejected',
  note: ''
})

const cancelForm = reactive({
  requestId: '',
  newEndDate: ''
})

const typeForm = reactive({
  name: '',
  code: '',
  quota_default: 12,
  is_deduct_annual: false,
  is_active: true
})

const editTypeForm = reactive({
  id: '',
  name: '',
  code: '',
  quota_default: 12,
  is_deduct_annual: false,
  is_active: true
})

const editQuotaForm = reactive({
  id: '',
  employeeName: '',
  typeName: '',
  quota_days: 12,
  employeeId: '',
  academicYearId: ''
})

// Recap filters
const selectedRecapMonth = ref(new Date().toISOString().slice(0, 7)) // YYYY-MM
const selectedRecapTeacherId = ref('')
const substitutionRecapList = ref<any[]>([])

// Filters
const filterRequestStatus = ref('')
const filterRequestTeacherId = ref('')
const quotaSearchQuery = ref('')

// Quotas calculation helpers
const activeQuotaRemaining = ref<number | null>(null)

// Custom Toast helper
const toastState = ref<{ show: boolean; type: 'success' | 'error'; message: string }>({
  show: false,
  type: 'success',
  message: ''
})

const showToast = (type: 'success' | 'error', message: string) => {
  toastState.value = { show: true, type, message }
  setTimeout(() => {
    toastState.value.show = false
  }, 4000)
}

// Lifecycle
onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    await loadSchoolData(schoolId)
  }
})

// Watchers
watch(selectedFoundationId, (newVal) => onFoundationChange(newVal))

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await loadSchoolData(newVal)
  } else {
    clearData()
  }
})

watch([selectedAcademicYearId, activeTab], async () => {
  if (selectedSchoolId.value) {
    await loadTabSpecificData()
  }
})

watch(selectedRecapMonth, async () => {
  if (selectedSchoolId.value && activeTab.value === 'recap') {
    await loadRecapData()
  }
})

const loadSchoolData = async (schoolId: string) => {
  await Promise.all([
    fetchTeachers(schoolId, 1, 1000),
    fetchAcademicYears(schoolId),
    fetchLeaveTypes(schoolId)
  ])
  if (academicYears.value.length > 0) {
    const activeAY = academicYears.value.find(ay => ay.is_active)
    selectedAcademicYearId.value = activeAY ? activeAY.id : academicYears.value[0].id
  }
  await loadTabSpecificData()
}

const loadTabSpecificData = async () => {
  if (!selectedSchoolId.value) return
  if (activeTab.value === 'requests') {
    await fetchLeaveRequests(selectedSchoolId.value, page.value, itemPerPage.value, {
      status: filterRequestStatus.value || undefined,
      employee_id: filterRequestTeacherId.value || undefined
    })
  } else if (activeTab.value === 'quotas') {
    await loadQuotaTeachers(true)
  } else if (activeTab.value === 'recap') {
    await loadRecapData()
  } else if (activeTab.value === 'replacements') {
    replacementsPage.value = 1
    await loadReplacementsData()
  }
}

watch([page, itemPerPage], () => {
  if (selectedSchoolId.value && activeTab.value === 'requests') {
    loadTabSpecificData()
  }
})

const loadRecapData = async () => {
  if (!selectedSchoolId.value) return
  try {
    const res = await fetchSubstitutionRecap(selectedSchoolId.value, selectedRecapMonth.value, selectedRecapTeacherId.value || undefined)
    if (res.success) {
      substitutionRecapList.value = res.data
    }
  } catch (e) {
    console.error('Failed to load substitution recap:', e)
  }
}

const myReplacements = computed(() => {
  if (!vacancies.value) return []
  if (['super_admin', 'principal', 'tu'].includes(user.value?.role)) {
    // Admins see all vacancies that have a substitute teacher assigned
    return vacancies.value.filter(v => v.substitute_teacher_id !== null)
  } else {
    // Teachers only see their own assigned replacements
    return vacancies.value.filter(v => v.substitute_teacher_id === user.value?.id)
  }
})

const loadReplacementsData = async () => {
  if (!selectedSchoolId.value) return
  
  const formatDate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const today = new Date()
  const fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const toDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  await fetchVacancies(selectedSchoolId.value, formatDate(fromDate), formatDate(toDate))
}

const handleConfirmReplacement = async (substitutionId: string) => {
  try {
    const res = await confirmSubstitution(selectedSchoolId.value, substitutionId)
    if (res.success) {
      showToast('success', 'Tugas pengganti berhasil diterima!')
      await loadReplacementsData()
    }
  } catch (e: any) {
    showToast('error', e.message || 'Gagal menerima tugas pengganti')
  }
}

const showDeclineModal = ref(false)
const selectedReplacementId = ref('')
const replacementDeclineReason = ref('')

const openDeclineReplacement = (subId: string) => {
  selectedReplacementId.value = subId
  replacementDeclineReason.value = ''
  errorMessage.value = ''
  showDeclineModal.value = true
}

const handleDeclineReplacement = async () => {
  if (!replacementDeclineReason.value.trim()) {
    alert('Alasan penolakan wajib diisi.')
    return
  }
  try {
    const res = await declineSubstitution(selectedSchoolId.value, selectedReplacementId.value, replacementDeclineReason.value)
    if (res.success) {
      showToast('success', 'Tugas pengganti ditolak.')
      showDeclineModal.value = false
      await loadReplacementsData()
    }
  } catch (e: any) {
    errorMessage.value = e.message || 'Gagal menolak tugas pengganti'
  }
}

const clearData = () => {
  teachers.value = []
  academicYears.value = []
  leaveTypes.value = []
  leaveRequests.value = []
  leaveQuotas.value = []
  substitutionRecapList.value = []
  selectedAcademicYearId.value = ''
}

// Watch requestForm fields to calculate sisa kuota
watch(() => [requestForm.employee_id, requestForm.leave_type_id], async ([empId, typeId]) => {
  if (empId && typeId && selectedSchoolId.value && selectedAcademicYearId.value) {
    activeQuotaRemaining.value = null
    await fetchLeaveQuotas(selectedSchoolId.value, empId as string, selectedAcademicYearId.value)
    const activeQuota = leaveQuotas.value.find(q => q.leave_type_id === typeId)
    if (activeQuota) {
      activeQuotaRemaining.value = activeQuota.quota_days - activeQuota.used_days
    } else {
      const type = leaveTypes.value.find(t => t.id === typeId)
      if (type && type.quota_default !== undefined && type.quota_default !== null) {
        activeQuotaRemaining.value = type.quota_default
      }
    }
  } else {
    activeQuotaRemaining.value = null
  }
})

// Trigger requests filters
const handleFilterRequests = async () => {
  page.value = 1
  await fetchLeaveRequests(selectedSchoolId.value, page.value, itemPerPage.value, {
    status: filterRequestStatus.value || undefined,
    employee_id: filterRequestTeacherId.value || undefined
  })
}

// Quota lookup by teacher
const selectedQuotaTeacherId = ref('')
watch(selectedQuotaTeacherId, async (newVal) => {
  if (newVal && selectedSchoolId.value && selectedAcademicYearId.value) {
    await fetchLeaveQuotas(selectedSchoolId.value, newVal, selectedAcademicYearId.value)
  }
})

// CRUD Handlers
const openCreateRequest = () => {
  errorMessage.value = ''
  successMessage.value = ''
  Object.assign(requestForm, {
    employee_id: teachers.value[0]?.id || '',
    leave_type_id: leaveTypes.value[0]?.id || '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  })
  showCreateRequestModal.value = true
}

const handleCreateLeaveRequest = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const res = await createLeaveRequest(selectedSchoolId.value, {
      ...requestForm,
      academic_year_id: selectedAcademicYearId.value
    })
    if (res.success) {
      showCreateRequestModal.value = false
      showToast('success', 'Pengajuan cuti berhasil dibuat!')
      await fetchLeaveRequests(selectedSchoolId.value)
    } else {
      errorMessage.value = res.message || 'Gagal membuat pengajuan cuti'
    }
  } catch (e: any) {
    errorMessage.value = e.data?.message || e.message || 'Gagal membuat pengajuan cuti'
  }
}

const openEditRequest = (req: any) => {
  errorMessage.value = ''
  successMessage.value = ''
  
  // Format dates to YYYY-MM-DD
  const formatStrDate = (dt: string) => {
    if (!dt) return ''
    return dt.split('T')[0]
  }

  Object.assign(editRequestForm, {
    id: req.id,
    employee_id: req.employee_id,
    leave_type_id: req.leave_type_id,
    start_date: formatStrDate(req.start_date),
    end_date: formatStrDate(req.end_date),
    reason: req.reason || ''
  })
  
  showEditRequestModal.value = true
}

const handleUpdateLeaveRequest = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const res = await updateLeaveRequest(selectedSchoolId.value, editRequestForm.id, {
      employee_id: editRequestForm.employee_id,
      leave_type_id: editRequestForm.leave_type_id,
      start_date: editRequestForm.start_date,
      end_date: editRequestForm.end_date,
      reason: editRequestForm.reason,
      academic_year_id: selectedAcademicYearId.value
    })
    if (res.success) {
      showEditRequestModal.value = false
      showToast('success', 'Pengajuan cuti berhasil diperbarui!')
      await fetchLeaveRequests(selectedSchoolId.value)
    } else {
      errorMessage.value = res.message || 'Gagal memperbarui pengajuan cuti'
    }
  } catch (e: any) {
    errorMessage.value = e.data?.message || e.message || 'Gagal memperbarui pengajuan cuti'
  }
}

const openDecideRequest = (req: any, status: 'approved' | 'rejected') => {
  errorMessage.value = ''
  successMessage.value = ''
  Object.assign(decisionForm, {
    requestId: req.id,
    status,
    note: ''
  })
  showDecideRequestModal.value = true
}

const handleDecideLeaveRequest = async () => {
  errorMessage.value = ''
  try {
    const res = await decideLeaveRequest(selectedSchoolId.value, decisionForm.requestId, decisionForm.status, decisionForm.note)
    if (res.success) {
      showDecideRequestModal.value = false
      showToast('success', decisionForm.status === 'approved' ? 'Pengajuan cuti disetujui!' : 'Pengajuan cuti ditolak.')
      await fetchLeaveRequests(selectedSchoolId.value)
    } else {
      errorMessage.value = res.message || 'Gagal memproses pengajuan'
    }
  } catch (e: any) {
    errorMessage.value = e.message || 'Gagal memproses pengajuan'
  }
}

const openCancelRequest = (req: any) => {
  errorMessage.value = ''
  successMessage.value = ''
  Object.assign(cancelForm, {
    requestId: req.id,
    newEndDate: req.end_date.split('T')[0]
  })
  showCancelRequestModal.value = true
}

const handleCancelLeaveRequest = async () => {
  errorMessage.value = ''
  try {
    const res = await cancelLeaveRequest(selectedSchoolId.value, cancelForm.requestId, cancelForm.newEndDate || undefined)
    if (res.success) {
      showCancelRequestModal.value = false
      showToast('success', 'Pengajuan cuti berhasil dibatalkan / dipersingkat!')
      await fetchLeaveRequests(selectedSchoolId.value)
    } else {
      errorMessage.value = res.message || 'Gagal membatalkan pengajuan'
    }
  } catch (e: any) {
    errorMessage.value = e.message || 'Gagal membatalkan pengajuan'
  }
}

// Leave Types CRUD
const openCreateType = () => {
  errorMessage.value = ''
  successMessage.value = ''
  Object.assign(typeForm, {
    name: '',
    code: '',
    quota_default: 12,
    is_deduct_annual: false,
    is_active: true
  })
  showCreateTypeModal.value = true
}

const handleCreateLeaveType = async () => {
  errorMessage.value = ''
  try {
    const res = await createLeaveType(selectedSchoolId.value, { ...typeForm })
    if (res.success) {
      showCreateTypeModal.value = false
      showToast('success', 'Jenis izin berhasil dibuat!')
    } else {
      errorMessage.value = res.message || 'Gagal membuat jenis izin'
    }
  } catch (e: any) {
    errorMessage.value = e.data?.message || e.message || 'Gagal membuat jenis izin'
  }
}

const openEditType = (item: any) => {
  errorMessage.value = ''
  successMessage.value = ''
  Object.assign(editTypeForm, {
    id: item.id,
    name: item.name,
    code: item.code,
    quota_default: item.quota_default,
    is_deduct_annual: !!item.is_deduct_annual,
    is_active: !!item.is_active
  })
  showEditTypeModal.value = true
}

const handleUpdateLeaveType = async () => {
  errorMessage.value = ''
  try {
    const res = await updateLeaveType(selectedSchoolId.value, editTypeForm.id, { ...editTypeForm })
    if (res.success) {
      showEditTypeModal.value = false
      showToast('success', 'Jenis izin berhasil diperbarui!')
    } else {
      errorMessage.value = res.message || 'Gagal memperbarui jenis izin'
    }
  } catch (e: any) {
    errorMessage.value = e.data?.message || e.message || 'Gagal memperbarui jenis izin'
  }
}

const handleDeleteLeaveType = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus jenis izin ini?')) {
    try {
      const res = await deleteLeaveType(selectedSchoolId.value, id)
      if (res.success) {
        showToast('success', 'Jenis izin berhasil dihapus!')
      } else {
        alert(res.message || 'Gagal menghapus jenis izin')
      }
    } catch (e: any) {
      alert(e.message || 'Gagal menghapus jenis izin')
    }
  }
}

// Quota Override
const openEditQuota = (quota: any, teacherName: string) => {
  errorMessage.value = ''
  successMessage.value = ''
  Object.assign(editQuotaForm, {
    id: quota.id,
    employeeName: teacherName,
    typeName: quota.leave_type_name,
    quota_days: quota.quota_days,
    employeeId: quota.employee_id,
    academicYearId: quota.academic_year_id
  })
  showEditQuotaModal.value = true
}

const handleUpdateQuota = async () => {
  errorMessage.value = ''
  try {
    const res = await updateLeaveQuota(selectedSchoolId.value, editQuotaForm.id, editQuotaForm.quota_days, editQuotaForm.employeeId, editQuotaForm.academicYearId)
    if (res.success) {
      showEditQuotaModal.value = false
      showToast('success', 'Kuota cuti guru berhasil disesuaikan!')
      await fetchLeaveQuotas(selectedSchoolId.value, editQuotaForm.employeeId, editQuotaForm.academicYearId)
    } else {
      errorMessage.value = res.message || 'Gagal memperbarui kuota'
    }
  } catch (e: any) {
    errorMessage.value = e.message || 'Gagal memperbarui kuota'
  }
}

// Quota Manual & Prorata Initialization
const calculateProratedQuotas = () => {
  if (initQuotaForm.prorate_mode === 'full') {
    initQuotaForm.quotas.forEach(q => {
      q.quota_days = q.quota_default
    })
  } else if (initQuotaForm.prorate_mode === 'prorate' && initQuotaForm.join_date && selectedAcademicYearId.value) {
    const ay = academicYears.value.find(y => y.id === selectedAcademicYearId.value)
    if (ay) {
      const joinDate = new Date(initQuotaForm.join_date)
      const ayStartDate = new Date(ay.start_date)
      const ayEndDate = new Date(ay.end_date)
      
      // Clamp joinDate to academic year range
      const clampedJoin = new Date(Math.max(ayStartDate.getTime(), Math.min(ayEndDate.getTime(), joinDate.getTime())))
      
      // Calculate total months in academic year
      const totalMonths = (ayEndDate.getFullYear() - ayStartDate.getFullYear()) * 12 + (ayEndDate.getMonth() - ayStartDate.getMonth()) + 1
      
      // Calculate remaining months from join date to end of academic year
      const remainingMonths = (ayEndDate.getFullYear() - clampedJoin.getFullYear()) * 12 + (ayEndDate.getMonth() - clampedJoin.getMonth()) + 1
      
      const ratio = remainingMonths / totalMonths
      
      initQuotaForm.quotas.forEach(q => {
        q.quota_days = Math.max(1, Math.round(ratio * q.quota_default))
      })
    }
  }
}

watch(() => [initQuotaForm.prorate_mode, initQuotaForm.join_date], () => {
  calculateProratedQuotas()
})

const openInitQuota = () => {
  errorMessage.value = ''
  successMessage.value = ''
  initQuotaForm.employee_id = selectedQuotaTeacherId.value
  initQuotaForm.academic_year_id = selectedAcademicYearId.value
  initQuotaForm.join_date = new Date().toISOString().split('T')[0]
  initQuotaForm.prorate_mode = 'full'
  
  // Get active leave types that deduct quota
  const activeTypes = leaveTypes.value.filter(t => t.deducts_quota && t.quota_default !== null)
  initQuotaForm.quotas = activeTypes.map(t => ({
    leave_type_id: t.id,
    leave_type_name: t.name,
    quota_default: t.quota_default,
    quota_days: t.quota_default
  }))
  
  showInitQuotaModal.value = true
}

const handleInitializeQuotas = async () => {
  errorMessage.value = ''
  try {
    const payload = initQuotaForm.quotas.map(q => ({
      leave_type_id: q.leave_type_id,
      quota_days: q.quota_days
    }))
    
    const res = await initializeLeaveQuotas(
      selectedSchoolId.value,
      initQuotaForm.employee_id,
      initQuotaForm.academic_year_id,
      payload
    )
    
    if (res.success) {
      showInitQuotaModal.value = false
      showToast('success', 'Kuota cuti berhasil diinisialisasi!')
      await fetchLeaveQuotas(selectedSchoolId.value, initQuotaForm.employee_id, initQuotaForm.academic_year_id)
    } else {
      errorMessage.value = res.message || 'Gagal menginisialisasi kuota'
    }
  } catch (e: any) {
    errorMessage.value = e.data?.message || e.message || 'Gagal menginisialisasi kuota'
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
    case 'approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
    case 'rejected': return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
    case 'cancelled': return 'bg-slate-100 text-slate-650 dark:bg-zinc-800 dark:text-zinc-400'
    case 'shortened': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
    default: return 'bg-slate-100 text-slate-600'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'Menunggu Persetujuan'
    case 'approved': return 'Disetujui'
    case 'rejected': return 'Ditolak'
    case 'cancelled': return 'Dibatalkan'
    case 'shortened': return 'Dipersingkat'
    default: return status
  }
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

const calculateDays = (start: string, end: string) => {
  if (!start || !end) return 0
  const s = new Date(start.split('T')[0])
  const e = new Date(end.split('T')[0])
  const diffTime = Math.abs(e.getTime() - s.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
}

const totalRecapPayout = computed(() => {
  return substitutionRecapList.value.reduce((sum, item) => sum + item.total_payout, 0)
})

const totalRecapCount = computed(() => {
  return substitutionRecapList.value.reduce((sum, item) => sum + item.substitution_count, 0)
})

const paginatedReplacements = computed(() => {
  const start = (replacementsPage.value - 1) * replacementsItemPerPage.value
  const end = start + replacementsItemPerPage.value
  return myReplacements.value.slice(start, end)
})

const filteredTeachersForQuota = computed(() => {
  if (!quotaSearchQuery.value) return quotaTeachers.value
  return quotaTeachers.value.filter(t => t.full_name.toLowerCase().includes(quotaSearchQuery.value.toLowerCase()))
})
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">
    
    <!-- Top Action bar with Title & Navigation Controls -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
          <CalendarRange class="text-rose-500" :size="26" />
          Pengelolaan Cuti & Izin Guru
        </h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Ajukan izin guru, kelola kuota cuti akademik, setujui permohonan, dan pantau substitusi mengajar.</p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <BaseButton 
          v-if="activeTab === 'requests'"
          variant="primary" 
          @click="openCreateRequest" 
          :disabled="!selectedSchoolId" 
          class="py-2 px-4 text-xs font-bold shadow-lg shadow-rose-500/10 bg-rose-500 hover:bg-rose-600 border-none transition-transform active:scale-[0.98]"
        >
          <Plus class="mr-1.5" :size="15" /> Ajukan Izin Guru
        </BaseButton>

        <BaseButton 
          v-if="activeTab === 'types'"
          variant="primary" 
          @click="openCreateType" 
          :disabled="!selectedSchoolId" 
          class="py-2 px-4 text-xs font-bold shadow-lg shadow-violet-500/10 bg-violet-600 hover:bg-violet-750 border-none transition-transform active:scale-[0.98]"
        >
          <Plus class="mr-1.5" :size="15" /> Tambah Jenis Izin
        </BaseButton>
      </div>
    </div>

    <!-- Toast Alert Custom -->
    <div 
      v-if="toastState.show" 
      :class="[
        'fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl transition-all duration-300 transform translate-y-0 backdrop-blur-md',
        toastState.type === 'success' 
          ? 'bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30' 
          : 'bg-rose-500/10 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/30'
      ]"
    >
      <CheckCircle2 v-if="toastState.type === 'success'" :size="18" />
      <AlertTriangle v-else :size="18" />
      <span class="text-xs font-bold">{{ toastState.message }}</span>
    </div>

    <!-- Top School Selectors -->
    <div v-if="!isSchoolLocked" class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/70 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm">
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Yayasan</label>
        <select v-model="selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5">
          <option value="" disabled>Pilih Yayasan</option>
          <option v-for="found in foundations" :key="found.id" :value="found.id">{{ found.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" :disabled="!selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5">
          <option value="" disabled>Pilih Unit Sekolah</option>
          <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tahun Ajaran</label>
        <select v-model="selectedAcademicYearId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5">
          <option value="" disabled>Pilih Tahun Ajaran</option>
          <option v-for="ay in academicYears" :key="ay.id" :value="ay.id">{{ ay.name }} (Semester {{ ay.semester }})</option>
        </select>
      </div>
    </div>

    <!-- Empty Selection State (when no school is loaded) -->
    <div 
      v-if="!selectedSchoolId"
      class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-16 text-center shadow-sm"
    >
      <CalendarRange class="mx-auto text-rose-550/20 mb-3 animate-pulse" :size="48" />
      <h3 class="text-sm font-bold text-slate-800 dark:text-zinc-200">Silakan Pilih Unit Sekolah</h3>
      <p class="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-md mx-auto">Tentukan yayasan dan unit sekolah yang ingin dikelola untuk mengaktifkan pengaturan Cuti, Izin dan honor guru pengganti.</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Tabs Navigation -->
      <div class="flex border-b border-slate-200 dark:border-zinc-800">
        <button 
          v-for="tab in [
            { id: 'requests', label: 'Pengajuan Izin', icon: FileSignature },
            { id: 'quotas', label: 'Kuota Cuti Guru', icon: Settings2 },
            { id: 'types', label: 'Jenis Izin', icon: Settings },
            { id: 'recap', label: 'Rekap Honor Pengganti', icon: DollarSign },
            { id: 'replacements', label: 'Tugas Pengganti Anda', icon: CalendarRange }
          ]"
          :key="tab.id"
          @click="activeTab = tab.id as any"
          :class="[
            'flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all duration-200 tracking-wide',
            activeTab === tab.id
              ? 'border-rose-500 text-rose-500 dark:text-rose-400 font-extrabold'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          ]"
        >
          <component :is="tab.icon" :size="15" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab 1: Leave Requests -->
      <div v-if="activeTab === 'requests'" class="space-y-4">
        <!-- Filters sub-bar -->
        <div class="flex flex-wrap items-center gap-4 bg-white/40 dark:bg-zinc-900/30 p-4 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl">
          <div class="flex items-center gap-2 text-xs">
            <span class="font-bold text-slate-500 uppercase">Status:</span>
            <select v-model="filterRequestStatus" @change="handleFilterRequests" class="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 font-semibold text-xs outline-none">
              <option value="">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="cancelled">Dibatalkan</option>
              <option value="shortened">Dipersingkat</option>
            </select>
          </div>

          <div class="flex items-center gap-2 text-xs">
            <span class="font-bold text-slate-500 uppercase">Guru:</span>
            <select v-model="filterRequestTeacherId" @change="handleFilterRequests" class="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 font-semibold text-xs outline-none max-w-[200px]">
              <option value="">Semua Guru</option>
              <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.full_name }}</option>
            </select>
          </div>
        </div>

        <!-- Requests Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="req in leaveRequests" 
            :key="req.id" 
            class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div class="flex justify-between items-start gap-2">
                <div class="space-y-0.5">
                  <h4 class="font-bold text-sm text-slate-850 dark:text-zinc-200 leading-tight">{{ req.employee_name }}</h4>
                  <p class="text-[10px] text-slate-500 font-semibold">{{ req.leave_type_name }}</p>
                </div>
                <span :class="['px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider', getStatusBadge(req.status)]">
                  {{ getStatusLabel(req.status) }}
                </span>
              </div>

              <div class="mt-4 space-y-2 text-xs font-semibold text-slate-650 dark:text-zinc-350">
                <div class="flex items-center gap-2">
                  <Calendar :size="13" class="text-slate-400" />
                  <span>{{ req.start_date.split('T')[0] }} s/d {{ req.end_date.split('T')[0] }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Clock :size="13" class="text-slate-400" />
                  <span>Durasi: {{ req.effective_days || calculateDays(req.start_date, req.end_date) }} hari kerja</span>
                </div>
                <div v-if="req.reason" class="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-lg text-[11px] font-normal leading-relaxed text-slate-600 dark:text-zinc-400 italic">
                  &ldquo;{{ req.reason }}&rdquo;
                </div>
                <div v-if="req.decision_note" class="mt-2 text-[10px] text-slate-500 bg-slate-100 dark:bg-zinc-850 p-2 rounded-lg">
                  <strong>Catatan Keputusan:</strong> {{ req.decision_note }}
                </div>
              </div>
            </div>

            <!-- Approval actions -->
            <div class="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
              <template v-if="req.status === 'pending'">
                <BaseButton variant="outline" class="py-1 px-3 text-[10px] font-bold text-violet-650 border-violet-500/20 hover:bg-violet-500/5 rounded-lg" @click="openEditRequest(req)">
                  <Edit2 class="inline mr-1" :size="11" /> Ubah
                </BaseButton>
                <BaseButton variant="outline" class="py-1 px-3 text-[10px] font-bold text-rose-500 border-rose-500/20 hover:bg-rose-500/5 rounded-lg" @click="openDecideRequest(req, 'rejected')">
                  <X class="inline mr-1" :size="11" /> Tolak
                </BaseButton>
                <BaseButton variant="primary" class="py-1 px-3 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 border-none rounded-lg" @click="openDecideRequest(req, 'approved')">
                  <Check class="inline mr-1" :size="11" /> Setujui
                </BaseButton>
              </template>
              <template v-else-if="req.status === 'approved'">
                <BaseButton variant="outline" class="py-1 px-3 text-[10px] font-bold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg" @click="openCancelRequest(req)">
                  Batalkan / Pendekkan
                </BaseButton>
              </template>
            </div>
          </div>

          <div 
            v-if="leaveRequests.length === 0" 
            class="col-span-full py-16 text-center text-slate-400 dark:text-zinc-550"
          >
            <FileText class="mx-auto mb-2 opacity-35" :size="36" />
            <p class="text-xs font-bold">Tidak ada daftar pengajuan izin.</p>
            <p class="text-[10px] mt-1 text-slate-500">Sesuaikan filter atau tambahkan pengajuan izin baru.</p>
          </div>
        </div>
        
        <AppPagination
          v-if="leaveRequestsMeta && activeTab === 'requests'"
          v-model:page="page"
          v-model:itemPerPage="itemPerPage"
          :totalItem="leaveRequestsMeta.total_item"
          :totalPage="leaveRequestsMeta.total_page"
          :listPagination="leaveRequestsMeta.list_pagination"
          class="mt-4"
        />
      </div>

      <!-- Tab 2: Leave Quotas -->
      <div v-if="activeTab === 'quotas'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Teacher Selector list on Left -->
        <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-4.5 space-y-4 shadow-sm h-fit">
          <h4 class="font-bold text-xs text-slate-800 dark:text-zinc-200 uppercase tracking-widest">Daftar Guru</h4>
          <div class="relative flex items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs">
            <Search class="text-slate-400 mr-2" :size="14" />
            <input 
              v-model="quotaSearchQuery" 
              type="text" 
              placeholder="Cari guru..." 
              class="w-full bg-transparent outline-none font-semibold text-slate-700 dark:text-zinc-300"
            />
          </div>

          <div ref="teacherListContainer" class="space-y-1 max-h-[50vh] overflow-y-auto pr-1" @scroll="handleScroll">
            <button 
              v-for="t in filteredTeachersForQuota" 
              :key="t.id"
              @click="selectedQuotaTeacherId = t.id"
              :class="[
                'w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all',
                selectedQuotaTeacherId === t.id
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-650 dark:text-zinc-350'
              ]"
            >
              <User :size="13" />
              <span>{{ t.full_name }}</span>
            </button>
            <div v-if="quotaTeachersLoading" class="text-center py-2 text-[10px] text-slate-400">
              Memuat...
            </div>
            <div v-else-if="!quotaTeachersHasMore && quotaTeachers.length > 0" class="text-center py-2 text-[9px] text-slate-450 dark:text-zinc-550">
              Semua guru telah dimuat
            </div>
          </div>
        </div>

        <!-- Quotas detail on Right -->
        <div class="col-span-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-sm">
          <div class="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
            <h4 class="font-extrabold text-sm text-slate-800 dark:text-zinc-200">Rincian Kuota Cuti & Izin Guru</h4>
            <span class="text-[10px] font-bold text-slate-400 uppercase">Tahun Ajaran Aktif</span>
          </div>

          <div v-if="!selectedQuotaTeacherId" class="py-16 text-center text-slate-400">
            <Settings2 class="mx-auto mb-2 opacity-35" :size="36" />
            <p class="text-xs font-bold">Pilih guru terlebih dahulu.</p>
            <p class="text-[10px] mt-0.5">Silakan pilih guru di samping untuk menampilkan sisa kuota cuti akademik mereka.</p>
          </div>

          <div v-else class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                v-for="quota in leaveQuotas" 
                :key="quota.id"
                class="p-4 bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-200/50 dark:border-zinc-850 rounded-xl relative overflow-hidden"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h5 class="font-extrabold text-xs text-slate-800 dark:text-zinc-200">{{ quota.leave_type_name }}</h5>
                    <p class="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">KODE: {{ quota.leave_type_code }}</p>
                  </div>
                  <button 
                    @click="openEditQuota(quota, filteredTeachersForQuota.find(t => t.id === selectedQuotaTeacherId)?.full_name || '')" 
                    class="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Edit2 :size="12" />
                  </button>
                </div>

                <div class="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                  <div class="p-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-lg">
                    <p class="text-[8px] text-slate-400 uppercase">Jatah Kuota</p>
                    <p class="text-sm mt-0.5 text-slate-800 dark:text-zinc-200">{{ quota.quota_days }} hari</p>
                  </div>
                  <div class="p-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-lg">
                    <p class="text-[8px] text-slate-400 uppercase">Digunakan</p>
                    <p class="text-sm mt-0.5 text-amber-600 dark:text-amber-400">{{ quota.used_days }} hari</p>
                  </div>
                  <div class="p-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-lg">
                    <p class="text-[8px] text-slate-400 uppercase">Sisa Kuota</p>
                    <p class="text-sm mt-0.5 text-emerald-600 dark:text-emerald-400">{{ quota.quota_days - quota.used_days }} hari</p>
                  </div>
                </div>
              </div>

              <div v-if="leaveQuotas.length === 0" class="col-span-full py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                <div>
                  <p class="text-xs font-bold">Belum ada kuota yang dibuat.</p>
                  <p class="text-[10px]">Kuota dibuat otomatis saat guru pertama kali mengajukan izin atau klik tombol di bawah untuk menginisialisasi secara manual.</p>
                </div>
                <BaseButton variant="primary" @click="openInitQuota" class="rounded-xl py-2 px-4 text-xs font-bold bg-rose-500 hover:bg-rose-600 border-none mt-2">
                  Inisialisasi Kuota Cuti
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: Leave Types CRUD -->
      <div v-if="activeTab === 'types'" class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
              <th class="p-4 pl-6">Kode</th>
              <th class="p-4">Nama Jenis Izin</th>
              <th class="p-4">Kuota Default (Tahunan)</th>
              <th class="p-4">Potong Cuti Tahunan?</th>
              <th class="p-4">Status Keaktifan</th>
              <th class="p-4 pr-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in leaveTypes" 
              :key="item.id" 
              class="border-b border-slate-100 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/30 dark:hover:bg-zinc-900/30 transition-colors text-xs font-semibold"
            >
              <td class="p-4 pl-6 font-bold text-slate-700 dark:text-zinc-300">{{ item.code }}</td>
              <td class="p-4 font-bold text-slate-800 dark:text-zinc-200">{{ item.name }}</td>
              <td class="p-4 text-slate-650 dark:text-zinc-350">{{ item.quota_default }} Hari / Tahun</td>
              <td class="p-4">
                <span 
                  :class="[
                    'px-2 py-0.5 rounded text-[9px] font-bold',
                    item.is_deduct_annual ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                  ]"
                >
                  {{ item.is_deduct_annual ? 'Ya (Memotong)' : 'Tidak' }}
                </span>
              </td>
              <td class="p-4">
                <span 
                  :class="[
                    'px-2 py-0.5 rounded text-[9px] font-bold',
                    item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  ]"
                >
                  {{ item.is_active ? 'Aktif' : 'Non-Aktif' }}
                </span>
              </td>
              <td class="p-4 pr-6 text-right">
                <div class="flex justify-end items-center gap-1">
                  <button @click="openEditType(item)" class="p-2 text-slate-400 hover:text-violet-600 transition-colors">
                    <Edit2 :size="14" />
                  </button>
                  <button @click="handleDeleteLeaveType(item.id)" class="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="leaveTypes.length === 0">
              <td colspan="6" class="p-12 text-center text-slate-400">
                <Settings class="mx-auto mb-2 opacity-55 animate-spin" :size="32" />
                <p class="text-xs font-bold">Belum ada data Jenis Izin.</p>
                <p class="text-[10px]">Gunakan tombol di pojok kanan atas untuk menambahkan jenis izin baru.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tab 4: Substitution Recap -->
      <div v-if="activeTab === 'recap'" class="space-y-4">
        <!-- Recap Header Filters -->
        <div class="flex flex-wrap items-center justify-between gap-4 bg-white/40 dark:bg-zinc-900/30 p-4 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl">
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2 text-xs">
              <span class="font-bold text-slate-500 uppercase">Pilih Bulan:</span>
              <input 
                v-model="selectedRecapMonth" 
                type="month" 
                class="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 font-bold text-xs outline-none"
              />
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="font-bold text-slate-500 uppercase">Pilih Guru:</span>
              <select v-model="selectedRecapTeacherId" @change="loadRecapData" class="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 font-semibold text-xs outline-none max-w-[200px]">
                <option value="">Semua Guru</option>
                <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.full_name }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Summary cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div class="p-3 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
              <Clock :size="24" />
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total Jam Menggantikan</p>
              <h3 class="text-xl font-extrabold mt-0.5 text-slate-800 dark:text-zinc-200">{{ totalRecapCount }} Kali Sesi / Kelas</h3>
            </div>
          </div>

          <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div class="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign :size="24" />
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Estimasi Payout Honor Substitusi</p>
              <h3 class="text-xl font-extrabold mt-0.5 text-emerald-600 dark:text-emerald-400">{{ formatCurrency(totalRecapPayout) }}</h3>
            </div>
          </div>
        </div>

        <!-- Table list -->
        <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                <th class="p-4 pl-6">Nama Guru Penerima Tugas</th>
                <th class="p-4">Total Sesi Menggantikan</th>
                <th class="p-4">Tarif Honor per Sesi</th>
                <th class="p-4">Estimasi Total Honorarium</th>
                <th class="p-4 pr-6 text-right">Rincian Slip</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="item in substitutionRecapList" 
                :key="item.teacher_id" 
                class="border-b border-slate-100 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/30 dark:hover:bg-zinc-900/30 transition-colors text-xs font-semibold"
              >
                <td class="p-4 pl-6 font-bold text-slate-800 dark:text-zinc-200">{{ item.teacher_name }}</td>
                <td class="p-4 font-extrabold text-slate-700 dark:text-zinc-300">{{ item.substitution_count }} Sesi</td>
                <td class="p-4 text-slate-500">{{ formatCurrency(item.rate_per_substitution) }}</td>
                <td class="p-4 font-extrabold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(item.total_payout) }}</td>
                <td class="p-4 pr-6 text-right">
                  <span class="text-[10px] font-bold text-slate-400 uppercase italic">Terarsip</span>
                </td>
              </tr>
              <tr v-if="substitutionRecapList.length === 0">
                <td colspan="5" class="p-12 text-center text-slate-400">
                  <DollarSign class="mx-auto mb-2 opacity-50" :size="32" />
                  <p class="text-xs font-bold">Tidak ada rekapitulasi substitusi untuk bulan ini.</p>
                  <p class="text-[10px]">Pastikan ada tugas pengganti terkonfirmasi atau selesai pada rentang bulan terpilih.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 5: Replacement Tasks -->
      <div v-if="activeTab === 'replacements'" class="space-y-4">
        <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                <th class="p-4 pl-6">Tanggal</th>
                <th class="p-4">Waktu & Ruang</th>
                <th class="p-4">Kelas</th>
                <th class="p-4">Mata Pelajaran</th>
                <th class="p-4">Guru Pengganti</th>
                <th class="p-4">Guru yang Digantikan</th>
                <th class="p-4">Status</th>
                <th class="p-4 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="item in paginatedReplacements" 
                :key="item.slotKey" 
                class="border-b border-slate-100 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/30 dark:hover:bg-zinc-900/30 transition-colors text-xs font-semibold"
              >
                <td class="p-4 pl-6 font-bold text-slate-800 dark:text-zinc-250">
                  {{ item.date }}
                </td>
                <td class="p-4 text-slate-700 dark:text-zinc-350">
                  <div>{{ item.start_time }} - {{ item.end_time }}</div>
                  <div class="text-[10px] text-slate-400 font-bold mt-0.5">{{ item.room || '-' }}</div>
                </td>
                <td class="p-4">
                  <span class="inline-flex px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                    {{ item.class_name }}
                  </span>
                </td>
                <td class="p-4 font-bold text-slate-800 dark:text-zinc-200">
                  {{ item.subject_name }}
                </td>
                <td class="p-4 text-slate-800 dark:text-zinc-200 font-semibold">
                  {{ item.substitute_teacher_name || '-' }}
                </td>
                <td class="p-4 text-slate-650 dark:text-zinc-350">
                  {{ item.original_teacher_name }}
                </td>
                <td class="p-4">
                  <span 
                    :class="[
                      'px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider',
                      item.status === 'confirmed' || item.status === 'covered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                      item.status === 'assigned' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                      'bg-slate-100 text-slate-500'
                    ]"
                  >
                    {{ item.status === 'confirmed' || item.status === 'covered' ? 'Diterima' : item.status === 'assigned' ? 'Menunggu Konfirmasi' : item.status }}
                  </span>
                </td>
                <td class="p-4 pr-6 text-right">
                  <div v-if="item.status === 'assigned'" class="flex justify-end gap-1.5">
                    <BaseButton 
                      variant="primary" 
                      class="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 border-none text-white rounded-lg text-[10px] font-bold"
                      @click="handleConfirmReplacement(item.substitution_id)"
                    >
                      Terima
                    </BaseButton>
                    <BaseButton 
                      variant="outline" 
                      class="py-1 px-2.5 text-rose-600 border-rose-500/20 hover:bg-rose-500/5 rounded-lg text-[10px] font-bold"
                      @click="openDeclineReplacement(item.substitution_id)"
                    >
                      Tolak
                    </BaseButton>
                  </div>
                  <div v-else class="text-[10px] text-slate-450 italic font-bold">
                    Tidak ada aksi
                  </div>
                </td>
              </tr>
              <tr v-if="myReplacements.length === 0">
                <td colspan="8" class="p-12 text-center text-slate-400">
                  <CalendarRange class="mx-auto mb-2 opacity-50" :size="32" />
                  <p class="text-xs font-bold">Tidak ada daftar tugas pengganti.</p>
                  <p class="text-[10px] mt-1 text-slate-500">Anda tidak memiliki tugas menggantikan guru lain dalam rentang 30 hari ini.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <AppPagination
          v-if="myReplacements.length > 0"
          v-model:page="replacementsPage"
          v-model:itemPerPage="replacementsItemPerPage"
          :totalItem="myReplacements.length"
          :totalPage="Math.ceil(myReplacements.length / replacementsItemPerPage)"
          :listPagination="[10, 25, 50, 100]"
          class="mt-4"
        />
      </div>
    </div>

    <!-- Modal: Ajukan Cuti/Izin Guru -->
    <BaseModal :show="showCreateRequestModal" title="Form Pengajuan Cuti / Izin Guru" @close="showCreateRequestModal = false">
      <form @submit.prevent="handleCreateLeaveRequest" class="space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-3 text-xs flex items-start gap-2">
          <AlertTriangle :size="16" class="flex-shrink-0 mt-0.5" />
          <p class="font-semibold">{{ errorMessage }}</p>
        </div>

        <!-- Teacher select -->
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Nama Guru</label>
          <select v-model="requestForm.employee_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5">
            <option value="" disabled>Pilih Guru</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.full_name }}</option>
          </select>
        </div>

        <!-- Leave Type select -->
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Jenis Izin</label>
          <select v-model="requestForm.leave_type_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5">
            <option value="" disabled>Pilih Jenis Izin</option>
            <option v-for="type in leaveTypes" :key="type.id" :value="type.id">{{ type.name }} (Default: {{ type.quota_default }} hari)</option>
          </select>
          <p v-if="activeQuotaRemaining !== null" class="text-[10px] font-bold text-emerald-600 mt-1">
            Sisa Kuota Cuti Guru: {{ activeQuotaRemaining }} Hari
          </p>
        </div>

        <!-- Date Range -->
        <div class="grid grid-cols-2 gap-4">
          <BaseInput 
            v-model="requestForm.start_date" 
            type="date" 
            label="Tanggal Mulai" 
            required 
          />
          <BaseInput 
            v-model="requestForm.end_date" 
            type="date" 
            label="Tanggal Selesai" 
            required 
          />
        </div>

        <!-- Reason -->
        <BaseInput 
          v-model="requestForm.reason" 
          type="text" 
          label="Keterangan / Alasan Cuti" 
          placeholder="Contoh: Mengikuti diklat profesi / Sakit demam berdarah" 
          required
        />

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showCreateRequestModal = false" class="rounded-xl py-2 px-4 text-xs font-semibold">Batal</BaseButton>
          <BaseButton variant="primary" type="submit" class="rounded-xl py-2 px-4 text-xs font-bold bg-rose-500 hover:bg-rose-600 border-none">Kirim Pengajuan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Modal: Ubah Cuti/Izin Guru -->
    <BaseModal :show="showEditRequestModal" title="Form Ubah Cuti / Izin Guru" @close="showEditRequestModal = false">
      <form @submit.prevent="handleUpdateLeaveRequest" class="space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-3 text-xs flex items-start gap-2">
          <AlertTriangle :size="16" class="flex-shrink-0 mt-0.5" />
          <p class="font-semibold">{{ errorMessage }}</p>
        </div>

        <!-- Teacher Display (Cannot edit employee) -->
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Nama Guru</label>
          <div class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-zinc-350">
            {{ teachers.find(t => t.id === editRequestForm.employee_id)?.full_name || 'Guru' }}
          </div>
        </div>

        <!-- Leave Type select -->
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Jenis Izin</label>
          <select v-model="editRequestForm.leave_type_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5">
            <option value="" disabled>Pilih Jenis Izin</option>
            <option v-for="type in leaveTypes" :key="type.id" :value="type.id">{{ type.name }} (Default: {{ type.quota_default }} hari)</option>
          </select>
        </div>

        <!-- Date Range -->
        <div class="grid grid-cols-2 gap-4">
          <BaseInput 
            v-model="editRequestForm.start_date" 
            type="date" 
            label="Tanggal Mulai" 
            required 
          />
          <BaseInput 
            v-model="editRequestForm.end_date" 
            type="date" 
            label="Tanggal Selesai" 
            required 
          />
        </div>

        <!-- Reason -->
        <BaseInput 
          v-model="editRequestForm.reason" 
          type="text" 
          label="Keterangan / Alasan Cuti" 
          placeholder="Contoh: Mengikuti diklat profesi / Sakit demam berdarah" 
          required
        />

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showEditRequestModal = false" class="rounded-xl py-2 px-4 text-xs font-semibold">Batal</BaseButton>
          <BaseButton variant="primary" type="submit" class="rounded-xl py-2 px-4 text-xs font-bold bg-rose-500 hover:bg-rose-600 border-none">Simpan Perubahan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Modal: Decide Approval request -->
    <BaseModal :show="showDecideRequestModal" :title="decisionForm.status === 'approved' ? 'Persetujuan Pengajuan Cuti' : 'Penolakan Pengajuan Cuti'" @close="showDecideRequestModal = false">
      <form @submit.prevent="handleDecideLeaveRequest" class="space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-3 text-xs flex items-start gap-2">
          <AlertTriangle :size="16" class="flex-shrink-0 mt-0.5" />
          <p class="font-semibold">{{ errorMessage }}</p>
        </div>

        <BaseInput 
          v-model="decisionForm.note"
          type="text"
          label="Catatan Admin / Alasan"
          placeholder="Tulis catatan persetujuan atau alasan penolakan..."
          required
        />

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showDecideRequestModal = false" class="rounded-xl py-2 px-4 text-xs font-semibold">Batal</BaseButton>
          <BaseButton 
            variant="primary" 
            type="submit" 
            :class="[
              'rounded-xl py-2 px-4 text-xs font-bold border-none', 
              decisionForm.status === 'approved' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
            ]"
          >
            {{ decisionForm.status === 'approved' ? 'Setujui Pengajuan' : 'Tolak Pengajuan' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Modal: Cancel/Shorten Request -->
    <BaseModal :show="showCancelRequestModal" title="Batalkan / Perpendek Masa Cuti" @close="showCancelRequestModal = false">
      <form @submit.prevent="handleCancelLeaveRequest" class="space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-3 text-xs flex items-start gap-2">
          <AlertTriangle :size="16" class="flex-shrink-0 mt-0.5" />
          <p class="font-semibold">{{ errorMessage }}</p>
        </div>

        <p class="text-xs text-slate-500">Jika guru masuk kembali lebih cepat, silakan sesuaikan tanggal selesai cuti yang baru di bawah ini:</p>
        
        <BaseInput 
          v-model="cancelForm.newEndDate"
          type="date"
          label="Tanggal Selesai Baru (Opsional - Kosongkan jika batal total)"
        />

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showCancelRequestModal = false" class="rounded-xl py-2 px-4 text-xs font-semibold">Batal</BaseButton>
          <BaseButton variant="primary" type="submit" class="rounded-xl py-2 px-4 text-xs font-bold bg-rose-500 hover:bg-rose-600 border-none">Konfirmasi</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Modal: Tambah Jenis Izin -->
    <BaseModal :show="showCreateTypeModal" title="Tambah Jenis Izin Baru" @close="showCreateTypeModal = false">
      <form @submit.prevent="handleCreateLeaveType" class="space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-3 text-xs flex items-start gap-2">
          <AlertTriangle :size="16" class="flex-shrink-0 mt-0.5" />
          <p class="font-semibold">{{ errorMessage }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="typeForm.code" type="text" label="Kode Cuti (Contoh: CT, SAKIT)" required />
          <BaseInput v-model="typeForm.name" type="text" label="Nama Jenis Cuti/Izin" required />
        </div>

        <BaseInput v-model.number="typeForm.quota_default" type="number" label="Default Jatah Hari / Tahun" required />

        <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-850">
          <input type="checkbox" id="deduct" v-model="typeForm.is_deduct_annual" class="rounded text-rose-500 focus:ring-rose-500 h-4 w-4 bg-white dark:bg-zinc-900 border-slate-350 dark:border-zinc-700" />
          <label for="deduct" class="text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer">Memotong Jatah Cuti Tahunan Utama</label>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showCreateTypeModal = false" class="rounded-xl py-2 px-4 text-xs font-semibold">Batal</BaseButton>
          <BaseButton variant="primary" type="submit" class="rounded-xl py-2 px-4 text-xs font-bold bg-violet-600 hover:bg-violet-750 border-none">Simpan Jenis Cuti</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Modal: Edit Jenis Izin -->
    <BaseModal :show="showEditTypeModal" title="Ubah Jenis Izin" @close="showEditTypeModal = false">
      <form @submit.prevent="handleUpdateLeaveType" class="space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-3 text-xs flex items-start gap-2">
          <AlertTriangle :size="16" class="flex-shrink-0 mt-0.5" />
          <p class="font-semibold">{{ errorMessage }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="editTypeForm.code" type="text" label="Kode Cuti" required />
          <BaseInput v-model="editTypeForm.name" type="text" label="Nama Jenis Cuti" required />
        </div>

        <BaseInput v-model.number="editTypeForm.quota_default" type="number" label="Jatah Hari / Tahun" required />

        <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-850">
          <input type="checkbox" id="edit-deduct" v-model="editTypeForm.is_deduct_annual" class="rounded text-rose-500 focus:ring-rose-500 h-4 w-4 bg-white dark:bg-zinc-900 border-slate-350 dark:border-zinc-700" />
          <label for="edit-deduct" class="text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer">Memotong Jatah Cuti Tahunan Utama</label>
        </div>

        <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-850">
          <input type="checkbox" id="edit-active" v-model="editTypeForm.is_active" class="rounded text-rose-500 focus:ring-rose-500 h-4 w-4 bg-white dark:bg-zinc-900 border-slate-350 dark:border-zinc-700" />
          <label for="edit-active" class="text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer">Jenis Izin Masih Aktif</label>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showEditTypeModal = false" class="rounded-xl py-2 px-4 text-xs font-semibold">Batal</BaseButton>
          <BaseButton variant="primary" type="submit" class="rounded-xl py-2 px-4 text-xs font-bold bg-violet-650 hover:bg-violet-750 border-none">Simpan Perubahan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Modal: Edit Quota Override -->
    <BaseModal :show="showEditQuotaModal" title="Sesuaikan Kuota Cuti Guru" @close="showEditQuotaModal = false">
      <form @submit.prevent="handleUpdateQuota" class="space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-3 text-xs flex items-start gap-2">
          <AlertTriangle :size="16" class="flex-shrink-0 mt-0.5" />
          <p class="font-semibold">{{ errorMessage }}</p>
        </div>

        <div class="p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-350 leading-relaxed">
          <p>Guru: <strong>{{ editQuotaForm.employeeName }}</strong></p>
          <p class="mt-1">Jenis Cuti: <strong>{{ editQuotaForm.typeName }}</strong></p>
        </div>

        <BaseInput 
          v-model.number="editQuotaForm.quota_days" 
          type="number" 
          label="Jumlah Kuota Hari Cuti Baru" 
          required 
        />

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showEditQuotaModal = false" class="rounded-xl py-2 px-4 text-xs font-semibold">Batal</BaseButton>
          <BaseButton variant="primary" type="submit" class="rounded-xl py-2 px-4 text-xs font-bold bg-rose-500 hover:bg-rose-600 border-none">Simpan Penyesuaian</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Modal: Inisialisasi Kuota Cuti -->
    <BaseModal :show="showInitQuotaModal" title="Inisialisasi Kuota Cuti Pegawai" @close="showInitQuotaModal = false">
      <form @submit.prevent="handleInitializeQuotas" class="space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-3 text-xs flex items-start gap-2">
          <AlertTriangle :size="16" class="flex-shrink-0 mt-0.5" />
          <p class="font-semibold">{{ errorMessage }}</p>
        </div>

        <div class="p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-350 leading-relaxed">
          <p>Guru: <strong>{{ filteredTeachersForQuota.find(t => t.id === selectedQuotaTeacherId)?.full_name }}</strong></p>
          <p class="mt-1">Tahun Ajaran: <strong>{{ academicYears.find(y => y.id === selectedAcademicYearId)?.name }}</strong></p>
        </div>

        <!-- Mode Pengisian Kuota -->
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Mode Pengisian Kuota</label>
          <select v-model="initQuotaForm.prorate_mode" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5">
            <option value="full">Kuota Penuh (Default)</option>
            <option value="prorate">Kalkulasi Prorata (Kustom Tanggal Masuk)</option>
            <option value="custom">Kustom Manual</option>
          </select>
        </div>

        <!-- Join Date Picker for Prorate Mode -->
        <div v-if="initQuotaForm.prorate_mode === 'prorate'" class="space-y-2">
          <BaseInput 
            v-model="initQuotaForm.join_date" 
            type="date" 
            label="Tanggal Masuk / Mulai Bekerja" 
            required 
          />
          <p class="text-[10px] text-slate-400 leading-relaxed">
            * Jatah cuti akan dihitung proporsional berdasarkan sisa bulan aktif di tahun ajaran ini.
          </p>
        </div>

        <!-- List of Quotas to Initialize -->
        <div class="space-y-3">
          <h5 class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Sesuaikan Jumlah Hari Jatah Cuti</h5>
          <div v-if="initQuotaForm.quotas.length > 0" class="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
            <div 
              v-for="q in initQuotaForm.quotas" 
              :key="q.leave_type_id"
              class="flex items-center justify-between gap-4 p-3 bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-200/50 dark:border-zinc-850 rounded-xl"
            >
              <div>
                <p class="text-xs font-bold text-slate-800 dark:text-zinc-200">{{ q.leave_type_name }}</p>
                <p class="text-[9px] text-slate-400 mt-0.5">Bawaan: {{ q.quota_default }} hari</p>
              </div>
              <div class="w-24">
                <input 
                  v-model.number="q.quota_days" 
                  type="number"
                  required
                  min="0"
                  :disabled="initQuotaForm.prorate_mode !== 'custom'"
                  class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs font-bold text-right outline-none focus:border-rose-500 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-zinc-800"
                />
              </div>
            </div>
          </div>
          <div v-else class="p-4 text-center bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl text-xs font-semibold leading-relaxed">
            Belum ada Jenis Izin aktif yang memotong kuota. 
            Silakan buat atau aktifkan Jenis Izin terlebih dahulu di tab <strong>Jenis Izin</strong>.
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showInitQuotaModal = false" class="rounded-xl py-2 px-4 text-xs font-semibold">Batal</BaseButton>
          <BaseButton 
            variant="primary" 
            type="submit" 
            :disabled="initQuotaForm.quotas.length === 0"
            class="rounded-xl py-2 px-4 text-xs font-bold bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed border-none"
          >
            Simpan & Inisialisasi
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Modal: Tolak Tugas Pengganti -->
    <BaseModal :show="showDeclineModal" title="Tolak Tugas Pengganti" @close="showDeclineModal = false">
      <form @submit.prevent="handleDeclineReplacement" class="space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-3 text-xs flex items-start gap-2">
          <AlertTriangle :size="16" class="flex-shrink-0 mt-0.5" />
          <p class="font-semibold">{{ errorMessage }}</p>
        </div>

        <BaseInput 
          v-model="replacementDeclineReason" 
          type="text" 
          label="Alasan Penolakan" 
          placeholder="Masukkan alasan menolak tugas pengganti..." 
          required
        />

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showDeclineModal = false" class="rounded-xl py-2 px-4 text-xs font-semibold">Batal</BaseButton>
          <BaseButton variant="primary" type="submit" class="rounded-xl py-2 px-4 text-xs font-bold bg-rose-500 hover:bg-rose-600 border-none">Kirim Penolakan</BaseButton>
        </div>
      </form>
    </BaseModal>

  </div>
</template>
