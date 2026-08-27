<script setup lang="ts">
import { Calendar, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Play, Copy } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput, BaseDateInput } from '@eduraport/ui'
import { useSchoolContext } from '../composables/useSchoolContext'
import { useAcademicYear } from '../composables/useAcademicYear'
import { useToast } from '../composables/useToast'

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
const { academicYears, fetchAcademicYears, createAcademicYear, updateAcademicYear, deleteAcademicYear, activateAcademicYear, cloneClasses } = useAcademicYear()
const toast = useToast()

const showCreateModal = ref(false)
const showEditModal = ref(false)

const yearForm = reactive({
  name: '',
  start_date: '',
  end_date: '',
  is_active: false
})

const editingYearId = ref('')
const editForm = reactive({
  name: '',
  start_date: '',
  end_date: '',
  is_active: false
})

const showCloneModal = ref(false)
const cloneTargetYearId = ref('')
const cloneSourceYearId = ref('')
const cloneLoading = ref(false)

const availableSourceYears = computed(() => {
  return academicYears.value.filter((y: any) => y.id !== cloneTargetYearId.value)
})


onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) await fetchAcademicYears(schoolId)
})

watch(selectedFoundationId, (newVal) => onFoundationChange(newVal))

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await fetchAcademicYears(newVal)
  } else {
    academicYears.value = []
  }
})

const handleCreateYear = async () => {
  try {
    const res = await createAcademicYear(selectedSchoolId.value, { ...yearForm })
    if (res.success) {
      showCreateModal.value = false
      Object.assign(yearForm, {
        name: '',
        start_date: '',
        end_date: '',
        is_active: false
      })
    }
  } catch (e: any) {
    if (e.data?.errors) {
      const errorMsg = Object.entries(e.data.errors)
        .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
        .join('\n')
      toast.error(`Gagal menambah tahun ajaran:\n${errorMsg}`)
    } else {
      toast.error(e?.message ?? 'Gagal menambah tahun ajaran')
    }
  }
}

const openEditModal = (year: any) => {
  editingYearId.value = year.id
  Object.assign(editForm, {
    name: year.name,
    start_date: year.start_date ? new Date(year.start_date).toISOString().split('T')[0] : '',
    end_date: year.end_date ? new Date(year.end_date).toISOString().split('T')[0] : '',
    is_active: !!year.is_active
  })
  showEditModal.value = true
}

const handleUpdateYear = async () => {
  try {
    const res = await updateAcademicYear(selectedSchoolId.value, editingYearId.value, { ...editForm })
    if (res.success) {
      showEditModal.value = false
    }
  } catch (e: any) {
    if (e.data?.errors) {
      const errorMsg = Object.entries(e.data.errors)
        .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
        .join('\n')
      toast.error(`Gagal memperbarui tahun ajaran:\n${errorMsg}`)
    } else {
      toast.error(e?.message ?? 'Gagal memperbarui tahun ajaran')
    }
  }
}

const handleDeleteYear = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus Tahun Ajaran ini?')) {
    try {
      await deleteAcademicYear(selectedSchoolId.value, id)
      toast.success('Berhasil menghapus tahun ajaran')
    } catch (e: any) {
      toast.error(e?.message ?? 'Gagal menghapus tahun ajaran')
    }
  }
}

const handleActivateYear = async (id: string) => {
  try {
    const res = await activateAcademicYear(selectedSchoolId.value, id)
    if (res.success) {
      toast.success('Tahun ajaran berhasil diaktifkan.')
    }
  } catch (e: any) {
    toast.error(e?.message ?? 'Gagal mengaktifkan tahun ajaran')
  }
}

const openCloneModal = (targetYearId: string) => {
  cloneTargetYearId.value = targetYearId
  cloneSourceYearId.value = ''
  showCloneModal.value = true
}

const handleCloneSubmit = async () => {
  if (!cloneSourceYearId.value) {
    toast.error('Pilih tahun ajaran asal')
    return
  }
  
  cloneLoading.value = true
  try {
    const res: any = await cloneClasses(selectedSchoolId.value, cloneTargetYearId.value, cloneSourceYearId.value)
    if (res.success) {
      toast.success(res.message || 'Berhasil menyalin kelas')
      showCloneModal.value = false
    } else {
      toast.error(res.message || 'Gagal menyalin kelas')
    }
  } catch (e: any) {
    toast.error(e?.message || 'Gagal menyalin kelas')
  } finally {
    cloneLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Manajemen Tahun Ajaran</h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Atur periode tahun ajaran aktif untuk unit sekolah.</p>
      </div>
      <div class="flex gap-2">
        <BaseButton variant="primary" @click="showCreateModal = true" :disabled="!selectedSchoolId" class="py-2.5 px-4 text-xs font-bold">
          <Plus class="mr-1.5" :size="14" /> Tahun Ajaran Baru
        </BaseButton>
      </div>
    </div>

    <!-- Filters and Selection (only for foundation-level users) -->
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

    <!-- Academic Years Table -->
    <div class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            <th class="p-4 pl-6">Nama Tahun Ajaran</th>
            <th class="p-4">Tanggal Mulai</th>
            <th class="p-4">Tanggal Selesai</th>
            <th class="p-4">Status</th>
            <th class="p-4 pr-6 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="year in academicYears" :key="year.id" class="border-b border-slate-100 dark:border-zinc-800/80 last:border-0 hover:bg-slate-50/20 dark:hover:bg-zinc-900/20 transition-colors">
            <td class="p-4 pl-6">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded bg-violet-50 dark:bg-zinc-850 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <Calendar :size="16" />
                </div>
                <span class="font-bold text-slate-800 dark:text-zinc-200 text-sm">{{ year.name }}</span>
              </div>
            </td>
            <td class="p-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">{{ year.start_date }}</td>
            <td class="p-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">{{ year.end_date }}</td>
            <td class="p-4">
              <span v-if="year.is_active" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 :size="12" /> Aktif
              </span>
              <span v-else class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                Nonaktif
              </span>
            </td>
            <td class="p-4 pr-6 text-right">
              <div class="flex justify-end items-center gap-1.5">
                <BaseButton v-if="!year.is_active" @click="handleActivateYear(year.id)" variant="outline" class="py-1.5 px-3 text-[10px] font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/30">
                  <Play :size="12" class="mr-1" /> Aktifkan
                </BaseButton>
                <BaseButton @click="openCloneModal(year.id)" variant="outline" class="py-1.5 px-3 text-[10px] font-bold text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30">
                  <Copy :size="12" class="mr-1" /> Salin Kelas
                </BaseButton>
                <button @click="openEditModal(year)" class="p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors" title="Ubah">
                  <Edit2 :size="14" />
                </button>
                <button @click="handleDeleteYear(year.id)" :disabled="year.is_active" class="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 transition-colors disabled:opacity-30 disabled:pointer-events-none" title="Hapus">
                  <Trash2 :size="14" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="academicYears.length === 0">
            <td colspan="5" class="p-12 text-center text-slate-400 dark:text-zinc-500">
              <Calendar class="mx-auto mb-2 opacity-50" :size="32" />
              <p class="text-xs font-semibold">Belum ada data Tahun Ajaran.</p>
              <p class="text-[10px] mt-1">Klik tombol 'Tahun Ajaran Baru' untuk menambahkan data.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Modal -->
    <BaseModal :show="showCreateModal" title="Tahun Ajaran Baru" @close="showCreateModal = false">
      <form @submit.prevent="handleCreateYear" class="space-y-4">
        <BaseInput v-model="yearForm.name" label="Nama Tahun Ajaran" placeholder="Contoh: 2026/2027" required />
        <div class="grid grid-cols-2 gap-4">
          <BaseDateInput v-model="yearForm.start_date" label="Tanggal Mulai" required />
          <BaseDateInput v-model="yearForm.end_date" label="Tanggal Selesai" required />
        </div>
        <div class="flex items-center gap-2 px-1 py-1">
          <input type="checkbox" id="is_active_create" v-model="yearForm.is_active" class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20" />
          <label for="is_active_create" class="text-xs font-semibold text-slate-600 dark:text-zinc-400">Set sebagai tahun ajaran aktif</label>
        </div>
        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showCreateModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Edit Modal -->
    <BaseModal :show="showEditModal" title="Ubah Tahun Ajaran" @close="showEditModal = false">
      <form @submit.prevent="handleUpdateYear" class="space-y-4">
        <BaseInput v-model="editForm.name" label="Nama Tahun Ajaran" placeholder="Contoh: 2026/2027" required />
        <div class="grid grid-cols-2 gap-4">
          <BaseDateInput v-model="editForm.start_date" label="Tanggal Mulai" required />
          <BaseDateInput v-model="editForm.end_date" label="Tanggal Selesai" required />
        </div>
        <div class="flex items-center gap-2 px-1 py-1">
          <input type="checkbox" id="is_active_edit" v-model="editForm.is_active" class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20" />
          <label for="is_active_edit" class="text-xs font-semibold text-slate-600 dark:text-zinc-400">Set sebagai tahun ajaran aktif</label>
        </div>
        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showEditModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Perubahan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Clone Classes Modal -->
    <BaseModal :show="showCloneModal" title="Salin Kelas" @close="showCloneModal = false">
      <div class="space-y-4">
        <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl mb-2">
          <div class="flex gap-3">
            <AlertCircle class="text-amber-500 shrink-0 mt-0.5" :size="16" />
            <div class="text-xs text-amber-800 dark:text-amber-400/90 leading-relaxed">
              <span class="font-bold">Perhatian:</span> Aksi ini akan menyalin semua Rombongan Belajar (Kelas) dari tahun ajaran asal ke tahun ajaran tujuan. Siswa dan Wali Kelas <b>tidak</b> ikut disalin.
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tahun Ajaran Asal</label>
          <select v-model="cloneSourceYearId" class="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 transition-all text-slate-900 dark:text-zinc-100">
            <option value="" disabled>Pilih Tahun Ajaran...</option>
            <option v-for="y in availableSourceYears" :key="y.id" :value="y.id">{{ y.name }}</option>
          </select>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-2">
          <BaseButton variant="outline" @click="showCloneModal = false" :disabled="cloneLoading">Batal</BaseButton>
          <BaseButton variant="primary" @click="handleCloneSubmit" :disabled="cloneLoading || !cloneSourceYearId">
            <span v-if="cloneLoading">Memproses...</span>
            <span v-else>Salin Kelas</span>
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
