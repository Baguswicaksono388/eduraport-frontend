<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Plus, Trash2, Edit2, CheckCircle2, Bookmark, LayoutTemplate, Layers, Settings, ChevronRight, AlertCircle, FileText, Sliders, Eye, EyeOff, Save, X, HelpCircle, Check, Loader2, RotateCcw, RotateCw } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useSchoolContext } from '../../composables/useSchoolContext'
import { useReportTemplate } from '../../composables/useReportTemplate'
import { useSubject } from '../../composables/useSubject'
import { useToast } from '../../composables/useToast'
import { useApi } from '../../composables/useApi'
import { useAuth } from '../../composables/useAuth'
import '~/assets/css/report-builder.css'

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
const { subjects, fetchSubjects } = useSubject()
const { 
  reportTemplates, 
  currentTemplate, 
  fetchReportTemplates, 
  fetchReportTemplateById, 
  createReportTemplate, 
  updateReportTemplate, 
  deleteReportTemplate
} = useReportTemplate()

const toast = useToast()
const { user, fetchUser } = useAuth()
const { renderWidgetHTML } = useReportRenderer()

const levelFilter = ref('')
const loading = ref(false)
const saving = ref(false)
const detailsLoading = ref(false)

const selectedSchool = computed(() => schools.value.find(s => s.id === selectedSchoolId.value))
const filteredSchools = computed(() => {
  if (user.value && user.value.role !== 'super_admin' && user.value.school_id) {
    return schools.value.filter(s => s.id === user.value.school_id)
  }
  return schools.value
})

const selectedSchoolLevel = computed(() => selectedSchool.value?.level || '')
watch(selectedSchoolLevel, (newVal) => { if (newVal) levelFilter.value = newVal }, { immediate: true })

onMounted(async () => {
  await fetchUser()
  const schoolId = await initContext()
  if (schoolId) await loadSchoolData(schoolId)
})

const loadSchoolData = async (schoolId: string) => {
  loading.value = true
  currentTemplate.value = null
  try {
    await Promise.all([
      fetchReportTemplates(schoolId, levelFilter.value || undefined),
      fetchSubjects(schoolId)
    ])
    if (reportTemplates.value.length > 0) {
      await selectTemplate(reportTemplates.value[0].id)
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

watch(selectedFoundationId, (newVal) => onFoundationChange(newVal))
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

/* =========================================================
   Visual Builder Logic (Ported from Prototype)
========================================================= */
const SCHOOL = {name:"SEKOLAH DEMO", npsn:"20345678", address:"Jl. Pendidikan No. 1", phone:"(021) 123456", year:"2026/2027", semester:"Ganjil"}
const STUDENTS = [
 {id:1,name:"Aisyah Putri Ramadhani",nis:"2024-001",nisn:"0191234567",kelas:"TK B - Melati",wali:"Ibu Guru",
  intr:[["Nilai Agama & Budi Pekerti","BSH"],["Jati Diri","BSB"],["STEAM","BSH"]],
  narasi:{"Nilai Agama & Budi Pekerti":"Sangat baik.","Jati Diri":"Mandiri.","STEAM":"Bagus."},
  ekskul:[["Iqra / Tahfizh","Jayyid","Hafalan"]], p5:[["Beriman & Bertakwa","BSH"]],
  hadir:{h:98,s:3,i:2,a:0}, tb:{bb:"18,2 kg",tb:"109 cm",lk:"50 cm"}}
]

const REGISTRY: any = {
 section_block:{g:"layout",ic:"▭",name:"Blok Seksi",hint:"Judul seksi raport",props:{title:"INTRAKURIKULER"}},
 column_layout:{g:"layout",ic:"◫",name:"Kolom Fleksibel",hint:"Layout 2 atau 3 kolom bersisian",props:{cols:2},slots:[[], []]},
 page_break:{g:"layout",ic:"⤓",name:"Pemisah Halaman",hint:"Paksa halaman baru",props:{}},
 header_school:{g:"profile",ic:"🏛",name:"Header Sekolah",hint:"Kop & logo",props:{showNpsn:true,showAddress:true}},
 student_identity:{g:"profile",ic:"🪪",name:"Identitas Siswa",hint:"Biodata singkat",props:{showNisn:true,showWali:true}},
 student_photo:{g:"profile",ic:"📷",name:"Foto Siswa",hint:"Pas foto 3×4",props:{}},
 grade_table:{g:"assessment",ic:"🔢",name:"Tabel Nilai Angka",hint:"Nilai numerik + KKM",props:{
   highlightKkm:true,kkm:75,sortBelowKkm:false,
   items:["Bahasa Indonesia","Matematika","Bahasa Inggris","IPA","IPS","PKn","Seni Budaya","PJOK"],
   cols:[{k:"no",label:"No",on:true},{k:"name",label:"Mata Pelajaran",on:true},{k:"kkm",label:"KKM",on:true},{k:"val",label:"Nilai Akhir",on:true},{k:"pred",label:"Predikat",on:true},{k:"desc",label:"Deskripsi Capaian Kompetensi",on:true}]}},
 desc_table:{g:"assessment",ic:"📊",name:"Tabel Nilai Deskriptif",hint:"Elemen + sub-indikator",props:{
   scale:"BB/MB/BSH/BSB",hasSub:true,showNarasi:false,perSub:true,
   items:[{name:"Nilai Agama & Budi Pekerti",label:"Nilai Agama & Budi Pekerti",subs:[{label:"Murid percaya...",ref_id:'w'+Math.random().toString(36).slice(2,9)}]}],
   cols:[{k:"no",label:"No",on:true},{k:"name",label:"Elemen Capaian",on:true},{k:"val",label:"Capaian",on:true}]}},
 subject_narrative:{g:"assessment",ic:"📝",name:"Kartu Narasi",hint:"Narasi capaian",props:{items:["Nilai Agama & Budi Pekerti"]}},
 extracurricular:{g:"assessment",ic:"🎨",name:"Ekstrakurikuler",hint:"Ekskul & ket",props:{
   items:["Iqra / Tahfizh"],cols:[{k:"no",label:"No",on:true},{k:"name",label:"Ekstrakurikuler",on:true},{k:"val",label:"Nilai",on:true},{k:"note",label:"Keterangan",on:true}]}},
 p5_assessment:{g:"assessment",ic:"🌱",name:"Penilaian P5",hint:"Dimensi profil",props:{
   items:["Beriman & Bertakwa"],cols:[{k:"name",label:"Dimensi Profil Lulusan",on:true},{k:"val",label:"Capaian",on:true}]}},
 attendance:{g:"extra",ic:"🗓",name:"Kehadiran",hint:"Rekap hadir",props:{}},
 growth:{g:"extra",ic:"📏",name:"Tumbuh Kembang",hint:"Fisik",props:{}},
 homeroom_notes:{g:"extra",ic:"📝",name:"Catatan Wali Kelas",hint:"Teks catatan wali",props:{title:"CATATAN WALI"}},
 signature_block:{g:"extra",ic:"✒",name:"Tanda Tangan",hint:"Ortu & Guru",props:{place:"Jakarta",date:"20 Desember",kepsek:"Kepala Sekolah"}}
}

const state = reactive({
  paper: 'A4',
  orient: 'portrait',
  margin: 15,
  tree: [] as any[]
})

const lastSavedState = ref('')
const hasUnsavedChanges = computed(() => {
  return JSON.stringify(state) !== lastSavedState.value
})

const undoStack = ref<string[]>([])
const redoStack = ref<string[]>([])
const selectedId = ref<string | null>(null)
const zoom = ref(0.8)

function generateUid(){ return 'w'+Math.random().toString(36).slice(2,9) }

function findWidget(id: string) {
  for (let i = 0; i < state.tree.length; i++) {
    if (state.tree[i].id === id) return { parentList: state.tree, index: i, widget: state.tree[i] }
    if (state.tree[i].type === 'column_layout' && state.tree[i].slots) {
       for (let s = 0; s < state.tree[i].slots.length; s++) {
          for (let j = 0; j < state.tree[i].slots[s].length; j++) {
             if (state.tree[i].slots[s][j].id === id) return { parentList: state.tree[i].slots[s], index: j, widget: state.tree[i].slots[s][j] }
          }
       }
    }
  }
  return null
}

function snapshot() {
  undoStack.value.push(JSON.stringify(state))
  if (undoStack.value.length > 60) undoStack.value.shift()
  redoStack.value = []
}

function undo() {
  if (!undoStack.value.length) return
  redoStack.value.push(JSON.stringify(state))
  const prev = JSON.parse(undoStack.value.pop() as string)
  Object.assign(state, prev)
  selectedId.value = null
}

function redo() {
  if (!redoStack.value.length) return
  undoStack.value.push(JSON.stringify(state))
  const next = JSON.parse(redoStack.value.pop() as string)
  Object.assign(state, next)
  selectedId.value = null
}

const selectTemplate = async (id: string) => {
  detailsLoading.value = true
  try {
    const res = await fetchReportTemplateById(selectedSchoolId.value, id)
    if (res.success && res.data) {
       undoStack.value = []
       redoStack.value = []
       selectedId.value = null
       
       if (res.data.canvas_config) {
         state.paper = res.data.canvas_config.paper || 'A4'
         state.orient = res.data.canvas_config.orient || 'portrait'
         state.margin = res.data.canvas_config.margin || 15
       }
       if (res.data.widget_tree && Array.isArray(res.data.widget_tree) && res.data.widget_tree.length > 0) {
         state.tree = res.data.widget_tree.map((w: any) => {
            if (w.type === 'column_layout' && !w.slots) {
               w.slots = Array.from({ length: w.props.cols || 2 }, () => [])
            }
            return w
         })
         lastSavedState.value = JSON.stringify(state)
       } else if (res.data.element_structure && res.data.element_structure.tk_sections) {
         // Auto-migrate from old element_structure to widget_tree
         const newTree = []
         newTree.push({ id: generateUid(), type: 'header_school', props: JSON.parse(JSON.stringify(REGISTRY['header_school'].props)) })
         newTree.push({ id: generateUid(), type: 'student_identity', props: JSON.parse(JSON.stringify(REGISTRY['student_identity'].props)) })
         newTree.push({ id: generateUid(), type: 'page_break', props: {} })
         
         const descItems = []
         for (const sec of res.data.element_structure.tk_sections) {
            const subs = sec.elements?.map((el: any) => ({ label: el.name, ref_id: el.id })) || []
            descItems.push({ name: sec.name, label: sec.name, subs })
         }
         if (descItems.length > 0) {
           newTree.push({
             id: generateUid(),
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
         state.tree = newTree
         lastSavedState.value = JSON.stringify(state)
         toast.info('Template lama otomatis dikonversi ke format visual. Silakan Simpan Visual Template.', 'Auto Migrasi')
       } else {
         state.tree = []
         lastSavedState.value = JSON.stringify(state)
       }
    }
  } catch (error) {
    console.error(error)
  } finally {
    detailsLoading.value = false
  }
}

const showConfirmModal = ref(false)

const handleSaveTemplate = async () => {
  if (!currentTemplate.value) return

  if (selectedSchoolLevel.value === 'TK' || currentTemplate.value.level === 'TK') {
    showConfirmModal.value = true
    return
  }
  
  await executeSaveTemplate()
}

const executeSaveTemplate = async () => {
  showConfirmModal.value = false
  if (!currentTemplate.value) return

  saving.value = true
  try {
    // The backend syncAssessmentElementsFromWidgetTree uses item.subs[i].ref_id and item.subs[i].label
    const treeToSave = JSON.parse(JSON.stringify(state.tree))
    for (const w of treeToSave) {
      if (w.type === 'desc_table' && w.props?.items) {
        for (const it of w.props.items) {
          if (Array.isArray(it.subs)) {
             for (const sub of it.subs) {
               if (!sub.ref_id) {
                 sub.ref_id = generateUid()
               }
               if (!sub.label) {
                 sub.label = sub.name || "Indikator"
               }
             }
          }
        }
      }
    }

    const payload = {
      canvas_config: { paper: state.paper, orient: state.orient, margin: state.margin },
      widget_tree: treeToSave
    }
    const res = await updateReportTemplate(selectedSchoolId.value, currentTemplate.value.id, payload)
    if (res.success) {
      state.tree = treeToSave
      lastSavedState.value = JSON.stringify(state)
      toast.success('Visual template berhasil disimpan!')
      await selectTemplate(currentTemplate.value.id)
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan template')
  } finally {
    saving.value = false
  }
}

// Drag & Drop
const onDragStartPalette = (e: DragEvent, type: string) => {
  if(e.dataTransfer) {
    e.dataTransfer.setData('new', type)
    e.dataTransfer.effectAllowed = 'copy'
  }
}
const onDragStartCanvas = (e: DragEvent, id: string) => {
  if(e.dataTransfer) {
    e.dataTransfer.setData('move', id)
    e.dataTransfer.effectAllowed = 'move'
  }
}
const onDropZone = (e: DragEvent, targetList: any[], targetIdx: number) => {
  e.preventDefault()
  const nt = e.dataTransfer?.getData('new')
  const mv = e.dataTransfer?.getData('move')
  snapshot()
  if (nt) {
    const newProps = REGISTRY[nt].props ? JSON.parse(JSON.stringify(REGISTRY[nt].props)) : {}
    const newSlots = REGISTRY[nt].slots ? JSON.parse(JSON.stringify(REGISTRY[nt].slots)) : undefined
    const newWidget: any = { id: generateUid(), type: nt, props: newProps }
    if (newSlots) newWidget.slots = newSlots
    targetList.splice(targetIdx, 0, newWidget)
    selectedId.value = newWidget.id
  } else if (mv) {
    const found = findWidget(mv)
    if (found) {
      if (found.widget.type === 'column_layout' && targetList !== state.tree) {
         toast.error("Kolom tidak bisa dimasukkan ke dalam kolom lain.")
         return
      }
      const { parentList, index, widget } = found
      parentList.splice(index, 1)
      let insertIdx = targetIdx
      if (parentList === targetList && index < targetIdx) insertIdx--
      targetList.splice(insertIdx, 0, widget)
    }
  }
}
const onDragOver = (e: DragEvent) => {
  e.preventDefault()
}

const actionWidget = (e: Event, action: string, wId: string) => {
  e.stopPropagation()
  snapshot()
  const found = findWidget(wId)
  if (!found) return
  const { parentList, index: idx, widget: w } = found
  
  if (action === 'del') { parentList.splice(idx, 1); selectedId.value = null }
  if (action === 'dup') { 
    const cloned = JSON.parse(JSON.stringify(w))
    cloned.id = generateUid()
    if (cloned.slots) cloned.slots.forEach((slot: any[]) => slot.forEach(cw => cw.id = generateUid()))
    parentList.splice(idx+1, 0, cloned) 
  }
  if (action === 'up' && idx > 0) { const tmp = parentList[idx-1]; parentList[idx-1] = parentList[idx]; parentList[idx] = tmp }
  if (action === 'down' && idx < parentList.length - 1) { const tmp = parentList[idx+1]; parentList[idx+1] = parentList[idx]; parentList[idx] = tmp }
}

const onCanvasClick = () => { selectedId.value = null }
const selectWidget = (wId: string) => { selectedId.value = wId }

const selectedWidgetProps = computed(() => {
  if (!selectedId.value) return null
  const found = findWidget(selectedId.value)
  return found ? found.widget : null
})

const selectedTemplateId = computed({
  get: () => currentTemplate.value?.id || null,
  set: (val) => {
    if (val) selectTemplate(val)
  }
})

</script>

<template>
  <div class="h-[calc(100vh-140px)] flex flex-col bg-[#eef2f1] text-[#1c2b2d] font-sans -mx-4 -mb-4 lg:-mx-8 lg:-mb-8 overflow-hidden builder-root rounded-2xl shadow-sm border border-slate-200">
    
    <!-- Topbar -->
    <div class="h-[52px] bg-white border-b border-[#dde5e4] flex items-center px-4 shrink-0 z-10 gap-3">
      <select v-model="selectedSchoolId" class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none w-48">
        <option v-for="school in filteredSchools" :key="school.id" :value="school.id">{{ school.name }}</option>
      </select>
      <select v-if="selectedSchoolId" v-model="selectedTemplateId" class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none w-64">
        <option :value="null">-- Pilih Template --</option>
        <option v-for="tpl in reportTemplates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
      </select>
      
      <div class="flex-1"></div>
      
      <div v-if="currentTemplate" class="flex items-center gap-3">
        <div v-if="hasUnsavedChanges" class="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5 animate-pulse">
          <AlertCircle :size="14" />
          Belum Disimpan
        </div>
        <div class="flex items-center gap-1.5">
          <button @click="undo" :disabled="!undoStack.length" class="builder-btn icon text-slate-500 hover:text-slate-900"><RotateCcw :size="16"/></button>
          <button @click="redo" :disabled="!redoStack.length" class="builder-btn icon text-slate-500 hover:text-slate-900"><RotateCw :size="16"/></button>
        </div>
        <button @click="handleSaveTemplate" :disabled="saving" class="builder-btn primary" :class="{'ring-2 ring-amber-400 ring-offset-1': hasUnsavedChanges}">
          <Save :size="16"/> {{ saving ? 'Menyimpan...' : 'Simpan Visual Template' }}
        </button>
      </div>
    </div>

    <!-- Builder App -->
    <div v-if="currentTemplate" class="flex-1 flex overflow-hidden">
      <!-- LEFT: Palette -->
      <aside class="w-[236px] bg-white border-r border-[#dde5e4] overflow-y-auto shrink-0 builder-panel">
        <h3 class="builder-h3">Tata Letak</h3>
        <div class="px-2.5 pb-1.5">
          <div v-for="(r, key) in REGISTRY" :key="key">
            <div v-if="r.g === 'layout'" class="pal-item" draggable="true" @dragstart="onDragStartPalette($event, String(key))" @click="() => {snapshot(); state.tree.push({id: generateUid(), type: key, props: JSON.parse(JSON.stringify(r.props))}); selectedId=state.tree[state.tree.length-1].id}">
              <div class="ic">{{ r.ic }}</div>
              <div><div class="nm">{{ r.name }}</div><div class="hint">{{ r.hint }}</div></div>
            </div>
          </div>
        </div>
        
        <h3 class="builder-h3">Profil & Identitas</h3>
        <div class="px-2.5 pb-1.5">
          <div v-for="(r, key) in REGISTRY" :key="key">
            <div v-if="r.g === 'profile'" class="pal-item" draggable="true" @dragstart="onDragStartPalette($event, String(key))" @click="() => {snapshot(); state.tree.push({id: generateUid(), type: key, props: JSON.parse(JSON.stringify(r.props))}); selectedId=state.tree[state.tree.length-1].id}">
              <div class="ic">{{ r.ic }}</div>
              <div><div class="nm">{{ r.name }}</div><div class="hint">{{ r.hint }}</div></div>
            </div>
          </div>
        </div>

        <h3 class="builder-h3">Aspek Penilaian</h3>
        <div class="px-2.5 pb-1.5">
          <div v-for="(r, key) in REGISTRY" :key="key">
            <div v-if="r.g === 'assessment'" class="pal-item" draggable="true" @dragstart="onDragStartPalette($event, String(key))" @click="() => {snapshot(); state.tree.push({id: generateUid(), type: key, props: JSON.parse(JSON.stringify(r.props))}); selectedId=state.tree[state.tree.length-1].id}">
              <div class="ic">{{ r.ic }}</div>
              <div><div class="nm">{{ r.name }}</div><div class="hint">{{ r.hint }}</div></div>
            </div>
          </div>
        </div>

        <h3 class="builder-h3">Informasi Tambahan</h3>
        <div class="px-2.5 pb-1.5">
          <div v-for="(r, key) in REGISTRY" :key="key">
            <div v-if="r.g === 'extra'" class="pal-item" draggable="true" @dragstart="onDragStartPalette($event, String(key))" @click="() => {snapshot(); state.tree.push({id: generateUid(), type: key, props: JSON.parse(JSON.stringify(r.props))}); selectedId=state.tree[state.tree.length-1].id}">
              <div class="ic">{{ r.ic }}</div>
              <div><div class="nm">{{ r.name }}</div><div class="hint">{{ r.hint }}</div></div>
            </div>
          </div>
        </div>
      </aside>

      <!-- CENTER: Canvas -->
      <main class="flex-1 flex flex-col items-center gap-3.5 bg-canvas overflow-y-auto pt-7 pb-20 relative" @click="onCanvasClick" @dragover="onDragOver">
        <div class="sticky top-0 z-[5] bg-white border border-[#dde5e4] rounded-full px-2.5 py-1.5 flex items-center gap-2 shadow-sm">
          <button @click="zoom = Math.max(0.3, zoom - 0.1)" class="builder-btn icon">-</button>
          <span class="text-[11.5px] font-bold text-[#5b6b6d] min-w-[38px] text-center">{{ Math.round(zoom * 100) }}%</span>
          <button @click="zoom = Math.min(2.0, zoom + 0.1)" class="builder-btn icon">+</button>
          <span class="w-[1px] h-[18px] bg-[#dde5e4] mx-1"></span>
          <span class="text-[11.5px] font-semibold text-[#5b6b6d] px-1">{{ state.paper }} &middot; {{ state.orient === 'portrait' ? 'Portrait' : 'Landscape' }}</span>
        </div>

        <div class="paper shadow-paper bg-white origin-top transition-all" 
             :style="{ 
               width: (state.orient === 'portrait' ? (state.paper === 'A4' ? 794 : 794) : (state.paper === 'A4' ? 1123 : 1247)) + 'px', 
               minHeight: (state.orient === 'portrait' ? (state.paper === 'A4' ? 1123 : 1247) : (state.paper === 'A4' ? 794 : 794)) + 'px',
               transform: `scale(${zoom})`,
               marginBottom: `-${(1-zoom) * (state.orient === 'portrait' ? (state.paper === 'A4' ? 1123 : 1247) : (state.paper === 'A4' ? 794 : 794))}px`
             }">
          <div class="min-h-full flex flex-col" :style="{ padding: (state.margin * 3.78) + 'px' }">
            
            <div v-if="!state.tree.length" class="border-2 border-dashed border-[#dde5e4] rounded-xl m-[30px] p-[60px_30px] text-center text-[#5b6b6d]">
              <b class="text-[#1c2b2d]">Kanvas kosong.</b><br>Seret widget dari panel kiri ke sini,<br>atau klik widget untuk menambahkannya.
            </div>

            <template v-for="(w, idx) in state.tree" :key="w.id">
              <!-- Drop Zone Before -->
              <div class="drop-zone" @drop="onDropZone($event, state.tree, idx)" @dragover.prevent>
                 <div class="drop-indicator"></div>
              </div>
              
              <!-- Widget -->
              <div 
                class="wgt rp" 
                :class="{ 'selected': selectedId === w.id }" 
                draggable="true" 
                @dragstart="onDragStartCanvas($event, w.id)" 
                @click.stop="selectWidget(w.id)"
              >
                <span class="wgt-label">{{ REGISTRY[w.type]?.name }}</span>
                <div class="wgt-toolbar">
                  <button @click.stop="actionWidget($event, 'up', w.id)" title="Naik">&uarr;</button>
                  <button @click.stop="actionWidget($event, 'down', w.id)" title="Turun">&darr;</button>
                  <button @click.stop="actionWidget($event, 'dup', w.id)" title="Duplikat">&#10697;</button>
                  <button @click.stop="actionWidget($event, 'del', w.id)" title="Hapus">&#128465;</button>
                </div>

                <div v-if="w.type === 'column_layout'" class="rp-cols pad" :style="{ gridTemplateColumns: `repeat(${w.props.cols || 2}, 1fr)` }">
                  <div v-for="(slotArgs, cIdx) in (w.slots || [])" :key="cIdx" class="min-h-[60px] border border-dashed border-[#dde5e4] p-1.5 relative flex flex-col gap-1 rounded"
                       @dragover.prevent @drop.stop="onDropZone($event, slotArgs, slotArgs.length)">
                    
                    <div v-if="!slotArgs.length" class="absolute inset-0 flex items-center justify-center text-slate-400 font-semibold text-[10px] pointer-events-none tracking-widest uppercase">
                       KOLOM {{ cIdx + 1 }}
                    </div>

                    <template v-for="(cw, cWidx) in slotArgs" :key="cw.id">
                      <!-- Drop Zone for Child -->
                      <div class="drop-zone" @drop.stop="onDropZone($event, slotArgs, cWidx)" @dragover.prevent>
                         <div class="drop-indicator"></div>
                      </div>
                      
                      <!-- Child Widget -->
                      <div class="wgt rp" :class="{ 'selected': selectedId === cw.id }" 
                           draggable="true" @dragstart.stop="onDragStartCanvas($event, cw.id)" 
                           @click.stop="selectWidget(cw.id)">
                         <span class="wgt-label">{{ REGISTRY[cw.type]?.name }}</span>
                         <div class="wgt-toolbar">
                           <button @click.stop="actionWidget($event, 'up', cw.id)" title="Naik">&uarr;</button>
                           <button @click.stop="actionWidget($event, 'down', cw.id)" title="Turun">&darr;</button>
                           <button @click.stop="actionWidget($event, 'dup', cw.id)" title="Duplikat">&#10697;</button>
                           <button @click.stop="actionWidget($event, 'del', cw.id)" title="Hapus">&#128465;</button>
                         </div>
                         <div v-html="renderWidgetHTML(cw, null, true)"></div>
                      </div>
                    </template>
                  </div>
                </div>
                <div v-else v-html="renderWidgetHTML(w, null, true)"></div>
              </div>
            </template>
            <!-- Final Drop Zone -->
            <div class="drop-zone flex-1 min-h-[50px]" @drop="onDropZone($event, state.tree, state.tree.length)" @dragover.prevent>
               <div class="drop-indicator"></div>
            </div>

          </div>
        </div>
      </main>

      <!-- RIGHT: Properties -->
      <aside class="w-[268px] bg-white border-l border-[#dde5e4] overflow-y-auto shrink-0 builder-panel flex flex-col">
        <h3 class="builder-h3">{{ selectedWidgetProps ? 'Widget: ' + REGISTRY[selectedWidgetProps.type].name : 'Setelan Halaman' }}</h3>
        
        <div class="p-[6px_14px_20px]" v-if="!selectedWidgetProps">
          <div class="field"><label>Ukuran Kertas</label>
            <div class="seg">
              <button :class="{on: state.paper === 'A4'}" @click="snapshot(); state.paper = 'A4'">A4</button>
              <button :class="{on: state.paper === 'F4'}" @click="snapshot(); state.paper = 'F4'">F4 / Folio</button>
            </div>
          </div>
          <div class="field"><label>Orientasi</label>
            <div class="seg">
              <button :class="{on: state.orient === 'portrait'}" @click="snapshot(); state.orient = 'portrait'">Portrait</button>
              <button :class="{on: state.orient === 'landscape'}" @click="snapshot(); state.orient = 'landscape'">Landscape</button>
            </div>
          </div>
          <div class="field"><label>Margin Halaman (mm)</label>
             <input type="number" v-model.number="state.margin" @change="snapshot()" min="5" max="40" class="builder-input">
          </div>
          <div class="divider"></div>
          <div class="small-note">💡 Klik widget di kanvas untuk mengubah propertinya. Seret widget dari panel kiri untuk menambah.</div>
        </div>

        <div class="p-[6px_14px_20px]" v-else-if="selectedWidgetProps">
          
          <template v-if="selectedWidgetProps.type === 'section_block' || selectedWidgetProps.type === 'homeroom_notes'">
            <div class="field"><label>{{ selectedWidgetProps.type === 'homeroom_notes' ? 'Judul Kotak Catatan' : 'Judul Seksi' }}</label><input type="text" v-model="selectedWidgetProps.props.title" @change="snapshot()" class="builder-input"></div>
          </template>

          <template v-else-if="selectedWidgetProps.type === 'column_layout'">
             <div class="field"><label>Jumlah Kolom</label>
               <select v-model.number="selectedWidgetProps.props.cols" @change="snapshot()" class="builder-input">
                 <option :value="2">2</option><option :value="3">3</option>
               </select>
             </div>
          </template>

          <template v-else-if="selectedWidgetProps.type === 'header_school'">
             <label class="check"><input type="checkbox" v-model="selectedWidgetProps.props.showNpsn" @change="snapshot()">Tampilkan NPSN</label>
             <label class="check"><input type="checkbox" v-model="selectedWidgetProps.props.showAddress" @change="snapshot()">Tampilkan Alamat</label>
          </template>
          
          <template v-else-if="selectedWidgetProps.type === 'student_identity'">
             <label class="check"><input type="checkbox" v-model="selectedWidgetProps.props.showNisn" @change="snapshot()">Tampilkan NISN</label>
             <label class="check"><input type="checkbox" v-model="selectedWidgetProps.props.showWali" @change="snapshot()">Tampilkan Guru Kelas</label>
          </template>

          <template v-else-if="selectedWidgetProps.type === 'signature_block'">
            <div class="field"><label>Tempat</label><input type="text" v-model="selectedWidgetProps.props.place" @change="snapshot()" class="builder-input"></div>
            <div class="field"><label>Tanggal Cetak</label><input type="text" v-model="selectedWidgetProps.props.date" @change="snapshot()" class="builder-input"></div>
            <div class="field"><label>Nama Kepala Sekolah</label><input type="text" v-model="selectedWidgetProps.props.kepsek" @change="snapshot()" class="builder-input"></div>
          </template>
          
          <template v-else-if="selectedWidgetProps.type === 'desc_table'">
            <div class="field"><label>Gunakan Sub-Indikator?</label>
              <div class="seg">
                <button :class="{on: selectedWidgetProps.props.hasSub !== false}" @click="snapshot(); selectedWidgetProps.props.hasSub = true">Ya (Grup)</button>
                <button :class="{on: selectedWidgetProps.props.hasSub === false}" @click="snapshot(); selectedWidgetProps.props.hasSub = false">Tidak (List)</button>
              </div>
            </div>
            
            <div class="field" v-if="selectedWidgetProps.props.items"><label>Elemen Penilaian</label>
              <div v-for="(it, i) in selectedWidgetProps.props.items" :key="i" class="mb-3 p-2 bg-slate-50 border border-slate-200 rounded">
                <input type="text" v-model="it.name" class="builder-input mb-1 font-bold text-xs" placeholder="Nama Elemen">
                <div v-if="selectedWidgetProps.props.hasSub !== false" class="ml-2 pl-2 border-l-2 border-slate-300">
                  <div v-for="(sub, si) in it.subs" :key="si" class="flex gap-1 mb-1">
                    <input type="text" v-model="sub.label" class="builder-input text-[11px] py-1" placeholder="Indikator">
                    <button @click="it.subs.splice(si, 1); snapshot()" class="text-red-500 font-bold px-1" title="Hapus">&times;</button>
                  </div>
                  <button @click="it.subs.push({label:'', ref_id: generateUid()}); snapshot()" class="text-[10px] text-violet-600 font-bold mt-1">+ Tambah Indikator</button>
                </div>
              </div>
              <button @click="selectedWidgetProps.props.items.push({name:'Elemen Baru', label:'Elemen Baru', subs:[]}); snapshot()" class="w-full text-xs py-1.5 border border-dashed border-violet-400 text-violet-600 rounded font-bold">+ Tambah Elemen</button>
            </div>
            <div class="divider"></div>
            <div class="field"><label>Skala Penilaian</label>
              <select v-model="selectedWidgetProps.props.scale" @change="snapshot()" class="builder-input">
                <option value="BB/MB/BSH/BSB">BB/MB/BSH/BSB</option>
                <option value="B/C/K">B/C/K</option>
              </select>
            </div>
          </template>

          <template v-else-if="selectedWidgetProps.type === 'grade_table'">
            <!-- KKM Value -->
            <div class="field">
              <label>Kriteria KKM</label>
              <div class="flex items-center gap-3">
                <input type="number" v-model.number="selectedWidgetProps.props.kkm" min="0" max="100" @change="snapshot()" class="builder-input w-16">
                <label class="check flex-1 mb-0 flex items-center gap-1.5 leading-tight">
                  <input type="checkbox" v-model="selectedWidgetProps.props.sortBelowKkm" @change="snapshot()">
                  <span class="text-xs">Sorot nilai di bawah KKM</span>
                </label>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Column Visibility -->
            <div class="field">
              <label>Format Kolom Tabel</label>
              <div class="text-[10px] text-slate-400 mb-2">Kelola nama kolom, urutan, dan visibilitas kolom tabel. Minimal 1 kolom harus aktif/terlihat.</div>
              <div v-if="selectedWidgetProps.props.cols" class="space-y-1">
                <div v-for="(col, ci) in selectedWidgetProps.props.cols" :key="ci" 
                  class="flex items-center gap-1.5 py-1 px-1.5 rounded transition-colors"
                  :class="(col.on === false || col.visible === false) ? 'bg-slate-100 opacity-50' : 'bg-slate-50 border border-slate-100'">
                  <button @click="ci > 0 && (selectedWidgetProps.props.cols.splice(ci-1, 0, selectedWidgetProps.props.cols.splice(ci, 1)[0]), snapshot())" class="text-slate-400 hover:text-slate-700 px-0.5 text-xs" title="Naik">↑</button>
                  <button @click="ci < selectedWidgetProps.props.cols.length-1 && (selectedWidgetProps.props.cols.splice(ci+1, 0, selectedWidgetProps.props.cols.splice(ci, 1)[0]), snapshot())" class="text-slate-400 hover:text-slate-700 px-0.5 text-xs" title="Turun">↓</button>
                  <span class="font-semibold text-[11px] flex-1 truncate" :class="(col.on === false || col.visible === false) ? 'line-through text-slate-400' : ''">{{ col.label }}</span>
                  <button
                    :title="(col.on === false || col.visible === false) ? 'Tampilkan' : 'Sembunyikan'"
                    @click="() => { 
                      snapshot();
                      if (col.on === false || col.visible === false) {
                        col.on = true; col.visible = true;
                      } else {
                        col.on = false; col.visible = false;
                      }
                      selectedWidgetProps.props.cols = [...selectedWidgetProps.props.cols];
                    }"
                    class="flex-none px-1 transition-colors"
                    :class="(col.on === false || col.visible === false) ? 'text-slate-400 hover:text-slate-600' : 'text-teal-600 hover:text-teal-800'">
                    <EyeOff v-if="col.on === false || col.visible === false" :size="14" />
                    <Eye v-else :size="14" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Add Custom Column -->
            <div class="field">
              <label>Tambah Kolom Kustom</label>
              <div class="flex flex-col gap-2">
                <div class="flex gap-2">
                  <input type="text" id="grade-col-label" placeholder="Label Kolom (contoh: UTS)" class="builder-input flex-1 text-[11px]">
                  <input type="text" id="grade-col-key" placeholder="Key Kolom (contoh: uts)" class="builder-input w-28 text-[11px]">
                </div>
                <button class="w-full py-1.5 bg-violet-600 text-white text-[11px] font-bold rounded hover:bg-violet-500 transition-all"
                  @click="() => {
                    const lbl = document.getElementById('grade-col-label')?.value?.trim();
                    const key = document.getElementById('grade-col-key')?.value?.trim();
                    if (lbl && key) {
                      if (!selectedWidgetProps.props.cols) selectedWidgetProps.props.cols = [];
                      selectedWidgetProps.props.cols.push({k: key, label: lbl, on: true});
                      document.getElementById('grade-col-label').value = '';
                      document.getElementById('grade-col-key').value = '';
                      snapshot();
                    }
                  }">+ Tambah Kolom</button>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Subject (Mata Pelajaran) Bindings -->
            <div class="field">
              <label>Mata Pelajaran (Data Bindings)</label>
              <div v-if="selectedWidgetProps.props.items" class="space-y-1 mb-2">
                <div v-for="(item, i) in selectedWidgetProps.props.items" :key="i"
                  class="flex items-center gap-1.5 rounded px-1.5 py-1 transition-colors"
                  :class="(typeof item === 'object' && item.hidden) ? 'bg-slate-100 opacity-50' : 'bg-slate-50 border border-slate-100'">
                  <span class="text-[10px] text-slate-400 w-4 text-right flex-none">{{ i+1 }}</span>
                  <input type="text"
                    :value="typeof item === 'string' ? item : (item.label || item.name)"
                    :disabled="typeof item === 'object' && item.hidden"
                    @change="e => {
                      snapshot();
                      if (typeof selectedWidgetProps.props.items[i] === 'string') {
                        selectedWidgetProps.props.items[i] = { name: e.target.value, label: e.target.value, hidden: false };
                      } else {
                        selectedWidgetProps.props.items[i].label = e.target.value;
                        selectedWidgetProps.props.items[i].name = e.target.value;
                      }
                    }"
                    class="builder-input flex-1 text-[11px] py-1">
                  <!-- Eye toggle: hides/shows the row in the rendered table -->
                  <button
                    :title="(typeof item === 'object' && item.hidden) ? 'Tampilkan' : 'Sembunyikan'"
                    @click="() => {
                      snapshot();
                      const cur = selectedWidgetProps.props.items[i];
                      if (typeof cur === 'string') {
                        selectedWidgetProps.props.items[i] = { name: cur, label: cur, hidden: true };
                      } else {
                        cur.hidden = !cur.hidden;
                      }
                      // trigger explicit reactivity for the canvas render
                      selectedWidgetProps.props.items = [...selectedWidgetProps.props.items];
                    }"
                    class="flex-none px-1 transition-colors"
                    :class="(typeof item === 'object' && item.hidden) ? 'text-slate-400 hover:text-slate-600' : 'text-teal-600 hover:text-teal-800'">
                    <EyeOff v-if="typeof item === 'object' && item.hidden" :size="14" />
                    <Eye v-else :size="14" />
                  </button>
                </div>
              </div>
              <button
                @click="() => {
                  if (!selectedWidgetProps.props.items) selectedWidgetProps.props.items = [];
                  selectedWidgetProps.props.items.push({ name: 'Mata Pelajaran Baru', label: 'Mata Pelajaran Baru', hidden: false });
                  snapshot();
                }"
                class="w-full text-xs py-1.5 border border-dashed border-violet-400 text-violet-600 rounded font-bold hover:bg-violet-50 transition-colors">
                + Tambah Mata Pelajaran
              </button>
            </div>
          </template>

          <template v-else-if="selectedWidgetProps.type === 'extracurricular'">
            <!-- Column Visibility -->
            <div class="field">
              <label>Format Kolom Ekstrakurikuler</label>
              <div class="text-[10px] text-slate-400 mb-2">Kelola nama kolom, urutan, dan visibilitas kolom tabel. Minimal 1 kolom harus aktif/terlihat.</div>
              <div v-if="selectedWidgetProps.props.cols" class="space-y-1">
                <div v-for="(col, ci) in selectedWidgetProps.props.cols" :key="ci" 
                  class="flex items-center gap-1.5 py-1 px-1.5 rounded transition-colors"
                  :class="(col.on === false || col.visible === false) ? 'bg-slate-100 opacity-50' : 'bg-slate-50 border border-slate-100'">
                  <button @click="ci > 0 && (selectedWidgetProps.props.cols.splice(ci-1, 0, selectedWidgetProps.props.cols.splice(ci, 1)[0]), snapshot())" class="text-slate-400 hover:text-slate-700 px-0.5 text-xs" title="Naik">↑</button>
                  <button @click="ci < selectedWidgetProps.props.cols.length-1 && (selectedWidgetProps.props.cols.splice(ci+1, 0, selectedWidgetProps.props.cols.splice(ci, 1)[0]), snapshot())" class="text-slate-400 hover:text-slate-700 px-0.5 text-xs" title="Turun">↓</button>
                  <span class="font-semibold text-[11px] flex-1 truncate" :class="(col.on === false || col.visible === false) ? 'line-through text-slate-400' : ''">{{ col.label }}</span>
                  <button
                    :title="(col.on === false || col.visible === false) ? 'Tampilkan' : 'Sembunyikan'"
                    @click="() => { 
                      snapshot();
                      if (col.on === false || col.visible === false) {
                        col.on = true; col.visible = true;
                      } else {
                        col.on = false; col.visible = false;
                      }
                      selectedWidgetProps.props.cols = [...selectedWidgetProps.props.cols];
                    }"
                    class="flex-none px-1 transition-colors"
                    :class="(col.on === false || col.visible === false) ? 'text-slate-400 hover:text-slate-600' : 'text-teal-600 hover:text-teal-800'">
                    <EyeOff v-if="col.on === false || col.visible === false" :size="14" />
                    <Eye v-else :size="14" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Add Custom Column -->
            <div class="field">
              <label>Tambah Kolom Kustom</label>
              <div class="flex flex-col gap-2">
                <div class="flex gap-2">
                  <input type="text" id="ekskul-col-label" placeholder="Label Kolom (contoh: Kategori)" class="builder-input flex-1 text-[11px]">
                  <input type="text" id="ekskul-col-key" placeholder="Key Kolom (contoh: cat)" class="builder-input w-28 text-[11px]">
                </div>
                <button class="w-full py-1.5 bg-violet-600 text-white text-[11px] font-bold rounded hover:bg-violet-500 transition-all"
                  @click="() => {
                    const lbl = document.getElementById('ekskul-col-label')?.value?.trim();
                    const key = document.getElementById('ekskul-col-key')?.value?.trim();
                    if (lbl && key) {
                      if (!selectedWidgetProps.props.cols) selectedWidgetProps.props.cols = [];
                      selectedWidgetProps.props.cols.push({k: key, label: lbl, on: true});
                      document.getElementById('ekskul-col-label').value = '';
                      document.getElementById('ekskul-col-key').value = '';
                      snapshot();
                    }
                  }">+ Tambah Kolom</button>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Subject (Ekstrakurikuler) Bindings -->
            <div class="field">
              <label>Daftar Ekstrakurikuler (Data Bindings)</label>
              <div v-if="selectedWidgetProps.props.items" class="space-y-1 mb-2">
                <div v-for="(item, i) in selectedWidgetProps.props.items" :key="i"
                  class="flex items-center gap-1.5 rounded px-1.5 py-1 transition-colors"
                  :class="(typeof item === 'object' && item.hidden) ? 'bg-slate-100 opacity-50' : 'bg-slate-50 border border-slate-100'">
                  <span class="text-[10px] text-slate-400 w-4 text-right flex-none">{{ i+1 }}</span>
                  <input type="text"
                    :value="typeof item === 'string' ? item : (item.label || item.name)"
                    :disabled="typeof item === 'object' && item.hidden"
                    @change="e => {
                      snapshot();
                      if (typeof selectedWidgetProps.props.items[i] === 'string') {
                        selectedWidgetProps.props.items[i] = { name: e.target.value, label: e.target.value, hidden: false };
                      } else {
                        selectedWidgetProps.props.items[i].label = e.target.value;
                        selectedWidgetProps.props.items[i].name = e.target.value;
                      }
                    }"
                    class="builder-input flex-1 text-[11px] py-1">
                  <!-- Eye toggle: hides/shows the row in the rendered table -->
                  <button
                    :title="(typeof item === 'object' && item.hidden) ? 'Tampilkan' : 'Sembunyikan'"
                    @click="() => {
                      snapshot();
                      const cur = selectedWidgetProps.props.items[i];
                      if (typeof cur === 'string') {
                        selectedWidgetProps.props.items[i] = { name: cur, label: cur, hidden: true };
                      } else {
                        cur.hidden = !cur.hidden;
                      }
                      // trigger explicit reactivity for the canvas render
                      selectedWidgetProps.props.items = [...selectedWidgetProps.props.items];
                    }"
                    class="flex-none px-1 transition-colors"
                    :class="(typeof item === 'object' && item.hidden) ? 'text-slate-400 hover:text-slate-600' : 'text-teal-600 hover:text-teal-800'">
                    <EyeOff v-if="typeof item === 'object' && item.hidden" :size="14" />
                    <Eye v-else :size="14" />
                  </button>
                </div>
              </div>
              <button
                @click="() => {
                  if (!selectedWidgetProps.props.items) selectedWidgetProps.props.items = [];
                  selectedWidgetProps.props.items.push({ name: 'Ekskul Baru', label: 'Ekskul Baru', hidden: false });
                  snapshot();
                }"
                class="w-full text-xs py-1.5 border border-dashed border-violet-400 text-violet-600 rounded font-bold hover:bg-violet-50 transition-colors">
                + Tambah Ekstrakurikuler
              </button>
            </div>
          </template>

          <template v-else>
             <div class="prop-empty text-[#5b6b6d] p-6 text-center text-xs">Konfigurasi visual tersedia di widget. Edit JSON / Data secara manual jika diperlukan.</div>
          </template>

          <div class="divider"></div>

          <!-- Global Widget Properties (Margin) -->
          <div class="field">
            <label class="font-bold border-b pb-1 mb-2 border-slate-100 flex items-center justify-between">
              Margin / Jarak Luar
              <span class="text-slate-400 font-normal text-[10px]">(px)</span>
            </label>
            <div class="grid grid-cols-2 gap-2 text-[11px]">
               <div class="flex items-center gap-1.5"><span class="w-10 text-slate-500">Atas</span><input type="number" class="builder-input w-full px-1.5 py-1" :value="selectedWidgetProps.props.marginTop || 0" @change="e => { snapshot(); selectedWidgetProps.props.marginTop = Number(e.target.value) }" /></div>
               <div class="flex items-center gap-1.5"><span class="w-10 text-slate-500">Bawah</span><input type="number" class="builder-input w-full px-1.5 py-1" :value="selectedWidgetProps.props.marginBottom || 0" @change="e => { snapshot(); selectedWidgetProps.props.marginBottom = Number(e.target.value) }" /></div>
               <div class="flex items-center gap-1.5"><span class="w-10 text-slate-500">Kiri</span><input type="number" class="builder-input w-full px-1.5 py-1" :value="selectedWidgetProps.props.marginLeft || 0" @change="e => { snapshot(); selectedWidgetProps.props.marginLeft = Number(e.target.value) }" /></div>
               <div class="flex items-center gap-1.5"><span class="w-10 text-slate-500">Kanan</span><input type="number" class="builder-input w-full px-1.5 py-1" :value="selectedWidgetProps.props.marginRight || 0" @change="e => { snapshot(); selectedWidgetProps.props.marginRight = Number(e.target.value) }" /></div>
            </div>
          </div>

          <div class="divider"></div><div class="small-note">Data binding: widget ini otomatis tersambung ke elemen database berdasarkan label saat disimpan.</div>
        </div>

      </aside>
    </div>

    <!-- Empty state when no template selected -->
    <div v-else class="flex-1 flex flex-col items-center justify-center bg-slate-50">
       <LayoutTemplate class="text-slate-300 mb-4" :size="64"/>
       <p class="text-lg font-bold text-slate-700">Pilih Template Rapor</p>
       <p class="text-xs text-slate-500 mt-2">Pilih unit sekolah dan template di atas untuk membuka Visual Builder.</p>
    </div>

    <BaseModal :show="showConfirmModal" title="Peringatan Perubahan Template TK" size="md" @close="showConfirmModal = false">
      <div class="space-y-4 text-sm text-slate-700">
        <div class="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle class="shrink-0 mt-0.5" :size="20" />
          <div>
            <p class="font-bold mb-1">Menghapus Elemen = Menyembunyikan Nilai</p>
            <p class="text-xs leading-relaxed">Jika template ini sudah pernah digunakan untuk mengisi nilai rapor siswa TK, maka <strong>MENGHAPUS</strong> elemen/indikator di kanvas akan membuat nilai yang sudah terinput sebelumnya menjadi <strong>tersembunyi</strong> (karena ID-nya berubah).</p>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-start gap-3">
          <HelpCircle class="shrink-0 mt-0.5" :size="20" />
          <div>
            <p class="font-bold mb-1">💡 Tips Aman Mengedit Indikator</p>
            <p class="text-xs leading-relaxed">Jika Anda hanya ingin memperbaiki salah ketik atau mengubah redaksi kalimat indikator, <strong>cukup klik elemennya lalu edit teks pada panel properti di sebelah kanan.</strong> Jangan menghapus widget lalu menambahkannya ulang.</p>
          </div>
        </div>

        <p class="font-semibold text-center mt-6 mb-2">Apakah Anda yakin ingin menyimpan perubahan visual ini?</p>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <BaseButton variant="outline" @click="showConfirmModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="executeSaveTemplate">Ya, Simpan Perubahan</BaseButton>
        </div>
      </div>
    </BaseModal>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap');

.builder-root {
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.builder-btn {
  font: inherit; font-weight: 600; border: 1px solid #dde5e4; background: #fff; color: #1c2b2d;
  padding: 7px 13px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; transition: background 0.12s;
}
.builder-btn:hover:not(:disabled) { background: #f4f8f7; }
.builder-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.builder-btn.primary { background: #0e7d6d; border-color: #0e7d6d; color: #fff; }
.builder-btn.primary:hover:not(:disabled) { background: #0a5a4e; }
.builder-btn.icon { padding: 7px 9px; }

.builder-panel .builder-h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #5b6b6d; padding: 14px 14px 8px; font-weight: 700; }
.pal-item {
  display: flex; align-items: center; gap: 9px; padding: 8px 9px; border: 1px solid #dde5e4; border-radius: 8px;
  margin-bottom: 6px; cursor: grab; background: #fff; transition: all 0.12s;
}
.pal-item:hover { border-color: #0e7d6d; box-shadow: 0 1px 4px rgba(14,125,109,.15); }
.pal-item .ic { width: 26px; height: 26px; border-radius: 6px; background: #e3f2ef; color: #0a5a4e; display: grid; place-items: center; font-size: 13px; flex: none; font-weight: bold;}
.pal-item .nm { font-weight: 600; font-size: 12.5px; }
.pal-item .hint { font-size: 10.5px; color: #5b6b6d; }

.bg-canvas {
  background: radial-gradient(circle at 1px 1px, #d7e0de 1px, transparent 0) 0 0/22px 22px, #eef2f1;
}
.shadow-paper { box-shadow: 0 2px 6px rgba(28,43,45,.08), 0 12px 32px rgba(28,43,45,.10); }

/* Canvas Drag Drop */
.drop-zone { min-height: 24px; position: relative; }
.drop-indicator { height: 3px; background: #0e7d6d; border-radius: 2px; margin: 2px 8px; display: none; position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); }
.drop-zone:hover .drop-indicator { display: block; opacity: 0.5; }

.wgt { position: relative; border: 1.5px solid transparent; border-radius: 4px; transition: border-color 0.1s; cursor: grab; }
.wgt:hover { border-color: #bcd8d2; }
.wgt.selected { border-color: #0e7d6d; }
.wgt-toolbar { position: absolute; top: -13px; right: 6px; display: none; gap: 2px; background: #0e7d6d; border-radius: 6px; padding: 2px; z-index: 4; }
.wgt.selected .wgt-toolbar, .wgt:hover .wgt-toolbar { display: flex; }
.wgt-toolbar button { border: none; background: transparent; color: #fff; width: 22px; height: 20px; border-radius: 4px; cursor: pointer; font-size: 11px; display: grid; place-items: center; }
.wgt-toolbar button:hover { background: rgba(255,255,255,.22); }
.wgt-label { position: absolute; top: -13px; left: 6px; display: none; background: #0e7d6d; color: #fff; font-size: 9.5px; font-weight: 700; padding: 2px 7px; border-radius: 6px; letter-spacing: 0.3px; z-index: 4; }
.wgt.selected .wgt-label, .wgt:hover .wgt-label { display: block; }

/* Property panel */
.field { margin-bottom: 12px; }
.field label { display: block; font-size: 11px; font-weight: 700; color: #5b6b6d; margin-bottom: 5px; }
.builder-input { width: 100%; font: inherit; font-size: 12.5px; border: 1px solid #dde5e4; border-radius: 7px; padding: 7px 9px; outline: none; background: #fff; }
.builder-input:focus { border-color: #0e7d6d; }
.seg { display: flex; border: 1px solid #dde5e4; border-radius: 8px; overflow: hidden; }
.seg button { flex: 1; font: inherit; font-size: 12px; font-weight: 600; border: none; background: #fff; padding: 7px 0; cursor: pointer; color: #5b6b6d; }
.seg button.on { background: #0e7d6d; color: #fff; }
.check { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 500; margin-bottom: 8px; cursor: pointer; }
.divider { border-top: 1px solid #dde5e4; margin: 12px 0; }
.small-note { font-size: 11px; color: #5b6b6d; line-height: 1.5; background: #e3f2ef; border-radius: 8px; padding: 9px 11px; }

.small-note { font-size: 11px; color: #5b6b6d; line-height: 1.5; background: #e3f2ef; border-radius: 8px; padding: 9px 11px; }

</style>
