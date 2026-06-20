<script setup lang="ts">
import { 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  Bookmark, 
  LayoutTemplate, 
  Layers, 
  Settings, 
  ChevronRight, 
  AlertCircle,
  FileText,
  Sliders
} from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useSchool } from '../../composables/useSchool'
import { useReportTemplate } from '../../composables/useReportTemplate'
import { useSubject } from '../../composables/useSubject'
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

const { 
  foundations, 
  schools, 
  fetchFoundations, 
  fetchSchools, 
  curriculums, 
  fetchCurriculums,
  p5Dimensions,
  fetchP5Dimensions,
  createP5Dimension,
  updateP5Dimension,
  deleteP5Dimension
} = useSchool()
const { subjects, fetchSubjects } = useSubject()
const { 
  reportTemplates, 
  currentTemplate, 
  fetchReportTemplates, 
  fetchReportTemplateById, 
  createReportTemplate, 
  updateReportTemplate, 
  deleteReportTemplate,
  addAssessmentElement,
  updateAssessmentElement,
  deleteAssessmentElement
} = useReportTemplate()

const toast = useToast()

const selectedFoundationId = ref('')
const selectedSchoolId = ref('')
const levelFilter = ref('') // all
const loading = ref(false)
const detailsLoading = ref(false)

const selectedSchool = computed(() => {
  return schools.value.find(s => s.id === selectedSchoolId.value)
})

const selectedSchoolLevel = computed(() => {
  return selectedSchool.value?.level || ''
})

watch(selectedSchoolLevel, (newVal) => {
  if (newVal) {
    levelFilter.value = newVal
    templateForm.level = newVal
    editTemplateForm.level = newVal
  }
}, { immediate: true })

// Modals state
const showCreateTemplateModal = ref(false)
const showEditTemplateModal = ref(false)
const showCreateElementModal = ref(false)
const showEditElementModal = ref(false)

// Template Form State
const templateForm = reactive({
  name: '',
  level: 'TK',
  curriculum_id: '',
  element_structure: {
    is_dinas: false,
    tk_sections: []
  },
  grading_scale: {},
  is_active: true
})

const editingTemplateId = ref('')
const editTemplateForm = reactive({
  name: '',
  level: '',
  curriculum_id: '',
  element_structure: {
    is_dinas: false,
    tk_sections: []
  },
  grading_scale: {},
  is_active: true
})

// Element Form State
const elementForm = reactive({
  subject_id: '',
  name: '',
  grade_type: 'letter',
  scale: 'BB-BSB',
  weight: '1.0',
  sort_order: 1
})

const editingElementId = ref('')
const editElementForm = reactive({
  subject_id: '',
  name: '',
  grade_type: 'letter',
  scale: 'BB-BSB',
  weight: '1.0',
  sort_order: 1
})

onMounted(async () => {
  await fetchFoundations()
  if (foundations.value.length > 0) {
    selectedFoundationId.value = foundations.value[0].id
    await fetchSchools(selectedFoundationId.value)
    await fetchCurriculums(selectedFoundationId.value)
    if (schools.value.length > 0) {
      selectedSchoolId.value = schools.value[0].id
      await loadSchoolData(selectedSchoolId.value)
    }
  }
})

const loadSchoolData = async (schoolId: string) => {
  loading.value = true
  try {
    await Promise.all([
      fetchReportTemplates(schoolId, levelFilter.value || undefined),
      fetchSubjects(schoolId),
      fetchP5Dimensions(schoolId)
    ])
    if (reportTemplates.value.length > 0) {
      await selectTemplate(reportTemplates.value[0].id)
    } else {
      currentTemplate.value = null
    }
  } catch (error) {
    console.error('Failed to load school templates data:', error)
  } finally {
    loading.value = false
  }
}

watch(selectedFoundationId, async (newVal) => {
  if (newVal) {
    await fetchSchools(newVal)
    await fetchCurriculums(newVal)
    if (schools.value.length > 0) {
      selectedSchoolId.value = schools.value[0].id
    } else {
      selectedSchoolId.value = ''
      reportTemplates.value = []
      currentTemplate.value = null
    }
  }
})

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await loadSchoolData(newVal)
  } else {
    reportTemplates.value = []
    currentTemplate.value = null
  }
})

watch(levelFilter, async (newVal) => {
  if (selectedSchoolId.value) {
    loading.value = true
    await fetchReportTemplates(selectedSchoolId.value, newVal || undefined)
    if (reportTemplates.value.length > 0) {
      await selectTemplate(reportTemplates.value[0].id)
    } else {
      currentTemplate.value = null
    }
    loading.value = false
  }
})

const selectTemplate = async (id: string) => {
  detailsLoading.value = true
  try {
    await fetchReportTemplateById(selectedSchoolId.value, id)
  } catch (error) {
    toast.error('Gagal memuat detail template rapor.', 'Gagal')
  } finally {
    detailsLoading.value = false
  }
}

// Template Actions
const handleCreateTemplate = async () => {
  try {
    const res = await createReportTemplate(selectedSchoolId.value, { ...templateForm })
    if (res.success) {
      toast.success('Template rapor baru berhasil disimpan.', 'Sukses')
      showCreateTemplateModal.value = false
      Object.assign(templateForm, {
        name: '',
        level: 'TK',
        curriculum_id: '',
        element_structure: {
          is_dinas: false,
          tk_sections: []
        },
        grading_scale: {},
        is_active: true
      })
      if (reportTemplates.value.length > 0) {
        await selectTemplate(reportTemplates.value[0].id)
      }
    }
  } catch (e: any) {
    toast.error(e?.message || 'Gagal menyimpan template rapor.', 'Error')
  }
}

const openEditTemplateModal = (tpl: any) => {
  editingTemplateId.value = tpl.id
  Object.assign(editTemplateForm, {
    name: tpl.name,
    level: tpl.level,
    curriculum_id: tpl.curriculum_id || '',
    element_structure: {
      is_dinas: !!tpl.element_structure?.is_dinas,
      tk_sections: tpl.element_structure?.tk_sections || []
    },
    grading_scale: tpl.grading_scale || {},
    is_active: !!tpl.is_active
  })
  showEditTemplateModal.value = true
}

const handleUpdateTemplate = async () => {
  try {
    const res = await updateReportTemplate(selectedSchoolId.value, editingTemplateId.value, { ...editTemplateForm })
    if (res.success) {
      toast.success('Template rapor berhasil diperbarui.', 'Sukses')
      showEditTemplateModal.value = false
      await selectTemplate(editingTemplateId.value)
    }
  } catch (e: any) {
    toast.error(e?.message || 'Gagal memperbarui template rapor.', 'Error')
  }
}

const handleDeleteTemplate = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus template rapor ini?')) {
    try {
      await deleteReportTemplate(selectedSchoolId.value, id)
      toast.success('Template rapor berhasil dihapus.', 'Sukses')
      if (reportTemplates.value.length > 0) {
        await selectTemplate(reportTemplates.value[0].id)
      } else {
        currentTemplate.value = null
      }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal menghapus template rapor.', 'Error')
    }
  }
}

// Element Actions
const handleCreateElement = async () => {
  try {
    const res = await addAssessmentElement(selectedSchoolId.value, currentTemplate.value.id, { ...elementForm })
    if (res.success) {
      toast.success('Elemen penilaian berhasil ditambahkan.', 'Sukses')
      showCreateElementModal.value = false
      Object.assign(elementForm, {
        subject_id: '',
        name: '',
        grade_type: 'letter',
        scale: 'BB-BSB',
        weight: '1.0',
        sort_order: currentTemplate.value.elements.length + 1
      })
    }
  } catch (e: any) {
    toast.error(e?.message || 'Gagal menambahkan elemen penilaian.', 'Error')
  }
}

const openEditElementModal = (el: any) => {
  editingElementId.value = el.id
  Object.assign(editElementForm, {
    subject_id: el.subject_id || '',
    name: el.name,
    grade_type: el.grade_type || 'letter',
    scale: el.scale || '',
    weight: el.weight || '1.0',
    sort_order: el.sort_order || 1
  })
  showEditElementModal.value = true
}

const handleUpdateElement = async () => {
  try {
    const res = await updateAssessmentElement(
      selectedSchoolId.value, 
      currentTemplate.value.id, 
      editingElementId.value, 
      { ...editElementForm }
    )
    if (res.success) {
      toast.success('Elemen penilaian berhasil diperbarui.', 'Sukses')
      showEditElementModal.value = false
    }
  } catch (e: any) {
    toast.error(e?.message || 'Gagal memperbarui elemen penilaian.', 'Error')
  }
}

const handleDeleteElement = async (eid: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus elemen penilaian ini?')) {
    try {
      await deleteAssessmentElement(selectedSchoolId.value, currentTemplate.value.id, eid)
      toast.success('Elemen penilaian berhasil dihapus.', 'Sukses')
    } catch (e: any) {
      toast.error(e?.message || 'Gagal menghapus elemen penilaian.', 'Error')
    }
  }
}

// Preset helpers for elements
const applyTKPreset = () => {
  elementForm.grade_type = 'letter'
  elementForm.scale = 'BB-BSB'
  elementForm.weight = '1.0'
}

const applyNumericPreset = () => {
  elementForm.grade_type = 'numeric'
  elementForm.scale = '0-100'
  elementForm.weight = '1.0'
}

// ─── TK DINAS MAPPING TAB STATE & LOGIC ───
const activeTab = ref('elements')
const tkSections = ref<any[]>([])

const activeP5Dimensions = computed(() => {
  if (p5Dimensions.value && p5Dimensions.value.length > 0) {
    return p5Dimensions.value;
  }
  return [
    { id: 'keimanan', name: 'Keimanan & Takwa', description: 'Berakhlak mulia kepada Tuhan YME dan sesama makhluk ciptaan-Nya.' },
    { id: 'kewargaan', name: 'Kewargaan / Kebinekaan', description: 'Menghargai keragaman budaya, toleransi, dan identitas global.' },
    { id: 'penalaran', name: 'Penalaran Kritis', description: 'Memproses, menganalisis, serta mengevaluasi informasi secara kritis.' },
    { id: 'kreativitas', name: 'Kreativitas', description: 'Memodifikasi dan menghasilkan karya/ide yang orisinal.' },
    { id: 'kolaborasi', name: 'Kolaborasi / Gotong Royong', description: 'Bekerja sama, berkolaborasi, dan berbagi peran dengan sesama.' },
    { id: 'kemandirian', name: 'Kemandirian', description: 'Memiliki kesadaran akan diri dan tanggung jawab atas proses belajarnya.' },
    { id: 'kesehatan', name: 'Jasmani & Kesehatan', description: 'Menjaga kebugaran jasmani, kesehatan fisik, dan keseimbangan hidup.' },
    { id: 'komunikasi', name: 'Komunikasi & Bahasa', description: 'Menyampaikan pesan, emosi, dan berinteraksi secara verbal & tertulis.' }
  ];
})

const previewDinasSections = computed(() => {
  if (!currentTemplate.value) return []
  return tkSections.value.map(sec => {
    return {
      id: sec.id,
      title: sec.title,
      categories: (sec.categories || []).map(cat => {
        const subAssessments = (cat.sub_element_ids || []).map(sid => {
          const el = currentTemplate.value.elements?.find(e => e.id === sid)
          return {
            name: el ? el.name : 'Indikator Capaian Perkembangan',
            grade: 'BSH'
          }
        })
        
        const p5DimsData: any = {}
        activeP5Dimensions.value.forEach(dim => {
          p5DimsData[dim.id] = 'BSH'
        })

        return {
          id: cat.id,
          title: cat.title,
          narrative: 'Ananda menunjukkan perkembangan yang sangat baik dalam aspek ini. Aktif berpartisipasi dalam setiap kegiatan kelas, mampu bersosialisasi dengan sangat baik, serta menunjukkan kreativitas yang tinggi dalam menyelesaikan tugas.',
          is_p5_matrix: !!cat.is_p5_matrix,
          p5_dimensions: p5DimsData,
          subAssessments
        }
      })
    }
  })
})

watch(() => currentTemplate.value, (newTpl) => {
  if (newTpl) {
    const sections = JSON.parse(JSON.stringify(newTpl.element_structure?.tk_sections || []))
    // Clean and verify P5 structure
    sections.forEach(sec => {
      (sec.categories || []).forEach(cat => {
        if (cat.is_p5_matrix === undefined) cat.is_p5_matrix = false
        if (!cat.p5_dimensions) {
          cat.p5_dimensions = {}
        }
        
        activeP5Dimensions.value.forEach(dim => {
          if (cat.p5_dimensions[dim.id] === undefined) {
            const getDimensionKey = (dimName: string) => {
              const normalized = dimName.toLowerCase();
              if (normalized.includes('keimanan')) return 'keimanan';
              if (normalized.includes('kewargaan') || normalized.includes('kebinekaan')) return 'kewargaan';
              if (normalized.includes('penalaran')) return 'penalaran';
              if (normalized.includes('kreativitas')) return 'kreativitas';
              if (normalized.includes('kolaborasi') || normalized.includes('gotong royong')) return 'kolaborasi';
              if (normalized.includes('kemandirian')) return 'kemandirian';
              if (normalized.includes('jasmani') || normalized.includes('kesehatan')) return 'kesehatan';
              if (normalized.includes('komunikasi') || normalized.includes('bahasa')) return 'komunikasi';
              return '';
            }
            
            const oldKey = getDimensionKey(dim.name);
            if (oldKey && cat.p5_dimensions[oldKey] !== undefined) {
              cat.p5_dimensions[dim.id] = cat.p5_dimensions[oldKey]
            } else {
              cat.p5_dimensions[dim.id] = ''
            }
          }
        })
      })
    })
    tkSections.value = sections
  }
}, { immediate: true })

const addSection = () => {
  tkSections.value.push({
    id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    title: 'KELOMPOK BARU',
    categories: []
  })
}

const addCategory = (sIdx: number) => {
  tkSections.value[sIdx].categories.push({
    id: 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    title: 'KATEGORI PENILAIAN BARU',
    narrative_element_id: '',
    is_p5_matrix: false,
    p5_dimensions: {},
    sub_element_ids: []
  })
}

const handleSaveTKMapping = async () => {
  try {
    const updatedTemplate = {
      ...currentTemplate.value,
      element_structure: {
        ...currentTemplate.value.element_structure,
        tk_sections: JSON.parse(JSON.stringify(tkSections.value)),
        is_dinas: true
      }
    }
    const res = await updateReportTemplate(selectedSchoolId.value, currentTemplate.value.id, updatedTemplate)
    if (res.success) {
      toast.success('Tata letak Rapor Dinas TK berhasil disimpan.', 'Sukses')
      await selectTemplate(currentTemplate.value.id)
    }
  } catch (e: any) {
    toast.error(e?.message || 'Gagal menyimpan tata letak rapor dinas.', 'Error')
  }
}

// P5 Dimensions Management UI Actions
const showManageP5Modal = ref(false)
const p5Form = reactive({
  id: '',
  name: '',
  description: '',
  sort_order: 1
})
const isEditingP5 = ref(false)

const openManageP5Modal = () => {
  showManageP5Modal.value = true
  resetP5Form()
}

const resetP5Form = () => {
  p5Form.id = ''
  p5Form.name = ''
  p5Form.description = ''
  p5Form.sort_order = p5Dimensions.value.length + 1
  isEditingP5.value = false
}

const handleEditP5 = (dim: any) => {
  p5Form.id = dim.id
  p5Form.name = dim.name
  p5Form.description = dim.description || ''
  p5Form.sort_order = dim.sort_order
  isEditingP5.value = true
}

const handleSaveP5 = async () => {
  if (!p5Form.name) {
    toast.error('Nama dimensi harus diisi.', 'Error')
    return
  }
  
  try {
    if (isEditingP5.value && p5Form.id) {
      await updateP5Dimension(selectedSchoolId.value, p5Form.id, {
        name: p5Form.name,
        description: p5Form.description,
        sort_order: p5Form.sort_order
      })
      toast.success('Dimensi P5 berhasil diperbarui.', 'Sukses')
    } else {
      await createP5Dimension(selectedSchoolId.value, {
        name: p5Form.name,
        description: p5Form.description,
        sort_order: p5Form.sort_order
      })
      toast.success('Dimensi P5 baru berhasil ditambahkan.', 'Sukses')
    }
    resetP5Form()
  } catch (e: any) {
    toast.error(e?.message || 'Gagal menyimpan dimensi P5.', 'Error')
  }
}

const handleDeleteP5 = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus dimensi P5 ini?')) {
    try {
      await deleteP5Dimension(selectedSchoolId.value, id)
      toast.success('Dimensi P5 berhasil dihapus.', 'Sukses')
      resetP5Form()
    } catch (e: any) {
      toast.error(e?.message || 'Gagal menghapus dimensi P5.', 'Error')
    }
  }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <LayoutTemplate class="text-violet-600" :size="24" /> Konfigurasi Template Rapor
        </h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Sesuaikan layout, aspek capaian perkembangan (TK/PAUD), dan struktur e-raport per jenjang.</p>
      </div>
      <div class="flex gap-2">
        <BaseButton variant="primary" @click="showCreateTemplateModal = true" :disabled="!selectedSchoolId" class="py-2.5 px-4 text-xs font-bold shadow-lg shadow-violet-600/15">
          <Plus class="mr-1.5" :size="14" /> Template Baru
        </BaseButton>
      </div>
    </div>

    <!-- Filters & Tenancy Selection -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Yayasan</label>
        <select v-model="selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
          <option value="" disabled>Pilih Yayasan</option>
          <option v-for="found in foundations" :key="found.id" :value="found.id">{{ found.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" :disabled="!selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
          <option value="" disabled>Pilih Unit Sekolah</option>
          <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Jenjang Pendidikan</label>
        <select v-model="levelFilter" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
          <option value="">Semua Jenjang</option>
          <option value="TK">TK / KB / PAUD</option>
          <option value="SD">SD</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA / SMK</option>
        </select>
      </div>
    </div>

    <!-- Empty State / No School Selected -->
    <div v-if="!selectedSchoolId" class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-16 text-center text-slate-400">
      <FileText class="mx-auto mb-3 opacity-40 text-violet-600" :size="40" />
      <h3 class="font-bold text-slate-700 dark:text-zinc-300 text-sm">Belum Ada Unit Sekolah Selected</h3>
      <p class="text-xs mt-1 max-w-sm mx-auto">Silakan pilih Yayasan dan Unit Sekolah di filter atas untuk mulai mengonfigurasi template rapor.</p>
    </div>

    <div v-else-if="loading" class="py-20 text-center text-slate-400">
      <div class="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin mx-auto mb-3"></div>
      <p class="text-xs font-semibold">Memuat template rapor...</p>
    </div>

    <!-- Master-Detail Layout -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Left Panel: Master List -->
      <div class="lg:col-span-4 space-y-4">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Daftar Template</h3>
        
        <div v-if="reportTemplates.length === 0" class="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-xl p-8 text-center text-slate-400">
          <AlertCircle class="mx-auto mb-2 text-amber-500 opacity-60" :size="24" />
          <p class="text-xs font-bold text-slate-700 dark:text-zinc-300">Tidak Ada Template</p>
          <p class="text-[10px] mt-0.5">Silakan buat template rapor baru untuk memulai.</p>
        </div>

        <div v-else class="space-y-3">
          <div 
            v-for="tpl in reportTemplates" 
            :key="tpl.id"
            @click="selectTemplate(tpl.id)"
            class="p-4 rounded-xl border cursor-pointer transition-all duration-200"
            :class="[
              currentTemplate?.id === tpl.id 
                ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-600/15'
                : 'bg-white dark:bg-zinc-900 border-slate-200/60 dark:border-zinc-800/80 text-slate-800 dark:text-zinc-200 hover:border-slate-350 dark:hover:border-zinc-700'
            ]"
          >
            <div class="flex justify-between items-start">
              <span class="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase"
                :class="[
                  currentTemplate?.id === tpl.id 
                    ? 'bg-white/20 text-white' 
                    : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                ]"
              >
                {{ tpl.level }}
              </span>
              <span v-if="!tpl.is_active" class="text-[8px] font-bold text-amber-400">Nonaktif</span>
            </div>
            
            <h4 class="font-bold text-sm mt-2 leading-snug">{{ tpl.name }}</h4>
            <p class="text-[10px] mt-1 opacity-70" :class="currentTemplate?.id === tpl.id ? 'text-white' : 'text-slate-500'">
              Kurikulum: {{ tpl.curriculum_name || 'Umum' }}
            </p>

            <div class="mt-4 flex justify-end gap-2" @click.stop>
              <button 
                @click="openEditTemplateModal(tpl)" 
                class="p-1.5 rounded hover:bg-white/10"
                :class="currentTemplate?.id === tpl.id ? 'text-white hover:bg-white/25' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'"
              >
                <Edit2 :size="12" />
              </button>
              <button 
                @click="handleDeleteTemplate(tpl.id)" 
                class="p-1.5 rounded hover:bg-white/10"
                :class="currentTemplate?.id === tpl.id ? 'text-white hover:bg-red-500/25' : 'text-slate-400 hover:bg-rose-500/10 hover:text-rose-500'"
              >
                <Trash2 :size="12" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Template Detail & Element Builder -->
      <div class="lg:col-span-8">
        <div v-if="detailsLoading" class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-16 text-center text-slate-400 shadow-sm">
          <div class="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin mx-auto mb-3"></div>
          <p class="text-xs font-semibold">Memuat elemen penilaian...</p>
        </div>

        <div v-else-if="!currentTemplate" class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-16 text-center text-slate-400 shadow-sm">
          <Sliders class="mx-auto mb-3 opacity-40 text-violet-600" :size="40" />
          <h3 class="font-bold text-slate-700 dark:text-zinc-300 text-sm">Pilih Template Rapor</h3>
          <p class="text-xs mt-1 max-w-sm mx-auto">Pilih salah satu template di panel kiri untuk mengonfigurasi struktur elemen aspek penilaian rapor.</p>
        </div>

        <div v-else class="space-y-6">
          <!-- Template Overview -->
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-violet-600/15 text-violet-600 border border-violet-500/15 uppercase">{{ currentTemplate.level }}</span>
                <span class="text-xs font-bold text-slate-400">Kurikulum: {{ currentTemplate.curriculum_name || '-' }}</span>
              </div>
              <h2 class="text-xl font-bold mt-2 text-slate-900 dark:text-zinc-100">{{ currentTemplate.name }}</h2>
            </div>
            
            <BaseButton variant="primary" @click="showCreateElementModal = true" class="py-2 px-3 text-xs font-bold shadow-lg shadow-violet-600/10">
              <Plus class="mr-1" :size="13" /> Tambah Elemen
            </BaseButton>
          </div>

          <!-- Tabs Header -->
          <div class="flex border-b border-slate-200 dark:border-zinc-800 gap-4 mb-4">
            <button 
              type="button"
              @click="activeTab = 'elements'"
              class="px-4 py-2.5 text-xs font-bold border-b-2 transition-all"
              :class="activeTab === 'elements' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400'"
            >
              Daftar Elemen Penilaian
            </button>
            <button 
              v-if="currentTemplate.level === 'TK' && currentTemplate.element_structure?.is_dinas"
              type="button"
              @click="activeTab = 'dinas-mapping'"
              class="px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5"
              :class="activeTab === 'dinas-mapping' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400'"
            >
              <Sliders :size="12" /> Pemetaan Rapor Dinas TK
            </button>
            <button 
              type="button"
              @click="activeTab = 'preview'"
              class="px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5"
              :class="activeTab === 'preview' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400'"
            >
              <FileText :size="12" /> Pratinjau Tampilan Rapor
            </button>
          </div>

          <!-- Tab Content: Elements Table -->
          <div v-if="activeTab === 'elements' || currentTemplate.level !== 'TK' || !currentTemplate.element_structure?.is_dinas" class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div class="p-5 border-b border-slate-100 dark:border-zinc-800/80">
              <h4 class="font-bold text-sm text-slate-900 dark:text-zinc-100">Struktur Elemen Penilaian</h4>
              <p class="text-[10px] text-slate-400 mt-0.5">Format penilaian yang diinput oleh wali kelas/guru untuk mata pelajaran atau dimensi capaian.</p>
            </div>

            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  <th class="p-4 pl-6 w-12 text-center">Urutan</th>
                  <th class="p-4">Nama Elemen / Capaian</th>
                  <th class="p-4">Mata Pelajaran</th>
                  <th class="p-4 text-center">Tipe Nilai</th>
                  <th class="p-4 text-center">Skala</th>
                  <th class="p-4 text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="el in currentTemplate.elements" :key="el.id" class="border-b border-slate-100 dark:border-zinc-800/80 last:border-0 hover:bg-slate-50/20 dark:hover:bg-zinc-900/20 transition-colors">
                  <td class="p-4 pl-6 text-center text-xs font-semibold text-slate-500">{{ el.sort_order || '-' }}</td>
                  <td class="p-4">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-800 dark:text-zinc-200 text-xs">{{ el.name }}</span>
                    </div>
                  </td>
                  <td class="p-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                    {{ el.subject_name ? `${el.subject_name} (${el.subject_code})` : 'Capaian Umum' }}
                  </td>
                  <td class="p-4 text-center">
                    <span class="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold border"
                      :class="{
                        'bg-violet-500/10 text-violet-600 border-violet-500/20': el.grade_type === 'letter',
                        'bg-emerald-500/10 text-emerald-600 border-emerald-500/20': el.grade_type === 'numeric',
                        'bg-amber-500/10 text-amber-600 border-amber-500/20': el.grade_type === 'narrative',
                        'bg-blue-500/10 text-blue-600 border-blue-500/20': el.grade_type === 'predicate'
                      }"
                    >
                      {{ el.grade_type }}
                    </span>
                  </td>
                  <td class="p-4 text-center text-xs font-medium text-slate-500">{{ el.scale || '-' }}</td>
                  <td class="p-4 pr-6 text-right">
                    <div class="flex justify-end items-center gap-1">
                      <button @click="openEditElementModal(el)" class="p-1.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                        <Edit2 :size="12" />
                      </button>
                      <button @click="handleDeleteElement(el.id)" class="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 transition-colors">
                        <Trash2 :size="12" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!currentTemplate.elements || currentTemplate.elements.length === 0">
                  <td colspan="6" class="p-12 text-center text-slate-400 dark:text-zinc-500 border-t border-slate-100 dark:border-zinc-800">
                    <Bookmark class="mx-auto mb-2 opacity-50 text-violet-600" :size="32" />
                    <p class="text-xs font-semibold">Belum Ada Elemen Aspek Penilaian</p>
                    <p class="text-[10px] mt-0.5">Klik tombol 'Tambah Elemen' untuk mengisi aspek penilaian pada template ini.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tab Content: Dinas Layout Mapping -->
          <div v-else-if="activeTab === 'dinas-mapping' && currentTemplate.level === 'TK'" class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div class="flex justify-between items-start gap-4">
              <div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-zinc-100">Editor Tata Letak Rapor Dinas TK</h4>
                <p class="text-[10px] text-slate-400 mt-0.5">Kelola kelompok program (misal: Intrakurikuler, Kokurikuler), kategori penilaian, serta pemetaan elemen narasi dan sub-penilaian secara dinamis.</p>
              </div>
              <BaseButton type="button" variant="primary" @click="addSection" class="py-1.5 px-3 text-[10px] font-bold shadow-lg shadow-violet-600/10">
                + Tambah Kelompok
              </BaseButton>
            </div>

            <div class="space-y-6 border-t border-slate-100 dark:border-zinc-800 pt-4">
              <div v-for="(sec, sIdx) in tkSections" :key="sec.id" class="bg-slate-50/50 dark:bg-zinc-950/20 p-5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-4">
                <div class="flex justify-between items-center gap-4">
                  <div class="flex-1">
                    <input 
                      type="text" 
                      v-model="sec.title" 
                      class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-zinc-200 outline-none uppercase tracking-wide focus:border-violet-600 transition-colors"
                      placeholder="Nama Kelompok Program (Contoh: A. PROGRAM INTRAKURIKULER)"
                    />
                  </div>
                  <div class="flex gap-2">
                    <BaseButton type="button" variant="outline" @click="addCategory(sIdx)" class="py-1.5 px-2.5 text-[10px] font-bold border-slate-250 dark:border-zinc-800">
                      + Tambah Kategori
                    </BaseButton>
                    <button type="button" @click="tkSections.splice(sIdx, 1)" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" title="Hapus Kelompok">
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>

                <!-- Categories -->
                <div class="space-y-4 pl-4 border-l-2 border-slate-200/80 dark:border-zinc-800/80">
                  <div v-for="(cat, cIdx) in sec.categories" :key="cat.id" class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 p-4 rounded-xl space-y-4 shadow-sm">
                    <div class="flex justify-between items-center gap-4">
                      <div class="flex-1">
                        <input 
                          type="text" 
                          v-model="cat.title"
                          class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 outline-none focus:border-violet-600 transition-colors"
                          placeholder="Nama Kategori (Contoh: Nilai Agama & Budi Pekerti)"
                        />
                      </div>
                      <button type="button" @click="sec.categories.splice(cIdx, 1)" class="p-1.5 text-slate-400 hover:text-rose-500 transition-colors" title="Hapus Kategori">
                        <Trash2 :size="12" />
                      </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Narrative Element Selector -->
                      <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Elemen Narasi Utama (Optional)</label>
                        <select v-model="cat.narrative_element_id" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-medium outline-none">
                          <option value="">Tanpa Narasi</option>
                          <option v-for="el in currentTemplate.elements" :key="el.id" :value="el.id">
                            {{ el.name }} ({{ el.grade_type }})
                          </option>
                        </select>
                      </div>

                      <!-- P5 Matrix Checkbox -->
                      <div class="flex items-center gap-2 pt-6">
                        <input 
                          type="checkbox" 
                          :id="'p5_' + cat.id" 
                          v-model="cat.is_p5_matrix"
                          class="rounded border-slate-350 dark:border-zinc-850 text-violet-600 focus:ring-violet-600/20"
                        />
                        <label :for="'p5_' + cat.id" class="text-xs font-semibold text-slate-655 dark:text-zinc-350 select-none cursor-pointer">
                          Tampilkan Sebagai Matriks Projek P5
                        </label>
                      </div>
                    </div>

                    <!-- P5 Dimensions Matrix Selector -->
                    <div v-if="cat.is_p5_matrix" class="space-y-4 bg-slate-50/50 dark:bg-zinc-950/20 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm animate-in fade-in duration-300">
                      <div class="flex justify-between items-center gap-4">
                        <div>
                          <span class="text-xs font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider block">Pemetaan Dimensi Profil P5</span>
                          <p class="text-[10px] text-slate-500 mt-1">Petakan aspek penilaian amatan ke dimensi Profil Pelajar Pancasila di bawah ini. Hasil pemetaan akan ditampilkan sebagai matriks capaian pada halaman kedua laporan hasil belajar.</p>
                        </div>
                        <BaseButton type="button" variant="outline" @click="openManageP5Modal" class="py-1 px-2.5 text-[10px] font-bold border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 shrink-0">
                          Kelola Dimensi P5
                        </BaseButton>
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 pt-2">
                        <div v-for="(dim, idx) in activeP5Dimensions" :key="dim.id" class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl p-3.5 space-y-2">
                          <div class="flex items-start gap-2.5">
                            <span class="w-5 h-5 rounded-full bg-violet-600/10 text-violet-600 text-[10px] font-bold flex items-center justify-center shrink-0">{{ idx + 1 }}</span>
                            <div>
                              <label class="text-xs font-bold text-slate-800 dark:text-zinc-200">{{ dim.name }}</label>
                              <span v-if="dim.description" class="text-[9px] text-slate-450 dark:text-zinc-500 block leading-tight mt-0.5">{{ dim.description }}</span>
                            </div>
                          </div>
                          <select v-model="cat.p5_dimensions[dim.id]" class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-violet-600 transition-colors">
                            <option value="">- Tidak Dinilai -</option>
                            <option v-for="el in currentTemplate.elements" :key="el.id" :value="el.id">
                              {{ el.name }}
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <!-- Sub-indicators checklist (If not P5 Matrix) -->
                    <div v-else class="flex flex-col gap-1.5">
                      <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Sub-penilaian (Checklist Indikator yang Dinilai)</label>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/50 dark:bg-zinc-950/20 p-3 rounded-lg border border-slate-100 dark:border-zinc-800 max-h-40 overflow-y-auto">
                        <div v-for="el in currentTemplate.elements" :key="el.id" class="flex items-center gap-2 text-xs">
                          <input 
                            type="checkbox" 
                            :id="'chk_' + cat.id + '_' + el.id" 
                            :value="el.id" 
                            v-model="cat.sub_element_ids" 
                            class="rounded border-slate-350 dark:border-zinc-850 text-violet-600 focus:ring-violet-600/20"
                          />
                          <label :for="'chk_' + cat.id + '_' + el.id" class="text-slate-655 dark:text-zinc-350 select-none truncate cursor-pointer">
                            {{ el.name }}
                          </label>
                        </div>
                      </div>
                    </div>

                  </div>
                  <div v-if="sec.categories.length === 0" class="text-[11px] text-slate-400 dark:text-zinc-500 py-2 italic pl-2">
                    Belum ada kategori. Klik "+ Tambah Kategori" untuk menambahkan bidang aspek penilaian.
                  </div>
                </div>

              </div>

              <div v-if="tkSections.length === 0" class="text-center py-12 text-slate-400 dark:text-zinc-550 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                <Sliders class="mx-auto mb-2 opacity-40 text-violet-650" :size="32" />
                <p class="text-xs font-semibold">Struktur Layout Belum Dibuat</p>
                <p class="text-[10px] mt-0.5">Klik tombol "+ Tambah Kelompok" di atas untuk mulai mendesain Rapor Dinas TK.</p>
              </div>
            </div>

            <div class="flex justify-end pt-4 border-t border-slate-100 dark:border-zinc-800">
              <BaseButton variant="primary" @click="handleSaveTKMapping" :disabled="tkSections.length === 0" class="py-2 px-4 text-xs font-bold shadow-lg shadow-violet-600/10">
                Simpan Tata Letak
              </BaseButton>
            </div>
          </div>

          <!-- Tab Content: Preview -->
          <div v-else-if="activeTab === 'preview'" class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h4 class="font-bold text-sm text-slate-900 dark:text-zinc-100">Pratinjau Tampilan Rapor</h4>
              <p class="text-[10px] text-slate-400 mt-0.5">Mockup visual struktur cetak rapor berdasarkan pemetaan saat ini.</p>
            </div>

            <div class="border border-slate-200 dark:border-zinc-800 rounded-xl p-6 bg-slate-50 dark:bg-zinc-950/20 max-h-[60vh] overflow-y-auto space-y-8">
              <div class="bg-white dark:bg-zinc-900 p-8 shadow-md border border-slate-200 dark:border-zinc-800 rounded-md max-w-2xl mx-auto space-y-6 text-black print:text-black">
                <!-- Kop mock -->
                <div class="text-center border-b-2 border-slate-900 pb-4 mb-4">
                  <h2 class="text-sm font-black uppercase">TAMAN KANAK-KANAK AL FATAH</h2>
                  <p class="text-[10px] font-semibold text-slate-500">LAPORAN PERKEMBANGAN PESERTA DIDIK (TK B)</p>
                </div>

                <!-- Content Mock based on categories -->
                <div class="space-y-6 text-left">
                  <div v-for="sec in previewDinasSections" :key="sec.id" class="space-y-4">
                    <h3 class="text-xs font-black uppercase border-b border-slate-900 pb-1">{{ sec.title }}</h3>
                    
                    <div v-for="cat in sec.categories" :key="cat.id" class="space-y-3">
                      <div class="text-[11px] font-bold text-slate-800 uppercase">{{ cat.title }}</div>
                      
                      <!-- If P5 Matrix -->
                      <div v-if="cat.is_p5_matrix" class="space-y-2">
                        <table class="w-full text-left border-2 border-slate-950 text-[9px] border-collapse">
                          <thead>
                            <tr class="bg-slate-100 border-b border-slate-950">
                              <th class="p-1 border-r border-slate-950 font-bold" style="width: 30%;">Projek</th>
                              <th v-for="dim in activeP5Dimensions" :key="dim.id" class="p-1 border-r border-slate-950 text-center font-bold text-[8px]">{{ dim.name }}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr class="border-b-0">
                              <td class="p-1.5 border-r border-slate-950 font-semibold bg-slate-50">{{ cat.title }}</td>
                              <td v-for="dim in activeP5Dimensions" :key="dim.id" class="p-1.5 border-r border-slate-950 text-center font-bold">
                                {{ cat.p5_dimensions[dim.id] ? 'BSH' : '-' }}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <!-- If standard indicators -->
                      <table v-else class="w-full text-left border border-slate-900 text-[10px] border-collapse">
                        <thead>
                          <tr class="bg-slate-50 border-b border-slate-900 font-bold">
                            <th class="p-1.5 border-r border-slate-900 w-8 text-center">No.</th>
                            <th class="p-1.5 border-r border-slate-900">Elemen / Indikator</th>
                            <th class="p-1.5 text-center w-16">Capaian</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(sub, subIdx) in cat.subAssessments" :key="subIdx" class="border-b border-slate-900">
                            <td class="p-1 text-center border-r border-slate-900">{{ subIdx + 1 }}.</td>
                            <td class="p-1 border-r border-slate-900 pl-3">{{ sub.name }}</td>
                            <td class="p-1 text-center font-bold">{{ sub.grade }}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div class="text-[10px] text-justify leading-relaxed bg-slate-50/50 p-2 border border-slate-200 rounded">
                        <strong>Narasi |</strong> {{ cat.narrative }}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Create Template Modal -->
    <BaseModal :show="showCreateTemplateModal" title="Template Rapor Baru" @close="showCreateTemplateModal = false">
      <form @submit.prevent="handleCreateTemplate" class="space-y-4">
        <BaseInput v-model="templateForm.name" label="Nama Template Rapor" placeholder="Contoh: Rapor Intra TK B Semester 1" required />
        
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Jenjang Pendidikan</label>
            <select v-model="templateForm.level" disabled class="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none opacity-70 cursor-not-allowed">
              <option value="TK">TK / KB / PAUD</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA / SMK</option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kurikulum</label>
            <select v-model="templateForm.curriculum_id" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
              <option value="">Pilih Kurikulum (Optional)</option>
              <option v-for="cur in curriculums" :key="cur.id" :value="cur.id">{{ cur.name }}</option>
            </select>
          </div>
        </div>

        <div class="flex flex-col gap-2 px-1 py-1">
          <div class="flex items-center gap-2">
            <input type="checkbox" id="is_active_tpl_create" v-model="templateForm.is_active" class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20" />
            <label for="is_active_tpl_create" class="text-xs font-semibold text-slate-650 dark:text-zinc-350">Aktifkan template ini</label>
          </div>
          <div v-if="templateForm.level === 'TK'" class="flex items-center gap-2">
            <input type="checkbox" id="is_dinas_tpl_create" v-model="templateForm.element_structure.is_dinas" class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20" />
            <label for="is_dinas_tpl_create" class="text-xs font-semibold text-slate-655 dark:text-zinc-350">Gunakan Format Rapor Dinas TK</label>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showCreateTemplateModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Template</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Edit Template Modal -->
    <BaseModal :show="showEditTemplateModal" title="Ubah Template Rapor" @close="showEditTemplateModal = false">
      <form @submit.prevent="handleUpdateTemplate" class="space-y-4">
        <BaseInput v-model="editTemplateForm.name" label="Nama Template Rapor" required />

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Jenjang Pendidikan</label>
            <select v-model="editTemplateForm.level" disabled class="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none opacity-70 cursor-not-allowed">
              <option value="TK">TK / KB / PAUD</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA / SMK</option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kurikulum</label>
            <select v-model="editTemplateForm.curriculum_id" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
              <option value="">Pilih Kurikulum (Optional)</option>
              <option v-for="cur in curriculums" :key="cur.id" :value="cur.id">{{ cur.name }}</option>
            </select>
          </div>
        </div>

        <div class="flex flex-col gap-2 px-1 py-1">
          <div class="flex items-center gap-2">
            <input type="checkbox" id="is_active_tpl_edit" v-model="editTemplateForm.is_active" class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20" />
            <label for="is_active_tpl_edit" class="text-xs font-semibold text-slate-650 dark:text-zinc-350">Template aktif</label>
          </div>
          <div v-if="editTemplateForm.level === 'TK'" class="flex items-center gap-2">
            <input type="checkbox" id="is_dinas_tpl_edit" v-model="editTemplateForm.element_structure.is_dinas" class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20" />
            <label for="is_dinas_tpl_edit" class="text-xs font-semibold text-slate-655 dark:text-zinc-350">Gunakan Format Rapor Dinas TK</label>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showEditTemplateModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Perubahan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Create Element Modal -->
    <BaseModal :show="showCreateElementModal" title="Tambah Elemen Penilaian" @close="showCreateElementModal = false">
      <form @submit.prevent="handleCreateElement" class="space-y-4">
        <!-- Quick Presets -->
        <div class="bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-lg flex gap-2 items-center">
          <span class="text-[9px] font-bold uppercase tracking-widest text-slate-400">Presets:</span>
          <BaseButton type="button" variant="outline" @click="applyTKPreset" class="py-1 px-2 text-[10px] font-semibold border-slate-200">Format TK (Huruf BB-BSB)</BaseButton>
          <BaseButton type="button" variant="outline" @click="applyNumericPreset" class="py-1 px-2 text-[10px] font-semibold border-slate-200">Format SD-SMA (Angka 0-100)</BaseButton>
        </div>

        <BaseInput v-model="elementForm.name" label="Nama Aspek / Capaian" placeholder="Contoh: Nilai Agama & Budi Pekerti, atau Sub-elemen PJOK" required />
        
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Mata Pelajaran (Optional)</label>
          <select v-model="elementForm.subject_id" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
            <option value="">Capaian Umum (Tanpa Mata Pelajaran)</option>
            <option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.name }} ({{ sub.code }})</option>
          </select>
          <span class="text-[9px] text-slate-400 px-1">Gunakan Capaian Umum jika aspek ini berupa penilaian naratif/perilaku global (PAUD/TK).</span>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tipe Nilai</label>
            <select v-model="elementForm.grade_type" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
              <option value="letter">Huruf (BB / MB / BSH / BSB)</option>
              <option value="numeric">Angka (0 - 100)</option>
              <option value="narrative">Deskriptif / Narasi</option>
              <option value="predicate">Predikat (A / B / C / D)</option>
            </select>
          </div>

          <BaseInput v-model="elementForm.scale" label="Skala Penilaian" placeholder="Contoh: BB-BSB, 0-100" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="elementForm.weight" type="number" step="0.01" label="Bobot Penilaian" required />
          <BaseInput v-model="elementForm.sort_order" type="number" label="Urutan Urut" required />
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showCreateElementModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Elemen</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Edit Element Modal -->
    <BaseModal :show="showEditElementModal" title="Ubah Elemen Penilaian" @close="showEditElementModal = false">
      <form @submit.prevent="handleUpdateElement" class="space-y-4">
        <BaseInput v-model="editElementForm.name" label="Nama Aspek / Capaian" required />

        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Mata Pelajaran (Optional)</label>
          <select v-model="editElementForm.subject_id" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
            <option value="">Capaian Umum (Tanpa Mata Pelajaran)</option>
            <option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.name }} ({{ sub.code }})</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tipe Nilai</label>
            <select v-model="editElementForm.grade_type" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
              <option value="letter">Huruf (BB / MB / BSH / BSB)</option>
              <option value="numeric">Angka (0 - 100)</option>
              <option value="narrative">Deskriptif / Narasi</option>
              <option value="predicate">Predikat (A / B / C / D)</option>
            </select>
          </div>

          <BaseInput v-model="editElementForm.scale" label="Skala Penilaian" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="editElementForm.weight" type="number" step="0.01" label="Bobot Penilaian" required />
          <BaseInput v-model="editElementForm.sort_order" type="number" label="Urutan Urut" required />
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showEditElementModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Simpan Perubahan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Manage P5 Dimensions Modal -->
    <BaseModal :show="showManageP5Modal" title="Kelola Dimensi Profil P5" @close="showManageP5Modal = false" size="lg">
      <div class="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        <!-- Add / Edit Form -->
        <form @submit.prevent="handleSaveP5" class="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800 space-y-4">
          <div class="text-xs font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider">
            {{ isEditingP5 ? 'Ubah Dimensi P5' : 'Tambah Dimensi P5 Baru' }}
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="sm:col-span-2">
              <BaseInput v-model="p5Form.name" label="Nama Dimensi" placeholder="Contoh: Keimanan & Takwa" required />
            </div>
            <div>
              <BaseInput v-model="p5Form.sort_order" type="number" label="Urutan Tampil" required />
            </div>
          </div>

          <BaseInput v-model="p5Form.description" label="Deskripsi Singkat" placeholder="Contoh: Berakhlak mulia kepada Tuhan YME dan sesama..." />

          <div class="flex justify-end gap-2 pt-2">
            <BaseButton v-if="isEditingP5" type="button" variant="outline" @click="resetP5Form" class="py-1.5 px-3 text-xs">Batal</BaseButton>
            <BaseButton type="submit" variant="primary" class="py-1.5 px-4 text-xs font-bold shadow-md shadow-violet-600/10">
              {{ isEditingP5 ? 'Simpan Perubahan' : 'Tambah Dimensi' }}
            </BaseButton>
          </div>
        </form>

        <!-- List Table -->
        <div class="space-y-3">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Daftar Dimensi Sekolah</div>
          <div class="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800 font-bold text-slate-500">
                  <th class="p-3 text-center w-12">No</th>
                  <th class="p-3">Nama Dimensi</th>
                  <th class="p-3">Deskripsi</th>
                  <th class="p-3 text-right pr-6 w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(dim, idx) in p5Dimensions" :key="dim.id" class="border-b border-slate-100 dark:border-zinc-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                  <td class="p-3 text-center font-bold text-slate-400">{{ dim.sort_order || idx + 1 }}</td>
                  <td class="p-3 font-bold text-slate-800 dark:text-zinc-200">{{ dim.name }}</td>
                  <td class="p-3 text-slate-500 dark:text-zinc-400 leading-normal">{{ dim.description || '-' }}</td>
                  <td class="p-3 pr-6 text-right">
                    <div class="flex justify-end gap-1">
                      <button type="button" @click="handleEditP5(dim)" class="p-1 text-slate-400 hover:text-violet-600 transition-colors" title="Ubah">
                        <Edit2 :size="12" />
                      </button>
                      <button type="button" @click="handleDeleteP5(dim.id)" class="p-1 text-slate-400 hover:text-rose-500 transition-colors" title="Hapus">
                        <Trash2 :size="12" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="p5Dimensions.length === 0">
                  <td colspan="4" class="p-8 text-center text-slate-400 italic">Belum ada dimensi P5 terdaftar. Silakan tambahkan di atas.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex justify-end pt-4 border-t border-slate-200 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showManageP5Modal = false" class="py-2 px-4 text-xs font-bold">Tutup</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
