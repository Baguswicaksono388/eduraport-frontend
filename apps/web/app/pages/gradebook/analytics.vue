<script setup lang="ts">
import { 
  BarChart3, 
  LineChart, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  Download, 
  Info, 
  BookOpen, 
  ChevronRight, 
  Sparkles, 
  Search,
  CheckCircle,
  HelpCircle,
  Eye
} from 'lucide-vue-next'
import { BaseCard, BaseButton } from '@eduraport/ui'
import { useSchool } from '../../composables/useSchool'
import { useClass } from '../../composables/useClass'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useGradebook } from '../../composables/useGradebook'
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

const { foundations, schools, fetchFoundations, fetchSchools } = useSchool()
const { classes, fetchClasses } = useClass()
const { academicYears, fetchAcademicYears } = useAcademicYear()
const gradebook = useGradebook()
const toast = useToast()

const selectedFoundationId = ref('')
const selectedSchoolId = ref('')
const selectedClassId = ref('')
const selectedAcademicYearId = ref('')
const selectedSemester = ref('odd') // odd or even

const activeTab = ref('recap') // recap, subject, progression, warning
const loading = ref(false)

// Data States
const recapData = ref<any>(null)
const selectedSchemeId = ref('')
const distributionData = ref<any>(null)
const warningData = ref<any>([])
const selectedStudentId = ref('')
const progressionData = ref<any>([])

// UI Toggles
const showRanking = ref(true)
const searchQuery = ref('')
const selectedDistributionPredicate = ref('all')

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
      academicYears.value = []
    }
  }
})

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    selectedClassId.value = ''
    await loadSchoolData(newVal)
  } else {
    classes.value = []
    academicYears.value = []
  }
})

// Trigger reload on filter change
watch([selectedClassId, selectedAcademicYearId, selectedSemester], async () => {
  await handleFilterChange()
})

const handleFilterChange = async () => {
  if (!selectedClassId.value || !selectedAcademicYearId.value) return
  
  loading.value = true
  try {
    if (activeTab.value === 'recap') {
      await loadRecapitulation()
    } else if (activeTab.value === 'subject') {
      await loadRecapitulation() // Needed to get subjects listing
      if (recapData.value?.level === 'TK') {
        if (recapData.value?.elements?.length > 0) {
          selectedSchemeId.value = recapData.value.elements[0].id
          await loadDistribution()
        } else {
          distributionData.value = null
        }
      } else {
        if (recapData.value?.subjects?.length > 0) {
          selectedSchemeId.value = recapData.value.subjects[0].scheme_id
          await loadDistribution()
        } else {
          distributionData.value = null
        }
      }
    } else if (activeTab.value === 'progression') {
      await loadRecapitulation() // Needed for student listing
      if (recapData.value?.students?.length > 0) {
        selectedStudentId.value = recapData.value.students[0].id
        await loadProgression()
      } else {
        progressionData.value = []
      }
    } else if (activeTab.value === 'warning') {
      await loadEarlyWarning()
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal memuat data analitik', 'Gagal')
  } finally {
    loading.value = false
  }
}

const handleTabChange = async (tabName: string) => {
  activeTab.value = tabName
  await handleFilterChange()
}

const loadRecapitulation = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value || !selectedAcademicYearId.value) return
  
  const res: any = await gradebook.fetchClassRecapitulation(
    selectedSchoolId.value,
    selectedClassId.value,
    selectedAcademicYearId.value,
    selectedSemester.value
  )
  if (res.success) {
    recapData.value = res.data
  }
}

const loadDistribution = async () => {
  if (!selectedSchoolId.value || !selectedSchemeId.value) return
  let params: any = {}
  if (recapData.value?.level === 'TK') {
    params = {
      element_id: selectedSchemeId.value,
      academic_year_id: selectedAcademicYearId.value,
      semester: selectedSemester.value
    }
  } else {
    params = { scheme_id: selectedSchemeId.value }
  }
  const res: any = await gradebook.fetchClassDistribution(selectedSchoolId.value, params)
  if (res.success) {
    distributionData.value = res.data
  }
}

const loadProgression = async () => {
  if (!selectedSchoolId.value || !selectedStudentId.value) return
  const res: any = await gradebook.fetchStudentProgression(selectedSchoolId.value, selectedStudentId.value)
  if (res.success) {
    progressionData.value = res.data
  }
}

const loadEarlyWarning = async () => {
  if (!selectedSchoolId.value || !selectedClassId.value || !selectedAcademicYearId.value) return
  const res: any = await gradebook.fetchEarlyWarning(
    selectedSchoolId.value,
    selectedClassId.value,
    selectedAcademicYearId.value,
    selectedSemester.value
  )
  if (res.success) {
    warningData.value = res.data
  }
}

// Watchers for tab-specific sub-filters
watch(selectedSchemeId, async () => {
  if (selectedSchemeId.value && activeTab.value === 'subject') {
    loading.value = true
    await loadDistribution()
    loading.value = false
  }
})

watch(selectedStudentId, async () => {
  if (selectedStudentId.value && activeTab.value === 'progression') {
    loading.value = true
    await loadProgression()
    loading.value = false
  }
})

// Search & filter helpers
const filteredRecapStudents = computed(() => {
  if (!recapData.value?.students) return []
  let list = [...recapData.value.students]
  
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(s => 
      s.full_name.toLowerCase().includes(q) || 
      (s.student_number && s.student_number.includes(q))
    )
  }

  // Sort by name or by rank
  if (showRanking.value && recapData.value.level !== 'TK') {
    return list.sort((a, b) => {
      if (a.rank === 0) return 1
      if (b.rank === 0) return -1
      return a.rank - b.rank
    })
  }
  return list.sort((a, b) => a.full_name.localeCompare(b.full_name))
})

const getPassingRate = computed(() => {
  if (!distributionData.value?.students || !recapData.value) return 0
  if (recapData.value.level === 'TK') {
    const total = distributionData.value.students.length
    if (total === 0) return 0
    const passed = distributionData.value.students.filter(s => ['BSH', 'BSB'].includes(s.predicate)).length
    return Math.round((passed / total) * 100)
  }
  const activeScheme = recapData.value.subjects?.find(s => s.scheme_id === selectedSchemeId.value)
  const kkmVal = activeScheme?.kkm_score || 70
  
  const total = distributionData.value.students.length
  if (total === 0) return 0
  
  const passed = distributionData.value.students.filter(s => s.final_score >= kkmVal).length
  return Math.round((passed / total) * 100)
})

const filteredDistributionStudents = computed(() => {
  if (!distributionData.value?.students) return []
  const list = distributionData.value.students
  
  if (selectedDistributionPredicate.value === 'all') {
    return list
  }
  return list.filter(s => s.predicate === selectedDistributionPredicate.value)
})

const getTKGradeColor = (grade: string) => {
  const classes: Record<string, string> = {
    BB: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    MB: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    BSH: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    BSB: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
  }
  return classes[grade] || 'bg-slate-100 text-slate-600'
}

const getTKGradeLabel = (grade: string) => {
  const labels: Record<string, string> = {
    BB: 'Belum Berkembang (BB)',
    MB: 'Mulai Berkembang (MB)',
    BSH: 'Berkembang Sesuai Harapan (BSH)',
    BSB: 'Berkembang Sangat Baik (BSB)'
  }
  return labels[grade] || grade
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <BarChart3 class="text-violet-600" /> Rekapitulasi & Analitik Nilai
        </h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">
          Analisis hasil pembelajaran siswa, rekap kelas otomatis, visualisasi sebaran nilai, dan peringatan dini ketuntasan.
        </p>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
      <div class="flex flex-col gap-1.5 lg:col-span-2">
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

    <!-- Main Content Area -->
    <div v-if="!selectedClassId" class="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm text-center">
      <Users class="text-slate-350 dark:text-zinc-700 mb-3 animate-bounce" :size="48" />
      <p class="text-sm font-bold text-slate-700 dark:text-zinc-200">Pilih Kelas Terlebih Dahulu</p>
      <p class="text-xs text-slate-400 max-w-sm mt-1">
        Silakan pilih Unit Sekolah dan Kelas pada filter di atas untuk melihat visualisasi dan statistik rekapitulasi nilai.
      </p>
    </div>

    <div v-else class="space-y-6">
      <!-- Tabs Selector -->
      <div class="flex border-b border-slate-200 dark:border-zinc-800">
        <button 
          @click="handleTabChange('recap')"
          class="px-5 py-3 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-1.5"
          :class="activeTab === 'recap' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'"
        >
          <Users :size="14" /> Rekapitulasi Kelas
        </button>
        <button 
          @click="handleTabChange('subject')"
          class="px-5 py-3 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-1.5"
          :class="activeTab === 'subject' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'"
        >
          <BookOpen :size="14" /> Analisis Mapel
        </button>
        <button 
          @click="handleTabChange('progression')"
          class="px-5 py-3 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-1.5"
          :class="activeTab === 'progression' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'"
        >
          <LineChart :size="14" /> Perkembangan Siswa
        </button>
        <button 
          @click="handleTabChange('warning')"
          class="px-5 py-3 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-1.5"
          :class="activeTab === 'warning' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'"
        >
          <AlertTriangle :size="14" /> Early Warning
        </button>
      </div>

      <!-- Loading Panel -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm">
        <div class="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mb-4"></div>
        <p class="text-xs font-bold text-slate-500">Mengkalkulasi analitik kelas...</p>
      </div>

      <!-- Tab Content: Rekapitulasi Kelas -->
      <div v-else-if="activeTab === 'recap' && recapData" class="space-y-6">
        <!-- Dashboard recap stats -->
        <div v-if="recapData.level !== 'TK'" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md">
            <p class="text-[10px] font-bold text-violet-200 uppercase tracking-wider">Rata-rata Kelas</p>
            <h3 class="text-3xl font-black mt-2">
              {{ 
                recapData.students?.length > 0 
                  ? (recapData.students.reduce((acc: number, s: any) => acc + (s.average_score || 0), 0) / recapData.students.filter((s: any) => s.average_score !== null).length).toFixed(2)
                  : '-'
              }}
            </h3>
            <p class="text-[9px] text-violet-200 mt-1">Akumulasi seluruh mata pelajaran</p>
          </div>
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm">
            <p class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Ketuntasan KKM</p>
            <h3 class="text-3xl font-black text-slate-900 dark:text-zinc-100 mt-2">
              {{ 
                recapData.students?.length > 0
                  ? Math.round((recapData.students.filter((s: any) => s.average_score >= 70).length / recapData.students.length) * 100)
                  : 0
              }}%
            </h3>
            <p class="text-[9px] text-slate-400 mt-1">Siswa dengan rata-rata diatas KKM (70)</p>
          </div>
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm">
            <p class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Mapel Terkonfigurasi</p>
            <h3 class="text-3xl font-black text-slate-900 dark:text-zinc-100 mt-2">{{ recapData.subjects?.length || 0 }}</h3>
            <p class="text-[9px] text-slate-400 mt-1">Memiliki skema penilaian semester aktif</p>
          </div>
        </div>

        <div v-else class="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950 rounded-2xl p-5 flex items-start gap-4">
          <div class="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Sparkles :size="20" />
          </div>
          <div>
            <h4 class="text-sm font-bold text-indigo-900 dark:text-indigo-300">Rekapitulasi Capaian Perkembangan TK</h4>
            <p class="text-xs text-indigo-700/80 dark:text-indigo-400/70 mt-1 leading-relaxed">
              Penilaian unit TK berbasis observasi & portofolio. Nilai rekapitulasi dirangkum ke dalam 3 elemen intrakurikuler utama (Nilai Agama & Budi Pekerti, Jati Diri, STEAM) menggunakan skala predikat (BB, MB, BSH, BSB).
            </p>
          </div>
        </div>

        <!-- Table controls -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-zinc-950 p-4 border border-slate-200/60 dark:border-zinc-800 rounded-xl">
          <div class="relative w-full sm:w-72">
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" :size="14" />
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Cari murid..." 
              class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:border-violet-600"
            />
          </div>

          <div v-if="recapData.level !== 'TK'" class="flex items-center gap-3">
            <span class="text-xs text-slate-600 dark:text-zinc-400 font-semibold">Tampilkan Urutan Ranking</span>
            <button 
              @click="showRanking = !showRanking" 
              type="button" 
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="showRanking ? 'bg-violet-600' : 'bg-slate-350 dark:bg-zinc-800'"
            >
              <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" :class="showRanking ? 'translate-x-5' : 'translate-x-0'"></span>
            </button>
          </div>
        </div>

        <!-- Recapitulation Matrix Table -->
        <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50/50 dark:bg-zinc-950 border-b border-slate-200/60 dark:border-zinc-800/80">
                  <th v-if="showRanking && recapData.level !== 'TK'" class="p-4 font-black text-slate-500 uppercase w-12 text-center">Rank</th>
                  <th class="p-4 font-black text-slate-500 uppercase">Nama Siswa</th>
                  <th class="p-4 font-black text-slate-500 uppercase text-center w-24">NIS</th>
                  
                  <!-- Dynamic headers for subjects/elements -->
                  <template v-if="recapData.level !== 'TK'">
                    <th 
                      v-for="sub in recapData.subjects" 
                      :key="sub.scheme_id"
                      class="p-4 font-black text-slate-500 uppercase text-center min-w-[100px]"
                    >
                      <span class="block truncate max-w-[120px] mx-auto" :title="sub.subject_name">
                        {{ sub.subject_code || sub.subject_name }}
                      </span>
                      <span class="block text-[9px] text-slate-400 font-normal">KKM: {{ sub.kkm_score || 70 }}</span>
                    </th>
                    <th class="p-4 font-black text-slate-700 dark:text-zinc-200 uppercase text-center w-20 bg-slate-50/30 dark:bg-zinc-950/20">Rata-rata</th>
                  </template>
                  
                  <template v-else>
                    <th 
                      v-for="el in recapData.elements" 
                      :key="el.id"
                      class="p-4 font-black text-slate-500 uppercase text-center min-w-[150px]"
                    >
                      <span class="block truncate max-w-[200px] mx-auto" :title="el.name">{{ el.name }}</span>
                    </th>
                  </template>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-zinc-850">
                <tr 
                  v-for="std in filteredRecapStudents" 
                  :key="std.id"
                  class="hover:bg-slate-50/40 dark:hover:bg-zinc-950/30 transition-colors"
                >
                  <td v-if="showRanking && recapData.level !== 'TK'" class="p-4 text-center font-bold text-slate-400">
                    <span v-if="std.rank > 0" class="inline-flex items-center justify-center w-6 h-6 rounded-full" :class="[
                      std.rank === 1 ? 'bg-amber-500/10 text-amber-600' : 
                      std.rank === 2 ? 'bg-slate-350/15 text-slate-500' :
                      std.rank === 3 ? 'bg-amber-700/10 text-amber-800' : 'text-slate-400'
                    ]">
                      {{ std.rank }}
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td class="p-4 font-bold text-slate-800 dark:text-zinc-200">{{ std.full_name }}</td>
                  <td class="p-4 text-center font-semibold text-slate-500">{{ std.student_number || '-' }}</td>
                  
                  <!-- Dynamic grades cells -->
                  <template v-if="recapData.level !== 'TK'">
                    <td 
                      v-for="sub in recapData.subjects" 
                      :key="sub.scheme_id"
                      class="p-4 text-center"
                    >
                      <span 
                        v-if="std.grades[sub.scheme_id]" 
                        class="font-black"
                        :class="[
                          std.grades[sub.scheme_id].final_score < (sub.kkm_score || 70) 
                            ? 'text-rose-500' 
                            : 'text-slate-800 dark:text-zinc-200'
                        ]"
                      >
                        {{ std.grades[sub.scheme_id].final_score }}
                        <span class="text-[9px] text-slate-400 font-normal">({{ std.grades[sub.scheme_id].predicate }})</span>
                      </span>
                      <span v-else class="text-slate-300 dark:text-zinc-700">-</span>
                    </td>
                    <td class="p-4 text-center font-black bg-slate-50/20 dark:bg-zinc-950/10 text-violet-600 dark:text-violet-400 text-sm">
                      {{ std.average_score !== null ? std.average_score : '-' }}
                    </td>
                  </template>
                  
                  <template v-else>
                    <td 
                      v-for="el in recapData.elements" 
                      :key="el.id"
                      class="p-4 text-center"
                    >
                      <span 
                        v-if="std.grades[el.id]?.letter_grade" 
                        class="px-2 py-0.5 rounded text-[10px] font-black border"
                        :class="getTKGradeColor(std.grades[el.id].letter_grade)"
                      >
                        {{ std.grades[el.id].letter_grade }}
                      </span>
                      <span v-else class="text-slate-300 dark:text-zinc-700">-</span>
                    </td>
                  </template>
                </tr>
              </tbody>
              
              <!-- Footer averages (only for SD-SMA) -->
              <tfoot v-if="recapData.level !== 'TK'" class="bg-slate-50/30 dark:bg-zinc-950/20 border-t border-slate-200/80 dark:border-zinc-800">
                <tr class="font-bold text-slate-700 dark:text-zinc-300">
                  <td :colspan="showRanking ? 3 : 2" class="p-4 text-right uppercase tracking-wider text-[10px] font-black">Rata-rata Kelas</td>
                  <td 
                    v-for="sub in recapData.subjects" 
                    :key="sub.scheme_id"
                    class="p-4 text-center text-sm font-black text-slate-800 dark:text-zinc-200"
                  >
                    {{ sub.class_average !== null ? sub.class_average : '-' }}
                  </td>
                  <td class="p-4 text-center text-sm font-black text-violet-600 dark:text-violet-400 bg-slate-50/60 dark:bg-zinc-950/35">
                    {{ 
                      recapData.students?.length > 0 
                        ? (recapData.students.reduce((acc: number, s: any) => acc + (s.average_score || 0), 0) / recapData.students.filter((s: any) => s.average_score !== null).length).toFixed(2)
                        : '-'
                    }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab Content: Analisis Mapel -->
      <div v-else-if="activeTab === 'subject' && recapData" class="space-y-6">
        <!-- Sub selector for subjects -->
        <div class="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 p-4 rounded-xl shadow-sm">
          <label class="text-xs font-bold text-slate-600 dark:text-zinc-400">
            {{ recapData.level === 'TK' ? 'Pilih Elemen Perkembangan:' : 'Pilih Mata Pelajaran:' }}
          </label>
          <select v-model="selectedSchemeId" class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600 min-w-[200px]">
            <template v-if="recapData.level === 'TK'">
              <option v-for="el in recapData.elements" :key="el.id" :value="el.id">
                {{ el.name }}
              </option>
            </template>
            <template v-else>
              <option v-for="sub in recapData.subjects" :key="sub.scheme_id" :value="sub.scheme_id">
                {{ sub.subject_name }}
              </option>
            </template>
          </select>
        </div>

        <div v-if="distributionData" class="space-y-6 animate-in fade-in duration-300">
          <!-- TK Subject Analytics -->
          <div v-if="recapData.level === 'TK'" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm text-center">
              <p class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Penilaian</p>
              <h3 class="text-3xl font-black text-violet-600 dark:text-violet-400 mt-2">
                {{ distributionData.stats.total_students }}
              </h3>
              <p class="text-[9px] text-slate-400 mt-1">Siswa teramati</p>
            </div>
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm text-center">
              <p class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Target Tercapai (BSH/BSB)</p>
              <h3 class="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {{ 
                  Math.round((( (distributionData.distribution.BSH || 0) + (distributionData.distribution.BSB || 0) ) / Math.max(distributionData.stats.total_students, 1)) * 100)
                }}%
              </h3>
              <p class="text-[9px] text-slate-400 mt-1">Berkembang Sesuai Harapan / Sangat Baik</p>
            </div>
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm text-center">
              <p class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Stimulasi Ekstra (BB/MB)</p>
              <h3 class="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
                {{ 
                  Math.round((( (distributionData.distribution.BB || 0) + (distributionData.distribution.MB || 0) ) / Math.max(distributionData.stats.total_students, 1)) * 100)
                }}%
              </h3>
              <p class="text-[9px] text-slate-400 mt-1">Belum / Mulai Berkembang</p>
            </div>
          </div>
          
          <!-- Numeric SD-SMA Subject Analytics -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm text-center">
              <p class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Rata-rata Kelas</p>
              <h3 class="text-3xl font-black text-violet-600 dark:text-violet-400 mt-2">{{ distributionData.stats.average || '-' }}</h3>
            </div>
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm text-center">
              <p class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Nilai Tertinggi</p>
              <h3 class="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{{ distributionData.stats.highest || '-' }}</h3>
            </div>
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm text-center">
              <p class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Nilai Terendah</p>
              <h3 class="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">{{ distributionData.stats.lowest || '-' }}</h3>
            </div>
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm text-center">
              <p class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Persentase Lulus</p>
              <h3 class="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">{{ getPassingRate }}%</h3>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Distribution Chart Card -->
            <div class="lg:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-6">
              <h4 class="text-xs font-black text-slate-900 dark:text-zinc-150 uppercase tracking-wider">Sebaran Capaian</h4>
              
              <div class="space-y-4">
                <!-- Predicate bars -->
                <div v-for="(count, pred) in distributionData.distribution" :key="pred" class="space-y-1.5">
                  <div class="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-350">
                    <span>{{ recapData.level === 'TK' ? getTKGradeLabel(pred) : `Predikat ${pred}` }}</span>
                    <span>{{ count }} siswa</span>
                  </div>
                  <div class="h-3 w-full bg-slate-100 dark:bg-zinc-950 rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all duration-500" 
                      :class="[
                        pred === 'A' || pred === 'BSB' ? 'bg-indigo-500' :
                        pred === 'B' || pred === 'BSH' ? 'bg-emerald-500' :
                        pred === 'C' || pred === 'MB' ? 'bg-amber-500' : 'bg-rose-500'
                      ]"
                      :style="{ width: `${distributionData.stats.total_students > 0 ? (count / distributionData.stats.total_students) * 100 : 0}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Students details list -->
            <div class="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div class="flex justify-between items-center">
                <h4 class="text-xs font-black text-slate-900 dark:text-zinc-150 uppercase tracking-wider">Daftar Capaian Murid</h4>
                <!-- Predicate Filter options -->
                <select v-model="selectedDistributionPredicate" class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] font-bold outline-none">
                  <option value="all">Semua Nilai</option>
                  <option v-for="(_, pred) in distributionData.distribution" :key="pred" :value="pred">
                    {{ recapData.level === 'TK' ? pred : `Predikat ${pred}` }}
                  </option>
                </select>
              </div>

              <div class="overflow-hidden rounded-xl border border-slate-100 dark:border-zinc-850">
                <div class="max-h-[300px] overflow-y-auto pr-1">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr class="bg-slate-50/50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-850">
                        <th class="p-3 font-bold text-slate-500">Nama Siswa</th>
                        <th v-if="recapData.level !== 'TK'" class="p-3 font-bold text-slate-500 text-center w-24">Nilai Akhir</th>
                        <th class="p-3 font-bold text-slate-500 text-center w-24">Capaian</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-zinc-850">
                      <tr v-for="std in filteredDistributionStudents" :key="std.student_id" class="hover:bg-slate-50/20">
                        <td class="p-3 font-semibold text-slate-800 dark:text-zinc-200">{{ std.full_name }}</td>
                        <td v-if="recapData.level !== 'TK'" class="p-3 text-center font-black text-slate-700 dark:text-zinc-300">
                          {{ std.final_score !== null ? std.final_score : '-' }}
                        </td>
                        <td class="p-3 text-center">
                          <span 
                            class="px-2 py-0.5 rounded-[4px] font-black"
                            :class="[
                              ['A', 'B', 'BSB', 'BSH'].includes(std.predicate) 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            ]"
                          >
                            {{ std.predicate || '-' }}
                          </span>
                        </td>
                      </tr>
                      <tr v-if="filteredDistributionStudents.length === 0">
                        <td colspan="3" class="p-8 text-center text-slate-400">Tidak ada murid dengan kriteria ini.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Content: Perkembangan Siswa -->
      <div v-else-if="activeTab === 'progression' && recapData" class="space-y-6">
        <!-- Sub selector for students -->
        <div class="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 p-4 rounded-xl shadow-sm">
          <label class="text-xs font-bold text-slate-600 dark:text-zinc-400">Pilih Murid:</label>
          <select v-model="selectedStudentId" class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600 min-w-[200px]">
            <option v-for="std in recapData.students" :key="std.id" :value="std.id">
              {{ std.full_name }}
            </option>
          </select>
        </div>

        <div v-if="progressionData.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
          <div 
            v-for="sub in progressionData" 
            :key="sub.subject_code"
            class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-bold text-slate-800 dark:text-zinc-200">{{ sub.subject_name }}</h4>
                <p class="text-[10px] text-slate-400 font-medium">{{ sub.subject_code }}</p>
              </div>
              <div class="p-2 bg-violet-600/10 rounded-lg text-violet-600">
                <TrendingUp :size="16" />
              </div>
            </div>

            <!-- Progression Timeline -->
            <div class="relative pl-6 border-l-2 border-slate-100 dark:border-zinc-850 space-y-4 py-2">
              <div 
                v-for="(item, idx) in sub.progression" 
                :key="idx"
                class="relative"
              >
                <!-- Dot marker -->
                <span class="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-white dark:border-zinc-900 bg-violet-600 flex items-center justify-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                </span>
                
                <div class="flex justify-between items-start">
                  <div>
                    <h5 class="text-xs font-bold text-slate-700 dark:text-zinc-300">TA {{ item.academic_year }}</h5>
                    <p class="text-[10px] text-slate-400 font-medium">Semester {{ item.semester }}</p>
                  </div>
                  <div class="text-right">
                    <span 
                      v-if="item.final_score !== null"
                      class="text-sm font-black text-slate-900 dark:text-zinc-100 block"
                    >
                      {{ item.final_score }}
                    </span>
                    <template v-if="recapData.level === 'TK'">
                      <span class="px-2 py-0.5 rounded text-[10px] font-black" :class="getTKGradeColor(item.predicate)">
                        {{ getTKGradeLabel(item.predicate) }}
                      </span>
                    </template>
                    <template v-else>
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-bold" :class="[
                        ['A', 'B', 'BSB', 'BSH'].includes(item.predicate) 
                          ? 'bg-emerald-500/10 text-emerald-600' 
                          : 'bg-rose-500/10 text-rose-600'
                      ]">
                        Predikat {{ item.predicate || '-' }}
                      </span>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm text-center">
          <LineChart class="text-slate-350 dark:text-zinc-700 mb-3" :size="36" />
          <p class="text-xs font-bold text-slate-700 dark:text-zinc-200">Belum Ada Riwayat Lintas Semester</p>
          <p class="text-[10px] text-slate-400 max-w-sm mt-1">Siswa ini baru memiliki data pada semester berjalan.</p>
        </div>
      </div>

      <!-- Tab Content: Early Warning -->
      <div v-else-if="activeTab === 'warning'" class="space-y-6">
        <div class="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/60 rounded-2xl p-5 flex items-start gap-4">
          <div class="p-2.5 bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400">
            <AlertTriangle :size="20" />
          </div>
          <div>
            <h4 class="text-sm font-bold text-rose-900 dark:text-rose-300">
              {{ recapData.level === 'TK' ? 'Deteksi Stimulasi Perkembangan Siswa (Early Warning)' : 'Peringatan Dini Ketuntasan Siswa (Early Warning)' }}
            </h4>
            <p class="text-xs text-rose-700/80 dark:text-rose-400/70 mt-1 leading-relaxed">
              <span v-if="recapData.level === 'TK'">
                Daftar siswa di bawah ini teridentifikasi memiliki aspek perkembangan yang masih 'Belum Berkembang (BB)' atau 'Mulai Berkembang (MB)'. Disarankan untuk memberikan stimulasi tambahan atau berkolaborasi dengan orang tua untuk mengoptimalkan tumbuh kembang anak.
              </span>
              <span v-else>
                Daftar siswa di bawah ini teridentifikasi memiliki nilai akhir semester di bawah KKM pada satu atau beberapa mata pelajaran. Disarankan untuk segera menjadwalkan program remedial atau bimbingan khusus.
              </span>
            </p>
          </div>
        </div>

        <div v-if="warningData.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
          <div 
            v-for="warn in warningData" 
            :key="warn.student_id"
            class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4"
          >
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-3">
              <div>
                <h4 class="text-sm font-bold text-slate-800 dark:text-zinc-200">{{ warn.full_name }}</h4>
                <p class="text-[10px] text-slate-400 font-medium">
                  {{ recapData.level === 'TK' ? `Memiliki ${warn.failing_subjects.length} aspek perlu stimulasi` : `Memiliki ${warn.failing_subjects.length} mata pelajaran tidak tuntas` }}
                </p>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 border border-rose-500/20 animate-pulse">
                {{ recapData.level === 'TK' ? 'BUTUH STIMULASI' : 'PERLU REMEDIAL' }}
              </span>
            </div>

            <!-- List of failing subjects -->
            <div class="space-y-3">
              <div 
                v-for="(sub, sidx) in warn.failing_subjects" 
                :key="sidx"
                class="flex items-center justify-between text-xs bg-slate-50/50 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-850"
              >
                <div class="font-bold text-slate-700 dark:text-zinc-350 max-w-[55%]">
                  {{ sub.subject_name }}
                </div>
                <div class="flex items-center gap-3 font-semibold">
                  <template v-if="recapData.level === 'TK'">
                    <span class="text-rose-500 font-black">{{ sub.final_score }}</span>
                    <span class="text-slate-400 font-normal">|</span>
                    <span class="text-slate-500 font-bold">Target: {{ sub.kkm_score }}</span>
                  </template>
                  <template v-else>
                    <span class="text-rose-500 font-black">Nilai: {{ sub.final_score }}</span>
                    <span class="text-slate-400 font-normal">|</span>
                    <span class="text-slate-500 font-bold">KKM: {{ sub.kkm_score }}</span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm text-center">
          <CheckCircle class="text-emerald-500 mb-3" :size="36" />
          <p class="text-xs font-bold text-slate-700 dark:text-zinc-200">Semua Murid Tuntas!</p>
          <p class="text-[10px] text-slate-400 max-w-sm mt-1">Luar biasa! Seluruh siswa di kelas ini telah mencapai atau melebihi nilai KKM.</p>
        </div>
      </div>
    </div>
  </div>
</template>
