<script setup lang="ts">
import { Printer, X, ShieldAlert, FileText, CheckCircle } from 'lucide-vue-next'
import { useSchool } from '../../composables/useSchool'
import { useReport } from '../../composables/useReport'
import { useReportTemplate } from '../../composables/useReportTemplate'
import { useReportRenderer } from '../../composables/useReportRenderer'
import '~/assets/css/report-builder.css'

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
const { renderWidgetHTML } = useReportRenderer()

const reportId = route.params.id as string
const reportData = ref<any>(null)
const loading = ref(true)
const selectedTemplateId = ref((route.query.template_id as string) || '')

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

const visualTree = computed(() => {
  let tree = reportData.value?.template?.widget_tree
  // Recursively parse in case of double stringification
  while (typeof tree === 'string') {
    try { tree = JSON.parse(tree) } catch(e) { tree = []; break }
  }
  console.log('[DEBUG] visualTree parsed widget_tree:', tree)
  
  if (Array.isArray(tree) && tree.length > 0) {
    return tree
  }

  // Fallback: Auto-migrate from element_structure if widget_tree is empty
  const elStruct = reportData.value?.template?.element_structure
  let parsedElStruct = elStruct
  if (typeof elStruct === 'string') {
    try { parsedElStruct = JSON.parse(elStruct) } catch (e) { parsedElStruct = null }
  }

  if (parsedElStruct && parsedElStruct.tk_sections) {
    const newTree = []
    newTree.push({ id: 'w_header', type: 'header_school', props: { showNpsn: true, showAddress: true } })
    newTree.push({ id: 'w_ident', type: 'student_identity', props: { showNisn: true, showWali: true } })
    newTree.push({ id: 'w_pb1', type: 'page_break', props: {} })
    
    const descItems = []
    for (const sec of parsedElStruct.tk_sections) {
      const subs = sec.elements?.map((el: any) => ({ label: el.name, ref_id: el.id })) || []
      descItems.push({ name: sec.name, label: sec.name, subs })
    }
    if (descItems.length > 0) {
      newTree.push({
        id: 'w_desc',
        type: 'desc_table',
        props: {
          scale: "BB/MB/BSH/BSB",
          hasSub: true,
          showNarasi: false,
          perSub: true,
          items: descItems,
          cols: [
            {k:"no",label:"No",on:true},
            {k:"name",label:"Elemen Capaian",on:true},
            {k:"val",label:"Capaian",on:true}
          ]
        }
      })
    }
    return newTree
  }

  return []
})

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
  <div class="min-h-screen bg-zinc-200 dark:bg-[#0d0d11] print:bg-white py-6 sm:py-10 print:py-0">

    <!-- ══ Unified Card: Toolbar + Paper Canvas ══ -->
    <div class="max-w-[21cm] mx-auto print:mx-0">

      <!-- Toolbar bar — slim bar above paper -->
      <div class="bg-white dark:bg-[#1c1c28] border border-slate-200 dark:border-zinc-800 rounded-t-xl px-4 py-2.5 flex flex-wrap justify-between items-center gap-3 print:hidden">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-violet-600/10 dark:bg-violet-500/15 flex items-center justify-center flex-none">
            <FileText class="text-violet-600 dark:text-violet-400" :size="16" />
          </div>
          <div>
            <h1 class="text-xs font-bold text-slate-900 dark:text-zinc-100">Pratinjau Rapor Digital</h1>
            <p class="text-[10px] text-slate-400 dark:text-zinc-500">Tekan tombol print untuk mencetak rapor resmi A4.</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 items-center">

          <!-- Template Selection Dropdown -->
          <div v-if="reportTemplates && reportTemplates.length > 0" class="flex items-center gap-1.5 print:hidden">
            <label class="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Template:</label>
            <select 
              v-model="selectedTemplateId" 
              class="bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-semibold outline-none transition-all focus:border-violet-500 dark:text-zinc-200 text-slate-700"
            >
              <option v-for="tpl in reportTemplates" :key="tpl.id" :value="tpl.id">
                {{ tpl.name }} {{ tpl.is_active ? '(Aktif)' : '' }}
              </option>
            </select>
          </div>
          <button @click="handlePrint" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
            <Printer :size="13" /> Cetak
          </button>
          <button @click="handleClose" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[11px] font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all active:scale-95">
            <X :size="13" /> Tutup
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 bg-white dark:bg-[#1c1c28]">
        <div class="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin mb-4"></div>
        <p class="text-xs font-semibold text-slate-500">Memuat berkas rapor...</p>
      </div>

      <!-- Not found state -->
      <div v-else-if="!reportData" class="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1c1c28]">
        <ShieldAlert class="text-rose-500 mb-3" :size="40" />
        <h2 class="font-bold text-slate-800 dark:text-zinc-200 text-sm">Rapor Tidak Ditemukan</h2>
        <p class="text-xs text-slate-400 mt-1 mb-6">Pastikan ID Rapor dan Unit Sekolah aktif Anda sesuai.</p>
        <button @click="handleClose" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">Kembali</button>
      </div>

      <!-- Dynamic Template-Driven Renderer -->
      <div 
        v-else-if="visualTree.length > 0"
        class="report-paper print:shadow-none print:rounded-none"
        :style="{
          minHeight: reportData.template?.canvas_config?.orient === 'landscape' ? '21cm' : '29.7cm',
          padding: `${reportData.template?.canvas_config?.margin || 15}mm`,
          boxSizing: 'border-box',
        }"
      >
        <div v-for="w in visualTree" :key="w.id" class="rp" v-html="renderWidgetHTML(w, reportData, false)"></div>
      </div>

      <!-- Fallback Legacy Hardcoded Renderer -->
      <div 
        v-else-if="reportData"
        class="print-report-container print-sheet-canvas"
        :class="[
          reportData.student.school_level === 'TK' && selectedTKFormat === 'dinas' ? 'dinas-format' : 'standard-format',
          reportData.student.school_level === 'TK' && selectedTKFormat === 'dinas' 
            ? 'bg-white border-none p-0 space-y-6 shadow-none' 
            : 'bg-white border-slate-300/60 rounded-b-2xl p-8 sm:p-12 print:p-[20mm_20mm]'
        ]"
      >
        <!-- Report Header (shown for non-TK formats) -->
      <div v-if="reportData.student.school_level !== 'TK'" class="text-center border-b-2 border-slate-900 pb-6 mb-8 print:pb-4 print:mb-6">
        <h2 class="text-lg font-black uppercase tracking-wide">{{ reportData.student.school_name }}</h2>
        <p class="text-xs font-semibold">{{ reportData.student.school_address }}</p>
        <p class="text-[10px] text-slate-500 font-medium">NPSN: {{ reportData.student.school_npsn || '-' }} | NSM: {{ reportData.student.school_nsm || '-' }}</p>
      </div>

      <!-- Student & Period Metadata Grid (shown for non-TK formats) -->
      <div v-if="reportData.student.school_level !== 'TK'" class="grid grid-cols-2 gap-4 text-xs font-semibold mb-8 print:mb-6">
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
        <div class="space-y-0 text-black dark:text-zinc-100">

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

      <!-- Signatures Footer (shown for non-TK formats) -->
      <div v-if="reportData.student.school_level !== 'TK'" class="mt-16 print:mt-12 text-xs font-semibold">
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
        </div><!-- end grid grid-cols-3 -->
      </div><!-- end signatures div -->

      </div><!-- end fallback renderer -->

    </div><!-- end max-w-[21cm] -->
  </div><!-- end min-h-screen -->
</template>

<style>
/* Paper canvas – always white like physical paper */
.report-paper {
  background-color: #ffffff;
  color: #1a1a1a;
  width: 100%;
  border: 1px solid #d1d5db;
  border-top: none; /* toolbar is above, sharing the border */
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06);
  box-sizing: border-box;
}
.dark .report-paper {
  border-color: #3f3f46;
  box-shadow: 0 8px 40px rgba(0,0,0,0.45);
}
@media print {
  /* Force background colors and images to print (e.g. table header #efefef) */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Canvas: no decoration, padding is the only spacing */
  .report-paper {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    width: 100vw !important;
    min-height: auto !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    background-color: white;
    color: black;
  }
  .print\:hidden {
    display: none !important;
  }

  /* @page margin = 0 so the canvas padding (15mm all sides) is the ONLY spacing.
     This guarantees equal left/right/top/bottom margins when printed. */
  @page {
    margin: 0;
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
    display: block !important;
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

/* Canvas rapor – selalu putih seperti kertas cetak */
.report-canvas-wrapper {
  background-color: #ffffff;
  color: #1a1a1a;
  border: 1px solid #d1d5db;
}
@media (prefers-color-scheme: dark) {
  /* tetap putih di dark mode – ini adalah preview dokumen cetak */
  .report-canvas-wrapper { background-color: #ffffff; color: #1a1a1a; }
}

/* Styling untuk A4 sheet di Dark Mode pada screen (legacy hardcoded renderer) */
.dark .print-sheet-canvas {
  background-color: #1c1c1f !important;
  border-color: #3f3f46 !important;
  box-shadow: 0 4px 24px rgb(0 0 0 / 0.4) !important;
}

/* Override warna teks secara selektif — JANGAN gunakan * { color } agar tidak merusak kontras tabel */
.dark .print-sheet-canvas {
  color: #f0f0f0;
}
.dark .print-sheet-canvas h1,
.dark .print-sheet-canvas h2,
.dark .print-sheet-canvas h3,
.dark .print-sheet-canvas h4 {
  color: #ffffff !important;
}
.dark .print-sheet-canvas table th {
  background-color: #27272a !important;
  color: #e4e4e7 !important;
  border-color: #52525b !important;
}
.dark .print-sheet-canvas table td {
  color: #d4d4d8 !important;
  border-color: #52525b !important;
}
.dark .print-sheet-canvas .bg-slate-50,
.dark .print-sheet-canvas .bg-slate-100 {
  background-color: #27272a !important;
}
.dark .print-sheet-canvas .bg-white {
  background-color: #1c1c1f !important;
}
.dark .print-sheet-canvas .text-slate-400,
.dark .print-sheet-canvas .text-slate-500 {
  color: #a1a1aa !important;
}
.dark .print-sheet-canvas .text-violet-750 {
  color: #c084fc !important;
}
.dark .print-sheet-canvas .text-rose-600 {
  color: #fb7185 !important;
}
.dark .print-sheet-canvas .border-slate-900,
.dark .print-sheet-canvas .border-b-2 {
  border-color: #e4e4e7 !important;
}
</style>
