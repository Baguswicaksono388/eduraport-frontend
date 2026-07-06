<script setup lang="ts">
import { Printer, X, ShieldAlert, FileText, CheckCircle } from 'lucide-vue-next'
import { useSchool } from '../../composables/useSchool'
import { useReport } from '../../composables/useReport'
import { useToast } from '../../composables/useToast'
import { useReportTemplate } from '../../composables/useReportTemplate'

// Disable Nuxt layout for printing
definePageMeta({
  layout: false,
  middleware: [
    function () {
      const token = useCookie('auth_token')
      if (!token.value) {
        return navigateTo('/login')
      }
    }
  ]
})

const route = useRoute()
const router = useRouter()
const { currentSchoolId, p5Dimensions } = useSchool()
const { fetchReportDetail } = useReport()
const { reportTemplates, fetchReportTemplates } = useReportTemplate()
const toast = useToast()

const reportId = route.params.id as string
const reportData = ref<any>(null)
const loading = ref(true)
const selectedTKFormat = ref((route.query.format as string) || 'dinas') // 'dinas' or 'intra'
const selectedTemplateId = ref((route.query.template_id as string) || '')

watch(() => route.query.format, (newFormat) => {
  if (newFormat === 'dinas' || newFormat === 'intra') {
    selectedTKFormat.value = newFormat as string
  }
})

watch(selectedTKFormat, (newFormat) => {
  if (route.query.format !== newFormat) {
    router.replace({
      query: {
        ...route.query,
        format: newFormat
      }
    })
  }
})

watch(() => route.query.template_id, (newVal) => {
  if (newVal !== selectedTemplateId.value) {
    selectedTemplateId.value = (newVal as string) || ''
  }
})

const loadReportDetail = async () => {
  const schoolId = (route.query.school_id as string) || currentSchoolId.value
  if (!schoolId) {
    toast.error('Harap pilih unit sekolah terlebih dahulu di dashboard.', 'Error')
    loading.value = false
    return
  }

  loading.value = true
  try {
    const res = await fetchReportDetail(schoolId, reportId, selectedTemplateId.value)
    if (res.success) {
      reportData.value = res.data
      
      // Set initial selectedTemplateId if not already set
      if (!selectedTemplateId.value && res.data?.template?.id) {
        selectedTemplateId.value = res.data.template.id
      }

      // Auto-switch TK format toggle based on the loaded template name
      if (res.data?.template?.name) {
        const name = res.data.template.name.toLowerCase()
        if (name.includes('intra')) {
          selectedTKFormat.value = 'intra'
        } else {
          selectedTKFormat.value = 'dinas'
        }
      }

      // Fetch all templates for this school and level
      const level = res.data?.student?.school_level || 'TK'
      await fetchReportTemplates(schoolId, level)
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal memuat detail rapor.', 'Gagal')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadReportDetail()
})

watch(selectedTemplateId, async (newVal) => {
  if (route.query.template_id !== newVal) {
    router.replace({
      query: {
        ...route.query,
        template_id: newVal || undefined
      }
    })
  }
  await loadReportDetail()
})

// Active P5 Dimensions – uses school-level config, falls back to defaults
const activeP5Dimensions = computed(() => {
  if (p5Dimensions.value && p5Dimensions.value.length > 0) {
    return p5Dimensions.value
  }
  return [
    { id: 'keimanan', name: 'Keimanan & Takwa' },
    { id: 'kewargaan', name: 'Kewargaan / Kebinekaan' },
    { id: 'penalaran', name: 'Penalaran Kritis' },
    { id: 'kreativitas', name: 'Kreativitas' },
    { id: 'kolaborasi', name: 'Kolaborasi / Gotong Royong' },
    { id: 'kemandirian', name: 'Kemandirian' },
    { id: 'kesehatan', name: 'Jasmani & Kesehatan' },
    { id: 'komunikasi', name: 'Komunikasi & Bahasa' }
  ]
})

const tkDinasAssessments = computed(() => {
  if (!reportData.value?.assessments) return []
  return reportData.value.assessments.filter((a: any) => 
    !a.template_name || a.template_name.includes('Kurikulum Merdeka') || a.template_name.includes('Dinas')
  )
})

const tkIntraAssessments = computed(() => {
  if (!reportData.value?.assessments) return []
  return reportData.value.assessments.filter((a: any) => 
    a.template_name && a.template_name.includes('Intra')
  )
})

const mappedTKDinasSections = computed(() => {
  const sections = reportData.value?.template?.element_structure?.tk_sections
  const assessments = reportData.value?.assessments || []
  
  if (!sections || !Array.isArray(sections)) return null
  
  const findAssessment = (eid: string) => {
    return assessments.find((a: any) => a.element_id === eid)
  }

  return sections.map((sec: any) => {
    return {
      id: sec.id,
      title: sec.title,
      categories: (sec.categories || []).map((cat: any) => {
        const narrativeAsm = findAssessment(cat.narrative_element_id)
        const subAsms = (cat.sub_element_ids || [])
          .map((sid: string) => findAssessment(sid))
          .filter(Boolean)
        
        const p5DimsData: any = {}
        if (cat.is_p5_matrix && cat.p5_dimensions) {
          // Helper to map dim name to legacy key
          const getDimensionKey = (dimName: string) => {
            const normalized = dimName.toLowerCase()
            if (normalized.includes('keimanan')) return 'keimanan'
            if (normalized.includes('kewargaan') || normalized.includes('kebinekaan')) return 'kewargaan'
            if (normalized.includes('penalaran')) return 'penalaran'
            if (normalized.includes('kreativitas')) return 'kreativitas'
            if (normalized.includes('kolaborasi') || normalized.includes('gotong royong')) return 'kolaborasi'
            if (normalized.includes('kemandirian')) return 'kemandirian'
            if (normalized.includes('jasmani') || normalized.includes('kesehatan')) return 'kesehatan'
            if (normalized.includes('komunikasi') || normalized.includes('bahasa')) return 'komunikasi'
            return ''
          }
          activeP5Dimensions.value.forEach((dim: any) => {
            const oldKey = getDimensionKey(dim.name)
            const eid = cat.p5_dimensions[dim.id] || (oldKey ? cat.p5_dimensions[oldKey] : undefined)
            const asm = eid ? findAssessment(eid) : null
            p5DimsData[dim.id] = asm?.letter_grade || asm?.predicate || '-'
          })
        }
        
        return {
          id: cat.id,
          title: cat.title,
          narrative: narrativeAsm?.narrative || 'Belum ada narasi pencapaian.',
          is_p5_matrix: !!cat.is_p5_matrix,
          p5_dimensions: p5DimsData,
          subAssessments: subAsms.map((a: any) => ({
            name: a.element_name,
            grade: a.letter_grade || a.predicate || '-'
          }))
        }
      })
    }
  })
})

const intraCategories = computed(() => {
  const list: any[] = []
  if (!mappedTKDinasSections.value) return list
  mappedTKDinasSections.value.forEach((sec: any) => {
    if (sec.categories) {
      sec.categories.forEach((cat: any) => {
        if (!cat.is_p5_matrix) {
          list.push(cat)
        }
      })
    }
  })
  return list
})

const p5Category = computed(() => {
  if (!mappedTKDinasSections.value) return null
  for (const sec of mappedTKDinasSections.value) {
    if (sec.categories) {
      for (const cat of sec.categories) {
        if (cat.is_p5_matrix) {
          return cat
        }
      }
    }
  }
  return null
})

const intraGroup1 = computed(() => {
  const g1Names = [
    'Adaptasi dan Sosialisasi', 'Minat Belajar', 'Kesiapan Belajar', 
    'Kemandirian', 'Rutinitas', 'Kestabilan Emosi', 
    'Ekspresi', 'Percaya Diri', 'Respons', 'Tanggung Jawab'
  ]
  return tkIntraAssessments.value.filter((a: any) => g1Names.includes(a.element_name))
})

const intraGroup2 = computed(() => {
  const g2Names = [
    'Konsentrasi', 'Kooperatif', 'Ketuntasan Tugas', 
    'Rapi', 'Disiplin', 'Kreatif'
  ]
  return tkIntraAssessments.value.filter((a: any) => g2Names.includes(a.element_name))
})

const intraGroup3 = computed(() => {
  const g3Names = [
    'Motorik Kasar', 'Motorik Halus', 'Persepsi Auditori', 
    'Persepsi Visual', 'Keterampilan Berbicara'
  ]
  return tkIntraAssessments.value.filter((a: any) => g3Names.includes(a.element_name))
})

const intraPribadiNarrative = computed(() => 
  tkIntraAssessments.value.find((a: any) => a.element_name.includes('Pribadi & Sikap'))?.narrative || ''
)

const intraMotorikNarrative = computed(() => 
  tkIntraAssessments.value.find((a: any) => a.element_name.includes('Keterampilan Motorik') || a.element_name.includes('Motorik'))?.narrative || ''
)

const intraAgamaNarrative = computed(() => 
  tkIntraAssessments.value.find((a: any) => a.element_name.includes('Keagamaan') || a.element_name.includes('Ibadah'))?.narrative || ''
)

const activityPhotos = computed(() => {
  const photos = reportData.value?.report?.activity_photos
  if (!photos) return []
  let list: any[] = []
  if (Array.isArray(photos)) {
    list = photos
  } else if (typeof photos === 'string') {
    try {
      list = JSON.parse(photos)
    } catch {
      list = []
    }
  }
  return list.filter((photo: any) => {
    if (!photo) return false
    if (typeof photo === 'string') return photo.trim() !== ''
    if (typeof photo === 'object') return !!(photo.url || photo.src)
    return false
  })
})

const handlePrint = () => {
  window.print()
}

const handleClose = () => {
  window.close()
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
      rows.push({ type: 'row', label: it.label || it.name, no: index++, ref_id: it.ref_id })
    }
  }
  return rows
}

const getRealSubjectGrade = (subjectName: string) => {
  if (!reportData.value?.finalGrades) return null
  const normalized = subjectName.toLowerCase()
  return reportData.value.finalGrades.find((g: any) => 
    g.subject_name.toLowerCase() === normalized
  ) || null
}

const getRealExtracurriculars = (configuredItems: any[]) => {
  if (!reportData.value?.extracurriculars) return []
  if (!configuredItems || configuredItems.length === 0) {
    return reportData.value.extracurriculars.map((ex: any) => ({
      name: ex.extracurricular_name,
      grade: ex.grade,
      description: ex.description
    }))
  }
  return configuredItems.map(item => {
    const name = typeof item === 'string' ? item : item.label || item.name
    const realEx = reportData.value.extracurriculars.find((e: any) => e.extracurricular_name.toLowerCase() === name.toLowerCase())
    return {
      name,
      grade: realEx?.grade || '-',
      description: realEx?.description || 'Mengikuti kegiatan dengan baik.'
    }
  })
}

const getDescTableFlattenedRows = (items: any[]) => {
  const rows: any[] = []
  if (!Array.isArray(items)) return rows
  items.forEach(it => {
    const parentLabel = it.label || it.name
    if (it.subs && it.subs.length > 0) {
      it.subs.forEach((sub: any) => {
        const subLabel = sub.label || sub.name
        const realAsm = reportData.value?.assessments?.find((a: any) => a.element_name.toLowerCase() === subLabel.toLowerCase())
        rows.push({
          parentLabel,
          subLabel,
          grade: realAsm?.letter_grade || realAsm?.predicate || '-'
        })
      })
    } else {
      const realAsm = reportData.value?.assessments?.find((a: any) => a.element_name.toLowerCase() === parentLabel.toLowerCase())
      rows.push({
        parentLabel,
        subLabel: parentLabel,
        grade: realAsm?.letter_grade || realAsm?.predicate || '-'
      })
    }
  })
  return rows
}

const getRealDescTableAssessment = (itemName: string) => {
  if (!reportData.value?.assessments) return null
  const normalized = itemName.toLowerCase()
  return reportData.value.assessments.find((a: any) => 
    a.element_name.toLowerCase() === normalized
  ) || null
}

const getRealP5Row = (name: string) => {
  if (!reportData.value?.assessments) return '-'
  const normalized = name.toLowerCase()
  const found = reportData.value.assessments.find((a: any) => 
    a.element_name.toLowerCase().includes(normalized) || normalized.includes(a.element_name.toLowerCase())
  )
  return found?.letter_grade || found?.predicate || '-'
}

const formatDate = (dateStr: any) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 p-0 sm:p-6 print:p-0 print:bg-white print:text-black">
    <!-- Floating Toolbar (Hidden during Print) -->
    <div class="max-w-4xl mx-auto mb-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-md flex justify-between items-center print:hidden">
      <div class="flex items-center gap-2">
        <FileText class="text-violet-600" :size="20" />
        <div>
          <h1 class="text-sm font-bold text-slate-900 dark:text-zinc-100">Pratinjau Rapor Digital</h1>
          <p class="text-[10px] text-slate-500">Gunakan tombol print untuk mencetak rapor resmi A4.</p>
        </div>
      </div>
      <div class="flex gap-2 items-center">
        <!-- Dual format toggle for TK level only -->
        <div v-if="reportData?.student?.school_level === 'TK'" class="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-slate-200/60 dark:border-zinc-700 mr-2 print:hidden">
          <button 
            @click="selectedTKFormat = 'dinas'" 
            :class="[
              'px-3 py-1.5 text-[11px] font-bold rounded-md transition-all',
              selectedTKFormat === 'dinas' 
                ? 'bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-sm' 
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            ]"
          >
            Format Dinas
          </button>
          <button 
            @click="selectedTKFormat = 'intra'" 
            :class="[
              'px-3 py-1.5 text-[11px] font-bold rounded-md transition-all',
              selectedTKFormat === 'intra' 
                ? 'bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-sm' 
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            ]"
          >
            Format Sekolah (Intra)
          </button>
        </div>

        <!-- Template Selection Dropdown -->
        <div v-if="reportTemplates && reportTemplates.length > 0" class="flex items-center gap-1.5 mr-2 print:hidden">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest pl-1">Template:</label>
          <select 
            v-model="selectedTemplateId" 
            class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none transition-all focus:border-violet-600"
          >
            <option v-for="tpl in reportTemplates" :key="tpl.id" :value="tpl.id">
              {{ tpl.name }} {{ tpl.is_active ? '(Aktif)' : '' }}
            </option>
          </select>
        </div>
        <button @click="handlePrint" class="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-750 transition-colors shadow-lg shadow-violet-600/10">
          <Printer :size="14" /> Cetak Rapor
        </button>
        <button @click="handleClose" class="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors">
          <X :size="14" /> Tutup
        </button>
      </div>
    </div>

    <!-- Main Report Container -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-32">
      <div class="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin mb-4"></div>
      <p class="text-xs font-semibold text-slate-500">Memuat berkas rapor...</p>
    </div>

    <div v-else-if="!reportData" class="max-w-md mx-auto text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <ShieldAlert class="mx-auto text-rose-500 mb-3" :size="40" />
      <h2 class="font-bold text-slate-800 dark:text-zinc-200 text-sm">Rapor Tidak Ditemukan</h2>
      <p class="text-xs text-slate-400 mt-1 mb-6">Pastikan ID Rapor dan Unit Sekolah aktif Anda sesuai.</p>
      <button @click="handleClose" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">Kembali</button>
    </div>

    <!-- Dynamic Template-Driven Preview/Print Renderer -->
    <div 
      v-else-if="reportData.template?.widget_tree && Array.isArray(reportData.template.widget_tree) && reportData.template.widget_tree.length > 0"
      class="max-w-4xl mx-auto bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-none sm:rounded-2xl p-8 sm:p-12 print:p-[20mm_20mm] print:border-none print:shadow-none print:bg-white print:text-black shadow-sm space-y-6 print-sheet-canvas"
    >
      <div 
        v-for="w in reportData.template.widget_tree" 
        :key="w.id"
        class="text-left font-serif text-black dark:text-zinc-150 print:text-black"
      >
        <!-- 1. header_school -->
        <div v-if="w.type === 'header_school'" class="text-center border-b-4 border-double border-slate-900 dark:border-zinc-700 pb-3">
          <h2 class="text-md font-extrabold uppercase leading-tight tracking-wider">YAYASAN TURSINA SHALAWAT</h2>
          <h1 class="text-lg font-black uppercase leading-tight mt-0.5 tracking-widest text-violet-750 dark:text-violet-400">{{ reportData.student.school_name?.toUpperCase() }}</h1>
          <p v-if="w.props.showAddress" class="text-[9px] text-slate-600 dark:text-zinc-400 leading-normal mt-1 italic">
            {{ reportData.student.school_address }}
          </p>
          <p v-if="w.props.showNpsn" class="text-[8px] font-mono text-slate-500 font-bold mt-0.5">NPSN: {{ reportData.student.school_npsn }}</p>
        </div>

        <!-- 2. student_identity -->
        <div v-else-if="w.type === 'student_identity'" class="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px]">
          <div class="flex"><span class="w-24 shrink-0 font-bold uppercase">Nama Peserta Didik</span><span class="mr-2">:</span><span class="font-semibold">{{ reportData.student.full_name }}</span></div>
          <div class="flex"><span class="w-24 shrink-0 font-bold uppercase">Kelas / Fase</span><span class="mr-2">:</span><span>{{ reportData.student.class_name }} / {{ reportData.student.school_level === 'TK' ? 'Fondasi' : 'Merdeka' }}</span></div>
          <div v-if="w.props.showNisn" class="flex"><span class="w-24 shrink-0 font-bold uppercase">Nomor Induk / NISN</span><span class="mr-2">:</span><span class="font-mono">{{ reportData.student.student_number || '-' }} / {{ reportData.student.national_student_number || '-' }}</span></div>
          <div class="flex"><span class="w-24 shrink-0 font-bold uppercase">Semester</span><span class="mr-2">:</span><span>{{ reportData.report.semester === 'odd' ? '1 (Ganjil)' : '2 (Genap)' }}</span></div>
          <div class="flex"><span class="w-24 shrink-0 font-bold uppercase">Tahun Ajaran</span><span class="mr-2">:</span><span class="font-mono">{{ reportData.report.academic_year_name }}</span></div>
          <div v-if="w.props.showWali" class="flex"><span class="w-24 shrink-0 font-bold uppercase">Nama Orang Tua / Wali</span><span class="mr-2">:</span><span>{{ reportData.student.guardian_name || '-' }}</span></div>
        </div>

        <!-- 3. section_block -->
        <div v-else-if="w.type === 'section_block'" class="py-1">
          <h3 class="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-zinc-200">{{ w.props.title || 'SEKSI PROGRAM' }}</h3>
        </div>

        <!-- 4. page_break -->
        <div v-else-if="w.type === 'page_break'" class="print:break-after-page page-break py-4 print:py-0 border-t border-dashed border-rose-500 print:border-none relative">
          <span class="absolute -top-2.5 right-4 bg-white dark:bg-zinc-900 text-rose-500 text-[8px] font-black tracking-widest px-2 uppercase print:hidden">Batas Halaman Cetak</span>
        </div>

        <!-- 5. grade_table -->
        <div v-else-if="w.type === 'grade_table'" class="space-y-3">
          <table class="w-full text-left border-collapse border border-slate-800 dark:border-zinc-700 text-[10px]">
            <thead>
              <tr class="bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-b border-slate-800 dark:border-zinc-700 font-bold text-[9px] uppercase">
                <th v-for="col in w.props.cols.filter(c => c.visible)" :key="col.key" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center">
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(row, idx) in getGradeTableRows(w.props.items)" :key="idx">
                <!-- Group Header Row -->
                <tr v-if="row.type === 'group'" class="bg-slate-100/60 dark:bg-zinc-800/40 border-b border-slate-800 dark:border-zinc-700 font-bold">
                  <td :colspan="w.props.cols.filter(c => c.visible).length" class="p-2 pl-3 uppercase tracking-wider text-[9px] text-slate-800 dark:text-zinc-200 font-black">
                    {{ row.label }}
                  </td>
                </tr>
                
                <!-- Normal Subject Row -->
                <tr v-else class="border-b border-slate-800 dark:border-zinc-700 last:border-b-0">
                  <td v-if="w.props.cols.some(c => c.key === 'no' && c.visible)" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center font-bold">{{ row.no }}</td>
                  <td v-if="w.props.cols.some(c => c.key === 'name' && c.visible)" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 font-semibold" :class="{ 'pl-4': w.props.items.some(it => it.custom && it.subs && it.subs.length > 0) }">{{ row.label }}</td>
                  <td v-if="w.props.cols.some(c => c.key === 'kkm' && c.visible)" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center font-mono" :class="{ 'bg-amber-50/10 dark:bg-zinc-850': w.props.highlightKkm }">
                    {{ getRealSubjectGrade(row.label)?.kkm_score || w.props.kkm || 70 }}
                  </td>
                  <td v-if="w.props.cols.some(c => c.key === 'val' && c.visible)" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center font-mono font-bold" :class="{ 'text-rose-600 bg-rose-50/20': w.props.highlightKkm && Number(getRealSubjectGrade(row.label)?.final_score) < Number(getRealSubjectGrade(row.label)?.kkm_score || 70) }">
                    {{ getRealSubjectGrade(row.label)?.final_score || '-' }}
                  </td>
                  <td v-if="w.props.cols.some(c => c.key === 'pred' && c.visible)" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center font-bold">
                    {{ getRealSubjectGrade(row.label)?.predicate || '-' }}
                  </td>
                  <td v-if="w.props.cols.some(c => c.key === 'desc' && c.visible)" class="p-1.5 text-[9px] text-justify italic leading-relaxed text-slate-700 dark:text-zinc-400">
                    {{ getRealSubjectGrade(row.label)?.achievement_description || 'Belum ada deskripsi capaian kompetensi.' }}
                  </td>
                </tr>
              </template>
              <tr v-if="w.props.items.length === 0">
                <td :colspan="w.props.cols.filter(c => c.visible).length" class="p-6 text-center text-slate-400 italic">
                  Tidak ada mata pelajaran terpilih.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 6. desc_table -->
        <div v-else-if="w.type === 'desc_table'" class="space-y-4">
          <!-- Format B: List Langsung / Flattened -->
          <table v-if="!w.props.hasSub" class="w-full text-left border-collapse border border-slate-800 dark:border-zinc-700 text-[10px]">
            <thead>
              <tr class="bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-b border-slate-800 dark:border-zinc-700 font-bold text-[9px] uppercase">
                <th v-for="col in w.props.cols.filter(c => c.visible)" :key="col.key" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center">
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-if="w.props.items.some(it => it.subs && it.subs.length > 0)">
                <tr v-for="(subRow, sIdx) in getDescTableFlattenedRows(w.props.items)" :key="sIdx" class="border-b border-slate-800 dark:border-zinc-700 last:border-b-0">
                  <td v-if="w.props.cols.some(c => c.key === 'no' && c.visible)" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center font-bold">{{ sIdx + 1 }}.</td>
                  <td v-if="w.props.cols.some(c => c.key === 'name' && c.visible)" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 pl-2 leading-relaxed">
                    {{ subRow.subLabel }}
                    <span class="text-[8px] font-bold text-slate-450 block font-sans">Elemen: {{ subRow.parentLabel }}</span>
                  </td>
                  <td v-if="w.props.cols.some(c => c.key === 'val' && c.visible)" class="p-1.5 text-center font-bold text-violet-750 dark:text-violet-400">
                    {{ subRow.grade }}
                  </td>
                </tr>
              </template>
              
              <template v-else-if="w.props.items.length > 0">
                <tr v-for="(it, idx) in w.props.items" :key="idx" class="border-b border-slate-800 dark:border-zinc-700 last:border-b-0">
                  <td v-if="w.props.cols.some(c => c.key === 'no' && c.visible)" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center font-bold">{{ idx + 1 }}.</td>
                  <td v-if="w.props.cols.some(c => c.key === 'name' && c.visible)" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 pl-2 leading-relaxed font-bold">{{ it.label || it.name }}</td>
                  <td v-if="w.props.cols.some(c => c.key === 'val' && c.visible)" class="p-1.5 text-center font-bold text-violet-750 dark:text-violet-400">
                    {{ getRealDescTableAssessment(it.label || it.name)?.letter_grade || getRealDescTableAssessment(it.label || it.name)?.predicate || '-' }}
                  </td>
                </tr>
              </template>
              
              <tr v-else>
                <td :colspan="w.props.cols.filter(c => c.visible).length" class="p-6 text-center text-slate-400 italic">
                  Belum ada aspek capaian terpilih.
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Format A / Format C: Terkelompok / Grouped -->
          <div v-else v-for="(it, index) in w.props.items" :key="index" class="space-y-2">
            <div class="text-[10px] font-black uppercase text-slate-900 dark:text-zinc-200 flex justify-between bg-slate-50 dark:bg-zinc-800 p-1 border-b border-slate-200 dark:border-zinc-700">
              <span>{{ it.label || it.name }}</span>
              <span v-if="!w.props.perSub && w.props.cols.some(c => c.key === 'val' && c.visible)" class="text-violet-750 dark:text-violet-400 uppercase text-[9px] font-bold font-sans">
                {{ getRealDescTableAssessment(it.label || it.name)?.letter_grade || getRealDescTableAssessment(it.label || it.name)?.predicate || '-' }}
              </span>
            </div>
            
            <table v-if="it.subs && it.subs.length > 0" class="w-full text-left border-collapse border border-slate-800 dark:border-zinc-700 text-[10px]">
              <thead>
                <tr class="bg-slate-50/50 dark:bg-zinc-800/40 border-b border-slate-800 dark:border-zinc-700 font-bold text-[8px] uppercase">
                  <th v-for="col in w.props.cols.filter(c => c.visible)" :key="col.key" class="p-1 border-r border-slate-800 dark:border-zinc-700 text-center">
                    {{ col.label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(sub, sIdx) in it.subs" :key="sIdx" class="border-b border-slate-800 dark:border-zinc-700 last:border-b-0">
                  <td v-if="w.props.cols.some(c => c.key === 'no' && c.visible)" class="p-1 border-r border-slate-800 dark:border-zinc-700 text-center font-bold">{{ sIdx + 1 }}.</td>
                  <td v-if="w.props.cols.some(c => c.key === 'name' && c.visible)" class="p-1 border-r border-slate-800 dark:border-zinc-700 pl-2 leading-relaxed text-slate-700 dark:text-zinc-400">{{ sub.label || sub.name }}</td>
                  <td v-if="w.props.cols.some(c => c.key === 'val' && c.visible)" class="p-1 text-center font-bold text-violet-750 dark:text-violet-400" :class="{ 'text-slate-350 bg-slate-50 dark:bg-zinc-800': !w.props.perSub }">
                    {{ w.props.perSub ? (getRealDescTableAssessment(sub.label || sub.name)?.letter_grade || getRealDescTableAssessment(sub.label || sub.name)?.predicate || '-') : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="w.props.showNarasi" class="text-[9px] text-justify leading-relaxed p-2 bg-slate-50/60 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-850 rounded italic text-slate-750 dark:text-zinc-350">
              <strong>Narasi Capaian |</strong> {{ getRealDescTableAssessment(it.label || it.name)?.narrative || 'Belum ada narasi pencapaian.' }}
            </div>
          </div>
        </div>

        <!-- 7. subject_narrative -->
        <div v-else-if="w.type === 'subject_narrative'" class="space-y-4 text-[10px] text-justify leading-relaxed">
          <div v-for="(it, index) in w.props.items" :key="index" class="p-3 border border-slate-800 dark:border-zinc-700 rounded bg-slate-50/20">
            <strong class="text-[11px] uppercase block mb-1 border-b border-slate-200 dark:border-zinc-750 pb-0.5">{{ it.label || it.name }}</strong>
            {{ getRealDescTableAssessment(it.label || it.name)?.narrative || 'Belum ada narasi pencapaian.' }}
          </div>
        </div>

        <!-- 8. extracurricular -->
        <div v-else-if="w.type === 'extracurricular'">
          <table class="w-full text-left border-collapse border border-slate-800 dark:border-zinc-750 text-[10px]">
            <thead>
              <tr class="bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-b border-slate-800 dark:border-zinc-700 font-bold text-[9px] uppercase">
                <th v-for="col in w.props.cols.filter(c => c.visible)" :key="col.key" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center">
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ex, exIdx) in getRealExtracurriculars(w.props.items)" :key="exIdx" class="border-b border-slate-800 dark:border-zinc-700 last:border-b-0">
                <td v-if="w.props.cols.some(c => c.key === 'no' && c.visible)" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center">{{ exIdx + 1 }}</td>
                <td v-if="w.props.cols.some(c => c.key === 'name' && c.visible)" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 font-bold">{{ ex.name }}</td>
                <td v-if="w.props.cols.some(c => c.key === 'val' && c.visible)" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center font-bold">{{ ex.grade || '-' }}</td>
                <td v-if="w.props.cols.some(c => c.key === 'note' && c.visible)" class="p-1.5 leading-relaxed">{{ ex.description || '-' }}</td>
              </tr>
              <tr v-if="getRealExtracurriculars(w.props.items).length === 0">
                <td :colspan="w.props.cols.filter(c => c.visible).length" class="p-4 text-center text-slate-400 italic">
                  Tidak ada ekskul yang diikuti.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 9. p5_assessment -->
        <div v-else-if="w.type === 'p5_assessment'">
          <table class="w-full text-left border-collapse border border-slate-800 dark:border-zinc-750 text-[10px]">
            <thead>
              <tr class="bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-b border-slate-800 dark:border-zinc-700 font-bold text-[9px] uppercase">
                <th v-for="col in w.props.cols.filter(c => c.visible)" :key="col.key" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center">
                  {{ col.label }}
                </th>
                <th class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center w-10">MB</th>
                <th class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center w-10">SB</th>
                <th class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center w-10">BSH</th>
                <th class="p-1.5 text-center w-10">SAB</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in w.props.items" :key="idx" class="border-b border-slate-800 dark:border-zinc-700 last:border-b-0">
                <td v-if="w.props.cols.some(c => c.key === 'name' && c.visible)" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 font-bold">
                  {{ typeof it === 'string' ? it : it.label || it.name }}
                </td>
                <td v-if="w.props.cols.some(c => c.key === 'val' && c.visible)" class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center font-semibold">
                  {{ getRealP5Row(typeof it === 'string' ? it : it.label || it.name) }}
                </td>
                <td class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center font-bold text-violet-650">
                  {{ getRealP5Row(typeof it === 'string' ? it : it.label || it.name) === 'MB' ? '✓' : '' }}
                </td>
                <td class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center font-bold text-violet-650">
                  {{ getRealP5Row(typeof it === 'string' ? it : it.label || it.name) === 'SB' ? '✓' : '' }}
                </td>
                <td class="p-1.5 border-r border-slate-800 dark:border-zinc-700 text-center font-bold text-violet-650">
                  {{ getRealP5Row(typeof it === 'string' ? it : it.label || it.name) === 'BSH' ? '✓' : '' }}
                </td>
                <td class="p-1.5 text-center font-bold text-violet-650">
                  {{ getRealP5Row(typeof it === 'string' ? it : it.label || it.name) === 'SAB' ? '✓' : '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 10. attendance -->
        <div v-else-if="w.type === 'attendance'" class="w-80">
          <table class="w-full text-left border-collapse border border-slate-800 dark:border-zinc-750 text-[10px]">
            <thead>
              <tr class="bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-b border-slate-800 dark:border-zinc-700 font-bold text-[9px] uppercase">
                <th class="p-1.5 border-r border-slate-800 dark:border-zinc-700">Kategori Kehadiran</th>
                <th class="p-1.5 text-center w-24">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-slate-800 dark:border-zinc-700">
                <td class="p-1.5 border-r border-slate-800 dark:border-zinc-700 font-medium">Sakit (S)</td>
                <td class="p-1.5 text-center font-bold">{{ reportData.attendance.sick }} hari</td>
              </tr>
              <tr class="border-b border-slate-800 dark:border-zinc-700">
                <td class="p-1.5 border-r border-slate-800 dark:border-zinc-700 font-medium">Izin (I)</td>
                <td class="p-1.5 text-center font-bold">{{ reportData.attendance.leave }} hari</td>
              </tr>
              <tr class="border-b border-slate-800 dark:border-zinc-700 last:border-b-0">
                <td class="p-1.5 border-r border-slate-800 dark:border-zinc-700 font-medium">Tanpa Keterangan (A)</td>
                <td class="p-1.5 text-center font-bold">{{ reportData.attendance.absent }} hari</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 11. growth -->
        <div v-else-if="w.type === 'growth'" class="w-80">
          <table class="w-full text-left border-collapse border border-slate-800 dark:border-zinc-750 text-[10px]">
            <thead>
              <tr class="bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-b border-slate-800 dark:border-zinc-700 font-bold text-[9px] uppercase">
                <th class="p-1.5 border-r border-slate-800 dark:border-zinc-700">Aspek Tumbuh Kembang</th>
                <th class="p-1.5 text-center w-24">Ukuran</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-slate-800 dark:border-zinc-700">
                <td class="p-1.5 border-r border-slate-800 dark:border-zinc-700 font-medium">Tinggi Badan</td>
                <td class="p-1.5 text-center font-bold">{{ reportData.student.height ? `${reportData.student.height} cm` : '-' }}</td>
              </tr>
              <tr class="border-b border-slate-800 dark:border-zinc-700 last:border-b-0">
                <td class="p-1.5 border-r border-slate-800 dark:border-zinc-700 font-medium">Berat Badan</td>
                <td class="p-1.5 text-center font-bold">{{ reportData.student.weight ? `${reportData.student.weight} kg` : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 12. student_photo -->
        <div v-else-if="w.type === 'student_photo'" class="flex justify-start">
          <div class="w-24 h-32 border border-slate-400 dark:border-zinc-700 flex items-center justify-center text-[9px] text-slate-400 uppercase tracking-widest font-semibold bg-slate-50 dark:bg-zinc-950">
            Pas Foto<br>3 x 4
          </div>
        </div>

        <!-- 15. homeroom_notes -->
        <div v-else-if="w.type === 'homeroom_notes'" class="w-full">
          <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-3">Catatan Wali Kelas</h3>
          <div class="border border-slate-900 p-4 min-h-[92px] text-xs leading-relaxed text-justify text-slate-700 dark:text-zinc-300 print:text-black">
            {{ reportData.report.homeroom_notes || 'Belum ada catatan wali kelas.' }}
          </div>
        </div>

        <!-- 13. column_layout -->
        <div v-else-if="w.type === 'column_layout'" class="grid gap-4" :style="{ gridTemplateColumns: `repeat(${w.props.cols || 2}, 1fr)` }">
          <div v-for="colIdx in (w.props.cols || 2)" :key="colIdx" class="space-y-4">
             <!-- Render nested items inside this column -->
             <div v-for="nestedW in (w.props.columns?.[colIdx - 1] || [])" :key="nestedW.id">
                
                <!-- 1. header_school inside column -->
                <div v-if="nestedW.type === 'header_school'" class="text-center border-b-4 border-double border-slate-900 dark:border-zinc-700 pb-3">
                  <h2 class="text-md font-extrabold uppercase leading-tight tracking-wider">YAYASAN TURSINA SHALAWAT</h2>
                  <h1 class="text-lg font-black uppercase leading-tight mt-0.5 tracking-widest text-violet-750 dark:text-violet-400">{{ reportData.student.school_name?.toUpperCase() }}</h1>
                  <p v-if="nestedW.props.showAddress" class="text-[9px] text-slate-600 dark:text-zinc-400 leading-normal mt-1 italic">
                    {{ reportData.student.school_address }}
                  </p>
                  <p v-if="nestedW.props.showNpsn" class="text-[8px] font-mono text-slate-500 font-bold mt-0.5">NPSN: {{ reportData.student.school_npsn }}</p>
                </div>

                <!-- 2. student_identity inside column -->
                <div v-else-if="nestedW.type === 'student_identity'" class="grid grid-cols-1 gap-y-1 text-[10px]">
                  <div class="flex"><span class="w-24 shrink-0 font-bold uppercase">Nama Siswa</span><span class="mr-2">:</span><span class="font-semibold">{{ reportData.student.full_name }}</span></div>
                  <div class="flex"><span class="w-24 shrink-0 font-bold uppercase">Kelas</span><span class="mr-2">:</span><span>{{ reportData.student.class_name }}</span></div>
                  <div v-if="nestedW.props.showNisn" class="flex"><span class="w-24 shrink-0 font-bold uppercase">NISN</span><span class="mr-2">:</span><span class="font-mono">{{ reportData.student.national_student_number || '-' }}</span></div>
                </div>

                <!-- 3. section_block inside column -->
                <div v-else-if="nestedW.type === 'section_block'" class="py-1">
                  <h3 class="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-zinc-200">{{ nestedW.props.title || 'SEKSI PROGRAM' }}</h3>
                </div>

                <!-- 4. page_break inside column -->
                <div v-else-if="nestedW.type === 'page_break'" class="print:break-after-page page-break py-2 print:py-0 border-t border-dashed border-rose-500 print:border-none relative">
                  <span class="absolute -top-2.5 right-4 bg-white dark:bg-zinc-900 text-rose-500 text-[8px] font-black tracking-widest px-2 uppercase print:hidden">Batas Halaman Cetak</span>
                </div>

                <!-- 10. attendance inside column -->
                <div v-else-if="nestedW.type === 'attendance'" class="w-full">
                  <table class="w-full text-left border-collapse border border-slate-800 dark:border-zinc-700 text-[10px]">
                    <thead>
                      <tr class="bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-b border-slate-800 dark:border-zinc-700 font-bold text-[9px] uppercase">
                        <th class="p-1.5 border-r border-slate-800 dark:border-zinc-700">Kategori Kehadiran</th>
                        <th class="p-1.5 text-center w-16">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="border-b border-slate-800 dark:border-zinc-700">
                        <td class="p-1.5 border-r border-slate-800 dark:border-zinc-700 font-medium">Sakit (S)</td>
                        <td class="p-1.5 text-center font-bold">{{ reportData.attendance.sick }} hari</td>
                      </tr>
                      <tr class="border-b border-slate-800 dark:border-zinc-700">
                        <td class="p-1.5 border-r border-slate-800 dark:border-zinc-700 font-medium">Izin (I)</td>
                        <td class="p-1.5 text-center font-bold">{{ reportData.attendance.leave }} hari</td>
                      </tr>
                      <tr class="border-b border-slate-800 dark:border-zinc-700 last:border-b-0">
                        <td class="p-1.5 border-r border-slate-800 dark:border-zinc-700 font-medium">Tanpa Keterangan (A)</td>
                        <td class="p-1.5 text-center font-bold">{{ reportData.attendance.absent }} hari</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- 11. growth inside column -->
                <div v-else-if="nestedW.type === 'growth'" class="w-full">
                  <table class="w-full text-left border-collapse border border-slate-800 dark:border-zinc-700 text-[10px]">
                    <thead>
                      <tr class="bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-b border-slate-800 dark:border-zinc-700 font-bold text-[9px] uppercase">
                        <th class="p-1.5 border-r border-slate-800 dark:border-zinc-700">Aspek Tumbuh Kembang</th>
                        <th class="p-1.5 text-center w-16">Ukuran</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="border-b border-slate-800 dark:border-zinc-700">
                        <td class="p-1.5 border-r border-slate-800 dark:border-zinc-700 font-medium">Tinggi Badan</td>
                        <td class="p-1.5 text-center font-bold">{{ reportData.student.height ? `${reportData.student.height} cm` : '-' }}</td>
                      </tr>
                      <tr class="border-b border-slate-800 dark:border-zinc-700 last:border-b-0">
                        <td class="p-1.5 border-r border-slate-800 dark:border-zinc-700 font-medium">Berat Badan</td>
                        <td class="p-1.5 text-center font-bold">{{ reportData.student.weight ? `${reportData.student.weight} kg` : '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- 12. student_photo inside column -->
                <div v-else-if="nestedW.type === 'student_photo'" class="flex justify-start">
                  <div class="w-24 h-32 border border-slate-400 dark:border-zinc-700 flex items-center justify-center text-[9px] text-slate-400 uppercase tracking-widest font-semibold bg-slate-50 dark:bg-zinc-950">
                    Pas Foto<br>3 x 4
                  </div>
                </div>

                <!-- 15. homeroom_notes inside column -->
                <div v-else-if="nestedW.type === 'homeroom_notes'" class="w-full">
                  <h4 class="text-xs font-black uppercase border-b border-slate-900 pb-0.5 mb-2">Catatan Wali Kelas</h4>
                  <div class="border border-slate-900 p-3 min-h-[70px] text-[10px] leading-relaxed text-justify text-slate-700 dark:text-zinc-300 print:text-black">
                    {{ reportData.report.homeroom_notes || 'Belum ada catatan wali kelas.' }}
                  </div>
                </div>

                <!-- 14. signature_block inside column -->
                <div v-else-if="nestedW.type === 'signature_block'" class="text-[10px] gap-8 pt-4">
                  <div class="space-y-12">
                    <span>{{ nestedW.props.place || 'Karanganyar' }}, {{ nestedW.props.date || '20 Desember 2026' }}<br>Mengetahui, Kepala Sekolah</span>
                    <div class="border-t border-slate-900 dark:border-zinc-700 pt-1 font-bold">{{ nestedW.props.kepsek || reportData.student.principal_name }}</div>
                  </div>
                </div>

             </div>
          </div>
        </div>

        <!-- 14. signature_block -->
        <div v-else-if="w.type === 'signature_block'" class="grid grid-cols-3 text-center text-[10px] gap-8 pt-4">
          <div class="space-y-12">
            <span>Orang Tua / Wali Siswa</span>
            <div class="border-t border-slate-900 dark:border-zinc-700 pt-1 font-bold">(...................................................)</div>
          </div>
          <div class="space-y-12">
            <span>Guru Kelas / Wali Kelas</span>
            <div class="border-t border-slate-900 dark:border-zinc-700 pt-1 font-bold">{{ reportData.student.homeroom_teacher_name }}</div>
          </div>
          <div class="space-y-12">
            <span>{{ w.props.place || 'Karanganyar' }}, {{ w.props.date || '20 Desember 2026' }}<br>Mengetahui, Kepala Sekolah</span>
            <div class="border-t border-slate-900 dark:border-zinc-700 pt-1 font-bold">{{ w.props.kepsek || reportData.student.principal_name }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fallback Legacy Hardcoded Renderer -->
    <div 
      v-else-if="reportData"
      class="print-report-container"
      :class="[
        reportData.student.school_level === 'TK' && selectedTKFormat === 'dinas' ? 'dinas-format' : 'standard-format',
        'max-w-4xl mx-auto print:border-none print:shadow-none print:bg-white print:text-black shadow-sm print-sheet-canvas',
        reportData.student.school_level === 'TK' && selectedTKFormat === 'dinas' 
          ? 'bg-transparent border-none p-0 space-y-6 shadow-none' 
          : 'bg-white dark:bg-zinc-900 border border-slate-300/60 dark:border-zinc-800 rounded-none sm:rounded-2xl p-8 sm:p-12 print:p-[20mm_20mm]'
      ]"
    >
      
      <!-- Report Header (shown for non-TK-Dinas formats) -->
      <div v-if="reportData.student.school_level !== 'TK' || selectedTKFormat !== 'dinas'" class="text-center border-b-2 border-slate-900 pb-6 mb-8 print:pb-4 print:mb-6">
        <h2 class="text-lg font-black uppercase tracking-wide">{{ reportData.student.school_name }}</h2>
        <p class="text-xs font-semibold">{{ reportData.student.school_address }}</p>
        <p class="text-[10px] text-slate-500 font-medium">NPSN: {{ reportData.student.school_npsn || '-' }} | NSM: {{ reportData.student.school_nsm || '-' }}</p>
      </div>

      <!-- Student & Period Metadata Grid (shown for non-TK-Dinas formats) -->
      <div v-if="reportData.student.school_level !== 'TK' || selectedTKFormat !== 'dinas'" class="grid grid-cols-2 gap-4 text-xs font-semibold mb-8 print:mb-6">
        <div class="space-y-1">
          <div class="flex"><span class="w-24 text-slate-500">Nama Siswa</span><span class="mr-2">:</span><span class="text-slate-900 dark:text-zinc-100 print:text-black">{{ reportData.student.full_name }}</span></div>
          <div class="flex"><span class="w-24 text-slate-500">NIS / NISN</span><span class="mr-2">:</span><span>{{ reportData.student.student_number || '-' }} / {{ reportData.student.national_student_number || '-' }}</span></div>
          <div class="flex"><span class="w-24 text-slate-500">Kelas Rombel</span><span class="mr-2">:</span><span>{{ reportData.student.class_name }}</span></div>
        </div>
        <div class="space-y-1 pl-4 border-l border-slate-200 print:border-slate-300">
          <div class="flex"><span class="w-28 text-slate-500">Tahun Ajaran</span><span class="mr-2">:</span><span>Semester {{ reportData.report.semester === 'odd' ? 'Ganjil' : 'Genap' }}</span></div>
          <div class="flex"><span class="w-28 text-slate-500">Kurikulum</span><span class="mr-2">:</span><span class="uppercase">{{ reportData.student.school_level === 'TK' ? 'Kurikulum Merdeka PAUD' : 'Kurikulum Merdeka' }}</span></div>
          <div class="flex"><span class="w-28 text-slate-500">Tanggal Terbit</span><span class="mr-2">:</span><span>{{ formatDate(reportData.report.generated_at || reportData.report.created_at) }}</span></div>
        </div>
      </div>

      <!-- ─── JENJANG TK / PAUD TEMPLATE ─── -->
      <div v-if="reportData.student.school_level === 'TK'" class="space-y-8 print:space-y-6">
        
        <!-- ══════ FORMAT DINAS (2-page layout) ══════ -->
        <div v-if="selectedTKFormat === 'dinas'" class="space-y-0 text-black dark:text-zinc-100">

          <!-- ── PAGE 1: Header + Intrakurikuler ── -->
          <div
            class="print-page bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-none sm:rounded-2xl p-8 sm:p-12 min-h-[29.7cm] flex flex-col justify-between"
            style="page-break-after: always; break-after: page;"
          >
            <div>
              <!-- Dinas Page Header -->
              <div class="flex items-center justify-between border-b-2 border-slate-900 dark:border-zinc-700 pb-3 mb-6">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg select-none">TK</div>
                  <div class="text-left">
                    <h2 class="text-xs font-black tracking-wide uppercase">{{ reportData.student.school_name || 'TAMAN KANAK-KANAK' }}</h2>
                    <h1 class="text-sm font-black uppercase">LAPORAN PERKEMBANGAN PESERTA DIDIK</h1>
                    <p class="text-[10px] font-bold uppercase tracking-wider">KELOMPOK B</p>
                    <p class="text-[9px] font-bold">
                      Semester {{ reportData.report.semester === 'odd' ? 'I' : 'II' }} - Tahun Ajaran {{ reportData.report.academic_year_name || '2025/2026' }}
                    </p>
                  </div>
                </div>
                <div class="text-right flex flex-col items-end">
                  <div class="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center text-white font-extrabold text-xs">R</div>
                  <span class="text-[8px] font-black text-slate-500 dark:text-zinc-400 uppercase mt-1">{{ reportData.student.school_name?.substring(0, 8) || 'Rapor' }}</span>
                </div>
              </div>

              <!-- Student Info Bar -->
              <div class="flex justify-between items-center bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 mb-6 text-xs font-bold text-slate-700 dark:text-zinc-300">
                <div class="flex gap-2">
                  <span>Nama Anak Didik:</span>
                  <span class="text-slate-950 dark:text-zinc-100 underline decoration-slate-400 dark:decoration-zinc-700 underline-offset-4">{{ reportData.student.full_name }}</span>
                </div>
                <div class="flex gap-2">
                  <span>No. Urut:</span>
                  <span class="text-slate-950 dark:text-zinc-100 font-black">{{ reportData.student.student_number || '-' }}</span>
                </div>
              </div>

              <!-- A. Program Intrakurikuler -->
              <div class="space-y-4">
                <h3 class="text-sm font-black uppercase tracking-wider mb-2">A. Program Intrakurikuler</h3>
                <table class="w-full text-left border-2 border-slate-950 dark:border-zinc-700 text-[11px] border-collapse print:bg-white print:text-black">
                  <thead>
                    <tr class="bg-slate-50 dark:bg-zinc-950/40 border-b-2 border-slate-950 dark:border-zinc-700 font-black">
                      <th class="p-2 border-r border-slate-950 dark:border-zinc-700 w-10 text-center">No.</th>
                      <th class="p-2 border-r border-slate-950 dark:border-zinc-700">ELEMEN CAPAIAN</th>
                      <th class="p-2 text-center w-20">Capaian</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-if="intraCategories && intraCategories.length > 0">
                      <template v-for="(cat, cIdx) in intraCategories" :key="cat.id">
                        <tr class="border-b border-slate-950 dark:border-zinc-700 bg-slate-100/50 dark:bg-zinc-900/60 font-black">
                          <td class="p-2 border-r border-slate-950 dark:border-zinc-700 text-center font-bold">{{ cIdx + 1 }}.</td>
                          <td class="p-2 border-r border-slate-950 dark:border-zinc-700 font-black uppercase" colspan="2">{{ cat.title }}</td>
                        </tr>
                        <template v-for="(sub, subIdx) in cat.subAssessments" :key="subIdx">
                          <tr class="border-b border-slate-950 dark:border-zinc-700 text-[10px]">
                            <td class="p-2 border-r border-slate-950 dark:border-zinc-700"></td>
                            <td class="p-2 border-r border-slate-950 dark:border-zinc-700 leading-snug pl-4">{{ subIdx + 1 }}. {{ sub.name }}</td>
                            <td class="p-2 text-center font-black bg-slate-50/20 dark:bg-zinc-950/20">{{ sub.grade }}</td>
                          </tr>
                        </template>
                        <tr class="border-b-2 border-slate-950 dark:border-zinc-700 last:border-b-0">
                          <td colspan="3" class="p-3 text-justify leading-relaxed bg-white dark:bg-zinc-950 text-[10px]">
                            <strong>Narasi |</strong> {{ cat.narrative }}
                          </td>
                        </tr>
                      </template>
                    </template>
                    <template v-else>
                      <tr>
                        <td colspan="3" class="p-4 text-center text-slate-400">
                          Tata letak Rapor Dinas belum dikonfigurasi. Silakan lakukan pemetaan elemen di menu Template Rapor.
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ── PAGE 2: Kokurikuler + Attendance + Signatures ── -->
          <div
            class="print-page bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-none sm:rounded-2xl p-8 sm:p-12 min-h-[29.7cm] flex flex-col justify-between"
            style="page-break-before: always; break-before: page;"
          >
            <div class="space-y-4">
              <!-- B. Program Kurikuler (Kokurikuler P5) -->
              <div>
                <h3 class="text-sm font-black uppercase tracking-wider mb-2">B. Program Kurikuler</h3>

                <!-- Foto Kegiatan -->
                <div v-if="activityPhotos && activityPhotos.length > 0" class="space-y-1 mb-3">
                  <div class="text-[9px] font-bold uppercase text-slate-500 dark:text-zinc-400">Foto Kegiatan</div>
                  <div class="grid grid-cols-3 gap-3">
                    <div
                      v-for="(photo, idx) in activityPhotos.slice(0, 3)"
                      :key="idx"
                      class="aspect-[16/9] max-h-[85px] border border-slate-300 dark:border-zinc-800 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-950 flex items-center justify-center"
                    >
                      <img :src="photo.url || photo" :alt="photo.caption || `Foto ${idx + 1}`" class="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>

                <!-- P5 Narrative & Matrix -->
                <template v-if="p5Category">
                  <div class="space-y-3">
                    <div class="text-[9.5px] text-justify leading-relaxed text-slate-800 dark:text-zinc-200">
                      <strong>Narasi |</strong> {{ p5Category.narrative }}
                    </div>
                    <div class="border-2 border-slate-950 dark:border-zinc-700 p-2.5 bg-slate-50 dark:bg-zinc-950/40 text-[9px] leading-relaxed text-justify dark:text-zinc-300">
                      <strong>Projek 1 | {{ p5Category.title }} :</strong>
                      Projek ini dapat menguatkan karakter dan kemampuan anak dalam dimensi profil lulusan.
                      <span class="italic font-semibold">Dimensi Keimanan dan Ketaqwaan terhadap Tuhan YME</span> dimana murid melakukan interaksi dengan sesama dengan bimbingan orang dewasa.
                      <span class="italic font-semibold">Dimensi Kreativitas</span> dimana murid mengeksplorasi bentuk karya dan/atau tindakan sederhana menggunakan keterampilan motorik halus.
                      <span class="italic font-semibold">Dimensi Kolaborasi</span> dimana murid mengenali perilaku kerjasama dengan orang lain pada kegiatan bermain dan interaksi di sekolah.
                      <span class="italic font-semibold">Dimensi Komunikasi</span> murid dapat menyampaikan, menggali dan menanggapi secara lisan berbagai jenis informasi.
                    </div>
                    <!-- P5 Dimensions Matrix Table -->
                    <div class="space-y-2 mt-3">
                      <table class="w-full text-left border-2 border-slate-950 dark:border-zinc-700 text-[9px] border-collapse table-fixed">
                        <thead>
                          <tr class="bg-slate-100 dark:bg-zinc-900/60 border-b-2 border-slate-950 dark:border-zinc-700">
                            <th class="p-1 border-r border-slate-950 dark:border-zinc-700 font-black text-center align-middle" rowspan="2" style="width: 20%;">Projek Kelas B2</th>
                            <th class="p-1 border-r border-slate-950 dark:border-zinc-700 text-center font-bold" :colspan="activeP5Dimensions.length">Dimensi Profil Pelajar Pancasila</th>
                          </tr>
                          <tr class="bg-slate-50 dark:bg-zinc-950/40 border-b border-slate-950 dark:border-zinc-700 text-[8px] h-[100px]">
                            <template v-for="(dim, idx) in activeP5Dimensions" :key="dim.id">
                              <th :class="[{ 'border-r border-slate-950 dark:border-zinc-700': idx < activeP5Dimensions.length - 1 }, 'p-1 text-center font-bold align-middle']">
                                <div class="vertical-text-header">{{ dim.name }}</div>
                              </th>
                            </template>
                          </tr>
                        </thead>
                        <tbody>
                          <tr class="border-b-0 font-black text-center">
                            <td class="p-2 border-r border-slate-950 dark:border-zinc-700 font-bold bg-slate-50 dark:bg-zinc-950/40 text-left whitespace-normal break-words text-[8.5px] leading-tight">
                              {{ p5Category.title }}
                            </td>
                            <template v-for="(dim, idx) in activeP5Dimensions" :key="dim.id">
                              <td :class="[{ 'border-r border-slate-950 dark:border-zinc-700': idx < activeP5Dimensions.length - 1 }, 'p-1 text-center font-black']">
                                {{ p5Category.p5_dimensions?.[dim.id] || '-' }}
                              </td>
                            </template>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="text-xs text-center text-slate-400 p-4 border border-dashed rounded-lg">
                    Dimensi Projek Kurikuler belum dipetakan.
                  </div>
                </template>
              </div>

              <!-- Attendance, Legend, Growth Grid -->
              <div class="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4">
                <!-- Legend -->
                <div class="md:col-span-5 border-2 border-slate-950 dark:border-zinc-700 p-2 rounded-lg text-[8.5px] space-y-1 bg-white dark:bg-zinc-950 dark:text-zinc-350">
                  <div class="font-black border-b border-slate-300 dark:border-zinc-800 pb-0.5 mb-0.5 uppercase text-slate-800 dark:text-zinc-200">Kategori Perkembangan Kemampuan & Penilaian</div>
                  <div class="flex justify-between"><span><strong>BB</strong> : Belum Berkembang</span></div>
                  <div class="flex justify-between"><span><strong>MB</strong> : Mulai Berkembang</span></div>
                  <div class="flex justify-between"><span><strong>BSH</strong> : Berkembang Sesuai Harapan</span></div>
                  <div class="flex justify-between"><span><strong>BSB</strong> : Berkembang Sangat Baik</span></div>
                </div>
                <!-- Attendance & Growth -->
                <div class="md:col-span-7 grid grid-cols-2 gap-3 text-[8.5px]">
                  <!-- Attendance -->
                  <div class="border-2 border-slate-950 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
                    <div class="bg-slate-100 dark:bg-zinc-900/60 p-1 font-black border-b-2 border-slate-950 dark:border-zinc-700 uppercase text-center text-[8px] text-slate-800 dark:text-zinc-200">A. Ketidakhadiran</div>
                    <table class="w-full text-left">
                      <tbody>
                        <tr class="border-b border-slate-950 dark:border-zinc-700">
                          <td class="p-1 pl-2 border-r border-slate-950 dark:border-zinc-700">1. Sakit</td>
                          <td class="p-1 text-center w-14 font-bold">{{ reportData.attendance?.sick ?? '-' }} (Hari)</td>
                        </tr>
                        <tr class="border-b border-slate-950 dark:border-zinc-700">
                          <td class="p-1 pl-2 border-r border-slate-950 dark:border-zinc-700">2. Izin</td>
                          <td class="p-1 text-center font-bold">{{ reportData.attendance?.leave ?? '-' }}</td>
                        </tr>
                        <tr class="border-b border-slate-950 dark:border-zinc-700">
                          <td class="p-1 pl-2 border-r border-slate-950 dark:border-zinc-700">3. Tanpa Keterangan</td>
                          <td class="p-1 text-center font-bold">{{ reportData.attendance?.absent ?? '-' }}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div class="bg-slate-100 dark:bg-zinc-900/60 p-0.5 font-black border-b border-slate-950 dark:border-zinc-700 uppercase text-center text-[8px] text-slate-800 dark:text-zinc-200">B. Keterlambatan</div>
                    <div class="p-0.5 text-center font-bold">-</div>
                  </div>
                  <!-- Physical Growth -->
                  <div class="border-2 border-slate-950 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-950 flex flex-col h-full">
                    <div class="bg-slate-100 dark:bg-zinc-900/60 p-1 font-black border-b-2 border-slate-950 dark:border-zinc-700 uppercase text-center text-[8px] text-slate-800 dark:text-zinc-200">C. Tumbuh Kembang Anak</div>
                    <table class="w-full text-left flex-1">
                      <tbody>
                        <tr class="border-b border-slate-950 dark:border-zinc-700">
                          <td class="p-1 pl-2 border-r border-slate-950 dark:border-zinc-700">1. Berat Badan</td>
                          <td class="p-1 text-center w-20 font-bold">{{ reportData.student.weight || '-' }} kg</td>
                        </tr>
                        <tr class="dark:border-zinc-700">
                          <td class="p-1 pl-2 border-r border-slate-950 dark:border-zinc-700">2. Tinggi Badan</td>
                          <td class="p-1 text-center w-20 font-bold">{{ reportData.student.height || '-' }} cm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dinas Signatures Footer -->
            <div class="mt-6 text-[10px] font-semibold text-slate-950 dark:text-zinc-300 print:mt-4">
              <div class="grid grid-cols-2 gap-4 text-center">
                <div class="flex flex-col justify-between h-[80px]">
                  <p>Orang Tua Anak Didik</p>
                  <p class="underline">____________________</p>
                </div>
                <div class="flex flex-col justify-between h-[80px]">
                  <div>
                    <p class="text-xs mb-1">{{ reportData.student.school_address?.split(',')[1]?.trim() || 'Karanganyar' }}, {{ formatDate(reportData.report.generated_at || reportData.report.created_at) }}</p>
                    <p>Guru Kelas</p>
                  </div>
                  <p class="font-bold underline">{{ reportData.student.homeroom_teacher_name || 'Wahyuli, S.Pd.' }}</p>
                </div>
              </div>
              <div class="mt-6 text-center flex flex-col justify-between h-[80px] max-w-xs mx-auto">
                <p>Mengetahui,<br>Kepala {{ reportData.student.school_name || 'TK' }}</p>
                <p class="font-bold underline">{{ reportData.student.principal_name || 'Puji Wuryanti, S.Pd.' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ══════ FORMAT SEKOLAH (INTRA) ══════ -->
        <div v-else class="space-y-8 print:space-y-6">
          <!-- Tema & Penilaian Legend Header -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
            <!-- Tema Semester -->
            <div class="bg-slate-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800 print:bg-white print:border-slate-300">
              <h4 class="text-xs font-extrabold text-slate-900 dark:text-zinc-100 print:text-black mb-2 uppercase">Tema – Semester I:</h4>
              <ul class="list-decimal pl-4 text-xs space-y-1 text-slate-600 dark:text-zinc-400 print:text-black">
                <li>Aku Milik Allah</li>
                <li>Pejuang Islam Negeriku</li>
                <li>Eksplorasi Islam #1</li>
                <li>Eksplorasi Islam #2</li>
                <li>Flora Fauna Ciptaan Allah</li>
              </ul>
            </div>

            <!-- Kategori Penilaian Legend -->
            <div class="bg-slate-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800 print:bg-white print:border-slate-300">
              <h4 class="text-xs font-extrabold text-slate-900 dark:text-zinc-100 print:text-black mb-2 uppercase">Kategori Penilaian:</h4>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="flex items-center gap-1.5"><span class="font-black text-violet-650 dark:text-violet-400 print:text-black">BS</span> <span class="text-slate-550 dark:text-zinc-450 print:text-slate-700">: Baik Sekali</span></div>
                <div class="flex items-center gap-1.5"><span class="font-black text-violet-650 dark:text-violet-400 print:text-black">B</span> <span class="text-slate-550 dark:text-zinc-450 print:text-slate-700">: Baik</span></div>
                <div class="flex items-center gap-1.5"><span class="font-black text-violet-650 dark:text-violet-400 print:text-black">C</span> <span class="text-slate-550 dark:text-zinc-450 print:text-slate-700">: Cukup</span></div>
                <div class="flex items-center gap-1.5"><span class="font-black text-violet-650 dark:text-violet-400 print:text-black">K</span> <span class="text-slate-550 dark:text-zinc-450 print:text-slate-700">: Kurang</span></div>
              </div>
            </div>
          </div>

          <!-- Aspek Amatan Checklist Table -->
          <div>
            <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">I. Kategori Perkembangan Kemampuan &amp; Penilaian</h3>
            <table class="w-full text-left border border-slate-900 text-xs">
              <thead>
                <tr class="bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-b border-slate-900 dark:border-zinc-700 font-bold">
                  <th class="p-2 border-r border-slate-900 w-12 text-center">No</th>
                  <th class="p-2 border-r border-slate-900">ASPEK AMATAN</th>
                  <th class="p-2 border-r border-slate-900 text-center w-12">K</th>
                  <th class="p-2 border-r border-slate-900 text-center w-12">C</th>
                  <th class="p-2 border-r border-slate-900 text-center w-12">B</th>
                  <th class="p-2 text-center w-12">BS</th>
                </tr>
              </thead>
              <tbody>
                <!-- Group I -->
                <tr class="bg-slate-100 dark:bg-zinc-900/60 font-bold border-b border-slate-900">
                  <td colspan="6" class="p-2">I. Perkembangan Potensi Pribadi</td>
                </tr>
                <tr v-for="(asm, index) in intraGroup1" :key="asm.element_id" class="border-b border-slate-900">
                  <td class="p-2 border-r border-slate-900 text-center">{{ index + 1 }}</td>
                  <td class="p-2 border-r border-slate-900">{{ asm.element_name }}</td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'K'}">
                    <span v-if="asm.letter_grade === 'K'">✓</span>
                  </td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'C'}">
                    <span v-if="asm.letter_grade === 'C'">✓</span>
                  </td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'B'}">
                    <span v-if="asm.letter_grade === 'B'">✓</span>
                  </td>
                  <td class="p-2 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'BS'}">
                    <span v-if="asm.letter_grade === 'BS'">✓</span>
                  </td>
                </tr>

                <!-- Group II -->
                <tr class="bg-slate-100 dark:bg-zinc-900/60 font-bold border-b border-slate-900">
                  <td colspan="6" class="p-2">II. Sikap Belajar</td>
                </tr>
                <tr v-for="(asm, index) in intraGroup2" :key="asm.element_id" class="border-b border-slate-900">
                  <td class="p-2 border-r border-slate-900 text-center">{{ index + 1 }}</td>
                  <td class="p-2 border-r border-slate-900">{{ asm.element_name }}</td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'K'}">
                    <span v-if="asm.letter_grade === 'K'">✓</span>
                  </td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'C'}">
                    <span v-if="asm.letter_grade === 'C'">✓</span>
                  </td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'B'}">
                    <span v-if="asm.letter_grade === 'B'">✓</span>
                  </td>
                  <td class="p-2 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'BS'}">
                    <span v-if="asm.letter_grade === 'BS'">✓</span>
                  </td>
                </tr>

                <!-- Group III -->
                <tr class="bg-slate-100 dark:bg-zinc-900/60 font-bold border-b border-slate-900">
                  <td colspan="6" class="p-2">III. Perkembangan Potensi Kemampuan Dasar</td>
                </tr>
                <tr v-for="(asm, index) in intraGroup3" :key="asm.element_id" class="border-b border-slate-900 last:border-b-0">
                  <td class="p-2 border-r border-slate-900 text-center">{{ index + 1 }}</td>
                  <td class="p-2 border-r border-slate-900">{{ asm.element_name }}</td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'K'}">
                    <span v-if="asm.letter_grade === 'K'">✓</span>
                  </td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'C'}">
                    <span v-if="asm.letter_grade === 'C'">✓</span>
                  </td>
                  <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'B'}">
                    <span v-if="asm.letter_grade === 'B'">✓</span>
                  </td>
                  <td class="p-2 text-center font-bold" :class="{'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 print:bg-slate-200': asm.letter_grade === 'BS'}">
                    <span v-if="asm.letter_grade === 'BS'">✓</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Narasi Pencapaian Hasil Belajar -->
          <div>
            <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">Narasi Pencapaian Hasil Belajar - Semester I</h3>
            <div class="space-y-4">
              <div class="bg-slate-50 dark:bg-zinc-950/40 p-4 rounded-lg border border-slate-200/60 dark:border-zinc-800 print:bg-white print:p-0 print:border-none">
                <span class="text-xs font-bold text-slate-900 dark:text-zinc-100 print:text-black block mb-1.5">1. Catatan Perkembangan Pribadi &amp; Sikap Belajar</span>
                <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed text-justify print:text-black">
                  {{ intraPribadiNarrative || 'Belum ada catatan perkembangan pribadi.' }}
                </p>
              </div>
              <div class="bg-slate-50 dark:bg-zinc-950/40 p-4 rounded-lg border border-slate-200/60 dark:border-zinc-800 print:bg-white print:p-0 print:border-none">
                <span class="text-xs font-bold text-slate-900 dark:text-zinc-100 print:text-black block mb-1.5">2. Catatan Keterampilan Motorik</span>
                <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed text-justify print:text-black">
                  {{ intraMotorikNarrative || 'Belum ada catatan keterampilan motorik.' }}
                </p>
              </div>
              <div class="bg-slate-50 dark:bg-zinc-950/40 p-4 rounded-lg border border-slate-200/60 dark:border-zinc-800 print:bg-white print:p-0 print:border-none">
                <span class="text-xs font-bold text-slate-900 dark:text-zinc-100 print:text-black block mb-1.5">3. Catatan Kegiatan Keagamaan &amp; Ibadah</span>
                <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed text-justify print:text-black">
                  {{ intraAgamaNarrative || 'Belum ada catatan kegiatan keagamaan.' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Shared Sections for Intra format only -->
        <div v-if="selectedTKFormat !== 'dinas'" class="space-y-8">
          <!-- Extracurricular Section -->
          <div>
            <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">II. Kegiatan Ekstrakurikuler</h3>
            <table class="w-full text-left border border-slate-900 text-xs">
              <thead>
                <tr class="bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-b border-slate-900 dark:border-zinc-700 font-bold">
                  <th class="p-2 border-r border-slate-900 w-1/3">Kegiatan Ekstrakurikuler</th>
                  <th class="p-2 border-r border-slate-900 text-center w-24">Predikat</th>
                  <th class="p-2">Deskripsi / Capaian</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ex in reportData.extracurriculars" :key="ex.extracurricular_name" class="border-b border-slate-900 last:border-0">
                  <td class="p-2 border-r border-slate-900 font-bold">{{ ex.extracurricular_name }}</td>
                  <td class="p-2 border-r border-slate-900 text-center font-black text-violet-600 print:text-black">{{ ex.grade || 'A' }}</td>
                  <td class="p-2 leading-relaxed text-slate-600 print:text-black">{{ ex.description }}</td>
                </tr>
                <tr v-if="reportData.extracurriculars.length === 0">
                  <td colspan="3" class="p-4 text-center text-slate-400">Tidak mengikuti kegiatan ekstrakurikuler.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Attendance & Physical Growth Grid -->
          <div class="grid grid-cols-2 gap-8 print:gap-6">
            <!-- Physical Growth -->
            <div>
              <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">III. Tumbuh Kembang</h3>
              <table class="w-full text-left border border-slate-900 text-xs">
                <tbody>
                  <tr class="border-b border-slate-900 dark:border-zinc-700">
                    <td class="p-2 border-r border-slate-900 dark:border-zinc-700 font-bold bg-slate-50 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-200 w-1/2">Tinggi Badan</td>
                    <td class="p-2">{{ reportData.student.height ? `${reportData.student.height} cm` : '-' }}</td>
                  </tr>
                  <tr>
                    <td class="p-2 border-r border-slate-900 dark:border-zinc-700 font-bold bg-slate-50 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-200">Berat Badan</td>
                    <td class="p-2">{{ reportData.student.weight ? `${reportData.student.weight} kg` : '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Attendance -->
            <div>
              <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">IV. Kehadiran (Absensi)</h3>
              <table class="w-full text-left border border-slate-900 text-xs">
                <tbody>
                  <tr class="border-b border-slate-900 dark:border-zinc-700">
                    <td class="p-2 border-r border-slate-900 dark:border-zinc-700 font-bold bg-slate-50 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-200 w-1/2">Sakit (S)</td>
                    <td class="p-2 text-center">{{ reportData.attendance.sick }} hari</td>
                  </tr>
                  <tr class="border-b border-slate-900 dark:border-zinc-700">
                    <td class="p-2 border-r border-slate-900 dark:border-zinc-700 font-bold bg-slate-50 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-200">Izin (I)</td>
                    <td class="p-2 text-center">{{ reportData.attendance.leave }} hari</td>
                  </tr>
                  <tr>
                    <td class="p-2 border-r border-slate-900 dark:border-zinc-700 font-bold bg-slate-50 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-200">Tanpa Keterangan (A)</td>
                    <td class="p-2 text-center">{{ reportData.attendance.absent }} hari</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      <!-- ─── JENJANG SD / SMP / SMA TEMPLATE ─── -->
      <div v-else class="space-y-8 print:space-y-6">
        
        <!-- Subject Grades Table -->
        <div>
          <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">I. Nilai Akademik (Intrakurikuler)</h3>
          <table class="w-full text-left border border-slate-900 text-xs">
            <thead>
              <tr class="bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-b border-slate-900 dark:border-zinc-700 font-bold">
                <th class="p-2 border-r border-slate-900 w-12 text-center">No</th>
                <th class="p-2 border-r border-slate-900">Mata Pelajaran</th>
                <th class="p-2 border-r border-slate-900 text-center w-16">KKM</th>
                <th class="p-2 border-r border-slate-900 text-center w-16">Nilai</th>
                <th class="p-2 border-r border-slate-900 text-center w-16">Predikat</th>
                <th class="p-2">Deskripsi Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(grade, index) in reportData.finalGrades" :key="grade.subject_id" class="border-b border-slate-900 last:border-0">
                <td class="p-2 border-r border-slate-900 text-center">{{ index + 1 }}</td>
                <td class="p-2 border-r border-slate-900 font-bold">{{ grade.subject_name }}</td>
                <td class="p-2 border-r border-slate-900 text-center">{{ grade.kkm_score ? Number(grade.kkm_score) : 70 }}</td>
                <td class="p-2 border-r border-slate-900 text-center font-bold" :class="{'text-rose-600': Number(grade.final_score) < Number(grade.kkm_score || 70)}">
                  {{ grade.final_score ? Number(grade.final_score) : '-' }}
                </td>
                <td class="p-2 border-r border-slate-900 text-center font-black">{{ grade.predicate || '-' }}</td>
                <td class="p-2 leading-relaxed text-slate-650 print:text-black">{{ grade.achievement_description }}</td>
              </tr>
              <tr v-if="reportData.finalGrades.length === 0">
                <td colspan="6" class="p-4 text-center text-slate-400">Tidak ada nilai akademik yang difinalisasi untuk semester ini.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Extracurricular Table -->
        <div>
          <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-4">II. Kegiatan Ekstrakurikuler</h3>
          <table class="w-full text-left border border-slate-900 text-xs">
            <thead>
              <tr class="bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-b border-slate-900 dark:border-zinc-700 font-bold">
                <th class="p-2 border-r border-slate-900 w-1/3">Kegiatan Ekstrakurikuler</th>
                <th class="p-2 border-r border-slate-900 text-center w-24">Predikat</th>
                <th class="p-2">Deskripsi / Capaian</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ex in reportData.extracurriculars" :key="ex.extracurricular_name" class="border-b border-slate-900 last:border-0">
                <td class="p-2 border-r border-slate-900 font-bold">{{ ex.extracurricular_name }}</td>
                <td class="p-2 border-r border-slate-900 text-center font-black text-violet-600 print:text-black">{{ ex.grade || 'A' }}</td>
                <td class="p-2 leading-relaxed text-slate-600 print:text-black">{{ ex.description }}</td>
              </tr>
              <tr v-if="reportData.extracurriculars.length === 0">
                <td colspan="3" class="p-4 text-center text-slate-400">Tidak mengikuti kegiatan ekstrakurikuler.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Attendance & Homeroom Notes Grid -->
        <div class="grid grid-cols-3 gap-6">
          
          <!-- Attendance -->
          <div class="col-span-1">
            <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-3">III. Kehadiran</h3>
            <table class="w-full text-left border border-slate-900 text-xs">
              <tbody>
                <tr class="border-b border-slate-900 dark:border-zinc-700">
                  <td class="p-2 border-r border-slate-900 dark:border-zinc-700 font-bold bg-slate-50 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-200 w-2/3">Sakit (S)</td>
                  <td class="p-2 text-center">{{ reportData.attendance.sick }}</td>
                </tr>
                <tr class="border-b border-slate-900 dark:border-zinc-700">
                  <td class="p-2 border-r border-slate-900 dark:border-zinc-700 font-bold bg-slate-50 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-200">Izin (I)</td>
                  <td class="p-2 text-center">{{ reportData.attendance.leave }}</td>
                </tr>
                <tr>
                  <td class="p-2 border-r border-slate-900 dark:border-zinc-700 font-bold bg-slate-50 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-200">Tanpa Ket (A)</td>
                  <td class="p-2 text-center">{{ reportData.attendance.absent }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Notes -->
          <div class="col-span-2">
            <h3 class="text-sm font-black uppercase border-b border-slate-900 pb-1 mb-3">IV. Catatan Wali Kelas</h3>
            <div class="border border-slate-900 p-4 min-h-[92px] text-xs leading-relaxed text-justify text-slate-700 print:text-black">
              {{ reportData.report.homeroom_notes || 'Ananda menunjukkan perilaku sosial yang sangat baik selama semester ini dan memiliki motivasi belajar yang konsisten.' }}
            </div>
          </div>

        </div>

      </div>

      <!-- Signatures Footer (shown for non-TK-Dinas formats) -->
      <div v-if="reportData.student.school_level !== 'TK' || selectedTKFormat !== 'dinas'" class="mt-16 print:mt-12 text-xs font-semibold">
        <div class="grid grid-cols-3 text-center gap-4">
          <div class="space-y-16">
            <p>Orang Tua / Wali Murid</p>
            <p class="border-b border-slate-900 w-3/4 mx-auto pb-1"></p>
          </div>
          <div class="space-y-16">
            <p>Guru Kelas / Wali Kelas</p>
            <p class="border-b border-slate-900 w-3/4 mx-auto pb-1"></p>
          </div>
          <div class="space-y-16">
            <p>Mengetahui,<br>Kepala Sekolah</p>
            <p class="border-b border-slate-900 w-3/4 mx-auto pb-1"></p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style>
@media print {
  body {
    background-color: white;
    color: black;
  }
  .print\:hidden {
    display: none !important;
  }
  @page {
    margin: 15mm 12mm 12mm 12mm;
    size: A4;
  }

  .print-report-container {
    max-width: none !important;
    width: 100% !important;
    border: none !important;
    box-shadow: none !important;
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .print-page {
    min-height: 270mm !important; /* A4 height (297mm) - page margins (15mm + 12mm) */
    width: 100% !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    margin: 0 auto !important;
    border: none !important;
    box-shadow: none !important;
    background-color: white !important;
    color: black !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  /* Compact elements for print */
  .print-page table {
    font-size: 9.5px !important;
    line-height: 1.25 !important;
  }
  .print-page th,
  .print-page td {
    padding: 3px 5px !important;
  }
  .print-page td[colspan="3"], 
  .print-page td[colspan="2"] {
    padding: 5px 8px !important;
  }

  /* Margin and spacing overrides to fit Page 1 and Page 2 on exactly 2 sheets */
  .print-page .mb-6 {
    margin-bottom: 8px !important;
  }
  .print-page .mb-3 {
    margin-bottom: 6px !important;
  }
  .print-page .mb-2 {
    margin-bottom: 4px !important;
  }
  .print-page .pb-3 {
    padding-bottom: 4px !important;
  }
  .print-page .pb-6 {
    padding-bottom: 10px !important;
  }
  .print-page .mt-6 {
    margin-top: 8px !important;
  }
  .print-page .space-y-4 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 6px !important;
  }
  .print-page .space-y-3 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 4px !important;
  }
  .print-page .space-y-8 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 12px !important;
  }

  /* Student Info Bar and Boxes */
  .print-page .bg-slate-50 {
    padding: 6px 10px !important;
    margin-bottom: 10px !important;
    font-size: 11px !important;
  }
  
  /* Text and line-height compaction */
  .print-page .leading-relaxed {
    line-height: 1.35 !important;
  }
  
  /* Signature height adjustment to prevent overflow to 3rd page */
  .print-page div[class*="h-[80px]"] {
    height: 55px !important;
  }
}

/* Vertical text for P5 dimension column headers */
.vertical-text-header {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  white-space: nowrap;
  display: inline-block;
  height: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Styling for A4 sheet in Dark Mode on screen */
.dark .print-sheet-canvas {
  background-color: #18181b !important; /* dark zinc-900 background */
  color: #f4f4f5 !important; /* light zinc-100 text */
  border-color: #3f3f46 !important; /* zinc-700 border */
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
}

.dark .print-sheet-canvas * {
  color: #f4f4f5 !important;
  border-color: #3f3f46 !important;
}

/* Specific background restorations for dark color palettes */
.dark .print-sheet-canvas .bg-slate-50 {
  background-color: #27272a !important; /* zinc-800 */
}
.dark .print-sheet-canvas .bg-slate-100 {
  background-color: #27272a !important; /* zinc-800 */
}
.dark .print-sheet-canvas .bg-slate-100\/60 {
  background-color: rgba(39, 39, 42, 0.6) !important;
}
.dark .print-sheet-canvas .bg-white {
  background-color: #18181b !important;
}

/* Colors for specific titles/emphasis */
.dark .print-sheet-canvas h1,
.dark .print-sheet-canvas h2,
.dark .print-sheet-canvas h3,
.dark .print-sheet-canvas h4 {
  color: #ffffff !important;
}
.dark .print-sheet-canvas .text-violet-750 {
  color: #c084fc !important; /* violet-400 */
}
.dark .print-sheet-canvas .text-rose-600 {
  color: #fb7185 !important; /* rose-400 */
}
.dark .print-sheet-canvas .text-slate-400 {
  color: #a1a1aa !important; /* zinc-400 */
}
.dark .print-sheet-canvas .text-slate-500 {
  color: #a1a1aa !important; /* zinc-400 */
}
</style>
