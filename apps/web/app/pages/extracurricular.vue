<script setup lang="ts">
import { Trophy, Plus, Trash2, Edit2, ShieldAlert, CheckCircle2, User, Clock } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useSchool } from '../composables/useSchool'
import { useExtracurricular } from '../composables/useExtracurricular'

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

const { foundations, schools, fetchFoundations, fetchSchools } = useSchool()
const { extracurriculars, fetchExtracurriculars, createExtracurricular, updateExtracurricular, deleteExtracurricular } = useExtracurricular()

const selectedFoundationId = ref('')
const selectedSchoolId = ref('')

const showCreateModal = ref(false)
const showEditModal = ref(false)

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
  await fetchFoundations()
  if (foundations.value.length > 0) {
    selectedFoundationId.value = foundations.value[0].id
    await fetchSchools(selectedFoundationId.value)
    if (schools.value.length > 0) {
      selectedSchoolId.value = schools.value[0].id
      await fetchExtracurriculars(selectedSchoolId.value)
    }
  }
})

watch(selectedFoundationId, async (newVal) => {
  if (newVal) {
    await fetchSchools(newVal)
    if (schools.value.length > 0) {
      selectedSchoolId.value = schools.value[0].id
    } else {
      selectedSchoolId.value = ''
      extracurriculars.value = []
    }
  }
})

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await fetchExtracurriculars(newVal)
  } else {
    extracurriculars.value = []
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
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
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
    </div>

    <!-- Extracurriculars Table -->
    <div class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
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

    <!-- Create Modal -->
    <BaseModal :show="showCreateModal" title="Ekstrakurikuler Baru" @close="showCreateModal = false">
      <form @submit.prevent="handleCreateEkskul" class="space-y-4">
        <BaseInput v-model="ekskulForm.name" label="Nama Ekstrakurikuler" placeholder="Contoh: Pramuka Utama" required />
        <BaseInput v-model="ekskulForm.instructor" label="Pelatih / Instruktur" placeholder="Contoh: Kak Budi Santoso" />
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
        <BaseInput v-model="editForm.instructor" label="Pelatih / Instruktur" placeholder="Contoh: Kak Budi Santoso" />
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
  </div>
</template>
