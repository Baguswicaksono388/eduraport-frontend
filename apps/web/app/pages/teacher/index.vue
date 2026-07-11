<script setup lang="ts">
import { Users, Plus, Trash2, Edit2, ShieldAlert, CheckCircle2, User, Key, Download, Upload, FileSpreadsheet, X, CheckCircle, AlertCircle } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useSchool } from '../../composables/useSchool'
import { useTeacher } from '../../composables/useTeacher'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'

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
const { teachers, fetchTeachers, createTeacher, updateTeacher, deleteTeacher, downloadTemplate, importTeachers } = useTeacher()
const { user: currentUser } = useAuth()
const toast = useToast()

const selectedFoundationId = ref('')
const selectedSchoolId = ref('')

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showImportModal = ref(false)
const importFile = ref<File | null>(null)
const importLoading = ref(false)
const importResult = ref<{ success: number; failed: number; errors: string[] } | null>(null)
const downloadLoading = ref(false)

const handleDownloadTemplate = async () => {
  if (!selectedSchoolId.value) return
  downloadLoading.value = true
  try {
    await downloadTemplate(selectedSchoolId.value)
  } catch (e: any) {
    toast.error(e?.message ?? 'Gagal mengunduh template', 'Gagal')
  } finally {
    downloadLoading.value = false
  }
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  importFile.value = target.files?.[0] ?? null
  importResult.value = null
}

const handleImport = async () => {
  if (!importFile.value || !selectedSchoolId.value) return
  importLoading.value = true
  importResult.value = null
  try {
    const res: any = await importTeachers(selectedSchoolId.value, importFile.value)
    importResult.value = res.data
  } catch (e: any) {
    if (e.data?.errors) {
      const errorList = Object.entries(e.data.errors).flatMap(([field, msgs]: any) =>
        msgs.map((msg: string) => `${field}: ${msg}`)
      )
      importResult.value = {
        success: 0,
        failed: errorList.length,
        errors: errorList
      }
    } else {
      toast.error(e?.message ?? 'Import gagal', 'Gagal')
    }
  } finally {
    importLoading.value = false
  }
}

const teacherForm = reactive({
  full_name: '',
  email: '',
  phone: '',
  role: 'teacher',
  password: '',
  is_active: true
})

const editingTeacherId = ref('')
const editForm = reactive({
  full_name: '',
  email: '',
  phone: '',
  role: 'teacher',
  password: '',
  is_active: true
})

onMounted(async () => {
  await fetchFoundations()
  if (foundations.value.length > 0) {
    selectedFoundationId.value = foundations.value[0].id
    await fetchSchools(selectedFoundationId.value)
    if (schools.value.length > 0) {
      selectedSchoolId.value = schools.value[0].id
      await fetchTeachers(selectedSchoolId.value)
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
      teachers.value = []
    }
  }
})

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await fetchTeachers(newVal)
  } else {
    teachers.value = []
  }
})

const handleCreateTeacher = async () => {
  try {
    const res = await createTeacher(selectedSchoolId.value, { ...teacherForm })
    if (res.success) {
      showCreateModal.value = false
      Object.assign(teacherForm, {
        full_name: '',
        email: '',
        phone: '',
        role: 'teacher',
        password: '',
        is_active: true
      })
    }
  } catch (e: any) {
    if (e.data?.errors) {
      const errorMsg = Object.entries(e.data.errors)
        .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
        .join('\n')
      toast.error(`Gagal menambah guru/staf:\n${errorMsg}`, 'Gagal')
    } else {
      toast.error(e?.message ?? 'Gagal menambah guru/staf', 'Gagal')
    }
  }
}

const openEditModal = (t: any) => {
  editingTeacherId.value = t.id
  Object.assign(editForm, {
    full_name: t.full_name,
    email: t.email,
    phone: t.phone || '',
    role: t.role || 'teacher',
    password: '',
    is_active: !!t.is_active
  })
  showEditModal.value = true
}

const handleUpdateTeacher = async () => {
  try {
    const res = await updateTeacher(selectedSchoolId.value, editingTeacherId.value, { ...editForm })
    if (res.success) {
      showEditModal.value = false
    }
  } catch (e: any) {
    if (e.data?.errors) {
      const errorMsg = Object.entries(e.data.errors)
        .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
        .join('\n')
      toast.error(`Gagal memperbarui guru/staf:\n${errorMsg}`, 'Gagal')
    } else {
      toast.error(e?.message ?? 'Gagal memperbarui guru/staf', 'Gagal')
    }
  }
}

const handleDeleteTeacher = async (id: string) => {
  if (id === currentUser.value?.id) {
    toast.warning('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.', 'Peringatan')
    return
  }

  if (confirm('Apakah Anda yakin ingin menghapus data Guru/Staf ini?')) {
    try {
      await deleteTeacher(selectedSchoolId.value, id)
      toast.success('Guru/Staf berhasil dihapus.', 'Sukses')
    } catch (e: any) {
      toast.error(e?.message ?? 'Gagal menghapus guru/staf', 'Gagal')
    }
  }
}

const getRoleLabel = (role: string) => {
  const map: Record<string, string> = {
    super_admin: 'Super Admin',
    principal: 'Kepala Sekolah',
    teacher: 'Guru',
    treasurer: 'Bendahara',
    tu: 'Staf TU'
  }
  return map[role] || role
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Manajemen Guru & Staf</h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Atur profil guru, kepala sekolah, bendahara, dan staf tata usaha (TU).</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <BaseButton variant="outline" @click="handleDownloadTemplate" :disabled="!selectedSchoolId || downloadLoading" class="py-2.5 px-4 text-xs font-bold">
          <Download class="mr-1.5" :size="14" />
          {{ downloadLoading ? 'Mengunduh...' : 'Unduh Template' }}
        </BaseButton>
        <BaseButton variant="outline" @click="showImportModal = true" :disabled="!selectedSchoolId" class="py-2.5 px-4 text-xs font-bold">
          <Upload class="mr-1.5" :size="14" /> Import Excel
        </BaseButton>
        <BaseButton variant="primary" @click="showCreateModal = true" :disabled="!selectedSchoolId" class="py-2.5 px-4 text-xs font-bold">
          <Plus class="mr-1.5" :size="14" /> Guru/Staf Baru
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

    <!-- Teachers Table -->
    <div class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            <th class="p-4 pl-6">Nama Lengkap</th>
            <th class="p-4">Email</th>
            <th class="p-4">Telepon</th>
            <th class="p-4">Jabatan (Role)</th>
            <th class="p-4">Status</th>
            <th class="p-4 pr-6 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in teachers" :key="t.id" class="border-b border-slate-100 dark:border-zinc-800/80 last:border-0 hover:bg-slate-50/20 dark:hover:bg-zinc-900/20 transition-colors">
            <td class="p-4 pl-6">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-violet-50 dark:bg-zinc-850 flex items-center justify-center text-violet-600 dark:text-violet-400 font-black text-sm uppercase">
                  {{ t.full_name[0] }}
                </div>
                <div>
                  <span class="font-bold text-slate-800 dark:text-zinc-200 text-sm block leading-snug">{{ t.full_name }}</span>
                  <span v-if="t.id === currentUser?.id" class="inline-flex items-center mt-0.5 text-[8px] font-bold px-1 py-0.2 rounded bg-violet-600 text-white uppercase">Anda</span>
                </div>
              </div>
            </td>
            <td class="p-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">{{ t.email }}</td>
            <td class="p-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">{{ t.phone || '-' }}</td>
            <td class="p-4">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold"
                :class="{
                  'bg-violet-500/10 text-violet-600 border border-violet-500/20': t.role === 'principal',
                  'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20': t.role === 'teacher',
                  'bg-amber-500/10 text-amber-600 border border-amber-500/20': t.role === 'treasurer',
                  'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20': t.role === 'tu'
                }">
                {{ getRoleLabel(t.role) }}
              </span>
            </td>
            <td class="p-4">
              <span v-if="t.is_active" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 :size="11" /> Aktif
              </span>
              <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                Nonaktif
              </span>
            </td>
            <td class="p-4 pr-6 text-right">
              <div class="flex justify-end items-center gap-1">
                <button @click="openEditModal(t)" class="p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  <Edit2 :size="14" />
                </button>
                <button 
                  @click="handleDeleteTeacher(t.id)" 
                  :disabled="t.id === currentUser?.id"
                  class="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  title="Hapus Guru/Staf"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="teachers.length === 0">
            <td colspan="6" class="p-12 text-center text-slate-400 dark:text-zinc-500">
              <Users class="mx-auto mb-2 opacity-50" :size="32" />
              <p class="text-xs font-semibold">Belum ada data Guru/Staf pada unit sekolah ini.</p>
              <p class="text-[10px] mt-1">Klik tombol 'Guru/Staf Baru' untuk menambahkan data.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Modal -->
    <BaseModal :show="showCreateModal" title="Tambah Guru/Staf Baru" @close="showCreateModal = false">
      <form @submit.prevent="handleCreateTeacher" class="space-y-4">
        <BaseInput v-model="teacherForm.full_name" label="Nama Lengkap" placeholder="Contoh: Ahmad Hidayat, S.Pd" required />
        <BaseInput v-model="teacherForm.email" type="email" label="Alamat Email (Untuk Login)" placeholder="ahmad@domain.com" required />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="teacherForm.phone" label="Nomor Telepon" placeholder="Contoh: 08123456789" />
          <BaseInput v-model="teacherForm.password" type="password" label="Password (Min. 6 Karakter)" placeholder="Default: 12345678" />
        </div>
        
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Jabatan / Peran (Role)</label>
          <select v-model="teacherForm.role" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="teacher">Guru</option>
            <option value="principal">Kepala Sekolah</option>
            <option value="treasurer">Bendahara Sekolah</option>
            <option value="tu">Staf Tata Usaha (TU)</option>
          </select>
        </div>

        <div class="flex items-center gap-2 px-1 py-1">
          <input type="checkbox" id="is_active_teacher_create" v-model="teacherForm.is_active" class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20" />
          <label for="is_active_teacher_create" class="text-xs font-semibold text-slate-600 dark:text-zinc-400">Aktifkan akun pengguna ini</label>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showCreateModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Edit Modal -->
    <BaseModal :show="showEditModal" title="Ubah Guru/Staf" @close="showEditModal = false">
      <form @submit.prevent="handleUpdateTeacher" class="space-y-4">
        <BaseInput v-model="editForm.full_name" label="Nama Lengkap" placeholder="Contoh: Ahmad Hidayat, S.Pd" required />
        <BaseInput v-model="editForm.email" type="email" label="Alamat Email (Untuk Login)" placeholder="ahmad@domain.com" required />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="editForm.phone" label="Nomor Telepon" placeholder="Contoh: 08123456789" />
          <BaseInput v-model="editForm.password" type="password" label="Ubah Password" placeholder="Kosongkan jika tidak diubah" />
        </div>
        
        <div class="flex flex-col gap-1.5 w-full" v-if="editingTeacherId !== currentUser?.id">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Jabatan / Peran (Role)</label>
          <select v-model="editForm.role" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="teacher">Guru</option>
            <option value="principal">Kepala Sekolah</option>
            <option value="treasurer">Bendahara Sekolah</option>
            <option value="tu">Staf Tata Usaha (TU)</option>
          </select>
        </div>

        <div class="flex items-center gap-2 px-1 py-1" v-if="editingTeacherId !== currentUser?.id">
          <input type="checkbox" id="is_active_teacher_edit" v-model="editForm.is_active" class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20" />
          <label for="is_active_teacher_edit" class="text-xs font-semibold text-slate-600 dark:text-zinc-400">Akun pengguna aktif</label>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showEditModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Perubahan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Import Excel Modal -->
    <BaseModal :show="showImportModal" title="Import Data Guru & Staf via Excel" @close="showImportModal = false; importResult = null; importFile = null">
      <div class="space-y-5">
        <!-- Instructions -->
        <div class="flex items-start gap-3 p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-100 dark:border-violet-900/50">
          <FileSpreadsheet class="text-violet-500 shrink-0 mt-0.5" :size="18" />
          <div class="text-xs text-violet-700 dark:text-violet-300">
            <p class="font-bold mb-1">Panduan Import</p>
            <ol class="list-decimal ml-4 space-y-0.5 text-violet-600 dark:text-violet-400">
              <li>Unduh template Excel terlebih dahulu melalui tombol <strong>Unduh Template</strong>.</li>
              <li>Isi data sesuai format pada baris ke-9 dan seterusnya (baris 1–8 adalah header dan contoh).</li>
              <li>Kolom <strong>Nama Lengkap</strong> dan <strong>Email</strong> wajib diisi. Kolom <strong>Password</strong> bersifat opsional (default: 12345678).</li>
              <li>Upload file yang telah diisi kembali di sini.</li>
            </ol>
          </div>
        </div>

        <!-- File picker -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Pilih File Excel (.xlsx)</label>
          <label class="flex items-center gap-3 cursor-pointer border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-lg px-4 py-5 hover:border-violet-400 dark:hover:border-violet-600 transition-colors group">
            <Upload class="text-slate-400 group-hover:text-violet-500 transition-colors" :size="20" />
            <div class="flex-1 min-w-0">
              <p v-if="importFile" class="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">{{ importFile.name }}</p>
              <p v-else class="text-sm text-slate-400 dark:text-zinc-500">Klik untuk memilih file atau seret ke sini</p>
            </div>
            <input type="file" accept=".xlsx,.xls" class="hidden" @change="onFileChange" />
          </label>
        </div>

        <!-- Import result -->
        <div v-if="importResult" class="space-y-2">
          <div class="flex gap-3">
            <div class="flex-1 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-lg px-4 py-3">
              <CheckCircle class="text-emerald-500" :size="16" />
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Berhasil</p>
                <p class="text-xl font-black text-emerald-700 dark:text-emerald-300">{{ importResult.success }}</p>
              </div>
            </div>
            <div class="flex-1 flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-lg px-4 py-3">
              <AlertCircle class="text-rose-500" :size="16" />
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Gagal</p>
                <p class="text-xl font-black text-rose-700 dark:text-rose-300">{{ importResult.failed }}</p>
              </div>
            </div>
          </div>
          <div v-if="importResult.errors.length > 0" class="bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-100 dark:border-rose-900/50 p-3 max-h-40 overflow-y-auto">
            <p class="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-2">Detail Error</p>
            <ul class="space-y-1">
              <li v-for="(err, i) in importResult.errors" :key="i" class="text-xs text-rose-700 dark:text-rose-300 flex gap-2">
                <X :size="11" class="shrink-0 mt-0.5" /> {{ err }}
              </li>
            </ul>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showImportModal = false; importResult = null; importFile = null">Tutup</BaseButton>
          <BaseButton variant="primary" @click="handleImport" :disabled="!importFile || importLoading">
            <Upload class="mr-1.5" :size="14" />
            {{ importLoading ? 'Sedang Import...' : 'Mulai Import' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
