<script setup lang="ts">
import { useSchoolContext } from '../../composables/useSchoolContext'
import { Users, Plus, Trash2, ShieldAlert, CheckCircle2 } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal } from '@eduraport/ui'
import { useCounseling } from '../../composables/useCounseling'
import { useTeacher } from '../../composables/useTeacher'

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
const { counselors, fetchCounselors, createCounselor, deleteCounselor, updateCounselor } = useCounseling()
const { teachers, fetchTeachers } = useTeacher()

const filteredSchools = computed(() => {
  return schools.value.filter(s => s.level !== 'TK')
})

const showCreateModal = ref(false)

const counselorForm = reactive({
  teacher_id: '',
  is_active: true
})

watch(selectedFoundationId, onFoundationChange)

onMounted(async () => {
  await initContext()
  
  if (filteredSchools.value.length > 0 && !filteredSchools.value.find(s => s.id === selectedSchoolId.value)) {
    selectedSchoolId.value = filteredSchools.value[0].id
  }

  if (selectedSchoolId.value) {
    await fetchCounselors(selectedSchoolId.value)
    // Fetch teachers up to 100 to show in dropdown
    await fetchTeachers(selectedSchoolId.value, 1, 100)
  }
})

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await fetchCounselors(newVal)
    await fetchTeachers(newVal, 1, 100)
  } else {
    counselors.value = []
    teachers.value = []
  }
})

const handleCreateCounselor = async () => {
  if (!counselorForm.teacher_id) {
    alert('Pilih guru terlebih dahulu')
    return
  }

  try {
    const res = await createCounselor(selectedSchoolId.value, { ...counselorForm })
    if (res.success) {
      showCreateModal.value = false
      counselorForm.teacher_id = ''
      counselorForm.is_active = true
    }
  } catch (e: any) {
    alert(e?.message ?? 'Gagal menambah guru BK')
  }
}

const handleToggleStatus = async (counselor: any) => {
  try {
    await updateCounselor(selectedSchoolId.value, counselor.id, { is_active: !counselor.is_active })
  } catch (e: any) {
    alert(e?.message ?? 'Gagal mengubah status guru BK')
  }
}

const handleDeleteCounselor = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus Guru BK ini?')) {
    try {
      await deleteCounselor(selectedSchoolId.value, id)
    } catch (e: any) {
      alert(e?.message ?? 'Gagal menghapus guru BK')
    }
  }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Manajemen Guru BK</h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Atur staf guru Bimbingan Konseling yang bertugas.</p>
      </div>
      <div class="flex gap-2">
        <BaseButton variant="primary" @click="showCreateModal = true" :disabled="!selectedSchoolId" class="py-2.5 px-4 text-xs font-bold">
          <Plus class="mr-1.5" :size="14" /> Tambah Guru BK
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
        <select v-model="selectedSchoolId" :disabled="!selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 disabled:opacity-50 text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Unit Sekolah</option>
          <option v-for="school in filteredSchools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>
    </div>

    <!-- List Guru BK -->
    <BaseCard class="overflow-hidden border-slate-200/60 dark:border-zinc-800/80 shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
            <tr>
              <th scope="col" class="px-6 py-4 font-semibold uppercase tracking-wider">Nama Guru</th>
              <th scope="col" class="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
              <th scope="col" class="px-6 py-4 font-semibold text-right uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/50">
            <tr v-for="counselor in counselors" :key="counselor.id" class="hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors">
              <td class="px-6 py-4">
                <div class="font-semibold text-slate-900 dark:text-zinc-100">{{ counselor.teacher?.name || '-' }}</div>
                <div class="text-xs text-slate-500">{{ counselor.teacher?.nip || 'No NIP' }}</div>
              </td>
              <td class="px-6 py-4">
                <span 
                  @click="handleToggleStatus(counselor)"
                  class="cursor-pointer inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
                  :class="counselor.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20'"
                >
                  <CheckCircle2 v-if="counselor.is_active" class="w-3 h-3 mr-1" />
                  <ShieldAlert v-else class="w-3 h-3 mr-1" />
                  {{ counselor.is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style="opacity: 1">
                  <button @click="handleDeleteCounselor(counselor.id)" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" title="Hapus">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="counselors.length === 0">
              <td colspan="3" class="px-6 py-12 text-center text-slate-500 dark:text-zinc-400">
                <div class="flex flex-col items-center justify-center gap-3">
                  <div class="w-12 h-12 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <Users class="w-6 h-6 text-slate-400" />
                  </div>
                  <p>Belum ada data Guru BK</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- Create Modal -->
    <BaseModal :show="showCreateModal" title="Tambah Guru BK" size="md" @close="showCreateModal = false">
      <div class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Pilih Guru</label>
          <select v-model="counselorForm.teacher_id" class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
            <option value="" disabled>-- Pilih Guru --</option>
            <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">{{ teacher.name }}</option>
          </select>
        </div>
        
        <div class="flex items-center gap-2">
          <input type="checkbox" id="isActive" v-model="counselorForm.is_active" class="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-600">
          <label for="isActive" class="text-sm font-medium text-slate-700 dark:text-zinc-300">Status Aktif</label>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <BaseButton variant="outline" @click="showCreateModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="handleCreateCounselor">Simpan</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
