<script setup lang="ts">
import { useSchoolContext } from '../../composables/useSchoolContext'
import { HeartHandshake, Plus, Trash2, Edit2, Search, FileText } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useCounseling } from '../../composables/useCounseling'
import { useClass } from '../../composables/useClass'
import { useStudent } from '../../composables/useStudent'
import { useAcademicYear } from '../../composables/useAcademicYear'
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

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

const { isSchoolLocked, selectedFoundationId, selectedSchoolId, foundations, schools, initContext, onFoundationChange } = useSchoolContext()
const { sessions, fetchSessions, createSession, updateSession, deleteSession } = useCounseling()
const { classes, fetchClasses } = useClass()
const { students, fetchStudents } = useStudent()
const { academicYears, fetchAcademicYears } = useAcademicYear()

const filteredSchools = computed(() => schools.value.filter(s => s.level !== 'TK'))
const activeAcademicYear = computed(() => academicYears.value.find(y => y.is_active))
const selectedClassId = ref('')
const selectedStudentId = ref('')

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingSessionId = ref('')

const sessionForm = reactive({
  session_date: '',
  issue_category: '',
  action_plan: '',
  follow_up_date: '',
  confidential_notes: ''
})

watch(selectedFoundationId, onFoundationChange)

onMounted(async () => {
  await initContext()
  if (filteredSchools.value.length > 0 && !filteredSchools.value.find(s => s.id === selectedSchoolId.value)) {
    selectedSchoolId.value = filteredSchools.value[0].id
  }
  
  if (selectedSchoolId.value) {
    await fetchAcademicYears(selectedSchoolId.value)
    if (activeAcademicYear.value) {
      await fetchClasses(selectedSchoolId.value, activeAcademicYear.value.id)
    }
  }
})

watch(selectedSchoolId, async (newVal) => {
  selectedClassId.value = ''
  selectedStudentId.value = ''
  students.value = []
  sessions.value = []
  
  if (newVal) {
    await fetchAcademicYears(newVal)
    if (activeAcademicYear.value) {
      await fetchClasses(newVal, activeAcademicYear.value.id)
    }
  } else {
    classes.value = []
  }
})

watch(selectedClassId, async (newVal) => {
  selectedStudentId.value = ''
  sessions.value = []
  
  if (newVal && selectedSchoolId.value && activeAcademicYear.value) {
    await fetchStudents(selectedSchoolId.value, 1, 100, undefined, newVal, activeAcademicYear.value.id)
  } else {
    students.value = []
  }
})

watch(selectedStudentId, async (newVal) => {
  if (newVal && selectedSchoolId.value && activeAcademicYear.value) {
    await fetchSessions(selectedSchoolId.value, newVal, activeAcademicYear.value.id)
  } else {
    sessions.value = []
  }
})

const handleCreateSession = async () => {
  if (!selectedStudentId.value || !activeAcademicYear.value) return

  try {
    const payload = {
      ...sessionForm,
      student_id: selectedStudentId.value,
      academic_year_id: activeAcademicYear.value.id
    }
    const res = await createSession(selectedSchoolId.value, payload)
    if (res.success) {
      showCreateModal.value = false
      Object.assign(sessionForm, {
        session_date: '',
        issue_category: '',
        action_plan: '',
        follow_up_date: '',
        confidential_notes: ''
      })
      await fetchSessions(selectedSchoolId.value, selectedStudentId.value, activeAcademicYear.value.id)
    }
  } catch (e: any) {
    alert(e?.message ?? 'Gagal membuat sesi konseling')
  }
}

const openEditModal = (session: any) => {
  editingSessionId.value = session.id
  Object.assign(sessionForm, {
    session_date: session.session_date ? session.session_date.split('T')[0] : '',
    issue_category: session.issue_category || '',
    action_plan: session.action_plan || '',
    follow_up_date: session.follow_up_date ? session.follow_up_date.split('T')[0] : '',
    confidential_notes: session.confidential_notes || ''
  })
  showEditModal.value = true
}

const handleUpdateSession = async () => {
  if (!selectedStudentId.value || !activeAcademicYear.value) return

  try {
    const res = await updateSession(selectedSchoolId.value, editingSessionId.value, { ...sessionForm })
    if (res.success) {
      showEditModal.value = false
      await fetchSessions(selectedSchoolId.value, selectedStudentId.value, activeAcademicYear.value.id)
    }
  } catch (e: any) {
    alert(e?.message ?? 'Gagal memperbarui sesi')
  }
}

const handleDeleteSession = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus sesi konseling ini?')) {
    try {
      await deleteSession(selectedSchoolId.value, id)
      if (selectedStudentId.value && activeAcademicYear.value) {
        await fetchSessions(selectedSchoolId.value, selectedStudentId.value, activeAcademicYear.value.id)
      }
    } catch (e: any) {
      alert(e?.message ?? 'Gagal menghapus sesi')
    }
  }
}

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    scheduled: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400'
  }
  const label: Record<string, string> = {
    scheduled: 'Terjadwal',
    completed: 'Selesai',
    cancelled: 'Dibatalkan'
  }
  return { class: map[status] || 'bg-slate-50 text-slate-700 border-slate-200', label: label[status] || status }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Sesi Konseling</h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Pencatatan sesi bimbingan konseling siswa.</p>
      </div>
      <div class="flex gap-2">
        <BaseButton variant="primary" @click="showCreateModal = true" :disabled="!selectedStudentId" class="py-2.5 px-4 text-xs font-bold">
          <Plus class="mr-1.5" :size="14" /> Catat Sesi Baru
        </BaseButton>
      </div>
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
      <div v-if="!isSchoolLocked" class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Yayasan</label>
        <select v-model="selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Yayasan</option>
          <option v-for="found in foundations" :key="found.id" :value="found.id">{{ found.name }}</option>
        </select>
      </div>
      <div v-if="!isSchoolLocked" class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" :disabled="!selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Unit Sekolah</option>
          <option v-for="school in filteredSchools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>
      
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kelas</label>
        <select v-model="selectedClassId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Kelas</option>
          <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Siswa</label>
        <select v-model="selectedStudentId" :disabled="!selectedClassId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Siswa</option>
          <option v-for="std in students" :key="std.id" :value="std.id">{{ std.name }} ({{ std.nis }})</option>
        </select>
      </div>
    </div>

    <!-- Sessions List -->
    <div v-if="!selectedStudentId" class="text-center py-16 bg-white dark:bg-zinc-900/50 border border-dashed border-slate-300 dark:border-zinc-800 rounded-xl">
      <Search class="w-10 h-10 mx-auto text-slate-400 mb-3" />
      <h3 class="text-sm font-medium text-slate-900 dark:text-zinc-100">Pilih Siswa Terlebih Dahulu</h3>
      <p class="text-xs text-slate-500 mt-1">Silakan pilih kelas dan siswa untuk melihat riwayat konseling.</p>
    </div>
    
    <div v-else-if="sessions.length === 0" class="text-center py-16 bg-white dark:bg-zinc-900/50 border border-dashed border-slate-300 dark:border-zinc-800 rounded-xl">
      <FileText class="w-10 h-10 mx-auto text-slate-400 mb-3" />
      <h3 class="text-sm font-medium text-slate-900 dark:text-zinc-100">Belum Ada Sesi Konseling</h3>
      <p class="text-xs text-slate-500 mt-1">Siswa ini belum memiliki catatan sesi konseling.</p>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2">
      <BaseCard v-for="session in sessions" :key="session.id" class="p-5 border-slate-200/60 dark:border-zinc-800/80 hover:shadow-md transition-all">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">
              {{ formatDate(session.session_date) }}
            </div>
            <h3 class="font-bold text-slate-900 dark:text-white text-base leading-tight">
              {{ session.issue_category || 'Sesi Umum' }}
            </h3>
            <p class="text-xs text-slate-500 mt-1">
              Konselor: {{ session.counselor?.name || '-' }}
            </p>
          </div>
          <span :class="['px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider', getStatusBadge(session.status).class]">
            {{ getStatusBadge(session.status).label }}
          </span>
        </div>
        
        <div class="space-y-3 mt-4 border-t border-slate-100 dark:border-zinc-800 pt-4">
          <div v-if="session.confidential_notes" class="bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
            <h4 class="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-500 mb-1 tracking-wider">Catatan Rahasia</h4>
            <p class="text-sm text-slate-700 dark:text-zinc-300">{{ session.confidential_notes }}</p>
          </div>
          
          <div v-if="session.action_plan">
            <h4 class="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400 mb-1 tracking-wider">Rencana Tindak Lanjut</h4>
            <p class="text-sm text-slate-700 dark:text-zinc-300">{{ session.action_plan }}</p>
          </div>
          
          <div v-if="session.follow_up_date" class="flex items-center text-xs text-slate-500 mt-2 bg-slate-50 dark:bg-zinc-800/50 p-2 rounded-lg">
            <span class="font-medium mr-2">Tanggal Tindak Lanjut:</span>
            {{ formatDate(session.follow_up_date) }}
          </div>
        </div>
        
        <div class="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" size="sm" @click="openEditModal(session)">
            <Edit2 :size="14" class="mr-1.5" /> Edit
          </BaseButton>
          <BaseButton variant="outline" size="sm" class="text-rose-600 hover:bg-rose-50 border-rose-200" @click="handleDeleteSession(session.id)">
            <Trash2 :size="14" class="mr-1.5" /> Hapus
          </BaseButton>
        </div>
      </BaseCard>
    </div>

    <!-- Modals -->
    <BaseModal :show="showCreateModal" title="Catat Sesi Konseling" size="lg" @close="showCreateModal = false">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Tanggal Sesi</label>
          <BaseInput type="date" v-model="sessionForm.session_date" />
        </div>
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Kategori Masalah</label>
          <BaseInput v-model="sessionForm.issue_category" placeholder="Cth: Akademik, Perilaku..." />
        </div>
        <div class="space-y-1.5 md:col-span-2">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Rencana Tindak Lanjut</label>
          <textarea v-model="sessionForm.action_plan" rows="2" class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"></textarea>
        </div>
        <div class="space-y-1.5 md:col-span-2">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300 text-amber-600">Catatan Rahasia (Hanya Guru BK)</label>
          <textarea v-model="sessionForm.confidential_notes" rows="3" class="w-full bg-amber-50/30 dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"></textarea>
        </div>
        <div class="space-y-1.5 md:col-span-2">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Tanggal Tindak Lanjut (Opsional)</label>
          <BaseInput type="date" v-model="sessionForm.follow_up_date" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <BaseButton variant="outline" @click="showCreateModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="handleCreateSession">Simpan</BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Edit Modal is similar but updates rather than creates -->
    <BaseModal :show="showEditModal" title="Edit Sesi Konseling" size="lg" @close="showEditModal = false">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Tanggal Sesi</label>
          <BaseInput type="date" v-model="sessionForm.session_date" disabled />
        </div>
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Kategori Masalah</label>
          <BaseInput v-model="sessionForm.issue_category" />
        </div>
        <div class="space-y-1.5 md:col-span-2">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Rencana Tindak Lanjut</label>
          <textarea v-model="sessionForm.action_plan" rows="2" class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"></textarea>
        </div>
        <div class="space-y-1.5 md:col-span-2">
          <label class="text-sm font-medium text-amber-600">Catatan Rahasia (Hanya Guru BK)</label>
          <textarea v-model="sessionForm.confidential_notes" rows="3" class="w-full bg-amber-50/30 dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"></textarea>
        </div>
        <div class="space-y-1.5 md:col-span-2">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Tanggal Tindak Lanjut</label>
          <BaseInput type="date" v-model="sessionForm.follow_up_date" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <BaseButton variant="outline" @click="showEditModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="handleUpdateSession">Simpan Perubahan</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
