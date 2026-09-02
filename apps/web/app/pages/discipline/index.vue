<script setup lang="ts">
import { useSchoolContext } from '../../composables/useSchoolContext'
import { Search, Plus, FileText, AlertTriangle, Trophy } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useDiscipline } from '../../composables/useDiscipline'
import { useClass } from '../../composables/useClass'
import { useStudent } from '../../composables/useStudent'
import { useAcademicYear } from '../../composables/useAcademicYear'
const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('id-ID', { 
    day: 'numeric', month: 'long', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  }).replace('pukul', '').trim()
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
const { pointRules, fetchPointRules, studentRecords, fetchStudentRecords, createStudentRecord } = useDiscipline()
const { classes, fetchClasses } = useClass()
const { students, fetchStudents } = useStudent()
const { academicYears, fetchAcademicYears } = useAcademicYear()

const filteredSchools = computed(() => schools.value.filter(s => s.level !== 'TK'))
const activeAcademicYear = computed(() => academicYears.value.find(y => y.is_active))

const selectedAcademicYearId = ref('')
const selectedClassId = ref('')
const selectedStudentId = ref('')

const showCreateModal = ref(false)

const recordForm = reactive({
  rule_id: '',
  notes: ''
})

watch(selectedFoundationId, onFoundationChange)

onMounted(async () => {
  await initContext()
  if (filteredSchools.value.length > 0 && !filteredSchools.value.find(s => s.id === selectedSchoolId.value)) {
    selectedSchoolId.value = filteredSchools.value[0].id
  }
  
  if (selectedSchoolId.value) {
    await fetchPointRules(selectedSchoolId.value)
    await fetchAcademicYears(selectedSchoolId.value)
    if (activeAcademicYear.value) {
      selectedAcademicYearId.value = activeAcademicYear.value.id
    }
    if (selectedAcademicYearId.value) {
      await fetchClasses(selectedSchoolId.value, selectedAcademicYearId.value)
    }
  }
})

watch(selectedSchoolId, async (newVal) => {
  selectedAcademicYearId.value = ''
  selectedClassId.value = ''
  selectedStudentId.value = ''
  students.value = []
  studentRecords.value = []
  
  if (newVal) {
    await fetchPointRules(newVal)
    await fetchAcademicYears(newVal)
    if (activeAcademicYear.value) {
      selectedAcademicYearId.value = activeAcademicYear.value.id
    }
  } else {
    classes.value = []
  }
})

watch(selectedAcademicYearId, async (newVal) => {
  selectedClassId.value = ''
  selectedStudentId.value = ''
  students.value = []
  studentRecords.value = []
  
  if (newVal && selectedSchoolId.value) {
    await fetchClasses(selectedSchoolId.value, newVal)
  } else {
    classes.value = []
  }
})

watch(selectedClassId, async (newVal) => {
  selectedStudentId.value = ''
  studentRecords.value = []
  
  if (newVal && selectedSchoolId.value && selectedAcademicYearId.value) {
    await fetchStudents(selectedSchoolId.value, 1, 100, undefined, newVal, selectedAcademicYearId.value)
  } else {
    students.value = []
  }
})

watch(selectedStudentId, async (newVal) => {
  if (newVal && selectedAcademicYearId.value && selectedSchoolId.value) {
    await fetchStudentRecords(selectedSchoolId.value, newVal, selectedAcademicYearId.value)
  } else {
    studentRecords.value = []
  }
})

const handleCreateRecord = async () => {
  if (!selectedStudentId.value || !selectedAcademicYearId.value) return
  if (!recordForm.rule_id) {
    alert('Pilih aturan pelanggaran/prestasi')
    return
  }

  try {
    const payload = {
      ...recordForm,
      student_id: selectedStudentId.value,
      academic_year_id: selectedAcademicYearId.value
    }
    const res = await createStudentRecord(selectedSchoolId.value, payload)
    if (res.success) {
      showCreateModal.value = false
      recordForm.rule_id = ''
      recordForm.notes = ''
      await fetchStudentRecords(selectedSchoolId.value, selectedStudentId.value, selectedAcademicYearId.value)
    }
  } catch (e: any) {
    alert(e?.message ?? 'Gagal mencatat poin')
  }
}

const totalPoints = computed(() => {
  if (!studentRecords.value) return 0
  return studentRecords.value.reduce((sum, r) => {
    return sum + (r.rule_category === 'violation' ? -r.points_applied : r.points_applied)
  }, 0)
})

</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Rekap Poin & Kedisiplinan</h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Catat dan pantau poin pelanggaran atau prestasi siswa.</p>
      </div>
      <div class="flex gap-2">
        <BaseButton variant="primary" @click="showCreateModal = true" :disabled="!selectedStudentId" class="py-2.5 px-4 text-xs font-bold">
          <Plus class="mr-1.5" :size="14" /> Catat Poin Baru
        </BaseButton>
      </div>
    </div>

    <!-- Filters -->
    <div :class="['grid grid-cols-1 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm', !isSchoolLocked ? 'md:grid-cols-5' : 'md:grid-cols-3']">
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
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tahun Ajaran</label>
        <select v-model="selectedAcademicYearId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Tahun Ajaran</option>
          <option v-for="year in academicYears" :key="year.id" :value="year.id">{{ year.name }} {{ year.is_active ? '(Aktif)' : '' }}</option>
        </select>
      </div>
      
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kelas</label>
        <select v-model="selectedClassId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Kelas</option>
          <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.class_name }}</option>
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Siswa</label>
        <select v-model="selectedStudentId" :disabled="!selectedClassId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Siswa</option>
          <option v-for="std in students" :key="std.id" :value="std.id">{{ std.full_name }} ({{ std.nis || std.student_number }})</option>
        </select>
      </div>
    </div>

    <!-- Student Point Summary -->
    <div v-if="selectedStudentId" class="bg-violet-600 rounded-xl p-6 shadow-sm shadow-violet-600/20 text-white flex items-center justify-between">
      <div>
        <h3 class="font-bold text-lg">Total Poin Siswa</h3>
        <p class="text-violet-200 text-sm mt-1">Akumulasi poin pada tahun ajaran ini</p>
      </div>
      <div class="text-4xl font-black bg-white/20 px-6 py-2 rounded-xl backdrop-blur-sm">
        {{ totalPoints > 0 ? '+' : '' }}{{ totalPoints }}
      </div>
    </div>

    <!-- Point Records List -->
    <div v-if="!selectedStudentId" class="text-center py-16 bg-white dark:bg-zinc-900/50 border border-dashed border-slate-300 dark:border-zinc-800 rounded-xl">
      <Search class="w-10 h-10 mx-auto text-slate-400 mb-3" />
      <h3 class="text-sm font-medium text-slate-900 dark:text-zinc-100">Pilih Siswa Terlebih Dahulu</h3>
      <p class="text-xs text-slate-500 mt-1">Silakan pilih kelas dan siswa untuk melihat riwayat poin.</p>
    </div>
    
    <div v-else-if="studentRecords.length === 0" class="text-center py-16 bg-white dark:bg-zinc-900/50 border border-dashed border-slate-300 dark:border-zinc-800 rounded-xl">
      <FileText class="w-10 h-10 mx-auto text-slate-400 mb-3" />
      <h3 class="text-sm font-medium text-slate-900 dark:text-zinc-100">Belum Ada Catatan Poin</h3>
      <p class="text-xs text-slate-500 mt-1">Siswa ini belum memiliki riwayat pelanggaran atau prestasi.</p>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2">
      <BaseCard v-for="record in studentRecords" :key="record.id" class="p-5 border-slate-200/60 dark:border-zinc-800/80 hover:shadow-md transition-all">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-1">
              {{ formatDateTime(record.created_at) }}
            </div>
            <h3 class="font-bold text-slate-900 dark:text-white text-base leading-tight">
              {{ record.rule_name || 'Aturan tidak ditemukan' }}
            </h3>
            <p class="text-xs font-mono text-slate-500 mt-1 border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 inline-block px-1.5 py-0.5 rounded">
              {{ record.rule_code }}
            </p>
          </div>
          <div class="flex flex-col items-end gap-1.5">
            <span class="text-lg font-black" :class="record.rule_category === 'violation' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'">
              {{ record.rule_category === 'violation' ? '-' : '+' }}{{ record.points_applied }}
            </span>
            <span v-if="record.rule_category === 'violation'" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
              <AlertTriangle class="w-3 h-3 mr-1" /> Pelanggaran
            </span>
            <span v-else class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
              <Trophy class="w-3 h-3 mr-1" /> Prestasi
            </span>
          </div>
        </div>
        
        <div v-if="record.notes" class="mt-4 border-t border-slate-100 dark:border-zinc-800 pt-4">
          <h4 class="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400 mb-1 tracking-wider">Catatan</h4>
          <p class="text-sm text-slate-700 dark:text-zinc-300">{{ record.notes }}</p>
        </div>
        
        <div class="mt-3 text-[10px] text-slate-400 text-right">
          Dicatat oleh: {{ record.reporter?.name || '-' }}
        </div>
      </BaseCard>
    </div>

    <!-- Create Modal -->
    <BaseModal :show="showCreateModal" title="Catat Pelanggaran / Prestasi" size="md" @close="showCreateModal = false">
      <div class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Pilih Aturan</label>
          <select v-model="recordForm.rule_id" class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
            <option value="" disabled>-- Cari Aturan --</option>
            <optgroup label="Pelanggaran (Poin Negatif)">
              <option v-if="pointRules.filter(r => r.category === 'violation').length === 0" disabled value="">
                (Belum ada aturan pelanggaran dibuat)
              </option>
              <option v-else v-for="rule in pointRules.filter(r => r.category === 'violation')" :key="rule.id" :value="rule.id">
                [{{ rule.rule_code }}] {{ rule.point_value }} Poin - {{ rule.name }}
              </option>
            </optgroup>
            <optgroup label="Prestasi (Poin Positif)">
              <option v-if="pointRules.filter(r => r.category === 'achievement').length === 0" disabled value="">
                (Belum ada aturan prestasi dibuat)
              </option>
              <option v-else v-for="rule in pointRules.filter(r => r.category === 'achievement')" :key="rule.id" :value="rule.id">
                [{{ rule.rule_code }}] +{{ rule.point_value }} Poin - {{ rule.name }}
              </option>
            </optgroup>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Catatan Tambahan (Opsional)</label>
          <textarea v-model="recordForm.notes" rows="3" class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10" placeholder="Tambahkan detail kejadian..."></textarea>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <BaseButton variant="outline" @click="showCreateModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="handleCreateRecord">Simpan Poin</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
