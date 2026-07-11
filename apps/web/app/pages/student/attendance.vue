<script setup lang="ts">
import { ClipboardCheck, Users, Check, AlertCircle, Save, CheckCircle2, RefreshCw } from 'lucide-vue-next'
import { BaseCard, BaseButton } from '@eduraport/ui'
import { useSchool } from '../../composables/useSchool'
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

const { user } = useAuth()
const { foundations, schools, fetchFoundations, fetchSchools, currentSchoolId } = useSchool()
const { classes, fetchClasses } = useClass()
const { students, fetchStudents } = useStudent()
const { fetchDailyAttendances, recordDailyAttendancesBulk } = useDashboard()
const toast = useToast()

// Filters
const selectedFoundationId = ref('')
const selectedSchoolId = ref('')
const selectedClassId = ref('')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const loading = ref(false)
const saving = ref(false)

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
}
const attendanceMap = ref<Record<string, AttendanceState>>({})

// Load initial selections
onMounted(async () => {
  if (user.value?.role === 'super_admin') {
    await fetchFoundations()
    if (foundations.value.length > 0) {
      selectedFoundationId.value = foundations.value[0].id
      await fetchSchools(selectedFoundationId.value)
      if (schools.value.length > 0) {
        selectedSchoolId.value = schools.value[0].id
      }
    }
  } else {
    selectedSchoolId.value = currentSchoolId.value || ''
  }
})

// Load students and attendance records
const loadData = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value) return
  loading.value = true

  try {
    const schoolId = selectedSchoolId.value
    const classId = selectedClassId.value
    const date = selectedDate.value

    // Fetch students of selected school
    await fetchStudents(schoolId)

    // Fetch existing daily attendance records for selected class and date
    const existingRes = await fetchDailyAttendances(schoolId, classId, date)
    const existingList = existingRes.data || []
    const existingMap = new Map(existingList.map((a: any) => [a.student_id, a]))

    // Reset maps
    const tempMap: Record<string, AttendanceState> = {}

    // Filter students belonging to this class
    const classStudents = students.value.filter((s) => s.class_id === classId)

    for (const stud of classStudents) {
      const exist = existingMap.get(stud.id)
      if (exist) {
        tempMap[stud.id] = {
          status: exist.status,
          note: exist.note || ''
        }
      } else {
        tempMap[stud.id] = {
          status: 'hadir',
          note: ''
        }
      }
    }

    attendanceMap.value = tempMap
  } catch (err: any) {
    console.error('Failed to load attendance:', err)
    toast.error('Gagal memuat data kehadiran.', 'Error')
  } finally {
    loading.value = false
  }
}

// Watch filters
watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await fetchClasses(newVal)
    if (classes.value.length > 0) {
      selectedClassId.value = classes.value[0].id
    } else {
      selectedClassId.value = ''
    }
    loadData()
  } else {
    classes.value = []
    selectedClassId.value = ''
  }
})

watch(selectedFoundationId, async (newVal) => {
  if (newVal && user.value?.role === 'super_admin') {
    await fetchSchools(newVal)
    if (schools.value.length > 0) {
      selectedSchoolId.value = schools.value[0].id
    } else {
      selectedSchoolId.value = ''
    }
  }
})

watch([selectedClassId, selectedDate], () => {
  loadData()
})

// Filtered list of students to show in grid
const classStudents = computed(() => {
  if (!selectedClassId.value) return []
  return students.value.filter((s) => s.class_id === selectedClassId.value)
})

// Bulk actions
const setAllStatus = (status: 'hadir' | 'sakit' | 'izin' | 'alpha' | 'terlambat') => {
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
    toast.success('Kehadiran harian berhasil disimpan.', 'Sukses')
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
    <!-- Super Admin School Filter -->
    <div v-if="user?.role === 'super_admin'" class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm animate-in fade-in duration-200">
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Yayasan</label>
        <select v-model="selectedFoundationId" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600">
          <option v-for="f in foundations" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600">
          <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }} ({{ s.level }})</option>
        </select>
      </div>
    </div>

    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
      <div>
        <h1 class="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-50 flex items-center gap-2.5">
          <ClipboardCheck class="text-violet-600 dark:text-violet-400" :size="24" />
          Absensi Harian Siswa
        </h1>
        <p class="text-xs text-slate-500 dark:text-zinc-400 font-semibold mt-1.5 flex flex-wrap items-center gap-2">
          <span>Pilih kelas dan tanggal. Periode aktif:</span>
          <span class="px-2 py-0.5 bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 rounded font-black">{{ formattedDisplayDate }}</span>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Class Selector -->
        <div class="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 shadow-sm">
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kelas:</span>
          <select
            v-model="selectedClassId"
            class="bg-transparent text-xs font-bold text-slate-700 dark:text-zinc-200 outline-none cursor-pointer focus:ring-0"
          >
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.class_name }}</option>
          </select>
        </div>

        <!-- Date Picker Controls -->
        <div class="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-1 shadow-sm">
          <!-- Prev Day -->
          <button @click="adjustDate(-1)" class="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-600 dark:text-zinc-400 text-xs font-bold">
            &larr;
          </button>
          
          <!-- Native Date Picker Input -->
          <input
            v-model="selectedDate"
            type="date"
            class="bg-transparent text-xs font-bold text-slate-700 dark:text-zinc-200 outline-none cursor-pointer border-none p-0 w-24 text-center focus:ring-0"
          />

          <!-- Next Day -->
          <button @click="adjustDate(1)" class="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-600 dark:text-zinc-400 text-xs font-bold">
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
        >
          <RefreshCw :class="{ 'animate-spin': loading }" :size="14" />
        </button>
      </div>
    </div>

    <!-- Bulk Actions Panel -->
    <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <Users class="text-violet-500" :size="16" />
        <span class="text-xs font-bold text-slate-700 dark:text-zinc-200">
          Jumlah Siswa: {{ classStudents.length }}
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2">Set Massal:</span>
        <button @click="setAllStatus('hadir')" class="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded text-xs font-bold transition-all">
          Hadir Semua
        </button>
        <button @click="setAllStatus('alpha')" class="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded text-xs font-bold transition-all">
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
          <div class="bg-slate-50/80 dark:bg-zinc-950/40 p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            <div class="md:col-span-2">Siswa / No Induk</div>
            <div>Status Kehadiran</div>
            <div>Catatan / Keterangan</div>
          </div>

          <!-- Table Body -->
          <div class="divide-y divide-slate-100 dark:divide-zinc-800">
            <div v-for="s in classStudents" :key="s.id" class="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center text-sm">
              <div class="md:col-span-2">
                <p class="font-bold text-slate-900 dark:text-zinc-100">{{ s.full_name }}</p>
                <p class="text-[10px] text-slate-400 font-semibold mt-0.5">NIS: {{ s.student_number || '-' }}</p>
              </div>

              <!-- Options -->
              <div>
                <div v-if="attendanceMap[s.id]" class="flex items-center gap-1.5 flex-wrap">
                  <button
                    v-for="st in (['hadir', 'terlambat', 'sakit', 'izin', 'alpha'] as const)"
                    :key="st"
                    @click="attendanceMap[s.id].status = st"
                    class="px-2.5 py-1 rounded text-[10px] font-bold capitalize transition-all border"
                    :class="[
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
                    {{ st }}
                  </button>
                </div>
              </div>

              <!-- Note -->
              <div v-if="attendanceMap[s.id]">
                <input
                  v-model="attendanceMap[s.id].note"
                  type="text"
                  placeholder="Tambah alasan/keterangan..."
                  class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1 text-xs outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Save Button -->
      <div class="flex justify-end gap-3">
        <BaseButton
          @click="handleSave"
          :disabled="saving"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-lg shadow-sm text-xs font-bold transition-all shadow-lg shadow-violet-600/10"
        >
          <Save v-if="!saving" :size="14" />
          <RefreshCw v-else class="animate-spin" :size="14" />
          <span>{{ saving ? 'Menyimpan...' : 'Simpan Absensi' }}</span>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
