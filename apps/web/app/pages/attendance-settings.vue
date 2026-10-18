<script setup lang="ts">
import { 
  Settings, 
  Save, 
  Clock, 
  HelpCircle, 
  Loader2, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Bell, 
  MessageSquare, 
  School, 
  Check,
  Layers,
  Tag,
  GraduationCap,
  Users,
  Search,
  ShieldAlert
} from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseInput, BaseModal, BaseDateInput } from '@eduraport/ui'
import { useApi } from '../composables/useApi'
import { useSchoolContext } from '../composables/useSchoolContext'
import { useClass } from '../composables/useClass'

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

const availableLevels = computed(() => {
  const set = new Set<string>()
  classes.value.forEach((c: any) => {
    if (c.level) set.add(String(c.level))
  })
  if (set.size === 0) {
    return ['10', '11', '12']
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
})

const activeTab = ref<'time_rules' | 'notifications' | 'holidays' | 'discipline'>('time_rules')

const isLoading = ref(true)
const isSaving = ref(false)
const isSyncingHolidays = ref(false)

// 1. Time Rules Form
const ruleForm = reactive({
  id: '',
  school_id: '',
  scope_type: 'school',
  days: '1,2,3,4,5,6',
  check_in_start: '06:00',
  on_time_until: '07:15',
  late_tolerance_min: 10,
  absent_cutoff: '09:00',
  check_out_enabled: false,
  check_out_from: '14:00',
  is_active: true
})

// 2. Notification Settings Form
const notificationForm = reactive({
  notify_checkin_parents: true,
  notify_absent_parents: true
})

// 3. Discipline Integration Settings Form
const disciplineForm = reactive({
  sync_late_to_discipline: false,
  late_rule_id: null as string | null
})
const pointRules = ref<any[]>([])

// 3. Holidays & Overrides Data
const selectedYear = ref(new Date().getFullYear())
const holidayData = ref<{
  items: Array<{
    date: string
    name: string
    is_joint_leave: boolean
    is_national_holiday: boolean
    school_status: string // 'holiday' | 'force_school_day' | 'custom_holiday'
    scope_type?: 'school' | 'level' | 'class'
    level?: string | null
    class_id?: string | null
    class_name?: string | null
    scope_label?: string | null
    override_id: string | null
    override_type: string | null
    category: string | null
    group_id: string | null
    note: string | null
  }>
  academicEvents: Array<{
    id: string
    name: string
    start_date: string
    end_date: string
  }>
}>({
  items: [],
  academicEvents: []
})

// Categories Configuration
const HOLIDAY_CATEGORIES = [
  { id: 'libur_semester', name: 'Libur Semester / Akhir Tahun', icon: '🎓', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { id: 'keagamaan', name: 'Kegiatan Keagamaan / Ramadhan', icon: '🌙', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'haul_pondok', name: 'Haul / Agenda Pesantren', icon: '🕌', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'ujian_khusus', name: 'Masa Tenang / Ujian Khusus', icon: '📝', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'darurat', name: 'Tanggap Darurat / Bencana Alam', icon: '⚠️', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { id: 'lainnya', name: 'Libur Khusus Lainnya', icon: '📌', color: 'bg-slate-700/50 text-slate-300 border-slate-600' }
]

const getCategoryMeta = (catId?: string | null) => {
  if (!catId) return null
  return HOLIDAY_CATEGORIES.find(c => c.id === catId) || {
    id: catId,
    name: catId,
    icon: '📌',
    color: 'bg-slate-700/50 text-slate-300 border-slate-600'
  }
}

// Indonesian Date Formatter
const formatIndonesianDate = (dateStr: string | Date, withDay = true) => {
  if (!dateStr) return '-'
  const d = typeof dateStr === 'string' ? new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : '')) : dateStr
  if (isNaN(d.getTime())) return String(dateStr)
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const dayName = days[d.getDay()]
  const dateNum = d.getDate()
  const monthName = months[d.getMonth()]
  const yearNum = d.getFullYear()
  return withDay ? `${dayName}, ${dateNum} ${monthName} ${yearNum}` : `${dateNum} ${monthName} ${yearNum}`
}

// Custom Holiday Modal State
const showHolidayModal = ref(false)
const holidayModalMode = ref<'single' | 'range'>('single')
const modalError = ref('')
const holidayForm = reactive({
  date: '',
  start_date: '',
  end_date: '',
  name: '',
  category: 'libur_semester',
  scope_type: 'school' as 'school' | 'level' | 'class',
  level: '',
  class_id: '',
  levels: [] as string[],
  class_ids: [] as string[],
  override_type: 'custom_holiday' as 'custom_holiday' | 'force_school_day',
})
const isSavingHoliday = ref(false)

// Multi-select helpers for Level
const toggleLevel = (lvl: string) => {
  const idx = holidayForm.levels.indexOf(lvl)
  if (idx > -1) {
    holidayForm.levels.splice(idx, 1)
  } else {
    holidayForm.levels.push(lvl)
  }
}

const selectAllLevels = () => {
  holidayForm.levels = [...availableLevels.value]
}

const clearAllLevels = () => {
  holidayForm.levels = []
}

// Multi-select helpers for Class / Rombel
const classSearchQuery = ref('')

const filteredClasses = computed(() => {
  if (!classSearchQuery.value.trim()) return classes.value
  const q = classSearchQuery.value.toLowerCase()
  return classes.value.filter((c: any) => 
    (c.class_name && c.class_name.toLowerCase().includes(q)) ||
    (c.level && String(c.level).toLowerCase().includes(q))
  )
})

const toggleClass = (classId: string) => {
  const idx = holidayForm.class_ids.indexOf(classId)
  if (idx > -1) {
    holidayForm.class_ids.splice(idx, 1)
  } else {
    holidayForm.class_ids.push(classId)
  }
}

const selectAllClasses = () => {
  holidayForm.class_ids = classes.value.map((c: any) => c.id)
}

const clearAllClasses = () => {
  holidayForm.class_ids = []
}

// Safe Notification Helper (falls back to alert if $toast is absent)
const notify = (msg: string, type: 'success' | 'error' = 'success') => {
  const nuxtApp = useNuxtApp()
  if (nuxtApp.$toast) {
    if (type === 'success') nuxtApp.$toast.success(msg)
    else nuxtApp.$toast.error(msg)
  } else {
    if (type === 'error') alert(msg)
    else console.log(msg)
  }
}

// Day Names ID mapping
const DAYS_CONFIG = [
  { id: '1', label: 'Senin', short: 'Sen' },
  { id: '2', label: 'Selasa', short: 'Sel' },
  { id: '3', label: 'Rabu', short: 'Rab' },
  { id: '4', label: 'Kamis', short: 'Kam' },
  { id: '5', label: 'Jumat', short: 'Jum' },
  { id: '6', label: 'Sabtu', short: 'Sab' },
  { id: '7', label: 'Ahad', short: 'Ahd' },
]

onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    await loadAllSettings(schoolId)
  } else {
    isLoading.value = false
  }
})

watch(selectedFoundationId, (newVal) => {
  onFoundationChange(newVal)
})

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await loadAllSettings(newVal)
  }
})

const loadAllSettings = async (schoolId: string) => {
  isLoading.value = true
  try {
    await Promise.all([
      fetchTimeRules(schoolId),
      fetchAttendanceSettings(schoolId),
      fetchPointRules(schoolId),
      fetchHolidays(schoolId, selectedYear.value),
      fetchClasses(schoolId)
    ])
  } catch (error) {
    console.error('Failed to load settings:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchTimeRules = async (schoolId: string) => {
  ruleForm.id = ''
  try {
    const res: any = await fetcher(`/school/${schoolId}/attendance/attendance-time-rules`)
    if (res && res.data && res.data.length > 0) {
      const rule = res.data[0]
      Object.assign(ruleForm, {
        id: rule.id || '',
        school_id: rule.school_id,
        scope_type: rule.scope_type || 'school',
        days: rule.days || '1,2,3,4,5,6',
        check_in_start: rule.check_in_start || '06:00',
        on_time_until: rule.on_time_until || '07:15',
        late_tolerance_min: rule.late_tolerance_min || 0,
        absent_cutoff: rule.absent_cutoff || '09:00',
        check_out_enabled: rule.check_out_enabled || false,
        check_out_from: rule.check_out_from || '14:00',
        is_active: rule.is_active !== undefined ? rule.is_active : true
      })
    } else {
      ruleForm.school_id = schoolId
    }
  } catch (error) {
    console.error('Failed to fetch time rules:', error)
  }
}

const fetchAttendanceSettings = async (schoolId: string) => {
  try {
    const res: any = await fetcher(`/school/${schoolId}/attendance/attendance-settings`)
    if (res && res.data) {
      notificationForm.notify_checkin_parents = res.data.notify_checkin_parents !== false
      notificationForm.notify_absent_parents = res.data.notify_absent_parents !== false
      disciplineForm.sync_late_to_discipline = res.data.sync_late_to_discipline === true
      disciplineForm.late_rule_id = res.data.late_rule_id || null
    }
  } catch (error) {
    console.error('Failed to fetch attendance settings:', error)
  }
}

const fetchPointRules = async (schoolId: string) => {
  try {
    const res: any = await fetcher(`/school/${schoolId}/discipline/rules`)
    if (res && res.data) {
      pointRules.value = (res.data || []).filter((r: any) => r.is_active && r.category === 'violation')
    }
  } catch (err) {
    console.error('Failed to fetch point rules:', err)
  }
}

const fetchHolidays = async (schoolId: string, year: number) => {
  try {
    const res: any = await fetcher(`/school/${schoolId}/attendance/holidays?year=${year}`)
    if (res && res.data) {
      holidayData.value = {
        items: res.data.items || [],
        academicEvents: res.data.academicEvents || []
      }
    }
  } catch (error) {
    console.error('Failed to fetch holidays:', error)
  }
}

// Preset Handlers
const applyPreset = (daysStr: string) => {
  ruleForm.days = daysStr
}

const toggleDay = (dayId: string) => {
  const current = ruleForm.days ? ruleForm.days.split(',').map(s => s.trim()).filter(Boolean) : []
  const index = current.indexOf(dayId)
  if (index > -1) {
    // Hindari mengosongkan semua hari
    if (current.length > 1) {
      current.splice(index, 1)
    }
  } else {
    current.push(dayId)
    // Urutkan 1..7
    current.sort((a, b) => parseInt(a) - parseInt(b))
  }
  ruleForm.days = current.join(',')
}

const isDayActive = (dayId: string) => {
  const current = ruleForm.days ? ruleForm.days.split(',').map(s => s.trim()) : []
  return current.includes(dayId)
}

// Save Handlers
const saveTimeRules = async () => {
  if (!selectedSchoolId.value) return
  isSaving.value = true
  try {
    const payload = [{ ...ruleForm, school_id: selectedSchoolId.value }]
    if (!payload[0].id) delete payload[0].id

    await fetcher(`/school/${selectedSchoolId.value}/attendance/attendance-time-rules`, {
      method: 'PUT',
      body: payload
    })
    notify('Pengaturan jam masuk & hari kerja berhasil disimpan', 'success')
    await fetchTimeRules(selectedSchoolId.value)
  } catch (error) {
    console.error('Failed to save time rules:', error)
    notify('Gagal menyimpan aturan jam masuk', 'error')
  } finally {
    isSaving.value = false
  }
}

const saveNotificationSettings = async () => {
  if (!selectedSchoolId.value) return
  isSaving.value = true
  try {
    await fetcher(`/school/${selectedSchoolId.value}/attendance/attendance-settings`, {
      method: 'PUT',
      body: {
        notify_checkin_parents: notificationForm.notify_checkin_parents,
        notify_absent_parents: notificationForm.notify_absent_parents
      }
    })
    notify('Pengaturan notifikasi WhatsApp berhasil disimpan', 'success')
  } catch (error) {
    console.error('Failed to save notification settings:', error)
    notify('Gagal menyimpan setelan notifikasi', 'error')
  } finally {
    isSaving.value = false
  }
}

const saveDisciplineSettings = async () => {
  if (!selectedSchoolId.value) return
  isSaving.value = true
  try {
    await fetcher(`/school/${selectedSchoolId.value}/attendance/attendance-settings`, {
      method: 'PUT',
      body: {
        sync_late_to_discipline: disciplineForm.sync_late_to_discipline,
        late_rule_id: disciplineForm.late_rule_id || null
      }
    })
    notify('Pengaturan integrasi kedisiplinan berhasil disimpan', 'success')
  } catch (error) {
    console.error('Failed to save discipline settings:', error)
    notify('Gagal menyimpan pengaturan kedisiplinan', 'error')
  } finally {
    isSaving.value = false
  }
}

// Holiday Overrides Handlers
const syncHolidays = async () => {
  if (!selectedSchoolId.value) return
  isSyncingHolidays.value = true
  try {
    await fetcher(`/school/${selectedSchoolId.value}/attendance/holidays/sync`, {
      method: 'POST',
      body: { year: selectedYear.value }
    })
    notify(`Berhasil menyinkronkan libur nasional ${selectedYear.value}`, 'success')
    await fetchHolidays(selectedSchoolId.value, selectedYear.value)
  } catch (error) {
    console.error('Failed to sync holidays:', error)
    notify('Gagal sinkronisasi libur nasional', 'error')
  } finally {
    isSyncingHolidays.value = false
  }
}

const togglePesantrenForceSchoolDay = async (item: any) => {
  if (!selectedSchoolId.value) return
  const isCurrentlyForceSchool = item.school_status === 'force_school_day'

  try {
    if (isCurrentlyForceSchool) {
      // Hapus override (kembalikan ke libur)
      await fetcher(`/school/${selectedSchoolId.value}/attendance/holidays/override/${item.date}`, {
        method: 'DELETE'
      })
      notify(`Override ${item.date} dicabut (kembali Libur)`, 'success')
    } else {
      // Pasang override force_school_day (Tetap Masuk)
      await fetcher(`/school/${selectedSchoolId.value}/attendance/holidays/override`, {
        method: 'POST',
        body: {
          date: item.date,
          override_type: 'force_school_day',
          note: 'Pesantren Tetap Masuk (KBM Aktif)'
        }
      })
      notify(`Tanggal ${item.date} diset: Pesantren Tetap Masuk`, 'success')
    }
    await fetchHolidays(selectedSchoolId.value, selectedYear.value)
  } catch (error) {
    console.error('Failed to toggle override:', error)
    notify('Gagal mengubah status override hari libur', 'error')
  }
}

const openAddHolidayModal = () => {
  const today = new Date().toISOString().split('T')[0]
  holidayForm.date = today
  holidayForm.start_date = today
  holidayForm.end_date = ''
  holidayForm.name = ''
  holidayForm.category = 'libur_semester'
  holidayForm.scope_type = 'school'
  holidayForm.level = availableLevels.value[0] || ''
  holidayForm.class_id = classes.value[0]?.id || ''
  holidayForm.levels = availableLevels.value.length > 0 ? [availableLevels.value[0]] : []
  holidayForm.class_ids = classes.value.length > 0 ? [classes.value[0].id] : []
  holidayModalMode.value = 'single'
  modalError.value = ''
  classSearchQuery.value = ''
  showHolidayModal.value = true
}

const applyRangePreset = (daysToAdd: number) => {
  const base = holidayForm.start_date || new Date().toISOString().split('T')[0]
  holidayForm.start_date = base
  const d = new Date(base + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + daysToAdd - 1)
  holidayForm.end_date = d.toISOString().split('T')[0]
}

const rangeDaysCount = computed(() => {
  if (holidayModalMode.value === 'single') return holidayForm.date ? 1 : 0
  if (!holidayForm.start_date || !holidayForm.end_date) return 0
  const start = new Date(holidayForm.start_date + 'T00:00:00Z').getTime()
  const end = new Date(holidayForm.end_date + 'T00:00:00Z').getTime()
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
  return diff > 0 ? diff : 0
})

const saveHolidayModal = async () => {
  modalError.value = ''
  if (!selectedSchoolId.value) {
    modalError.value = 'Sekolah belum dipilih.'
    notify('Sekolah belum dipilih', 'error')
    return
  }
  
  if (holidayModalMode.value === 'single' && !holidayForm.date) {
    modalError.value = 'Tanggal libur wajib diisi.'
    return
  }
  if (holidayModalMode.value === 'range') {
    if (!holidayForm.start_date || !holidayForm.end_date) {
      modalError.value = 'Tanggal mulai dan selesai wajib diisi.'
      return
    }
    if (holidayForm.start_date > holidayForm.end_date) {
      modalError.value = 'Tanggal mulai tidak boleh melebihi tanggal selesai.'
      return
    }
  }

  if (holidayForm.scope_type === 'level') {
    if (!holidayForm.levels || holidayForm.levels.length === 0) {
      modalError.value = 'Minimal pilih satu tingkat kelas yang diliburkan.'
      return
    }
  }
  if (holidayForm.scope_type === 'class') {
    if (!holidayForm.class_ids || holidayForm.class_ids.length === 0) {
      modalError.value = 'Minimal pilih satu rombel kelas yang diliburkan.'
      return
    }
  }

  // Auto-fallback: jika nama dikosongkan, gunakan nama kategori yang dipilih
  const finalName = holidayForm.name?.trim() || getCategoryMeta(holidayForm.category)?.name || 'Libur Khusus'

  isSavingHoliday.value = true
  try {
    const payload: any = {
      override_type: holidayForm.override_type || 'custom_holiday',
      category: holidayForm.category,
      scope_type: holidayForm.scope_type,
      level: holidayForm.scope_type === 'level' ? (holidayForm.levels[0] || null) : null,
      class_id: holidayForm.scope_type === 'class' ? (holidayForm.class_ids[0] || null) : null,
      levels: holidayForm.scope_type === 'level' ? holidayForm.levels : [],
      class_ids: holidayForm.scope_type === 'class' ? holidayForm.class_ids : [],
      note: finalName
    }

    if (holidayModalMode.value === 'single') {
      payload.date = holidayForm.date
    } else {
      payload.start_date = holidayForm.start_date
      payload.end_date = holidayForm.end_date
    }

    await fetcher(`/school/${selectedSchoolId.value}/attendance/holidays/override`, {
      method: 'POST',
      body: payload
    })

    const scopeTxt = holidayForm.scope_type === 'level'
      ? ` (${holidayForm.levels.length} Jenjang: ${holidayForm.levels.map(l => 'Tingkat ' + l).join(', ')})`
      : holidayForm.scope_type === 'class'
        ? ` (${holidayForm.class_ids.length} Rombel Terpilih)`
        : ''

    notify(
      holidayModalMode.value === 'range'
        ? `Berhasil menyimpan rentang libur "${finalName}"${scopeTxt} (${rangeDaysCount.value} hari)`
        : `Berhasil menyimpan libur khusus "${finalName}"${scopeTxt}`,
      'success'
    )

    showHolidayModal.value = false
    await fetchHolidays(selectedSchoolId.value, selectedYear.value)
  } catch (error: any) {
    console.error('Failed to save holiday:', error)
    const errMsg = error?.data?.message || error?.message || 'Gagal menyimpan hari libur'
    modalError.value = errMsg
    notify(errMsg, 'error')
  } finally {
    isSavingHoliday.value = false
  }
}

const deleteCustomHoliday = async (item: any) => {
  if (!selectedSchoolId.value) return
  
  const hasGroup = !!item.group_id
  let deleteGroup = false

  if (hasGroup) {
    const confirmAll = confirm(
      `Tanggal ${item.date} merupakan bagian dari rentang libur "${item.name}".\n\nKlik OK untuk menghapus SELURUH rombongan rentang libur ini, atau Cancel jika hanya ingin menghapus tanggal ini saja.`
    )
    deleteGroup = confirmAll
  }

  try {
    const queryParams = new URLSearchParams()
    if (deleteGroup) queryParams.set('delete_group', 'true')
    if (item.override_id) queryParams.set('override_id', item.override_id)
    const qs = queryParams.toString() ? `?${queryParams.toString()}` : ''
    const url = `/school/${selectedSchoolId.value}/attendance/holidays/override/${item.date}${qs}`
    await fetcher(url, { method: 'DELETE' })
    notify(deleteGroup ? 'Seluruh rentang libur berhasil dihapus' : 'Hari libur berhasil dihapus', 'success')
    await fetchHolidays(selectedSchoolId.value, selectedYear.value)
  } catch (error) {
    console.error('Failed to delete custom holiday:', error)
    notify('Gagal menghapus libur khusus', 'error')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <Settings class="text-violet-400" :size="28" />
          Pengaturan Presensi & Hari Operasional
        </h1>
        <p class="text-slate-400 mt-1">
          Konfigurasi hari masuk (Sekolah vs Pesantren), jam batas waktu, notifikasi WhatsApp, serta integrasi libur nasional.
        </p>
      </div>
    </div>

    <!-- Context Selector for Super Admin -->
    <BaseCard v-if="!isSchoolLocked" class="p-4 bg-slate-100/50 dark:bg-zinc-900/50 border-dashed border-slate-300 dark:border-zinc-800">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 pl-1">Yayasan</label>
          <select v-model="selectedFoundationId" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
            <option v-for="f in foundations" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 pl-1">Unit Sekolah / Pesantren</label>
          <select v-model="selectedSchoolId" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
            <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }} ({{ s.level }})</option>
          </select>
        </div>
      </div>
    </BaseCard>

    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <Loader2 class="w-8 h-8 text-violet-500 animate-spin" />
    </div>

    <div v-else-if="!selectedSchoolId" class="flex flex-col justify-center items-center py-20 text-slate-400">
      <Settings class="w-12 h-12 mb-4 opacity-20" />
      <p>Silakan pilih Unit Sekolah terlebih dahulu.</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Tabs Navigation -->
      <div class="flex border-b border-slate-800 gap-2 pb-px overflow-x-auto">
        <button
          @click="activeTab = 'time_rules'"
          :class="[
            'px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap',
            activeTab === 'time_rules'
              ? 'border-violet-500 text-violet-400 bg-violet-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          ]"
        >
          <Clock :size="16" />
          Jam & Hari Operasional
        </button>

        <button
          @click="activeTab = 'notifications'"
          :class="[
            'px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap',
            activeTab === 'notifications'
              ? 'border-violet-500 text-violet-400 bg-violet-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          ]"
        >
          <MessageSquare :size="16" />
          Notifikasi WhatsApp
        </button>

        <button
          @click="activeTab = 'holidays'"
          :class="[
            'px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap',
            activeTab === 'holidays'
              ? 'border-violet-500 text-violet-400 bg-violet-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          ]"
        >
          <Calendar :size="16" />
          Libur Nasional & Override Pesantren
        </button>

        <button
          @click="activeTab = 'discipline'"
          :class="[
            'px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap',
            activeTab === 'discipline'
              ? 'border-violet-500 text-violet-400 bg-violet-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          ]"
        >
          <ShieldAlert :size="16" />
          Integrasi Kedisiplinan & Poin
        </button>
      </div>

      <!-- TAB 1: Jam & Hari Operasional (Sekolah vs Pesantren) -->
      <div v-if="activeTab === 'time_rules'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <BaseCard class="p-6">
            <div class="flex items-center gap-2 mb-6">
              <School class="text-violet-400" :size="20" />
              <h2 class="text-lg font-semibold text-white">Hari Masuk Mingguan Unit</h2>
            </div>

            <!-- Presets -->
            <div class="mb-5">
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Template Cepat</label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  @click="applyPreset('1,2,3,4,5')"
                  :class="[
                    'px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all',
                    ruleForm.days === '1,2,3,4,5' 
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-semibold shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                  ]"
                >
                  <span class="block font-bold">🏫 5 Hari Kerja</span>
                  <span class="text-[11px] text-slate-400">Senin – Jumat (Sabtu/Ahad Libur)</span>
                </button>

                <button
                  type="button"
                  @click="applyPreset('1,2,3,4,5,6')"
                  :class="[
                    'px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all',
                    ruleForm.days === '1,2,3,4,5,6' 
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-semibold shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                  ]"
                >
                  <span class="block font-bold">🏫 6 Hari Kerja</span>
                  <span class="text-[11px] text-slate-400">Senin – Sabtu (Ahad Libur)</span>
                </button>

                <button
                  type="button"
                  @click="applyPreset('6,7,1,2,3,4')"
                  :class="[
                    'px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all',
                    ruleForm.days === '6,7,1,2,3,4' 
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-semibold shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                  ]"
                >
                  <span class="block font-bold">🕌 Pesantren Tradisional</span>
                  <span class="text-[11px] text-slate-400">Sabtu – Kamis (Jumat Libur)</span>
                </button>
              </div>
            </div>

            <!-- Day Pills Checklist -->
            <div class="mb-6">
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Pilih Hari Aktif Belajar (KBM)</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                <button
                  v-for="d in DAYS_CONFIG"
                  :key="d.id"
                  type="button"
                  @click="toggleDay(d.id)"
                  :class="[
                    'py-2 px-3 rounded-lg border flex flex-col items-center justify-center transition-all',
                    isDayActive(d.id)
                      ? 'border-violet-500 bg-violet-600/20 text-white font-bold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-500 hover:border-slate-700'
                  ]"
                >
                  <span class="text-xs">{{ d.label }}</span>
                  <span class="text-[10px] mt-0.5" :class="isDayActive(d.id) ? 'text-violet-300' : 'text-slate-600'">
                    {{ isDayActive(d.id) ? 'MASUK' : 'LIBUR' }}
                  </span>
                </button>
              </div>
            </div>

            <div class="border-t border-slate-800 pt-5">
              <div class="flex items-center gap-2 mb-4">
                <Clock class="text-violet-400" :size="20" />
                <h3 class="text-base font-semibold text-white">Jam Absensi</h3>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1">Mulai Absen Masuk</label>
                  <BaseInput v-model="ruleForm.check_in_start" type="time" placeholder="06:00" />
                  <p class="text-xs text-slate-500 mt-1">Scan QR diterima mulai jam ini.</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1">Batas Tepat Waktu</label>
                  <BaseInput v-model="ruleForm.on_time_until" type="time" placeholder="07:15" />
                  <p class="text-xs text-slate-500 mt-1">Lewat dari jam ini dihitung Terlambat.</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1">Batas Belum Hadir (Cutoff)</label>
                  <BaseInput v-model="ruleForm.absent_cutoff" type="time" placeholder="09:00" />
                  <p class="text-xs text-slate-500 mt-1">Jam pengecekan siswa yang belum scan.</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1">Mulai Absen Pulang</label>
                  <BaseInput v-model="ruleForm.check_out_from" type="time" placeholder="14:00" />
                  <p class="text-xs text-slate-500 mt-1">Scan pulang diterima mulai jam ini.</p>
                </div>
              </div>
            </div>

            <div class="pt-6 flex justify-end border-t border-slate-800 mt-6">
              <BaseButton variant="primary" @click="saveTimeRules" :disabled="isSaving" class="gap-2">
                <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
                <Save v-else class="w-4 h-4" />
                {{ isSaving ? 'Menyimpan...' : 'Simpan Jam & Hari Kerja' }}
              </BaseButton>
            </div>
          </BaseCard>
        </div>

        <div class="space-y-6">
          <BaseCard class="p-6 bg-slate-900/50 border border-slate-800">
            <h3 class="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <HelpCircle class="text-violet-400" :size="18" />
              Prinsip Cerdas EduRaport
            </h3>
            <ul class="space-y-2 text-xs text-slate-400 list-disc pl-4">
              <li>Hari yang tidak dipilih berstatus <strong>Libur Mingguan</strong>.</li>
              <li>Pada hari libur mingguan, sistem <strong>TIDAK PERNAH</strong> mengirim peringatan WA Alpa ke orang tua.</li>
              <li>Unit Pesantren yang meliburkan hari Jumat dapat memilih template <strong>Pesantren Tradisional</strong>.</li>
            </ul>
          </BaseCard>
        </div>
      </div>

      <!-- TAB 2: Notifikasi WhatsApp -->
      <div v-else-if="activeTab === 'notifications'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <BaseCard class="p-6 space-y-6">
            <div class="flex items-center gap-2 mb-2">
              <Bell class="text-violet-400" :size="20" />
              <h2 class="text-lg font-semibold text-white">Notifikasi Presensi ke Orang Tua</h2>
            </div>
            <p class="text-xs text-slate-400">
              Atur pesan WhatsApp otomatis yang dikirimkan ke nomor ponsel wali murid.
            </p>

            <div class="space-y-4 pt-2">
              <!-- Switch 1: Check-in Alert -->
              <div class="flex items-start justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                <div class="pr-4">
                  <h4 class="text-sm font-bold text-white flex items-center gap-2">
                    Notifikasi Kedatangan Siswa (Check-in)
                  </h4>
                  <p class="text-xs text-slate-400 mt-1">
                    Kirim pesan WhatsApp seketika saat santri/siswa berhasil scan QR masuk (Tepat Waktu atau Terlambat).
                  </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input type="checkbox" v-model="notificationForm.notify_checkin_parents" class="sr-only peer" />
                  <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                </label>
              </div>

              <!-- Switch 2: Absent Alert -->
              <div class="flex items-start justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                <div class="pr-4">
                  <h4 class="text-sm font-bold text-white flex items-center gap-2">
                    Peringatan Ketidakhadiran (Alpa Alert)
                  </h4>
                  <p class="text-xs text-slate-400 mt-1">
                    Kirim pesan WhatsApp otomatis pada jam batas cutoff (contoh: 09.00) jika siswa belum hadir tanpa keterangan sah.
                  </p>
                  <p class="text-[11px] text-amber-400/90 mt-1">
                    *Catatan: Siswa yang izinnya sudah disetujui wali kelas otomatis dikecualikan.
                  </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input type="checkbox" v-model="notificationForm.notify_absent_parents" class="sr-only peer" />
                  <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                </label>
              </div>
            </div>

            <div class="pt-4 flex justify-end border-t border-slate-800">
              <BaseButton variant="primary" @click="saveNotificationSettings" :disabled="isSaving" class="gap-2">
                <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
                <Save v-else class="w-4 h-4" />
                {{ isSaving ? 'Menyimpan...' : 'Simpan Setelan Notifikasi' }}
              </BaseButton>
            </div>
          </BaseCard>
        </div>

        <div>
          <BaseCard class="p-6 bg-slate-900/50 border border-slate-800">
            <h3 class="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <MessageSquare class="text-emerald-400" :size="18" />
              Preview Pesan WhatsApp
            </h3>
            <div class="space-y-3">
              <div class="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-[11px] text-slate-300 font-mono">
                Pemberitahuan: Ananda *Ahmad Fauzi* telah hadir di sekolah pada pukul *06:45* (Tepat Waktu). Terima kasih.
              </div>
              <div class="p-3 bg-rose-950/40 border border-rose-800/40 rounded-lg text-[11px] text-slate-300 font-mono">
                Pemberitahuan: Ananda *Ahmad Fauzi* hari ini belum tercatat hadir di sekolah hingga batas pukul 09:00. Mohon konfirmasinya. Terima kasih.
              </div>
            </div>
          </BaseCard>
        </div>
      </div>

      <!-- TAB 3: Kalender Libur Nasional & Override Pesantren -->
      <div v-else-if="activeTab === 'holidays'" class="space-y-6">
        <!-- Banner Penjelasan Fitur Override -->
        <div class="p-4 bg-gradient-to-r from-violet-950/50 to-slate-900 border border-violet-800/50 rounded-xl flex items-start gap-3">
          <School class="text-violet-400 shrink-0 mt-1" :size="20" />
          <div class="text-xs">
            <h4 class="font-bold text-white mb-0.5">Pengaturan Kalender Khusus Pesantren & Madrasah</h4>
            <p class="text-slate-300">
              Di lingkungan pesantren, santri sering kali tetap aktif mengaji/sekolah pada tanggal merah nasional tertentu (contoh: 1 Mei Hari Buruh). 
              Gunakan tombol <strong>"Tetap Masuk"</strong> pada tabel di bawah untuk membuat pengecualian agar scanner QR dan absensi berjalan normal tanpa menolak kehadiran.
            </p>
          </div>
        </div>

        <!-- Sync Header & Controls -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div class="flex items-center gap-3">
            <label class="text-xs font-semibold text-slate-300">Tahun:</label>
            <select
              v-model="selectedYear"
              @change="fetchHolidays(selectedSchoolId, selectedYear)"
              class="bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:border-violet-500"
            >
              <option :value="2025">2025</option>
              <option :value="2026">2026</option>
              <option :value="2027">2027</option>
            </select>
            <span class="text-xs text-slate-400">
              Total {{ holidayData.items.length }} agenda libur terdata
            </span>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <BaseButton
              variant="secondary"
              @click="syncHolidays"
              :disabled="isSyncingHolidays"
              class="text-xs gap-2 py-1.5"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isSyncingHolidays }" />
              {{ isSyncingHolidays ? 'Menyinkronkan...' : 'Tarik Libur Nasional (API)' }}
            </BaseButton>

            <BaseButton
              variant="primary"
              @click="openAddHolidayModal"
              class="text-xs gap-2 py-1.5 shadow-md shadow-violet-900/30"
            >
              <Plus class="w-3.5 h-3.5" />
              Tambah Libur Khusus / Rentang
            </BaseButton>
          </div>
        </div>

        <!-- Holiday Table -->
        <BaseCard class="overflow-hidden p-0 border border-slate-800">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th class="py-3 px-4">Tanggal & Hari</th>
                  <th class="py-3 px-4">Nama Hari Libur / Agenda</th>
                  <th class="py-3 px-4">Sasaran (Scope)</th>
                  <th class="py-3 px-4">Kategori</th>
                  <th class="py-3 px-4">Status di Unit Ini</th>
                  <th class="py-3 px-4 text-right">Aksi Override</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                <tr v-if="holidayData.items.length === 0">
                  <td colspan="6" class="py-8 text-center text-slate-500">
                    Belum ada data hari libur. Klik tombol "Tarik Libur Nasional" di atas.
                  </td>
                </tr>

                <tr
                  v-for="item in holidayData.items"
                  :key="item.override_id || (item.date + '-' + (item.scope_type || 'school') + '-' + (item.level || '') + '-' + (item.class_id || ''))"
                  :class="[
                    'hover:bg-slate-850/40 transition-colors',
                    item.school_status === 'force_school_day' ? 'bg-emerald-950/20' : ''
                  ]"
                >
                  <td class="py-3 px-4 whitespace-nowrap">
                    <div class="font-semibold text-white text-xs">
                      {{ formatIndonesianDate(item.date) }}
                    </div>
                    <div class="font-mono text-[11px] text-slate-400 mt-0.5">
                      {{ item.date }}
                    </div>
                  </td>
                  <td class="py-3 px-4 font-semibold text-white">
                    {{ item.name }}
                    <span v-if="item.note && item.override_type === 'custom_holiday' && item.note !== item.name" class="block text-[11px] text-violet-400 font-normal mt-0.5">
                      {{ item.note }}
                    </span>
                  </td>
                  <td class="py-3 px-4 whitespace-nowrap">
                    <span v-if="item.scope_type === 'level'" class="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1.5 shadow-2xs">
                      <GraduationCap :size="12" class="text-amber-400 shrink-0" />
                      Tingkat {{ item.level }}
                    </span>
                    <span v-else-if="item.scope_type === 'class'" class="px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1.5 shadow-2xs">
                      <Users :size="12" class="text-purple-400 shrink-0" />
                      Kelas {{ item.class_name || 'Khusus' }}
                    </span>
                    <span v-else class="px-2.5 py-1 rounded-md text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60 inline-flex items-center gap-1.5">
                      <School :size="12" class="text-slate-400 shrink-0" />
                      Seluruh Sekolah
                    </span>
                  </td>
                  <td class="py-3 px-4 whitespace-nowrap">
                    <span v-if="item.is_national_holiday && !item.is_joint_leave" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      🇮🇩 Libur Nasional
                    </span>
                    <span v-else-if="item.is_joint_leave" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      👥 Cuti Bersama
                    </span>
                    <span v-else-if="item.category" :class="['px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5', getCategoryMeta(item.category)?.color || 'bg-violet-500/20 text-violet-300 border-violet-500/30']">
                      <span>{{ getCategoryMeta(item.category)?.icon }}</span>
                      {{ getCategoryMeta(item.category)?.name }}
                    </span>
                    <span v-else class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      📌 Libur Khusus
                    </span>

                    <span v-if="item.group_id" class="ml-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-700/50" title="Bagian dari Rentang Libur Kalender">
                      Rentang
                    </span>
                  </td>
                  <td class="py-3 px-4 whitespace-nowrap">
                    <span v-if="item.school_status === 'force_school_day'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <CheckCircle2 :size="13" class="text-emerald-400" />
                      TETAP MASUK (KBM Aktif)
                    </span>
                    <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-400">
                      <XCircle :size="13" class="text-rose-400" />
                      Libur (Sistem Hening)
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right whitespace-nowrap">
                    <!-- If custom holiday -> Delete button -->
                    <button
                      v-if="item.override_type === 'custom_holiday'"
                      type="button"
                      @click="deleteCustomHoliday(item)"
                      class="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-950/40 border border-transparent hover:border-rose-800/40 transition-colors"
                      title="Hapus Libur Khusus"
                    >
                      <Trash2 :size="15" />
                    </button>

                    <!-- If national holiday -> Toggle Tetap Masuk -->
                    <button
                      v-else
                      type="button"
                      @click="togglePesantrenForceSchoolDay(item)"
                      :class="[
                        'px-3 py-1 rounded-md text-[11px] font-bold border transition-all inline-flex items-center gap-1.5',
                        item.school_status === 'force_school_day'
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                          : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                      ]"
                    >
                      <Check v-if="item.school_status === 'force_school_day'" :size="12" />
                      {{ item.school_status === 'force_school_day' ? 'Masuk Aktif' : 'Setel Tetap Masuk' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>

        <!-- BaseModal: Tambah Hari Libur Khusus & Rentang Tanggal -->
        <BaseModal
          :show="showHolidayModal"
          title="Tambah Libur Khusus / Rentang Kalender"
          size="lg"
          @close="showHolidayModal = false"
        >
          <div class="space-y-5 text-slate-200">
            <!-- Modal Error Alert Banner -->
            <div v-if="modalError" class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle class="w-4 h-4 shrink-0 text-rose-400" />
              <span>{{ modalError }}</span>
            </div>

            <!-- Mode Switcher -->
            <div class="flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
              <button
                type="button"
                @click="holidayModalMode = 'single'"
                :class="[
                  'flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2',
                  holidayModalMode === 'single'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                ]"
              >
                <Calendar class="w-3.5 h-3.5" />
                Satu Hari Libur (Single Date)
              </button>
              <button
                type="button"
                @click="holidayModalMode = 'range'"
                :class="[
                  'flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2',
                  holidayModalMode === 'range'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                ]"
              >
                <Layers class="w-3.5 h-3.5" />
                Rentang Tanggal (Date Range)
              </button>
            </div>

            <!-- Single Day Mode -->
            <div v-if="holidayModalMode === 'single'" class="space-y-2">
              <BaseDateInput
                v-model="holidayForm.date"
                label="Pilih Tanggal Libur"
                placeholder="Pilih tanggal libur..."
              />
            </div>

            <!-- Range Date Mode -->
            <div v-else class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <BaseDateInput
                  v-model="holidayForm.start_date"
                  label="Tanggal Mulai"
                  placeholder="Pilih tanggal mulai..."
                />
                <BaseDateInput
                  v-model="holidayForm.end_date"
                  :min="holidayForm.start_date"
                  label="Tanggal Selesai"
                  placeholder="Pilih tanggal selesai..."
                  align="right"
                />
              </div>

              <!-- Quick Presets -->
              <div class="flex items-center gap-2 flex-wrap pt-1">
                <span class="text-[11px] text-slate-400 font-semibold">Preset Cepat:</span>
                <button
                  type="button"
                  @click="applyRangePreset(3)"
                  class="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors"
                >
                  +3 Hari
                </button>
                <button
                  type="button"
                  @click="applyRangePreset(7)"
                  class="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors"
                >
                  +1 Minggu (7 Hari)
                </button>
                <button
                  type="button"
                  @click="applyRangePreset(14)"
                  class="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors"
                >
                  +2 Minggu (14 Hari)
                </button>
                <button
                  type="button"
                  @click="applyRangePreset(30)"
                  class="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors"
                >
                  +1 Bulan (30 Hari)
                </button>
              </div>

              <!-- Live Duration Summary Banner -->
              <div v-if="holidayForm.start_date && holidayForm.end_date" class="p-3 bg-violet-950/40 border border-violet-800/40 rounded-xl text-xs text-violet-200 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Calendar class="w-4 h-4 text-violet-400" />
                  <span><strong>{{ formatIndonesianDate(holidayForm.start_date, false) }}</strong> s/d <strong>{{ formatIndonesianDate(holidayForm.end_date, false) }}</strong></span>
                </div>
                <span class="px-2.5 py-0.5 rounded-full bg-violet-600/40 text-violet-300 font-bold text-[11px] border border-violet-500/40">
                  Total {{ rangeDaysCount }} Hari Kalender
                </span>
              </div>
            </div>

            <!-- Category Selector (Requirement 1) -->
            <div class="space-y-2">
              <label class="block text-xs font-semibold text-slate-300">Kategori Libur Khusus:</label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  v-for="cat in HOLIDAY_CATEGORIES"
                  :key="cat.id"
                  type="button"
                  @click="holidayForm.category = cat.id"
                  :class="[
                    'p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center gap-2.5',
                    holidayForm.category === cat.id
                      ? 'bg-violet-950/60 border-violet-500 text-white shadow-sm ring-1 ring-violet-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  ]"
                >
                  <span class="text-base">{{ cat.icon }}</span>
                  <span class="leading-tight">{{ cat.name }}</span>
                </button>
              </div>
            </div>

            <!-- Scope Selector (Seluruh Sekolah vs Tingkat vs Rombel) -->
            <div class="space-y-2.5 pt-1 border-t border-slate-800/80">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-semibold text-slate-300">Sasaran Hari Libur (Scope Operasional):</label>
                <span class="text-[10px] text-slate-400 font-medium">Pilih cakupan yang diliburkan</span>
              </div>

              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  @click="holidayForm.scope_type = 'school'"
                  :class="[
                    'p-3 rounded-xl border text-center text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5',
                    holidayForm.scope_type === 'school'
                      ? 'bg-violet-950/60 border-violet-500 text-white shadow-sm ring-1 ring-violet-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  ]"
                >
                  <School class="w-4 h-4 text-violet-400" />
                  <span>Semua Sekolah</span>
                  <span class="text-[9px] font-normal text-slate-400">Seluruh unit libur</span>
                </button>

                <button
                  type="button"
                  @click="holidayForm.scope_type = 'level'"
                  :class="[
                    'p-3 rounded-xl border text-center text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5',
                    holidayForm.scope_type === 'level'
                      ? 'bg-amber-950/60 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  ]"
                >
                  <GraduationCap class="w-4 h-4 text-amber-400" />
                  <span>Tingkat Tertentu</span>
                  <span class="text-[9px] font-normal text-slate-400">Pilih 1 atau beberapa jenjang</span>
                </button>

                <button
                  type="button"
                  @click="holidayForm.scope_type = 'class'"
                  :class="[
                    'p-3 rounded-xl border text-center text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5',
                    holidayForm.scope_type === 'class'
                      ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  ]"
                >
                  <Users class="w-4 h-4 text-purple-400" />
                  <span>Rombel Spesifik</span>
                  <span class="text-[9px] font-normal text-slate-400">Pilih 1 atau beberapa kelas</span>
                </button>
              </div>

              <!-- Scope Detail Picker: Level -->
              <div v-if="holidayForm.scope_type === 'level'" class="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-3">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-amber-300">Pilih Jenjang / Tingkat Kelas:</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Dipilih: {{ holidayForm.levels.length }} Tingkat
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      @click="selectAllLevels"
                      class="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium transition-colors"
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      @click="clearAllLevels"
                      class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-medium transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <!-- Chips Multi-Select -->
                <div class="flex items-center gap-2 flex-wrap">
                  <button
                    v-for="lvl in availableLevels"
                    :key="lvl"
                    type="button"
                    @click="toggleLevel(lvl)"
                    :class="[
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5',
                      holidayForm.levels.includes(lvl)
                        ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md ring-2 ring-amber-500/30'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500/50'
                    ]"
                  >
                    <Check v-if="holidayForm.levels.includes(lvl)" class="w-3.5 h-3.5 stroke-[3]" />
                    <span>Tingkat {{ lvl }}</span>
                  </button>
                </div>

                <div class="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/20 text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-2">
                  <span class="text-base shrink-0">💡</span>
                  <div>
                    <span v-if="holidayForm.levels.length > 0">
                      Seluruh rombel di <strong>{{ holidayForm.levels.map(l => 'Tingkat ' + l).join(', ') }}</strong> akan diliburkan (misal karena tingkat lain sedang Ujian Sekolah). Jenjang di luar pilihan ini tetap beroperasi normal.
                    </span>
                    <span v-else class="text-amber-400/60 italic">
                      Klik satu atau beberapa tombol tingkat di atas untuk menentukan jenjang mana saja yang diliburkan.
                    </span>
                  </div>
                </div>
              </div>

              <!-- Scope Detail Picker: Class -->
              <div v-if="holidayForm.scope_type === 'class'" class="p-3.5 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-3">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-purple-300">Pilih Rombel / Kelas:</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Dipilih: {{ holidayForm.class_ids.length }} dari {{ classes.length }} Rombel
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      @click="selectAllClasses"
                      class="px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium transition-colors"
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      @click="clearAllClasses"
                      class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-medium transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <!-- Search Input if classes > 3 -->
                <div v-if="classes.length > 3" class="relative">
                  <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    v-model="classSearchQuery"
                    type="text"
                    placeholder="Cari nama rombel atau tingkat..."
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
                  />
                </div>

                <!-- Classes Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  <button
                    v-for="c in filteredClasses"
                    :key="c.id"
                    type="button"
                    @click="toggleClass(c.id)"
                    :class="[
                      'p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between gap-2',
                      holidayForm.class_ids.includes(c.id)
                        ? 'bg-purple-900/40 border-purple-400 text-white shadow-sm ring-1 ring-purple-500/50'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    ]"
                  >
                    <div class="truncate">
                      <div class="font-bold truncate">{{ c.class_name }}</div>
                      <div class="text-[10px] text-slate-400">Tingkat {{ c.level || '-' }}</div>
                    </div>
                    <div
                      :class="[
                        'w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all',
                        holidayForm.class_ids.includes(c.id)
                          ? 'bg-purple-500 border-purple-400 text-white'
                          : 'border-slate-700 bg-slate-950'
                      ]"
                    >
                      <Check v-if="holidayForm.class_ids.includes(c.id)" class="w-3 h-3 stroke-[3]" />
                    </div>
                  </button>
                </div>

                <div class="p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/20 text-[11px] text-purple-300/90 leading-relaxed flex items-start gap-2">
                  <span class="text-base shrink-0">💡</span>
                  <div>
                    <span v-if="holidayForm.class_ids.length > 0">
                      Hanya <strong>{{ holidayForm.class_ids.length }} rombel terpilih</strong> yang diliburkan (misal karena jadwal outing class / isolasi mandiri). Rombel lainnya di sekolah tetap wajib presensi.
                    </span>
                    <span v-else class="text-purple-400/60 italic">
                      Pilih minimal satu rombel kelas di atas yang ingin diliburkan.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Name / Notes -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-semibold text-slate-300">Nama Agenda / Keterangan Libur:</label>
                <span class="text-[10px] text-slate-400 font-medium">(Opsional, otomatis nama kategori jika dikosongkan)</span>
              </div>
              <input
                type="text"
                v-model="holidayForm.name"
                :placeholder="getCategoryMeta(holidayForm.category)?.name || 'Contoh: Libur Akhir Semester Ganjil TA 2025/2026'"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none"
              />
            </div>
          </div>

          <template #footer>
            <div class="flex items-center justify-end gap-3 w-full">
              <BaseButton variant="outline" @click="showHolidayModal = false">
                Batal
              </BaseButton>
              <BaseButton variant="primary" @click="saveHolidayModal" :disabled="isSavingHoliday" class="gap-2">
                <Loader2 v-if="isSavingHoliday" class="w-4 h-4 animate-spin" />
                <Save v-else class="w-4 h-4" />
                {{ isSavingHoliday ? 'Menyimpan...' : 'Simpan Libur' }}
              </BaseButton>
            </div>
          </template>
        </BaseModal>
      </div>

      <!-- TAB 4: Integrasi Kedisiplinan & Poin Tata Tertib -->
      <div v-else-if="activeTab === 'discipline'" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <BaseCard class="p-6 space-y-6 bg-slate-900/50 border border-slate-800">
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert class="text-rose-400" :size="20" />
                  Otomatisasi Poin Pelanggaran Keterlambatan
                </h3>
                <p class="text-xs text-slate-400 mt-1">
                  Hubungkan hasil pemindaian presensi di gerbang sekolah langsung ke Buku Besar Kedisiplinan Siswa.
                </p>
              </div>

              <div class="space-y-4">
                <!-- Switch 1: Auto Deduct Points -->
                <div class="flex items-start justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <div class="pr-4">
                    <h4 class="text-sm font-bold text-white flex items-center gap-2">
                      Potong Poin Otomatis Saat Siswa Terlambat
                    </h4>
                    <p class="text-xs text-slate-400 mt-1">
                      Saat santri/siswa discan di gerbang dan melewati batas toleransi jam masuk (Status: Terlambat), sistem otomatis mencatat insiden pelanggaran di Modul Kedisiplinan.
                    </p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input type="checkbox" v-model="disciplineForm.sync_late_to_discipline" class="sr-only peer" />
                    <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                <!-- Rule Selection -->
                <div v-if="disciplineForm.sync_late_to_discipline" class="p-4 rounded-xl border border-rose-900/40 bg-rose-950/20 space-y-3">
                  <div>
                    <label class="block text-xs font-bold text-slate-200 mb-1.5">
                      Pilih Aturan Poin Keterlambatan:
                    </label>
                    <select 
                      v-model="disciplineForm.late_rule_id"
                      class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option :value="null">-- Gunakan Aturan Standar Sistem (Cari aturan 'Terlambat') --</option>
                      <option v-for="rule in pointRules" :key="rule.id" :value="rule.id">
                        [{{ rule.rule_code }}] {{ rule.name }} ({{ rule.point_value }} Poin)
                      </option>
                    </select>
                  </div>
                  
                  <p v-if="pointRules.length === 0" class="text-[11px] text-amber-400 flex items-center gap-1.5">
                    <span>⚠️</span> Belum ada aturan pelanggaran aktif di master poin. 
                    <NuxtLink to="/discipline/rules" class="underline font-bold text-rose-400 hover:text-rose-300">
                      Konfigurasi aturan poin di sini &rarr;
                    </NuxtLink>
                  </p>
                </div>
              </div>

              <div class="pt-4 flex justify-end border-t border-slate-800">
                <BaseButton variant="primary" @click="saveDisciplineSettings" :disabled="isSaving" class="gap-2">
                  <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
                  <Save v-else class="w-4 h-4" />
                  {{ isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Kedisiplinan' }}
                </BaseButton>
              </div>
            </BaseCard>
          </div>

          <div>
            <BaseCard class="p-6 bg-slate-900/50 border border-slate-800 space-y-3">
              <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
                <ShieldAlert class="text-amber-400" :size="18" />
                Prinsip Integritas Poin
              </h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                EduRaport menerapkan mekanisme <strong>Idempoten Harian</strong>: siswa yang discan berkali-kali pada hari yang sama hanya akan dikenakan 1 kali pengurangan poin keterlambatan.
              </p>
              <div class="p-3 bg-slate-800/50 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1.5">
                <div class="font-bold text-amber-400 flex items-center gap-1">
                  <span>💡</span> Sistem Poin Positif
                </div>
                <p class="text-[11px] text-slate-400">
                  Modal awal poin siswa (default 100 poin) akan berkurang sesuai bobot minus pelanggaran, sehingga wali kelas dan guru BK dapat memantau siswa berisiko secara dini.
                </p>
              </div>
            </BaseCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
