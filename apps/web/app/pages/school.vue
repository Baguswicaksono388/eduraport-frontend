<script setup lang="ts">
import { GraduationCap, School, Plus, Trash2, ShieldAlert, Edit2, MapPin, Mail, Phone, BookOpen } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useSchool } from '../composables/useSchool'

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

const {
  foundations,
  schools,
  curriculums,
  curriculumCategories,
  fetchFoundations,
  createFoundation,
  updateFoundation,
  deleteFoundation,
  fetchCurriculums,
  createCurriculum,
  updateCurriculum,
  deleteCurriculum,
  fetchCurriculumCategories,
  createCurriculumCategory,
  updateCurriculumCategory,
  deleteCurriculumCategory,
  fetchSchools,
  createSchool,
  updateSchool,
  deleteSchool
} = useSchool()

const selectedFoundationId = ref('')
const showFoundationModal = ref(false)
const showSchoolModal = ref(false)
const isEditingSchool = ref(false)
const editingSchoolId = ref('')
const logoFile = ref<File | null>(null)
const showCurriculumModal = ref(false)
const showCategoriesModal = ref(false)

const isEditMode = ref(false)
const editingFoundationId = ref('')

const isEditingCurriculum = ref(false)
const editingCurriculumId = ref('')

const selectedCurriculumForCategories = ref<any>(null)
const showCategoryForm = ref(false)
const isEditingCategory = ref(false)
const editingCategoryId = ref('')

const foundationForm = reactive({
  name: '',
  foundation_code: '',
  address: '',
  email: '',
  phone: ''
})

const schoolForm = reactive({
  foundation_id: '',
  name: '',
  level: 'TK',
  npsn: '',
  nsm: '',
  address: '',
  curriculum_id: '',
  accreditation_status: 'A',
  logo: '',
  logo_dinas: ''
})

const logoDinasFile = ref<File | null>(null)

const curriculumForm = reactive({
  name: '',
  code: '',
  description: '',
  is_active: true
})

const selectedFoundation = computed(() => {
  return foundations.value.find(f => f.id === selectedFoundationId.value)
})

onMounted(async () => {
  await fetchFoundations()
  if (foundations.value.length > 0) {
    selectedFoundationId.value = foundations.value[0].id
    await Promise.all([
      fetchSchools(selectedFoundationId.value),
      fetchCurriculums(selectedFoundationId.value)
    ])
  }
})

watch(selectedFoundationId, async (newVal) => {
  if (newVal) {
    await Promise.all([
      fetchSchools(newVal),
      fetchCurriculums(newVal)
    ])
  }
})

const openCreateFoundationModal = () => {
  isEditMode.value = false
  editingFoundationId.value = ''
  Object.assign(foundationForm, {
    name: '',
    foundation_code: '',
    address: '',
    email: '',
    phone: ''
  })
  showFoundationModal.value = true
}

const openEditFoundationModal = () => {
  if (!selectedFoundation.value) return
  isEditMode.value = true
  editingFoundationId.value = selectedFoundation.value.id
  Object.assign(foundationForm, {
    name: selectedFoundation.value.name,
    foundation_code: selectedFoundation.value.foundation_code,
    address: selectedFoundation.value.address || '',
    email: selectedFoundation.value.email || '',
    phone: selectedFoundation.value.phone || ''
  })
  showFoundationModal.value = true
}

const handleSaveFoundation = async () => {
  if (isEditMode.value) {
    const res = await updateFoundation(editingFoundationId.value, { ...foundationForm })
    if (res.success) {
      showFoundationModal.value = false
      Object.assign(foundationForm, { name: '', foundation_code: '', address: '', email: '', phone: '' })
    }
  } else {
    const res = await createFoundation({ ...foundationForm })
    if (res.success) {
      showFoundationModal.value = false
      Object.assign(foundationForm, { name: '', foundation_code: '', address: '', email: '', phone: '' })
      if (foundations.value.length > 0 && !selectedFoundationId.value) {
        selectedFoundationId.value = foundations.value[0].id
      }
    }
  }
}

const openCreateCurriculumModal = () => {
  isEditingCurriculum.value = false
  editingCurriculumId.value = ''
  Object.assign(curriculumForm, {
    name: '',
    code: '',
    description: '',
    is_active: true
  })
  showCurriculumModal.value = true
}

const openEditCurriculumModal = (curr: any) => {
  isEditingCurriculum.value = true
  editingCurriculumId.value = curr.id
  Object.assign(curriculumForm, {
    name: curr.name,
    code: curr.code || '',
    description: curr.description || '',
    is_active: !!curr.is_active
  })
  showCurriculumModal.value = true
}

const handleSaveCurriculum = async () => {
  const payload = {
    ...curriculumForm,
    foundation_id: selectedFoundationId.value
  }
  let res;
  if (isEditingCurriculum.value) {
    res = await updateCurriculum(editingCurriculumId.value, payload)
  } else {
    res = await createCurriculum(payload)
  }
  if (res.success) {
    showCurriculumModal.value = false
    Object.assign(curriculumForm, {
      name: '',
      code: '',
      description: '',
      is_active: true
    })
  }
}

const handleDeleteCurriculum = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus kurikulum ini?')) {
    await deleteCurriculum(id, selectedFoundationId.value)
  }
}

const openCategoriesModal = async (curr: any) => {
  selectedCurriculumForCategories.value = curr
  await fetchCurriculumCategories(curr.id)
  showCategoriesModal.value = true
  showCategoryForm.value = false
}

const openCreateCategory = () => {
  isEditingCategory.value = false
  editingCategoryId.value = ''
  Object.assign(categoryForm, { name: '', code: '', description: '' })
  showCategoryForm.value = true
}

const openEditCategory = (cat: any) => {
  isEditingCategory.value = true
  editingCategoryId.value = cat.id
  Object.assign(categoryForm, {
    name: cat.name,
    code: cat.code,
    description: cat.description || ''
  })
  showCategoryForm.value = true
}

const handleSaveCategory = async () => {
  const payload = {
    ...categoryForm,
    curriculum_id: selectedCurriculumForCategories.value.id
  }
  let res
  if (isEditingCategory.value) {
    res = await updateCurriculumCategory(editingCategoryId.value, payload)
  } else {
    res = await createCurriculumCategory(payload)
  }
  if (res.success) {
    showCategoryForm.value = false
    Object.assign(categoryForm, { name: '', code: '', description: '' })
  }
}

const handleDeleteCategory = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
    await deleteCurriculumCategory(id, selectedCurriculumForCategories.value.id)
  }
}

const categoryForm = reactive({
  name: '',
  code: '',
  description: ''
})

const openCreateSchoolModal = () => {
  isEditingSchool.value = false
  editingSchoolId.value = ''
  Object.assign(schoolForm, {
    foundation_id: '',
    name: '',
    level: 'TK',
    npsn: '',
    nsm: '',
    address: '',
    curriculum_id: '',
    accreditation_status: 'A',
    logo: '',
    logo_dinas: ''
  })
  logoFile.value = null
  logoDinasFile.value = null
  showSchoolModal.value = true
}

const openEditSchoolModal = (school: any) => {
  isEditingSchool.value = true
  editingSchoolId.value = school.id
  Object.assign(schoolForm, {
    foundation_id: school.foundation_id || '',
    name: school.name || '',
    level: school.level || 'TK',
    npsn: school.npsn || '',
    nsm: school.nsm || '',
    address: school.address || '',
    curriculum_id: school.curriculum_id || '',
    accreditation_status: school.accreditation_status || 'A',
    logo: school.logo || '',
    logo_dinas: school.logo_dinas || ''
  })
  logoFile.value = null
  logoDinasFile.value = null
  showSchoolModal.value = true
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

const handleSaveSchool = async () => {
  if (logoFile.value) {
    try {
      schoolForm.logo = await fileToBase64(logoFile.value)
    } catch (e) {
      console.error('Failed to read logo file', e)
    }
  }
  if (logoDinasFile.value) {
    try {
      schoolForm.logo_dinas = await fileToBase64(logoDinasFile.value)
    } catch (e) {
      console.error('Failed to read logo dinas file', e)
    }
  }

  schoolForm.foundation_id = selectedFoundationId.value
  let res
  if (isEditingSchool.value) {
    res = await updateSchool(editingSchoolId.value, { ...schoolForm })
  } else {
    res = await createSchool({ ...schoolForm })
  }

  if (res.success) {
    showSchoolModal.value = false
    Object.assign(schoolForm, {
      foundation_id: '',
      name: '',
      level: 'TK',
      npsn: '',
      nsm: '',
      address: '',
      curriculum_id: '',
      accreditation_status: 'A',
      logo: '',
      logo_dinas: ''
    })
    logoFile.value = null
    logoDinasFile.value = null
  }
}

const handleDeleteFoundation = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus Yayasan ini? Semua data sekolah di dalamnya akan terpengaruh.')) {
    await deleteFoundation(id)
    if (selectedFoundationId.value === id) {
      selectedFoundationId.value = foundations.value[0]?.id || ''
    }
  }
}

const handleDeleteSchool = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus unit Sekolah ini?')) {
    await deleteSchool(id, selectedFoundationId.value)
  }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Kelola Unit Sekolah</h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Atur unit Yayasan dan Unit Sekolah di bawahnya.</p>
      </div>
      <div class="flex gap-2">
        <BaseButton variant="outline" @click="openCreateFoundationModal" class="py-2.5 px-4 text-xs font-bold">
          <Plus class="mr-1.5" :size="14" /> Yayasan Baru
        </BaseButton>
        <BaseButton variant="primary" @click="openCreateSchoolModal" :disabled="!selectedFoundationId" class="py-2.5 px-4 text-xs font-bold">
          <Plus class="mr-1.5" :size="14" /> Unit Sekolah Baru
        </BaseButton>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Sidebar / Yayasan List -->
      <div class="lg:col-span-1 space-y-3">
        <h3 class="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-zinc-400 px-1">Daftar Yayasan</h3>
        <div class="flex flex-col gap-2">
          <div
            v-for="foundation in foundations"
            :key="foundation.id"
            @click="selectedFoundationId = foundation.id"
            class="w-full text-left p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between group"
            :class="[
              selectedFoundationId === foundation.id
                ? 'bg-violet-50/50 border-violet-600 dark:bg-violet-950/20 dark:border-violet-400 text-violet-900 dark:text-violet-300 shadow-sm'
                : 'bg-white dark:bg-zinc-900/60 border-slate-200/60 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
            ]"
          >
            <div class="flex items-center gap-3">
              <GraduationCap class="text-slate-400" :size="18" />
              <div>
                <p class="font-bold text-sm leading-snug">{{ foundation.name }}</p>
                <p class="text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 mt-0.5">{{ foundation.foundation_code }}</p>
              </div>
            </div>
            <button
              @click.stop="handleDeleteFoundation(foundation.id)"
              class="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 :size="14" />
            </button>
          </div>

          <div v-if="foundations.length === 0" class="text-center p-8 bg-white/50 dark:bg-zinc-900/40 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800">
            <ShieldAlert class="mx-auto text-slate-300 mb-2" :size="24" />
            <p class="text-xs text-slate-500 dark:text-zinc-400 font-medium">Belum ada Yayasan</p>
          </div>
        </div>
      </div>

      <!-- Schools Grid & Foundation Detail -->
      <div class="lg:col-span-3 space-y-6">
        <!-- Foundation Detail Card -->
        <div v-if="selectedFoundation" class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-bold text-slate-900 dark:text-zinc-100 leading-snug">{{ selectedFoundation.name }}</h3>
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 uppercase tracking-wider">
                  {{ selectedFoundation.foundation_code }}
                </span>
              </div>
              <p class="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">ID: {{ selectedFoundation.id }}</p>
            </div>
            <BaseButton variant="outline" @click="openEditFoundationModal" class="py-1.5 px-2.5 text-[11px] font-bold flex items-center gap-1 shrink-0">
              <Edit2 :size="11" /> Edit Detail
            </BaseButton>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800/80 text-[11px]">
            <div class="flex items-start gap-2.5 text-slate-600 dark:text-zinc-450">
              <MapPin class="text-slate-400 mt-0.5 shrink-0" :size="14" />
              <div>
                <span class="block font-bold text-slate-400 dark:text-zinc-500 text-[9px] uppercase tracking-wider">Alamat</span>
                <span class="text-slate-755 dark:text-zinc-350 font-medium">{{ selectedFoundation.address || '-' }}</span>
              </div>
            </div>
            <div class="flex items-start gap-2.5 text-slate-600 dark:text-zinc-450">
              <Mail class="text-slate-400 mt-0.5 shrink-0" :size="14" />
              <div>
                <span class="block font-bold text-slate-400 dark:text-zinc-500 text-[9px] uppercase tracking-wider">Email</span>
                <span class="text-slate-755 dark:text-zinc-350 font-medium">{{ selectedFoundation.email || '-' }}</span>
              </div>
            </div>
            <div class="flex items-start gap-2.5 text-slate-600 dark:text-zinc-450">
              <Phone class="text-slate-400 mt-0.5 shrink-0" :size="14" />
              <div>
                <span class="block font-bold text-slate-400 dark:text-zinc-500 text-[9px] uppercase tracking-wider">Telepon</span>
                <span class="text-slate-755 dark:text-zinc-350 font-medium">{{ selectedFoundation.phone || '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Curriculum Management Card -->
        <div v-if="selectedFoundation" class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <BookOpen class="text-violet-600 dark:text-violet-400" :size="16" />
              Master Kurikulum Yayasan
            </h3>
            <BaseButton variant="outline" @click="openCreateCurriculumModal" class="py-1.5 px-2.5 text-[11px] font-bold flex items-center gap-1">
              <Plus :size="11" /> Tambah Kurikulum
            </BaseButton>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="curr in curriculums" :key="curr.id" class="p-3.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 flex items-start justify-between group">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <p class="font-bold text-xs text-slate-800 dark:text-zinc-200 leading-snug">{{ curr.name }}</p>
                  <span v-if="curr.code" class="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30 uppercase">
                    {{ curr.code }}
                  </span>
                </div>
                <p class="text-[10px] text-slate-500 dark:text-zinc-450 leading-relaxed">{{ curr.description || 'Tidak ada deskripsi' }}</p>
              </div>
              <div class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                <button @click="openCategoriesModal(curr)" class="p-1 text-slate-450 hover:text-violet-600 transition-colors" title="Kelola Kategori Mapel">
                  <BookOpen :size="12" />
                </button>
                <button @click="openEditCurriculumModal(curr)" class="p-1 text-slate-450 hover:text-violet-600 transition-colors">
                  <Edit2 :size="12" />
                </button>
                <button @click="handleDeleteCurriculum(curr.id)" class="p-1 text-slate-450 hover:text-rose-600 transition-colors">
                  <Trash2 :size="12" />
                </button>
              </div>
            </div>

            <div v-if="curriculums.length === 0" class="col-span-2 text-center py-8 text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/20 dark:bg-zinc-900/10 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800">
              Belum ada data Kurikulum master untuk Yayasan ini.
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-zinc-400 px-1">Unit Sekolah Terdaftar</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseCard v-for="school in schools" :key="school.id" stripe class="relative group hover:border-slate-300 dark:hover:border-zinc-700">
              <div class="flex items-start justify-between">
                <div class="flex gap-4">
                  <div class="w-10 h-10 bg-violet-50 dark:bg-zinc-800/80 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <School :size="20" />
                  </div>
                  <div class="space-y-1">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30">
                      {{ school.level }}
                    </span>
                    <h4 class="font-bold text-sm text-slate-900 dark:text-zinc-100 pt-1 leading-snug">{{ school.name }}</h4>
                    <p class="text-xs text-slate-500 dark:text-zinc-400 font-medium">Kurikulum: {{ school.curriculum_name || '-' }}</p>
                    <p class="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">NPSN: {{ school.npsn || '-' }} • Akreditasi: {{ school.accreditation_status || '-' }}</p>
                  </div>
                </div>
                <div class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    @click="openEditSchoolModal(school)"
                    class="p-1.5 text-slate-300 hover:text-violet-500 transition-colors"
                  >
                    <Edit2 :size="16" />
                  </button>
                  <button
                    @click="handleDeleteSchool(school.id)"
                    class="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </div>
            </BaseCard>

            <div v-if="schools.length === 0" class="col-span-2 text-center py-16 bg-white/40 dark:bg-zinc-900/20 rounded-lg border border-dashed border-slate-200 dark:border-zinc-850">
              <School class="mx-auto text-slate-300 dark:text-zinc-700 mb-3" :size="40" />
              <h4 class="font-bold text-sm text-slate-700 dark:text-zinc-300">Belum ada Unit Sekolah</h4>
              <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1">Buat unit sekolah pertama Anda di bawah yayasan terpilih.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Foundation Modal -->
    <BaseModal :show="showFoundationModal" :title="isEditMode ? 'Edit Detail Yayasan' : 'Tambah Yayasan Baru'" @close="showFoundationModal = false">
      <form @submit.prevent="handleSaveFoundation" class="space-y-4">
        <BaseInput v-model="foundationForm.name" label="Nama Yayasan" placeholder="Yayasan Pendidikan Al-Falah" required />
        <BaseInput v-model="foundationForm.foundation_code" label="Kode Yayasan" placeholder="YPAF" required />
        <BaseInput v-model="foundationForm.address" label="Alamat" placeholder="Jl. Raya Kebon Jeruk No. 12" />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="foundationForm.email" label="Email" type="email" placeholder="yayasan@domain.com" />
          <BaseInput v-model="foundationForm.phone" label="Telepon" placeholder="021-123456" />
        </div>
        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showFoundationModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Yayasan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- School Modal -->
    <BaseModal :show="showSchoolModal" :title="isEditingSchool ? 'Edit Unit Sekolah' : 'Tambah Unit Sekolah Baru'" @close="showSchoolModal = false">
      <form @submit.prevent="handleSaveSchool" class="space-y-4">
        <BaseInput v-model="schoolForm.name" label="Nama Sekolah" placeholder="TK Al-Falah Jakarta" required />
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Logo Sekolah (Opsional)</label>
            <div v-if="schoolForm.logo" class="w-16 h-16 rounded overflow-hidden border mb-2">
              <img :src="schoolForm.logo" class="w-full h-full object-cover" />
            </div>
            <input type="file" accept="image/*" @change="(e) => logoFile = (e.target as HTMLInputElement).files?.[0] || null" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Logo Dinas/Yayasan (Opsional)</label>
            <div v-if="schoolForm.logo_dinas" class="w-16 h-16 rounded overflow-hidden border mb-2">
              <img :src="schoolForm.logo_dinas" class="w-full h-full object-cover" />
            </div>
            <input type="file" accept="image/*" @change="(e) => logoDinasFile = (e.target as HTMLInputElement).files?.[0] || null" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
          </div>
        </div>
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Jenjang</label>
          <select v-model="schoolForm.level" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="TK">TK / KB / PAUD</option>
            <option value="SD">SD</option>
            <option value="SMP">SMP</option>
            <option value="SMA">SMA / SMK</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="schoolForm.npsn" label="NPSN" placeholder="12345678" />
          <BaseInput v-model="schoolForm.nsm" label="NSM" placeholder="87654321" />
        </div>
        <BaseInput v-model="schoolForm.address" label="Alamat" placeholder="Jl. Merdeka Raya No. 45" />
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kurikulum</label>
            <select v-model="schoolForm.curriculum_id" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
              <option value="">Pilih Kurikulum</option>
              <option v-for="curr in curriculums" :key="curr.id" :value="curr.id">{{ curr.name }}</option>
            </select>
          </div>
          <BaseInput v-model="schoolForm.accreditation_status" label="Status Akreditasi" placeholder="A" />
        </div>
        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showSchoolModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Unit Sekolah</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Curriculum Modal -->
    <BaseModal :show="showCurriculumModal" :title="isEditingCurriculum ? 'Edit Kurikulum Master' : 'Tambah Kurikulum Master'" @close="showCurriculumModal = false">
      <form @submit.prevent="handleSaveCurriculum" class="space-y-4">
        <BaseInput v-model="curriculumForm.name" label="Nama Kurikulum" placeholder="Kurikulum Khas Pesantren" required />
        <BaseInput v-model="curriculumForm.code" label="Kode Kurikulum" placeholder="KKP" />
        <BaseInput v-model="curriculumForm.description" label="Deskripsi" placeholder="Kurikulum khusus untuk pendalaman fiqih dan nahwu." />
        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showCurriculumModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Kurikulum</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Curriculum Categories Modal -->
    <BaseModal :show="showCategoriesModal" :title="`Kelola Kategori Mapel: ${selectedCurriculumForCategories?.name}`" @close="showCategoriesModal = false">
      <div class="space-y-6">
        <!-- New / Edit Category Form -->
        <div v-if="showCategoryForm" class="p-4 rounded-lg bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/80 space-y-4">
          <h4 class="text-xs font-bold text-slate-800 dark:text-zinc-200">
            {{ isEditingCategory ? 'Ubah Kategori' : 'Tambah Kategori Baru' }}
          </h4>
          <form @submit.prevent="handleSaveCategory" class="space-y-3">
            <BaseInput v-model="categoryForm.name" label="Nama Kategori" placeholder="Contoh: Muatan Lokal" required />
            <BaseInput v-model="categoryForm.code" label="Kode Kategori" placeholder="Contoh: MULOK" required />
            <BaseInput v-model="categoryForm.description" label="Deskripsi" placeholder="Contoh: Kurikulum khas daerah atau yayasan" />
            <div class="flex justify-end gap-2 pt-2">
              <BaseButton variant="outline" size="sm" type="button" @click="showCategoryForm = false">Batal</BaseButton>
              <BaseButton variant="primary" size="sm" type="submit">Simpan</BaseButton>
            </div>
          </form>
        </div>

        <div v-else class="flex justify-between items-center">
          <span class="text-xs text-slate-500">Daftar kategori mata pelajaran untuk kurikulum ini.</span>
          <BaseButton variant="outline" size="sm" @click="openCreateCategory" class="py-1 px-2.5 text-[11px] font-bold">
            <Plus class="mr-1.5" :size="10" /> Kategori Baru
          </BaseButton>
        </div>

        <!-- Categories List -->
        <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          <div v-for="cat in curriculumCategories" :key="cat.id" class="p-3 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50/20 dark:bg-zinc-900/10 flex items-start justify-between group">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <p class="font-bold text-xs text-slate-800 dark:text-zinc-200 leading-snug">{{ cat.name }}</p>
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-450 border border-slate-200/40 dark:border-zinc-700/30 uppercase">
                  {{ cat.code }}
                </span>
              </div>
              <p class="text-[10px] text-slate-500 dark:text-zinc-450 leading-relaxed">{{ cat.description || 'Tidak ada deskripsi' }}</p>
            </div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
              <button @click="openEditCategory(cat)" class="p-1 text-slate-450 hover:text-violet-600 transition-colors">
                <Edit2 :size="12" />
              </button>
              <button @click="handleDeleteCategory(cat.id)" class="p-1 text-slate-450 hover:text-rose-600 transition-colors">
                <Trash2 :size="12" />
              </button>
            </div>
          </div>

          <div v-if="curriculumCategories.length === 0" class="text-center py-8 text-slate-400 dark:text-zinc-500 text-xs bg-slate-50/20 dark:bg-zinc-900/10 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800">
            Belum ada kategori mata pelajaran.
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
