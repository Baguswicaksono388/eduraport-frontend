<script setup lang="ts">
import { ClipboardCheck, Download, Upload, Info, AlertCircle, CheckCircle, Save, History, Check, Loader2 } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useSchool } from '../../composables/useSchool'
import { useClass } from '../../composables/useClass'
import { useSubject } from '../../composables/useSubject'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useGradebook } from '../../composables/useGradebook'
import { useToast } from '../../composables/useToast'
import { useReport } from '../../composables/useReport'
import { useReportTemplate } from '../../composables/useReportTemplate'

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
const { classes, fetchClasses } = useClass()
const { subjects, fetchSubjects } = useSubject()
const { academicYears, fetchAcademicYears } = useAcademicYear()
const gradebook = useGradebook()
const toast = useToast()

const selectedFoundationId = ref('')
const selectedSchoolId = ref('')
const selectedClassId = ref('')
const selectedSubjectId = ref('')
const selectedAcademicYearId = ref('')
const selectedSemester = ref('odd') // odd or even

// TK Grade Input States
const isTKSchool = computed(() => {
  const school = schools.value.find(s => s.id === selectedSchoolId.value)
  return school?.level === 'TK'
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

onMounted(async () => {
  await fetchFoundations()
  if (foundations.value.length > 0) {
    selectedFoundationId.value = foundations.value[0].id
    await fetchSchools(selectedFoundationId.value)
    if (schools.value.length > 0) {
      selectedSchoolId.value = schools.value[0].id
      await loadSchoolData(selectedSchoolId.value)
    }
  }
})

const loadSchoolData = async (schoolId: string) => {
  await Promise.all([
    fetchClasses(schoolId),
    fetchSubjects(schoolId),
    fetchAcademicYears(schoolId)
  ])
  const activeYear = academicYears.value.find(y => y.is_active)
  if (activeYear) {
    selectedAcademicYearId.value = activeYear.id
  } else if (academicYears.value.length > 0) {
    selectedAcademicYearId.value = academicYears.value[0].id
  }
}

watch(selectedFoundationId, async (newVal) => {
  if (newVal) {
    await fetchSchools(newVal)
    if (schools.value.length > 0) {
      selectedSchoolId.value = schools.value[0].id
    } else {
      selectedSchoolId.value = ''
      classes.value = []
      subjects.value = []
      academicYears.value = []
    }
  }
})

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    selectedClassId.value = ''
    selectedSubjectId.value = ''
    await loadSchoolData(newVal)
    
    // Fetch TK templates if it is a TK school
    if (isTKSchool.value) {
      await fetchReportTemplates(newVal, 'TK')
      if (reportTemplates.value.length > 0) {
        selectedTemplateId.value = reportTemplates.value[0].id
      } else {
        selectedTemplateId.value = ''
      }
    } else {
      selectedTemplateId.value = ''
    }
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
        components.value = matrixRes.data.components
        kkm.value = matrixRes.data.kkm
        
        // Map scores inside the cells
        matrix.value = matrixRes.data.matrix.map((row: any) => {
          // Initialize scores as local reactive objects
          const scoresMap: Record<string, any> = {}
          for (const comp of matrixRes.data.components) {
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

const selectTKStudent = async (report: any) => {
  if (!report.report_id) {
    toast.warning('Draft rapor belum di-generate untuk siswa ini.', 'Peringatan')
    return
  }
  activeTKReport.value = report
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
          <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kelas</label>
        <select v-model="selectedClassId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-semibold outline-none transition-all focus:border-violet-600">
          <option value="" disabled>Pilih Kelas</option>
          <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.class_name }}</option>
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
      <div class="lg:col-span-2 space-y-6">
        <div v-if="loadingTKAssessments" class="py-20 text-center text-slate-400 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm">
          <div class="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin mx-auto mb-3"></div>
          <p class="text-xs font-semibold">Memuat elemen penilaian...</p>
        </div>

        <div v-else-if="!activeTKReport" class="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm text-center">
          <ClipboardCheck class="text-slate-350 dark:text-zinc-700 mb-3" :size="40" />
          <p class="text-xs font-bold text-slate-700 dark:text-zinc-200">Belum Ada Siswa yang Dipilih</p>
          <p class="text-[10px] text-slate-400 max-w-xs mt-1">Pilih salah satu siswa dari daftar di sebelah kiri untuk mulai mengisi penilaian perkembangan TK.</p>
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
                  <select 
                    v-model="item.letter_grade" 
                    class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs font-black outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                  >
                    <option :value="null">- Pilih Capaian -</option>
                    <option value="BB">BB (Belum Berkembang)</option>
                    <option value="MB">MB (Mulai Berkembang)</option>
                    <option value="BSH">BSH (Berkembang Sesuai Harapan)</option>
                    <option value="BSB">BSB (Berkembang Sangat Baik)</option>
                    <option value="BS">BS (Baik Sekali)</option>
                    <option value="B">B (Baik)</option>
                    <option value="C">C (Cukup)</option>
                    <option value="K">K (Kurang)</option>
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
              <tr 
                v-for="row in matrix" 
                :key="row.student.id"
                class="hover:bg-slate-50/20 dark:hover:bg-zinc-900/10 transition-colors"
              >
                <!-- Student details -->
                <td class="px-6 py-3 border-r border-slate-100 dark:border-zinc-850 font-semibold">
                  <p class="font-bold text-slate-900 dark:text-zinc-200 text-xs truncate max-w-[180px]">{{ row.student.full_name }}</p>
                  <p class="text-[9px] text-slate-400 dark:text-zinc-505 mt-0.5">NIS: {{ row.student.student_number || '-' }}</p>
                </td>

                <!-- Components inputs -->
                <td 
                  v-for="comp in components" 
                  :key="comp.id"
                  class="p-1.5 border-r border-slate-100 dark:border-zinc-855 text-center relative group"
                >
                  <div class="flex items-center justify-center gap-1.5">
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

  </div>
</template>
