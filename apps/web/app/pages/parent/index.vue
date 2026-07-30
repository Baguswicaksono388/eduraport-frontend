<script setup lang="ts">
import { Users, Plus, UserMinus, Edit2, Search, Link2 } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useParent } from '../../composables/useParent'
import { useStudent } from '../../composables/useStudent'
import { useSchoolContext } from '../../composables/useSchoolContext'
import { useToast } from '../../composables/useToast'
import { usePagination } from '../../composables/usePagination'

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
const { allParents, allParentsMeta, fetchAllParents, createParent, updateParent, deleteParent } = useParent()
const { students, fetchStudents } = useStudent()
const { page, itemPerPage } = usePagination(10)
const toast = useToast()

const searchQuery = ref('')
const activeTab = ref<'linked' | 'unlinked'>('linked')
const showParentForm = ref(false)
const editingParentId = ref('')
const isEditingUnlinked = ref(false)
const showDeleteConfirm = ref(false)
const deletingParentId = ref('')

const parentForm = reactive({
  student_id: '',
  name: '',
  relationship: 'Father',
  phone: '',
  occupation: '',
  email: '',
  password: '',
  user_id: undefined as string | undefined
})

onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    await fetchAllParents(schoolId, page.value, itemPerPage.value, searchQuery.value, activeTab.value, selectedFoundationId.value)
    // Fetch a large list of students for the dropdown
    await fetchStudents(schoolId, 1, 1000)
  }
})

watch([page, itemPerPage], () => {
  if (selectedSchoolId.value) {
    fetchAllParents(selectedSchoolId.value, page.value, itemPerPage.value, searchQuery.value, activeTab.value, selectedFoundationId.value)
  }
})

watch(searchQuery, () => {
  if (selectedSchoolId.value) {
    page.value = 1
    fetchAllParents(selectedSchoolId.value, page.value, itemPerPage.value, searchQuery.value, activeTab.value, selectedFoundationId.value)
  }
})

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await fetchAllParents(newVal, page.value, itemPerPage.value, searchQuery.value, activeTab.value, selectedFoundationId.value)
    await fetchStudents(newVal, 1, 1000)
  } else {
    allParents.value = []
  }
})

const changeTab = async (tab: 'linked' | 'unlinked') => {
  if (activeTab.value === tab) return
  activeTab.value = tab
  page.value = 1
  if (selectedSchoolId.value) {
    await fetchAllParents(selectedSchoolId.value, page.value, itemPerPage.value, searchQuery.value, activeTab.value, selectedFoundationId.value)
  }
}

const resetParentForm = () => {
  editingParentId.value = ''
  isEditingUnlinked.value = false
  parentForm.student_id = ''
  parentForm.name = ''
  parentForm.relationship = 'Father'
  parentForm.phone = ''
  parentForm.occupation = ''
  parentForm.email = ''
  parentForm.password = ''
  parentForm.user_id = undefined
}

const handleAddParentClick = () => {
  resetParentForm()
  showParentForm.value = true
}

const handleEditParentClick = (parent: any) => {
  editingParentId.value = parent.data_type === 'unlinked' ? '' : parent.id
  isEditingUnlinked.value = parent.data_type === 'unlinked'
  parentForm.student_id = parent.student_id || ''
  parentForm.name = parent.name
  parentForm.relationship = parent.relationship || 'Father'
  parentForm.phone = parent.phone || ''
  parentForm.occupation = parent.occupation || ''
  parentForm.email = parent.email || ''
  parentForm.password = ''
  parentForm.user_id = parent.data_type === 'unlinked' ? parent.id : parent.user_id || undefined
  showParentForm.value = true
}

const handleSaveParent = async () => {
  if (!parentForm.name || !parentForm.student_id) {
    toast.error('Nama lengkap dan Siswa wajib diisi', 'Validasi Gagal')
    return
  }
  
  try {
    const payload = {
      student_id: parentForm.student_id,
      name: parentForm.name,
      relationship: parentForm.relationship,
      phone: parentForm.phone || undefined,
      occupation: parentForm.occupation || undefined,
      email: parentForm.email || undefined,
      password: parentForm.password || undefined,
      user_id: parentForm.user_id
    }
    
    if (editingParentId.value && !isEditingUnlinked.value) {
      await updateParent(selectedSchoolId.value, editingParentId.value, payload)
      toast.success('Data orang tua berhasil diperbarui', 'Berhasil')
    } else {
      await createParent(selectedSchoolId.value, payload)
      toast.success(isEditingUnlinked.value ? 'Orang tua berhasil direlasikan' : 'Data orang tua berhasil ditambahkan', 'Berhasil')
    }
    
    showParentForm.value = false
    await fetchAllParents(selectedSchoolId.value, page.value, itemPerPage.value, searchQuery.value, activeTab.value, selectedFoundationId.value)
  } catch (e: any) {
    toast.error(e?.data?.message || 'Gagal menyimpan data orang tua', 'Gagal')
  }
}

const handleDeleteParent = (id: string) => {
  deletingParentId.value = id
  showDeleteConfirm.value = true
}

const confirmDeleteParent = async () => {
  try {
    await deleteParent(selectedSchoolId.value, deletingParentId.value)
    toast.success('Relasi orang tua dan siswa berhasil diputus', 'Berhasil')
    await fetchAllParents(selectedSchoolId.value, page.value, itemPerPage.value, searchQuery.value, activeTab.value, selectedFoundationId.value)
  } catch (e: any) {
    toast.error('Gagal memutus relasi orang tua', 'Gagal')
  } finally {
    showDeleteConfirm.value = false
    deletingParentId.value = ''
  }
}
</script>

<template>
  <div class="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-3">
          <div class="p-2.5 bg-violet-600 rounded-xl text-white shadow-lg shadow-violet-600/20">
            <Users :size="24" />
          </div>
          Data Orang Tua
        </h1>
        <p class="text-slate-500 dark:text-zinc-400 mt-2 text-sm max-w-2xl leading-relaxed">
          Kelola data orang tua / wali siswa. Anda dapat memetakan orang tua ke siswa yang bersangkutan.
        </p>
      </div>

      <div class="flex items-center gap-3" v-if="!isSchoolLocked">
        <BaseButton variant="primary" @click="handleAddParentClick">
          <Plus class="mr-2" :size="16" />
          Tambah Orang Tua
        </BaseButton>
      </div>
    </div>

    <!-- Filters and Data Table -->
    <BaseCard>
      <!-- School Filter & Search -->
      <div class="p-4 md:p-6 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
        <div class="flex flex-col md:flex-row md:items-center gap-4">
          <!-- Foundation & School Selectors -->
          <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5" v-if="!isSchoolLocked">
              <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Yayasan</label>
              <select v-model="selectedFoundationId" @change="onFoundationChange" class="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 disabled:opacity-50 disabled:cursor-not-allowed">
                <option value="">Pilih Yayasan</option>
                <option v-for="f in foundations" :key="f.id" :value="f.id">{{ f.name }}</option>
              </select>
            </div>
            
            <div class="flex flex-col gap-1.5" v-if="!isSchoolLocked">
              <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Unit Sekolah</label>
              <div v-if="activeTab === 'unlinked'" class="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                <span>Seluruh Sekolah</span>
                <span class="text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Global</span>
              </div>
              <select v-else v-model="selectedSchoolId" class="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="!selectedFoundationId">
                <option value="">Pilih Unit Sekolah</option>
                <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }} ({{ s.level }})</option>
              </select>
            </div>
          </div>
          
          <!-- Search Box -->
          <div class="md:w-72 mt-auto">
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search class="h-4 w-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
              </div>
              <input v-model="searchQuery" type="text" placeholder="Cari nama orang tua, siswa, atau no HP..." class="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all dark:text-zinc-300" :disabled="!selectedSchoolId" />
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/30 px-4 md:px-6">
        <button 
          @click="changeTab('linked')"
          class="px-5 py-3 text-sm font-semibold transition-all relative"
          :class="activeTab === 'linked' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'"
        >
          Terhubung
          <div v-if="activeTab === 'linked'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400 rounded-t-full"></div>
        </button>
        <button 
          @click="changeTab('unlinked')"
          class="px-5 py-3 text-sm font-semibold transition-all relative flex items-center gap-2"
          :class="activeTab === 'unlinked' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'"
        >
          Belum Terhubung
          <div v-if="activeTab === 'unlinked'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-400 rounded-t-full"></div>
        </button>
      </div>

      <!-- Table View -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200/50 dark:border-zinc-850 bg-slate-50/60 dark:bg-zinc-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th class="px-6 py-4">Orang Tua / Wali</th>
              <th class="px-6 py-4">Kontak / Pekerjaan</th>
              <th class="px-6 py-4">Siswa (Anak)</th>
              <th class="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-zinc-850">
            <tr 
              v-for="parent in allParents" 
              :key="parent.id" 
              class="text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50/30 dark:hover:bg-zinc-900/20 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm">
                    {{ parent.name[0] }}
                  </div>
                  <div>
                    <p class="font-bold text-sm text-slate-900 dark:text-zinc-100">{{ parent.name }}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800/50">
                        {{ ['Father', 'Ayah'].includes(parent.relationship) ? 'Ayah' : ['Mother', 'Ibu'].includes(parent.relationship) ? 'Ibu' : 'Wali' }}
                      </span>
                      <span v-if="parent.user_id" class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50" title="Akun Terhubung">
                        Terhubung
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="text-slate-900 dark:text-zinc-100">{{ parent.phone || '-' }}</p>
                <p class="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5">{{ parent.occupation || '-' }}</p>
              </td>
              <td class="px-6 py-4">
                <template v-if="parent.data_type === 'unlinked'">
                  <div class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-500">
                    <UserMinus :size="12" />
                    <span class="text-[10px] font-bold uppercase tracking-wider">Belum Terhubung</span>
                  </div>
                </template>
                <template v-else>
                  <p class="text-slate-900 dark:text-zinc-100 font-bold">{{ parent.student_name || '-' }}</p>
                  <p class="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5">NISN: {{ parent.student_nisn || '-' }} | Kelas: {{ parent.class_name || '-' }}</p>
                </template>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="handleEditParentClick(parent)" class="p-1.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors" :title="parent.data_type === 'unlinked' ? 'Hubungkan Siswa' : 'Edit'">
                    <Edit2 :size="14" v-if="parent.data_type !== 'unlinked'" />
                    <Link2 :size="14" v-else />
                  </button>
                  <button v-if="parent.data_type !== 'unlinked'" @click="handleDeleteParent(parent.id)" class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors" title="Putus Relasi">
                    <UserMinus :size="14" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="allParents.length === 0">
              <td colspan="4" class="text-center py-16 text-slate-400 font-medium">
                <Users class="mx-auto text-slate-300 dark:text-zinc-700 mb-3" :size="40" />
                <p class="text-xs">Tidak ada data orang tua ditemukan</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <AppPagination
        v-if="allParentsMeta"
        v-model:page="page"
        v-model:itemPerPage="itemPerPage"
        :totalItem="allParentsMeta.total_item"
        :totalPage="allParentsMeta.total_page"
        :listPagination="allParentsMeta.list_pagination"
      />
    </BaseCard>

    <!-- Parent Form Modal -->
    <BaseModal :show="showParentForm" :title="isEditingUnlinked ? 'Hubungkan Orang Tua' : (editingParentId ? 'Edit Data Orang Tua' : 'Tambah Orang Tua Baru')" @close="showParentForm = false">
      <form @submit.prevent="handleSaveParent" class="space-y-4">
        
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Siswa / Anak</label>
          <select v-model="parentForm.student_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="" disabled>— Pilih Siswa —</option>
            <option v-for="s in students" :key="s.id" :value="s.id">
              {{ s.full_name }} ({{ s.national_student_number || '-' }})
            </option>
          </select>
        </div>

        <BaseInput v-model="parentForm.name" label="Nama Lengkap" placeholder="Contoh: Budi Santoso" required />
        
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Hubungan</label>
          <select v-model="parentForm.relationship" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="Father">Ayah</option>
            <option value="Mother">Ibu</option>
            <option value="Guardian">Wali</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="parentForm.phone" label="No. Telepon / WA" placeholder="Contoh: 0812345678" />
          <BaseInput v-model="parentForm.occupation" label="Pekerjaan" placeholder="Contoh: Wiraswasta" />
        </div>

        <!-- Akun Login Section -->
        <div class="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <h4 class="text-xs font-bold text-slate-800 dark:text-zinc-200 mb-3 uppercase tracking-wider">Info Akun Login (Opsional)</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput v-model="parentForm.email" type="email" label="Email Login" placeholder="parent@email.com" />
            <BaseInput v-model="parentForm.password" type="password" label="Password Baru" placeholder="Kosongkan jika tidak diubah" />
          </div>
          <p class="text-[10px] text-slate-400 mt-2 italic">Isi email dan password jika Anda ingin mengizinkan orang tua login. Jika password tidak diisi saat update, password lama tidak akan berubah.</p>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showParentForm = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Delete Confirmation Modal -->
    <BaseModal :show="showDeleteConfirm" title="Putus Relasi Orang Tua" @close="showDeleteConfirm = false">
      <div class="space-y-4">
        <div class="flex items-center gap-4 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 p-4 rounded-lg border border-amber-200 dark:border-amber-500/20">
          <UserMinus :size="32" class="shrink-0" />
          <p class="text-sm font-medium leading-relaxed">
            Yakin ingin memutus relasi orang tua ini dengan siswa tersebut?
          </p>
        </div>
        <p class="text-xs text-slate-500 dark:text-zinc-400">
          Tindakan ini hanya akan melepas kaitan antara orang tua dan siswa ini, dan tidak akan menghapus akun utama orang tua tersebut dari sistem.
        </p>
        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showDeleteConfirm = false">Batal</BaseButton>
          <BaseButton variant="danger" @click="confirmDeleteParent">Ya, Putus Relasi</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
