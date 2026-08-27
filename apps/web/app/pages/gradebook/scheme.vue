<script setup lang="ts">
import { useSchoolContext } from '../../composables/useSchoolContext'
import { Plus, Trash2, Edit2, Settings, ClipboardList, Calculator, AlertCircle, CheckCircle, Info, Percent, Award, BookOpen, Baby, ArrowRight, Copy } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useClass } from '../../composables/useClass'
import { useSubject } from '../../composables/useSubject'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useGradebook } from '../../composables/useGradebook'
import { useToast } from '../../composables/useToast'
import { isEarlyChildhood } from '../../composables/useSchoolLevel'

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
const { classes, fetchClasses } = useClass()
const { subjects, fetchSubjects } = useSubject()
const { academicYears, fetchAcademicYears } = useAcademicYear()
const gradebook = useGradebook()
const toast = useToast()

const showCopyModal = ref(false)
const selectedSourceClassId = ref('')
const selectedSourceAcademicYearId = ref('')
const selectedSourceSemester = ref('odd')
const sourceClasses = ref<any[]>([])

// Mendeteksi semua satuan PAUD Indonesia: TK, RA, KB, TPA, SPS
const isTKSchool = computed(() => {
  const school = schools.value.find((s: any) => s.id === selectedSchoolId.value)
  return isEarlyChildhood(school?.level)
})

const selectedClassId = ref('')
const selectedSubjectId = ref('')
const selectedAcademicYearId = ref('')
const selectedSemester = ref('odd') // odd or even

const scheme = ref<any>(null)
const groups = ref<any[]>([])
const components = ref<any[]>([])
const kkm = ref<any>(null)
const kkmInput = ref<number | null>(null)
const loading = ref(false)

const showSchemeModal = ref(false)
const showGroupModal = ref(false)
const showComponentModal = ref(false)

// Forms
const schemeForm = reactive({
  scheme_name: '',
  config_level: 'class'
})

const activeGroupId = ref('')
const isActiveGroupWeighted = computed(() => {
  const group = scheme.value?.groups?.find((g: any) => g.id === activeGroupId.value)
  return group?.aggregation_method === 'weighted_avg'
})
const activeComponentId = ref('')
const componentForm = ref({
  id: '',
  name: '',
  type: 'custom',
  weight_in_group: '100.00',
  max_score: '100.00',
  is_required: true,
  is_remedial_slot: false,
  parent_component_id: '',
  sort_order: 0,
  description: ''
})

const activeGroupBaseComponents = computed(() => {
  return components.value.filter((c: any) => 
    c.group_id === activeGroupId.value && 
    !c.is_remedial_slot && 
    c.id !== componentForm.value.id
  )
})

watch(() => componentForm.value.parent_component_id, (newParentId) => {
  if (componentForm.value.is_remedial_slot && newParentId) {
    const parent = components.value.find((c: any) => c.id === newParentId)
    if (parent) {
      componentForm.value.weight_in_group = parent.weight_in_group
      componentForm.value.max_score = parent.max_score
    }
  }
})

const groupForm = reactive({
  id: '',
  name: '',
  weight_percent: '50.00',
  aggregation_method: 'simple_avg',
  sort_order: 0
})

onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    await loadSchoolData(schoolId)
  }
})

const loadSchoolData = async (schoolId: string) => {
  await Promise.all([
    fetchSubjects(schoolId),
    fetchAcademicYears(schoolId)
  ])
  const activeYear = academicYears.value.find((y: any) => y.is_active)
  if (activeYear) {
    selectedAcademicYearId.value = activeYear.id
  } else if (academicYears.value.length > 0) {
    selectedAcademicYearId.value = academicYears.value[0].id
  }

  if (selectedAcademicYearId.value) {
    await fetchClasses(schoolId, selectedAcademicYearId.value)
  } else {
    await fetchClasses(schoolId)
  }
}

watch(selectedFoundationId, (newVal) => onFoundationChange(newVal))

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    selectedClassId.value = ''
    selectedSubjectId.value = ''
    await loadSchoolData(newVal)
  } else {
    classes.value = []
    subjects.value = []
    academicYears.value = []
  }
})

watch(selectedSourceAcademicYearId, async (newVal) => {
  if (newVal && selectedSchoolId.value) {
    try {
      const res: any = await $fetch(`/api/v1/school/${selectedSchoolId.value}/class`, {
        query: { academic_year_id: newVal, page: 1, item_per_page: 1000 },
        headers: { Authorization: `Bearer ${useCookie('auth_token').value}` }
      })
      if (res.success) {
        sourceClasses.value = res.data.data
        if (!sourceClasses.value.find((c: any) => c.id === selectedSourceClassId.value)) {
          selectedSourceClassId.value = ''
        }
      }
    } catch (e) {
      console.error(e)
    }
  } else {
    sourceClasses.value = []
  }
})

watch(showCopyModal, (newVal) => {
  if (newVal) {
    if (!selectedSourceAcademicYearId.value) selectedSourceAcademicYearId.value = selectedAcademicYearId.value
    if (!selectedSourceSemester.value) selectedSourceSemester.value = selectedSemester.value
  }
})

// Trigger scheme fetch on filter change
watch([selectedClassId, selectedSubjectId, selectedAcademicYearId, selectedSemester], async ([newClass, newSubject, newYear, newSemester], [oldClass, oldSubject, oldYear, oldSemester]) => {
  if (newYear !== oldYear && newYear && selectedSchoolId.value) {
    await fetchClasses(selectedSchoolId.value, newYear)
    if (!classes.value.find(c => c.id === selectedClassId.value)) {
      selectedClassId.value = ''
    }
  }
  await loadActiveScheme()
})

const loadActiveScheme = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value || !selectedSubjectId.value || !selectedAcademicYearId.value || !selectedSemester.value) {
    scheme.value = null
    groups.value = []
    components.value = []
    kkm.value = null
    kkmInput.value = null
    return
  }

  loading.value = true
  try {
    const res: any = await gradebook.fetchSchemeByClassAndSubject(
      selectedSchoolId.value,
      selectedClassId.value,
      selectedSubjectId.value,
      selectedAcademicYearId.value,
      selectedSemester.value
    )

    if (res.success && res.data) {
      scheme.value = res.data
      await loadSchemeDetails(res.data.id)
    } else {
      scheme.value = null
      groups.value = []
      components.value = []
      kkm.value = null
      kkmInput.value = null
    }
  } catch (error) {
    console.error('Failed to load scheme:', error)
    scheme.value = null
  } finally {
    loading.value = false
  }
}

const loadSchemeDetails = async (schemeId: string) => {
  try {
    const detailRes: any = await gradebook.fetchSchemeScores(selectedSchoolId.value, schemeId)
    if (detailRes.success && detailRes.data) {
      groups.value = detailRes.data.groups
      components.value = detailRes.data.components
      kkmInput.value = detailRes.data.kkm
      kkm.value = detailRes.data.kkm
    }
  } catch (error) {
    console.error('Failed to load scheme details:', error)
  }
}

const handleCreateScheme = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value || !selectedSubjectId.value || !selectedAcademicYearId.value) return

  const className = classes.value.find(c => c.id === selectedClassId.value)?.class_name || ''
  const subjectName = subjects.value.find(s => s.id === selectedSubjectId.value)?.name || ''
  const semLabel = selectedSemester.value === 'odd' ? 'Ganjil' : 'Genap'

  try {
    const res: any = await gradebook.createScheme(selectedSchoolId.value, {
      class_id: selectedClassId.value,
      subject_id: selectedSubjectId.value,
      academic_year_id: selectedAcademicYearId.value,
      semester: selectedSemester.value,
      scheme_name: `${subjectName} - Kelas ${className} - Semester ${semLabel}`,
      config_level: 'class'
    })

    if (res.success) {
      toast.success('Skema penilaian berhasil dibuat.', 'Berhasil')
      await loadActiveScheme()
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal membuat skema penilaian', 'Gagal')
  }
}

const handleCopyScheme = async () => {
  if (!selectedSchoolId.value || !selectedSourceClassId.value || !selectedClassId.value || !selectedSubjectId.value || !selectedAcademicYearId.value) return

  try {
    const payload: any = {
      source_class_id: selectedSourceClassId.value,
      target_class_id: selectedClassId.value,
      target_subject_id: selectedSubjectId.value,
      target_academic_year_id: selectedAcademicYearId.value,
      target_semester: selectedSemester.value
    }
    
    if (selectedSourceAcademicYearId.value) {
      payload.source_academic_year_id = selectedSourceAcademicYearId.value
    }
    if (selectedSourceSemester.value) {
      payload.source_semester = selectedSourceSemester.value
    }
    const res: any = await gradebook.copyScheme(selectedSchoolId.value, payload)

    if (res.success) {
      toast.success('Skema penilaian berhasil disalin.', 'Berhasil')
      showCopyModal.value = false
      selectedSourceClassId.value = ''
      await loadActiveScheme()
    }
  } catch (error: any) {
    toast.error(error.response?._data?.message || error.message || 'Gagal menyalin skema penilaian', 'Gagal')
  }
}

const handleDeleteScheme = async () => {
  if (!scheme.value || !confirm('Apakah Anda yakin ingin menghapus skema penilaian ini beserta seluruh kelompok dan komponennya?')) return

  try {
    const res: any = await gradebook.deleteScheme(selectedSchoolId.value, scheme.value.id)
    if (res.success) {
      toast.success('Skema penilaian berhasil dihapus.', 'Berhasil')
      scheme.value = null
      groups.value = []
      components.value = []
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal menghapus skema', 'Gagal')
  }
}

// ────────────────────────────────────────────────────────────────
// GROUPS ACTIONS
// ────────────────────────────────────────────────────────────────
const openAddGroup = () => {
  Object.assign(groupForm, {
    id: '',
    name: '',
    weight_percent: '50.00',
    aggregation_method: 'simple_avg',
    sort_order: groups.value.length
  })
  showGroupModal.value = true
}

const openEditGroup = (g: any) => {
  Object.assign(groupForm, {
    id: g.id,
    name: g.name,
    weight_percent: g.weight_percent,
    aggregation_method: g.aggregation_method,
    sort_order: g.sort_order
  })
  showGroupModal.value = true
}

const handleSaveGroup = async () => {
  try {
    let res: any
    if (groupForm.id) {
      res = await gradebook.updateGroup(selectedSchoolId.value, groupForm.id, {
        name: groupForm.name,
        weight_percent: groupForm.weight_percent,
        aggregation_method: groupForm.aggregation_method,
        sort_order: groupForm.sort_order
      })
    } else {
      res = await gradebook.createGroup(selectedSchoolId.value, scheme.value.id, {
        name: groupForm.name,
        weight_percent: groupForm.weight_percent,
        aggregation_method: groupForm.aggregation_method,
        sort_order: groupForm.sort_order
      })
    }

    if (res.success) {
      toast.success('Kelompok komponen berhasil disimpan.', 'Berhasil')
      showGroupModal.value = false
      await loadActiveScheme()
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal menyimpan kelompok komponen', 'Gagal')
  }
}

const handleDeleteGroup = async (groupId: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus kelompok ini beserta seluruh komponen nilai di dalamnya?')) return

  try {
    const res: any = await gradebook.deleteGroup(selectedSchoolId.value, groupId)
    if (res.success) {
      toast.success('Kelompok komponen berhasil dihapus.', 'Berhasil')
      await loadActiveScheme()
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal menghapus kelompok', 'Gagal')
  }
}

// ────────────────────────────────────────────────────────────────
// COMPONENTS ACTIONS
// ────────────────────────────────────────────────────────────────
const openAddComponent = (groupId: string) => {
  activeGroupId.value = groupId
  const groupComps = components.value.filter(c => c.group_id === groupId)
  Object.assign(componentForm.value, {
    id: '',
    name: '',
    type: 'custom',
    weight_in_group: '100.00',
    max_score: '100.00',
    is_required: true,
    is_remedial_slot: false,
    parent_component_id: '',
    sort_order: groupComps.length,
    description: ''
  })
  showComponentModal.value = true
}

const openEditComponent = (comp: any) => {
  activeGroupId.value = comp.group_id
  Object.assign(componentForm.value, {
    id: comp.id,
    name: comp.name,
    type: comp.type,
    weight_in_group: comp.weight_in_group,
    max_score: comp.max_score,
    is_required: !!comp.is_required,
    is_remedial_slot: !!comp.is_remedial_slot,
    parent_component_id: comp.parent_component_id || '',
    sort_order: comp.sort_order,
    description: comp.description || ''
  })
  showComponentModal.value = true
}

const handleSaveComponent = async () => {
  try {
    let res: any
    if (componentForm.value.id) {
      res = await gradebook.updateComponent(selectedSchoolId.value, componentForm.value.id, {
        name: componentForm.value.name,
        type: componentForm.value.type,
        weight_in_group: componentForm.value.weight_in_group,
        max_score: componentForm.value.max_score,
        is_required: componentForm.value.is_required,
        is_remedial_slot: componentForm.value.is_remedial_slot,
        parent_component_id: componentForm.value.is_remedial_slot ? (componentForm.value.parent_component_id || null) : null,
        sort_order: componentForm.value.sort_order,
        description: componentForm.value.description
      })
    } else {
      res = await gradebook.createComponent(selectedSchoolId.value, activeGroupId.value, {
        name: componentForm.value.name,
        type: componentForm.value.type,
        weight_in_group: componentForm.value.weight_in_group,
        max_score: componentForm.value.max_score,
        is_required: componentForm.value.is_required,
        is_remedial_slot: componentForm.value.is_remedial_slot,
        parent_component_id: componentForm.value.is_remedial_slot ? (componentForm.value.parent_component_id || null) : null,
        sort_order: componentForm.value.sort_order,
        description: componentForm.value.description
      })
    }

    if (res.success) {
      toast.success('Komponen nilai berhasil disimpan.', 'Berhasil')
      showComponentModal.value = false
      await loadActiveScheme()
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal menyimpan komponen nilai', 'Gagal')
  }
}

const handleDeleteComponent = async (compId: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus komponen nilai ini?')) return

  try {
    const res: any = await gradebook.deleteComponent(selectedSchoolId.value, compId)
    if (res.success) {
      toast.success('Komponen nilai berhasil dihapus.', 'Berhasil')
      await loadActiveScheme()
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal menghapus komponen', 'Gagal')
  }
}

// ────────────────────────────────────────────────────────────────
// KKM SAVE
// ────────────────────────────────────────────────────────────────
const handleSaveKkm = async () => {
  if (kkmInput.value === null || kkmInput.value < 0 || kkmInput.value > 100) {
    toast.error('Nilai KKM harus di antara 0 sampai 100', 'Validasi')
    return
  }

  try {
    const res: any = await gradebook.upsertKkm(selectedSchoolId.value, {
      subject_id: selectedSubjectId.value,
      class_id: selectedClassId.value,
      academic_year_id: selectedAcademicYearId.value,
      semester: selectedSemester.value,
      kkm_score: String(kkmInput.value)
    })

    if (res.success) {
      toast.success('KKM berhasil diperbarui.', 'Berhasil')
      kkm.value = kkmInput.value
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal menyimpan KKM', 'Gagal')
  }
}

// Formula Text Preview Generator
const formulaText = computed(() => {
  if (groups.value.length === 0) return 'Nilai Akhir = Belum ada komponen'

  const sumWeights = groups.value.reduce((sum, g) => sum + Number(g.weight_percent), 0)
  const parts = groups.value.map(g => `(${g.name} × ${Number(g.weight_percent)}%)`)
  let text = `Nilai Akhir = ` + parts.join(' + ')

  if (sumWeights !== 100) {
    text += ` (Peringatan: Total bobot saat ini ${sumWeights}%, formula akan dinormalisasi ke 100% saat kalkulasi)`
  }

  return text
})

const getAggregationLabel = (method: string) => {
  const methods: Record<string, string> = {
    simple_avg: 'Rata-rata Sederhana',
    weighted_avg: 'Rata-rata Tertimbang',
    highest: 'Nilai Tertinggi',
    latest: 'Input Terakhir',
    mode: 'Modus (Sering Muncul)',
    drop_lowest: 'Rata-rata (Drop 1 Terendah)'
  }
  return methods[method] || method
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Konfigurasi Skema Penilaian</h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Atur bobot kelompok (Formatif/Sumatif), metode kalkulasi, KKM, and formula nilai raport.</p>
      </div>
      <div v-if="scheme" class="flex gap-2">
        <BaseButton variant="outline" @click="handleDeleteScheme" class="py-2.5 px-4 text-xs font-bold text-rose-600 hover:bg-rose-50 border-rose-200">
          <Trash2 class="mr-1.5" :size="14" /> Hapus Skema
        </BaseButton>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
      <div class="flex flex-col gap-1.5 lg:col-span-2">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-semibold outline-none transition-all focus:border-violet-600 text-slate-900 dark:text-zinc-100">
          <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kelas</label>
        <select v-model="selectedClassId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-semibold outline-none transition-all focus:border-violet-600 text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Kelas</option>
          <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.class_name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Mata Pelajaran</label>
        <select v-model="selectedSubjectId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-semibold outline-none transition-all focus:border-violet-600 text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Mapel</option>
          <option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tahun Ajaran</label>
        <select v-model="selectedAcademicYearId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-semibold outline-none transition-all focus:border-violet-600 text-slate-900 dark:text-zinc-100">
          <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Semester</label>
        <select v-model="selectedSemester" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-semibold outline-none transition-all focus:border-violet-600 text-slate-900 dark:text-zinc-100">
          <option value="odd">Ganjil</option>
          <option value="even">Genap</option>
        </select>
      </div>
    </div>

    <!-- TK/PAUD: Redirect Panel — Tidak memerlukan Setup Skema Penilaian Angka -->
    <div v-if="isTKSchool" class="bg-white dark:bg-zinc-900 border border-violet-200 dark:border-violet-900/50 rounded-2xl p-8 shadow-sm">
      <div class="flex flex-col items-center text-center max-w-lg mx-auto">
        <div class="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
          <Baby class="text-violet-600 dark:text-violet-400" :size="32" />
        </div>
        <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100 mb-2">Halaman Ini Tidak Diperlukan untuk TK/PAUD</h3>
        <p class="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
          Sekolah dengan jenjang <strong>TK, RA, KB, TPA, atau SPS</strong> menggunakan sistem penilaian
          <strong>Kurikulum Merdeka Fase Fondasi</strong> yang berbeda dari SD–SMA.
          Penilaian TK/PAUD tidak menggunakan nilai angka, skema bobot, atau KKM.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left w-full mb-8">
          <div class="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4">
            <p class="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1">Skala Nilai PAUD</p>
            <div class="space-y-1">
              <div class="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
                <span class="w-10 text-center font-black text-rose-500 bg-rose-50 dark:bg-rose-900/30 rounded px-1 py-0.5 text-[10px]">BB</span>
                <span>Belum Berkembang</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
                <span class="w-10 text-center font-black text-amber-500 bg-amber-50 dark:bg-amber-900/30 rounded px-1 py-0.5 text-[10px]">MB</span>
                <span>Mulai Berkembang</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
                <span class="w-10 text-center font-black text-sky-500 bg-sky-50 dark:bg-sky-900/30 rounded px-1 py-0.5 text-[10px]">BSH</span>
                <span>Berkembang Sesuai Harapan</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
                <span class="w-10 text-center font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 rounded px-1 py-0.5 text-[10px]">BSB</span>
                <span>Berkembang Sangat Baik</span>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 dark:bg-zinc-800/40 rounded-xl p-4 space-y-2">
            <p class="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Cara Setup Penilaian TK</p>
            <div class="flex items-start gap-2">
              <span class="shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center">1</span>
              <p class="text-xs text-slate-600 dark:text-zinc-300">Buka menu <strong>Rapor → Pengaturan Template</strong></p>
            </div>
            <div class="flex items-start gap-2">
              <span class="shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center">2</span>
              <p class="text-xs text-slate-600 dark:text-zinc-300">Buat atau edit Template Rapor TK untuk menetapkan aspek & elemen penilaian</p>
            </div>
            <div class="flex items-start gap-2">
              <span class="shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center">3</span>
              <p class="text-xs text-slate-600 dark:text-zinc-300">Buka <strong>Input Nilai → Generate Draft Rapor</strong> untuk mulai mengisi penilaian</p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-3 justify-center">
          <NuxtLink to="/report/template" class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-colors shadow-lg shadow-violet-600/20">
            Pergi ke Pengaturan Template <ArrowRight :size="14" />
          </NuxtLink>
          <NuxtLink to="/gradebook/input" class="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs py-2.5 px-5 rounded-xl transition-colors">
            Pergi ke Input Nilai
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- SD–SMA: Scheme State Panels -->
    <template v-else>
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm animate-pulse">
      <Calculator class="text-violet-500 animate-spin mb-4" :size="36" />
      <p class="text-xs font-bold text-slate-500">Memuat konfigurasi skema penilaian...</p>
    </div>

    <div v-else-if="!selectedClassId || !selectedSubjectId" class="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm text-center">
      <ClipboardList class="text-slate-300 dark:text-zinc-700 mb-3" :size="48" />
      <p class="text-sm font-bold text-slate-700 dark:text-zinc-200">Silakan Pilih Kelas dan Mata Pelajaran</p>
      <p class="text-xs text-slate-400 max-w-sm mt-1">Gunakan drop down filter di atas untuk memuat atau mengonfigurasi skema penilaian baru.</p>
    </div>

    <div v-else-if="!scheme" class="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm text-center">
      <AlertCircle class="text-amber-500 mb-3" :size="40" />
      <p class="text-sm font-bold text-slate-700 dark:text-zinc-200">Skema Penilaian Belum Dibuat</p>
      <p class="text-xs text-slate-400 max-w-sm mt-1 mb-6">Mata pelajaran dan kelas yang dipilih belum memiliki skema penilaian aktif untuk semester ini.</p>
      <div class="flex items-center gap-3">
        <BaseButton variant="primary" @click="handleCreateScheme" class="py-2.5 px-5 text-xs font-bold shadow-lg shadow-violet-600/15">
          <Plus class="mr-1.5" :size="14" /> Buat Skema Baru
        </BaseButton>
        <BaseButton variant="outline" @click="showCopyModal = true" class="py-2.5 px-5 text-xs font-bold border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-400 dark:hover:bg-violet-900/30">
          <Copy class="mr-1.5" :size="14" /> Salin dari Kelas Lain
        </BaseButton>
      </div>
    </div>

    <!-- Active Scheme Config Workspace -->
    <div v-else class="space-y-6">
      
      <!-- KKM & Overview Panel -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Formula Preview -->
        <div class="md:col-span-2 bg-gradient-to-r from-violet-600 to-indigo-700 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2 opacity-90">
              <Percent :size="16" />
              <span class="text-[9px] uppercase tracking-wider font-bold">Preview Formula Nilai Akhir</span>
            </div>
            <p class="text-lg font-black leading-snug tracking-tight mb-2">
              {{ formulaText }}
            </p>
            <p class="text-xs text-violet-100 font-medium opacity-80">
              Kalkulasi dijalankan secara real-time pada database per-row saat guru menginput nilai siswa.
            </p>
          </div>
          <div class="flex items-center gap-1.5 text-[10px] text-amber-300 font-bold bg-white/10 px-3 py-1.5 rounded-lg w-max mt-4">
            <Info :size="12" /> Skema Aktif: {{ scheme.scheme_name }}
          </div>
        </div>

        <!-- KKM Config -->
        <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2 text-slate-500 dark:text-zinc-400">
              <Award :size="16" />
              <span class="text-[9px] uppercase tracking-wider font-bold">Kriteria Ketuntasan Minimal (KKM)</span>
            </div>
            <p class="text-xs text-slate-400 dark:text-zinc-500 leading-normal">
              Siswa dengan Nilai Akhir di bawah batas KKM akan ditandai merah dan direkomendasikan untuk remedial.
            </p>
          </div>
          <div class="flex items-center gap-2 mt-4">
            <input 
              v-model="kkmInput" 
              type="number" 
              placeholder="KKM" 
              min="0" max="100"
              class="w-24 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-black outline-none focus:border-violet-600 text-center"
            />
            <BaseButton variant="primary" @click="handleSaveKkm" class="py-2 px-3 text-xs font-bold flex-1">
              Simpan KKM
            </BaseButton>
          </div>
        </div>

      </div>

      <!-- Component Groups Listing -->
      <div class="flex items-center justify-between pt-4">
        <div>
          <h3 class="text-base font-bold text-slate-800 dark:text-zinc-200">Kelompok Komponen Nilai</h3>
          <p class="text-xs text-slate-400">Bagi nilai menjadi beberapa kelompok besar, contoh: Formatif (60%), Sumatif (40%).</p>
        </div>
        <BaseButton variant="outline" @click="openAddGroup" class="py-2 px-3.5 text-xs font-bold">
          <Plus class="mr-1.5" :size="14" /> Tambah Kelompok
        </BaseButton>
      </div>

      <!-- Group Cards Grid -->
      <div class="grid grid-cols-1 gap-6">
        
        <div 
          v-for="group in groups" 
          :key="group.id" 
          class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
        >
          <!-- Group Header -->
          <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-850">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-black text-slate-800 dark:text-zinc-100">{{ group.name }}</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/10">
                  Bobot {{ Number(group.weight_percent) }}%
                </span>
                <span class="text-slate-300 dark:text-zinc-700">|</span>
                <span class="text-[10px] text-slate-400 font-semibold">{{ getAggregationLabel(group.aggregation_method) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button @click="openEditGroup(group)" class="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <Edit2 :size="13" />
              </button>
              <button @click="handleDeleteGroup(group.id)" class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <Trash2 :size="13" />
              </button>
            </div>
          </div>

          <!-- Components under this group -->
          <div class="space-y-3">
            <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center justify-between">
              <span>Daftar Komponen Nilai (NH, UTS, UAS, dll)</span>
              <button @click="openAddComponent(group.id)" class="text-xs text-violet-600 hover:text-violet-700 font-bold flex items-center gap-1 normal-case tracking-normal">
                <Plus :size="12" /> Tambah Komponen
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <!-- Component card -->
              <div 
                v-for="comp in components.filter(c => c.group_id === group.id)" 
                :key="comp.id"
                class="bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-200/50 dark:border-zinc-855 p-4 rounded-xl space-y-2.5 flex flex-col justify-between group/comp"
              >
                <div>
                  <div class="flex justify-between items-start">
                    <span class="text-xs font-black text-slate-800 dark:text-zinc-200">{{ comp.name }}</span>
                    <div class="flex items-center gap-0.5 opacity-0 group-hover/comp:opacity-100 transition-opacity">
                      <button @click="openEditComponent(comp)" class="p-1 text-slate-400 hover:text-violet-600">
                        <Edit2 :size="11" />
                      </button>
                      <button @click="handleDeleteComponent(comp.id)" class="p-1 text-slate-400 hover:text-rose-600">
                        <Trash2 :size="11" />
                      </button>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-1 mt-1">
                    <span class="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 dark:bg-zinc-900 text-slate-500 border border-slate-200/60 dark:border-zinc-800">
                      Tipe: {{ comp.type }}
                    </span>
                    <span v-if="comp.is_remedial_slot" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Remedial Slot
                      <template v-if="comp.parent_component_id">
                        <span class="opacity-60 font-normal ml-0.5">→</span>
                        <span class="max-w-[80px] truncate" :title="'Terikat ke: ' + (components.find(c => c.id === comp.parent_component_id)?.name || 'Unknown')">
                          {{ components.find(c => c.id === comp.parent_component_id)?.name || 'Unknown' }}
                        </span>
                      </template>
                    </span>
                  </div>

                  <p v-if="comp.description" class="text-[10px] text-slate-400 dark:text-zinc-505 mt-2 line-clamp-2 leading-relaxed">
                    {{ comp.description }}
                  </p>
                </div>

                <div class="pt-3 border-t border-slate-100 dark:border-zinc-850 flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>Maks Nilai: {{ Number(comp.max_score) }}</span>
                  <span class="text-slate-500 dark:text-zinc-305">Bobot {{ Number(comp.weight_in_group) }}%</span>
                </div>
              </div>

              <!-- Component empty placeholder -->
              <div 
                v-if="components.filter(c => c.group_id === group.id).length === 0"
                class="col-span-full py-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-zinc-850 rounded-xl flex flex-col justify-center items-center gap-1"
              >
                <ClipboardList class="opacity-45" :size="20" />
                <span class="text-[10px] font-bold text-slate-400 dark:text-zinc-505">Belum ada komponen nilai</span>
                <button @click="openAddComponent(group.id)" class="text-[10px] text-violet-600 font-bold hover:underline">
                  + Klik untuk menambahkan komponen
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- Group Modal -->
    <BaseModal :show="showGroupModal" :title="groupForm.id ? 'Ubah Kelompok Komponen' : 'Kelompok Komponen Baru'" @close="showGroupModal = false">
      <form @submit.prevent="handleSaveGroup" class="space-y-4">
        <BaseInput v-model="groupForm.name" label="Nama Kelompok Komponen" placeholder="Contoh: Formatif (Tugas & Ulangan), Sumatif" required />
        
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="groupForm.weight_percent" label="Bobot Kelompok (%)" type="number" step="0.01" min="0" max="100" required />
          <BaseInput v-model="groupForm.sort_order" label="Urutan Tampilan" type="number" required />
        </div>

        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Metode Agregasi Komponen</label>
          <select v-model="groupForm.aggregation_method" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 text-slate-900 dark:text-zinc-100">
            <option value="simple_avg">Rata-rata Sederhana</option>
            <option value="weighted_avg">Rata-rata Tertimbang (Berdasarkan bobot komponen)</option>
            <option value="highest">Ambil Nilai Tertinggi</option>
            <option value="latest">Ambil Input Nilai Terakhir</option>
            <option value="mode">Modus (Untuk TK - BB/MB/BSH/BSB)</option>
            <option value="drop_lowest">Rata-rata setelah drop 1 nilai terendah</option>
          </select>
          <p class="text-[10px] text-slate-500 dark:text-zinc-400 px-1 mt-0.5 leading-relaxed bg-slate-50 dark:bg-zinc-900/50 p-2 rounded border border-slate-100 dark:border-zinc-800">
            <span v-if="groupForm.aggregation_method === 'simple_avg'">
              <strong class="text-slate-700 dark:text-zinc-200">Rata-rata Sederhana:</strong> Menjumlahkan seluruh komponen nilai dan membaginya sama rata. Cocok untuk perhitungan ulangan/tugas yang bobotnya dianggap sama.
            </span>
            <span v-else-if="groupForm.aggregation_method === 'weighted_avg'">
              <strong class="text-slate-700 dark:text-zinc-200">Rata-rata Tertimbang:</strong> Nilai ditentukan berdasarkan pengaturan persen bobot per komponen. Komponen dengan bobot lebih besar akan lebih memengaruhi nilai akhir kelompok.
            </span>
            <span v-else-if="groupForm.aggregation_method === 'highest'">
              <strong class="text-slate-700 dark:text-zinc-200">Nilai Tertinggi:</strong> Hanya mengambil satu nilai angka paling besar dari semua komponen dalam kelompok ini. Biasa dikonfigurasi untuk menangani nilai percobaan/remedial.
            </span>
            <span v-else-if="groupForm.aggregation_method === 'latest'">
              <strong class="text-slate-700 dark:text-zinc-200">Nilai Terakhir:</strong> Mengabaikan komponen-komponen sebelumnya, murni hanya menggunakan nilai input paling akhir (berdasarkan urutan).
            </span>
            <span v-else-if="groupForm.aggregation_method === 'mode'">
              <strong class="text-slate-700 dark:text-zinc-200">Modus (Mayoritas):</strong> <strong>Khusus untuk Rapor TK/PAUD</strong> yang memakai huruf (BB, MB, BSH, BSB). Otomatis mengambil predikat yang paling dominan / paling sering dicapai.
            </span>
            <span v-else-if="groupForm.aggregation_method === 'drop_lowest'">
              <strong class="text-slate-700 dark:text-zinc-200">Drop Lowest:</strong> Secara otomatis mencoret (membuang) 1 nilai siswa yang paling kecil/jelek, lalu merata-rata sisa nilainya.
            </span>
          </p>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showGroupModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Kelompok</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Component Modal -->
    <BaseModal :show="showComponentModal" :title="componentForm.id ? 'Ubah Komponen Nilai' : 'Komponen Nilai Baru'" @close="showComponentModal = false">
      <form @submit.prevent="handleSaveComponent" class="space-y-4">
        <BaseInput v-model="componentForm.name" label="Nama Komponen" placeholder="Contoh: NH1 (Bab Perkalian), PTS, PAS" required />
        
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tipe Nilai</label>
            <select v-model="componentForm.type" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 text-slate-900 dark:text-zinc-100">
              <option value="nilai_harian">Nilai Harian / Ulangan</option>
              <option value="tugas">Tugas / PR</option>
              <option value="pts">PTS / UTS</option>
              <option value="pas">PAS / UAS</option>
              <option value="praktikum">Praktikum / Praktek</option>
              <option value="portofolio">Portofolio / Proyek</option>
              <option value="observasi">Observasi</option>
              <option value="sikap">Penilaian Sikap</option>
              <option value="p5">P5 (Kokurikuler)</option>
              <option value="custom">Custom</option>
            </select>
            <p class="text-[10px] text-slate-500 dark:text-zinc-400 px-1 mt-0.5 leading-relaxed bg-slate-50 dark:bg-zinc-900/50 p-2 rounded border border-slate-100 dark:border-zinc-800">
              <span v-if="componentForm.type === 'nilai_harian'"><strong>Ulangan Harian:</strong> Evaluasi rutin per-bab atau per-KD (Kompetensi Dasar).</span>
              <span v-else-if="componentForm.type === 'tugas'"><strong>Tugas/PR:</strong> Penilaian dari pekerjaan rumah atau penugasan individu/kelompok.</span>
              <span v-else-if="componentForm.type === 'pts'"><strong>PTS/UTS:</strong> Penilaian Tengah Semester (Sumatif Tengah Semester).</span>
              <span v-else-if="componentForm.type === 'pas'"><strong>PAS/UAS:</strong> Penilaian Akhir Semester (Sumatif Akhir Semester).</span>
              <span v-else-if="componentForm.type === 'praktikum'"><strong>Praktikum:</strong> Nilai kinerja di lab atau demonstrasi keterampilan teknis.</span>
              <span v-else-if="componentForm.type === 'portofolio'"><strong>Portofolio:</strong> Kumpulan karya siswa yang dievaluasi secara kumulatif.</span>
              <span v-else-if="componentForm.type === 'observasi'"><strong>Observasi:</strong> Pengamatan keseharian siswa. Sangat cocok untuk PAUD/TK (nilai naratif/predikat).</span>
              <span v-else-if="componentForm.type === 'sikap'"><strong>Sikap:</strong> Penilaian karakter, budi pekerti, dan spiritual.</span>
              <span v-else-if="componentForm.type === 'p5'"><strong>P5:</strong> Projek Penguatan Profil Pelajar Pancasila (Kurikulum Merdeka).</span>
              <span v-else-if="componentForm.type === 'custom'"><strong>Custom:</strong> Tipe nilai bebas sesuai kebijakan sekolah atau guru mata pelajaran.</span>
            </p>
          </div>
          <BaseInput v-model="componentForm.max_score" label="Batas Nilai Maksimal" type="number" step="0.01" required :disabled="componentForm.is_remedial_slot" />
        </div>

        <div class="grid grid-cols-2 gap-4 items-start">
          <div>
            <BaseInput v-model="componentForm.weight_in_group" label="Bobot dalam Kelompok (%)" type="number" step="0.01" min="0" max="100" required :disabled="componentForm.is_remedial_slot" />
            <p v-if="!isActiveGroupWeighted" class="mt-1.5 text-[9px] font-medium text-amber-600/90 dark:text-amber-500/90 leading-relaxed bg-amber-500/10 p-2 rounded border border-amber-500/20">
              <strong class="block mb-0.5">Kelompok Sederhana/Tertinggi:</strong>
              Biarkan bobot tetap <strong>100</strong> agar Anda dapat menambah komponen lain tanpa terblokir validasi bobot.
            </p>
          </div>
          <BaseInput v-model="componentForm.sort_order" label="Urutan Tampilan" type="number" required />
        </div>

        <div class="flex flex-col gap-2 px-1 py-1 mt-2">
          <div class="flex items-start gap-2.5">
            <input type="checkbox" id="is_remedial_slot" v-model="componentForm.is_remedial_slot" class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 mt-0.5" />
            <div>
              <label for="is_remedial_slot" class="text-xs font-semibold text-slate-700 dark:text-zinc-300">Komponen ini adalah slot nilai remedial (perbaikan)</label>
              <p class="text-[9.5px] text-slate-500 dark:text-zinc-450 mt-0.5 leading-relaxed">Kolom nilai ini opsional (hanya diisi untuk siswa yang belum tuntas). Sangat disarankan untuk <strong>TIDAK mencentang</strong> kotak Wajib Diisi di bawah.</p>
            </div>
          </div>

          <div v-if="componentForm.is_remedial_slot" class="ml-6 mt-1 p-3 bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30 rounded-lg">
            <label class="block text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-1.5">Komponen Utama (Yang Diremidi)</label>
            <select v-model="componentForm.parent_component_id" required class="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md px-3 py-2 text-xs outline-none transition-all focus:border-violet-600 text-slate-900 dark:text-zinc-100">
              <option value="" disabled selected>-- Pilih Komponen Utama --</option>
              <option v-for="c in activeGroupBaseComponents" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
            <p class="text-[9px] text-slate-500 mt-1.5">Wajib dipilih. Nilai Batas Maksimal & Bobot komponen ini akan disinkronkan otomatis sesuai induknya.</p>
          </div>
        </div>

        <div class="flex items-start gap-2.5 px-1 py-1">
          <input type="checkbox" id="is_required" v-model="componentForm.is_required" class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 mt-0.5" />
          <div>
            <label for="is_required" class="text-xs font-semibold text-slate-700 dark:text-zinc-300">Komponen wajib diisi (Wajib Ada Nilai)</label>
            <p class="text-[9.5px] text-slate-500 dark:text-zinc-450 mt-0.5 leading-relaxed">Jika dicentang, sistem (Strict Mode) dapat menolak penguncian nilai apabila masih ada kotak siswa yang dibiarkan kosong.</p>
          </div>
        </div>

        <BaseInput v-model="componentForm.description" label="Keterangan / Deskripsi Komponen" placeholder="Contoh: Kompetensi Dasar perkalian dan pembagian" />

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showComponentModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Komponen</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Copy Scheme Modal -->
    <BaseModal :show="showCopyModal" title="Salin Skema Penilaian" @close="showCopyModal = false">
      <form @submit.prevent="handleCopyScheme" class="space-y-4">
        <p class="text-xs text-slate-500 mb-2">
          Pilih kelas sumber untuk menyalin seluruh konfigurasi kelompok dan komponen penilaian. KKM tidak akan disalin.
        </p>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Tahun Ajaran Sumber</label>
            <select v-model="selectedSourceAcademicYearId" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-violet-600 dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100">
              <option value="" disabled>Pilih Tahun Ajaran</option>
              <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.name }}</option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Semester Sumber</label>
            <select v-model="selectedSourceSemester" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-violet-600 dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100">
              <option value="odd">Ganjil</option>
              <option value="even">Genap</option>
            </select>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Kelas Sumber</label>
          <select v-model="selectedSourceClassId" required class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-violet-600 dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100">
            <option value="" disabled>Pilih Kelas Sumber</option>
            <option v-for="c in (sourceClasses.length ? sourceClasses : classes).filter((cls: any) => cls.id !== selectedClassId)" :key="c.id" :value="c.id">{{ c.class_name }}</option>
          </select>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showCopyModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit" :disabled="!selectedSourceClassId">Salin Skema</BaseButton>
        </div>
      </form>
    </BaseModal>
  </template><!-- end v-else SD-SMA -->
  </div>
</template>
