<script setup lang="ts">
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  BookOpen, 
  User, 
  MapPin, 
  List, 
  LayoutGrid, 
  AlertTriangle, 
  CheckCircle2, 
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Info,
  CalendarRange
} from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useSchool } from '../composables/useSchool'
import { useClass } from '../composables/useClass'
import { useSubject } from '../composables/useSubject'
import { useTeacher } from '../composables/useTeacher'
import { useSchedule } from '../composables/useSchedule'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_cookie') // EduRaport uses auth_cookie or auth_token
      if (!token.value) {
        const altToken = useCookie('auth_token')
        if (!altToken.value) {
          return navigateTo('/login')
        }
      }
    }
  ]
})

const { foundations, schools, fetchFoundations, fetchSchools } = useSchool()
const { classes, fetchClasses } = useClass()
const { subjects, fetchSubjects } = useSubject()
const { teachers, fetchTeachers } = useTeacher()
const { schedules, fetchSchedules, createSchedule, updateSchedule, deleteSchedule } = useSchedule()

const selectedFoundationId = ref('')
const selectedSchoolId = ref('')
const selectedClassId = ref('')
const selectedTeacherId = ref('')

// View Modes: day (1 day), work-week (Mon-Fri), week (Mon-Sat), list (table list)
const viewMode = ref<'day' | 'work-week' | 'week' | 'list'>('week')
const currentDayView = ref('Senin')

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsModal = ref(false)
const selectedEvent = ref<any>(null)

const errorMessage = ref('')
const successMessage = ref('')

const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const rowHeight = ref(96) // Height of one hour in pixels

// Forms
const scheduleForm = reactive({
  class_id: '',
  subject_id: '',
  teacher_id: '',
  day_of_week: 'Senin',
  start_time: '07:00',
  end_time: '08:30',
  room: ''
})

const editingScheduleId = ref('')
const editForm = reactive({
  class_id: '',
  subject_id: '',
  teacher_id: '',
  day_of_week: 'Senin',
  start_time: '',
  end_time: '',
  room: ''
})

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
  await fetchFoundations()
  if (foundations.value.length > 0) {
    selectedFoundationId.value = foundations.value[0].id
    await fetchSchools(selectedFoundationId.value)
    if (schools.value.length > 0) {
      selectedSchoolId.value = schools.value[0].id
      await loadSchoolData(selectedSchoolId.value)
    }
  }
  goToToday()
  updateCurrentTimeIndicator()
  timeInterval = setInterval(updateCurrentTimeIndicator, 60000)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})

// Watchers
watch(selectedFoundationId, async (newVal) => {
  if (newVal) {
    await fetchSchools(newVal)
    if (schools.value.length > 0) {
      selectedSchoolId.value = schools.value[0].id
    } else {
      selectedSchoolId.value = ''
      clearData()
    }
  }
})

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await loadSchoolData(newVal)
  } else {
    clearData()
  }
})

watch(selectedClassId, async (newVal) => {
  if (selectedSchoolId.value) {
    await fetchSchedules(selectedSchoolId.value, newVal || undefined)
  }
})

const loadSchoolData = async (schoolId: string) => {
  await Promise.all([
    fetchClasses(schoolId),
    fetchSubjects(schoolId),
    fetchTeachers(schoolId),
    fetchSchedules(schoolId, selectedClassId.value || undefined)
  ])
}

const clearData = () => {
  classes.value = []
  subjects.value = []
  teachers.value = []
  schedules.value = []
  selectedClassId.value = ''
  selectedTeacherId.value = ''
}

// Time Helper Utilities
const formatTimeDisplay = (timeStr: string) => {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
  }
  return timeStr
}

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0
  const formatted = formatTimeDisplay(timeStr)
  const [h, m] = formatted.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

const getTodayDayName = () => {
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const todayIdx = new Date().getDay()
  return dayNames[todayIdx]
}

const isToday = (dayName: string) => {
  return getTodayDayName() === dayName
}

// Navigation for Day View
const prevDay = () => {
  const idx = daysOfWeek.indexOf(currentDayView.value)
  if (idx > 0) {
    currentDayView.value = daysOfWeek[idx - 1]
  } else {
    currentDayView.value = daysOfWeek[daysOfWeek.length - 1]
  }
}

const nextDay = () => {
  const idx = daysOfWeek.indexOf(currentDayView.value)
  if (idx < daysOfWeek.length - 1) {
    currentDayView.value = daysOfWeek[idx + 1]
  } else {
    currentDayView.value = daysOfWeek[0]
  }
}

const goToToday = () => {
  const todayName = getTodayDayName()
  if (daysOfWeek.includes(todayName) && todayName !== 'Minggu') {
    currentDayView.value = todayName
  } else {
    currentDayView.value = 'Senin'
  }
}

// Subject Theme Maps (Teams style pastel)
const subjectColorThemes: Record<string, { bg: string, text: string, border: string, solid: string }> = {
  MTK: {
    bg: 'bg-blue-50/95 dark:bg-blue-950/45',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200/60 dark:border-blue-900/30',
    solid: 'bg-blue-600 dark:bg-blue-500'
  },
  AGAMA: {
    bg: 'bg-teal-50/95 dark:bg-teal-950/45',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200/60 dark:border-teal-900/30',
    solid: 'bg-teal-600 dark:bg-teal-500'
  },
  BIND: {
    bg: 'bg-emerald-50/95 dark:bg-emerald-950/45',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200/60 dark:border-emerald-900/30',
    solid: 'bg-emerald-600 dark:bg-emerald-500'
  },
  PPKN: {
    bg: 'bg-red-50/95 dark:bg-red-950/45',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200/60 dark:border-red-900/30',
    solid: 'bg-red-600 dark:bg-red-500'
  },
  IPAS: {
    bg: 'bg-purple-50/95 dark:bg-purple-950/45',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200/60 dark:border-purple-900/30',
    solid: 'bg-purple-600 dark:bg-purple-500'
  },
  SENI: {
    bg: 'bg-pink-50/95 dark:bg-pink-950/45',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-200/60 dark:border-pink-900/30',
    solid: 'bg-pink-600 dark:bg-pink-500'
  },
  PJOK: {
    bg: 'bg-green-50/95 dark:bg-green-950/45',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200/60 dark:border-green-900/30',
    solid: 'bg-green-600 dark:bg-green-500'
  },
  BING: {
    bg: 'bg-amber-50/95 dark:bg-amber-950/45',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200/60 dark:border-amber-900/30',
    solid: 'bg-amber-600 dark:bg-amber-500'
  },
  LITERASI: {
    bg: 'bg-indigo-50/95 dark:bg-indigo-950/45',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200/60 dark:border-indigo-900/30',
    solid: 'bg-indigo-600 dark:bg-indigo-500'
  },
  JATIDIRI: {
    bg: 'bg-sky-50/95 dark:bg-sky-950/45',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200/60 dark:border-sky-900/30',
    solid: 'bg-sky-600 dark:bg-sky-500'
  }
}

const getSubjectTheme = (code: string) => {
  const cleaned = (code || '').toUpperCase().trim()
  if (subjectColorThemes[cleaned]) return subjectColorThemes[cleaned]
  
  // Fallback Deterministic Hash
  const themes = [
    { bg: 'bg-slate-50/95 dark:bg-zinc-800/50', text: 'text-slate-700 dark:text-zinc-300', border: 'border-slate-200/60 dark:border-zinc-700/30', solid: 'bg-slate-600 dark:bg-zinc-550' },
    { bg: 'bg-orange-50/95 dark:bg-orange-950/45', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200/60 dark:border-orange-900/30', solid: 'bg-orange-600 dark:bg-orange-500' },
    { bg: 'bg-rose-50/95 dark:bg-rose-950/45', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200/60 dark:border-rose-900/30', solid: 'bg-rose-600 dark:bg-rose-500' },
    { bg: 'bg-cyan-50/95 dark:bg-cyan-950/45', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200/60 dark:border-cyan-900/30', solid: 'bg-cyan-600 dark:bg-cyan-500' },
    { bg: 'bg-fuchsia-50/95 dark:bg-fuchsia-950/45', text: 'text-fuchsia-700 dark:text-fuchsia-300', border: 'border-fuchsia-200/60 dark:border-fuchsia-900/30', solid: 'bg-fuchsia-600 dark:bg-fuchsia-500' }
  ]
  let hash = 0
  for (let i = 0; i < cleaned.length; i++) {
    hash = cleaned.charCodeAt(i) + ((hash << 5) - hash)
  }
  const idx = Math.abs(hash) % themes.length
  return themes[idx]
}

// Active days list based on selector mode
const activeDays = computed(() => {
  if (viewMode.value === 'day') {
    return [currentDayView.value]
  } else if (viewMode.value === 'work-week') {
    return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
  } else {
    // default week is Monday to Saturday
    return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  }
})

// Dynamic Hours Calculator (min and max hour based on loaded schedules)
const gridStartHour = computed(() => {
  if (schedules.value.length === 0) return 7
  let min = 7
  schedules.value.forEach(item => {
    if (item.start_time) {
      const h = parseInt(item.start_time.split(':')[0])
      if (h < min) min = h
    }
  })
  return Math.max(0, min - 1)
})

const gridEndHour = computed(() => {
  if (schedules.value.length === 0) return 16
  let max = 16
  schedules.value.forEach(item => {
    if (item.end_time) {
      const h = Math.ceil(timeToMinutes(item.end_time) / 60)
      if (h > max) max = h
    }
  })
  return Math.min(24, max + 1)
})

const totalMinutes = computed(() => {
  return (gridEndHour.value - gridStartHour.value) * 60
})

const hourList = computed(() => {
  const hours: number[] = []
  for (let h = gridStartHour.value; h < gridEndHour.value; h++) {
    hours.push(h)
  }
  return hours
})

// Conflicts calculation: overlaps of same class or same teacher on the same day
const scheduleConflicts = computed(() => {
  const conflicts: Record<string, string[]> = {}
  
  daysOfWeek.forEach(day => {
    const dayItems = schedules.value.filter(s => s.day_of_week === day)
    
    for (let i = 0; i < dayItems.length; i++) {
      const a = dayItems[i]
      const startA = timeToMinutes(a.start_time)
      const endA = timeToMinutes(a.end_time)
      
      for (let j = i + 1; j < dayItems.length; j++) {
        const b = dayItems[j]
        const startB = timeToMinutes(b.start_time)
        const endB = timeToMinutes(b.end_time)
        
        // check overlap
        if (startA < endB && startB < endA) {
          // 1. Same Teacher
          if (a.teacher_id === b.teacher_id) {
            if (!conflicts[a.id]) conflicts[a.id] = []
            if (!conflicts[b.id]) conflicts[b.id] = []
            
            const msgA = `Bentrok Guru: Guru ${a.teacher_name} dijadwalkan di kelas ${b.class_name} (${b.subject_name}) pada jam yang sama`
            const msgB = `Bentrok Guru: Guru ${b.teacher_name} dijadwalkan di kelas ${a.class_name} (${a.subject_name}) pada jam yang sama`
            
            if (!conflicts[a.id].includes(msgA)) conflicts[a.id].push(msgA)
            if (!conflicts[b.id].includes(msgB)) conflicts[b.id].push(msgB)
          }
          
          // 2. Same Class
          if (a.class_id === b.class_id) {
            if (!conflicts[a.id]) conflicts[a.id] = []
            if (!conflicts[b.id]) conflicts[b.id] = []
            
            const msgA = `Bentrok Kelas: Kelas ${a.class_name} memiliki pelajaran ${b.subject_name} pada jam yang sama`
            const msgB = `Bentrok Kelas: Kelas ${b.class_name} memiliki pelajaran ${a.subject_name} pada jam yang sama`
            
            if (!conflicts[a.id].includes(msgA)) conflicts[a.id].push(msgA)
            if (!conflicts[b.id].includes(msgB)) conflicts[b.id].push(msgB)
          }
        }
      }
    }
  })
  
  return conflicts
})

const selectedTeacherName = computed(() => {
  const teacher = teachers.value.find(t => t.id === selectedTeacherId.value)
  return teacher ? teacher.full_name : ''
})

const filteredSchedules = computed(() => {
  let list = schedules.value
  
  if (selectedClassId.value) {
    list = list.filter(item => item.class_id === selectedClassId.value)
  }
  
  if (selectedTeacherId.value) {
    const tName = selectedTeacherName.value
    list = list.filter(item => {
      // Matches as Guru Pengampu
      if (item.teacher_id === selectedTeacherId.value) return true
      
      // Matches as Extracurricular Penanggung Jawab
      if (item.extracurricular_instructor && tName && item.extracurricular_instructor === tName) return true
      
      return false
    })
  }
  
  return list
})

// Overlapping schedules alignment: assigns columns index and cluster widths
const processedSchedulesByDay = computed(() => {
  const result: Record<string, any[]> = {}
  
  daysOfWeek.forEach(day => {
    const daySchedules = filteredSchedules.value.filter(s => s.day_of_week === day)
    
    // Parse into model with layout props
    const events = daySchedules.map(item => ({
      ...item,
      startMin: timeToMinutes(item.start_time),
      endMin: timeToMinutes(item.end_time),
      left: 0,
      width: 100,
      columnIdx: 0
    }))
    
    // Sort by startMin, then endMin
    events.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)
    
    // Build overlap clusters
    const clusters: any[][] = []
    events.forEach(event => {
      let added = false
      for (const cluster of clusters) {
        const overlaps = cluster.some(e => event.startMin < e.endMin && e.startMin < event.endMin)
        if (overlaps) {
          cluster.push(event)
          added = true
          break
        }
      }
      if (!added) {
        clusters.push([event])
      }
    })
    
    // Position events in columns inside their cluster
    clusters.forEach(cluster => {
      const columns: any[][] = []
      cluster.forEach(event => {
        let placed = false
        for (let colIdx = 0; colIdx < columns.length; colIdx++) {
          const colOverlaps = columns[colIdx].some(e => event.startMin < e.endMin && e.startMin < event.endMin)
          if (!colOverlaps) {
            columns[colIdx].push(event)
            event.columnIdx = colIdx
            placed = true
            break
          }
        }
        if (!placed) {
          columns.push([event])
          event.columnIdx = columns.length - 1
        }
      })
      
      const totalCols = columns.length
      cluster.forEach(event => {
        event.left = (event.columnIdx / totalCols) * 100
        event.width = (1 / totalCols) * 100
      })
    })
    
    result[day] = events
  })
  
  return result
})

// Current time line updates
const currentTimeTop = ref<string | null>(null)
const currentTimeDay = ref<string | null>(null)
let timeInterval: any = null

const updateCurrentTimeIndicator = () => {
  const now = new Date()
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const todayDay = dayNames[now.getDay()]
  
  currentTimeDay.value = todayDay
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const gridStartMin = gridStartHour.value * 60
  const gridEndMin = gridEndHour.value * 60
  
  if (currentMinutes >= gridStartMin && currentMinutes <= gridEndMin) {
    const topPercentage = ((currentMinutes - gridStartMin) / totalMinutes.value) * 100
    currentTimeTop.value = `${topPercentage}%`
  } else {
    currentTimeTop.value = null
  }
}

// Styling Event Styles calculator
const getEventStyles = (event: any) => {
  const gridStartMin = gridStartHour.value * 60
  const top = ((event.startMin - gridStartMin) / totalMinutes.value) * 100
  const height = ((event.endMin - event.startMin) / totalMinutes.value) * 100
  
  return {
    top: `${top}%`,
    height: `${height}%`,
    left: `${event.left}%`,
    width: `calc(${event.width}% - 3px)`
  }
}

// Methods
const openCreateModal = () => {
  errorMessage.value = ''
  successMessage.value = ''
  Object.assign(scheduleForm, {
    class_id: selectedClassId.value || (classes.value[0]?.id || ''),
    subject_id: subjects.value[0]?.id || '',
    teacher_id: teachers.value[0]?.id || '',
    day_of_week: viewMode.value === 'day' ? currentDayView.value : 'Senin',
    start_time: '07:00',
    end_time: '08:30',
    room: ''
  })
  showCreateModal.value = true
}

const handleCreateSchedule = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const res = await createSchedule(selectedSchoolId.value, { ...scheduleForm })
    if (res.success) {
      showCreateModal.value = false
      showToast('success', 'Jadwal berhasil ditambahkan!')
      await fetchSchedules(selectedSchoolId.value, selectedClassId.value || undefined)
    } else {
      errorMessage.value = res.message || 'Gagal menambahkan jadwal'
    }
  } catch (e: any) {
    errorMessage.value = e.data?.message || e.message || 'Gagal menambahkan jadwal'
  }
}

const openDetailsModal = (event: any) => {
  selectedEvent.value = event
  showDetailsModal.value = true
}

const triggerDeleteFromDetails = async () => {
  if (selectedEvent.value) {
    const id = selectedEvent.value.id
    showDetailsModal.value = false
    await handleDeleteSchedule(id)
  }
}

const triggerEditFromDetails = () => {
  if (selectedEvent.value) {
    const event = selectedEvent.value
    showDetailsModal.value = false
    openEditModal(event)
  }
}

const openEditModal = (item: any) => {
  errorMessage.value = ''
  successMessage.value = ''
  editingScheduleId.value = item.id
  Object.assign(editForm, {
    class_id: item.class_id,
    subject_id: item.subject_id,
    teacher_id: item.teacher_id,
    day_of_week: item.day_of_week,
    start_time: formatTimeDisplay(item.start_time),
    end_time: formatTimeDisplay(item.end_time),
    room: item.room || ''
  })
  showEditModal.value = true
}

const handleUpdateSchedule = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const res = await updateSchedule(selectedSchoolId.value, editingScheduleId.value, { ...editForm })
    if (res.success) {
      showEditModal.value = false
      showToast('success', 'Jadwal berhasil diperbarui!')
      await fetchSchedules(selectedSchoolId.value, selectedClassId.value || undefined)
    } else {
      errorMessage.value = res.message || 'Gagal memperbarui jadwal'
    }
  } catch (e: any) {
    errorMessage.value = e.data?.message || e.message || 'Gagal memperbarui jadwal'
  }
}

const handleDeleteSchedule = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus jadwal pelajaran ini?')) {
    try {
      const res = await deleteSchedule(selectedSchoolId.value, id, selectedClassId.value || undefined)
      if (res.success) {
        showToast('success', 'Jadwal berhasil dihapus!')
      } else {
        alert(res.message || 'Gagal menghapus jadwal')
      }
    } catch (e: any) {
      alert(e.message || 'Gagal menghapus jadwal')
    }
  }
}
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">
    
    <!-- Top Action bar with Title & Navigation Controls -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
          <CalendarRange class="text-violet-600 dark:text-violet-400" :size="26" />
          Jadwal Pelajaran
        </h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Atur jadwal pelajaran mingguan per kelas, pastikan alokasi jam mengajar guru bebas bentrok.</p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <!-- Day Navigation controls (visible only in Day view mode) -->
        <div v-if="viewMode === 'day'" class="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-zinc-700">
          <button @click="prevDay" class="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors" title="Hari Sebelumnya">
            <ChevronLeft :size="15" />
          </button>
          <span class="text-xs font-bold px-2.5 min-w-[70px] text-center text-slate-800 dark:text-zinc-200">
            {{ currentDayView }}
          </span>
          <button @click="nextDay" class="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors" title="Hari Berikutnya">
            <ChevronRight :size="15" />
          </button>
        </div>

        <button 
          v-if="viewMode === 'day'"
          @click="goToToday" 
          class="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-650 dark:text-zinc-200 transition-colors"
        >
          Hari Ini
        </button>

        <!-- Segmented View Mode Switcher -->
        <div class="flex items-center bg-slate-100/90 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-700 shadow-inner">
          <button 
            v-for="mode in [
              { id: 'day', label: 'Hari' },
              { id: 'work-week', label: '5 Hari' },
              { id: 'week', label: '6 Hari' },
              { id: 'list', label: 'Agenda' }
            ]"
            :key="mode.id"
            @click="viewMode = mode.id as any"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 tracking-wide',
              viewMode === mode.id 
                ? 'bg-white dark:bg-zinc-700 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200/40 dark:border-zinc-650' 
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            ]"
          >
            {{ mode.label }}
          </button>
        </div>

        <!-- Add Schedule Button -->
        <BaseButton variant="primary" @click="openCreateModal" :disabled="!selectedSchoolId" class="py-2 px-4 text-xs font-bold shadow-lg shadow-violet-600/10 transition-transform active:scale-[0.98]">
          <Plus class="mr-1.5" :size="15" /> Tambah Jadwal
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

    <!-- Filters & Selection with Glassmorphism styling -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/70 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm">
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Yayasan</label>
        <select v-model="selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 dark:focus:ring-violet-500/5">
          <option value="" disabled>Pilih Yayasan</option>
          <option v-for="found in foundations" :key="found.id" :value="found.id">{{ found.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" :disabled="!selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 dark:focus:ring-violet-500/5">
          <option value="" disabled>Pilih Unit Sekolah</option>
          <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Filter Kelas</label>
        <select v-model="selectedClassId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 dark:focus:ring-violet-500/5">
          <option value="">Semua Kelas</option>
          <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.class_name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Filter Guru</label>
        <select v-model="selectedTeacherId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 dark:focus:ring-violet-500/5">
          <option value="">Semua Guru</option>
          <option v-for="tch in teachers" :key="tch.id" :value="tch.id">{{ tch.full_name }}</option>
        </select>
      </div>
    </div>

    <!-- Conflict Alert Banner (Global) -->
    <div 
      v-if="Object.keys(scheduleConflicts).length > 0 && selectedSchoolId && viewMode !== 'list'" 
      class="bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl p-4 flex items-start gap-3 text-xs shadow-sm animate-in slide-in-from-top duration-300"
    >
      <AlertTriangle :size="18" class="flex-shrink-0 mt-0.5 animate-bounce" />
      <div>
        <p class="font-bold text-sm">Terdeteksi {{ Object.keys(scheduleConflicts).length }} Konflik Jadwal (Double Booking)!</p>
        <p class="mt-1 font-medium text-slate-650 dark:text-zinc-350">Silakan klik atau arahkan kursor ke kartu jadwal dengan border oranye untuk melihat detail dan memperbaiki bentrokan mengajar guru atau penggunaan kelas.</p>
      </div>
    </div>

    <!-- 1. TIME GRID VIEW (Microsoft Teams Calendar style) -->
    <div 
      v-if="viewMode !== 'list'"
      class="border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden flex flex-col"
    >
      <!-- Horizontal Scroll Wrapper for Mobile -->
      <div class="overflow-x-auto scrollbar-hide">
        <!-- Minimum calendar grid width to ensure clean layout on small screens -->
        <div :class="[viewMode === 'day' ? 'w-full' : 'min-w-[850px] lg:w-full']" class="relative flex flex-col">
          
          <!-- Sticky Day Column Headers -->
          <div class="flex border-b border-slate-200 dark:border-zinc-850 bg-slate-50/70 dark:bg-zinc-900/90 sticky top-0 z-30 backdrop-blur-md">
            <!-- Top-left time spacer (sticky left-0 to align with axis) -->
            <div class="w-16 sm:w-20 flex-shrink-0 border-r border-slate-200 dark:border-zinc-850 sticky left-0 z-40 bg-slate-50 dark:bg-zinc-900"></div>
            
            <!-- Day Column Labels -->
            <div 
              v-for="day in activeDays" 
              :key="day"
              class="flex-1 py-3 text-center border-r border-slate-200/50 dark:border-zinc-800/60 last:border-r-0 flex flex-col items-center justify-center min-w-0 transition-colors"
              :class="[
                isToday(day) ? 'bg-violet-600/5 dark:bg-violet-500/5' : ''
              ]"
            >
              <span 
                class="text-xs font-bold transition-colors"
                :class="[
                  isToday(day) ? 'text-violet-600 dark:text-violet-400 font-extrabold' : 'text-slate-700 dark:text-zinc-300'
                ]"
              >
                {{ day }}
              </span>
              <span 
                v-if="isToday(day)" 
                class="mt-1 inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-extrabold tracking-widest uppercase bg-violet-600 text-white dark:bg-violet-500/20 dark:text-violet-400"
              >
                Hari Ini
              </span>
            </div>
          </div>

          <!-- Time Grid scroll area -->
          <div 
            class="relative overflow-y-auto max-h-[60vh] select-none" 
          >
            <!-- Content height wrapper to stretch columns fully -->
            <div class="relative flex" :style="{ height: (hourList.length * rowHeight) + 'px' }">
              
              <!-- Y-Axis (Sticky Time labels on the left) -->
              <div 
                class="w-16 sm:w-20 flex-shrink-0 relative pointer-events-none select-none text-right pr-2.5 sm:pr-3.5 text-[9px] font-bold text-slate-400 dark:text-zinc-555 border-r border-slate-200 dark:border-zinc-850 sticky left-0 z-20 bg-white dark:bg-zinc-900/90 backdrop-blur-sm"
              >
                <div 
                  v-for="(hour, idx) in [...hourList, gridEndHour]" 
                  :key="hour"
                  class="absolute right-2.5 sm:right-3.5 transform -translate-y-1/2"
                  :style="{ top: (idx * rowHeight) + 'px' }"
                >
                  {{ String(hour).padStart(2, '0') }}:00
                </div>
              </div>

              <!-- Content Panel Area containing cells and overlays -->
              <div class="flex-1 relative flex">
                
                <!-- Horizontal hour lines grid overlay -->
                <div class="absolute inset-0 pointer-events-none">
                  <div 
                    v-for="(hour, idx) in hourList" 
                    :key="hour"
                    class="absolute left-0 right-0 border-t border-slate-100 dark:border-zinc-800/80"
                    :style="{ top: (idx * rowHeight) + 'px', height: rowHeight + 'px' }"
                  >
                    <!-- 30 minute dashed sub-divider -->
                    <div 
                      class="w-full border-t border-dashed border-slate-100/50 dark:border-zinc-800/30" 
                      :style="{ marginTop: (rowHeight / 2) + 'px' }"
                    ></div>
                  </div>
                </div>

                <!-- Day columns for placement -->
                <div 
                  v-for="day in activeDays" 
                  :key="day"
                  class="flex-1 relative border-r border-slate-200/50 dark:border-zinc-800/60 last:border-r-0 transition-colors"
                  :class="[
                    isToday(day) ? 'bg-violet-600/[0.01] dark:bg-violet-500/[0.01]' : ''
                  ]"
                >
                  <!-- Highlight border strip for active today column -->
                  <div v-if="isToday(day)" class="absolute inset-x-0 top-0 h-0.5 bg-violet-600 dark:bg-violet-500 z-10 opacity-70"></div>
                  
                  <!-- Current Time Indicator Pointer -->
                  <div 
                    v-if="isToday(day) && currentTimeTop"
                    class="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                    :style="{ top: currentTimeTop }"
                  >
                    <div class="w-2.5 h-2.5 rounded-full bg-rose-500 dark:bg-rose-400 -ml-1.25 shadow-sm"></div>
                    <div class="flex-1 h-[1.5px] bg-rose-500/85 dark:bg-rose-400/85"></div>
                  </div>

                  <!-- Event Cards loop -->
                  <div 
                    v-for="event in processedSchedulesByDay[day]" 
                    :key="event.id"
                    @click="openDetailsModal(event)"
                    class="group absolute rounded-xl border p-2.5 transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.015] hover:z-25 flex flex-col justify-between overflow-hidden shadow-sm"
                    :class="[
                      getSubjectTheme(event.subject_code).bg,
                      getSubjectTheme(event.subject_code).text,
                      scheduleConflicts[event.id] 
                        ? '!border-amber-500 dark:!border-amber-500/80 ring-2 ring-amber-500/10 dark:ring-amber-500/5 shadow-amber-500/5' 
                        : getSubjectTheme(event.subject_code).border
                    ]"
                    :style="getEventStyles(event)"
                  >
                    <!-- Microsoft Teams style left visual marker -->
                    <div 
                      class="absolute left-0 top-0 bottom-0 w-[4.5px] transition-colors" 
                      :class="[
                        scheduleConflicts[event.id] ? 'bg-amber-500' : getSubjectTheme(event.subject_code).solid
                      ]"
                    ></div>

                    <!-- Text items block -->
                    <div class="pl-1.5 h-full flex flex-col justify-between select-none">
                      <div class="space-y-0.5">
                        <!-- Subject Name -->
                        <h4 class="font-bold text-[11px] leading-tight line-clamp-2 pr-2">
                          {{ event.subject_name }}
                        </h4>
                        <!-- Class badge & conflict notification -->
                        <div class="flex items-center flex-wrap gap-1">
                          <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-white/70 dark:bg-zinc-900/50 rounded border border-current/10">
                            {{ event.class_name }}
                          </span>
                          <span v-if="scheduleConflicts[event.id]" class="inline-flex items-center gap-0.5 text-[8px] font-bold text-amber-600 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                            <AlertTriangle :size="9" class="animate-pulse" />
                            Bentrok
                          </span>
                        </div>
                      </div>

                      <!-- Metadata Footer -->
                      <div class="space-y-0.5 mt-1.5 text-[9px] opacity-85 leading-normal">
                        <div class="flex items-center gap-1 font-semibold">
                          <Clock :size="10" class="opacity-80" />
                          <span>{{ formatTimeDisplay(event.start_time) }} - {{ formatTimeDisplay(event.end_time) }}</span>
                        </div>
                        <div class="flex items-center gap-1 font-semibold truncate">
                          <User :size="10" class="opacity-80" />
                          <span class="truncate">{{ event.teacher_name }}</span>
                        </div>
                        <div v-if="event.room" class="flex items-center gap-1 font-semibold truncate">
                          <MapPin :size="10" class="opacity-80" />
                          <span class="truncate">{{ event.room }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Action controls visible on hover -->
                    <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-white/95 dark:bg-zinc-900/95 p-0.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 transition-opacity z-20">
                      <button @click.stop="openEditModal(event)" class="p-1 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-all" title="Ubah">
                        <Edit2 :size="11" />
                      </button>
                      <button @click.stop="handleDeleteSchedule(event.id)" class="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-all" title="Hapus">
                        <Trash2 :size="11" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          <!-- Empty Schedule State inside Time Grid -->
          <div 
            v-if="filteredSchedules.length === 0 && selectedSchoolId" 
            class="py-16 text-center text-slate-400 dark:text-zinc-550 border-t border-slate-100 dark:border-zinc-855 animate-in fade-in duration-300"
          >
            <Calendar class="mx-auto mb-2 opacity-35 animate-pulse" :size="36" />
            <p class="text-xs font-bold">Tidak ada data jadwal untuk filter ini.</p>
            <p class="text-[10px] mt-1 text-slate-500 dark:text-zinc-500">Silakan sesuaikan filter Kelas/Guru atau tambahkan jadwal baru.</p>
          </div>

        </div>
      </div>
    </div>

    <!-- 2. AGENDA / LIST VIEW (Classic Table) -->
    <div 
      v-else-if="viewMode === 'list'" 
      class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm"
    >
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
            <th class="p-4 pl-6">Hari</th>
            <th class="p-4">Waktu</th>
            <th class="p-4">Kelas</th>
            <th class="p-4">Mata Pelajaran</th>
            <th class="p-4">Guru Pengampu</th>
            <th class="p-4">Ruang</th>
            <th class="p-4 pr-6 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="item in filteredSchedules" 
            :key="item.id" 
            class="border-b border-slate-100 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/30 dark:hover:bg-zinc-900/30 transition-colors"
          >
            <td class="p-4 pl-6">
              <span class="font-bold text-slate-800 dark:text-zinc-200 text-sm">{{ item.day_of_week }}</span>
            </td>
            <td class="p-4">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-350">
                <Clock :size="13" class="text-slate-400" />
                <span>{{ formatTimeDisplay(item.start_time) }} - {{ formatTimeDisplay(item.end_time) }}</span>
              </div>
            </td>
            <td class="p-4">
              <span class="inline-flex px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                {{ item.class_name }}
              </span>
            </td>
            <td class="p-4">
              <div class="flex items-center gap-2">
                <BookOpen :size="14" class="text-slate-400" />
                <span class="font-semibold text-slate-850 dark:text-zinc-250 text-xs">{{ item.subject_name }}</span>
              </div>
            </td>
            <td class="p-4">
              <div class="flex items-center gap-2">
                <User :size="14" class="text-slate-400" />
                <span class="text-xs text-slate-700 dark:text-zinc-300">{{ item.teacher_name }}</span>
              </div>
            </td>
            <td class="p-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">
              {{ item.room || '-' }}
            </td>
            <td class="p-4 pr-6 text-right">
              <div class="flex justify-end items-center gap-1">
                <button @click="openEditModal(item)" class="p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  <Edit2 :size="14" />
                </button>
                <button @click="handleDeleteSchedule(item.id)" class="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                  <Trash2 :size="14" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredSchedules.length === 0">
            <td colspan="7" class="p-12 text-center text-slate-400 dark:text-zinc-550">
              <Calendar class="mx-auto mb-2 opacity-50" :size="32" />
              <p class="text-xs font-bold">Tidak ada data jadwal untuk filter ini.</p>
              <p class="text-[10px] mt-1 text-slate-500 dark:text-zinc-500">Silakan sesuaikan filter Kelas/Guru atau tambahkan jadwal baru.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty Selection State (when no school is loaded) -->
    <div 
      v-if="!selectedSchoolId"
      class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-16 text-center shadow-sm"
    >
      <Calendar class="mx-auto text-violet-600/30 dark:text-violet-400/20 mb-3 animate-pulse" :size="48" />
      <h3 class="text-sm font-bold text-slate-800 dark:text-zinc-200">Silakan Pilih Yayasan & Unit Sekolah</h3>
      <p class="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-md mx-auto">Untuk mengelola dan melihat jadwal pelajaran mingguan, silakan tentukan yayasan dan unit sekolah yang ingin ditampilkan terlebih dahulu.</p>
    </div>

    <!-- Details Modal (Teams Event details popover) -->
    <BaseModal :show="showDetailsModal" title="Detail Jadwal Pelajaran" @close="showDetailsModal = false">
      <div v-if="selectedEvent" class="space-y-5">
        <!-- Header banner matching theme color -->
        <div 
          class="p-4 rounded-xl border flex items-start justify-between gap-3 shadow-inner"
          :class="[
            getSubjectTheme(selectedEvent.subject_code).bg,
            getSubjectTheme(selectedEvent.subject_code).border,
            getSubjectTheme(selectedEvent.subject_code).text
          ]"
        >
          <div class="space-y-1">
            <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-white/60 dark:bg-zinc-900/40 rounded border border-current/10">
              {{ selectedEvent.subject_code }}
            </span>
            <h3 class="text-base font-extrabold leading-snug tracking-tight mt-1">{{ selectedEvent.subject_name }}</h3>
          </div>
          <div class="p-2 rounded-lg bg-white/70 dark:bg-zinc-900/70 border border-current/10">
            <BookOpen :size="18" />
          </div>
        </div>

        <!-- Conflict Message alerts inside details -->
        <div 
          v-if="scheduleConflicts[selectedEvent.id]" 
          class="bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl p-3 text-xs space-y-1.5"
        >
          <div class="flex items-center gap-1.5 font-bold">
            <AlertTriangle :size="14" class="animate-pulse" />
            <span>Peringatan Bentrok Jadwal</span>
          </div>
          <ul class="list-disc pl-4.5 space-y-1 font-medium leading-relaxed">
            <li v-for="(reason, idx) in scheduleConflicts[selectedEvent.id]" :key="idx">
              {{ reason }}
            </li>
          </ul>
        </div>

        <!-- Details Grid items -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 dark:text-zinc-350">
          <div class="flex items-center gap-3 bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-zinc-900">
            <Clock class="text-violet-600 dark:text-violet-400" :size="15" />
            <div>
              <p class="text-[9px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest">Hari & Waktu</p>
              <p class="text-xs text-slate-800 dark:text-zinc-200 font-extrabold mt-0.5">{{ selectedEvent.day_of_week }}, {{ formatTimeDisplay(selectedEvent.start_time) }} - {{ formatTimeDisplay(selectedEvent.end_time) }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-zinc-900">
            <GraduationCap class="text-violet-600 dark:text-violet-400" :size="15" />
            <div>
              <p class="text-[9px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-widest">Kelas / Tingkat</p>
              <p class="text-xs text-slate-800 dark:text-zinc-200 font-extrabold mt-0.5">{{ selectedEvent.class_name }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-zinc-900">
            <User class="text-violet-600 dark:text-violet-400" :size="15" />
            <div>
              <p class="text-[9px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-widest">Guru Pengampu</p>
              <p class="text-xs text-slate-800 dark:text-zinc-200 font-extrabold mt-0.5">{{ selectedEvent.teacher_name }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-zinc-900">
            <MapPin class="text-violet-600 dark:text-violet-400" :size="15" />
            <div>
              <p class="text-[9px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-widest">Ruang Kelas / Lab</p>
              <p class="text-xs text-slate-800 dark:text-zinc-200 font-extrabold mt-0.5">{{ selectedEvent.room || 'Tidak Ditentukan' }}</p>
            </div>
          </div>

          <div v-if="selectedEvent.extracurricular_instructor" class="flex items-center gap-3 bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-zinc-900 col-span-1 sm:col-span-2">
            <User class="text-emerald-600 dark:text-emerald-400" :size="15" />
            <div>
              <p class="text-[9px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-widest">Penanggung Jawab / Instruktur (Ekskul)</p>
              <p class="text-xs text-slate-800 dark:text-zinc-200 font-extrabold mt-0.5">{{ selectedEvent.extracurricular_instructor }}</p>
            </div>
          </div>
        </div>

        <!-- Action footer -->
        <div class="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-zinc-800">
          <div class="flex gap-2">
            <BaseButton variant="outline" class="py-1.5 px-3 text-xs text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-550/10 rounded-xl" @click="triggerDeleteFromDetails">
              <Trash2 class="mr-1.5" :size="13" /> Hapus
            </BaseButton>
            <BaseButton variant="outline" class="py-1.5 px-3 text-xs rounded-xl" @click="triggerEditFromDetails">
              <Edit2 class="mr-1.5" :size="13" /> Ubah
            </BaseButton>
          </div>
          <BaseButton variant="primary" class="py-1.5 px-4 text-xs font-bold rounded-xl" @click="showDetailsModal = false">
            Tutup
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Create Modal -->
    <BaseModal :show="showCreateModal" title="Tambah Jadwal Pelajaran" @close="showCreateModal = false">
      <form @submit.prevent="handleCreateSchedule" class="space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-3 text-xs flex items-start gap-2">
          <AlertTriangle :size="16" class="flex-shrink-0 mt-0.5" />
          <p class="font-semibold">{{ errorMessage }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Day of Week -->
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Hari</label>
            <select v-model="scheduleForm.day_of_week" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
              <option v-for="day in daysOfWeek" :key="day" :value="day">{{ day }}</option>
            </select>
          </div>

          <!-- Class Dropdown -->
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kelas</label>
            <select v-model="scheduleForm.class_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
              <option value="" disabled>Pilih Kelas</option>
              <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.class_name }}</option>
            </select>
          </div>
        </div>

        <!-- Subject Dropdown -->
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Mata Pelajaran</label>
          <select v-model="scheduleForm.subject_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="" disabled>Pilih Mata Pelajaran</option>
            <option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.name }} ({{ sub.code }})</option>
          </select>
        </div>

        <!-- Teacher Dropdown -->
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Guru Pengampu</label>
          <select v-model="scheduleForm.teacher_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="" disabled>Pilih Guru</option>
            <option v-for="tch in teachers" :key="tch.id" :value="tch.id">{{ tch.full_name }}</option>
          </select>
        </div>

        <!-- Times & Room -->
        <div class="grid grid-cols-2 gap-4">
          <BaseInput 
            v-model="scheduleForm.start_time" 
            type="text" 
            label="Jam Mulai (HH:MM)" 
            placeholder="Contoh: 07:00" 
            required 
          />
          <BaseInput 
            v-model="scheduleForm.end_time" 
            type="text" 
            label="Jam Selesai (HH:MM)" 
            placeholder="Contoh: 08:30" 
            required 
          />
        </div>

        <BaseInput 
          v-model="scheduleForm.room" 
          type="text" 
          label="Ruang Kelas / Lab (Opsional)" 
          placeholder="Contoh: Ruang 103 / Lab Bahasa" 
        />

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showCreateModal = false" class="rounded-xl py-2 px-4 text-xs font-semibold">Batal</BaseButton>
          <BaseButton variant="primary" type="submit" class="rounded-xl py-2 px-4 text-xs font-bold">Simpan Jadwal</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Edit Modal -->
    <BaseModal :show="showEditModal" title="Ubah Jadwal Pelajaran" @close="showEditModal = false">
      <form @submit.prevent="handleUpdateSchedule" class="space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-3 text-xs flex items-start gap-2">
          <AlertTriangle :size="16" class="flex-shrink-0 mt-0.5" />
          <p class="font-semibold">{{ errorMessage }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Day of Week -->
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Hari</label>
            <select v-model="editForm.day_of_week" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
              <option v-for="day in daysOfWeek" :key="day" :value="day">{{ day }}</option>
            </select>
          </div>

          <!-- Class Dropdown -->
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kelas</label>
            <select v-model="editForm.class_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
              <option value="" disabled>Pilih Kelas</option>
              <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.class_name }}</option>
            </select>
          </div>
        </div>

        <!-- Subject Dropdown -->
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Mata Pelajaran</label>
          <select v-model="editForm.subject_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="" disabled>Pilih Mata Pelajaran</option>
            <option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.name }} ({{ sub.code }})</option>
          </select>
        </div>

        <!-- Teacher Dropdown -->
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Guru Pengampu</label>
          <select v-model="editForm.teacher_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="" disabled>Pilih Guru</option>
            <option v-for="tch in teachers" :key="tch.id" :value="tch.id">{{ tch.full_name }}</option>
          </select>
        </div>

        <!-- Times & Room -->
        <div class="grid grid-cols-2 gap-4">
          <BaseInput 
            v-model="editForm.start_time" 
            type="text" 
            label="Jam Mulai (HH:MM)" 
            placeholder="Contoh: 07:00" 
            required 
          />
          <BaseInput 
            v-model="editForm.end_time" 
            type="text" 
            label="Jam Selesai (HH:MM)" 
            placeholder="Contoh: 08:30" 
            required 
          />
        </div>

        <BaseInput 
          v-model="editForm.room" 
          type="text" 
          label="Ruang Kelas / Lab (Opsional)" 
          placeholder="Contoh: Ruang 103 / Lab Bahasa" 
        />

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showEditModal = false" class="rounded-xl py-2 px-4 text-xs font-semibold">Batal</BaseButton>
          <BaseButton variant="primary" type="submit" class="rounded-xl py-2 px-4 text-xs font-bold">Simpan Perubahan</BaseButton>
        </div>
      </form>
    </BaseModal>

  </div>
</template>
