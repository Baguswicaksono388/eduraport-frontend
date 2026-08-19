<script setup lang="ts">
import { useSchoolContext } from '../../composables/useSchoolContext'
import { ClipboardCheck, Download, Upload, Info, AlertCircle, CheckCircle, Save, History, Check, Loader2, Edit2, Trash2, Sparkles, NotebookPen, Calendar, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput, BaseDateInput } from '@eduraport/ui'
import { useClass } from '../../composables/useClass'
import { useSubject } from '../../composables/useSubject'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useGradebook } from '../../composables/useGradebook'
import { useToast } from '../../composables/useToast'
import { useReport } from '../../composables/useReport'
import { useReportTemplate } from '../../composables/useReportTemplate'
import { useApi } from '../../composables/useApi'
import { useAuth } from '../../composables/useAuth'
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
const { user, fetchUser } = useAuth()

const selectedClassId = ref('')
const selectedSubjectId = ref('')
const selectedAcademicYearId = ref('')
const selectedSemester = ref('odd') // odd or even

// TK Grade Input States
const filteredSchools = computed(() => {
  if (user.value && user.value.role !== 'super_admin' && user.value.school_id) {
    return schools.value.filter(s => s.id === user.value.school_id)
  }
  return schools.value
})

const filteredClasses = computed(() => {
  if (!selectedAcademicYearId.value) return []
  return classes.value.filter((c: any) => c.academic_year_id === selectedAcademicYearId.value)
})

// Mendeteksi semua satuan PAUD Indonesia: TK, RA, KB, TPA, SPS (Kurikulum Merdeka)
const isTKSchool = computed(() => {
  const school = filteredSchools.value.find((s: any) => s.id === selectedSchoolId.value)
  return isEarlyChildhood(school?.level)
})

const needsSync = computed(() => {
  if (!isTKSchool.value || !selectedTemplateId.value || !tkReportsList.value.length) return false
  const template = reportTemplates.value.find(t => t.id === selectedTemplateId.value)
  if (!template || !template.updated_at) return false
  
  const templateDate = new Date(template.updated_at).getTime()
  // Check if any report is older than the template
  return tkReportsList.value.some(r => {
    if (!r.report_id) return false
    const reportDate = new Date(r.updated_at || r.created_at).getTime()
    return templateDate > reportDate
  })
})

const isTemplateModified = computed(() => {
  if (!activeTKReport.value || (!activeTKReport.value.updated_at && !activeTKReport.value.created_at)) return false
  const activeTemplate = reportTemplates.value.find((t: any) => t.id === selectedTemplateId.value)
  if (!activeTemplate || !activeTemplate.updated_at) return false

  const reportTime = new Date(activeTKReport.value.updated_at || activeTKReport.value.created_at).getTime()
  const templateTime = new Date(activeTemplate.updated_at).getTime()
  
  return templateTime > reportTime
})

const { reportTemplates, fetchReportTemplates } = useReportTemplate()
const selectedTemplateId = ref('')
const tkReportsList = ref<any[]>([])
const loadingTK = ref(false)
const activeTKReport = ref<any>(null)
const tkAssessmentsForm = ref<any[]>([])
const loadingTKAssessments = ref(false)
const savingTKAssessments = ref(false)
const generatingTK = ref(false)

const scheme = ref<any>(null)
const groups = ref<any[]>([])
const components = ref<any[]>([])
const kkm = ref<number | null>(null)
const matrix = ref<any[]>([])
const loading = ref(false)

// Inline edit state
const savingState = ref<Record<string, 'saving' | 'saved' | 'error'>>({})

// Audit logs state
const showLogsModal = ref(false)
const selectedScoreLogs = ref<any[]>([])
const activeStudentName = ref('')
const activeComponentName = ref('')

// Bulk copy-paste input state
const showBulkModal = ref(false)
const activeBulkComponentId = ref('')
const bulkInputText = ref('')

// Anecdotal Notes State
const activeTKTab = ref<'rapor' | 'anecdotal'>('rapor')
const anecdotalNotes = ref<any[]>([])
const loadingAnecdotal = ref(false)
const savingAnecdotal = ref(false)
const anecdotalForm = ref({
  date: new Date().toISOString().split('T')[0],
  activity_name: '',
  observation_notes: ''
})
const editingAnecdotalId = ref<string | null>(null)
const anecdotalPagination = ref({ page: 1, total_pages: 1, total: 0, limit: 10 })
const showDeleteModal = ref(false)
const deletingAnecdotalId = ref<string | null>(null)

onMounted(async () => {
  await fetchUser()
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

  // Fetch TK templates if it is a TK school
  const isTK = isEarlyChildhood(filteredSchools.value.find((s: any) => s.id === schoolId)?.level)
  if (isTK) {
    await fetchReportTemplates(schoolId, 'TK')
    if (reportTemplates.value.length > 0 && !selectedTemplateId.value) {
      selectedTemplateId.value = reportTemplates.value[0].id
    }
  } else {
    selectedTemplateId.value = ''
  }

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

watch(selectedAcademicYearId, async (newYearId, oldYearId) => {
  if (newYearId !== oldYearId && newYearId && selectedSchoolId.value) {
    await fetchClasses(selectedSchoolId.value, newYearId)
    if (selectedClassId.value) {
      const classExists = classes.value.find((c: any) => c.id === selectedClassId.value)
      if (!classExists) {
        selectedClassId.value = ''
      }
    }
  }
})

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
    selectedTemplateId.value = ''
  }
})

watch([selectedClassId, selectedSubjectId, selectedAcademicYearId, selectedSemester, isTKSchool, selectedTemplateId], async () => {
  if (isTKSchool.value) {
    await loadTKReports()
  } else {
    await loadMatrix()
  }
})

const loadMatrix = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value || !selectedSubjectId.value || !selectedAcademicYearId.value || !selectedSemester.value) {
    scheme.value = null
    groups.value = []
    components.value = []
    kkm.value = null
    matrix.value = []
    return
  }

  loading.value = true
  try {
    // 1. Fetch scheme info
    const schemeRes: any = await gradebook.fetchSchemeByClassAndSubject(
      selectedSchoolId.value,
      selectedClassId.value,
      selectedSubjectId.value,
      selectedAcademicYearId.value,
      selectedSemester.value
    )

    if (schemeRes.success && schemeRes.data) {
      scheme.value = schemeRes.data
      
      // 2. Fetch full scores matrix
      const matrixRes: any = await gradebook.fetchSchemeScores(selectedSchoolId.value, schemeRes.data.id)
      if (matrixRes.success && matrixRes.data) {
        groups.value = matrixRes.data.groups

        // Group and sort components to pair parent with its remedial children
        const rawComponents = matrixRes.data.components
        const sortedComponents: any[] = []
        
        const baseComps = rawComponents.filter((c: any) => !c.parent_component_id).sort((a: any, b: any) => a.sort_order - b.sort_order)
        const remedialComps = rawComponents.filter((c: any) => c.parent_component_id)
        
        for (const base of baseComps) {
          sortedComponents.push(base)
          // Find children of this base, sort them by sort_order
          const children = remedialComps.filter((c: any) => c.parent_component_id === base.id).sort((a: any, b: any) => a.sort_order - b.sort_order)
          sortedComponents.push(...children)
        }
        
        // Append any orphaned components just in case
        const orphaned = remedialComps.filter((c: any) => !baseComps.find((b: any) => b.id === c.parent_component_id))
        sortedComponents.push(...orphaned)
        
        components.value = sortedComponents
        kkm.value = matrixRes.data.kkm
        
        // Map scores inside the cells
        matrix.value = matrixRes.data.matrix.map((row: any) => {
          // Initialize scores as local reactive objects
          const scoresMap: Record<string, any> = {}
          for (const comp of sortedComponents) {
            const scoreItem = row.scores[comp.id]
            scoresMap[comp.id] = {
              id: scoreItem?.id || '',
              score: scoreItem?.score ? Number(scoreItem.score) : null,
              grade_letter: scoreItem?.grade_letter || null,
              status: scoreItem?.status || 'draft',
              is_remedial: scoreItem?.is_remedial || false,
              original_score_id: scoreItem?.original_score_id || null,
              teacher_notes: scoreItem?.teacher_notes || ''
            }
          }
          return {
            ...row,
            scores: scoresMap
          }
        })
      }
    } else {
      scheme.value = null
      groups.value = []
      components.value = []
      kkm.value = null
      matrix.value = []
    }
  } catch (error) {
    console.error('Failed to load matrix:', error)
    scheme.value = null
  } finally {
    loading.value = false
  }
}

// Recalculator Engine Client-Side (Real-Time UI Update)
const TK_GRADES_ORDER = ['BB', 'MB', 'BSH', 'BSB']

const runClientRecalculate = (studentId: string) => {
  const row = matrix.value.find(r => r.student.id === studentId)
  if (!row) return

  const groupGrades = groups.value.map(g => {
    const groupComps = components.value.filter(c => c.group_id === g.id)
    const compScores = groupComps.map(c => {
      const scoreObj = row.scores[c.id]
      return {
        component_id: c.id,
        score: scoreObj?.score !== null && scoreObj?.score !== undefined && scoreObj?.score !== '' ? Number(scoreObj.score) : null,
        grade_letter: scoreObj?.grade_letter || null
      }
    })

    const numericScores = compScores.filter(s => s.score !== null).map(s => s.score as number)
    const letterScores = compScores.filter(s => s.grade_letter !== null).map(s => s.grade_letter as string)

    let score: number | null = null
    let gradeLetter: string | null = null

    if (numericScores.length > 0) {
      if (g.aggregation_method === 'highest') {
        score = Math.max(...numericScores)
      } else if (g.aggregation_method === 'latest') {
        const latestComp = groupComps.reduce((prev, curr) => curr.sort_order >= prev.sort_order ? curr : prev)
        const latestCell = compScores.find(s => s.component_id === latestComp.id)
        score = latestCell?.score || 0
      } else if (g.aggregation_method === 'drop_lowest') {
        if (numericScores.length <= 1) {
          score = numericScores[0]
        } else {
          const sorted = [...numericScores].sort((a, b) => a - b)
          sorted.shift() // Drop lowest
          score = sorted.reduce((a, b) => a + b, 0) / sorted.length
        }
      } else if (g.aggregation_method === 'weighted_avg') {
        let sumProd = 0
        let sumWeight = 0
        for (const s of compScores) {
          if (s.score === null) continue
          const compInfo = groupComps.find(c => c.id === s.component_id)
          const w = compInfo ? Number(compInfo.weight_in_group) : 100
          sumProd += s.score * w
          sumWeight += w
        }
        score = sumWeight > 0 ? sumProd / sumWeight : 0
      } else {
        // simple_avg
        score = numericScores.reduce((a, b) => a + b, 0) / numericScores.length
      }
      score = Number(score.toFixed(2))
    } else if (letterScores.length > 0) {
      // Modus untuk TK
      const counts: Record<string, number> = {}
      let maxCount = 0
      let modeLetter = letterScores[0]
      for (const l of letterScores) {
        counts[l] = (counts[l] ?? 0) + 1
        if (counts[l] > maxCount) {
          maxCount = counts[l]
          modeLetter = l
        } else if (counts[l] === maxCount) {
          const currentIdx = TK_GRADES_ORDER.indexOf(l)
          const modeIdx = TK_GRADES_ORDER.indexOf(modeLetter)
          if (currentIdx > modeIdx) modeLetter = l
        }
      }
      gradeLetter = modeLetter
    }

    return {
      groupId: g.id,
      score,
      gradeLetter
    }
  })

  // Final calculation
  const numericGroupScores = groupGrades.filter(g => g.score !== null)
  const letterGroupScores = groupGrades.filter(g => g.gradeLetter !== null)

  let finalScore: number | null = null
  let finalLetter: string | null = null

  if (numericGroupScores.length > 0) {
    let totalScore = 0
    let totalWeight = 0
    for (const g of numericGroupScores) {
      const groupInfo = groups.value.find(gr => gr.id === g.groupId)
      const w = groupInfo ? Number(groupInfo.weight_percent) : 0
      totalScore += (g.score as number) * w
      totalWeight += w
    }
    finalScore = totalWeight > 0 ? Number((totalScore / totalWeight).toFixed(2)) : 0
  } else if (letterGroupScores.length > 0) {
    const letters = letterGroupScores.map(g => g.gradeLetter as string)
    const counts: Record<string, number> = {}
    let maxCount = 0
    let modeLetter = letters[0]
    for (const l of letters) {
      counts[l] = (counts[l] ?? 0) + 1
      if (counts[l] > maxCount) {
        maxCount = counts[l]
        modeLetter = l
      } else if (counts[l] === maxCount) {
        const currentIdx = TK_GRADES_ORDER.indexOf(l)
        const modeIdx = TK_GRADES_ORDER.indexOf(modeLetter)
        if (currentIdx > modeIdx) modeLetter = l
      }
    }
    finalLetter = modeLetter
  }

  // Predicates
  const kkmVal = kkm.value ?? 70
  let predicate = ''
  let desc = ''

  if (finalLetter) {
    predicate = finalLetter
    const labels: Record<string, string> = {
      BB: 'Belum Berkembang',
      MB: 'Mulai Berkembang',
      BSH: 'Berkembang Sesuai Harapan',
      BSB: 'Berkembang Sangat Baik'
    }
    desc = labels[finalLetter] || finalLetter
  } else if (finalScore !== null) {
    const range = (100 - kkmVal) / 3
    const aMin = 100 - range
    const bMin = 100 - range * 2
    const cMin = kkmVal

    if (finalScore >= aMin) {
      predicate = 'A'
      desc = 'Sangat Baik'
    } else if (finalScore >= bMin) {
      predicate = 'B'
      desc = 'Baik'
    } else if (finalScore >= cMin) {
      predicate = 'C'
      desc = 'Cukup'
    } else {
      predicate = 'D'
      desc = 'Perlu Bimbingan'
    }
  }

  row.calculated.final_score = finalScore
  row.calculated.grade_letter = finalLetter
  row.calculated.predicate = predicate
  row.calculated.description = desc
}

// Handle Auto-Save on Blur
const handleCellSave = async (studentId: string, compId: string) => {
  const row = matrix.value.find(r => r.student.id === studentId)
  if (!row) return

  const cell = row.scores[compId]
  const stateKey = `${studentId}-${compId}`
  
  // Clean inputs
  let scoreVal: any = cell.score
  if (scoreVal === '' || scoreVal === undefined) scoreVal = null
  
  let letterVal = cell.grade_letter
  if (letterVal === '') letterVal = null

  // Recalculate locally first
  runClientRecalculate(studentId)

  savingState.value[stateKey] = 'saving'

  try {
    const res: any = await gradebook.upsertScore(selectedSchoolId.value, compId, studentId, {
      score: scoreVal !== null ? String(scoreVal) : null,
      grade_letter: letterVal,
      teacher_notes: cell.teacher_notes || '',
      is_remedial: cell.is_remedial,
      original_score_id: cell.original_score_id
    })

    if (res.success) {
      savingState.value[stateKey] = 'saved'
      cell.id = res.data.id // Update ID if it was a new record
      setTimeout(() => {
        delete savingState.value[stateKey]
      }, 2000)
    }
  } catch (error: any) {
    savingState.value[stateKey] = 'error'
    toast.error(error.message || 'Gagal menyimpan nilai', 'Gagal')
  }
}

// Finalize single component
const handleFinalizeComponent = async (compId: string) => {
  const compName = components.value.find(c => c.id === compId)?.name || 'Komponen'
  if (!confirm(`Apakah Anda yakin ingin memfinalisasi komponen "${compName}"? Setelah difinalisasi, nilai pada kolom ini tidak dapat diubah.`)) return

  try {
    const res: any = await gradebook.finalizeScores(selectedSchoolId.value, compId)
    if (res.success) {
      toast.success(`Komponen ${compName} berhasil difinalisasi.`, 'Berhasil')
      // Update local states
      matrix.value.forEach(row => {
        if (row.scores[compId]) {
          row.scores[compId].status = 'final'
        }
      })
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal memfinalisasi komponen', 'Gagal')
  }
}

// Finalize Scheme (Calculates final grades and writes to final_grades table)
const handleFinalizeScheme = async () => {
  if (!confirm('Apakah Anda yakin ingin memfinalisasi NILAI AKHIR mata pelajaran ini untuk seluruh kelas? Tindakan ini akan mengunci dan menyimpan nilai akhir untuk cetak raport.')) return

  try {
    const res: any = await gradebook.saveFinalGrades(selectedSchoolId.value, scheme.value.id)
    if (res.success) {
      toast.success('Seluruh nilai akhir berhasil dihitung, disimpan, dan dikunci.', 'Berhasil Finalisasi')
      await loadMatrix() // Reload complete state
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal menyimpan nilai akhir', 'Gagal')
  }
}

// Score logs modal
const openLogsModal = async (studentId: string, compId: string) => {
  const row = matrix.value.find(r => r.student.id === studentId)
  if (!row) return

  const cell = row.scores[compId]
  if (!cell.id) {
    toast.error('Belum ada riwayat perubahan (nilai baru).', 'Audit Log')
    return
  }

  activeStudentName.value = row.student.full_name
  activeComponentName.value = components.value.find(c => c.id === compId)?.name || 'Komponen'

  try {
    const res: any = await gradebook.fetchScoreLogs(selectedSchoolId.value, cell.id)
    if (res.success) {
      selectedScoreLogs.value = res.data
      showLogsModal.value = true
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal memuat log audit', 'Gagal')
  }
}

// Bulk Input (Excel simulation/copy-paste)
const openBulkModal = (compId: string) => {
  activeBulkComponentId.value = compId
  bulkInputText.value = ''
  showBulkModal.value = true
}

const handleBulkInputSubmit = async () => {
  if (!bulkInputText.value.trim()) return

  // Parse lines: Budi Santoso \t 85 or just a list of scores in order of students
  const lines = bulkInputText.value.split('\n').map(l => l.trim()).filter(Boolean)
  const scoresPayload = []

  // Simple parser: matches by student order in the matrix
  for (let i = 0; i < matrix.value.length; i++) {
    if (i >= lines.length) break
    const line = lines[i]
    
    // Check if line contains a tab or space separator (name \t score)
    const parts = line.split('\t')
    const scoreStr = parts.length > 1 ? parts[1].trim() : parts[0].trim()

    const studentId = matrix.value[i].student.id
    
    // Check if numeric or letter
    if (TK_GRADES_ORDER.includes(scoreStr)) {
      scoresPayload.push({ student_id: studentId, grade_letter: scoreStr })
    } else {
      scoresPayload.push({ student_id: studentId, score: scoreStr })
    }
  }

  try {
    const res: any = await gradebook.bulkUpsertScores(selectedSchoolId.value, activeBulkComponentId.value, {
      scores: scoresPayload,
      reason: 'Bulk import/copy-paste'
    })

    if (res.success) {
      toast.success(`${scoresPayload.length} nilai berhasil dimasukkan secara massal.`, 'Berhasil Bulk')
      showBulkModal.value = false
      await loadMatrix()
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal menyimpan bulk nilai', 'Gagal')
  }
}

// TK Grade Input Functions
const loadTKReports = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value || !selectedAcademicYearId.value) {
    tkReportsList.value = []
    activeTKReport.value = null
    tkAssessmentsForm.value = []
    return
  }
  loadingTK.value = true
  try {
    const { fetchReports } = useReport()
    const res = await fetchReports(
      selectedSchoolId.value,
      selectedClassId.value,
      selectedAcademicYearId.value,
      selectedSemester.value
    )
    if (res.success) {
      tkReportsList.value = res.data
      
      // Auto-select first student if available and not already selected
      if (tkReportsList.value.length > 0) {
        const stillExists = activeTKReport.value ? tkReportsList.value.find(r => r.report_id === activeTKReport.value.report_id) : null;
        if (stillExists) {
          await selectTKStudent(stillExists)
        } else {
          const firstWithReport = tkReportsList.value.find(r => r.report_id)
          if (firstWithReport) {
            await selectTKStudent(firstWithReport)
          } else {
            activeTKReport.value = null
            tkAssessmentsForm.value = []
          }
        }
      } else {
        activeTKReport.value = null
        tkAssessmentsForm.value = []
      }
    }
  } catch (e: any) {
    toast.error(e?.message || 'Gagal memuat daftar rapor TK.', 'Gagal')
    tkReportsList.value = []
    activeTKReport.value = null
    tkAssessmentsForm.value = []
  } finally {
    loadingTK.value = false
  }
}

const fetchAnecdotalNotes = async (page = 1) => {
  if (!activeTKReport.value) return
  loadingAnecdotal.value = true
  try {
    const { fetcher } = useApi()
    const studentId = activeTKReport.value.student_id
    const res = await fetcher(`/school/${selectedSchoolId.value}/anecdotal-note?student_id=${studentId}&academic_year_id=${selectedAcademicYearId.value}&semester=${selectedSemester.value}&limit=${anecdotalPagination.value.limit}&offset=${(page - 1) * anecdotalPagination.value.limit}`) as any
    if (res.success && res.data) {
      anecdotalNotes.value = res.data.data || []
      anecdotalPagination.value = res.data.meta || { total: 0, limit: 10, offset: 0, page: 1, total_pages: 0 }
    }
  } catch (e: any) {
    console.error('Fetch anecdotal error:', e);
    toast.error(e?.response?._data?.error?.message || e.message || 'Gagal memuat catatan anekdot', 'Error')
  } finally {
    loadingAnecdotal.value = false
  }
}

const selectTKStudent = async (report: any) => {
  if (!report.report_id) {
    toast.warning('Draft rapor belum di-generate untuk siswa ini.', 'Peringatan')
    return
  }
  activeTKReport.value = report
  
  if (activeTKTab.value === 'anecdotal') {
    await fetchAnecdotalNotes(1)
  } else {
    loadingTKAssessments.value = true
    tkAssessmentsForm.value = []
    try {
      const { fetchReportAssessments } = useReport()
      const res = await fetchReportAssessments(selectedSchoolId.value, report.report_id, selectedTemplateId.value)
      if (res.success) {
        tkAssessmentsForm.value = res.data
      }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal memuat form penilaian TK.', 'Gagal')
    } finally {
      loadingTKAssessments.value = false
    }
  }
}

watch(activeTKTab, async (newTab) => {
  if (activeTKReport.value) {
    if (newTab === 'anecdotal') {
      await fetchAnecdotalNotes(1)
    } else {
      await selectTKStudent(activeTKReport.value)
    }
  }
})

const handleSaveTKAssessments = async () => {
  if (!activeTKReport.value) return
  savingTKAssessments.value = true
  try {
    const { saveReportAssessments } = useReport()
    const payload = tkAssessmentsForm.value.map(item => ({
      element_id: item.element_id,
      letter_grade: item.letter_grade,
      narrative: item.narrative
    }))
    const res = await saveReportAssessments(selectedSchoolId.value, activeTKReport.value.report_id, payload)
    if (res.success) {
      toast.success('Penilaian TK berhasil disimpan.', 'Sukses')
      await loadTKReports()
    }
  } catch (e: any) {
    toast.error(e?.message || 'Gagal menyimpan penilaian TK.', 'Gagal')
  } finally {
    savingTKAssessments.value = false
  }
}

const handleSaveAnecdotalNote = async () => {
  if (!activeTKReport.value || !anecdotalForm.value.observation_notes.trim()) return
  savingAnecdotal.value = true
  try {
    const { fetcher } = useApi()
    const payload = {
      student_id: activeTKReport.value.student_id,
      academic_year_id: selectedAcademicYearId.value,
      semester: selectedSemester.value,
      date: anecdotalForm.value.date,
      activity_name: anecdotalForm.value.activity_name,
      observation_notes: anecdotalForm.value.observation_notes
    }
    
    const url = editingAnecdotalId.value 
      ? `/school/${selectedSchoolId.value}/anecdotal-note/${editingAnecdotalId.value}`
      : `/school/${selectedSchoolId.value}/anecdotal-note`
      
    const res = await fetcher(url, {
      method: editingAnecdotalId.value ? 'PUT' : 'POST',
      body: payload
    }) as any
    if (res.success) {
      toast.success(`Catatan Anekdot berhasil ${editingAnecdotalId.value ? 'diperbarui' : 'disimpan'}.`, 'Sukses')
      anecdotalForm.value.activity_name = ''
      anecdotalForm.value.observation_notes = ''
      editingAnecdotalId.value = null
      await fetchAnecdotalNotes(1)
    }
  } catch (e: any) {
    toast.error(e?.message || 'Gagal menyimpan catatan anekdot.', 'Gagal')
  } finally {
    savingAnecdotal.value = false
  }
}

const promptDeleteAnecdotalNote = (id: string) => {
  deletingAnecdotalId.value = id
  showDeleteModal.value = true
}

const confirmDeleteAnecdotalNote = async () => {
  if (!deletingAnecdotalId.value) return
  const id = deletingAnecdotalId.value
  try {
    const { fetcher } = useApi()
    const res = await fetcher(`/school/${selectedSchoolId.value}/anecdotal-note/${id}`, {
      method: 'DELETE'
    }) as any
    if (res.success) {
      toast.success('Catatan berhasil dihapus', 'Sukses')
      if (editingAnecdotalId.value === id) {
        editingAnecdotalId.value = null
        anecdotalForm.value.activity_name = ''
        anecdotalForm.value.observation_notes = ''
      }
      showDeleteModal.value = false
      await fetchAnecdotalNotes(anecdotalPagination.value.page)
    }
  } catch(e: any) {
    toast.error('Gagal menghapus catatan', 'Gagal')
  } finally {
    deletingAnecdotalId.value = null
  }
}

const editAnecdotalNote = (note: any) => {
  editingAnecdotalId.value = note.id
  anecdotalForm.value.date = new Date(note.date).toISOString().split('T')[0]
  anecdotalForm.value.activity_name = note.activity_name || ''
  anecdotalForm.value.observation_notes = note.observation_notes || ''
}
const cancelEditAnecdotal = () => {
  editingAnecdotalId.value = null
  anecdotalForm.value.date = new Date().toISOString().split('T')[0]
  anecdotalForm.value.activity_name = ''
  anecdotalForm.value.observation_notes = ''
}

const handleGenerateTK = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value || !selectedAcademicYearId.value) return
  generatingTK.value = true
  try {
    const { generateReports } = useReport()
    const payload = {
      class_id: selectedClassId.value,
      academic_year_id: selectedAcademicYearId.value,
      semester: selectedSemester.value
    }
    const res = await generateReports(selectedSchoolId.value, payload)
    if (res.success) {
      toast.success('Draft rapor kelas berhasil dibuat/diperbarui.', 'Sukses')
      await loadTKReports()
    }
  } catch (e: any) {
    toast.error(e?.message || 'Gagal generate rapor kelas.', 'Gagal')
  } finally {
    generatingTK.value = false
  }
}

const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-350 border-slate-200/60 dark:border-zinc-700',
    submitted: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    published: 'bg-violet-600/10 text-violet-600 dark:text-violet-400 border-violet-500/20'
  }
  return classes[status] || 'bg-slate-100 text-slate-600'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    approved: 'Approved',
    published: 'Published'
  }
  return labels[status] || status
}

// Description Engine Inline Editor
const expandedStudentDescId = ref<string | null>(null)
const editingDescriptionText = ref('')
const savingDescription = ref<Record<string, boolean>>({})

const toggleExpandDesc = (studentId: string, currentDesc: string) => {
  if (expandedStudentDescId.value === studentId) {
    expandedStudentDescId.value = null
  } else {
    expandedStudentDescId.value = studentId
    editingDescriptionText.value = currentDesc
  }
}

const handleSaveDescription = async (studentId: string, finalGradeId: string) => {
  if (!finalGradeId) {
    toast.error('Nilai akhir harus difinalisasi terlebih dahulu sebelum mengedit deskripsi.', 'Perhatian')
    return
  }

  savingDescription.value[studentId] = true
  try {
    const { fetcher: apiFetch } = useApi()
    const res: any = await apiFetch(`/school/${selectedSchoolId.value}/gradebook/final-grades/${finalGradeId}/description`, {
      method: 'PUT',
      body: { description: editingDescriptionText.value }
    })
    
    if (res.success) {
      toast.success('Deskripsi capaian kompetensi berhasil diperbarui.', 'Berhasil')
      const row = matrix.value.find(r => r.student.id === studentId)
      if (row) {
        row.calculated.description = editingDescriptionText.value
        row.calculated.is_description_edited = true
      }
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal menyimpan deskripsi.', 'Gagal')
  } finally {
    savingDescription.value[studentId] = false
  }
}

const handleRegenerateDescription = async (studentId: string, finalGradeId: string) => {
  if (!finalGradeId) {
    toast.error('Nilai akhir harus difinalisasi terlebih dahulu sebelum regenerasi deskripsi.', 'Perhatian')
    return
  }

  if (!confirm('Apakah Anda yakin ingin mengatur ulang deskripsi ini sesuai formula otomatis? Catatan edit manual Anda akan tertimpa.')) return

  savingDescription.value[studentId] = true
  try {
    const { fetcher: apiFetch } = useApi()
    const res: any = await apiFetch(`/school/${selectedSchoolId.value}/gradebook/final-grades/${finalGradeId}/regenerate-description`, {
      method: 'POST'
    })
    
    if (res.success) {
      toast.success('Deskripsi berhasil di-regenerate sesuai formula.', 'Berhasil')
      const row = matrix.value.find(r => r.student.id === studentId)
      if (row) {
        row.calculated.description = res.data.competency_description || res.data.achievement_description
        row.calculated.is_description_edited = false
        if (expandedStudentDescId.value === studentId) {
          editingDescriptionText.value = row.calculated.description
        }
      }
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal meregenerasi deskripsi.', 'Gagal')
  } finally {
    savingDescription.value[studentId] = false
  }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
          {{ isTKSchool ? 'Input Penilaian Perkembangan TK' : 'Input Nilai Siswa' }}
        </h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">
          {{ isTKSchool ? 'Wali kelas dapat mengisi capaian perkembangan dan deskripsi naratif untuk siswa TK.' : 'Guru mata pelajaran dapat menginput nilai secara live, finalisasi per komponen, atau kunci nilai rapor.' }}
        </p>
      </div>
      <div v-if="!isTKSchool && scheme && matrix.length > 0" class="flex gap-2">
        <BaseButton variant="primary" @click="handleFinalizeScheme" class="py-2.5 px-4 text-xs font-bold shadow-lg shadow-violet-600/15">
          <Save class="mr-1.5" :size="14" /> Simpan & Kunci Nilai Akhir
        </BaseButton>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
      <div class="flex flex-col gap-1.5" :class="isTKSchool ? 'lg:col-span-3' : 'lg:col-span-2'">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-semibold outline-none transition-all focus:border-violet-600">
          <option v-for="school in filteredSchools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kelas</label>
        <select v-model="selectedClassId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-semibold outline-none transition-all focus:border-violet-600">
          <option value="" disabled>Pilih Kelas</option>
          <option v-for="c in filteredClasses" :key="c.id" :value="c.id">{{ c.class_name }}</option>
        </select>
      </div>

      <!-- If TK: Template select filter -->
      <div v-if="isTKSchool" class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Template Rapor</label>
        <select v-model="selectedTemplateId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-semibold outline-none transition-all focus:border-violet-600">
          <option value="" disabled>Pilih Template</option>
          <option v-for="temp in reportTemplates" :key="temp.id" :value="temp.id">{{ temp.name }}</option>
        </select>
      </div>

      <!-- If non-TK: Mata Pelajaran select filter -->
      <div v-else class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Mata Pelajaran</label>
        <select v-model="selectedSubjectId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-semibold outline-none transition-all focus:border-violet-600">
          <option value="" disabled>Pilih Mapel</option>
          <option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tahun Ajaran</label>
        <select v-model="selectedAcademicYearId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-semibold outline-none transition-all focus:border-violet-600">
          <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Semester</label>
        <select v-model="selectedSemester" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-semibold outline-none transition-all focus:border-violet-600">
          <option value="odd">Ganjil</option>
          <option value="even">Genap</option>
        </select>
      </div>
    </div>

    <!-- Loading Panel -->
    <div v-if="loading || loadingTK" class="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm animate-pulse">
      <Loader2 class="text-violet-500 animate-spin mb-4" :size="36" />
      <p class="text-xs font-bold text-slate-500">Memuat data...</p>
    </div>

    <!-- Filters Warning placeholders -->
    <div v-else-if="!selectedClassId || (!isTKSchool && !selectedSubjectId)" class="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm text-center">
      <ClipboardCheck class="text-slate-350 dark:text-zinc-700 mb-3" :size="48" />
      <p class="text-sm font-bold text-slate-700 dark:text-zinc-200">Pilih Parameter Penilaian</p>
      <p class="text-xs text-slate-400 max-w-sm mt-1">
        Pilih Unit Sekolah, Kelas, <span v-if="!isTKSchool">dan Mata Pelajaran</span> di atas untuk membuka lembar penilaian siswa.
      </p>
    </div>

    <!-- TK Workspace -->
    <div v-else-if="isTKSchool" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left side: List of students -->
      <div class="lg:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm h-fit space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">Daftar Murid</h3>
          <BaseButton 
            v-if="tkReportsList.length > 0" 
            variant="outline" 
            @click="handleGenerateTK" 
            :disabled="generatingTK"
            class="text-[10px] py-1 px-2 font-semibold"
          >
            {{ generatingTK ? 'Syncing...' : 'Sync Draft Rapor' }}
          </BaseButton>
        </div>

        <!-- If no reports at all, show generate draft CTA -->
        <div v-if="tkReportsList.length === 0" class="py-12 text-center text-slate-400">
          <AlertCircle class="mx-auto mb-2 text-amber-500 opacity-80" :size="24" />
          <p class="text-xs font-bold text-slate-700 dark:text-zinc-300">Draft Rapor Belum Di-generate</p>
          <p class="text-[10px] mt-1 mb-4">Silakan buat draft rapor kelas terlebih dahulu.</p>
          <BaseButton variant="primary" @click="handleGenerateTK" :disabled="generatingTK" class="py-2 px-3 text-xs font-bold">
            Buat Draft Rapor
          </BaseButton>
        </div>

        <div v-else class="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          <button
            v-for="rep in tkReportsList"
            :key="rep.student_id"
            @click="selectTKStudent(rep)"
            type="button"
            class="w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between"
            :class="[
              activeTKReport?.student_id === rep.student_id
                ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-600/10'
                : 'bg-slate-50/50 hover:bg-slate-50 dark:bg-zinc-950/40 dark:hover:bg-zinc-950 border-slate-200/60 dark:border-zinc-800 text-slate-800 dark:text-zinc-300'
            ]"
          >
            <div class="space-y-0.5">
              <p class="text-xs font-bold leading-tight" :class="{'text-white': activeTKReport?.student_id === rep.student_id}">
                {{ rep.full_name }}
              </p>
              <p class="text-[9px]" :class="activeTKReport?.student_id === rep.student_id ? 'text-violet-200' : 'text-slate-400'">
                NIS: {{ rep.student_number || '-' }}
              </p>
            </div>
            
            <!-- Badge status -->
            <span 
              v-if="rep.report_id"
              class="px-1.5 py-0.5 rounded text-[8px] font-bold border"
              :class="[
                activeTKReport?.student_id === rep.student_id
                  ? 'bg-white/10 text-white border-white/20'
                  : getStatusBadgeClass(rep.status)
              ]"
            >
              {{ getStatusLabel(rep.status) }}
            </span>
            <span v-else class="text-[9px] font-bold text-rose-500">
              Belum Terdaftar
            </span>
          </button>
        </div>
      </div>

      <!-- Right side: TK assessments form -->
      <div class="lg:col-span-2 space-y-4">
        
        <!-- Tabs -->
        <div v-if="activeTKReport" class="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 p-1.5 rounded-xl shadow-sm w-max">
          <button 
            @click="activeTKTab = 'rapor'"
            class="px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2"
            :class="activeTKTab === 'rapor' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800/50'"
          >
            <ClipboardCheck :size="14" /> Penilaian Rapor
          </button>
          <button 
            @click="activeTKTab = 'anecdotal'"
            class="px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2"
            :class="activeTKTab === 'anecdotal' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800/50'"
          >
            <Edit2 :size="14" /> Jurnal Anekdot Harian
          </button>
        </div>

        <div v-if="!activeTKReport" class="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm text-center">
          <ClipboardCheck class="text-slate-350 dark:text-zinc-700 mb-3" :size="40" />
          <p class="text-xs font-bold text-slate-700 dark:text-zinc-200">Belum Ada Siswa yang Dipilih</p>
          <p class="text-[10px] text-slate-400 max-w-xs mt-1">Pilih salah satu siswa dari daftar di sebelah kiri untuk mulai mengisi penilaian perkembangan TK.</p>
        </div>

        <!-- Tab Content: Penilaian Rapor -->
        <template v-else-if="activeTKTab === 'rapor'">
          <!-- WARNING SYNC -->
          <div v-if="needsSync" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle class="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 class="text-sm font-bold text-amber-800 dark:text-amber-500">Perhatian: Template Telah Diperbarui</h4>
              <p class="text-xs text-amber-700 dark:text-amber-400 mt-1">Template rapor telah diubah di Visual Builder sejak Anda terakhir kali menggenerate rapor kelas ini. Untuk menyesuaikan struktur nilai, mohon tekan tombol <b>Generate Rapor</b> kembali.</p>
            </div>
          </div>

          <div v-if="loadingTKAssessments" class="py-20 text-center text-slate-400 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm">
            <div class="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin mx-auto mb-3"></div>
            <p class="text-xs font-semibold">Memuat elemen penilaian...</p>
          </div>

        <div v-else class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-zinc-100">
                Input Penilaian TK - {{ activeTKReport.full_name }}
              </h3>
              <p class="text-[10px] text-slate-400 mt-0.5">
                Mengisi capaian perkembangan dan narasi deskripsi untuk {{ activeTKReport.full_name }}.
              </p>
            </div>
            
            <BaseButton 
              variant="primary" 
              @click="handleSaveTKAssessments" 
              :disabled="savingTKAssessments || tkAssessmentsForm.length === 0" 
              class="py-2 px-3 text-xs font-bold shadow-lg shadow-violet-600/10"
            >
              <Save class="mr-1.5" :size="14" /> {{ savingTKAssessments ? 'Menyimpan...' : 'Simpan Penilaian' }}
            </BaseButton>
          </div>

          <div v-if="isTemplateModified" class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-xl flex items-start gap-3">
            <AlertCircle :size="18" class="mt-0.5 shrink-0" />
            <div>
              <p class="font-bold text-xs mb-1">Perhatian: Template Raport Telah Diubah</p>
              <p class="text-[10px] leading-relaxed">Terdeteksi adanya perubahan pada struktur template di halaman Visual Builder sejak draft raport ini dibuat. Jika ada form penilaian yang tidak muncul, silakan klik tombol <strong class="text-amber-900 dark:text-amber-100">Buat Draft Rapor Kelas</strong> (di menu kiri bawah) ulang untuk menyinkronkan daftar indikator dengan template terbaru.</p>
            </div>
          </div>

          <div class="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
            <div 
              v-for="(item, index) in tkAssessmentsForm" 
              :key="item.element_id" 
              class="bg-slate-50/50 dark:bg-zinc-950/20 p-4 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl space-y-3"
            >
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-250/50 dark:border-zinc-800 pb-2">
                <span class="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-snug">
                  {{ index + 1 }}. {{ item.element_name }}
                </span>
                
                <div class="flex items-center gap-2 shrink-0">
                  <label class="text-[9px] font-black text-slate-500 uppercase tracking-wider">Capaian:</label>
                  <!-- Skala Kurikulum Merdeka Fase Fondasi (BB/MB/BSH/BSB) -->
                  <select 
                    v-model="item.letter_grade" 
                    class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs font-black outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                  >
                    <option :value="null">- Pilih Capaian -</option>
                    <option value="BB">BB — Belum Berkembang</option>
                    <option value="MB">MB — Mulai Berkembang</option>
                    <option value="BSH">BSH — Berkembang Sesuai Harapan</option>
                    <option value="BSB">BSB — Berkembang Sangat Baik</option>
                  </select>
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-[9px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-widest px-1">Deskripsi / Capaian Perkembangan</label>
                <textarea 
                  v-model="item.narrative" 
                  rows="4" 
                  placeholder="Masukkan catatan perkembangan atau deskripsi capaian ananda untuk aspek ini..."
                  class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold leading-relaxed outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                ></textarea>
              </div>
            </div>

            <div v-if="tkAssessmentsForm.length === 0" class="text-center py-12 text-slate-400">
              <AlertCircle class="mx-auto mb-2 text-amber-500 opacity-80" :size="32" />
              <p class="text-xs font-bold text-slate-700 dark:text-zinc-350">Tidak ada elemen penilaian ditemukan.</p>
              <p class="text-[10px] mt-1">Pastikan template rapor untuk jenjang TK sudah dikonfigurasi dengan elemen penilaian.</p>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <BaseButton 
              variant="primary" 
              @click="handleSaveTKAssessments" 
              :disabled="savingTKAssessments || tkAssessmentsForm.length === 0" 
              class="py-2.5 px-4 text-xs font-bold"
            >
              <Save class="mr-1.5" :size="14" /> {{ savingTKAssessments ? 'Menyimpan...' : 'Simpan Penilaian Rapor' }}
            </BaseButton>
          </div>
        </div>
        </template>
        
        <!-- Tab Content: Jurnal Anekdot Harian -->
        <template v-else-if="activeTKTab === 'anecdotal'">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <!-- Form Input Anekdot (Left/Top Column) -->
            <div class="lg:col-span-5 flex flex-col gap-4">
              <div class="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-violet-500/20 relative overflow-hidden group">
                <div class="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                <h3 class="text-lg font-black tracking-tight mb-1">
                  {{ editingAnecdotalId ? 'Edit Jurnal Anekdot' : 'Catat Jurnal Anekdot' }}
                </h3>
                <p class="text-xs text-violet-100/80 leading-relaxed">
                  {{ editingAnecdotalId ? 'Perbarui observasi untuk' : 'Observasi harian untuk' }} <strong>{{ activeTKReport.full_name }}</strong>
                </p>
              </div>

              <div class="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 rounded-3xl p-6 shadow-sm space-y-5">
                <div class="space-y-4">
                  <BaseDateInput 
                    v-model="anecdotalForm.date" 
                    label="Tanggal Kejadian" 
                    required
                  />
                  <BaseInput 
                    v-model="anecdotalForm.activity_name" 
                    label="Konteks / Nama Kegiatan" 
                    placeholder="Contoh: Bermain balok, Makan siang..." 
                  />
                  
                  <div class="flex flex-col gap-2">
                    <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider px-1">
                      Catatan Peristiwa (Fakta Obyektif) <span class="text-rose-500">*</span>
                    </label>
                    <textarea 
                      v-model="anecdotalForm.observation_notes" 
                      rows="6" 
                      placeholder="Contoh: Budi menyusun balok vertikal hingga tinggi 1 meter tanpa jatuh, lalu memanggil gurunya, 'Lihat menaraku!'"
                      class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 resize-none placeholder:text-slate-400"
                    ></textarea>
                  </div>

                  <div class="flex gap-2">
                    <BaseButton 
                      v-if="editingAnecdotalId"
                      variant="outline" 
                      @click="cancelEditAnecdotal" 
                      class="w-1/3 py-3 mt-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-300 relative overflow-hidden"
                    >
                      Batal
                    </BaseButton>
                    <BaseButton 
                      variant="primary" 
                      @click="handleSaveAnecdotalNote" 
                      :disabled="savingAnecdotal || !anecdotalForm.observation_notes.trim()" 
                      class="py-3 mt-2 rounded-xl text-sm font-bold shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0 relative overflow-hidden"
                      :class="editingAnecdotalId ? 'w-2/3' : 'w-full'"
                    >
                      <span class="relative z-10 flex items-center justify-center gap-2">
                        <Save :size="16" /> {{ savingAnecdotal ? 'Sedang Menyimpan...' : (editingAnecdotalId ? 'Simpan Perubahan' : 'Simpan Jurnal Anekdot') }}
                      </span>
                    </BaseButton>
                  </div>
                </div>
              </div>
            </div>

            <!-- Timeline/Riwayat (Right/Bottom Column) -->
            <div class="lg:col-span-7 flex flex-col">
              <div class="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 rounded-3xl p-6 shadow-sm flex flex-col h-full min-h-[500px]">
                <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-zinc-800">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                      <History :size="20" />
                    </div>
                    <div>
                      <h3 class="text-base font-black text-slate-900 dark:text-zinc-100">Riwayat Anekdot</h3>
                      <p class="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">Jejak observasi selama satu semester berjalan.</p>
                    </div>
                  </div>
                  <div v-if="anecdotalPagination.total > 0" class="flex flex-col items-end">
                    <span class="text-2xl font-black text-slate-800 dark:text-zinc-200 leading-none">{{ anecdotalPagination.total }}</span>
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Catatan</span>
                  </div>
                </div>

                <div v-if="loadingAnecdotal" class="flex-1 flex flex-col items-center justify-center">
                  <Loader2 class="text-violet-500 animate-spin mb-3" :size="32" />
                  <p class="text-xs font-semibold text-slate-500 animate-pulse">Memuat riwayat...</p>
                </div>

                <div v-else-if="anecdotalNotes.length === 0" class="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div class="w-20 h-20 mb-4 rounded-full bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center text-slate-300 dark:text-zinc-700">
                    <NotebookPen :size="32" stroke-width="1.5" />
                  </div>
                  <h4 class="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">Ruang Kosong</h4>
                  <p class="text-[11px] font-medium text-slate-500 dark:text-zinc-500 max-w-xs leading-relaxed">Anda belum pernah mencatat anekdot untuk siswa ini. Jadikan setiap momen belajar anak bermakna dengan mencatatnya.</p>
                </div>

                <div v-else class="flex-1 space-y-6 overflow-y-auto pr-3 custom-scrollbar max-h-[500px]">
                  <div v-for="note in anecdotalNotes" :key="note.id" class="relative pl-6 group">
                    <div class="absolute left-[3px] top-4 bottom-[-24px] w-px bg-slate-200 dark:bg-zinc-800 group-last:bg-transparent"></div>
                    <div class="absolute w-2 h-2 bg-white dark:bg-zinc-900 border-[2px] border-violet-500 rounded-full left-0 top-[18px] shadow-[0_0_8px_rgba(139,92,246,0.4)] group-hover:scale-125 transition-transform duration-300 z-10"></div>
                    
                    <div class="bg-slate-50/50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-4 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-900/50 transition-all duration-300">
                      <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-100/50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-[10px] font-bold uppercase tracking-wider">
                          <Calendar :size="12" /> {{ new Date(note.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) }}
                        </span>
                        
                        <!-- Action Buttons -->
                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button 
                            @click="editAnecdotalNote(note)" 
                            class="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-md transition-colors"
                            title="Edit Catatan"
                          >
                            <Edit2 :size="14" />
                          </button>
                          <button 
                            @click="promptDeleteAnecdotalNote(note.id)" 
                            class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors"
                            title="Hapus Catatan"
                          >
                            <Trash2 :size="14" />
                          </button>
                        </div>
                      </div>
                      <h5 v-if="note.activity_name" class="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-1.5">{{ note.activity_name }}</h5>
                      <p class="text-xs font-medium text-slate-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">{{ note.observation_notes }}</p>
                    </div>
                  </div>
                </div>

                <!-- Pagination -->
                <div v-if="anecdotalPagination.total_pages > 1" class="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-5 mt-4">
                  <button 
                    :disabled="anecdotalPagination.page === 1" 
                    @click="fetchAnecdotalNotes(anecdotalPagination.page - 1)"
                    class="py-1.5 px-3 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-zinc-300 flex items-center gap-1 border border-slate-200 dark:border-zinc-700"
                  >
                    <ChevronLeft :size="14" /> Prev
                  </button>
                  <div class="flex items-center gap-1.5">
                    <span v-for="p in anecdotalPagination.total_pages" :key="p" 
                      class="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
                      :class="p === anecdotalPagination.page ? 'bg-violet-600 w-4' : 'bg-slate-200 dark:bg-zinc-700 w-1.5 hover:bg-violet-400'"
                      @click="fetchAnecdotalNotes(p)"
                    ></span>
                  </div>
                  <button 
                    :disabled="anecdotalPagination.page === anecdotalPagination.total_pages" 
                    @click="fetchAnecdotalNotes(anecdotalPagination.page + 1)"
                    class="py-1.5 px-3 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-zinc-300 flex items-center gap-1 border border-slate-200 dark:border-zinc-700"
                  >
                    Next <ChevronRight :size="14" />
                  </button>
                </div>

              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div v-else-if="!scheme" class="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm text-center">
      <AlertCircle class="text-amber-500 mb-3" :size="40" />
      <p class="text-sm font-bold text-slate-700 dark:text-zinc-200">Skema Penilaian Belum Tersedia</p>
      <p class="text-xs text-slate-400 max-w-sm mt-1 mb-6">Skema penilaian untuk kelas ini belum dikonfigurasi. Silakan buat skema penilaian terlebih dahulu.</p>
      <NuxtLink to="/gradebook/scheme" class="inline-flex items-center justify-center px-4 py-2.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/15">
        Buka Konfigurasi Skema
      </NuxtLink>
    </div>

    <div v-else-if="components.length === 0" class="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm text-center">
      <AlertCircle class="text-amber-500 mb-3" :size="40" />
      <p class="text-sm font-bold text-slate-700 dark:text-zinc-200">Belum Ada Komponen Nilai</p>
      <p class="text-xs text-slate-400 max-w-sm mt-1 mb-6">Skema penilaian aktif ditemukan, tetapi belum memiliki komponen nilai (seperti NH, PTS, PAS) untuk diisi.</p>
      <NuxtLink to="/gradebook/scheme" class="inline-flex items-center justify-center px-4 py-2.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/15">
        Tambah Komponen di Skema
      </NuxtLink>
    </div>

    <!-- Active Inline-Editing Table Workspace -->
    <div v-else class="space-y-6">
      
      <!-- KKM Indicator Info -->
      <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/50 p-4 rounded-2xl">
        <div class="flex gap-2.5 items-start">
          <Info class="text-violet-600 shrink-0 mt-0.5" :size="16" />
          <div class="text-xs text-violet-800 dark:text-violet-300 font-semibold leading-relaxed">
            <p><strong>Tips Input Nilai:</strong> Nilai disimpan secara otomatis di latar belakang sesaat setelah Anda memindahkan kursor (blur) dari sel input.</p>
            <p class="mt-1" v-if="kkm !== null">Batas KKM Aktif: <span class="bg-violet-200/60 dark:bg-violet-900 px-1.5 py-0.5 rounded text-[10px] font-black text-violet-700 dark:text-violet-400">{{ kkm }}</span>. Nilai di bawah KKM akan disorot berwarna merah.</p>
            <p class="mt-1" v-else>⚠ KKM mata pelajaran belum diatur. Nilai tidak akan diberi penanda tuntas.</p>
          </div>
        </div>
      </div>

      <!-- Matrix Table Card -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <!-- Header Row 1: Groups -->
              <tr class="border-b border-slate-200/50 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/40 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                <th class="px-6 py-3 border-r border-slate-100 dark:border-zinc-850 min-w-[200px]" rowspan="2">Nama Murid</th>
                
                <th 
                  v-for="group in groups" 
                  :key="group.id" 
                  class="px-4 py-3 border-r border-slate-100 dark:border-zinc-850 text-center"
                  :colspan="components.filter(c => c.group_id === group.id).length"
                >
                  <div class="flex items-center justify-center gap-1.5">
                    <span>{{ group.name }}</span>
                    <span class="bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-1 rounded text-[8px] font-bold">
                      {{ Number(group.weight_percent) }}%
                    </span>
                  </div>
                </th>

                <th class="px-6 py-3 text-center bg-violet-50/40 dark:bg-violet-950/10 min-w-[90px]" colspan="2">Raport Akhir</th>
              </tr>

              <!-- Header Row 2: Components -->
              <tr class="border-b border-slate-200/50 dark:border-zinc-850 bg-slate-50/20 dark:bg-zinc-900/20 text-[9px] font-bold text-slate-500 dark:text-zinc-450">
                
                <th 
                  v-for="comp in components" 
                  :key="comp.id"
                  class="p-2 border-r border-slate-100 dark:border-zinc-850 text-center font-black"
                >
                  <div class="flex flex-col items-center gap-1">
                    <span class="text-[10px] text-slate-700 dark:text-zinc-300 truncate max-w-[80px]" :title="comp.name">{{ comp.name }}</span>
                    <span class="text-[8px] text-slate-400">
                      (w: {{ Number(comp.weight_in_group) }}%)
                    </span>
                    <span v-if="comp.is_remedial_slot" class="mt-0.5 inline-flex flex-col items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20" title="Remedial Slot">
                      <span>Remedial</span>
                      <template v-if="comp.parent_component_id">
                        <span class="max-w-[80px] truncate opacity-80" :title="'Terikat ke: ' + (components.find(c => c.id === comp.parent_component_id)?.name || 'Unknown')">
                          (→ {{ components.find(c => c.id === comp.parent_component_id)?.name || '?' }})
                        </span>
                      </template>
                    </span>
                    <div class="flex gap-1 mt-1">
                      <button @click="openBulkModal(comp.id)" :disabled="comp.status === 'final'" class="px-1 py-0.5 bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-violet-600 rounded text-[8px] font-bold disabled:opacity-50" title="Input Massal">
                        Bulk
                      </button>
                      <button @click="handleFinalizeComponent(comp.id)" :disabled="comp.status === 'final'" class="px-1 py-0.5 bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-emerald-600 rounded text-[8px] font-bold disabled:opacity-50" title="Finalisasi Kolom">
                        Lock
                      </button>
                    </div>
                  </div>
                </th>

                <th class="px-4 py-2 text-center bg-violet-50/40 dark:bg-violet-950/10 text-[10px] font-bold text-violet-700 dark:text-violet-400 border-r border-slate-100 dark:border-zinc-850">Nilai</th>
                <th class="px-4 py-2 text-center bg-violet-50/40 dark:bg-violet-950/10 text-[10px] font-bold text-violet-700 dark:text-violet-400">Predikat</th>
              </tr>
            </thead>
                       <tbody class="divide-y divide-slate-100 dark:divide-zinc-850">
              <template v-for="row in matrix" :key="row.student.id">
                <tr class="hover:bg-slate-50/20 dark:hover:bg-zinc-900/10 transition-colors">
                  <!-- Student details -->
                  <td class="px-6 py-3 border-r border-slate-100 dark:border-zinc-855 font-semibold">
                    <p class="font-bold text-slate-900 dark:text-zinc-200 text-xs truncate max-w-[180px]">{{ row.student.full_name }}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-[9px] text-slate-450 dark:text-zinc-550">NIS: {{ row.student.student_number || '-' }}</span>
                      <button 
                        v-if="row.calculated.final_grade_id"
                        type="button"
                        @click="toggleExpandDesc(row.student.id, row.calculated.description)"
                        class="text-[9px] font-bold text-violet-600 hover:text-violet-750 flex items-center gap-0.5 underline shrink-0 cursor-pointer"
                      >
                        <Edit2 :size="8" /> {{ expandedStudentDescId === row.student.id ? 'Tutup Deskripsi' : 'Edit Deskripsi' }}
                      </button>
                      <span v-if="row.calculated.is_description_edited" class="bg-amber-500/10 text-amber-600 border border-amber-500/15 text-[8px] font-black uppercase px-1 rounded flex items-center gap-0.5 select-none" title="Diedit manual oleh guru">
                        ✏ Diedit Manual
                      </span>
                    </div>
                  </td>

                  <!-- Components inputs -->
                  <td 
                    v-for="comp in components" 
                    :key="comp.id"
                    class="p-1.5 border-r border-slate-100 dark:border-zinc-855 text-center relative group"
                  >
                    <div class="flex items-center justify-center gap-1.5" v-if="row.scores && row.scores[comp.id]">
                      <!-- Numeric input or Letter select based on TK level or component type -->
                      <input 
                        v-if="comp.type !== 'observasi' && comp.type !== 'sikap'"
                        v-model="row.scores[comp.id].score"
                        @blur="handleCellSave(row.student.id, comp.id)"
                        :disabled="row.scores[comp.id].status === 'final'"
                        type="number"
                        step="0.01"
                        min="0"
                        :max="Number(comp.max_score)"
                        placeholder="-"
                        class="w-14 bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-1.5 py-1 text-xs font-bold text-center outline-none focus:border-violet-600 disabled:bg-slate-100/70 dark:disabled:bg-zinc-900/70 disabled:text-slate-400"
                        :class="{
                          'text-rose-600 bg-rose-500/5 border-rose-200 dark:border-rose-900': kkm !== null && row.scores[comp.id].score !== null && Number(row.scores[comp.id].score) < kkm
                        }"
                      />
                      <!-- Grade select dropdown (for narative observations/TK fallback) -->
                      <select
                        v-else
                        v-model="row.scores[comp.id].grade_letter"
                        @change="handleCellSave(row.student.id, comp.id)"
                        :disabled="row.scores[comp.id].status === 'final'"
                        class="w-16 bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-1 py-1 text-[10px] font-bold text-center outline-none focus:border-violet-600 disabled:opacity-75"
                      >
                        <option :value="null">-</option>
                        <option value="BB">BB</option>
                        <option value="MB">MB</option>
                        <option value="BSH">BSH</option>
                        <option value="BSB">BSB</option>
                      </select>

                      <!-- Save states and Audit Log icon -->
                      <div class="flex flex-col items-center justify-center">
                        <Loader2 v-if="savingState[`${row.student.id}-${comp.id}`] === 'saving'" class="text-violet-500 animate-spin" :size="10" />
                        <Check v-else-if="savingState[`${row.student.id}-${comp.id}`] === 'saved'" class="text-emerald-500" :size="10" />
                        <button 
                          v-else-if="row.scores[comp.id].id" 
                          @click="openLogsModal(row.student.id, comp.id)"
                          class="text-slate-300 hover:text-slate-500 dark:text-zinc-700 dark:hover:text-zinc-505 opacity-0 group-hover:opacity-100 transition-opacity" 
                          title="Riwayat Perubahan"
                        >
                          <History :size="10" />
                        </button>
                      </div>
                    </div>
                  </td>

                  <!-- Calculated Final Grade preview -->
                  <td class="px-4 py-3 text-center bg-violet-50/40 dark:bg-violet-950/10 font-bold border-r border-slate-100 dark:border-zinc-850 text-xs">
                    <span 
                      :class="[
                        row.calculated.final_score !== null 
                          ? (kkm !== null && row.calculated.final_score < kkm ? 'text-rose-600' : 'text-slate-900 dark:text-zinc-200')
                          : 'text-slate-400'
                      ]"
                    >
                      {{ row.calculated.final_score ?? row.calculated.grade_letter ?? '-' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center bg-violet-50/40 dark:bg-violet-950/10 text-xs font-black">
                    <span 
                      class="px-2 py-0.5 rounded text-[10px] font-bold"
                      :class="{
                        'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10': row.calculated.predicate === 'A' || row.calculated.predicate === 'BSB' || row.calculated.predicate === 'BSH',
                        'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/10': row.calculated.predicate === 'B' || row.calculated.predicate === 'MB',
                        'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/10': row.calculated.predicate === 'C',
                        'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/10': row.calculated.predicate === 'D' || row.calculated.predicate === 'BB'
                      }"
                    >
                      {{ row.calculated.predicate || '-' }}
                    </span>
                  </td>

                </tr>

                <!-- Expanded Description Editor Row -->
                <tr v-if="expandedStudentDescId === row.student.id" :key="'desc_' + row.student.id" class="bg-violet-50/5 dark:bg-violet-950/5">
                  <td :colspan="components.length + 3" class="px-6 py-4 bg-slate-50/50 dark:bg-zinc-950/20 border-t border-b border-slate-200/50 dark:border-zinc-850 text-left">
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="text-[10px] font-extrabold text-violet-700 dark:text-violet-400 uppercase tracking-widest flex items-center gap-1">
                          <Edit2 :size="10" /> Deskripsi Capaian Kompetensi - {{ row.student.full_name }}
                        </span>
                        <div class="flex gap-2">
                          <button 
                            type="button"
                            @click="handleRegenerateDescription(row.student.id, row.calculated.final_grade_id)"
                            :disabled="savingDescription[row.student.id]"
                            class="px-2.5 py-1 text-[10px] bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 rounded font-bold flex items-center gap-1 transition-colors"
                          >
                            <Sparkles :size="10" /> Atur Ulang Formula
                          </button>
                          <button 
                            type="button"
                            @click="handleSaveDescription(row.student.id, row.calculated.final_grade_id)"
                            :disabled="savingDescription[row.student.id]"
                            class="px-3 py-1 text-[10px] bg-violet-600 text-white hover:bg-violet-750 rounded font-bold flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <Save :size="10" /> Simpan Catatan
                          </button>
                        </div>
                      </div>

                      <textarea 
                        v-model="editingDescriptionText"
                        rows="3"
                        class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-semibold leading-relaxed outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                        placeholder="Masukkan deskripsi kompetensi..."
                      ></textarea>
                      
                      <p class="text-[9px] text-slate-450 dark:text-zinc-500 italic">
                        Formula otomatis menggabungkan kalimat capaian tertinggi (lulus KKM) dengan capaian terendah yang membutuhkan penguatan/bimbingan.
                      </p>
                    </div>
                  </td>
                </tr>
              </template>

              <!-- Empty state -->
              <tr v-if="matrix.length === 0">
                <td :colspan="components.length + 3" class="text-center py-16 text-slate-400 font-semibold">
                  Tidak ada data siswa terdaftar di kelas ini.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Bulk Copy-Paste Input Modal -->
    <BaseModal :show="showBulkModal" title="Input Massal Nilai" @close="showBulkModal = false">
      <div class="space-y-4">
        <div class="flex items-start gap-2.5 p-3.5 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-100 dark:border-violet-900/50 text-xs text-violet-700 dark:text-violet-300">
          <Info class="shrink-0 mt-0.5" :size="14" />
          <div>
            <p class="font-bold mb-1">Panduan Copy-Paste Nilai:</p>
            <p>1. Copy satu kolom nilai dari spreadsheet Anda (Excel / Google Sheet).</p>
            <p>2. Paste ke kotak input di bawah. Baris baru mewakili siswa berikutnya sesuai urutan tabel.</p>
            <p>3. Format: nilai angka (misal: 85) atau huruf (misal: BSB) per baris.</p>
          </div>
        </div>

        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Tempel Kolom Nilai Di Sini</label>
          <textarea 
            v-model="bulkInputText" 
            rows="10" 
            placeholder="80&#10;85&#10;92&#10;78&#10;BSB&#10;BSH"
            class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono font-bold outline-none focus:border-violet-600"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showBulkModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="handleBulkInputSubmit">Simpan Nilai</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Audit Logs Modal -->
    <BaseModal :show="showLogsModal" title="Log Audit Riwayat Nilai" @close="showLogsModal = false">
      <div class="space-y-4">
        <div class="px-2">
          <p class="text-xs text-slate-400">Siswa: <strong class="text-slate-800 dark:text-zinc-200">{{ activeStudentName }}</strong></p>
          <p class="text-xs text-slate-400">Komponen: <strong class="text-slate-800 dark:text-zinc-200">{{ activeComponentName }}</strong></p>
        </div>

        <div class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-100 dark:bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-slate-505 px-3 py-2">
                <th class="p-3">Waktu</th>
                <th class="p-3 text-center">Sebelum</th>
                <th class="p-3 text-center">Sesudah</th>
                <th class="p-3">Alasan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-zinc-850">
              <tr 
                v-for="log in selectedScoreLogs" 
                :key="log.id"
                class="hover:bg-slate-100/50 dark:hover:bg-zinc-900/30 transition-colors"
              >
                <td class="p-3 text-[10px] text-slate-505 font-semibold">
                  {{ new Date(log.changed_at).toLocaleString('id-ID') }}
                </td>
                <td class="p-3 text-center font-bold text-rose-500">
                  {{ log.score_before ?? log.grade_letter_before ?? '-' }}
                </td>
                <td class="p-3 text-center font-bold text-emerald-600">
                  {{ log.score_after ?? log.grade_letter_after ?? '-' }}
                </td>
                <td class="p-3 text-[10px] font-medium text-slate-605 dark:text-zinc-400">
                  {{ log.reason || '-' }}
                </td>
              </tr>
              <tr v-if="selectedScoreLogs.length === 0">
                <td colspan="4" class="p-8 text-center text-slate-400 font-medium">
                  Belum ada riwayat perubahan nilai.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end pt-2">
          <BaseButton variant="outline" type="button" @click="showLogsModal = false">Tutup</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Delete Confirmation Modal -->
    <BaseModal :show="showDeleteModal" title="Hapus Catatan Anekdot" @close="showDeleteModal = false">
      <div class="space-y-4">
        <div class="flex flex-col items-center justify-center p-4 text-center">
          <div class="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mb-4">
            <Trash2 :size="32" stroke-width="1.5" />
          </div>
          <h4 class="text-base font-bold text-slate-800 dark:text-zinc-200 mb-2">Hapus Catatan Ini?</h4>
          <p class="text-xs text-slate-500 dark:text-zinc-400 max-w-sm">
            Tindakan ini tidak dapat dibatalkan. Catatan observasi akan dihapus secara permanen dari riwayat siswa.
          </p>
        </div>
        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showDeleteModal = false" class="py-2.5 px-4 font-bold">Batal</BaseButton>
          <BaseButton variant="primary" @click="confirmDeleteAnecdotalNote" class="py-2.5 px-4 font-bold bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-lg shadow-rose-600/20">Ya, Hapus</BaseButton>
        </div>
      </div>
    </BaseModal>

  </div>
</template>
