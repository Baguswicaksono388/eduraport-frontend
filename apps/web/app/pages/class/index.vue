<script setup lang="ts">
import { Users, Plus, Trash2, Edit2, ShieldAlert, GraduationCap, LayoutGrid, Eye, QrCode } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useAcademicYear } from '~/composables/useAcademicYear'
import { useClass } from '~/composables/useClass'
import { useToast } from '~/composables/useToast'
import { useSchoolContext } from '~/composables/useSchoolContext'
import { usePagination } from '~/composables/usePagination'

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
const { academicYears, fetchAcademicYears } = useAcademicYear()
const { classes, classesMeta, classStudents, teachers, fetchClasses, fetchClassStudents, fetchTeachers, createClass, updateClass, deleteClass } = useClass()
const { page, itemPerPage } = usePagination(10)
const toast = useToast()

const selectedAcademicYearId = ref('')

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showStudentsModal = ref(false)
const selectedClassName = ref('')

const classForm = reactive({
  class_name: '',
  level: '',
  academic_year_id: '',
  homeroom_teacher_id: '',
  capacity: 30
})

const editingClassId = ref('')
const editForm = reactive({
  class_name: '',
  level: '',
  academic_year_id: '',
  homeroom_teacher_id: '',
  capacity: 30
})

onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    await loadSchoolData(schoolId)
  }
})

const loadSchoolData = async (schoolId: string) => {
  await Promise.all([
    fetchAcademicYears(schoolId),
    fetchTeachers(schoolId)
  ])
  
  if (academicYears.value.length > 0) {
    const activeYear = academicYears.value.find(y => y.is_active)
    selectedAcademicYearId.value = activeYear ? activeYear.id : academicYears.value[0].id
    await fetchClasses(schoolId, selectedAcademicYearId.value, page.value, itemPerPage.value)
  } else {
    selectedAcademicYearId.value = ''
    classes.value = []
  }
}

watch(selectedFoundationId, (newVal) => onFoundationChange(newVal))

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await loadSchoolData(newVal)
  } else {
    academicYears.value = []
    selectedAcademicYearId.value = ''
    classes.value = []
  }
})

watch(selectedAcademicYearId, async (newVal) => {
  if (selectedSchoolId.value && newVal) {
    await fetchClasses(selectedSchoolId.value, newVal, page.value, itemPerPage.value)
  } else {
    classes.value = []
  }
})

watch([page, itemPerPage], () => {
  if (selectedSchoolId.value && selectedAcademicYearId.value) {
    fetchClasses(selectedSchoolId.value, selectedAcademicYearId.value, page.value, itemPerPage.value)
  }
})

const handleCreateClass = async () => {
  try {
    const payload = {
      ...classForm,
      academic_year_id: classForm.academic_year_id || selectedAcademicYearId.value
    }
    const res = await createClass(selectedSchoolId.value, payload)
    if (res.success) {
      showCreateModal.value = false
      Object.assign(classForm, {
        class_name: '',
        level: '',
        academic_year_id: '',
        homeroom_teacher_id: '',
        capacity: 30
      })
      toast.success('Kelas baru berhasil ditambahkan.', 'Sukses')
      await fetchClasses(selectedSchoolId.value, selectedAcademicYearId.value, page.value, itemPerPage.value)
    }
  } catch (e: any) {
    if (e.data?.errors) {
      const errorMsg = Object.entries(e.data.errors)
        .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
        .join('\n')
      toast.error(`Gagal menambah kelas:\n${errorMsg}`, 'Gagal')
    } else {
      toast.error(e?.message ?? 'Gagal menambah kelas', 'Gagal')
    }
  }
}

const openEditModal = (cObj: any) => {
  editingClassId.value = cObj.id
  Object.assign(editForm, {
    class_name: cObj.class_name,
    level: cObj.level,
    academic_year_id: cObj.academic_year_id,
    homeroom_teacher_id: cObj.homeroom_teacher_id || '',
    capacity: cObj.capacity ? Number(cObj.capacity) : 30
  })
  showEditModal.value = true
}

const handleUpdateClass = async () => {
  try {
    const res = await updateClass(selectedSchoolId.value, editingClassId.value, { ...editForm })
    if (res.success) {
      showEditModal.value = false
      toast.success('Kelas berhasil diperbarui.', 'Sukses')
      await fetchClasses(selectedSchoolId.value, selectedAcademicYearId.value)
    }
  } catch (e: any) {
    if (e.data?.errors) {
      const errorMsg = Object.entries(e.data.errors)
        .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
        .join('\n')
      toast.error(`Gagal memperbarui kelas:\n${errorMsg}`, 'Gagal')
    } else {
      toast.error(e?.message ?? 'Gagal memperbarui kelas', 'Gagal')
    }
  }
}

const handleDeleteClass = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus Kelas ini?')) {
    try {
      await deleteClass(selectedSchoolId.value, id, selectedAcademicYearId.value)
      toast.success('Kelas berhasil dihapus.', 'Sukses')
    } catch (e: any) {
      toast.error(e?.message ?? 'Gagal menghapus kelas', 'Gagal')
    }
  }
}

const viewStudents = async (cObj: any) => {
  selectedClassName.value = cObj.class_name
  await fetchClassStudents(selectedSchoolId.value, cObj.id)
  showStudentsModal.value = true
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Manajemen Kelas</h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Kelola daftar rombongan belajar, kapasitas, dan wali kelas.</p>
      </div>
      <div class="flex gap-2">
        <BaseButton variant="primary" @click="showCreateModal = true" :disabled="!selectedAcademicYearId" class="py-2.5 px-4 text-xs font-bold">
          <Plus class="mr-1.5" :size="14" /> Kelas Baru
        </BaseButton>
      </div>
    </div>

    <!-- Filters and Selection -->
    <div v-if="!isSchoolLocked" class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
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
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tahun Ajaran</label>
        <select v-model="selectedAcademicYearId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
          <option value="" disabled>Pilih Tahun Ajaran</option>
          <option v-for="year in academicYears" :key="year.id" :value="year.id">
            {{ year.name }} {{ year.is_active ? '(Aktif)' : '' }}
          </option>
        </select>
      </div>
    </div>

    <!-- Classes Table -->
    <div class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            <th class="p-4 pl-6">Nama Kelas</th>
            <th class="p-4">Tingkat (Level)</th>
            <th class="p-4">Wali Kelas</th>
            <th class="p-4">Kapasitas</th>
            <th class="p-4 pr-6 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cObj in classes" :key="cObj.id" class="border-b border-slate-100 dark:border-zinc-800/80 last:border-0 hover:bg-slate-50/20 dark:hover:bg-zinc-900/20 transition-colors">
            <td class="p-4 pl-6">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded bg-violet-50 dark:bg-zinc-850 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <LayoutGrid :size="16" />
                </div>
                <span class="font-bold text-slate-800 dark:text-zinc-200 text-sm">{{ cObj.class_name }}</span>
              </div>
            </td>
            <td class="p-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">{{ cObj.level }}</td>
            <td class="p-4 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              {{ cObj.homeroom_teacher_name || 'Belum Ditentukan' }}
            </td>
            <td class="p-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">
              {{ cObj.capacity ? `${cObj.capacity} Murid` : '-' }}
            </td>
            <td class="p-4 pr-6 text-right">
              <div class="flex justify-end items-center gap-1">
                <BaseButton variant="outline" @click="$router.push(`/class/${cObj.id}/qr-cards`)" class="py-1.5 px-2.5 text-[10px] font-bold flex items-center gap-1 text-violet-600 border-violet-200 hover:bg-violet-50 dark:border-violet-800 dark:hover:bg-violet-900/30">
                  <QrCode :size="11" /> Cetak QR
                </BaseButton>
                <BaseButton variant="outline" @click="viewStudents(cObj)" class="py-1.5 px-2.5 text-[10px] font-bold flex items-center gap-1">
                  <Eye :size="11" /> Detail Siswa
                </BaseButton>
                <button @click="openEditModal(cObj)" class="p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  <Edit2 :size="14" />
                </button>
                <button @click="handleDeleteClass(cObj.id)" class="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 transition-colors">
                  <Trash2 :size="14" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="classes.length === 0">
            <td colspan="5" class="p-12 text-center text-slate-400 dark:text-zinc-500">
              <LayoutGrid class="mx-auto mb-2 opacity-50" :size="32" />
              <p class="text-xs font-semibold">Belum ada data Kelas pada Tahun Ajaran ini.</p>
              <p class="text-[10px] mt-1">Klik tombol 'Kelas Baru' untuk menambahkan data.</p>
            </td>
          </tr>
        </tbody>
      </table>
      <AppPagination
        v-if="classesMeta"
        v-model:page="page"
        v-model:itemPerPage="itemPerPage"
        :totalItem="classesMeta.total_item"
        :totalPage="classesMeta.total_page"
        :listPagination="classesMeta.list_pagination"
      />
    </div>

    <!-- Create Modal -->
    <BaseModal :show="showCreateModal" title="Kelas Baru" @close="showCreateModal = false">
      <form @submit.prevent="handleCreateClass" class="space-y-4">
        <BaseInput v-model="classForm.class_name" label="Nama Kelas" placeholder="Contoh: 7-A atau Kelas 1" required />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="classForm.level" label="Tingkat (Level)" placeholder="Contoh: 7 atau SD-1" required />
          <BaseInput v-model="classForm.capacity" type="number" label="Kapasitas Kelas" placeholder="Contoh: 30" required />
        </div>
        
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tahun Ajaran</label>
          <select v-model="classForm.academic_year_id" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="">Gunakan Tahun Ajaran Aktif saat ini</option>
            <option v-for="year in academicYears" :key="year.id" :value="year.id">{{ year.name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Wali Kelas</label>
          <select v-model="classForm.homeroom_teacher_id" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="">Pilih Wali Kelas (Opsional)</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.full_name }} ({{ t.role }})</option>
          </select>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showCreateModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Edit Modal -->
    <BaseModal :show="showEditModal" title="Ubah Kelas" @close="showEditModal = false">
      <form @submit.prevent="handleUpdateClass" class="space-y-4">
        <BaseInput v-model="editForm.class_name" label="Nama Kelas" placeholder="Contoh: 7-A atau Kelas 1" required />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="editForm.level" label="Tingkat (Level)" placeholder="Contoh: 7 atau SD-1" required />
          <BaseInput v-model="editForm.capacity" type="number" label="Kapasitas Kelas" placeholder="Contoh: 30" required />
        </div>
        
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tahun Ajaran</label>
          <select v-model="editForm.academic_year_id" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10" required>
            <option v-for="year in academicYears" :key="year.id" :value="year.id">{{ year.name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Wali Kelas</label>
          <select v-model="editForm.homeroom_teacher_id" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option value="">Pilih Wali Kelas (Opsional)</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.full_name }} ({{ t.role }})</option>
          </select>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showEditModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Perubahan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Class Students Modal -->
    <BaseModal :show="showStudentsModal" :title="`Daftar Siswa — Kelas ${selectedClassName}`" @close="showStudentsModal = false">
      <div class="space-y-4 max-h-[450px] overflow-y-auto pr-1">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/10 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
              <th class="p-3">Nama Lengkap</th>
              <th class="p-3">NIS</th>
              <th class="p-3">NISN</th>
              <th class="p-3">L/P</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in classStudents" :key="student.id" class="border-b border-slate-100 dark:border-zinc-800/80 last:border-0 hover:bg-slate-50/10 dark:hover:bg-zinc-900/10 transition-colors">
              <td class="p-3 font-semibold text-slate-800 dark:text-zinc-200">{{ student.full_name }}</td>
              <td class="p-3 font-medium text-slate-500 dark:text-zinc-400">{{ student.student_number || '-' }}</td>
              <td class="p-3 font-medium text-slate-500 dark:text-zinc-400">{{ student.national_student_number || '-' }}</td>
              <td class="p-3 font-medium text-slate-500 dark:text-zinc-400">{{ student.gender === 'Laki-laki' ? 'L' : 'P' }}</td>
            </tr>
            <tr v-if="classStudents.length === 0">
              <td colspan="4" class="p-8 text-center text-slate-400 dark:text-zinc-500">
                <Users class="mx-auto mb-1 opacity-55" :size="24" />
                <p class="font-medium">Belum ada siswa yang masuk ke kelas ini.</p>
                <p class="text-[10px] mt-0.5">Siswa dapat di-assign kelas melalui halaman Data Siswa.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex justify-end pt-4 border-t border-slate-100 dark:border-zinc-800 mt-4">
        <BaseButton variant="outline" @click="showStudentsModal = false">Tutup</BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
