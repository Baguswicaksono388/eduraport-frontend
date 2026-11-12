<script setup lang="ts">
import { Trophy, Plus, Trash2, Edit2, ShieldAlert, CheckCircle2, User, Clock, Users, Activity, RefreshCw, Search } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useExtracurricular } from '../composables/useExtracurricular'
import { useTeacher } from '../composables/useTeacher'
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
const { isSchoolLocked, selectedFoundationId, selectedSchoolId, foundations, schools, initContext, onFoundationChange } = useSchoolContext()
const {
  extracurriculars,
  fetchExtracurriculars,
  createExtracurricular,
  updateExtracurricular,
  deleteExtracurricular,
  fetchExtracurricularMembers,
  saveExtracurricularMembers,
  fetchExtracurricularAttendances
} = useExtracurricular()
const { teachers, fetchTeachers } = useTeacher()

const activeTab = ref<'master' | 'monitoring'>('master')
const showCreateModal = ref(false)
const showEditModal = ref(false)

// Monitoring state (Berangkat & Pulang Ekstrakurikuler)
const todayWib = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date())
const monitorDate = ref(todayWib)
const selectedMonitorEkstraId = ref('')
const loadingMonitor = ref(false)
const monitorMembers = ref<any[]>([])
const monitorAttendances = ref<any[]>([])

// Members Modal state
const showMembersModal = ref(false)
const membersEkskul = ref<any>(null)
const schoolStudents = ref<any[]>([])
const selectedMemberIds = ref<string[]>([])
const memberSearch = ref('')
const loadingMembers = ref(false)
const savingMembers = ref(false)

const loadMonitorData = async () => {
  if (!selectedSchoolId.value || !selectedMonitorEkstraId.value) return
  loadingMonitor.value = true
  try {
    const [mems, atts] = await Promise.all([
      fetchExtracurricularMembers(selectedSchoolId.value, selectedMonitorEkstraId.value),
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

const openMembersModal = async (ekskul: any) => {
  if (!selectedSchoolId.value) return
  membersEkskul.value = ekskul
  memberSearch.value = ''
  showMembersModal.value = true
  loadingMembers.value = true
  try {
    const [membersRes, studentsRes]: [any[], any] = await Promise.all([
      fetchExtracurricularMembers(selectedSchoolId.value, ekskul.id),
      fetcher(`/school/${selectedSchoolId.value}/student?limit=1000`)
    ])
    selectedMemberIds.value = (membersRes || []).map((m: any) => m.student_id)
    const rawStudents = studentsRes?.data?.data || studentsRes?.data || []
    schoolStudents.value = Array.isArray(rawStudents) ? rawStudents : []
  } catch (err) {
    console.error('Failed loading extracurricular members modal:', err)
  } finally {
    loadingMembers.value = false
  }
}

const filteredSchoolStudents = computed(() => {
  const kw = memberSearch.value.trim().toLowerCase()
  if (!kw) return schoolStudents.value
  return schoolStudents.value.filter((s: any) =>
    (s.full_name || '').toLowerCase().includes(kw) ||
    (s.student_number || '').toLowerCase().includes(kw)
  )
})

const toggleMemberSelection = (studentId: string) => {
  const idx = selectedMemberIds.value.indexOf(studentId)
  if (idx >= 0) {
    selectedMemberIds.value.splice(idx, 1)
  } else {
    selectedMemberIds.value.push(studentId)
  }
}

const handleSaveMembers = async () => {
  if (!selectedSchoolId.value || !membersEkskul.value) return
  savingMembers.value = true
  try {
    await saveExtracurricularMembers(selectedSchoolId.value, membersEkskul.value.id, selectedMemberIds.value)
    showMembersModal.value = false
    if (activeTab.value === 'monitoring' && selectedMonitorEkstraId.value === membersEkskul.value.id) {
      await loadMonitorData()
    }
  } catch (err: any) {
    alert(err?.message ?? 'Gagal menyimpan anggota ekskul')
  } finally {
    savingMembers.value = false
  }
}

const ekskulForm = reactive({
  name: '',
  instructor: '',
  schedule: '',
  is_active: true
})

const editingEkskulId = ref('')
const editForm = reactive({
  name: '',
  instructor: '',
  schedule: '',
  is_active: true
})

onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    await fetchExtracurriculars(schoolId)
    await fetchTeachers(schoolId)
    if (extracurriculars.value.length > 0 && !selectedMonitorEkstraId.value) {
      selectedMonitorEkstraId.value = extracurriculars.value[0].id
    }
  }
})

watch(selectedFoundationId, (newVal) => onFoundationChange(newVal))

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await fetchExtracurriculars(newVal)
    await fetchTeachers(newVal)
    selectedMonitorEkstraId.value = extracurriculars.value[0]?.id || ''
    if (activeTab.value === 'monitoring' && selectedMonitorEkstraId.value) {
      await loadMonitorData()
    }
  } else {
    extracurriculars.value = []
    selectedMonitorEkstraId.value = ''
    monitorMembers.value = []
    monitorAttendances.value = []
  }
})

watch([activeTab, selectedMonitorEkstraId, monitorDate], async () => {
  if (activeTab.value === 'monitoring' && selectedMonitorEkstraId.value) {
    await loadMonitorData()
  }
})

const handleCreateEkskul = async () => {
  try {
    const res = await createExtracurricular(selectedSchoolId.value, { ...ekskulForm })
    if (res.success) {
      showCreateModal.value = false
      Object.assign(ekskulForm, {
        name: '',
        instructor: '',
        schedule: '',
        is_active: true
      })
    }
  } catch (e: any) {
    if (e.data?.errors) {
      const errorMsg = Object.entries(e.data.errors)
        .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
        .join('\n')
      alert(`Gagal menambah ekskul:\n${errorMsg}`)
    } else {
      alert(e?.message ?? 'Gagal menambah ekskul')
    }
  }
}

const openEditModal = (ekskul: any) => {
  editingEkskulId.value = ekskul.id
  Object.assign(editForm, {
    name: ekskul.name,
    instructor: ekskul.instructor || '',
    schedule: ekskul.schedule || '',
    is_active: !!ekskul.is_active
  })
  showEditModal.value = true
}

const handleUpdateEkskul = async () => {
  try {
    const res = await updateExtracurricular(selectedSchoolId.value, editingEkskulId.value, { ...editForm })
    if (res.success) {
      showEditModal.value = false
    }
  } catch (e: any) {
    if (e.data?.errors) {
      const errorMsg = Object.entries(e.data.errors)
        .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
        .join('\n')
      alert(`Gagal memperbarui ekskul:\n${errorMsg}`)
    } else {
      alert(e?.message ?? 'Gagal memperbarui ekskul')
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
                  class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title="Kelola Anggota Ekskul"
                >
                  <Users :size="13" />
                  <span>Anggota</span>
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
      <div class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pilih Ekstrakurikuler</label>
            <select
              v-model="selectedMonitorEkstraId"
              data-testid="monitor-ekstra-select"
              class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none focus:border-violet-600 min-w-[220px]"
            >
              <option value="" disabled>-- Pilih Ekskul --</option>
              <option v-for="ex in extracurriculars" :key="ex.id" :value="ex.id">{{ ex.name }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</label>
            <input
              type="date"
              v-model="monitorDate"
              data-testid="monitor-ekstra-date"
              class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none focus:border-violet-600"
            />
          </div>
        </div>

        <BaseButton variant="outline" @click="loadMonitorData" :disabled="loadingMonitor || !selectedMonitorEkstraId" class="gap-1.5 text-xs">
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
        <BaseInput v-model="ekskulForm.schedule" label="Jadwal Kegiatan" placeholder="Contoh: Sabtu, 09.00 - 11.00 WIB" />
        
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
        <BaseInput v-model="editForm.schedule" label="Jadwal Kegiatan" placeholder="Contoh: Sabtu, 09.00 - 11.00 WIB" />
        
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
    <BaseModal :show="showMembersModal" :title="`Anggota Ekstrakurikuler: ${membersEkskul?.name || ''}`" @close="showMembersModal = false">
      <div class="space-y-4">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="14" />
          <input
            type="text"
            v-model="memberSearch"
            placeholder="Cari nama atau NIS siswa..."
            class="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 outline-none focus:border-violet-600"
          />
        </div>

        <div v-if="loadingMembers" class="py-8 text-center text-xs text-slate-400">Memuat daftar siswa...</div>
        <div v-else class="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl">
          <label
            v-for="s in filteredSchoolStudents"
            :key="s.id"
            class="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer"
          >
            <div>
              <p class="font-bold text-slate-800 dark:text-zinc-200">{{ s.full_name }}</p>
              <p class="text-[10px] text-slate-400">NIS: {{ s.student_number || '-' }}</p>
            </div>
            <input
              type="checkbox"
              :checked="selectedMemberIds.includes(s.id)"
              @change="toggleMemberSelection(s.id)"
              class="w-4 h-4 rounded text-violet-600 border-slate-300 cursor-pointer"
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
