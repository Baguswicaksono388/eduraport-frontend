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
  GraduationCap 
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
        // Fallback check both
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
const viewMode = ref<'grid' | 'list'>('grid')

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

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
}

// Group schedules by day for the grid view
const schedulesByDay = computed(() => {
  const grouped: Record<string, any[]> = {}
  daysOfWeek.forEach(day => {
    grouped[day] = []
  })
  
  schedules.value.forEach(item => {
    if (grouped[item.day_of_week]) {
      grouped[item.day_of_week].push(item)
    }
  })

  // Sort each day by start time
  daysOfWeek.forEach(day => {
    grouped[day].sort((a, b) => a.start_time.localeCompare(b.start_time))
  })

  return grouped
})

// Methods
const openCreateModal = () => {
  errorMessage.value = ''
  successMessage.value = ''
  Object.assign(scheduleForm, {
    class_id: selectedClassId.value || (classes.value[0]?.id || ''),
    subject_id: subjects.value[0]?.id || '',
    teacher_id: teachers.value[0]?.id || '',
    day_of_week: 'Senin',
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

const openEditModal = (item: any) => {
  errorMessage.value = ''
  successMessage.value = ''
  editingScheduleId.value = item.id
  Object.assign(editForm, {
    class_id: item.class_id,
    subject_id: item.subject_id,
    teacher_id: item.teacher_id,
    day_of_week: item.day_of_week,
    start_time: item.start_time,
    end_time: item.end_time,
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
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <Clock class="text-violet-600 dark:text-violet-400" :size="24" />
          Manajemen Jadwal Pelajaran
        </h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Atur jadwal pelajaran mingguan per kelas, pastikan alokasi jam mengajar guru bebas bentrok.</p>
      </div>
      <div class="flex items-center gap-2">
        <!-- View Toggle -->
        <div class="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-slate-200 dark:border-zinc-700">
          <button 
            @click="viewMode = 'grid'" 
            :class="[
              'p-2 rounded-md transition-all',
              viewMode === 'grid' 
                ? 'bg-white dark:bg-zinc-700 text-violet-600 dark:text-violet-400 shadow-sm' 
                : 'text-slate-550 dark:text-zinc-400 hover:text-slate-800'
            ]"
            title="Tampilan Grid Mingguan"
          >
            <LayoutGrid :size="16" />
          </button>
          <button 
            @click="viewMode = 'list'" 
            :class="[
              'p-2 rounded-md transition-all',
              viewMode === 'list' 
                ? 'bg-white dark:bg-zinc-700 text-violet-600 dark:text-violet-400 shadow-sm' 
                : 'text-slate-550 dark:text-zinc-400 hover:text-slate-800'
            ]"
            title="Tampilan Daftar Tabel"
          >
            <List :size="16" />
          </button>
        </div>

        <BaseButton variant="primary" @click="openCreateModal" :disabled="!selectedSchoolId" class="py-2.5 px-4 text-xs font-bold shadow-lg shadow-violet-600/10">
          <Plus class="mr-1.5" :size="14" /> Tambah Jadwal
        </BaseButton>
      </div>
    </div>

    <!-- Toast Alert Custom -->
    <div 
      v-if="toastState.show" 
      :class="[
        'fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl transition-all duration-300 transform translate-y-0',
        toastState.type === 'success' 
          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
      ]"
    >
      <CheckCircle2 v-if="toastState.type === 'success'" :size="18" />
      <AlertTriangle v-else :size="18" />
      <span class="text-xs font-bold">{{ toastState.message }}</span>
    </div>

    <!-- Filters & Selection -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Yayasan</label>
        <select v-model="selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
          <option value="" disabled>Pilih Yayasan</option>
          <option v-for="found in foundations" :key="found.id" :value="found.id">{{ found.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" :disabled="!selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
          <option value="" disabled>Pilih Unit Sekolah</option>
          <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Filter Kelas</label>
        <select v-model="selectedClassId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
          <option value="">Semua Kelas</option>
          <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.class_name }}</option>
        </select>
      </div>
    </div>

    <!-- 1. Grid View (Weekly Timetable) -->
    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      <div 
        v-for="day in daysOfWeek" 
        :key="day"
        class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl flex flex-col p-4 shadow-sm min-h-[320px] transition-all hover:shadow-md"
      >
        <div class="border-b border-slate-100 dark:border-zinc-800 pb-2 mb-3">
          <h3 class="font-bold text-slate-800 dark:text-zinc-100 text-sm flex items-center justify-between">
            <span>{{ day }}</span>
            <span class="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">
              {{ schedulesByDay[day]?.length || 0 }}
            </span>
          </h3>
        </div>

        <div class="flex-1 space-y-3 overflow-y-auto">
          <div 
            v-for="item in schedulesByDay[day]" 
            :key="item.id"
            class="group relative bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-lg p-3 hover:border-violet-500/50 hover:shadow-sm transition-all duration-200"
          >
            <!-- Hover actions overlay -->
            <div class="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-white/95 dark:bg-zinc-900/95 p-1 rounded-md shadow-sm border border-slate-150 dark:border-zinc-850">
              <button @click="openEditModal(item)" class="p-1 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                <Edit2 :size="12" />
              </button>
              <button @click="handleDeleteSchedule(item.id)" class="p-1 text-slate-500 hover:text-rose-600 transition-colors">
                <Trash2 :size="12" />
              </button>
            </div>

            <!-- Subject & Class Name -->
            <div class="font-bold text-slate-800 dark:text-zinc-200 text-xs flex flex-col mb-1.5">
              <span class="text-violet-600 dark:text-violet-400 text-[10px] uppercase font-extrabold tracking-wide mb-0.5">
                {{ item.class_name }}
              </span>
              <span class="line-clamp-2">{{ item.subject_name }}</span>
            </div>

            <!-- Meta details (Teacher, Time, Room) -->
            <div class="space-y-1 text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
              <div class="flex items-center gap-1.5">
                <Clock :size="10" class="text-slate-400" />
                <span>{{ item.start_time }} - {{ item.end_time }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <GraduationCap :size="10" class="text-slate-400" />
                <span class="truncate">{{ item.teacher_name }}</span>
              </div>
              <div v-if="item.room" class="flex items-center gap-1.5">
                <MapPin :size="10" class="text-slate-400" />
                <span class="truncate">{{ item.room }}</span>
              </div>
            </div>
          </div>

          <div 
            v-if="schedulesByDay[day]?.length === 0" 
            class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-zinc-550 border border-dashed border-slate-150 dark:border-zinc-850 rounded-lg min-h-[150px]"
          >
            <Calendar class="opacity-20 mb-1" :size="24" />
            <span class="text-[9px] font-bold">Tidak ada jadwal</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. List View (Table Grid) -->
    <div v-else class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
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
          <tr v-for="item in schedules" :key="item.id" class="border-b border-slate-100 dark:border-zinc-800/80 last:border-0 hover:bg-slate-50/20 dark:hover:bg-zinc-900/20 transition-colors">
            <td class="p-4 pl-6">
              <span class="font-bold text-slate-800 dark:text-zinc-200 text-sm">{{ item.day_of_week }}</span>
            </td>
            <td class="p-4">
              <div class="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-zinc-350">
                <Clock :size="12" class="text-slate-400" />
                <span>{{ item.start_time }} - {{ item.end_time }}</span>
              </div>
            </td>
            <td class="p-4">
              <span class="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/10 text-violet-600 border border-violet-500/20">
                {{ item.class_name }}
              </span>
            </td>
            <td class="p-4">
              <div class="flex items-center gap-2">
                <BookOpen :size="14" class="text-slate-400" />
                <span class="font-semibold text-slate-800 dark:text-zinc-250 text-xs">{{ item.subject_name }}</span>
              </div>
            </td>
            <td class="p-4">
              <div class="flex items-center gap-2">
                <User :size="14" class="text-slate-400" />
                <span class="text-xs text-slate-650 dark:text-zinc-300">{{ item.teacher_name }}</span>
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
          <tr v-if="schedules.length === 0">
            <td colspan="7" class="p-12 text-center text-slate-400 dark:text-zinc-500">
              <Calendar class="mx-auto mb-2 opacity-50" :size="32" />
              <p class="text-xs font-semibold">Belum ada data jadwal pelajaran.</p>
              <p class="text-[10px] mt-1">Silakan klik 'Tambah Jadwal' untuk menambahkan jadwal pelajaran.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Modal -->
    <BaseModal :show="showCreateModal" title="Tambah Jadwal Pelajaran" @close="showCreateModal = false">
      <form @submit.prevent="handleCreateSchedule" class="space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-lg p-3 text-xs flex items-start gap-2">
          <AlertTriangle :size="16" class="flex-shrink-0 mt-0.5" />
          <p class="font-semibold">{{ errorMessage }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Day of Week -->
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Hari</label>
            <select v-model="scheduleForm.day_of_week" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
              <option v-for="day in daysOfWeek" :key="day" :value="day">{{ day }}</option>
            </select>
          </div>

          <!-- Class Dropdown -->
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kelas</label>
            <select v-model="scheduleForm.class_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
              <option value="" disabled>Pilih Kelas</option>
              <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.class_name }}</option>
            </select>
          </div>
        </div>

        <!-- Subject Dropdown -->
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Mata Pelajaran</label>
          <select v-model="scheduleForm.subject_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="" disabled>Pilih Mata Pelajaran</option>
            <option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.name }} ({{ sub.code }})</option>
          </select>
        </div>

        <!-- Teacher Dropdown -->
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Guru Pengampu</label>
          <select v-model="scheduleForm.teacher_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
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
          <BaseButton variant="outline" type="button" @click="showCreateModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Jadwal</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Edit Modal -->
    <BaseModal :show="showEditModal" title="Ubah Jadwal Pelajaran" @close="showEditModal = false">
      <form @submit.prevent="handleUpdateSchedule" class="space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-lg p-3 text-xs flex items-start gap-2">
          <AlertTriangle :size="16" class="flex-shrink-0 mt-0.5" />
          <p class="font-semibold">{{ errorMessage }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Day of Week -->
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Hari</label>
            <select v-model="editForm.day_of_week" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
              <option v-for="day in daysOfWeek" :key="day" :value="day">{{ day }}</option>
            </select>
          </div>

          <!-- Class Dropdown -->
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kelas</label>
            <select v-model="editForm.class_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
              <option value="" disabled>Pilih Kelas</option>
              <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.class_name }}</option>
            </select>
          </div>
        </div>

        <!-- Subject Dropdown -->
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Mata Pelajaran</label>
          <select v-model="editForm.subject_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="" disabled>Pilih Mata Pelajaran</option>
            <option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.name }} ({{ sub.code }})</option>
          </select>
        </div>

        <!-- Teacher Dropdown -->
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Guru Pengampu</label>
          <select v-model="editForm.teacher_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
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
          <BaseButton variant="outline" type="button" @click="showEditModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Perubahan</BaseButton>
        </div>
      </form>
    </BaseModal>

  </div>
</template>
