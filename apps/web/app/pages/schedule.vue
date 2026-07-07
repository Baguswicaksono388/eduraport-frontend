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
import { useApi } from '../composables/useApi'
import { useAuth } from '../composables/useAuth'

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
const { user } = useAuth()

// Leave composable for Modul 7.1e
import { useLeave } from '../composables/useLeave'
const { vacancies, candidates, fetchVacancies, fetchCandidates, createSubstitution, markPlannedEmpty, unmarkPlannedEmpty, cancelSubstitution, confirmSubstitution, declineSubstitution } = useLeave()

const selectedFoundationId = ref('')
const selectedSchoolId = ref('')
const selectedClassId = ref('')
const selectedTeacherId = ref('')

// Substitution and Vacancy states
const substitutionMode = ref(false)
const selectOnlyProblems = ref(false)
const currentDate = ref(new Date())
const showCandidateModal = ref(false)
const selectedVacancySlot = ref<any>(null)
const plannedNote = ref('')
const selectedSubTeacherId = ref('')
const declineReason = ref('')
const isDirectAssignment = ref(false)

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
      
      // Matches as Substitute Teacher (Modul 7.1e)
      if (substitutionMode.value) {
        const hasSub = (vacancies.value || []).some(v => 
          v.class_schedule_id === item.id && 
          v.substitute_teacher_id === selectedTeacherId.value &&
          (v.status === 'covered' || v.status === 'assigned')
        )
        if (hasSub) return true
      }
      
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
    
    // Inject leave & substitution states (Modul 7.1e)
    const dateStr = getDayDateStr(day)
    const decoratedEvents = events.map(event => {
      const decorated = {
        ...event,
        vacancyStatus: null as string | null,
        substituteName: null as string | null,
        plannedNote: null as string | null,
        substitutionId: null as string | null,
        leave_request_id: null as string | null,
        date: dateStr,
        slotKey: `${event.id}:${dateStr}`
      }
      
      if (substitutionMode.value) {
        const vac = (vacancies.value || []).find(v => v.slotKey === decorated.slotKey)
        if (vac) {
          decorated.vacancyStatus = vac.status
          decorated.substituteName = vac.substitute_teacher_name
          decorated.plannedNote = vac.note
          decorated.substitutionId = vac.substitution_id
          decorated.leave_request_id = vac.leave_request_id
        }
      }
      return decorated
    })
    
    result[day] = decoratedEvents
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
  isDeclining.value = false
  declineReason.value = ''
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

// ==========================================
// LEAVE & SUBSTITUTION METHODS (Modul 7.1e)
// ==========================================
const startOfWeekDate = computed(() => {
  const d = new Date(currentDate.value)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday is start
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
})

const endOfWeekDate = computed(() => {
  const mon = new Date(startOfWeekDate.value)
  const sat = new Date(mon.setDate(mon.getDate() + 5)) // Monday to Saturday
  sat.setHours(23, 59, 59, 999)
  return sat
})

const weekRangeDisplay = computed(() => {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
  return `${startOfWeekDate.value.toLocaleDateString('id-ID', options)} - ${endOfWeekDate.value.toLocaleDateString('id-ID', options)}`
})

const getDayDateStr = (dayName: string) => {
  const dayOffsetMap: Record<string, number> = {
    'Senin': 0, 'Selasa': 1, 'Rabu': 2, 'Kamis': 3, 'Jumat': 4, 'Sabtu': 5, 'Minggu': 6
  }
  const offset = dayOffsetMap[dayName] || 0
  const d = new Date(startOfWeekDate.value)
  d.setDate(d.getDate() + offset)
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const loadVacanciesData = async () => {
  if (!selectedSchoolId.value || !substitutionMode.value) return
  const formatDate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const from = formatDate(startOfWeekDate.value)
  const to = formatDate(endOfWeekDate.value)
  await fetchVacancies(selectedSchoolId.value, from, to)
}

const prevWeek = () => {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() - 7)
  currentDate.value = d
}

const nextWeek = () => {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() + 7)
  currentDate.value = d
}

const goToCurrentWeek = () => {
  currentDate.value = new Date()
}

// Watchers to trigger loading vacancies when date, school, or mode changes
watch([currentDate, substitutionMode, selectedSchoolId], async () => {
  if (substitutionMode.value && selectedSchoolId.value) {
    await loadVacanciesData()
  }
})

const teacherLeaves = ref<any[]>([])

const fetchTeacherLeaves = async () => {
  if (!selectedSchoolId.value || !selectedTeacherId.value) {
    teacherLeaves.value = []
    return
  }
  
  const formatDate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const from = formatDate(startOfWeekDate.value)
  const to = formatDate(endOfWeekDate.value)
  
  try {
    const { fetcher } = useApi()
    const res: any = await fetcher(`/school/${selectedSchoolId.value}/leave/requests?employee_id=${selectedTeacherId.value}&status=approved&from=${from}&to=${to}`)
    if (res.success) {
      teacherLeaves.value = res.data
    } else {
      teacherLeaves.value = []
    }
  } catch (e) {
    console.error('Failed to fetch teacher leaves:', e)
    teacherLeaves.value = []
  }
}

watch([selectedTeacherId, currentDate, selectedSchoolId], async () => {
  await fetchTeacherLeaves()
})

const getTeacherLeaveShortSummary = () => {
  if (teacherLeaves.value.length === 0) return ''
  return teacherLeaves.value.map(leave => {
    const startStr = leave.start_date.split('T')[0]
    const endStr = leave.end_date.split('T')[0]
    const startFmt = startStr.split('-').slice(1).reverse().join('/')
    if (startStr === endStr) {
      return `${leave.leave_type_name} (${startFmt})`
    }
    const endFmt = endStr.split('-').slice(1).reverse().join('/')
    return `${leave.leave_type_name} (${startFmt} s/d ${endFmt})`
  }).join(', ')
}

const openCandidateFinder = async (event: any, dateStr: string) => {
  selectedVacancySlot.value = {
    ...event,
    date: dateStr,
    slotKey: `${event.id}:${dateStr}`
  }
  plannedNote.value = ''
  selectedSubTeacherId.value = ''
  isDirectAssignment.value = false
  errorMessage.value = ''
  
  showCandidateModal.value = true
  await fetchCandidates(selectedSchoolId.value, selectedVacancySlot.value.slotKey)
}

const assignReplacement = async (candidateId: string) => {
  if (!selectedVacancySlot.value) return
  try {
    const res = await createSubstitution(selectedSchoolId.value, {
      class_schedule_id: selectedVacancySlot.value.id,
      date: selectedVacancySlot.value.date,
      leave_request_id: selectedVacancySlot.value.leave_request_id,
      original_teacher_id: selectedVacancySlot.value.teacher_id,
      substitute_teacher_id: candidateId,
      assignment_mode: isDirectAssignment.value ? 'direct' : 'normal'
    })
    
    if (res.success) {
      showCandidateModal.value = false
      showToast('success', isDirectAssignment.value ? 'Guru pengganti berhasil ditugaskan langsung!' : 'Penugasan diajukan, menunggu konfirmasi guru.')
      await loadVacanciesData()
    } else {
      errorMessage.value = res.message || 'Gagal menugaskan guru pengganti'
    }
  } catch (e: any) {
    errorMessage.value = e.data?.message || e.message || 'Gagal menugaskan guru pengganti'
  }
}

const handleMarkPlannedEmpty = async () => {
  if (!selectedVacancySlot.value) return
  try {
    const res = await markPlannedEmpty(selectedSchoolId.value, selectedVacancySlot.value.slotKey, plannedNote.value || 'Tugas Mandiri')
    if (res.success) {
      showCandidateModal.value = false
      showToast('success', 'Slot ditandai sebagai Kosong Terencana.')
      await loadVacanciesData()
    }
  } catch (e: any) {
    errorMessage.value = e.message || 'Gagal menandai kosong terencana'
  }
}

const handleUnmarkPlannedEmpty = async (slotKey: string) => {
  if (confirm('Apakah Anda yakin ingin membatalkan tanda Kosong Terencana ini?')) {
    try {
      const res = await unmarkPlannedEmpty(selectedSchoolId.value, slotKey)
      if (res.success) {
        showToast('success', 'Tanda Kosong Terencana dibatalkan.')
        await loadVacanciesData()
      }
    } catch (e: any) {
      alert(e.message || 'Gagal membatalkan')
    }
  }
}

const handleCancelSubstitution = async (substitutionId: string) => {
  if (confirm('Apakah Anda yakin ingin membatalkan penugasan guru pengganti ini?')) {
    try {
      const res = await cancelSubstitution(selectedSchoolId.value, substitutionId)
      if (res.success) {
        showToast('success', 'Penugasan guru pengganti dibatalkan.')
        await loadVacanciesData()
        showDetailsModal.value = false
      }
    } catch (e: any) {
      alert(e.message || 'Gagal membatalkan penugasan')
    }
  }
}

const isDeclining = ref(false)

const handleConfirmSubstitution = async (substitutionId: string) => {
  try {
    const res = await confirmSubstitution(selectedSchoolId.value, substitutionId)
    if (res.success) {
      showToast('success', 'Penugasan pengganti diterima.')
      await loadVacanciesData()
      showDetailsModal.value = false
    }
  } catch (e: any) {
    alert(e.message || 'Gagal menerima penugasan')
  }
}

const handleDeclineSubstitution = async (substitutionId: string) => {
  if (!declineReason.value.trim()) {
    alert('Alasan penolakan wajib diisi.')
    return
  }
  try {
    const res = await declineSubstitution(selectedSchoolId.value, substitutionId, declineReason.value)
    if (res.success) {
      showToast('success', 'Penugasan pengganti ditolak.')
      await loadVacanciesData()
      showDetailsModal.value = false
      isDeclining.value = false
      declineReason.value = ''
    }
  } catch (e: any) {
    alert(e.message || 'Gagal menolak penugasan')
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
        <!-- Substitution / Vacancy Mode Toggle Button -->
        <button
          type="button"
          @click="substitutionMode = !substitutionMode"
          :disabled="!selectedSchoolId"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border shadow-sm',
            substitutionMode
              ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-405 shadow-rose-500/10'
              : 'bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-250'
          ]"
        >
          <CalendarRange class="inline mr-1" :size="14" />
          {{ substitutionMode ? 'Mode Perizinan: AKTIF' : 'Mode Perizinan & Substitusi' }}
        </button>

        <!-- Week Navigation controls (visible only in Substitution Mode) -->
        <div v-if="substitutionMode" class="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-850 p-0.5 rounded-lg border border-slate-200/50 dark:border-zinc-700">
          <button @click="prevWeek" class="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded text-slate-500 hover:text-slate-800 dark:hover:text-zinc-250 transition-colors" title="Minggu Sebelumnya">
            <ChevronLeft :size="15" />
          </button>
          <span class="text-xs font-extrabold px-2.5 min-w-[210px] text-center text-slate-850 dark:text-zinc-200">
            {{ weekRangeDisplay }}
          </span>
          <button @click="nextWeek" class="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded text-slate-500 hover:text-slate-800 dark:hover:text-zinc-250 transition-colors" title="Minggu Berikutnya">
            <ChevronRight :size="15" />
          </button>
        </div>

        <button 
          v-if="substitutionMode"
          @click="goToCurrentWeek" 
          class="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-650 dark:text-zinc-200 transition-colors"
        >
          Minggu Ini
        </button>

        <!-- Day Navigation controls (visible only in Day view mode and Substitution Mode is inactive) -->
        <div v-if="viewMode === 'day' && !substitutionMode" class="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-zinc-700">
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
          v-if="viewMode === 'day' && !substitutionMode"
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

        <!-- Add Schedule Button (disabled in substitution mode) -->
        <BaseButton v-if="!substitutionMode" variant="primary" @click="openCreateModal" :disabled="!selectedSchoolId" class="py-2 px-4 text-xs font-bold shadow-lg shadow-violet-600/10 transition-transform active:scale-[0.98]">
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
    <div :class="['grid grid-cols-1 gap-4 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/70 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm', substitutionMode ? 'md:grid-cols-5' : 'md:grid-cols-4']">
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

      <div v-if="substitutionMode" class="flex items-center gap-2 mt-4 md:mt-6 pl-2">
        <input 
          id="toggleProblems" 
          type="checkbox" 
          v-model="selectOnlyProblems"
          class="rounded text-violet-650 focus:ring-violet-500 h-4 w-4 border-slate-350 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950"
        />
        <label for="toggleProblems" class="text-xs font-extrabold text-slate-700 dark:text-zinc-300 select-none cursor-pointer">
          Hanya Slot Bermasalah
        </label>
      </div>
    </div>

    <!-- Teacher Leave Warning Banner -->
    <div 
      v-if="selectedTeacherId && teacherLeaves.length > 0 && selectedSchoolId" 
      class="bg-rose-500/10 border border-rose-500/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs shadow-sm animate-in slide-in-from-top duration-300"
    >
      <div class="flex items-center gap-2 font-medium">
        <AlertTriangle :size="14" class="text-rose-500 flex-shrink-0 animate-pulse" />
        <span>
          Guru yang dipilih (<strong>{{ selectedTeacherName }}</strong>) sedang mengambil cuti/izin pada minggu ini: 
          <strong class="text-rose-700 dark:text-rose-455 ml-1">{{ getTeacherLeaveShortSummary() }}</strong>.
        </span>
      </div>
      <button 
        v-if="!substitutionMode" 
        @click="substitutionMode = true" 
        class="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-350 underline flex-shrink-0"
      >
        Aktifkan Mode Substitusi
      </button>
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
                    @click="substitutionMode ? (event.vacancyStatus === 'vacant' ? openCandidateFinder(event, getDayDateStr(day)) : openDetailsModal(event)) : openDetailsModal(event)"
                    class="group absolute rounded-xl border p-2.5 transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.015] hover:z-25 flex flex-col justify-between overflow-hidden shadow-sm"
                    :class="[
                      substitutionMode && event.vacancyStatus === 'vacant' ? 'bg-rose-50/95 dark:bg-rose-950/45 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-900/40 shadow-rose-500/5' :
                      substitutionMode && event.vacancyStatus === 'assigned' ? 'bg-amber-50/95 dark:bg-amber-950/45 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-900/40 shadow-amber-500/5' :
                      substitutionMode && event.vacancyStatus === 'covered' ? 'bg-emerald-50/95 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-900/40 shadow-emerald-500/5' :
                      substitutionMode && event.vacancyStatus === 'planned_empty' ? 'bg-slate-100/90 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 border-slate-300 dark:border-zinc-700 shadow-inner' :
                      getSubjectTheme(event.subject_code).bg,
                      
                      substitutionMode && event.vacancyStatus === 'vacant' ? 'border-rose-300' :
                      substitutionMode && event.vacancyStatus === 'assigned' ? 'border-amber-300' :
                      substitutionMode && event.vacancyStatus === 'covered' ? 'border-emerald-300' :
                      substitutionMode && event.vacancyStatus === 'planned_empty' ? 'border-slate-300' :
                      scheduleConflicts[event.id] 
                        ? '!border-amber-500 dark:!border-amber-500/80 ring-2 ring-amber-500/10 dark:ring-amber-500/5 shadow-amber-500/5' 
                        : getSubjectTheme(event.subject_code).border
                    ]"
                    :style="getEventStyles(event)"
                  >
                    <!-- Left visual marker color based on coverage state -->
                    <div 
                      class="absolute left-0 top-0 bottom-0 w-[4.5px] transition-colors" 
                      :class="[
                        substitutionMode && event.vacancyStatus === 'vacant' ? 'bg-rose-500' :
                        substitutionMode && event.vacancyStatus === 'assigned' ? 'bg-amber-500' :
                        substitutionMode && event.vacancyStatus === 'covered' ? 'bg-emerald-500' :
                        substitutionMode && event.vacancyStatus === 'planned_empty' ? 'bg-slate-450' :
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
                        <!-- Class badge & status notifications -->
                        <div class="flex items-center flex-wrap gap-1">
                          <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-white/70 dark:bg-zinc-900/50 rounded border border-current/10">
                            {{ event.class_name }}
                          </span>
                          
                          <span v-if="substitutionMode && event.vacancyStatus === 'vacant'" class="inline-flex items-center gap-0.5 text-[8px] font-bold text-rose-600 bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20">
                            <AlertTriangle :size="9" class="animate-pulse" /> Izin / Kosong
                          </span>
                          <span v-if="substitutionMode && event.vacancyStatus === 'assigned'" class="inline-flex items-center gap-0.5 text-[8px] font-bold text-amber-600 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                            Menunggu Konfirmasi
                          </span>
                          <span v-if="substitutionMode && event.vacancyStatus === 'covered'" class="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-600 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                            Ada Pengganti
                          </span>
                          <span v-if="substitutionMode && event.vacancyStatus === 'planned_empty'" class="inline-flex items-center gap-0.5 text-[8px] font-bold text-slate-600 bg-slate-500/10 px-1 py-0.2 rounded border border-slate-500/20">
                            Tugas Mandiri
                          </span>

                          <span v-if="!substitutionMode && scheduleConflicts[event.id]" class="inline-flex items-center gap-0.5 text-[8px] font-bold text-amber-600 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                            <AlertTriangle :size="9" class="animate-pulse" /> Bentrok
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
                          <span class="truncate">
                            <template v-if="substitutionMode && event.vacancyStatus === 'covered'">
                              <s>{{ event.teacher_name }}</s> &rarr; <strong>{{ event.substituteName }}</strong> (Ganti)
                            </template>
                            <template v-else-if="substitutionMode && event.vacancyStatus === 'assigned'">
                              <s>{{ event.teacher_name }}</s> &rarr; <em>{{ event.substituteName }}</em>
                            </template>
                            <template v-else-if="substitutionMode && event.vacancyStatus === 'planned_empty'">
                              <s>{{ event.teacher_name }}</s> (Mandiri)
                            </template>
                            <template v-else>
                              {{ event.teacher_name }}
                            </template>
                          </span>
                        </div>
                        <div v-if="event.room" class="flex items-center gap-1 font-semibold truncate">
                          <MapPin :size="10" class="opacity-80" />
                          <span class="truncate">{{ event.room }}</span>
                        </div>
                        <div v-if="substitutionMode && event.plannedNote" class="text-[8px] font-bold italic truncate text-slate-500">
                          Ket: {{ event.plannedNote }}
                        </div>
                      </div>
                    </div>

                    <!-- Action controls visible on hover (hidden in substitutionMode) -->
                    <div v-if="!substitutionMode" class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-white/95 dark:bg-zinc-900/95 p-0.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 transition-opacity z-20">
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
              <p class="text-xs text-slate-800 dark:text-zinc-200 font-extrabold mt-0.5">
                <span v-if="substitutionMode">{{ selectedEvent.date }} ({{ selectedEvent.day_of_week }})</span>
                <span v-else>{{ selectedEvent.day_of_week }}</span>, 
                {{ formatTimeDisplay(selectedEvent.start_time) }} - {{ formatTimeDisplay(selectedEvent.end_time) }}
              </p>
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
              <p class="text-xs text-slate-800 dark:text-zinc-200 font-extrabold mt-0.5">
                <span v-if="substitutionMode && selectedEvent.vacancyStatus === 'covered'">
                  <s>{{ selectedEvent.teacher_name }}</s> &rarr; <strong>{{ selectedEvent.substituteName }}</strong> (Ganti)
                </span>
                <span v-else-if="substitutionMode && selectedEvent.vacancyStatus === 'assigned'">
                  <s>{{ selectedEvent.teacher_name }}</s> &rarr; <em>{{ selectedEvent.substituteName }}</em>
                </span>
                <span v-else>{{ selectedEvent.teacher_name }}</span>
              </p>
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

        <!-- Modul 7.1e Substitution Leave Details Card -->
        <div v-if="substitutionMode && selectedEvent.vacancyStatus" class="bg-rose-500/5 dark:bg-rose-950/10 border border-rose-500/10 dark:border-rose-900/35 rounded-xl p-3.5 space-y-2 text-xs">
          <h4 class="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
            <AlertTriangle :size="14" />
            Detail Perizinan Guru Pengampu
          </h4>
          <p class="font-medium text-slate-700 dark:text-zinc-350">
            Guru pengampu utama (<strong>{{ selectedEvent.teacher_name }}</strong>) berhalangan hadir pada tanggal {{ selectedEvent.date }} karena izin.
          </p>
          
          <div class="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-[10px] font-bold flex flex-wrap gap-2 items-center">
            <span class="text-slate-400 uppercase">Status Slot:</span>
            <span v-if="selectedEvent.vacancyStatus === 'vacant'" class="px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 uppercase">KOSONG</span>
            <span v-if="selectedEvent.vacancyStatus === 'assigned'" class="px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 uppercase">MENUNGGU KONFIRMASI GURU</span>
            <span v-if="selectedEvent.vacancyStatus === 'covered'" class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 uppercase">TERTUTUP (PENGGANTI)</span>
            <span v-if="selectedEvent.vacancyStatus === 'planned_empty'" class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 uppercase">KOSONG TERENCANA</span>
          </div>

          <div v-if="selectedEvent.plannedNote" class="mt-1.5 text-[10px] text-slate-500 dark:text-zinc-400">
            <strong>Catatan Tugas Mandiri:</strong> {{ selectedEvent.plannedNote }}
          </div>
        </div>

        <!-- Decline Reason input if in declining state -->
        <div v-if="isDeclining" class="space-y-2 mt-4 p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-350">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block">Alasan Penolakan</label>
          <input 
            type="text" 
            v-model="declineReason" 
            class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-rose-500"
            placeholder="Masukkan alasan menolak tugas..."
          />
        </div>

        <!-- Action footer -->
        <div class="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-zinc-800">
          <div class="flex gap-2">
            <!-- Substitution cancellation buttons -->
            <template v-if="substitutionMode">
              <!-- Admin / Principal / TU specific buttons -->
              <template v-if="['super_admin', 'principal', 'tu'].includes(user?.role)">
                <BaseButton 
                  v-if="selectedEvent.vacancyStatus === 'covered' || selectedEvent.vacancyStatus === 'assigned'"
                  variant="outline" 
                  class="py-1.5 px-3 text-xs text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/10 rounded-xl"
                  @click="handleCancelSubstitution(selectedEvent.substitutionId)"
                >
                  Batalkan Penugasan Ganti
                </BaseButton>
                <BaseButton 
                  v-if="selectedEvent.vacancyStatus === 'planned_empty'"
                  variant="outline" 
                  class="py-1.5 px-3 text-xs text-slate-650 dark:text-zinc-350 border-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl"
                  @click="handleUnmarkPlannedEmpty(selectedEvent.slotKey)"
                >
                  Batalkan Tugas Mandiri
                </BaseButton>
              </template>

              <!-- Substitute teacher specific buttons -->
              <template v-if="selectedEvent.substituteTeacherId === user?.id && selectedEvent.vacancyStatus === 'assigned'">
                <template v-if="!isDeclining">
                  <BaseButton 
                    variant="primary" 
                    class="py-1.5 px-3 text-xs bg-emerald-500 hover:bg-emerald-600 border-none text-white rounded-xl shadow-lg shadow-emerald-500/10"
                    @click="handleConfirmSubstitution(selectedEvent.substitutionId)"
                  >
                    Terima Tugas
                  </BaseButton>
                  <BaseButton 
                    variant="outline" 
                    class="py-1.5 px-3 text-xs text-rose-650 dark:text-rose-455 border-rose-500/20 hover:bg-rose-500/10 rounded-xl"
                    @click="isDeclining = true"
                  >
                    Tolak Tugas
                  </BaseButton>
                </template>
                <template v-else>
                  <BaseButton 
                    variant="primary" 
                    class="py-1.5 px-3 text-xs bg-rose-500 hover:bg-rose-600 border-none text-white rounded-xl shadow-lg shadow-rose-500/10"
                    @click="handleDeclineSubstitution(selectedEvent.substitutionId)"
                  >
                    Kirim Penolakan
                  </BaseButton>
                  <BaseButton 
                    variant="outline" 
                    class="py-1.5 px-3 text-xs text-slate-650 dark:text-zinc-350 border-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl"
                    @click="isDeclining = false"
                  >
                    Batal
                  </BaseButton>
                </template>
              </template>
            </template>
            <!-- Classic schedule edit/delete buttons -->
            <template v-else>
              <BaseButton variant="outline" class="py-1.5 px-3 text-xs text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-550/10 rounded-xl" @click="triggerDeleteFromDetails">
                <Trash2 class="mr-1.5" :size="13" /> Hapus
              </BaseButton>
              <BaseButton variant="outline" class="py-1.5 px-3 text-xs rounded-xl" @click="triggerEditFromDetails">
                <Edit2 class="mr-1.5" :size="13" /> Ubah
              </BaseButton>
            </template>
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

    <!-- Candidate Finder / Pencarian Guru Pengganti Modal (Modul 7.1e) -->
    <BaseModal :show="showCandidateModal" title="Pencarian Guru Pengganti (Substitute Finder)" @close="showCandidateModal = false">
      <div v-if="selectedVacancySlot" class="space-y-5">
        <!-- Slot Summary Header -->
        <div class="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-500/5 dark:bg-rose-950/20 text-slate-800 dark:text-zinc-200">
          <p class="text-[9px] font-bold text-rose-500 uppercase tracking-widest">SLOT KOSONG TERDETEKSI</p>
          <h3 class="text-sm font-extrabold leading-snug tracking-tight mt-1">
            {{ selectedVacancySlot.subject_name }} &bull; {{ selectedVacancySlot.class_name }}
          </h3>
          <div class="mt-2 text-xs grid grid-cols-2 gap-2 text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
            <div>Tanggal: <span class="text-slate-800 dark:text-zinc-250 font-bold">{{ selectedVacancySlot.date }}</span></div>
            <div>Waktu: <span class="text-slate-800 dark:text-zinc-250 font-bold">{{ formatTimeDisplay(selectedVacancySlot.start_time) }} - {{ formatTimeDisplay(selectedVacancySlot.end_time) }}</span></div>
            <div>Guru Izin: <span class="text-slate-800 dark:text-zinc-250 font-bold">{{ selectedVacancySlot.teacher_name }}</span></div>
            <div>Ruang: <span class="text-slate-800 dark:text-zinc-250 font-bold">{{ selectedVacancySlot.room || '-' }}</span></div>
          </div>
        </div>

        <!-- Mode Assignment Toggle -->
        <div class="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl">
          <div>
            <h4 class="text-xs font-bold text-slate-800 dark:text-zinc-200">Penugasan Langsung (Direct Assignment)</h4>
            <p class="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Guru pengganti langsung bertugas tanpa memerlukan konfirmasi terlebih dahulu.</p>
          </div>
          <button 
            type="button" 
            @click="isDirectAssignment = !isDirectAssignment"
            :class="[
              'w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 outline-none',
              isDirectAssignment ? 'bg-violet-600 justify-end' : 'bg-slate-300 dark:bg-zinc-700 justify-start'
            ]"
          >
            <div class="w-4 h-4 rounded-full bg-white shadow-sm"></div>
          </button>
        </div>

        <!-- Candidates Recommendation List -->
        <div class="space-y-2.5">
          <h4 class="text-xs font-extrabold text-slate-800 dark:text-zinc-200 flex items-center justify-between">
            <span>Rekomendasi Guru Pengganti (Ranked Candidates)</span>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Urutan Kecocokan</span>
          </h4>

          <!-- Error Message inside Modal -->
          <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-3 text-xs flex items-start gap-2">
            <AlertTriangle :size="16" class="flex-shrink-0 mt-0.5" />
            <p class="font-semibold">{{ errorMessage }}</p>
          </div>

          <!-- Scrollable candidates container -->
          <div class="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            <div v-if="candidates.length === 0" class="py-6 text-center text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
              <User class="mx-auto mb-1.5 opacity-40 animate-pulse" :size="24" />
              <p class="text-xs font-bold">Tidak ada rekomendasi guru pengganti.</p>
              <p class="text-[9px] mt-0.5">Semua guru memiliki bentrok jadwal atau sedang berhalangan.</p>
            </div>

            <div 
              v-for="(cand, idx) in candidates" 
              :key="cand.id" 
              class="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 hover:border-violet-300 dark:hover:border-violet-900/50 rounded-xl hover:shadow-sm transition-all"
            >
              <div class="space-y-1 pr-4 min-w-0">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="text-xs font-bold text-slate-850 dark:text-zinc-200 truncate">{{ cand.full_name }}</span>
                  <span class="px-1.5 py-0.2 text-[8px] font-extrabold rounded bg-violet-650 text-white flex-shrink-0">
                    Skor: {{ cand.score }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
                  <div>Beban Jam: <span class="text-slate-700 dark:text-zinc-300">{{ cand.weekly_load_hours }} jam/minggu</span></div>
                  <div v-if="cand.daily_substitutions_count > 0">
                    Substitusi Hari Ini: <span class="text-amber-600 dark:text-amber-400 font-bold">{{ cand.daily_substitutions_count }}x</span>
                  </div>
                  <div>Status Mengajar: 
                    <span :class="[cand.current_status === 'teaching' ? 'text-rose-600' : 'text-emerald-600']">
                      {{ cand.current_status === 'teaching' ? 'Sedang Mengajar' : 'Tenggang' }}
                    </span>
                  </div>
                </div>
              </div>

              <BaseButton 
                variant="primary" 
                class="py-1.5 px-3.5 text-[10px] font-bold rounded-xl flex-shrink-0"
                @click="assignReplacement(cand.id)"
              >
                Tugaskan
              </BaseButton>
            </div>
          </div>
        </div>

        <div class="border-t border-slate-100 dark:border-zinc-800 my-4 pt-4 space-y-3">
          <div>
            <h4 class="text-xs font-bold text-slate-800 dark:text-zinc-200">Penanganan Alternatif: Tandai Tugas Mandiri</h4>
            <p class="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Jika tidak ada guru pengganti, tandai slot ini untuk pembelajaran mandiri / tugas terstruktur.</p>
          </div>

          <div class="flex gap-2">
            <BaseInput 
              v-model="plannedNote"
              type="text"
              placeholder="Contoh: Mengerjakan LKS Bab 4 Halaman 85"
              class="flex-1 text-xs"
            />
            <BaseButton 
              variant="outline" 
              class="py-2.5 px-4 text-xs font-bold rounded-xl border-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-250 self-end"
              @click="handleMarkPlannedEmpty"
            >
              Tandai Mandiri
            </BaseButton>
          </div>
        </div>

        <!-- Action footer -->
        <div class="flex justify-end pt-2 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" class="py-1.5 px-4 text-xs font-bold rounded-xl" @click="showCandidateModal = false">
            Batal
          </BaseButton>
        </div>
      </div>
    </BaseModal>

  </div>
</template>
