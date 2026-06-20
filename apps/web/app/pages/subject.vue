<script setup lang="ts">
import { BookOpen, Plus, Trash2, Edit2, ShieldAlert, CheckCircle2, Bookmark } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useSchool } from '../composables/useSchool'
import { useSubject } from '../composables/useSubject'

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

const { foundations, schools, fetchFoundations, fetchSchools, curriculumCategories, fetchCurriculumCategories } = useSchool()
const { subjects, fetchSubjects, createSubject, updateSubject, deleteSubject } = useSubject()

const selectedFoundationId = ref('')
const selectedSchoolId = ref('')
const typeFilter = ref('') // all

const filteredSchools = computed(() => {
  return schools.value.filter(s => s.level !== 'TK')
})

const selectedSchool = computed(() => {
  return filteredSchools.value.find(s => s.id === selectedSchoolId.value)
})

const selectedSchoolLevel = computed(() => {
  return selectedSchool.value?.level || ''
})

const showCreateModal = ref(false)
const showEditModal = ref(false)

const subjectForm = reactive({
  name: '',
  code: '',
  level: '',
  subject_category_id: '',
  is_active: true
})

const editingSubjectId = ref('')
const editForm = reactive({
  name: '',
  code: '',
  level: '',
  subject_category_id: '',
  is_active: true
})

onMounted(async () => {
  await fetchFoundations()
  if (foundations.value.length > 0) {
    selectedFoundationId.value = foundations.value[0].id
    await fetchSchools(selectedFoundationId.value)
    if (filteredSchools.value.length > 0) {
      selectedSchoolId.value = filteredSchools.value[0].id
      await fetchSubjects(selectedSchoolId.value, typeFilter.value || undefined)
      const school = filteredSchools.value.find(s => s.id === selectedSchoolId.value)
      if (school && school.curriculum_id) {
        await fetchCurriculumCategories(school.curriculum_id)
      }
    }
  }
})

watch(selectedFoundationId, async (newVal) => {
  if (newVal) {
    await fetchSchools(newVal)
    if (filteredSchools.value.length > 0) {
      selectedSchoolId.value = filteredSchools.value[0].id
    } else {
      selectedSchoolId.value = ''
      subjects.value = []
      curriculumCategories.value = []
    }
  }
})

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await fetchSubjects(newVal, typeFilter.value || undefined)
    const school = filteredSchools.value.find(s => s.id === newVal)
    if (school && school.curriculum_id) {
      await fetchCurriculumCategories(school.curriculum_id)
    } else {
      curriculumCategories.value = []
    }
  } else {
    subjects.value = []
    curriculumCategories.value = []
  }
})

watch(typeFilter, async (newVal) => {
  if (selectedSchoolId.value) {
    await fetchSubjects(selectedSchoolId.value, newVal || undefined)
  }
})

watch(selectedSchoolLevel, (newVal) => {
  subjectForm.level = newVal
}, { immediate: true })

const handleCreateSubject = async () => {
  try {
    subjectForm.level = selectedSchoolLevel.value
    const res = await createSubject(selectedSchoolId.value, { ...subjectForm })
    if (res.success) {
      showCreateModal.value = false
      Object.assign(subjectForm, {
        name: '',
        code: '',
        level: selectedSchoolLevel.value,
        subject_category_id: '',
        is_active: true
      })
    }
  } catch (e: any) {
    if (e.data?.errors) {
      const errorMsg = Object.entries(e.data.errors)
        .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
        .join('\n')
      alert(`Gagal menambah mata pelajaran:\n${errorMsg}`)
    } else {
      alert(e?.message ?? 'Gagal menambah mata pelajaran')
    }
  }
}

const openEditModal = (sub: any) => {
  editingSubjectId.value = sub.id
  Object.assign(editForm, {
    name: sub.name,
    code: sub.code,
    level: selectedSchoolLevel.value || sub.level || '',
    subject_category_id: sub.subject_category_id || '',
    is_active: !!sub.is_active
  })
  showEditModal.value = true
}

const handleUpdateSubject = async () => {
  try {
    const res = await updateSubject(selectedSchoolId.value, editingSubjectId.value, { ...editForm })
    if (res.success) {
      showEditModal.value = false
    }
  } catch (e: any) {
    if (e.data?.errors) {
      const errorMsg = Object.entries(e.data.errors)
        .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
        .join('\n')
      alert(`Gagal memperbarui mata pelajaran:\n${errorMsg}`)
    } else {
      alert(e?.message ?? 'Gagal memperbarui mata pelajaran')
    }
  }
}

const handleDeleteSubject = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus Mata Pelajaran ini?')) {
    try {
      await deleteSubject(selectedSchoolId.value, id)
    } catch (e: any) {
      alert(e?.message ?? 'Gagal menghapus mata pelajaran')
    }
  }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Manajemen Mata Pelajaran</h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Atur mata pelajaran intrakurikuler, kokurikuler, dan ekstrakurikuler.</p>
      </div>
      <div class="flex gap-2">
        <BaseButton variant="primary" @click="showCreateModal = true" :disabled="!selectedSchoolId" class="py-2.5 px-4 text-xs font-bold">
          <Plus class="mr-1.5" :size="14" /> Mata Pelajaran Baru
        </BaseButton>
      </div>
    </div>

    <!-- Filters and Selection -->
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
          <option v-for="school in filteredSchools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tipe Mapel</label>
        <select v-model="typeFilter" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
          <option value="">Semua Tipe</option>
          <option v-for="cat in curriculumCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
      </div>
    </div>

    <!-- Subjects Table -->
    <div class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            <th class="p-4 pl-6">Kode</th>
            <th class="p-4">Nama Mata Pelajaran</th>
            <th class="p-4">Tingkat</th>
            <th class="p-4">Tipe</th>
            <th class="p-4">Status</th>
            <th class="p-4 pr-6 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sub in subjects" :key="sub.id" class="border-b border-slate-100 dark:border-zinc-800/80 last:border-0 hover:bg-slate-50/20 dark:hover:bg-zinc-900/20 transition-colors">
            <td class="p-4 pl-6 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase">{{ sub.code }}</td>
            <td class="p-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded bg-violet-50 dark:bg-zinc-850 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <Bookmark :size="16" />
                </div>
                <span class="font-bold text-slate-800 dark:text-zinc-200 text-sm">{{ sub.name }}</span>
              </div>
            </td>
            <td class="p-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">{{ sub.level || '-' }}</td>
            <td class="p-4">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold"
                :class="{
                  'bg-violet-500/10 text-violet-600 border border-violet-500/20': sub.category_code === 'INTRA' || sub.type === 'intrakurikuler',
                  'bg-amber-500/10 text-amber-600 border border-amber-500/20': sub.category_code === 'KOKURI' || sub.type === 'kokurikuler',
                  'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20': sub.category_code === 'EKSKUL' || sub.type === 'ekstrakurikuler',
                  'bg-slate-500/10 text-slate-600 border border-slate-500/20': sub.category_code !== 'INTRA' && sub.category_code !== 'KOKURI' && sub.category_code !== 'EKSKUL' && sub.type !== 'intrakurikuler' && sub.type !== 'kokurikuler' && sub.type !== 'ekstrakurikuler'
                }">
                {{ sub.category_name || sub.type }}
              </span>
            </td>
            <td class="p-4">
              <span v-if="sub.is_active" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 :size="11" /> Aktif
              </span>
              <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                Nonaktif
              </span>
            </td>
            <td class="p-4 pr-6 text-right">
              <div class="flex justify-end items-center gap-1">
                <button @click="openEditModal(sub)" class="p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  <Edit2 :size="14" />
                </button>
                <button @click="handleDeleteSubject(sub.id)" class="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 transition-colors">
                  <Trash2 :size="14" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="subjects.length === 0">
            <td colspan="6" class="p-12 text-center text-slate-400 dark:text-zinc-500">
              <BookOpen class="mx-auto mb-2 opacity-50" :size="32" />
              <p class="text-xs font-semibold">Belum ada data Mata Pelajaran.</p>
              <p class="text-[10px] mt-1">Klik tombol 'Mata Pelajaran Baru' untuk menambahkan data.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Modal -->
    <BaseModal :show="showCreateModal" title="Mata Pelajaran Baru" @close="showCreateModal = false">
      <form @submit.prevent="handleCreateSubject" class="space-y-4">
        <BaseInput v-model="subjectForm.name" label="Nama Mata Pelajaran" placeholder="Contoh: Matematika Wajib" required />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="subjectForm.code" label="Kode Mapel" placeholder="Contoh: MTK" required />
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tingkat / Jenjang</label>
            <select v-model="subjectForm.level" disabled class="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none opacity-70 cursor-not-allowed">
              <option value="">Pilih Tingkat</option>
              <option value="TK">TK / KB / PAUD</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA / SMK</option>
            </select>
          </div>
        </div>
        
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tipe Mapel</label>
          <select v-model="subjectForm.subject_category_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="" disabled>Pilih Tipe Mapel</option>
            <option v-for="cat in curriculumCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <div class="flex items-center gap-2 px-1 py-1">
          <input type="checkbox" id="is_active_subject_create" v-model="subjectForm.is_active" class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20" />
          <label for="is_active_subject_create" class="text-xs font-semibold text-slate-600 dark:text-zinc-400">Aktifkan mata pelajaran ini</label>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showCreateModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Edit Modal -->
    <BaseModal :show="showEditModal" title="Ubah Mata Pelajaran" @close="showEditModal = false">
      <form @submit.prevent="handleUpdateSubject" class="space-y-4">
        <BaseInput v-model="editForm.name" label="Nama Mata Pelajaran" placeholder="Contoh: Matematika Wajib" required />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="editForm.code" label="Kode Mapel" placeholder="Contoh: MTK" required />
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tingkat / Jenjang</label>
            <select v-model="editForm.level" disabled class="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none opacity-70 cursor-not-allowed">
              <option value="">Pilih Tingkat</option>
              <option value="TK">TK / KB / PAUD</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA / SMK</option>
            </select>
          </div>
        </div>
        
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tipe Mapel</label>
          <select v-model="editForm.subject_category_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="" disabled>Pilih Tipe Mapel</option>
            <option v-for="cat in curriculumCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <div class="flex items-center gap-2 px-1 py-1">
          <input type="checkbox" id="is_active_subject_edit" v-model="editForm.is_active" class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20" />
          <label for="is_active_subject_edit" class="text-xs font-semibold text-slate-600 dark:text-zinc-400">Mata pelajaran aktif</label>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showEditModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Perubahan</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
