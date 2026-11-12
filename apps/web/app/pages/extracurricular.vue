<script setup lang="ts">
import { Trophy, Plus, Trash2, Edit2, ShieldAlert, CheckCircle2, User, Clock, Users, Activity, RefreshCw, Search, AlertTriangle } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput, BaseDateInput } from '@eduraport/ui'
import { useExtracurricular } from '../composables/useExtracurricular'
import { useTeacher } from '../composables/useTeacher'
import { useAcademicYear } from '../composables/useAcademicYear'
import { useToast } from '../composables/useToast'
import { useApi } from '../composables/useApi'

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
const toast = useToast()
const { isSchoolLocked, selectedFoundationId, selectedSchoolId, foundations, schools, initContext, onFoundationChange } = useSchoolContext()
const {
  extracurriculars,
  fetchExtracurriculars,
  createExtracurricular,
  updateExtracurricular,
  deleteExtracurricular,
  fetchExtracurricularMembers,
  fetchExtracurricularMemberConflicts,
  saveExtracurricularMembers,
  cloneExtracurricularMembers,
  fetchExtracurricularAttendances
} = useExtracurricular()
const { teachers, fetchTeachers } = useTeacher()
const { academicYears, fetchAcademicYears } = useAcademicYear()

const activeTab = ref<'master' | 'monitoring'>('master')
const showCreateModal = ref(false)
const showEditModal = ref(false)

const resolveDefaultAcademicYearId = (): string => {
  const active = academicYears.value.find((y: any) => y.is_active)
  return active?.id || academicYears.value[0]?.id || ''
}

const findAcademicYearForDate = (dateStr: string): string => {
  if (!dateStr || academicYears.value.length === 0) return ''
  const matched = academicYears.value.find((y: any) => {
    const start = String(y.start_date || '').slice(0, 10)
    const end = String(y.end_date || '').slice(0, 10)
    return start && end && dateStr >= start && dateStr <= end
  })
  return matched?.id || ''
}

// Monitoring state (Berangkat & Pulang Ekstrakurikuler)
const todayWib = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date())
const monitorDate = ref(todayWib)
const selectedMonitorEkstraId = ref('')
const selectedMonitorAcademicYearId = ref('')
const loadingMonitor = ref(false)
const monitorMembers = ref<any[]>([])
const monitorAttendances = ref<any[]>([])

// Members Modal state
const showMembersModal = ref(false)
const membersEkskul = ref<any>(null)
const selectedMemberAcademicYearId = ref('')
const cloneSourceAcademicYearId = ref('')
const schoolStudents = ref<any[]>([])
const selectedMemberIds = ref<string[]>([])
const memberSearch = ref('')
const memberViewFilter = ref<'all' | 'enrolled' | 'conflicts'>('all')
const memberEnrollmentsMap = ref<Record<string, Array<{
  extracurricular_id: string
  extracurricular_name: string
  schedule: string | null
  is_conflict: boolean
  overlap_detail: string | null
}>>>({})
const memberConflictErrors = ref<string[]>([])
const memberAlertRef = ref<HTMLElement | null>(null)
const loadingMembers = ref(false)
const savingMembers = ref(false)
const cloningMembers = ref(false)

const otherMemberAcademicYears = computed(() =>
  academicYears.value.filter((y: any) => y.id !== selectedMemberAcademicYearId.value)
)

const WEEKDAY_OPTIONS = [
  { id: 1, short: 'Sen', full: 'Senin' },
  { id: 2, short: 'Sel', full: 'Selasa' },
  { id: 3, short: 'Rab', full: 'Rabu' },
  { id: 4, short: 'Kam', full: 'Kamis' },
  { id: 5, short: 'Jum', full: 'Jumat' },
  { id: 6, short: 'Sab', full: 'Sabtu' },
  { id: 7, short: 'Min', full: 'Minggu' }
] as const

const formatStructuredScheduleText = (days: number[], start: string, end: string): string => {
  if (!days.length || !start || !end) return ''
  const sorted = [...days].sort((a, b) => a - b)
  const names = sorted.map((d) => WEEKDAY_OPTIONS.find((w) => w.id === d)?.full || '').filter(Boolean)
  const dayLabel =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} & ${names[1]}`
        : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
  return `${dayLabel}, ${start} - ${end} WIB`
}

const syncScheduleBuilderToForm = (formObj: any) => {
  if (formObj.schedule_days.length > 0 && formObj.schedule_start_time && formObj.schedule_end_time) {
    formObj.schedule = formatStructuredScheduleText(
      formObj.schedule_days,
      formObj.schedule_start_time,
      formObj.schedule_end_time
    )
  }
}

const toggleFormScheduleDay = (formObj: any, dayId: number) => {
  const idx = formObj.schedule_days.indexOf(dayId)
  if (idx >= 0) {
    formObj.schedule_days.splice(idx, 1)
  } else {
    formObj.schedule_days.push(dayId)
    formObj.schedule_days.sort((a: number, b: number) => a - b)
  }
  syncScheduleBuilderToForm(formObj)
}

const loadMonitorData = async () => {
  if (!selectedSchoolId.value || !selectedMonitorEkstraId.value) return
  loadingMonitor.value = true
  try {
    const [mems, atts] = await Promise.all([
      fetchExtracurricularMembers(
        selectedSchoolId.value,
        selectedMonitorEkstraId.value,
        selectedMonitorAcademicYearId.value || undefined,
        monitorDate.value || undefined
      ),
      fetchExtracurricularAttendances(selectedSchoolId.value, selectedMonitorEkstraId.value, monitorDate.value)
    ])
    monitorMembers.value = mems || []
    monitorAttendances.value = atts || []
  } catch (err) {
    console.error('Failed loading extracurricular monitor data:', err)
  } finally {
    loadingMonitor.value = false
  }
}

const openMonitoringForEkskul = async (ekskulId: string) => {
  selectedMonitorEkstraId.value = ekskulId
  activeTab.value = 'monitoring'
  await loadMonitorData()
}

const monitorRows = computed(() => {
  const byStudent = new Map<string, any>()
  for (const m of monitorMembers.value) {
    byStudent.set(m.student_id, {
      student_id: m.student_id,
      student_name: m.student_name,
      nis: m.nis || '-',
      class_name: m.class_name || '-',
      status: 'belum_absen',
      check_in_time: null as string | null,
      check_out_time: null as string | null,
      check_in_method: null as string | null,
      check_out_method: null as string | null,
      note: ''
    })
  }
  for (const att of monitorAttendances.value) {
    byStudent.set(att.student_id, {
      student_id: att.student_id,
      student_name: att.student_name,
      nis: att.nis || '-',
      class_name: att.class_name || '-',
      status: att.status || 'hadir',
      check_in_time: att.check_in_time || null,
      check_out_time: att.check_out_time || null,
      check_in_method: att.check_in_method || null,
      check_out_method: att.check_out_method || null,
      note: att.note || ''
    })
  }
  return Array.from(byStudent.values()).sort((a, b) => a.student_name.localeCompare(b.student_name))
})

const monitorStats = computed(() => {
  const rows = monitorRows.value
  const total = rows.length
  const checkedIn = rows.filter((r) => Boolean(r.check_in_time) || r.status === 'hadir').length
  const checkedOut = rows.filter((r) => Boolean(r.check_out_time)).length
  const notCheckedOut = rows.filter((r) => Boolean(r.check_in_time) && !r.check_out_time).length
  return { total, checkedIn, checkedOut, notCheckedOut }
})

const formatWibTime = (iso?: string | null): string => {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  })
}

const formatMethodBadge = (method?: string | null): string => {
  if (method === 'rfid') return '🏷️ RFID'
  if (method === 'qr') return '📷 QR'
  if (method === 'manual_search' || method === 'manual') return '✍️ Manual'
  return ''
}

const loadMembersModalData = async () => {
  if (!selectedSchoolId.value || !membersEkskul.value) return
  loadingMembers.value = true
  memberConflictErrors.value = []
  try {
    const ayId = selectedMemberAcademicYearId.value || undefined
    const studentParams = new URLSearchParams({ limit: '1000' })
    if (ayId) studentParams.set('academic_year_id', ayId)

    const [membersRes, conflictsRes, studentsRes]: [any[], any, any] = await Promise.all([
      fetchExtracurricularMembers(selectedSchoolId.value, membersEkskul.value.id, ayId),
      fetchExtracurricularMemberConflicts(selectedSchoolId.value, membersEkskul.value.id, ayId),
      fetcher(`/school/${selectedSchoolId.value}/student?${studentParams.toString()}`)
    ])
    selectedMemberIds.value = (membersRes || []).map((m: any) => m.student_id)
    memberEnrollmentsMap.value = conflictsRes?.enrollments_by_student || {}
    const rawStudents = studentsRes?.data?.data || studentsRes?.data || []
    
    // Ensure all currently enrolled members in this academic year are guaranteed to exist in the candidates list
    // even if the student is unassigned to a class in this academic year or from a bridged cohort.
    const studentMap = new Map<string, any>()
    const candidateList: any[] = Array.isArray(rawStudents) ? rawStudents : []
    for (const s of candidateList) {
      if (s && typeof s.id === 'string') {
        studentMap.set(s.id, {
          id: s.id,
          full_name: s.full_name || '',
          student_number: s.student_number || null,
          class_id: s.class_id || null,
          class_name: s.class_name || null,
          gender: s.gender || null,
          status: s.status || 'active'
        })
      }
    }
    for (const m of (membersRes || [])) {
      if (m && typeof m.student_id === 'string' && !studentMap.has(m.student_id)) {
        studentMap.set(m.student_id, {
          id: m.student_id,
          full_name: m.student_name || 'Siswa',
          student_number: m.nis || null,
          class_id: m.class_id || null,
          class_name: m.class_name || null,
          gender: null,
          status: 'active'
        })
      }
    }
    schoolStudents.value = Array.from(studentMap.values())
  } catch (err) {
    console.error('Failed loading extracurricular members modal:', err)
  } finally {
    loadingMembers.value = false
  }
}

const openMembersModal = async (ekskul: any) => {
  if (!selectedSchoolId.value) return
  membersEkskul.value = ekskul
  memberSearch.value = ''
  memberViewFilter.value = 'all'
  memberConflictErrors.value = []
  if (academicYears.value.length === 0) {
    await fetchAcademicYears(selectedSchoolId.value)
  }
  selectedMemberAcademicYearId.value = resolveDefaultAcademicYearId()
  cloneSourceAcademicYearId.value =
    academicYears.value.find((y: any) => y.id !== selectedMemberAcademicYearId.value)?.id || ''
  showMembersModal.value = true
  await loadMembersModalData()
}

const onMemberAcademicYearChange = async () => {
  if (cloneSourceAcademicYearId.value === selectedMemberAcademicYearId.value) {
    cloneSourceAcademicYearId.value =
      academicYears.value.find((y: any) => y.id !== selectedMemberAcademicYearId.value)?.id || ''
  }
  await loadMembersModalData()
}

const getStudentEnrollments = (studentId: string) => memberEnrollmentsMap.value[studentId] || []
const getStudentScheduleConflicts = (studentId: string) =>
  getStudentEnrollments(studentId).filter((e) => e.is_conflict)
const hasStudentScheduleConflict = (studentId: string) => getStudentScheduleConflicts(studentId).length > 0

const conflictingStudentsCount = computed(() =>
  schoolStudents.value.filter((s: any) => hasStudentScheduleConflict(s.id)).length
)

const filteredSchoolStudents = computed(() => {
  const kw = memberSearch.value.trim().toLowerCase()
  const base = schoolStudents.value.filter((s: any) => {
    if (memberViewFilter.value === 'enrolled' && !selectedMemberIds.value.includes(s.id)) return false
    if (memberViewFilter.value === 'conflicts' && !hasStudentScheduleConflict(s.id)) return false
    if (!kw) return true
    return (
      (s.full_name || '').toLowerCase().includes(kw) ||
      (s.student_number || '').toLowerCase().includes(kw)
    )
  })

  // Surface currently enrolled members first so admins immediately see who is registered
  return [...base].sort((a: any, b: any) => {
    const aEnrolled = selectedMemberIds.value.includes(a.id) ? 0 : 1
    const bEnrolled = selectedMemberIds.value.includes(b.id) ? 0 : 1
    if (aEnrolled !== bEnrolled) return aEnrolled - bEnrolled
    return (a.full_name || '').localeCompare(b.full_name || '')
  })
})

const toggleMemberSelection = (studentId: string) => {
  const idx = selectedMemberIds.value.indexOf(studentId)
  if (idx >= 0) {
    selectedMemberIds.value.splice(idx, 1)
    return
  }
  if (hasStudentScheduleConflict(studentId)) {
    const conflicts = getStudentScheduleConflicts(studentId)
    const detail = conflicts.map((c) => `${c.extracurricular_name} (${c.overlap_detail})`).join(', ')
    memberConflictErrors.value = [`Siswa tidak dapat dipilih karena jadwal bentrok dengan ${detail}.`]
    nextTick(() => memberAlertRef.value?.focus())
    return
  }
  selectedMemberIds.value.push(studentId)
}

const handleSaveMembers = async () => {
  if (!selectedSchoolId.value || !membersEkskul.value) return
  savingMembers.value = true
  memberConflictErrors.value = []
  try {
    await saveExtracurricularMembers(
      selectedSchoolId.value,
      membersEkskul.value.id,
      selectedMemberIds.value,
      selectedMemberAcademicYearId.value || undefined
    )
    toast.success('Daftar anggota ekstrakurikuler berhasil disimpan.', 'Sukses')
    showMembersModal.value = false
    await fetchExtracurriculars(selectedSchoolId.value)
    if (activeTab.value === 'monitoring' && selectedMonitorEkstraId.value === membersEkskul.value.id) {
      await loadMonitorData()
    }
  } catch (err: any) {
    const studentErrs = err?.data?.errors?.student_ids
    if (Array.isArray(studentErrs) && studentErrs.length > 0) {
      memberConflictErrors.value = studentErrs
      await nextTick()
      memberAlertRef.value?.focus()
    }
    toast.error(studentErrs?.[0] || err?.data?.message || err?.message || 'Gagal menyimpan anggota ekskul', 'Gagal')
  } finally {
    savingMembers.value = false
  }
}

const handleCloneMembers = async () => {
  if (!selectedSchoolId.value || !membersEkskul.value || !cloneSourceAcademicYearId.value) return
  cloningMembers.value = true
  memberConflictErrors.value = []
  try {
    const res: any = await cloneExtracurricularMembers(
      selectedSchoolId.value,
      membersEkskul.value.id,
      cloneSourceAcademicYearId.value,
      selectedMemberAcademicYearId.value || undefined
    )
    const count = res?.data?.cloned ?? 0
    toast.success(`Berhasil menyalin ${count} anggota dari tahun ajaran sumber.`, 'Sukses')
    await Promise.all([loadMembersModalData(), fetchExtracurriculars(selectedSchoolId.value)])
    if (activeTab.value === 'monitoring' && selectedMonitorEkstraId.value === membersEkskul.value.id) {
      await loadMonitorData()
    }
  } catch (err: any) {
    const studentErrs = err?.data?.errors?.student_ids
    if (Array.isArray(studentErrs) && studentErrs.length > 0) {
      memberConflictErrors.value = studentErrs
      await nextTick()
      memberAlertRef.value?.focus()
    }
    const fieldErr =
      studentErrs?.[0] ||
      err?.data?.errors?.source_academic_year_id?.[0] ||
      err?.data?.errors?.target_academic_year_id?.[0]
    toast.error(fieldErr || err?.data?.message || err?.message || 'Gagal menyalin anggota ekskul', 'Gagal')
  } finally {
    cloningMembers.value = false
  }
}

const ekskulForm = reactive({
  name: '',
  instructor: '',
  schedule: '',
  schedule_days: [] as number[],
  schedule_start_time: '15:00',
  schedule_end_time: '17:00',
  is_active: true
})

const editingEkskulId = ref('')
const editForm = reactive({
  name: '',
  instructor: '',
  schedule: '',
  schedule_days: [] as number[],
  schedule_start_time: '15:00',
  schedule_end_time: '17:00',
  is_active: true
})

onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    await Promise.all([
      fetchExtracurriculars(schoolId),
      fetchTeachers(schoolId),
      fetchAcademicYears(schoolId)
    ])
    if (!selectedMonitorAcademicYearId.value) {
      selectedMonitorAcademicYearId.value = resolveDefaultAcademicYearId()
    }
    if (extracurriculars.value.length > 0 && !selectedMonitorEkstraId.value) {
      selectedMonitorEkstraId.value = extracurriculars.value[0].id
    }
  }
})

watch(selectedFoundationId, (newVal) => onFoundationChange(newVal))

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await Promise.all([
      fetchExtracurriculars(newVal),
      fetchTeachers(newVal),
      fetchAcademicYears(newVal)
    ])
    selectedMonitorAcademicYearId.value = resolveDefaultAcademicYearId()
    selectedMonitorEkstraId.value = extracurriculars.value[0]?.id || ''
    if (activeTab.value === 'monitoring' && selectedMonitorEkstraId.value) {
      await loadMonitorData()
    }
  } else {
    extracurriculars.value = []
    selectedMonitorEkstraId.value = ''
    selectedMonitorAcademicYearId.value = ''
    monitorMembers.value = []
    monitorAttendances.value = []
  }
})

watch(monitorDate, (newDate) => {
  const matchedAy = findAcademicYearForDate(newDate)
  if (matchedAy && matchedAy !== selectedMonitorAcademicYearId.value) {
    selectedMonitorAcademicYearId.value = matchedAy
  }
})

watch([activeTab, selectedMonitorEkstraId, selectedMonitorAcademicYearId, monitorDate], async () => {
  if (activeTab.value === 'monitoring' && selectedMonitorEkstraId.value) {
    await loadMonitorData()
  }
})

const createFormError = ref('')
const editFormError = ref('')

const buildExtracurricularPayload = (formObj: typeof ekskulForm) => {
  const payload: Record<string, any> = {
    name: formObj.name,
    instructor: formObj.instructor,
    schedule: formObj.schedule,
    is_active: formObj.is_active
  }
  if (formObj.schedule_days.length > 0 && formObj.schedule_start_time && formObj.schedule_end_time) {
    payload.schedule_days = [...formObj.schedule_days]
    payload.schedule_start_time = formObj.schedule_start_time
    payload.schedule_end_time = formObj.schedule_end_time
  }
  return payload
}

const handleCreateEkskul = async () => {
  createFormError.value = ''
  try {
    const res = await createExtracurricular(selectedSchoolId.value, buildExtracurricularPayload(ekskulForm))
    if (res.success) {
      showCreateModal.value = false
      Object.assign(ekskulForm, {
        name: '',
        instructor: '',
        schedule: '',
        schedule_days: [],
        schedule_start_time: '15:00',
        schedule_end_time: '17:00',
        is_active: true
      })
    }
  } catch (e: any) {
    if (e.data?.errors) {
      const errorMsg = Object.entries(e.data.errors)
        .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
        .join('\n')
      createFormError.value = errorMsg
      toast.error(errorMsg, 'Gagal menambah ekskul')
    } else {
      createFormError.value = e?.message ?? 'Gagal menambah ekskul'
      toast.error(createFormError.value, 'Gagal')
    }
  }
}

const openEditModal = (ekskul: any) => {
  editingEkskulId.value = ekskul.id
  editFormError.value = ''
  Object.assign(editForm, {
    name: ekskul.name,
    instructor: ekskul.instructor || '',
    schedule: ekskul.schedule || '',
    schedule_days: Array.isArray(ekskul.schedule_days) ? [...ekskul.schedule_days] : [],
    schedule_start_time: ekskul.schedule_start_time || '15:00',
    schedule_end_time: ekskul.schedule_end_time || '17:00',
    is_active: !!ekskul.is_active
  })
  showEditModal.value = true
}

const handleUpdateEkskul = async () => {
  editFormError.value = ''
  try {
    const res = await updateExtracurricular(
      selectedSchoolId.value,
      editingEkskulId.value,
      buildExtracurricularPayload(editForm)
    )
    if (res.success) {
      showEditModal.value = false
    }
  } catch (e: any) {
    if (e.data?.errors) {
      const errorMsg = Object.entries(e.data.errors)
        .map(([_field, msgs]: any) => msgs.join('; '))
        .join('\n')
      editFormError.value = errorMsg
      toast.error(errorMsg, 'Jadwal Bentrok / Validasi Gagal')
    } else {
      editFormError.value = e?.message ?? 'Gagal memperbarui ekskul'
      toast.error(editFormError.value, 'Gagal')
    }
  }
}

const handleDeleteEkskul = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus Ekstrakurikuler ini?')) {
    try {
      await deleteExtracurricular(selectedSchoolId.value, id)
    } catch (e: any) {
      alert(e?.message ?? 'Gagal menghapus ekskul')
    }
  }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Manajemen Ekstrakurikuler</h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Atur program ekstrakurikuler, pelatih, dan jadwal kegiatan murid.</p>
      </div>
      <div class="flex gap-2">
        <BaseButton variant="primary" @click="showCreateModal = true" :disabled="!selectedSchoolId" class="py-2.5 px-4 text-xs font-bold">
          <Plus class="mr-1.5" :size="14" /> Ekstrakurikuler Baru
        </BaseButton>
      </div>
    </div>

    <!-- Filters and Selection -->
    <div v-if="!isSchoolLocked" class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
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
    </div>

    <!-- Tabs: Daftar Ekskul vs Monitoring Berangkat & Pulang -->
    <div class="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-1">
      <button
        type="button"
        data-testid="ekstra-tab-master"
        @click="activeTab = 'master'"
        :class="[
          'px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition cursor-pointer flex items-center gap-1.5',
          activeTab === 'master'
            ? 'border-violet-600 text-violet-700 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/20'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400'
        ]"
      >
        <Trophy :size="14" />
        <span>Daftar Ekstrakurikuler</span>
      </button>
      <button
        type="button"
        data-testid="ekstra-tab-monitoring"
        @click="activeTab = 'monitoring'"
        :class="[
          'px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition cursor-pointer flex items-center gap-1.5',
          activeTab === 'monitoring'
            ? 'border-violet-600 text-violet-700 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/20'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400'
        ]"
      >
        <Activity :size="14" />
        <span>Monitoring Berangkat &amp; Pulang</span>
      </button>
    </div>

    <!-- TAB 1: Extracurriculars Table -->
    <div v-if="activeTab === 'master'" class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            <th class="p-4 pl-6">Nama Ekstrakurikuler</th>
            <th class="p-4">Instruktur / Pelatih</th>
            <th class="p-4">Jadwal Kegiatan</th>
            <th class="p-4">Status</th>
            <th class="p-4 pr-6 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ekskul in extracurriculars" :key="ekskul.id" class="border-b border-slate-100 dark:border-zinc-800/80 last:border-0 hover:bg-slate-50/20 dark:hover:bg-zinc-900/20 transition-colors">
            <td class="p-4 pl-6">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded bg-violet-50 dark:bg-zinc-850 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <Trophy :size="16" />
                </div>
                <span class="font-bold text-slate-800 dark:text-zinc-200 text-sm">{{ ekskul.name }}</span>
              </div>
            </td>
            <td class="p-4 text-xs font-semibold text-slate-650 dark:text-zinc-350 flex-row items-center gap-1">
              <div class="flex items-center gap-1.5">
                <User :size="12" class="text-slate-400" />
                <span>{{ ekskul.instructor || 'Belum Ada Pelatih' }}</span>
              </div>
            </td>
            <td class="p-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">
              <div class="flex items-center gap-1.5">
                <Clock :size="12" class="text-slate-400" />
                <span>{{ ekskul.schedule || '-' }}</span>
              </div>
            </td>
            <td class="p-4">
              <span v-if="ekskul.is_active" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 :size="11" /> Aktif
              </span>
              <span v-else class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                Nonaktif
              </span>
            </td>
            <td class="p-4 pr-6 text-right">
              <div class="flex justify-end items-center gap-1">
                <button
                  type="button"
                  data-testid="btn-monitor-ekstra"
                  @click="openMonitoringForEkskul(ekskul.id)"
                  class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title="Pantau Berangkat & Pulang"
                >
                  <Activity :size="13" />
                  <span>Pantau</span>
                </button>
                <button
                  type="button"
                  data-testid="btn-members-ekstra"
                  @click="openMembersModal(ekskul)"
                  class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  title="Lihat & Kelola Anggota Ekskul"
                >
                  <Users :size="13" />
                  <span>Anggota</span>
                  <span class="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                    {{ ekskul.member_count ?? 0 }}
                  </span>
                </button>
                <button @click="openEditModal(ekskul)" class="p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  <Edit2 :size="14" />
                </button>
                <button @click="handleDeleteEkskul(ekskul.id)" class="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 transition-colors">
                  <Trash2 :size="14" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="extracurriculars.length === 0">
            <td colspan="5" class="p-12 text-center text-slate-400 dark:text-zinc-500">
              <Trophy class="mx-auto mb-2 opacity-50" :size="32" />
              <p class="text-xs font-semibold">Belum ada data Ekstrakurikuler.</p>
              <p class="text-[10px] mt-1">Klik tombol 'Ekstrakurikuler Baru' untuk menambahkan data.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- TAB 2: Monitoring Berangkat & Pulang Ekstrakurikuler -->
    <div v-else class="space-y-4">
      <div class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-4 flex flex-wrap items-end justify-between gap-3 shadow-sm">
        <div class="flex flex-wrap items-end gap-3 w-full lg:w-auto">
          <div class="flex flex-col gap-1 w-full sm:w-auto">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pilih Ekstrakurikuler</label>
            <select
              v-model="selectedMonitorEkstraId"
              data-testid="monitor-ekstra-select"
              class="h-9 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 transition-all min-w-[210px]"
            >
              <option value="" disabled>-- Pilih Ekskul --</option>
              <option v-for="ex in extracurriculars" :key="ex.id" :value="ex.id">{{ ex.name }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1 w-full sm:w-auto">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran</label>
            <select
              v-model="selectedMonitorAcademicYearId"
              data-testid="monitor-ekstra-year"
              class="h-9 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 transition-all min-w-[180px]"
            >
              <option value="" disabled>-- Tahun Ajaran --</option>
              <option v-for="ay in academicYears" :key="ay.id" :value="ay.id">
                {{ ay.name }}{{ ay.is_active ? ' (Aktif)' : '' }}
              </option>
            </select>
          </div>
          <div class="w-full sm:w-auto sm:min-w-[230px]">
            <BaseDateInput
              v-model="monitorDate"
              label="Tanggal"
              size="sm"
              accent="violet"
              :clearable="false"
              data-testid="monitor-ekstra-date"
            />
          </div>
        </div>

        <BaseButton variant="outline" size="sm" @click="loadMonitorData" :disabled="loadingMonitor || !selectedMonitorEkstraId" class="h-9 gap-1.5 text-xs shrink-0">
          <RefreshCw :size="14" :class="loadingMonitor ? 'animate-spin' : ''" />
          <span>Muat Ulang</span>
        </BaseButton>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800 rounded-xl p-4">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Terdaftar</p>
          <p class="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">{{ monitorStats.total }}</p>
        </div>
        <div class="bg-white dark:bg-zinc-900/60 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl p-4">
          <p class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Sudah Berangkat</p>
          <p class="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{{ monitorStats.checkedIn }}</p>
        </div>
        <div class="bg-white dark:bg-zinc-900/60 border border-sky-200/60 dark:border-sky-900/40 rounded-xl p-4">
          <p class="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Sudah Pulang</p>
          <p class="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{{ monitorStats.checkedOut }}</p>
        </div>
        <div class="bg-white dark:bg-zinc-900/60 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-4">
          <p class="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Belum Pulang</p>
          <p class="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{{ monitorStats.notCheckedOut }}</p>
        </div>
      </div>

      <!-- Monitoring Table -->
      <div class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/40 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <th class="p-3.5 pl-5">Siswa</th>
              <th class="p-3.5">Status</th>
              <th class="p-3.5">Jam Berangkat</th>
              <th class="p-3.5">Jam Pulang</th>
              <th class="p-3.5 pr-5">Keterangan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/60">
            <tr v-for="row in monitorRows" :key="row.student_id" class="hover:bg-slate-50/40 dark:hover:bg-zinc-800/30">
              <td class="p-3.5 pl-5">
                <p class="font-bold text-slate-900 dark:text-zinc-100">{{ row.student_name }}</p>
                <p class="text-[10px] text-slate-400">NIS: {{ row.nis }} · {{ row.class_name }}</p>
              </td>
              <td class="p-3.5">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                    row.status === 'hadir' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                    row.status === 'belum_absen' ? 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  ]"
                >
                  {{ row.status === 'belum_absen' ? 'Belum Absen' : row.status }}
                </span>
              </td>
              <td class="p-3.5 font-mono">
                <span v-if="row.check_in_time" class="font-bold text-emerald-600 dark:text-emerald-400">
                  {{ formatWibTime(row.check_in_time) }}
                </span>
                <span v-else class="text-slate-400">-</span>
                <span v-if="row.check_in_method" class="ml-1.5 text-[10px] text-slate-500">{{ formatMethodBadge(row.check_in_method) }}</span>
              </td>
              <td class="p-3.5 font-mono">
                <span v-if="row.check_out_time" class="font-bold text-sky-600 dark:text-sky-400">
                  {{ formatWibTime(row.check_out_time) }}
                </span>
                <span v-else class="text-slate-400">-</span>
                <span v-if="row.check_out_method" class="ml-1.5 text-[10px] text-slate-500">{{ formatMethodBadge(row.check_out_method) }}</span>
              </td>
              <td class="p-3.5 pr-5 text-slate-500">{{ row.note || '-' }}</td>
            </tr>
            <tr v-if="monitorRows.length === 0">
              <td colspan="5" class="p-10 text-center text-slate-400">
                Belum ada anggota terdaftar atau scan presensi ekstrakurikuler pada tanggal ini.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Modal -->
    <BaseModal :show="showCreateModal" title="Ekstrakurikuler Baru" @close="showCreateModal = false">
      <form @submit.prevent="handleCreateEkskul" class="space-y-4">
        <div
          v-if="createFormError"
          role="alert"
          class="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300 whitespace-pre-line"
        >
          {{ createFormError }}
        </div>
        <BaseInput v-model="ekskulForm.name" label="Nama Ekstrakurikuler" placeholder="Contoh: Pramuka Utama" required />
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-slate-650 dark:text-zinc-400">Pelatih / Instruktur</label>
          <select 
            v-model="ekskulForm.instructor" 
            class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-violet-600 text-slate-900 dark:text-zinc-100"
          >
            <option value="">-- Pilih Guru / Staf --</option>
            <option v-for="t in teachers" :key="t.id" :value="t.full_name">
              {{ t.full_name }}
            </option>
          </select>
        </div>

        <!-- Structured Schedule Builder + Synced Label -->
        <div class="space-y-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 p-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Atur Hari &amp; Jam (Deteksi Bentrok)</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="day in WEEKDAY_OPTIONS"
              :key="day.id"
              type="button"
              :aria-pressed="ekskulForm.schedule_days.includes(day.id)"
              @click="toggleFormScheduleDay(ekskulForm, day.id)"
              :class="[
                'min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer',
                ekskulForm.schedule_days.includes(day.id)
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-violet-400'
              ]"
            >
              {{ day.short }}
            </button>
          </div>
          <div v-if="ekskulForm.schedule_days.length > 0" class="grid grid-cols-2 gap-2.5 pt-1">
            <div class="flex flex-col gap-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jam Mulai</label>
              <input
                type="time"
                v-model="ekskulForm.schedule_start_time"
                @change="syncScheduleBuilderToForm(ekskulForm)"
                class="h-9 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none focus:border-violet-600"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jam Selesai</label>
              <input
                type="time"
                v-model="ekskulForm.schedule_end_time"
                @change="syncScheduleBuilderToForm(ekskulForm)"
                class="h-9 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none focus:border-violet-600"
              />
            </div>
          </div>
          <BaseInput v-model="ekskulForm.schedule" label="Jadwal Kegiatan" placeholder="Contoh: Sabtu, 09.00 - 11.00 WIB" />
        </div>
        
        <div class="flex items-center gap-2 px-1 py-1">
          <input type="checkbox" id="is_active_ekskul_create" v-model="ekskulForm.is_active" class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20" />
          <label for="is_active_ekskul_create" class="text-xs font-semibold text-slate-600 dark:text-zinc-400">Aktifkan ekskul ini</label>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showCreateModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Edit Modal -->
    <BaseModal :show="showEditModal" title="Ubah Ekstrakurikuler" @close="showEditModal = false">
      <form @submit.prevent="handleUpdateEkskul" class="space-y-4">
        <div
          v-if="editFormError"
          role="alert"
          class="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300 whitespace-pre-line"
        >
          {{ editFormError }}
        </div>
        <BaseInput v-model="editForm.name" label="Nama Ekstrakurikuler" placeholder="Contoh: Pramuka Utama" required />
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-slate-650 dark:text-zinc-400">Pelatih / Instruktur</label>
          <select 
            v-model="editForm.instructor" 
            class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-violet-600 text-slate-900 dark:text-zinc-100"
          >
            <option value="">-- Pilih Guru / Staf --</option>
            <option v-for="t in teachers" :key="t.id" :value="t.full_name">
              {{ t.full_name }}
            </option>
          </select>
        </div>

        <!-- Structured Schedule Builder + Synced Label -->
        <div class="space-y-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 p-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Atur Hari &amp; Jam (Deteksi Bentrok)</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="day in WEEKDAY_OPTIONS"
              :key="day.id"
              type="button"
              :aria-pressed="editForm.schedule_days.includes(day.id)"
              @click="toggleFormScheduleDay(editForm, day.id)"
              :class="[
                'min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer',
                editForm.schedule_days.includes(day.id)
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-violet-400'
              ]"
            >
              {{ day.short }}
            </button>
          </div>
          <div v-if="editForm.schedule_days.length > 0" class="grid grid-cols-2 gap-2.5 pt-1">
            <div class="flex flex-col gap-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jam Mulai</label>
              <input
                type="time"
                v-model="editForm.schedule_start_time"
                @change="syncScheduleBuilderToForm(editForm)"
                class="h-9 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none focus:border-violet-600"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jam Selesai</label>
              <input
                type="time"
                v-model="editForm.schedule_end_time"
                @change="syncScheduleBuilderToForm(editForm)"
                class="h-9 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none focus:border-violet-600"
              />
            </div>
          </div>
          <BaseInput v-model="editForm.schedule" label="Jadwal Kegiatan" placeholder="Contoh: Sabtu, 09.00 - 11.00 WIB" />
        </div>
        
        <div class="flex items-center gap-2 px-1 py-1">
          <input type="checkbox" id="is_active_ekskul_edit" v-model="editForm.is_active" class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20" />
          <label for="is_active_ekskul_edit" class="text-xs font-semibold text-slate-600 dark:text-zinc-400">Ekskul aktif</label>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showEditModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Perubahan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Members Management Modal -->
    <BaseModal :show="showMembersModal" size="2xl" :title="`Anggota Ekstrakurikuler: ${membersEkskul?.name || ''}`" @close="showMembersModal = false">
      <div class="space-y-4">
        <!-- Club Schedule Summary Banner -->
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 px-3.5 py-2.5 text-xs">
          <div class="flex items-center gap-2 text-slate-600 dark:text-zinc-300">
            <Clock :size="14" class="text-violet-600 dark:text-violet-400 shrink-0" />
            <span>Jadwal Ekskul Ini:</span>
            <span class="font-bold text-slate-900 dark:text-zinc-100">
              {{ membersEkskul?.schedule || 'Belum diatur' }}
            </span>
          </div>
          <span class="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
            Validasi bentrok jadwal otomatis aktif per Tahun Ajaran
          </span>
        </div>

        <!-- Inline Focusable Conflict / Validation Alert Summary (UI/UX Pro Max) -->
        <div
          v-if="memberConflictErrors.length > 0"
          ref="memberAlertRef"
          role="alert"
          tabindex="-1"
          class="rounded-xl border border-rose-300 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-800 dark:text-rose-200 outline-none focus:ring-2 focus:ring-rose-500"
        >
          <div class="flex items-start gap-2.5">
            <AlertTriangle :size="16" class="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div class="space-y-1 min-w-0">
              <p class="font-bold">Jadwal Ekstrakurikuler Bentrok / Beririsan</p>
              <ul class="list-disc pl-4 space-y-0.5 text-[11px]">
                <li v-for="(err, idx) in memberConflictErrors" :key="idx">{{ err }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Year Selector & Clone Bar (Overflow-safe Grid) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/70 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800 rounded-xl p-3">
          <div class="flex flex-col gap-1 min-w-0">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran</label>
            <select
              v-model="selectedMemberAcademicYearId"
              data-testid="member-ekstra-year"
              @change="onMemberAcademicYearChange"
              class="h-9 w-full min-w-0 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none focus:border-violet-600"
            >
              <option value="" disabled>-- Pilih Tahun Ajaran --</option>
              <option v-for="ay in academicYears" :key="ay.id" :value="ay.id">
                {{ ay.name }}{{ ay.is_active ? ' (Aktif)' : '' }}
              </option>
            </select>
          </div>

          <div v-if="otherMemberAcademicYears.length > 0" class="flex flex-col gap-1 min-w-0">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Salin dari Tahun Sebelumnya</label>
            <div class="flex items-center gap-1.5 min-w-0">
              <select
                v-model="cloneSourceAcademicYearId"
                data-testid="member-clone-source-year"
                class="h-9 flex-1 min-w-0 truncate bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none focus:border-violet-600"
              >
                <option value="" disabled>-- Sumber --</option>
                <option v-for="ay in otherMemberAcademicYears" :key="ay.id" :value="ay.id">
                  {{ ay.name }}{{ ay.is_active ? ' (Aktif)' : '' }}
                </option>
              </select>
              <BaseButton
                variant="outline"
                size="sm"
                data-testid="btn-clone-ekstra-members"
                @click="handleCloneMembers"
                :disabled="cloningMembers || !cloneSourceAcademicYearId || !selectedMemberAcademicYearId"
                class="h-9 px-3 text-[11px] shrink-0 whitespace-nowrap"
              >
                {{ cloningMembers ? 'Menyalin...' : 'Salin' }}
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- View Filter Pills & Search -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-testid="member-filter-all"
              @click="memberViewFilter = 'all'"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer',
                memberViewFilter === 'all'
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
              ]"
            >
              Semua Siswa ({{ schoolStudents.length }})
            </button>
            <button
              type="button"
              data-testid="member-filter-enrolled"
              @click="memberViewFilter = 'enrolled'"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer',
                memberViewFilter === 'enrolled'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
              ]"
            >
              Anggota Terdaftar ({{ selectedMemberIds.length }})
            </button>
            <button
              v-if="conflictingStudentsCount > 0"
              type="button"
              data-testid="member-filter-conflicts"
              @click="memberViewFilter = 'conflicts'"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer',
                memberViewFilter === 'conflicts'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              ]"
            >
              Bentrok Jadwal ({{ conflictingStudentsCount }})
            </button>
          </div>

          <div class="relative flex-1 sm:max-w-xs">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="14" />
            <input
              type="text"
              v-model="memberSearch"
              placeholder="Cari nama atau NIS siswa..."
              class="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 outline-none focus:border-violet-600"
            />
          </div>
        </div>

        <div v-if="loadingMembers" class="py-8 text-center text-xs text-slate-400">Memuat daftar siswa...</div>
        <div v-else class="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl">
          <div v-if="filteredSchoolStudents.length === 0" class="py-8 text-center text-xs text-slate-400">
            <template v-if="memberViewFilter === 'enrolled'">
              <span v-if="memberSearch.trim()">
                Tidak ada anggota terdaftar yang sesuai dengan pencarian "{{ memberSearch }}".
              </span>
              <span v-else>
                Belum ada anggota terdaftar di ekstrakurikuler ini pada tahun ajaran yang dipilih.
              </span>
            </template>
            <template v-else-if="memberViewFilter === 'conflicts'">
              <span v-if="memberSearch.trim()">
                Tidak ada siswa bentrok jadwal yang sesuai dengan pencarian "{{ memberSearch }}".
              </span>
              <span v-else>
                Tidak ada siswa yang mengalami bentrok jadwal pada tahun ajaran ini.
              </span>
            </template>
            <template v-else>
              <span v-if="memberSearch.trim()">
                Tidak ada siswa yang sesuai dengan pencarian "{{ memberSearch }}".
              </span>
              <span v-else>
                Tidak ada siswa pada tahun ajaran ini.
              </span>
            </template>
          </div>
          <label
            v-for="s in filteredSchoolStudents"
            :key="s.id"
            :aria-disabled="hasStudentScheduleConflict(s.id) && !selectedMemberIds.includes(s.id)"
            :class="[
              'flex items-start sm:items-center justify-between gap-3 px-3.5 py-2.5 text-xs transition-colors',
              hasStudentScheduleConflict(s.id) && !selectedMemberIds.includes(s.id)
                ? 'bg-rose-50/40 dark:bg-rose-950/20 cursor-not-allowed'
                : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer'
            ]"
          >
            <div class="space-y-1 min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-bold text-slate-800 dark:text-zinc-200 truncate">{{ s.full_name }}</p>
                <span
                  v-if="selectedMemberIds.includes(s.id)"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                >
                  Terdaftar
                </span>
                <span
                  v-if="hasStudentScheduleConflict(s.id) && !selectedMemberIds.includes(s.id)"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20 inline-flex items-center gap-1"
                >
                  <AlertTriangle :size="10" /> Bentrok Jadwal
                </span>
              </div>
              <p class="text-[10px] text-slate-400">
                NIS: {{ s.student_number || '-' }}{{ s.class_name ? ` · ${s.class_name}` : '' }}
              </p>
              <div v-if="getStudentEnrollments(s.id).length > 0" class="flex flex-wrap gap-1 pt-0.5">
                <span
                  v-for="en in getStudentEnrollments(s.id)"
                  :key="en.extracurricular_id"
                  :class="[
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border',
                    en.is_conflict
                      ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                      : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                  ]"
                >
                  <span>{{ en.is_conflict ? 'Bentrok:' : 'Ikut:' }} {{ en.extracurricular_name }}</span>
                  <span v-if="en.schedule" class="opacity-75">({{ en.schedule }})</span>
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              :checked="selectedMemberIds.includes(s.id)"
              :disabled="hasStudentScheduleConflict(s.id) && !selectedMemberIds.includes(s.id)"
              @change="toggleMemberSelection(s.id)"
              class="w-4 h-4 mt-0.5 sm:mt-0 rounded text-violet-600 border-slate-300 dark:border-zinc-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            />
          </label>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
          <span class="text-xs font-semibold text-slate-500">{{ selectedMemberIds.length }} siswa dipilih</span>
          <div class="flex gap-2">
            <BaseButton variant="outline" @click="showMembersModal = false">Batal</BaseButton>
            <BaseButton variant="primary" data-testid="btn-save-ekstra-members" @click="handleSaveMembers" :disabled="savingMembers">
              {{ savingMembers ? 'Menyimpan...' : 'Simpan Anggota' }}
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
