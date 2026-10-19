<script setup lang="ts">
import { 
  ClipboardCheck, 
  Users, 
  Check, 
  AlertCircle, 
  Save, 
  CheckCircle2, 
  RefreshCw, 
  ChevronDown, 
  CalendarRange,
  ArrowLeft,
  Database,
  Info,
  CalendarX2
} from 'lucide-vue-next'
import { BaseCard, BaseButton } from '@eduraport/ui'
import { useClass } from '../../composables/useClass'
import { useStudent } from '../../composables/useStudent'
import { useDashboard } from '../../composables/useDashboard'
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

import { useAuth } from '../../composables/useAuth'

import { useApi } from '../../composables/useApi'

const { user } = useAuth()
const { fetcher } = useApi()
const { isSchoolLocked, selectedFoundationId, selectedSchoolId, foundations, schools, initContext, onFoundationChange } = useSchoolContext()
const { classes, fetchClasses } = useClass()
const { students, fetchStudents } = useStudent()
const { fetchDailyAttendances, recordDailyAttendancesBulk } = useDashboard()
const toast = useToast()

// Filters
const selectedClassId = ref('')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const loading = ref(false)
const saving = ref(false)

// Tabs & UF-3 Pending State
const currentViewTab = ref<'regular' | 'pending'>('regular')
const pendingStudents = ref<any[]>([])
const loadingPending = ref(false)
const pendingConfirmMap = ref<Record<string, { status: string; note: string }>>({})
const confirmingPending = ref(false)

// Persistence & DB state
const isRecordedInDb = ref(false)
const savedRecordCount = ref(0)

// Holiday & Operational school day state
interface SchoolDayStatus {
  isSchoolDay: boolean
  status: string
  reason: string
  dayOfWeek?: number
  dayName?: string
  dateStr?: string
}
const schoolDayStatus = ref<SchoolDayStatus | null>(null)
const isHoliday = computed(() => schoolDayStatus.value ? !schoolDayStatus.value.isSchoolDay : false)

const formattedDisplayDate = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value)
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
})

const setToday = () => {
  selectedDate.value = new Date().toISOString().split('T')[0]
}

const adjustDate = (days: number) => {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() + days)
  selectedDate.value = d.toISOString().split('T')[0]
}

// Student attendance input states
interface AttendanceState {
  status: 'hadir' | 'sakit' | 'izin' | 'alpha' | 'terlambat'
  note: string
  isPersisted: boolean
}
const attendanceMap = ref<Record<string, AttendanceState>>({})

// Load initial selections
const route = useRoute()

const syncingClasses = ref(false)
const syncClassesAndData = async (schoolId: string) => {
  if (!schoolId) {
    classes.value = []
    selectedClassId.value = ''
    return
  }
  if (syncingClasses.value) return
  syncingClasses.value = true
  try {
    await fetchClasses(schoolId)
    const queryClassId = route.query.classId ? String(route.query.classId) : null
    if (queryClassId && classes.value.some((c) => c.id === queryClassId)) {
      selectedClassId.value = queryClassId
    } else if (selectedClassId.value && classes.value.some((c) => c.id === selectedClassId.value)) {
      // Keep existing valid class selection
    } else if (classes.value.length > 0) {
      selectedClassId.value = classes.value[0].id
    } else {
      selectedClassId.value = ''
    }
    if (selectedClassId.value) {
      await loadData()
    }
  } finally {
    syncingClasses.value = false
  }
}

onMounted(async () => {
  if (route.query.classId) {
    selectedClassId.value = String(route.query.classId)
  }
  if (route.query.date) {
    selectedDate.value = String(route.query.date)
  }
  const schoolId = await initContext()
  const effectiveSchoolId = schoolId || selectedSchoolId.value
  if (effectiveSchoolId) {
    selectedSchoolId.value = effectiveSchoolId
    if (classes.value.length === 0 || !selectedClassId.value) {
      await syncClassesAndData(effectiveSchoolId)
    }
  }
})

// Store checkin info and recommendations
const studentCheckins = ref<Record<string, { checked_at: string, recommended_status: string, has_checkin: boolean }>>({})

// Load students and attendance records
const loadData = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value) return
  if (loading.value) return
  loading.value = true

  try {
    const schoolId = selectedSchoolId.value
    const classId = selectedClassId.value
    const date = selectedDate.value

    // Fetch students of selected school
    await fetchStudents(schoolId)

    // Fetch existing daily attendance records, checkins, time rules, and approved leave requests
    const existingRes = await fetchDailyAttendances(schoolId, classId, date)
    const attendances = existingRes.data?.attendances || []
    const checkins = existingRes.data?.checkins || []
    const timeRules = existingRes.data?.timeRules || []
    const approvedLeaves = existingRes.data?.approvedLeaves || []
    schoolDayStatus.value = existingRes.data?.schoolDayStatus || null

    isRecordedInDb.value = attendances.length > 0
    savedRecordCount.value = attendances.length

    const existingMap = new Map(attendances.map((a: any) => [a.student_id, a]))
    const checkinMap = new Map(checkins.map((c: any) => [c.student_id, c]))
    const leaveMap = new Map(approvedLeaves.map((l: any) => [l.student_id, l]))

    // Determine applied rule
    let appliedRule = timeRules.find((r: any) => r.scope_type === 'school')
    const classRule = timeRules.find((r: any) => r.class_id === classId)
    if (classRule) appliedRule = classRule

    // Reset maps
    const tempMap: Record<string, AttendanceState> = {}
    const sCheckins: Record<string, any> = {}

    // Filter students belonging to this class
    const classStudents = students.value.filter((s) => s.class_id === classId)

    for (const stud of classStudents) {
      const checkin = checkinMap.get(stud.id)
      const approvedLeave = leaveMap.get(stud.id)
      let recStatus: 'hadir' | 'sakit' | 'izin' | 'alpha' | 'terlambat' = 'hadir'
      let checkinTimeStr = ''
      
      if (approvedLeave) {
        const reasonLower = (approvedLeave.reason || '').toLowerCase()
        if (reasonLower.includes('sakit') || reasonLower.includes('dokter') || reasonLower.includes('rawat') || reasonLower.includes('demam')) {
          recStatus = 'sakit'
        } else {
          recStatus = 'izin'
        }
      } else if (checkin && checkin.checked_at) {
        const d = new Date(checkin.checked_at)
        checkinTimeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace('.', ':')
        
        if (appliedRule) {
           const scanTime = checkinTimeStr
           if (scanTime < appliedRule.check_in_start) {
              recStatus = 'hadir' // awal
           } else {
             const [onH, onM] = appliedRule.on_time_until.split(':').map(Number)
             const tolerance = appliedRule.late_tolerance_min || 0
             // Get exact diff ignoring seconds for robust logic based on HH:MM string
             const checkinH = parseInt(checkinTimeStr.split('.')[0] || checkinTimeStr.split(':')[0])
             const checkinM = parseInt(checkinTimeStr.split('.')[1] || checkinTimeStr.split(':')[1])
             const diffMin = (checkinH * 60 + checkinM) - (onH * 60 + onM)
             
             if (diffMin > tolerance) {
               recStatus = 'terlambat'
             }
           }
        }
      }

      sCheckins[stud.id] = {
        checked_at: checkinTimeStr,
        recommended_status: recStatus,
        has_checkin: !!checkin,
        approved_leave: approvedLeave || null
      }

      const exist = existingMap.get(stud.id)
      if (exist) {
        tempMap[stud.id] = {
          status: exist.status,
          note: exist.note || (approvedLeave ? `Izin resmi: ${approvedLeave.reason}` : ''),
          isPersisted: true
        }
      } else {
        tempMap[stud.id] = {
          status: recStatus, // Default to recommendation (izin/sakit if approved)
          note: approvedLeave ? `Izin resmi: ${approvedLeave.reason}` : '',
          isPersisted: false
        }
      }
    }

    studentCheckins.value = sCheckins
    attendanceMap.value = tempMap
    await loadPendingStudents()
  } catch (err: any) {
    console.error('Failed to load attendance:', err)
    toast.error('Gagal memuat data kehadiran.', 'Error')
  } finally {
    loading.value = false
  }
}

// UF-3: Load students who haven't checked in yet today
const loadPendingStudents = async () => {
  if (!selectedSchoolId.value) return
  loadingPending.value = true
  try {
    const qClass = selectedClassId.value ? `&class_id=${selectedClassId.value}` : ''
    const res: any = await fetcher(`/school/${selectedSchoolId.value}/attendance/pending?date=${selectedDate.value}${qClass}`)
    if (res && res.data) {
      pendingStudents.value = res.data
      for (const s of res.data) {
        if (!pendingConfirmMap.value[s.student_id]) {
          const defaultStatus = s.leave_status === 'approved' ? 'izin' : 'alpha'
          pendingConfirmMap.value[s.student_id] = {
            status: defaultStatus,
            note: s.leave_reason ? `Izin terverifikasi: ${s.leave_reason}` : ''
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to load pending students:', err)
  } finally {
    loadingPending.value = false
  }
}

// UF-3: Confirm pending attendance
const handleConfirmPending = async () => {
  if (!selectedSchoolId.value || pendingStudents.value.length === 0) return
  confirmingPending.value = true
  try {
    const items = pendingStudents.value.map((s) => {
      const conf = pendingConfirmMap.value[s.student_id] || { status: 'alpha', note: '' }
      return {
        student_id: s.student_id,
        date: selectedDate.value,
        status: conf.status,
        note: conf.note || null
      }
    })
    const res: any = await fetcher(`/school/${selectedSchoolId.value}/attendance/confirm`, {
      method: 'POST',
      body: { items }
    })
    if (res && res.success) {
      toast.success('Konfirmasi presensi siswa berhasil disimpan.', 'Sukses')
      await loadPendingStudents()
      await loadData()
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan konfirmasi presensi.', 'Gagal')
  } finally {
    confirmingPending.value = false
  }
}

// WhatsApp link generator for quick follow-up
const getWhatsAppUrl = (phone?: string, studentName?: string, parentName?: string) => {
  if (!phone) return '#'
  let clean = phone.replace(/\D/g, '')
  if (clean.startsWith('0')) clean = '62' + clean.slice(1)
  const text = encodeURIComponent(
    `Assalamualaikum Wr. Wb. Bapak/Ibu ${parentName || 'Wali Murid'}, menginformasikan bahwa ananda ${studentName} tercatat belum melakukan absensi di gerbang sekolah pada hari ini (${selectedDate.value}). Mohon konfirmasi kehadiran/keterangan ananda. Terima kasih.`
  )
  return `https://wa.me/${clean}?text=${text}`
}

// Watch filters
watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await syncClassesAndData(newVal)
  } else {
    classes.value = []
    selectedClassId.value = ''
  }
}, { immediate: true })

watch(selectedFoundationId, (newVal) => onFoundationChange(newVal))

watch([selectedClassId, selectedDate], () => {
  loadData()
})

watch(currentViewTab, async (newTab) => {
  if (newTab === 'pending' && selectedSchoolId.value) {
    await loadPendingStudents()
  }
})

// Filtered list of students to show in grid
const classStudents = computed(() => {
  if (!selectedClassId.value) return []
  return students.value.filter((s) => s.class_id === selectedClassId.value)
})

// Live counter of current attendance statuses
const statusCounts = computed(() => {
  const counts = { hadir: 0, terlambat: 0, sakit: 0, izin: 0, alpha: 0 }
  for (const s of classStudents.value) {
    const st = attendanceMap.value[s.id]?.status
    if (st && counts[st] !== undefined) {
      counts[st]++
    }
  }
  return counts
})

// Bulk actions
const setAllStatus = (status: 'hadir' | 'sakit' | 'izin' | 'alpha' | 'terlambat') => {
  if (isHoliday.value) {
    toast.error('Tidak dapat mengubah status pada hari libur.', 'Hari Libur')
    return
  }
  for (const stud of classStudents.value) {
    if (attendanceMap.value[stud.id]) {
      attendanceMap.value[stud.id].status = status
    }
  }
  toast.success(`Semua siswa diatur ke status ${status.toUpperCase()}.`, 'Sukses')
}

// Save attendance data
const handleSave = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value) return
  if (isHoliday.value) {
    toast.error(`Tidak dapat menyimpan absensi pada hari libur (${schoolDayStatus.value?.reason || 'Libur'}).`, 'Hari Libur')
    return
  }
  saving.value = true

  try {
    const list = classStudents.value.map((s) => {
      const state = attendanceMap.value[s.id] || { status: 'hadir', note: '' }
      return {
        student_id: s.id,
        class_id: selectedClassId.value,
        date: selectedDate.value,
        session: 'harian',
        status: state.status,
        note: state.note || null
      }
    })

    await recordDailyAttendancesBulk(selectedSchoolId.value, list)
    toast.success('Kehadiran harian berhasil disimpan ke database.', 'Sukses')
    await loadData()
  } catch (err: any) {
    console.error('Failed to save attendance:', err)
    toast.error(err.message || 'Gagal menyimpan kehadiran.', 'Gagal')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
    <!-- Breadcrumb / Back Navigation to Analytics Audit -->
    <div class="flex items-center justify-between">
      <NuxtLink
        to="/attendance-analytics"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400 transition-colors py-1 px-2.5 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/60"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Analitik & Audit Presensi</span>
      </NuxtLink>
    </div>

    <!-- Super Admin School Filter -->
    <div v-if="user?.role === 'super_admin'" class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm animate-in fade-in duration-200">
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Yayasan</label>
        <select v-model="selectedFoundationId" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600 text-slate-900 dark:text-zinc-100">
          <option v-for="f in foundations" :key="f.id" :value="f.id" class="bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200">{{ f.name }}</option>
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600 text-slate-900 dark:text-zinc-100">
          <option v-for="s in schools" :key="s.id" :value="s.id" class="bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200">{{ s.name }} ({{ s.level }})</option>
        </select>
      </div>
    </div>

    <!-- Page Header & Filters -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
      <div>
        <h1 class="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-50 flex items-center gap-2.5">
          <ClipboardCheck class="text-violet-600 dark:text-violet-400" :size="24" />
          Absensi Harian Siswa
        </h1>
        <p class="text-xs text-slate-500 dark:text-zinc-400 font-semibold mt-1.5 flex flex-wrap items-center gap-2">
          <span>Periode aktif:</span>
          <span class="px-2 py-0.5 bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 rounded font-black">{{ formattedDisplayDate }}</span>
          
          <!-- Holiday Badge -->
          <span
            v-if="!loading && classStudents.length > 0 && isHoliday"
            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs"
          >
            <CalendarX2 :size="12" />
            <span>Hari Libur ({{ schoolDayStatus?.reason }})</span>
          </span>

          <!-- Database Sync Status Badge (when NOT holiday) -->
          <span
            v-else-if="!loading && classStudents.length > 0"
            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all"
            :class="isRecordedInDb 
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse'"
          >
            <Database v-if="isRecordedInDb" :size="12" />
            <AlertCircle v-else :size="12" />
            <span>{{ isRecordedInDb ? 'Tersimpan di Database' : 'Draf Baru (Belum Disimpan)' }}</span>
          </span>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Class Selector -->
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Kelas:</span>
          <select
            v-model="selectedClassId"
            class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 outline-none cursor-pointer focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all w-[130px] sm:w-[160px] shadow-sm"
          >
            <option v-if="classes.length === 0" value="" disabled>Pilih Kelas</option>
            <option v-for="c in classes" :key="c.id" :value="c.id" class="bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200">{{ c.class_name }}</option>
          </select>
        </div>

        <!-- Date Picker Controls -->
        <div class="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-1 shadow-sm">
          <!-- Prev Day -->
          <button @click="adjustDate(-1)" class="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-600 dark:text-zinc-400 text-xs font-bold" title="Hari Sebelumnya">
            &larr;
          </button>
          
          <!-- Native Date Picker Input -->
          <input
            v-model="selectedDate"
            type="date"
            class="bg-transparent text-xs font-bold text-slate-700 dark:text-zinc-200 outline-none cursor-pointer border-none p-0 w-24 text-center focus:ring-0"
          />

          <!-- Next Day -->
          <button @click="adjustDate(1)" class="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-600 dark:text-zinc-400 text-xs font-bold" title="Hari Berikutnya">
            &rarr;
          </button>
        </div>

        <!-- Today Shortcut -->
        <button
          @click="setToday"
          class="px-3 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm"
        >
          Hari Ini
        </button>

        <button
          @click="loadData"
          :disabled="loading"
          class="p-2 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 disabled:opacity-50"
          title="Segarkan Data"
        >
          <RefreshCw :class="{ 'animate-spin': loading }" :size="14" />
        </button>
      </div>
    </div>

    <!-- View Mode Tabs (Regular Grid vs UF-3 Pending Homeroom Confirmation) -->
    <div class="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3">
      <button 
        @click="currentViewTab = 'regular'" 
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        :class="currentViewTab === 'regular' ? 'bg-violet-600 text-white shadow-sm' : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800'"
      >
        <span>📋 Rekap Presensi Kelas</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-black" :class="currentViewTab === 'regular' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'">
          {{ classStudents.length }}
        </span>
      </button>

      <button 
        @click="currentViewTab = 'pending'" 
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        :class="currentViewTab === 'pending' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800'"
      >
        <span>⚠️ Siswa Belum Hadir / Pagi (UF-3)</span>
        <span v-if="pendingStudents.length > 0" class="px-2 py-0.5 rounded-full text-[10px] font-black" :class="currentViewTab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'">
          {{ pendingStudents.length }}
        </span>
      </button>
    </div>

    <!-- Regular Attendance Mode -->
    <div v-if="currentViewTab === 'regular'" class="space-y-6">
      <!-- Dynamic Persistence / Holiday State Banner -->
      <div v-if="!loading && classStudents.length > 0">
      <!-- State 0: Hari Libur (Presensi Dinonaktifkan) -->
      <div
        v-if="isHoliday"
        class="relative overflow-hidden rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent p-4 dark:border-rose-500/20 shadow-sm"
      >
        <div class="flex items-start gap-3.5">
          <div class="p-2.5 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
            <CalendarX2 :size="22" />
          </div>
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200">
                Hari Ini Libur — Penginputan Presensi Dinonaktifkan
              </h3>
              <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-800 dark:text-rose-300">
                {{ schoolDayStatus?.reason }}
              </span>
            </div>
            <p class="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              Tanggal <strong>{{ formattedDisplayDate }}</strong> berstatus <strong>{{ schoolDayStatus?.reason }}</strong>. Sesuai ketentuan kalender operasional sekolah/pesantren, pengisian presensi siswa dinonaktifkan pada hari libur dan tidak dihitung sebagai tanggal bolong (KBM aktif).
            </p>
          </div>
        </div>
      </div>

      <!-- State 1: Belum Disimpan di DB (Draft / Belum Ada Input) -->
      <div
        v-else-if="!isRecordedInDb"
        class="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 dark:border-amber-500/20 shadow-sm"
      >
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <AlertCircle :size="20" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                Data Presensi Tanggal Ini Belum Tersimpan ke Database
              </h3>
              <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
                Belum Ada Input
              </span>
            </div>
            <p class="text-xs text-slate-600 dark:text-zinc-300 mt-1 leading-relaxed">
              Status kehadiran di bawah merupakan nilai pra-isi bawaan (rekomendasi/default). Tanggal ini masih berstatus <em>Belum Ada Input (Bolong)</em> di dasbor audit sampai Anda menekan tombol <strong>Simpan Absensi Sekarang</strong> pada bagian bawah.
            </p>
          </div>
        </div>
      </div>

      <!-- State 2: Sudah Tersimpan di DB -->
      <div
        v-else
        class="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-3.5 dark:border-emerald-500/20 shadow-sm"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 :size="18" />
            </div>
            <div>
              <h3 class="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <span>Data Presensi Resmi Tersimpan di Database</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                  Tersinkronisasi ({{ savedRecordCount }} siswa)
                </span>
              </h3>
              <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Tanggal ini telah tercatat resmi di sistem. Anda dapat memperbarui status kehadiran siswa kapan saja dan menekan <strong>Perbarui Data Absensi</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Actions & Summary Statistics Panel -->
    <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex items-center gap-2">
          <Users class="text-violet-500" :size="16" />
          <span class="text-xs font-bold text-slate-700 dark:text-zinc-200">
            Total Siswa: {{ classStudents.length }}
          </span>
        </div>

        <!-- Breakdown counters -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Hadir: {{ statusCounts.hadir }}
          </span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Terlambat: {{ statusCounts.terlambat }}
          </span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Sakit: {{ statusCounts.sakit }}
          </span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            Izin: {{ statusCounts.izin }}
          </span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Alpha: {{ statusCounts.alpha }}
          </span>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Set Cepat:</span>
        <button
          @click="setAllStatus('hadir')"
          :disabled="isHoliday"
          class="px-2.5 py-1 rounded text-xs font-bold transition-all"
          :class="isHoliday 
            ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-zinc-800 text-slate-400' 
            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-pointer'"
        >
          Hadir Semua
        </button>
        <button
          @click="setAllStatus('alpha')"
          :disabled="isHoliday"
          class="px-2.5 py-1 rounded text-xs font-bold transition-all"
          :class="isHoliday 
            ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-zinc-800 text-slate-400' 
            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer'"
        >
          Alpha Semua
        </button>
      </div>
    </div>

    <!-- Attendance Grid List -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 space-y-4">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">Memuat data siswa...</p>
    </div>

    <div v-else-if="classStudents.length === 0" class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-16 text-center text-slate-400 italic font-semibold">
      Tidak ada siswa terdaftar di kelas ini.
    </div>

    <div v-else class="space-y-6">
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div class="min-w-full divide-y divide-slate-200 dark:divide-zinc-800">
          <!-- Table Header -->
          <div class="bg-slate-50/80 dark:bg-zinc-950/40 p-4 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            <div class="md:col-span-3">Siswa / No Induk</div>
            <div class="md:col-span-2">Jam Masuk</div>
            <div class="md:col-span-4 flex items-center gap-1.5">
              <span>Status Kehadiran</span>
              <span class="text-[10px] font-semibold opacity-75">
                {{ isHoliday ? '(Hari Libur)' : (isRecordedInDb ? '(Tersimpan)' : '(Draf Masukan)') }}
              </span>
            </div>
            <div class="md:col-span-3">Catatan / Keterangan</div>
          </div>

          <!-- Table Body -->
          <div class="divide-y divide-slate-100 dark:divide-zinc-800">
            <div v-for="s in classStudents" :key="s.id" class="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-sm">
              <div class="md:col-span-3">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="font-bold text-slate-900 dark:text-zinc-100">{{ s.full_name }}</p>
                  <span
                    class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                    :class="isHoliday
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                      : (attendanceMap[s.id]?.isPersisted 
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-500/20')"
                  >
                    {{ isHoliday ? 'Libur' : (attendanceMap[s.id]?.isPersisted ? 'Tersimpan' : 'Draf') }}
                  </span>
                </div>
                <p class="text-[10px] text-slate-400 font-semibold mt-0.5">NIS: {{ s.student_number || '-' }}</p>
                <div v-if="studentCheckins[s.id]?.approved_leave" class="mt-1.5">
                  <span class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 px-2 py-0.5 rounded-md shadow-2xs" :title="studentCheckins[s.id].approved_leave.reason">
                    <CalendarRange :size="11" class="text-amber-600 dark:text-amber-400 shrink-0" />
                    <span class="truncate max-w-[160px]">Izin: {{ studentCheckins[s.id].approved_leave.reason }}</span>
                  </span>
                </div>
              </div>

              <!-- Jam Masuk -->
              <div class="md:col-span-2">
                <div v-if="studentCheckins[s.id]?.has_checkin" class="flex flex-col gap-1">
                  <span class="font-mono font-bold text-slate-700 dark:text-zinc-200">{{ studentCheckins[s.id].checked_at }}</span>
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded w-fit uppercase tracking-wider" 
                        :class="studentCheckins[s.id].recommended_status === 'hadir' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'">
                    Rekomendasi: {{ studentCheckins[s.id].recommended_status }}
                  </span>
                </div>
                <div v-else>
                  <span class="text-[11px] text-slate-400 italic">Belum scan</span>
                </div>
              </div>

              <!-- Options -->
              <div class="md:col-span-4">
                <div v-if="attendanceMap[s.id]" class="flex items-center gap-1.5 flex-wrap">
                  <!-- Warning Indicator -->
                  <div v-if="studentCheckins[s.id]?.has_checkin && attendanceMap[s.id].status !== studentCheckins[s.id].recommended_status"
                       class="text-amber-500 mr-1" title="Status manual tidak sesuai dengan hasil pindai sistem">
                    <AlertCircle :size="16" />
                  </div>

                  <button
                    v-for="st in (['hadir', 'terlambat', 'sakit', 'izin', 'alpha'] as const)"
                    :key="st"
                    :disabled="isHoliday"
                    @click="!isHoliday && (attendanceMap[s.id].status = st)"
                    class="px-2.5 py-1 rounded text-[10px] font-bold capitalize transition-all border inline-flex items-center gap-1"
                    :class="[
                      isHoliday ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                      attendanceMap[s.id].status === st
                        ? {
                            hadir: 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/10',
                            terlambat: 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/10',
                            sakit: 'bg-blue-500 border-blue-500 text-white shadow-sm shadow-blue-500/10',
                            izin: 'bg-indigo-500 border-indigo-500 text-white shadow-sm shadow-indigo-500/10',
                            alpha: 'bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-500/10'
                          }[st]
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                    ]"
                  >
                    <Check v-if="attendanceMap[s.id].status === st" :size="11" />
                    <span>{{ st }}</span>
                  </button>
                </div>
              </div>

              <!-- Note -->
              <div v-if="attendanceMap[s.id]" class="md:col-span-3">
                <input
                  v-model="attendanceMap[s.id].note"
                  type="text"
                  :disabled="isHoliday"
                  :placeholder="isHoliday ? 'Hari libur - pengisian dinonaktifkan' : 'Tambah alasan/keterangan...'"
                  class="w-full border rounded px-2.5 py-1 text-xs outline-none transition-colors"
                  :class="isHoliday 
                    ? 'bg-slate-100 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-800 text-slate-400 cursor-not-allowed opacity-60' 
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus:border-violet-500'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Save Button & Navigation Bar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div class="flex items-center gap-2 text-xs">
          <template v-if="isHoliday">
            <CalendarX2 :size="16" class="text-rose-500 shrink-0" />
            <span class="text-rose-600 dark:text-rose-400 font-medium">
              Tanggal ini adalah hari libur ({{ schoolDayStatus?.reason || schoolDayStatus?.description || 'Libur Resmi' }}). Pengisian presensi dinonaktifkan.
            </span>
          </template>
          <template v-else>
            <Info :size="14" class="text-violet-500 shrink-0" />
            <span v-if="!isRecordedInDb" class="text-slate-500 dark:text-zinc-400">
              Data belum pernah masuk ke database. Klik tombol di samping untuk mencatat secara resmi.
            </span>
            <span v-else class="text-slate-500 dark:text-zinc-400">
              Data tersimpan untuk {{ savedRecordCount }} siswa. Klik tombol di samping untuk menyimpan pembaruan.
            </span>
          </template>
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
          <NuxtLink
            to="/attendance-analytics"
            class="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-center"
          >
            Kembali ke Audit
          </NuxtLink>

          <button
            v-if="isHoliday"
            disabled
            class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 cursor-not-allowed shadow-none"
          >
            <CalendarX2 :size="14" />
            <span>Presensi Ditutup (Libur)</span>
          </button>

          <BaseButton
            v-else
            @click="handleSave"
            :disabled="saving"
            class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-md cursor-pointer"
            :class="!isRecordedInDb
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-violet-600/25 ring-2 ring-violet-500/20'
              : 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/10'"
          >
            <Save v-if="!saving" :size="14" />
            <RefreshCw v-else class="animate-spin" :size="14" />
            <span>{{ saving ? 'Menyimpan...' : (!isRecordedInDb ? 'Simpan Absensi Sekarang' : 'Perbarui Data Absensi') }}</span>
          </BaseButton>
        </div>
      </div>
    </div>
    </div> <!-- Close regular attendance mode -->

    <!-- UF-3: Pending Attendance & Homeroom Confirmation Mode -->
    <div v-else-if="currentViewTab === 'pending'" class="space-y-6">
      <div class="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-black text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <span>⏰</span> Konfirmasi Siswa Belum Masuk Gerbang (Cutoff Pagi)
          </h3>
          <p class="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
            Daftar siswa yang belum mencatatkan kehadiran di gerbang. Hubungi orang tua via WhatsApp untuk konfirmasi keterangan.
          </p>
        </div>

        <button 
          @click="loadPendingStudents" 
          :disabled="loadingPending" 
          class="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw :class="{ 'animate-spin': loadingPending }" :size="12" />
          <span>Segarkan Antrean Pagi</span>
        </button>
      </div>

      <!-- Pending Students List -->
      <div v-if="loadingPending" class="flex flex-col items-center justify-center py-20 space-y-4">
        <div class="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">Memuat daftar siswa belum hadir...</p>
      </div>

      <div v-else-if="pendingStudents.length === 0" class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center shadow-sm">
        <span class="text-4xl block mb-2">🎉</span>
        <h4 class="text-base font-black text-slate-800 dark:text-zinc-100">Semua Siswa Sudah Hadir / Terkonfirmasi!</h4>
        <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1">Tidak ada siswa yang belum absen pada tanggal ini.</p>
      </div>

      <div v-else class="space-y-3">
        <div 
          v-for="s in pendingStudents" 
          :key="s.student_id" 
          class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <!-- Student Info -->
          <div class="flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-sm shrink-0">
              {{ s.student_name ? s.student_name[0] : 'S' }}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="font-black text-sm text-slate-900 dark:text-zinc-100">{{ s.student_name }}</h4>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                  {{ s.class_name || '-' }}
                </span>
                <span v-if="s.leave_status === 'approved'" class="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ✓ Izin Terverifikasi: {{ s.leave_reason || 'Izin Orang Tua' }}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">NIS: {{ s.nis || '-' }}</p>
            </div>
          </div>

          <!-- Parent Contact & WhatsApp Action -->
          <div class="flex items-center gap-3 border-y md:border-y-0 md:border-x border-slate-100 dark:border-zinc-800 py-3 md:py-0 md:px-4">
            <div class="text-xs">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wali Murid</p>
              <p class="font-bold text-slate-700 dark:text-zinc-200">{{ s.parent_name || 'Orang Tua Siswa' }}</p>
              <p class="text-[11px] text-slate-500">{{ s.parent_phone || 'Nomor belum didaftarkan' }}</p>
            </div>

            <a 
              v-if="s.parent_phone" 
              :href="getWhatsAppUrl(s.parent_phone, s.student_name, s.parent_name)" 
              target="_blank" 
              class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0"
              title="Hubungi Orang Tua via WhatsApp"
            >
              <span>💬 WhatsApp</span>
            </a>
          </div>

          <!-- Homeroom Attendance Decision (Sakit/Izin/Alpha) -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div v-if="pendingConfirmMap[s.student_id]" class="flex items-center gap-1.5">
              <button 
                v-for="st in (['sakit', 'izin', 'alpha'] as const)" 
                :key="st"
                @click="pendingConfirmMap[s.student_id].status = st"
                class="px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer"
                :class="pendingConfirmMap[s.student_id].status === st 
                  ? {
                      sakit: 'bg-blue-600 text-white border-blue-600 shadow-sm',
                      izin: 'bg-indigo-600 text-white border-indigo-600 shadow-sm',
                      alpha: 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    }[st]
                  : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50'"
              >
                {{ st }}
              </button>
            </div>

            <!-- Notes -->
            <input 
              v-if="pendingConfirmMap[s.student_id]"
              v-model="pendingConfirmMap[s.student_id].note" 
              type="text" 
              placeholder="Keterangan..." 
              class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full sm:w-44"
            />
          </div>
        </div>

        <!-- Confirm All Button -->
        <div class="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <p class="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Pastikan seluruh status konfirmasi sudah sesuai sebelum menyimpan ke basis data harian.
          </p>

          <BaseButton 
            @click="handleConfirmPending" 
            :disabled="confirmingPending"
            class="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
          >
            <Save v-if="!confirmingPending" :size="14" />
            <RefreshCw v-else class="animate-spin" :size="14" />
            <span>{{ confirmingPending ? 'Menyimpan...' : 'Simpan Konfirmasi Presensi (' + pendingStudents.length + ' Siswa)' }}</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
