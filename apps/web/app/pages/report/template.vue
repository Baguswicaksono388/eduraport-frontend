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
  Sliders,
  Eye,
  EyeOff,
  RotateCcw,
  RotateCw,
  Save,
  X,
  HelpCircle,
  Check
} from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useSchool } from '../../composables/useSchool'
import { useReportTemplate } from '../../composables/useReportTemplate'
import { useSubject } from '../../composables/useSubject'
import { useToast } from '../../composables/useToast'
import { useExtracurricular } from '../../composables/useExtracurricular'
import { useApi } from '../../composables/useApi'
import { useAuth } from '../../composables/useAuth'
import ColumnEditor from '../../components/ColumnEditor.vue'
import TreeItemPicker from '../../components/TreeItemPicker.vue'

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
const { user, fetchUser } = useAuth()

const selectedFoundationId = ref('')
const selectedSchoolId = ref('')
const levelFilter = ref('') // all
const loading = ref(false)
const detailsLoading = ref(false)

const selectedSchool = computed(() => {
  return schools.value.find(s => s.id === selectedSchoolId.value)
})

const filteredSchools = computed(() => {
  if (user.value && user.value.role !== 'super_admin' && user.value.school_id) {
    return schools.value.filter(s => s.id === user.value.school_id)
  }
  return schools.value
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
  await fetchUser()
  await fetchFoundations()
  if (foundations.value.length > 0) {
    selectedFoundationId.value = foundations.value[0].id
    await fetchSchools(selectedFoundationId.value)
    await fetchCurriculums(selectedFoundationId.value)
    
    if (schools.value.length > 0) {
      if (user.value && user.value.role !== 'super_admin' && user.value.school_id) {
        const matchingSchool = schools.value.find(s => s.id === user.value.school_id)
        selectedSchoolId.value = matchingSchool ? matchingSchool.id : schools.value[0].id
      } else {
        selectedSchoolId.value = schools.value[0].id
      }
      await loadSchoolData(selectedSchoolId.value)
    }
  }
})

const loadSchoolData = async (schoolId: string) => {
  loading.value = true
  currentTemplate.value = null
  reportTemplates.value = []
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
      if (user.value && user.value.role !== 'super_admin' && user.value.school_id) {
        const matchingSchool = schools.value.find(s => s.id === user.value.school_id)
        selectedSchoolId.value = matchingSchool ? matchingSchool.id : schools.value[0].id
      } else {
        selectedSchoolId.value = schools.value[0].id
      }
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

const previewIntraGroup1 = computed(() => {
  if (!currentTemplate.value?.elements) return []
  const g1Names = [
    'Adaptasi dan Sosialisasi', 'Minat Belajar', 'Kesiapan Belajar', 
    'Kemandirian', 'Rutinitas', 'Kestabilan Emosi', 
    'Ekspresi', 'Percaya Diri', 'Respons', 'Tanggung Jawab'
  ]
  return currentTemplate.value.elements.filter((e: any) => g1Names.includes(e.name) && e.grade_type === 'letter')
})

const previewIntraGroup2 = computed(() => {
  if (!currentTemplate.value?.elements) return []
  const g2Names = [
    'Konsentrasi', 'Kooperatif', 'Ketuntasan Tugas', 
    'Rapi', 'Disiplin', 'Kreatif'
  ]
  return currentTemplate.value.elements.filter((e: any) => g2Names.includes(e.name) && e.grade_type === 'letter')
})

const previewIntraGroup3 = computed(() => {
  if (!currentTemplate.value?.elements) return []
  const g3Names = [
    'Motorik Kasar', 'Motorik Halus', 'Persepsi Auditori', 
    'Persepsi Visual', 'Keterampilan Berbicara'
  ]
  return currentTemplate.value.elements.filter((e: any) => g3Names.includes(e.name) && e.grade_type === 'letter')
})

const previewIntraOtherLetterElements = computed(() => {
  if (!currentTemplate.value?.elements) return []
  const allKnown = [
    'Adaptasi dan Sosialisasi', 'Minat Belajar', 'Kesiapan Belajar', 
    'Kemandirian', 'Rutinitas', 'Kestabilan Emosi', 
    'Ekspresi', 'Percaya Diri', 'Respons', 'Tanggung Jawab',
    'Konsentrasi', 'Kooperatif', 'Ketuntasan Tugas', 
    'Rapi', 'Disiplin', 'Kreatif',
    'Motorik Kasar', 'Motorik Halus', 'Persepsi Auditori', 
    'Persepsi Visual', 'Keterampilan Berbicara'
  ]
  return currentTemplate.value.elements.filter((e: any) => !allKnown.includes(e.name) && e.grade_type === 'letter')
})

const previewIntraNarratives = computed(() => {
  if (!currentTemplate.value?.elements) return []
  return currentTemplate.value.elements.filter((e: any) => e.grade_type === 'narrative')
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

// ─── VISUAL BUILDER STATE & LOGIC ───
const { fetcher } = useApi()
const { extracurriculars, fetchExtracurriculars } = useExtracurricular()

const isVisualBuilderOpen = ref(false)
const widgetTree = ref<any[]>([])
const selectedWidgetId = ref<string | null>(null)
const canvasConfig = ref({ scale: 100, orientation: 'portrait' })
const printCss = ref('')
const activeBuilderTab = ref('palette') // 'palette' | 'tree'

const curriculumElements = ref<any[]>([])
const learningOutcomes = ref<any[]>([])

const history = ref<string[]>([])
const historyIndex = ref(-1)

const pushHistory = (tree: any[]) => {
  const serialized = JSON.stringify(tree)
  if (historyIndex.value >= 0 && history.value[historyIndex.value] === serialized) return
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }
  history.value.push(serialized)
  if (history.value.length > 50) history.value.shift()
  historyIndex.value = history.value.length - 1
}

const undo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--
    widgetTree.value = JSON.parse(history.value[historyIndex.value])
    selectedWidgetId.value = null
  }
}

const redo = () => {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++
    widgetTree.value = JSON.parse(history.value[historyIndex.value])
    selectedWidgetId.value = null
  }
}

const fetchCurriculumElementsData = async (schoolId: string) => {
  try {
    const res: any = await fetcher(`/school/${schoolId}/curriculum-elements`, {
      query: { level: currentTemplate.value?.level }
    })
    if (res.success) {
      curriculumElements.value = res.data
    }
  } catch (error) {
    console.error('Failed to fetch curriculum elements:', error)
  }
}

const fetchLearningOutcomesData = async (schoolId: string) => {
  try {
    const res: any = await fetcher(`/school/${schoolId}/learning-outcomes`)
    if (res.success) {
      learningOutcomes.value = res.data
    }
  } catch (error) {
    console.error('Failed to fetch learning outcomes:', error)
  }
}

const mappedCurriculumElements = computed(() => {
  return curriculumElements.value.map(el => {
    return {
      id: el.id,
      name: el.name,
      code: el.code,
      is_active: el.is_active,
      subs: learningOutcomes.value
        .filter(lo => lo.element_id === el.id)
        .map(lo => ({
          id: lo.id,
          outcome_text: lo.outcome_text,
          code: lo.code,
          is_active: lo.is_active
        }))
    }
  })
})

const mappedSubjects = computed(() => {
  return subjects.value.map(sub => {
    return {
      id: sub.id,
      name: sub.name,
      code: sub.code,
      is_active: sub.is_active,
      subs: learningOutcomes.value
        .filter(lo => lo.subject_id === sub.id)
        .map(lo => ({
          id: lo.id,
          outcome_text: lo.outcome_text,
          code: lo.code,
          is_active: lo.is_active
        }))
    }
  })
})

const STATIC_WIDGET_DEFAULTS: Record<string, { schema_version: number; props: Record<string, any> }> = {
  section_block: { schema_version: 1, props: { title: 'SEKSI' } },
  column_layout: { schema_version: 1, props: { cols: 2 } },
  page_break: { schema_version: 1, props: {} },
  header_school: { schema_version: 1, props: { showNpsn: true, showAddress: true } },
  student_identity: { schema_version: 1, props: { showNisn: true, showWali: true } },
  student_photo: { schema_version: 1, props: {} },
  grade_table: {
    schema_version: 2,
    props: {
      highlightKkm: true,
      kkm: 75,
      items: [],
      cols: [
        { key: 'no', label: 'No', visible: true },
        { key: 'name', label: 'Mata Pelajaran', visible: true },
        { key: 'kkm', label: 'KKM', visible: true },
        { key: 'val', label: 'Nilai Akhir', visible: true },
        { key: 'pred', label: 'Predikat', visible: false },
        { key: 'desc', label: 'Deskripsi Capaian Kompetensi', visible: true }
      ]
    }
  },
  desc_table: {
    schema_version: 2,
    props: {
      scale_id: 'scl_bsh',
      hasSub: true,
      showNarasi: false,
      perSub: true,
      items: [],
      cols: [
        { key: 'no', label: 'No', visible: true },
        { key: 'name', label: 'Elemen Capaian Pembelajaran', visible: true },
        { key: 'val', label: 'Capaian', visible: true }
      ]
    }
  },
  subject_narrative: { schema_version: 1, props: { items: [] } },
  extracurricular: {
    schema_version: 1,
    props: {
      items: [],
      cols: [
        { key: 'no', label: 'No', visible: true },
        { key: 'name', label: 'Ekstrakurikuler', visible: true },
        { key: 'val', label: 'Nilai', visible: true },
        { key: 'note', label: 'Keterangan', visible: true }
      ]
    }
  },
  p5_assessment: {
    schema_version: 1,
    props: {
      items: [],
      cols: [
        { key: 'name', label: 'Dimensi Profil Lulusan', visible: true },
        { key: 'val', label: 'Capaian', visible: true }
      ]
    }
  },
  attendance: { schema_version: 1, props: {} },
  growth: { schema_version: 1, props: {} },
  homeroom_notes: { schema_version: 1, props: {} },
  signature_block: {
    schema_version: 1,
    props: {
      place: 'Karanganyar',
      date: '20 Desember 2026',
      kepsek: 'Dra. Hj. Umi Kulsum, M.Pd.'
    }
  }
}

const AVAILABLE_WIDGETS = [
  { type: 'header_school', name: 'Kop Rapor Sekolah', desc: 'Kop resmi sekolah dengan logo & alamat', cat: 'Struktur' },
  { type: 'student_identity', name: 'Identitas Siswa', desc: 'Nama, NISN, Kelas, Semester, dll', cat: 'Struktur' },
  { type: 'section_block', name: 'Pembatas Seksi', desc: 'Label pembatas (misal: A. Intrakurikuler)', cat: 'Struktur' },
  { type: 'page_break', name: 'Pemisah Halaman', desc: 'Paksa ganti halaman saat cetak', cat: 'Struktur' },
  { type: 'grade_table', name: 'Tabel Nilai Mapel', desc: 'Daftar nilai mapel & deskripsi capaian', cat: 'Penilaian' },
  { type: 'desc_table', name: 'Tabel Deskripsi Capaian', desc: 'Penilaian deskriptif / indikator CP', cat: 'Penilaian' },
  { type: 'subject_narrative', name: 'Narasi Mata Pelajaran', desc: 'Penilaian kualitatif per mapel', cat: 'Penilaian' },
  { type: 'extracurricular', name: 'Nilai Ekstrakurikuler', desc: 'Tabel nilai kegiatan ekstrakurikuler', cat: 'Tambahan' },
  { type: 'p5_assessment', name: 'Matriks Projek P5', desc: 'Matriks capaian dimensi Projek P5', cat: 'Penilaian' },
  { type: 'attendance', name: 'Tabel Absensi', desc: 'Sakit, Izin, Tanpa Keterangan', cat: 'Tambahan' },
  { type: 'growth', name: 'Tabel Perkembangan Fisik', desc: 'Tinggi badan, berat badan, & kesehatan', cat: 'Tambahan' },
  { type: 'homeroom_notes', name: 'Catatan Wali Kelas', desc: 'Kotak catatan deskripsi dari Wali Kelas', cat: 'Tambahan' },
  { type: 'student_photo', name: 'Foto Siswa', desc: 'Frame pas foto ukuran 3x4', cat: 'Struktur' },
  { type: 'column_layout', name: 'Kolom Fleksibel', desc: 'Layout 2 atau 3 kolom bersisian', cat: 'Tata Letak' },
  { type: 'signature_block', name: 'Blok Tanda Tangan', desc: 'Orang tua, Wali Kelas, Kepala Sekolah', cat: 'Struktur' }
]

const openVisualBuilder = async () => {
  if (!currentTemplate.value) return
  
  detailsLoading.value = true
  try {
    await Promise.all([
      fetchCurriculumElementsData(selectedSchoolId.value),
      fetchLearningOutcomesData(selectedSchoolId.value),
      fetchExtracurriculars(selectedSchoolId.value)
    ])

    const rawTree = currentTemplate.value.widget_tree || []
    widgetTree.value = JSON.parse(JSON.stringify(rawTree))
    canvasConfig.value = currentTemplate.value.canvas_config || { scale: 100, orientation: 'portrait' }
    printCss.value = currentTemplate.value.print_css || ''

    history.value = [JSON.stringify(widgetTree.value)]
    historyIndex.value = 0
    selectedWidgetId.value = null
    isVisualBuilderOpen.value = true
  } catch (error) {
    toast.error('Gagal memuat visual builder data.', 'Gagal')
  } finally {
    detailsLoading.value = false
  }
}

const addWidget = (type: string) => {
  const staticDef = STATIC_WIDGET_DEFAULTS[type] || { schema_version: 1, props: {} }
  const newWidget = {
    id: `w_${type}_${Date.now()}`,
    type,
    schema_version: staticDef.schema_version,
    props: JSON.parse(JSON.stringify(staticDef.props))
  }
  widgetTree.value.push(newWidget)
  selectedWidgetId.value = newWidget.id
  pushHistory(widgetTree.value)
}

const deleteWidget = (id: string) => {
  const idx = widgetTree.value.findIndex(w => w.id === id)
  if (idx > -1) {
    widgetTree.value.splice(idx, 1)
    if (selectedWidgetId.value === id) {
      selectedWidgetId.value = null
    }
    pushHistory(widgetTree.value)
    return
  }
  // Try nested delete
  for (const w of widgetTree.value) {
    if (w.type === 'column_layout' && w.props.columns) {
      for (let c = 0; c < w.props.columns.length; c++) {
        const nestedIdx = w.props.columns[c].findIndex((nw: any) => nw.id === id)
        if (nestedIdx > -1) {
          w.props.columns[c].splice(nestedIdx, 1)
          if (selectedWidgetId.value === id) {
            selectedWidgetId.value = null
          }
          pushHistory(widgetTree.value)
          return
        }
      }
    }
  }
}

const moveWidgetUp = (id: string) => {
  const idx = widgetTree.value.findIndex(w => w.id === id)
  if (idx <= 0) return
  const temp = widgetTree.value[idx]
  widgetTree.value[idx] = widgetTree.value[idx - 1]
  widgetTree.value[idx - 1] = temp
  pushHistory(widgetTree.value)
}

const moveWidgetDown = (id: string) => {
  const idx = widgetTree.value.findIndex(w => w.id === id)
  if (idx === -1 || idx === widgetTree.value.length - 1) return
  const temp = widgetTree.value[idx]
  widgetTree.value[idx] = widgetTree.value[idx + 1]
  widgetTree.value[idx + 1] = temp
  pushHistory(widgetTree.value)
}

const selectWidget = (id: string) => {
  selectedWidgetId.value = id
}

// Drag & Drop Handlers (to match prototype-eduraport-builder.html functionality)
const draggedOverIdx = ref<number | null>(null)

const handleDragStart = (e: DragEvent, type: string) => {
  if (e.dataTransfer) {
    e.dataTransfer.setData('new', type)
    e.dataTransfer.effectAllowed = 'copy'
  }
}

const handleCanvasWidgetDragStart = (e: DragEvent, id: string) => {
  if (e.dataTransfer) {
    e.dataTransfer.setData('move', id)
    e.dataTransfer.effectAllowed = 'move'
  }
}

const handleDrop = (e: DragEvent, targetIdx: number) => {
  draggedOverIdx.value = null
  const newType = e.dataTransfer?.getData('new')
  const moveId = e.dataTransfer?.getData('move')
  
  if (newType) {
    const staticDef = STATIC_WIDGET_DEFAULTS[newType] || { schema_version: 1, props: {} }
    const newWidget = {
      id: `w_${newType}__${Date.now()}`,
      type: newType,
      schema_version: staticDef.schema_version,
      props: JSON.parse(JSON.stringify(staticDef.props))
    }
    widgetTree.value.splice(targetIdx, 0, newWidget)
    selectedWidgetId.value = newWidget.id
    pushHistory(widgetTree.value)
    toast.success('Widget berhasil ditambahkan ke kanvas', 'Sukses')
  } else if (moveId) {
    const srcIdx = widgetTree.value.findIndex(w => w.id === moveId)
    if (srcIdx !== -1) {
      const [moved] = widgetTree.value.splice(srcIdx, 1)
      const finalIdx = srcIdx < targetIdx ? targetIdx - 1 : targetIdx
      widgetTree.value.splice(finalIdx, 0, moved)
      selectedWidgetId.value = moved.id
      pushHistory(widgetTree.value)
    } else {
      // Find and remove from nested column layouts, then place onto main canvas
      for (const layout of widgetTree.value) {
        if (layout.type === 'column_layout' && layout.props.columns) {
          for (let c = 0; c < layout.props.columns.length; c++) {
            const nestedIdx = layout.props.columns[c].findIndex((nw: any) => nw.id === moveId)
            if (nestedIdx !== -1) {
              const [moved] = layout.props.columns[c].splice(nestedIdx, 1)
              widgetTree.value.splice(targetIdx, 0, moved)
              selectedWidgetId.value = moved.id
              pushHistory(widgetTree.value)
              return
            }
          }
        }
      }
    }
  }
}

const handleNestedDrop = (e: DragEvent, layoutWidgetId: string, colIdx: number) => {
  const newType = e.dataTransfer?.getData('new')
  const moveId = e.dataTransfer?.getData('move')
  
  const parentWidget = widgetTree.value.find(w => w.id === layoutWidgetId)
  if (!parentWidget) return

  if (!parentWidget.props.columns) {
    parentWidget.props.columns = Array.from({ length: 3 }, () => [])
  }

  if (newType) {
    const staticDef = STATIC_WIDGET_DEFAULTS[newType] || { schema_version: 1, props: {} }
    const newWidget = {
      id: `w_${newType}__${Date.now()}`,
      type: newType,
      schema_version: staticDef.schema_version,
      props: JSON.parse(JSON.stringify(staticDef.props))
    }
    parentWidget.props.columns[colIdx].push(newWidget)
    selectedWidgetId.value = newWidget.id
    pushHistory(widgetTree.value)
    toast.success('Widget dimasukkan ke dalam kolom', 'Sukses')
  } else if (moveId) {
    const srcIdx = widgetTree.value.findIndex(w => w.id === moveId)
    if (srcIdx !== -1) {
      const [moved] = widgetTree.value.splice(srcIdx, 1)
      parentWidget.props.columns[colIdx].push(moved)
      selectedWidgetId.value = moved.id
      pushHistory(widgetTree.value)
    } else {
      for (const layout of widgetTree.value) {
        if (layout.type === 'column_layout' && layout.props.columns) {
          for (let c = 0; c < layout.props.columns.length; c++) {
            const nestedIdx = layout.props.columns[c].findIndex((nw: any) => nw.id === moveId)
            if (nestedIdx !== -1) {
              const [moved] = layout.props.columns[c].splice(nestedIdx, 1)
              parentWidget.props.columns[colIdx].push(moved)
              selectedWidgetId.value = moved.id
              pushHistory(widgetTree.value)
              return
            }
          }
        }
      }
    }
  }
}

const deleteNestedWidget = (layoutWidgetId: string, colIdx: number, nestedIdx: number) => {
  const layout = widgetTree.value.find(w => w.id === layoutWidgetId)
  if (layout && layout.props.columns && layout.props.columns[colIdx]) {
    layout.props.columns[colIdx].splice(nestedIdx, 1)
    selectedWidgetId.value = null
    pushHistory(widgetTree.value)
    toast.success('Widget nested berhasil dihapus', 'Sukses')
  }
}

const selectedWidget = computed(() => {
  if (!selectedWidgetId.value) return null
  const found = widgetTree.value.find(w => w.id === selectedWidgetId.value)
  if (found) return found
  for (const w of widgetTree.value) {
    if (w.type === 'column_layout' && w.props.columns) {
      for (const col of w.props.columns) {
        const nestedFound = col.find((nw: any) => nw.id === selectedWidgetId.value)
        if (nestedFound) return nestedFound
      }
    }
  }
  return null
})

const handleSaveLayout = async () => {
  try {
    const updatedPayload = {
      ...currentTemplate.value,
      widget_tree: widgetTree.value,
      canvas_config: canvasConfig.value,
      print_css: printCss.value
    }
    const res = await updateReportTemplate(selectedSchoolId.value, currentTemplate.value.id, updatedPayload)
    if (res.success) {
      toast.success('Layout visual template berhasil disimpan.', 'Sukses')
      await selectTemplate(currentTemplate.value.id)
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal menyimpan layout visual template.', 'Error')
  }
}
const closeVisualBuilder = () => {
  isVisualBuilderOpen.value = false
}
const getWidgetDetails = (type: string) => {
  return AVAILABLE_WIDGETS.find(w => w.type === type)
}
const getGradeTableRows = (items: any[]) => {
  if (!Array.isArray(items)) return []
  const rows: any[] = []
  let index = 1
  for (const it of items) {
    if (it.custom && it.subs && it.subs.length > 0) {
      rows.push({ type: 'group', label: it.label })
      for (const sub of it.subs) {
        rows.push({ type: 'row', label: sub.label, no: index++, ref_id: sub.ref_id })
      }
    } else {
      rows.push({ type: 'row', label: it.label, no: index++, ref_id: it.ref_id })
    }
  }
  return rows
}
</script>

<template>
  <div>
    <!-- Fullscreen Visual Builder Overlay -->
    <div v-if="isVisualBuilderOpen" class="fixed inset-0 bg-slate-100 dark:bg-zinc-950 z-50 flex flex-col font-sans select-none overflow-hidden">
      <!-- Topbar -->
      <div class="h-14 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-sm">VB</div>
          <div>
            <span class="text-xs font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-widest block leading-none">Visual Builder</span>
            <input 
              v-model="currentTemplate.name" 
              type="text" 
              class="text-sm font-bold text-slate-800 dark:text-zinc-200 bg-transparent border-0 outline-none border-b border-dashed border-transparent hover:border-slate-300 focus:border-violet-650 p-0 m-0 leading-tight w-64"
            />
          </div>
          <span class="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold bg-violet-500/10 text-violet-600 border border-violet-500/15 uppercase">{{ currentTemplate.level }}</span>
        </div>

        <div class="flex items-center gap-3">
          <!-- Undo / Redo -->
          <div class="flex items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg p-1">
            <button 
              type="button" 
              @click="undo" 
              :disabled="historyIndex <= 0" 
              class="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 dark:text-zinc-400 dark:hover:text-zinc-150 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw :size="13" />
            </button>
            <button 
              type="button" 
              @click="redo" 
              :disabled="historyIndex >= history.length - 1" 
              class="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 dark:text-zinc-400 dark:hover:text-zinc-150 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <RotateCw :size="13" />
            </button>
          </div>

          <!-- Actions -->
          <button 
            type="button" 
            @click="handleSaveLayout" 
            class="bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 shadow-md shadow-violet-600/10 transition-colors"
          >
            <Save :size="12" /> Simpan Layout
          </button>
          <button 
            type="button" 
            @click="closeVisualBuilder" 
            class="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1 transition-colors"
          >
            <X :size="12" /> Tutup
          </button>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="flex-1 flex min-h-0 bg-slate-50 dark:bg-zinc-950">
        <!-- Left Sidebar: Palette & Tree -->
        <div class="w-72 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col shrink-0">
          <div class="flex border-b border-slate-200 dark:border-zinc-800 shrink-0">
            <button 
              type="button" 
              @click="activeBuilderTab = 'palette'"
              class="flex-1 text-center py-3 text-xs font-bold border-b-2"
              :class="activeBuilderTab === 'palette' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-400 dark:text-zinc-500'"
            >
              Widget Palette
            </button>
            <button 
              type="button" 
              @click="activeBuilderTab = 'tree'"
              class="flex-1 text-center py-3 text-xs font-bold border-b-2"
              :class="activeBuilderTab === 'tree' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-400 dark:text-zinc-500'"
            >
              Struktur &amp; Layer
            </button>
          </div>

          <!-- Left Sidebar Content -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            <!-- Palette Tab -->
            <div v-if="activeBuilderTab === 'palette'" class="space-y-4">
              <div 
                v-for="cat in ['Struktur', 'Tata Letak', 'Penilaian', 'Tambahan']" 
                :key="cat"
                class="space-y-2"
              >
                <span class="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block px-1">{{ cat }}</span>
                <div class="grid grid-cols-1 gap-2">
                  <div 
                    v-for="w in AVAILABLE_WIDGETS.filter(item => item.cat === cat)" 
                    :key="w.type"
                    @click="addWidget(w.type)"
                    draggable="true"
                    @dragstart="handleDragStart($event, w.type)"
                    class="p-2.5 bg-slate-50/50 dark:bg-zinc-950/30 hover:border-[#0e7d6d] hover:shadow-[0_1px_4px_rgba(14,125,109,0.15)] border border-slate-200/60 dark:border-zinc-850 rounded-xl cursor-grab active:cursor-grabbing transition-all flex items-center gap-3 active:scale-98"
                  >
                    <div class="w-8 h-8 rounded-lg bg-[#e3f2ef] text-[#0e7d6d] dark:text-teal-400 flex items-center justify-center shrink-0">
                      <LayoutTemplate :size="14" />
                    </div>
                    <div class="min-w-0">
                      <span class="text-xs font-bold text-slate-800 dark:text-zinc-200 block leading-tight">{{ w.name }}</span>
                      <span class="text-[9px] text-slate-450 dark:text-zinc-500 truncate block mt-0.5">{{ w.desc }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tree Tab -->
            <div v-else class="space-y-2">
              <div v-if="widgetTree.length === 0" class="text-center py-8 text-slate-400 dark:text-zinc-550 italic text-xs">
                Belum ada widget pada kanvas.
              </div>
              <div 
                v-for="(w, idx) in widgetTree" 
                :key="w.id"
                @click="selectWidget(w.id)"
                class="flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none"
                :class="[
                  selectedWidgetId === w.id 
                    ? 'bg-violet-600 border-violet-600 text-white' 
                    : 'bg-slate-50/50 dark:bg-zinc-950/30 border-slate-200/60 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                ]"
              >
                <span class="font-bold truncate flex-1">{{ getWidgetDetails(w.type)?.name || w.type }}</span>
                <div class="flex gap-0.5" @click.stop>
                  <button 
                    type="button" 
                    @click="moveWidgetUp(w.id)" 
                    :disabled="idx === 0"
                    class="p-1 rounded hover:bg-black/10 disabled:opacity-30"
                  >
                    <ChevronUp :size="10" />
                  </button>
                  <button 
                    type="button" 
                    @click="moveWidgetDown(w.id)" 
                    :disabled="idx === widgetTree.length - 1"
                    class="p-1 rounded hover:bg-black/10 disabled:opacity-30"
                  >
                    <ChevronDown :size="10" />
                  </button>
                  <button 
                    type="button" 
                    @click="deleteWidget(w.id)" 
                    class="p-1 rounded hover:bg-rose-500/25 text-rose-450"
                  >
                    <Trash2 :size="10" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Center Canvas -->
        <div class="flex-1 overflow-y-auto flex flex-col items-center p-8 min-w-0 bg-dot-pattern">
          <!-- Zoom & Controls -->
          <div class="flex items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full px-4 py-2 gap-4 shadow-sm mb-6 shrink-0">
            <span class="text-xs font-bold text-slate-500 dark:text-zinc-400">Lembar Kanvas:</span>
            <div class="flex items-center gap-2">
              <button 
                type="button" 
                @click="canvasConfig.orientation = 'portrait'"
                class="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors"
                :class="canvasConfig.orientation === 'portrait' ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'"
              >
                Potret (A4)
              </button>
              <button 
                type="button" 
                @click="canvasConfig.orientation = 'landscape'"
                class="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors"
                :class="canvasConfig.orientation === 'landscape' ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'"
              >
                Lanskap
              </button>
            </div>
          </div>

          <!-- Interactive A4 paper preview -->
          <div 
            class="bg-white text-black border border-slate-300 rounded-lg shadow-2xl overflow-hidden shrink-0 flex flex-col print:border-0 print:shadow-none"
            :style="{
              width: canvasConfig.orientation === 'portrait' ? '210mm' : '297mm',
              minHeight: canvasConfig.orientation === 'portrait' ? '297mm' : '210mm',
              padding: '20mm 15mm 20mm 15mm'
            }"
          >
            <!-- Canvas Widgets Renders -->
            <div class="flex-1 flex flex-col gap-2">
              <div v-if="widgetTree.length === 0" class="flex-1 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-12 text-slate-400 text-center">
                <LayoutTemplate class="opacity-40 text-[#0e7d6d] mb-3" :size="36" />
                <span class="text-xs font-bold text-slate-700">Kanvas Kosong</span>
                <span class="text-[10px] text-slate-400 mt-1 max-w-xs">Silakan pilih/klik widget di panel kiri atau seret ke sini untuk menyusun tata letak lembar rapor Anda.</span>
              </div>

              <!-- Top Drop Zone -->
              <div 
                v-if="widgetTree.length > 0"
                @dragover.prevent="draggedOverIdx = 0"
                @dragleave="draggedOverIdx = null"
                @drop="handleDrop($event, 0)"
                class="h-2 rounded transition-all duration-150"
                :class="draggedOverIdx === 0 ? 'bg-[#0e7d6d]/40 h-4 border border-dashed border-[#0e7d6d]' : 'bg-transparent'"
              ></div>

              <!-- Widgets Loop with Drop Zones -->
              <template v-for="(w, idx) in widgetTree" :key="w.id">
                <div 
                  @click="selectWidget(w.id)"
                  draggable="true"
                  @dragstart="handleCanvasWidgetDragStart($event, w.id)"
                  class="relative border border-transparent rounded-lg hover:border-[#0e7d6d]/50 transition-all select-none group cursor-grab active:cursor-grabbing"
                  :class="{ 'border-[#0e7d6d] bg-teal-500/5 ring-2 ring-[#0e7d6d]/10': selectedWidgetId === w.id }"
                >
                  <!-- Toolbar Overlays -->
                  <div class="absolute -top-3.5 right-2 hidden group-hover:flex items-center gap-1 bg-[#0e7d6d] text-white text-[9px] font-bold rounded-lg p-0.5 z-10 shadow-md shadow-[#0e7d6d]/20">
                  <span class="px-2 select-none uppercase tracking-wider text-[8px]">{{ getWidgetDetails(w.type)?.name || w.type }}</span>
                  <button type="button" @click.stop="moveWidgetUp(w.id)" :disabled="idx === 0" class="p-1 rounded hover:bg-white/20 disabled:opacity-30"><ChevronUp :size="10" /></button>
                  <button type="button" @click.stop="moveWidgetDown(w.id)" :disabled="idx === widgetTree.length - 1" class="p-1 rounded hover:bg-white/20 disabled:opacity-30"><ChevronDown :size="10" /></button>
                  <button type="button" @click.stop="deleteWidget(w.id)" class="p-1 rounded hover:bg-red-500/30 text-red-100"><Trash2 :size="10" /></button>
                </div>

                <!-- Preview Widgets Renderers -->
                <div class="p-3 text-left">
                  <!-- 1. header_school -->
                  <div v-if="w.type === 'header_school'" class="text-center border-b-4 border-double border-slate-900 pb-3 font-serif">
                    <h2 class="text-md font-extrabold uppercase leading-tight tracking-wider">YAYASAN TURSINA SHALAWAT</h2>
                    <h1 class="text-lg font-black uppercase leading-tight mt-0.5 tracking-widest text-violet-750">TAMAN KANAK-KANAK AL FATAH</h1>
                    <p v-if="w.props.showAddress" class="text-[9px] text-slate-600 leading-normal mt-1 italic">
                      Jl. Kebon Agung Km 4.5, Karanganyar, Jawa Tengah. Telp: (0271) 987654
                    </p>
                    <p v-if="w.props.showNpsn" class="text-[8px] font-mono text-slate-500 font-bold mt-0.5">NPSN: 20398765</p>
                  </div>

                  <!-- 2. student_identity -->
                  <div v-else-if="w.type === 'student_identity'" class="grid grid-cols-2 gap-x-8 gap-y-1 font-serif text-[10px]">
                    <div class="flex"><span class="w-24 shrink-0 font-bold uppercase">Nama Peserta Didik</span><span class="mr-2">:</span><span class="font-semibold">Ahmad Dzaky Al-Fatih</span></div>
                    <div class="flex"><span class="w-24 shrink-0 font-bold uppercase">Kelas / Fase</span><span class="mr-2">:</span><span>TK B1 / Fondasi</span></div>
                    <div v-if="w.props.showNisn" class="flex"><span class="w-24 shrink-0 font-bold uppercase">Nomor Induk / NISN</span><span class="mr-2">:</span><span class="font-mono">12345 / 3120987654</span></div>
                    <div class="flex"><span class="w-24 shrink-0 font-bold uppercase">Semester</span><span class="mr-2">:</span><span>1 (Ganjil)</span></div>
                    <div class="flex"><span class="w-24 shrink-0 font-bold uppercase">Tahun Ajaran</span><span class="mr-2">:</span><span class="font-mono">2026/2027</span></div>
                    <div v-if="w.props.showWali" class="flex"><span class="w-24 shrink-0 font-bold uppercase">Nama Orang Tua / Wali</span><span class="mr-2">:</span><span>Muhammad Irfan</span></div>
                  </div>

                  <!-- 3. section_block -->
                  <div v-else-if="w.type === 'section_block'" class="py-1 font-serif">
                    <h3 class="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-zinc-200">{{ w.props.title || 'SEKSI PROGRAM' }}</h3>
                  </div>

                  <!-- 4. page_break -->
                  <div v-else-if="w.type === 'page_break'" class="border-t border-dashed border-rose-500 relative py-2 select-none pointer-events-none">
                    <span class="absolute -top-2.5 right-4 bg-white text-rose-500 text-[8px] font-black tracking-widest px-2 uppercase">Batas Halaman Cetak</span>
                  </div>

                  <!-- 5. grade_table -->
                  <div v-else-if="w.type === 'grade_table'" class="space-y-3 font-serif">
                    <table class="w-full text-left border-collapse border border-slate-800 text-[10px]">
                      <thead>
                        <tr class="bg-slate-100 border-b border-slate-800 font-bold text-[9px] uppercase">
                          <th v-for="col in w.props.cols.filter(c => c.visible)" :key="col.key" class="p-1.5 border-r border-slate-800 text-center">
                            {{ col.label }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <template v-for="(row, idx) in getGradeTableRows(w.props.items)" :key="idx">
                          <!-- Group Header Row -->
                          <tr v-if="row.type === 'group'" class="bg-slate-100/60 border-b border-slate-800 font-bold">
                            <td :colspan="w.props.cols.filter(c => c.visible).length" class="p-2 pl-3 font-serif uppercase tracking-wider text-[9px] text-slate-800 font-black">
                              {{ row.label }}
                            </td>
                          </tr>
                          
                          <!-- Normal Subject Row -->
                          <tr v-else class="border-b border-slate-800 last:border-b-0">
                            <td v-if="w.props.cols.some(c => c.key === 'no' && c.visible)" class="p-1.5 border-r border-slate-800 text-center font-bold">{{ row.no }}</td>
                            <td v-if="w.props.cols.some(c => c.key === 'name' && c.visible)" class="p-1.5 border-r border-slate-800 font-semibold" :class="{ 'pl-4': w.props.items.some(it => it.custom && it.subs && it.subs.length > 0) }">{{ row.label }}</td>
                            <td v-if="w.props.cols.some(c => c.key === 'kkm' && c.visible)" class="p-1.5 border-r border-slate-800 text-center font-mono" :class="{ 'bg-amber-50 dark:bg-zinc-850': w.props.highlightKkm }">{{ w.props.kkm }}</td>
                            <td v-if="w.props.cols.some(c => c.key === 'val' && c.visible)" class="p-1.5 border-r border-slate-800 text-center font-mono font-bold" :class="{ 'text-rose-600 bg-rose-50': w.props.highlightKkm && (row.no % 3 === 0) }">
                              {{ (row.no % 3 === 0) ? (w.props.kkm - 5) : 85 }}
                            </td>
                            <td v-if="w.props.cols.some(c => c.key === 'pred' && c.visible)" class="p-1.5 border-r border-slate-800 text-center font-bold">
                              {{ (row.no % 3 === 0) ? 'C' : 'A' }}
                            </td>
                            <td v-if="w.props.cols.some(c => c.key === 'desc' && c.visible)" class="p-1.5 text-[9px] text-justify italic leading-relaxed text-slate-700">
                              Ananda menunjukkan pemahaman yang sangat matang dalam kompetensi ini, terutama terkait penerapan konsep dasar.
                            </td>
                          </tr>
                        </template>
                        <tr v-if="w.props.items.length === 0">
                          <td :colspan="w.props.cols.filter(c => c.visible).length" class="p-6 text-center text-slate-400 italic">
                            [Tabel Nilai Mapel Kosong. Silakan pilih mata pelajaran di panel properties sebelah kanan.]
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- 6. desc_table -->
                  <div v-else-if="w.type === 'desc_table'" class="space-y-4 font-serif">
                    <!-- Format B: List Langsung / Flattened -->
                    <table v-if="!w.props.hasSub" class="w-full text-left border-collapse border border-slate-800 text-[10px]">
                      <thead>
                        <tr class="bg-slate-100 border-b border-slate-800 font-bold text-[9px] uppercase">
                          <th v-for="col in w.props.cols.filter(c => c.visible)" :key="col.key" class="p-1.5 border-r border-slate-800 text-center">
                            {{ col.label }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <!-- Flattened list of checked sub-items -->
                        <template v-if="w.props.items.some(it => it.subs && it.subs.length > 0)">
                          <tr v-for="(subRow, sIdx) in w.props.items.flatMap(it => (it.subs && it.subs.length > 0) ? it.subs.map(sub => ({ parentLabel: it.label, subLabel: sub.label, id: sub.ref_id })) : [])" :key="sIdx" class="border-b border-slate-800 last:border-b-0">
                            <td v-if="w.props.cols.some(c => c.key === 'no' && c.visible)" class="p-1.5 border-r border-slate-800 text-center font-bold">{{ sIdx + 1 }}.</td>
                            <td v-if="w.props.cols.some(c => c.key === 'name' && c.visible)" class="p-1.5 border-r border-slate-800 pl-2 leading-relaxed">
                              {{ subRow.subLabel }}
                              <span class="text-[8px] font-bold text-slate-450 block font-sans">Elemen: {{ subRow.parentLabel }}</span>
                            </td>
                            <td v-if="w.props.cols.some(c => c.key === 'val' && c.visible)" class="p-1.5 text-center font-bold text-violet-750">BSH</td>
                          </tr>
                        </template>
                        
                        <!-- Fallback: Parent items without sub-items -->
                        <template v-else-if="w.props.items.length > 0">
                          <tr v-for="(it, idx) in w.props.items" :key="idx" class="border-b border-slate-800 last:border-b-0">
                            <td v-if="w.props.cols.some(c => c.key === 'no' && c.visible)" class="p-1.5 border-r border-slate-800 text-center font-bold">{{ idx + 1 }}.</td>
                            <td v-if="w.props.cols.some(c => c.key === 'name' && c.visible)" class="p-1.5 border-r border-slate-800 pl-2 leading-relaxed font-bold">{{ it.label }}</td>
                            <td v-if="w.props.cols.some(c => c.key === 'val' && c.visible)" class="p-1.5 text-center font-bold text-violet-750">BSH</td>
                          </tr>
                        </template>
                        
                        <tr v-else>
                          <td :colspan="w.props.cols.filter(c => c.visible).length" class="p-6 text-center text-slate-400 italic">
                            [Tabel Capaian Kosong. Silakan pilih elemen kurikulum di panel properties sebelah kanan.]
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Format A / Format C: Terkelompok / Grouped -->
                    <div v-else v-for="(it, index) in w.props.items" :key="index" class="space-y-2">
                      <div class="text-[10px] font-black uppercase text-slate-900 flex justify-between bg-slate-50 p-1 border-b border-slate-200">
                        <span>{{ it.label }}</span>
                        <!-- If perSub is false, parent gets the rating score row here! -->
                        <span v-if="!w.props.perSub && w.props.cols.some(c => c.key === 'val' && c.visible)" class="text-violet-750 uppercase text-[9px] font-bold font-sans">BSH</span>
                      </div>
                      
                      <!-- Table for indicator list -->
                      <table v-if="it.subs && it.subs.length > 0" class="w-full text-left border-collapse border border-slate-800 text-[10px]">
                        <thead>
                          <tr class="bg-slate-50/50 border-b border-slate-800 font-bold text-[8px] uppercase">
                            <th v-for="col in w.props.cols.filter(c => c.visible)" :key="col.key" class="p-1 border-r border-slate-800 text-center">
                              {{ col.label }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(sub, sIdx) in it.subs" :key="sIdx" class="border-b border-slate-800 last:border-b-0">
                            <td v-if="w.props.cols.some(c => c.key === 'no' && c.visible)" class="p-1 border-r border-slate-800 text-center font-bold">{{ sIdx + 1 }}.</td>
                            <td v-if="w.props.cols.some(c => c.key === 'name' && c.visible)" class="p-1 border-r border-slate-800 pl-2 leading-relaxed text-slate-700">{{ sub.label }}</td>
                            <td v-if="w.props.cols.some(c => c.key === 'val' && c.visible)" class="p-1 text-center font-bold text-violet-750" :class="{ 'text-slate-350 bg-slate-50': !w.props.perSub }">
                              {{ w.props.perSub ? 'BSH' : '-' }}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <!-- Narrative text under element (Format C / Narrative Option) -->
                      <div v-if="w.props.showNarasi" class="text-[9px] text-justify leading-relaxed p-2 bg-slate-50/60 border border-slate-200 rounded italic">
                        <strong>Narasi Capaian |</strong> Ananda menunjukkan perkembangan yang sangat memuaskan pada bidang ini. Mampu bekerja sama dengan teman, aktif berpartisipasi, dan menyelesaikan kegiatan belajar dengan ceria.
                      </div>
                    </div>

                    <div v-if="w.props.items.length === 0" class="text-center p-6 border rounded border-slate-300 text-slate-400 italic">
                      [Tabel Capaian Kosong. Silakan pilih elemen kurikulum di panel properties sebelah kanan.]
                    </div>
                  </div>

                  <!-- 7. subject_narrative -->
                  <div v-else-if="w.type === 'subject_narrative'" class="space-y-4 font-serif text-[10px] text-justify leading-relaxed">
                    <div v-for="(it, index) in w.props.items" :key="index" class="p-3 border border-slate-800 rounded bg-slate-50/20">
                      <strong class="text-[11px] uppercase block mb-1 border-b border-slate-200 pb-0.5">{{ it.label }}</strong>
                      Ananda menunjukkan perkembangan yang sangat baik dalam mata pelajaran ini. Mampu memahami konsep esensial dengan matang dan menerapkan dalam tugas praktis harian secara mandiri.
                    </div>
                    <div v-if="w.props.items.length === 0" class="text-center p-6 text-slate-400 italic">
                      [Aspek Narasi Mapel Kosong. Hubungkan mapel pada panel kanan.]
                    </div>
                  </div>

                  <!-- 8. extracurricular -->
                  <div v-else-if="w.type === 'extracurricular'" class="font-serif">
                    <table class="w-full text-left border-collapse border border-slate-800 text-[10px]">
                      <thead>
                        <tr class="bg-slate-100 border-b border-slate-800 font-bold text-[9px] uppercase">
                          <th v-for="col in w.props.cols.filter(c => c.visible)" :key="col.key" class="p-1.5 border-r border-slate-800 text-center">
                            {{ col.label }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr class="border-b border-slate-800">
                          <td v-if="w.props.cols.some(c => c.key === 'no' && c.visible)" class="p-1.5 border-r border-slate-800 text-center">1</td>
                          <td v-if="w.props.cols.some(c => c.key === 'name' && c.visible)" class="p-1.5 border-r border-slate-800 font-bold">Pramuka Prasiaga</td>
                          <td v-if="w.props.cols.some(c => c.key === 'val' && c.visible)" class="p-1.5 border-r border-slate-800 text-center font-bold">A</td>
                          <td v-if="w.props.cols.some(c => c.key === 'note' && c.visible)" class="p-1.5 leading-relaxed">Sangat aktif mengikuti latihan mingguan dan disiplin menerapkan nilai kepramukaan.</td>
                        </tr>
                        <tr class="border-b border-slate-800">
                          <td v-if="w.props.cols.some(c => c.key === 'no' && c.visible)" class="p-1.5 border-r border-slate-800 text-center">2</td>
                          <td v-if="w.props.cols.some(c => c.key === 'name' && c.visible)" class="p-1.5 border-r border-slate-800 font-bold">Seni Lukis</td>
                          <td v-if="w.props.cols.some(c => c.key === 'val' && c.visible)" class="p-1.5 border-r border-slate-800 text-center font-bold">A</td>
                          <td v-if="w.props.cols.some(c => c.key === 'note' && c.visible)" class="p-1.5 leading-relaxed">Sangat kreatif dalam menuangkan gagasan warna dan gambar pada kertas lukis.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- 9. p5_assessment -->
                  <div v-else-if="w.type === 'p5_assessment'" class="font-serif">
                    <table class="w-full text-left border-collapse border border-slate-800 text-[10px]">
                      <thead>
                        <tr class="bg-slate-100 border-b border-slate-800 font-bold text-[9px] uppercase">
                          <th v-for="col in w.props.cols.filter(c => c.visible)" :key="col.key" class="p-1.5 border-r border-slate-800 text-center">
                            {{ col.label }}
                          </th>
                          <th class="p-1.5 border-r border-slate-800 text-center">MB</th>
                          <th class="p-1.5 border-r border-slate-800 text-center">SB</th>
                          <th class="p-1.5 border-r border-slate-800 text-center">BSH</th>
                          <th class="p-1.5 text-center">SAB</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr class="border-b border-slate-800">
                          <td v-if="w.props.cols.some(c => c.key === 'name' && c.visible)" class="p-1.5 border-r border-slate-800 font-bold">Dimensi 1: Keimanan &amp; Akhlak Mulia</td>
                          <td v-if="w.props.cols.some(c => c.key === 'val' && c.visible)" class="p-1.5 border-r border-slate-800 text-center font-semibold">Mulai Berkembang</td>
                          <td class="p-1.5 border-r border-slate-800 text-center"></td>
                          <td class="p-1.5 border-r border-slate-800 text-center font-bold">✓</td>
                          <td class="p-1.5 border-r border-slate-800 text-center"></td>
                          <td class="p-1.5 text-center"></td>
                        </tr>
                        <tr class="border-b border-slate-800">
                          <td v-if="w.props.cols.some(c => c.key === 'name' && c.visible)" class="p-1.5 border-r border-slate-800 font-bold">Dimensi 2: Gotong Royong / Kolaborasi</td>
                          <td v-if="w.props.cols.some(c => c.key === 'val' && c.visible)" class="p-1.5 border-r border-slate-800 text-center font-semibold">Berkembang Sesuai Harapan</td>
                          <td class="p-1.5 border-r border-slate-800 text-center"></td>
                          <td class="p-1.5 border-r border-slate-800 text-center"></td>
                          <td class="p-1.5 border-r border-slate-800 text-center font-bold">✓</td>
                          <td class="p-1.5 text-center"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- 10. attendance -->
                  <div v-else-if="w.type === 'attendance'" class="font-serif w-80">
                    <table class="text-left border-collapse border border-slate-800 text-[10px] w-full">
                      <thead>
                        <tr class="bg-slate-100 border-b border-slate-800 font-bold text-[9px] uppercase">
                          <th class="p-1.5 border-r border-slate-800 w-10 text-center">No</th>
                          <th class="p-1.5 border-r border-slate-800">Keterangan Hadir</th>
                          <th class="p-1.5 text-center w-24">Jumlah Hari</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr class="border-b border-slate-800"><td class="p-1.5 border-r border-slate-800 text-center font-bold">1</td><td class="p-1.5 border-r border-slate-800">Sakit (S)</td><td class="p-1.5 text-center font-mono font-bold">2 hari</td></tr>
                        <tr class="border-b border-slate-800"><td class="p-1.5 border-r border-slate-800 text-center font-bold">2</td><td class="p-1.5 border-r border-slate-800">Izin (I)</td><td class="p-1.5 text-center font-mono font-bold">1 hari</td></tr>
                        <tr class="border-b border-slate-800"><td class="p-1.5 border-r border-slate-800 text-center font-bold">3</td><td class="p-1.5 border-r border-slate-800">Tanpa Keterangan (A)</td><td class="p-1.5 text-center font-mono font-bold">0 hari</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- 11. growth -->
                  <div v-else-if="w.type === 'growth'" class="font-serif">
                    <table class="w-full text-left border-collapse border border-slate-800 text-[10px]">
                      <thead>
                        <tr class="bg-slate-100 border-b border-slate-800 font-bold text-[9px] uppercase">
                          <th class="p-1.5 border-r border-slate-800">Fisik Amatan / Semester</th>
                          <th class="p-1.5 border-r border-slate-800 text-center">Tinggi Badan (cm)</th>
                          <th class="p-1.5 border-r border-slate-800 text-center">Berat Badan (kg)</th>
                          <th class="p-1.5 text-center">Kondisi Kesehatan Gigi &amp; Mulut</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr class="border-b border-slate-800">
                          <td class="p-1.5 border-r border-slate-800 font-bold">Semester 1 (Ganjil)</td>
                          <td class="p-1.5 border-r border-slate-800 text-center font-mono">110 cm</td>
                          <td class="p-1.5 border-r border-slate-800 text-center font-mono">18.5 kg</td>
                          <td class="p-1.5 leading-normal">Bersih, tidak ada lubang/karies gigi yang bermasalah.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- 12. student_photo -->
                  <div v-else-if="w.type === 'student_photo'" class="flex justify-start font-serif">
                    <div class="w-24 h-32 border border-slate-900 bg-slate-50 flex flex-col items-center justify-center text-[9px] text-slate-400 p-2 text-center select-none font-sans font-semibold">
                      Pas Foto Siswa
                      <span class="text-[8px] text-slate-400/80 mt-1 block">3 x 4 cm</span>
                    </div>
                  </div>

                  <!-- 15. homeroom_notes -->
                  <div v-else-if="w.type === 'homeroom_notes'" class="font-serif w-full">
                    <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-3">Catatan Wali Kelas</h3>
                    <div class="border border-slate-900 p-4 min-h-[92px] text-xs leading-relaxed text-justify text-slate-700 bg-white">
                      Ananda menunjukkan perilaku sosial yang sangat baik selama semester ini dan memiliki motivasi belajar yang konsisten.
                    </div>
                  </div>

                  <!-- 13. column_layout -->
                  <div v-else-if="w.type === 'column_layout'" class="grid gap-4 font-serif" :style="{ gridTemplateColumns: `repeat(${w.props.cols || 2}, 1fr)` }">
                    <div 
                      v-for="c in (w.props.cols || 2)" 
                      :key="c"
                      class="border border-dashed border-slate-300 rounded p-2 min-h-[120px] bg-slate-50/50 hover:bg-teal-500/5 hover:border-[#0e7d6d]/50 transition-all select-none space-y-2"
                      @dragover.prevent
                      @drop.stop="handleNestedDrop($event, w.id, c - 1)"
                    >
                      <div class="text-[8px] font-sans font-bold uppercase tracking-wider text-slate-400 select-none pointer-events-none mb-1 text-center">Kolom {{ c }}</div>
                      
                      <!-- Render nested items inside column -->
                      <div 
                        v-for="(nw, nIdx) in (w.props.columns?.[c - 1] || [])" 
                        :key="nw.id"
                        class="border border-slate-200 bg-white text-slate-900 rounded p-2 relative group/nested cursor-grab active:cursor-grabbing hover:border-[#0e7d6d]/50"
                        @click.stop="selectWidget(nw.id)"
                        draggable="true"
                        @dragstart.stop="handleCanvasWidgetDragStart($event, nw.id)"
                      >
                        <!-- Mini nested toolbar -->
                        <div class="absolute -top-3.5 right-1 hidden group-hover/nested:flex items-center gap-1 bg-[#0e7d6d] text-white text-[8px] rounded p-0.5 z-10">
                          <button type="button" @click.stop="deleteNestedWidget(w.id, c - 1, nIdx)" class="p-0.5 hover:bg-white/20"><Trash2 :size="8" /></button>
                        </div>
                        
                        <!-- Render Nested Widget Previews -->
                        <!-- 10. attendance inside column -->
                        <div v-if="nw.type === 'attendance'" class="text-left font-serif pointer-events-none select-none">
                          <table class="w-full text-left border-collapse border border-slate-800 text-[8px]">
                            <thead>
                              <tr class="bg-slate-100 text-slate-900 border-b border-slate-800 font-bold uppercase">
                                <th class="p-1 border-r border-slate-800">Kehadiran</th>
                                <th class="p-1 text-center w-12">Hari</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr class="border-b border-slate-800"><td class="p-1 border-r border-slate-800">Sakit</td><td class="p-1 text-center">2</td></tr>
                              <tr class="border-b border-slate-800"><td class="p-1 border-r border-slate-800">Izin</td><td class="p-1 text-center">1</td></tr>
                              <tr class="border-b border-slate-800"><td class="p-1 border-r border-slate-800">Alpha</td><td class="p-1 text-center">0</td></tr>
                            </tbody>
                          </table>
                        </div>

                        <!-- 11. growth inside column -->
                        <div v-else-if="nw.type === 'growth'" class="text-left font-serif pointer-events-none select-none">
                          <table class="w-full text-left border-collapse border border-slate-800 text-[8px]">
                            <thead>
                              <tr class="bg-slate-100 text-slate-900 border-b border-slate-800 font-bold uppercase">
                                <th class="p-1 border-r border-slate-800">Aspek Tumbuh</th>
                                <th class="p-1 text-center w-12">Nilai</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr class="border-b border-slate-800"><td class="p-1 border-r border-slate-800">Tinggi</td><td class="p-1 text-center">105 cm</td></tr>
                              <tr class="border-b border-slate-800"><td class="p-1 border-r border-slate-800">Berat</td><td class="p-1 text-center">18 kg</td></tr>
                            </tbody>
                          </table>
                        </div>

                        <!-- 12. student_photo inside column -->
                        <div v-else-if="nw.type === 'student_photo'" class="flex justify-center font-serif pointer-events-none select-none">
                          <div class="w-16 h-20 border border-slate-400 flex items-center justify-center text-[7px] text-slate-400 uppercase tracking-widest font-semibold bg-slate-50 text-center">
                            Foto 3x4
                          </div>
                        </div>

                        <!-- 15. homeroom_notes inside column -->
                        <div v-else-if="nw.type === 'homeroom_notes'" class="text-left font-serif pointer-events-none select-none">
                          <h4 class="text-[9px] font-black uppercase border-b border-slate-900 pb-0.5 mb-1.5">Catatan Wali Kelas</h4>
                          <div class="border border-slate-900 p-2 text-[8px] leading-relaxed text-justify text-slate-700 bg-white min-h-[50px]">
                            Ananda menunjukkan perilaku sosial yang sangat baik selama semester ini.
                          </div>
                        </div>

                        <!-- Generic short representation for other widgets -->
                        <div v-else class="text-[9px] font-bold text-slate-500 font-sans p-1 text-center pointer-events-none select-none">
                          {{ getWidgetDetails(nw.type)?.name || nw.type }}
                        </div>
                      </div>
                      
                      <!-- Empty Column Placeholder -->
                      <div v-if="(!w.props.columns?.[c - 1] || w.props.columns[c - 1].length === 0)" class="text-center text-[9px] text-slate-400 italic pt-6 pointer-events-none select-none">
                        Drop widget ke sini
                      </div>
                    </div>
                  </div>

                  <!-- 14. signature_block -->
                  <div v-else-if="w.type === 'signature_block'" class="grid grid-cols-3 text-center text-[10px] font-serif gap-8 pt-4">
                    <div class="space-y-12">
                      <span>Mengetahui,<br>Orang Tua / Wali Siswa</span>
                      <div class="border-t border-slate-900 pt-1 font-bold">(...................................................)</div>
                    </div>
                    <div class="space-y-12">
                      <span><br>Wali Kelas</span>
                      <div class="border-t border-slate-900 pt-1 font-bold">Ahmad Hidayat, S.Pd.</div>
                    </div>
                    <div class="space-y-12">
                      <span>{{ w.props.place || 'Karanganyar' }}, {{ w.props.date || '20 Desember 2026' }}<br>Kepala Sekolah</span>
                      <div class="border-t border-slate-900 pt-1 font-bold">{{ w.props.kepsek || 'Dra. Hj. Umi Kulsum, M.Pd.' }}</div>
                    </div>
                  </div>

                  <!-- fallback type visual helper -->
                  <div v-else class="p-6 bg-slate-50 text-slate-400 italic text-center font-sans">
                    [{{ w.type }} preview placeholder]
                  </div>
                </div>
              </div>
              <!-- Drop Zone below this widget -->
                <div 
                  @dragover.prevent="draggedOverIdx = idx + 1"
                  @dragleave="draggedOverIdx = null"
                  @drop="handleDrop($event, idx + 1)"
                  class="h-2 rounded transition-all duration-150"
                  :class="draggedOverIdx === idx + 1 ? 'bg-[#0e7d6d]/40 h-4 border border-dashed border-[#0e7d6d]' : 'bg-transparent'"
                ></div>
              </template>
            </div>
          </div>
        </div>

        <!-- Right Sidebar: Properties Panel -->
        <div class="w-80 bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 flex flex-col shrink-0">
          <div class="p-4 border-b border-slate-200 dark:border-zinc-800 shrink-0">
            <h3 class="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest leading-none">Properties Panel</h3>
          </div>

          <!-- Properties Panel Content -->
          <div class="flex-1 overflow-y-auto p-4 space-y-5">
            <div v-if="!selectedWidget" class="text-center py-20 text-slate-400 dark:text-zinc-550 italic text-xs">
              Pilih salah satu widget pada kanvas untuk mengedit properties.
            </div>

            <div v-else class="space-y-5">
              <!-- General Type Info -->
              <div class="bg-violet-50/50 dark:bg-zinc-950/20 p-3 rounded-xl border border-violet-100 dark:border-zinc-800 text-xs">
                <span class="font-bold text-violet-700 dark:text-violet-400 block mb-0.5">{{ getWidgetDetails(selectedWidget.type)?.name }}</span>
                <span class="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal block">{{ getWidgetDetails(selectedWidget.type)?.desc }}</span>
              </div>

              <!-- 1. section_block properties -->
              <div v-if="selectedWidget.type === 'section_block'" class="space-y-3">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold text-slate-550 dark:text-zinc-450 uppercase tracking-widest px-1">Judul Pembatas Seksi</label>
                  <input 
                    type="text" 
                    v-model="selectedWidget.props.title" 
                    @change="pushHistory(widgetTree)"
                    class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-violet-650"
                  />
                </div>
              </div>

              <!-- 2. column_layout properties -->
              <div v-else-if="selectedWidget.type === 'column_layout'" class="space-y-3">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold text-slate-550 dark:text-zinc-450 uppercase tracking-widest px-1">Jumlah Kolom</label>
                  <select 
                    v-model.number="selectedWidget.props.cols" 
                    @change="pushHistory(widgetTree)"
                    class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-violet-650"
                  >
                    <option :value="1">1 Kolom</option>
                    <option :value="2">2 Kolom</option>
                    <option :value="3">3 Kolom</option>
                  </select>
                </div>
              </div>

              <!-- 3. header_school properties -->
              <div v-else-if="selectedWidget.type === 'header_school'" class="space-y-3">
                <div class="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="prop_header_address" 
                    v-model="selectedWidget.props.showAddress" 
                    @change="pushHistory(widgetTree)"
                    class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20"
                  />
                  <label for="prop_header_address" class="text-xs font-semibold text-slate-650 dark:text-zinc-350 select-none cursor-pointer">Tampilkan Alamat &amp; Telp Kop</label>
                </div>
                <div class="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="prop_header_npsn" 
                    v-model="selectedWidget.props.showNpsn" 
                    @change="pushHistory(widgetTree)"
                    class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20"
                  />
                  <label for="prop_header_npsn" class="text-xs font-semibold text-slate-650 dark:text-zinc-350 select-none cursor-pointer">Tampilkan NPSN Kop</label>
                </div>
              </div>

              <!-- 4. student_identity properties -->
              <div v-else-if="selectedWidget.type === 'student_identity'" class="space-y-3">
                <div class="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="prop_student_nisn" 
                    v-model="selectedWidget.props.showNisn" 
                    @change="pushHistory(widgetTree)"
                    class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20"
                  />
                  <label for="prop_student_nisn" class="text-xs font-semibold text-slate-650 dark:text-zinc-350 select-none cursor-pointer">Tampilkan NISN</label>
                </div>
                <div class="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="prop_student_wali" 
                    v-model="selectedWidget.props.showWali" 
                    @change="pushHistory(widgetTree)"
                    class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20"
                  />
                  <label for="prop_student_wali" class="text-xs font-semibold text-slate-655 dark:text-zinc-350 select-none cursor-pointer">Tampilkan Nama Wali</label>
                </div>
              </div>

              <!-- 5. grade_table properties -->
              <div v-else-if="selectedWidget.type === 'grade_table'" class="space-y-5">
                <div class="grid grid-cols-2 gap-3 border-b border-slate-100 dark:border-zinc-850 pb-3">
                  <div class="flex flex-col gap-1">
                    <label class="text-[9px] font-bold text-slate-450 uppercase">Kriteria KKM</label>
                    <input 
                      type="number" 
                      v-model.number="selectedWidget.props.kkm" 
                      @change="pushHistory(widgetTree)"
                      class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1 text-xs outline-none focus:border-violet-650"
                    />
                  </div>
                  <div class="flex items-center gap-2 pt-4">
                    <input 
                      type="checkbox" 
                      id="prop_grade_highlight" 
                      v-model="selectedWidget.props.highlightKkm" 
                      @change="pushHistory(widgetTree)"
                      class="rounded border-slate-350 dark:border-zinc-800 text-violet-600 focus:ring-violet-600/20"
                    />
                    <label for="prop_grade_highlight" class="text-[10px] font-semibold text-slate-650 select-none">Sorot nilai di bawah KKM</label>
                  </div>
                </div>

                <!-- Column Editor -->
                <div class="space-y-2">
                  <span class="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Format Kolom Tabel</span>
                  <ColumnEditor v-model="selectedWidget.props.cols" @update:modelValue="pushHistory(widgetTree)" />
                </div>

                <!-- Subjects Selection -->
                <div class="space-y-2">
                  <span class="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Mata Pelajaran (Data Bindings)</span>
                  <TreeItemPicker 
                    v-model="selectedWidget.props.items" 
                    :master-data="mappedSubjects" 
                    ref-type="subject" 
                    @update:modelValue="pushHistory(widgetTree)"
                  />
                </div>
              </div>

              <!-- 6. desc_table properties -->
              <div v-else-if="selectedWidget.type === 'desc_table'" class="space-y-5">
                <div class="space-y-3 border-b border-slate-100 dark:border-zinc-850 pb-3">
                  <div class="flex flex-col gap-1">
                    <label class="text-[9px] font-bold text-slate-450 uppercase">Skala Predikat Penilaian</label>
                    <select 
                      v-model="selectedWidget.props.scale_id" 
                      @change="pushHistory(widgetTree)"
                      class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1 text-xs outline-none focus:border-violet-650 font-semibold"
                    >
                      <option value="scl_bsh">TK (BB, MB, BSH, BSB)</option>
                      <option value="scl_pred">Predikat SD-SMA (A, B, C, D)</option>
                      <option value="scl_numeric">Angka (0 - 100)</option>
                    </select>
                  </div>

                  <div class="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="prop_desc_hassub" 
                      v-model="selectedWidget.props.hasSub" 
                      @change="pushHistory(widgetTree)"
                      class="rounded border-slate-350 dark:border-zinc-800 text-violet-600"
                    />
                    <label for="prop_desc_hassub" class="text-xs font-semibold text-slate-650 select-none">Tampilkan list sub-indikator amatan</label>
                  </div>

                  <div class="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="prop_desc_shownarasi" 
                      v-model="selectedWidget.props.showNarasi" 
                      @change="pushHistory(widgetTree)"
                      class="rounded border-slate-350 dark:border-zinc-800 text-violet-600"
                    />
                    <label for="prop_desc_shownarasi" class="text-xs font-semibold text-slate-655 select-none font-serif">Sertakan narasi capaian di bawahnya</label>
                  </div>
                </div>

                <!-- Column Editor -->
                <div class="space-y-2" v-if="selectedWidget.props.hasSub">
                  <span class="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Format Kolom Indikator</span>
                  <ColumnEditor v-model="selectedWidget.props.cols" @update:modelValue="pushHistory(widgetTree)" />
                </div>

                <!-- Elements Selection -->
                <div class="space-y-2">
                  <span class="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Elemen Capaian (Data Bindings)</span>
                  <TreeItemPicker 
                    v-model="selectedWidget.props.items" 
                    :master-data="mappedCurriculumElements" 
                    ref-type="element" 
                    @update:modelValue="pushHistory(widgetTree)"
                  />
                </div>
              </div>

              <!-- 7. signature_block properties -->
              <div v-else-if="selectedWidget.type === 'signature_block'" class="space-y-4">
                <div class="flex flex-col gap-1">
                  <label class="text-[9px] font-bold text-slate-450 uppercase">Tempat Tanda Tangan</label>
                  <input 
                    type="text" 
                    v-model="selectedWidget.props.place" 
                    @change="pushHistory(widgetTree)"
                    class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1 text-xs outline-none focus:border-violet-650"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[9px] font-bold text-slate-450 uppercase">Tanggal Tanda Tangan</label>
                  <input 
                    type="text" 
                    v-model="selectedWidget.props.date" 
                    @change="pushHistory(widgetTree)"
                    class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1 text-xs outline-none focus:border-violet-650"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[9px] font-bold text-slate-450 uppercase">Nama Kepala Sekolah</label>
                  <input 
                    type="text" 
                    v-model="selectedWidget.props.kepsek" 
                    @change="pushHistory(widgetTree)"
                    class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1 text-xs outline-none focus:border-violet-650"
                  />
                </div>
              </div>

              <!-- 8. extracurricular / narrative / p5_assessment properties -->
              <div v-else-if="selectedWidget.type === 'extracurricular'" class="space-y-3">
                <span class="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Format Kolom Ekstrakurikuler</span>
                <ColumnEditor v-model="selectedWidget.props.cols" @update:modelValue="pushHistory(widgetTree)" />
              </div>
              <div v-else-if="selectedWidget.type === 'p5_assessment'" class="space-y-3">
                <span class="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Format Kolom P5</span>
                <ColumnEditor v-model="selectedWidget.props.cols" @update:modelValue="pushHistory(widgetTree)" />
              </div>
              <div v-else-if="selectedWidget.type === 'subject_narrative'" class="space-y-3">
                <span class="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Pelajaran Terhubung</span>
                <TreeItemPicker 
                  v-model="selectedWidget.props.items" 
                  :master-data="mappedSubjects" 
                  ref-type="subject" 
                  @update:modelValue="pushHistory(widgetTree)"
                />
              </div>

              <!-- fallback / no props editor -->
              <div v-else class="text-slate-400 text-xs italic bg-slate-50 dark:bg-zinc-950/20 p-4 border border-slate-200 dark:border-zinc-800 rounded-xl text-center">
                Widget ini tidak membutuhkan parameter kustom.
              </div>

              <!-- Common Delete Button -->
              <button 
                type="button"
                @click="deleteWidget(selectedWidget.id)"
                class="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold py-2 rounded-lg transition-colors border border-rose-500/15"
              >
                Hapus Widget Dari Canvas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main master-detail view -->
    <div v-else class="space-y-8 animate-in fade-in duration-500">
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
          <option v-for="school in filteredSchools" :key="school.id" :value="school.id">{{ school.name }}</option>
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
            
            <div class="flex gap-2 shrink-0">
              <BaseButton variant="outline" @click="openVisualBuilder" class="py-2 px-3 text-xs font-bold border-slate-250 hover:bg-slate-50 dark:hover:bg-zinc-850">
                <Sliders class="mr-1" :size="13" /> Desainer Visual v1.2
              </BaseButton>
              <BaseButton variant="primary" @click="showCreateElementModal = true" class="py-2 px-3 text-xs font-bold shadow-lg shadow-violet-600/10">
                <Plus class="mr-1" :size="13" /> Tambah Elemen
              </BaseButton>
            </div>
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
          <div v-if="activeTab === 'elements'" class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
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
              <div class="bg-white dark:bg-zinc-900 p-8 shadow-md border border-slate-200 dark:border-zinc-800 rounded-md max-w-2xl mx-auto space-y-6 text-black dark:text-zinc-200 print:text-black">
                <!-- Kop mock -->
                <div class="text-center border-b-2 border-slate-900 dark:border-zinc-700 pb-4 mb-4">
                  <h2 class="text-sm font-black uppercase">TAMAN KANAK-KANAK AL FATAH</h2>
                  <p class="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">LAPORAN PERKEMBANGAN PESERTA DIDIK (TK B)</p>
                </div>

                <!-- Dinas Format Preview -->
                <div v-if="currentTemplate.element_structure?.is_dinas" class="space-y-6 text-left">
                  <div v-for="sec in previewDinasSections" :key="sec.id" class="space-y-4">
                    <h3 class="text-xs font-black uppercase border-b border-slate-900 dark:border-zinc-700 pb-1">{{ sec.title }}</h3>
                    
                    <div v-for="cat in sec.categories" :key="cat.id" class="space-y-3">
                      <div class="text-[11px] font-bold text-slate-800 dark:text-zinc-350 uppercase">{{ cat.title }}</div>
                      
                      <!-- If P5 Matrix -->
                      <div v-if="cat.is_p5_matrix" class="space-y-2">
                        <table class="w-full text-left border-2 border-slate-950 dark:border-zinc-700 text-[9px] border-collapse">
                          <thead>
                            <tr class="bg-slate-100 dark:bg-zinc-900/60 border-b border-slate-950 dark:border-zinc-700">
                              <th class="p-1 border-r border-slate-950 dark:border-zinc-700 font-bold" style="width: 30%;">Projek</th>
                              <th v-for="dim in activeP5Dimensions" :key="dim.id" class="p-1 border-r border-slate-950 dark:border-zinc-700 text-center font-bold text-[8px]">{{ dim.name }}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr class="border-b-0">
                              <td class="p-1.5 border-r border-slate-950 dark:border-zinc-700 font-semibold bg-slate-50 dark:bg-zinc-950/40">{{ cat.title }}</td>
                              <td v-for="dim in activeP5Dimensions" :key="dim.id" class="p-1.5 border-r border-slate-950 dark:border-zinc-700 text-center font-bold">
                                {{ cat.p5_dimensions[dim.id] ? 'BSH' : '-' }}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <!-- If standard indicators -->
                      <table v-else class="w-full text-left border border-slate-900 dark:border-zinc-700 text-[10px] border-collapse">
                        <thead>
                          <tr class="bg-slate-50 dark:bg-zinc-950/40 border-b border-slate-900 dark:border-zinc-700 font-bold">
                            <th class="p-1.5 border-r border-slate-900 dark:border-zinc-700 w-8 text-center">No.</th>
                            <th class="p-1.5 border-r border-slate-900 dark:border-zinc-700">Elemen / Indikator</th>
                            <th class="p-1.5 text-center w-16">Capaian</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(sub, subIdx) in cat.subAssessments" :key="subIdx" class="border-b border-slate-900 dark:border-zinc-700">
                            <td class="p-1 text-center border-r border-slate-900 dark:border-zinc-700">{{ subIdx + 1 }}.</td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 pl-3">{{ sub.name }}</td>
                            <td class="p-1 text-center font-bold">{{ sub.grade }}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div class="text-[10px] text-justify leading-relaxed bg-slate-50/50 dark:bg-zinc-950/20 p-2 border border-slate-200 dark:border-zinc-800 rounded">
                        <strong>Narasi |</strong> {{ cat.narrative }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- School (Intra) Format Preview -->
                <div v-else class="space-y-6 text-left">
                  <!-- Tema & Penilaian Legend Header -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-slate-50 dark:bg-zinc-950/40 p-3 rounded-lg border border-slate-200 dark:border-zinc-800 text-[10px]">
                      <h4 class="font-extrabold text-slate-900 dark:text-zinc-100 mb-1 uppercase">Tema – Semester I:</h4>
                      <ul class="list-decimal pl-4 space-y-0.5 text-slate-600 dark:text-zinc-400">
                        <li>Aku Milik Allah</li>
                        <li>Pejuang Islam Negeriku</li>
                        <li>Eksplorasi Islam #1</li>
                        <li>Flora Fauna Ciptaan Allah</li>
                      </ul>
                    </div>

                    <div class="bg-slate-50 dark:bg-zinc-950/40 p-3 rounded-lg border border-slate-200 dark:border-zinc-800 text-[10px]">
                      <h4 class="font-extrabold text-slate-900 dark:text-zinc-100 mb-1 uppercase">Kategori Penilaian:</h4>
                      <div class="grid grid-cols-2 gap-1.5">
                        <div><span class="font-black text-violet-650 dark:text-violet-400">BS</span> : Baik Sekali</div>
                        <div><span class="font-black text-violet-650 dark:text-violet-400">B</span> : Baik</div>
                        <div><span class="font-black text-violet-650 dark:text-violet-400">C</span> : Cukup</div>
                        <div><span class="font-black text-violet-650 dark:text-violet-400">K</span> : Kurang</div>
                      </div>
                    </div>
                  </div>

                  <!-- Aspek Amatan Table -->
                  <div>
                    <h3 class="text-[11px] font-black uppercase border-b border-slate-900 dark:border-zinc-700 pb-1 mb-3">I. Kategori Perkembangan Kemampuan &amp; Penilaian</h3>
                    <table class="w-full text-left border border-slate-900 dark:border-zinc-700 text-[10px] border-collapse">
                      <thead>
                        <tr class="bg-slate-50 dark:bg-zinc-950/40 border-b border-slate-900 dark:border-zinc-700 font-bold">
                          <th class="p-1.5 border-r border-slate-900 dark:border-zinc-700 w-10 text-center">No</th>
                          <th class="p-1.5 border-r border-slate-900 dark:border-zinc-700">ASPEK AMATAN</th>
                          <th class="p-1.5 border-r border-slate-900 dark:border-zinc-700 text-center w-8">K</th>
                          <th class="p-1.5 border-r border-slate-900 dark:border-zinc-700 text-center w-8">C</th>
                          <th class="p-1.5 border-r border-slate-900 dark:border-zinc-700 text-center w-8">B</th>
                          <th class="p-1.5 text-center w-8">BS</th>
                        </tr>
                      </thead>
                      <tbody>
                        <!-- Group I -->
                        <template v-if="previewIntraGroup1.length > 0">
                          <tr class="bg-slate-100 dark:bg-zinc-900/60 font-bold border-b border-slate-900 dark:border-zinc-700">
                            <td colspan="6" class="p-1.5">I. Perkembangan Potensi Pribadi</td>
                          </tr>
                          <tr v-for="(el, index) in previewIntraGroup1" :key="el.id" class="border-b border-slate-900 dark:border-zinc-700">
                            <td class="p-1 text-center border-r border-slate-900 dark:border-zinc-700">{{ index + 1 }}</td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 pl-2.5">{{ el.name }}</td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 text-center"></td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 text-center"></td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 text-center font-bold bg-violet-50 dark:bg-violet-950/20 text-violet-650 dark:text-violet-400">✓</td>
                            <td class="p-1 text-center"></td>
                          </tr>
                        </template>

                        <!-- Group II -->
                        <template v-if="previewIntraGroup2.length > 0">
                          <tr class="bg-slate-100 dark:bg-zinc-900/60 font-bold border-b border-slate-900 dark:border-zinc-700">
                            <td colspan="6" class="p-1.5">II. Sikap Belajar</td>
                          </tr>
                          <tr v-for="(el, index) in previewIntraGroup2" :key="el.id" class="border-b border-slate-900 dark:border-zinc-700">
                            <td class="p-1 text-center border-r border-slate-900 dark:border-zinc-700">{{ index + 1 }}</td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 pl-2.5">{{ el.name }}</td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 text-center"></td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 text-center"></td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 text-center font-bold bg-violet-50 dark:bg-violet-950/20 text-violet-655 dark:text-violet-400">✓</td>
                            <td class="p-1 text-center"></td>
                          </tr>
                        </template>

                        <!-- Group III -->
                        <template v-if="previewIntraGroup3.length > 0">
                          <tr class="bg-slate-100 dark:bg-zinc-900/60 font-bold border-b border-slate-900 dark:border-zinc-700">
                            <td colspan="6" class="p-1.5">III. Perkembangan Potensi Kemampuan Dasar</td>
                          </tr>
                          <tr v-for="(el, index) in previewIntraGroup3" :key="el.id" class="border-b border-slate-900 dark:border-zinc-700">
                            <td class="p-1 text-center border-r border-slate-900 dark:border-zinc-700">{{ index + 1 }}</td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 pl-2.5">{{ el.name }}</td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 text-center"></td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 text-center"></td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 text-center font-bold bg-violet-50 dark:bg-violet-950/20 text-violet-650 dark:text-violet-400">✓</td>
                            <td class="p-1 text-center"></td>
                          </tr>
                        </template>

                        <!-- Other elements if any -->
                        <template v-if="previewIntraOtherLetterElements.length > 0">
                          <tr class="bg-slate-100 dark:bg-zinc-900/60 font-bold border-b border-slate-900 dark:border-zinc-700">
                            <td colspan="6" class="p-1.5">Elemen Penilaian Lainnya</td>
                          </tr>
                          <tr v-for="(el, index) in previewIntraOtherLetterElements" :key="el.id" class="border-b border-slate-900 dark:border-zinc-700">
                            <td class="p-1 text-center border-r border-slate-900 dark:border-zinc-700">{{ index + 1 }}</td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 pl-2.5">{{ el.name }}</td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 text-center"></td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 text-center"></td>
                            <td class="p-1 border-r border-slate-900 dark:border-zinc-700 text-center font-bold bg-violet-50 dark:bg-violet-950/20 text-violet-650 dark:text-violet-400">✓</td>
                            <td class="p-1 text-center"></td>
                          </tr>
                        </template>

                        <!-- Empty state -->
                        <tr v-if="previewIntraGroup1.length === 0 && previewIntraGroup2.length === 0 && previewIntraGroup3.length === 0 && previewIntraOtherLetterElements.length === 0">
                          <td colspan="6" class="p-8 text-center text-slate-400 dark:text-zinc-550">
                            Belum ada elemen aspek amatan bertipe Huruf/Predikat.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Narratives -->
                  <div class="space-y-4">
                    <div v-for="el in previewIntraNarratives" :key="el.id" class="space-y-1.5 text-justify text-[10px]">
                      <h4 class="font-bold border-b border-slate-200 dark:border-zinc-800 pb-0.5 text-slate-800 dark:text-zinc-200 uppercase">{{ el.name }}</h4>
                      <p class="leading-relaxed text-slate-655 dark:text-zinc-400">
                        [Pratinjau Narasi] Ananda menunjukkan perkembangan yang sangat baik dalam aspek ini. Aktif berpartisipasi dalam setiap kegiatan kelas, mampu bersosialisasi dengan sangat baik, serta menunjukkan kreativitas yang tinggi dalam menyelesaikan tugas.
                      </p>
                    </div>
                    <div v-if="previewIntraNarratives.length === 0" class="text-center text-slate-400 dark:text-zinc-550 text-[10px] py-4 border border-dashed rounded-lg border-slate-200 dark:border-zinc-800">
                      Belum ada elemen aspek amatan bertipe Narasi.
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
  </div>
</template>

<style scoped>
.bg-dot-pattern {
  background: radial-gradient(circle at 1px 1px, #d7e0de 1px, transparent 0) 0 0/22px 22px, #eef2f1;
}
.dark .bg-dot-pattern {
  background: radial-gradient(circle at 1px 1px, #27272a 1px, transparent 0) 0 0/22px 22px, #09090b;
}
</style>
