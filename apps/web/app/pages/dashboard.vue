<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useSchool } from '../composables/useSchool'
import { useToast } from '../composables/useToast'
import { useDashboard } from '../composables/useDashboard'

import DashboardTopbar from '../components/dashboard/DashboardTopbar.vue'
import PrincipalDashboard from '../components/dashboard/variants/PrincipalDashboard.vue'
import TreasurerDashboard from '../components/dashboard/variants/TreasurerDashboard.vue'
import CurriculumDashboard from '../components/dashboard/variants/CurriculumDashboard.vue'
import FoundationDashboard from '../components/dashboard/variants/FoundationDashboard.vue'

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

const { user } = useAuth()
const { foundations, schools, fetchFoundations, fetchSchools, currentSchoolId } = useSchool()
const toast = useToast()
const {
  fetchCatalog,
  fetchMetrics,
  recalculateMetric,
  fetchBriefing,
  fetchThresholds,
  updateThresholds,
  remindTeacher,
  fetchWorkReminders,
  fetchConsolidatedMetrics,
  fetchPreferences,
  updatePreferences,
  exportPdf
} = useDashboard()

// States
const selectedFoundationId = ref('')
const selectedSchoolId = ref('')

// PDF Export state
const exportingPdf = ref(false)

// Dashboard specific states
const loading = ref(false)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const period = ref(new Date().toISOString().slice(0, 7))
const recalculatingKeys = ref<Record<string, boolean>>({})
const savingThreshold = ref(false)
const sendingReminder = ref(false)

const catalog = ref<any[]>([])
const metrics = ref<any[]>([])
const thresholds = ref<any[]>([])
const briefing = ref({ textHtml: '', actions: [] })
const reminders = ref<any[]>([])
const consolidatedData = ref<{ schools: any[]; metrics: any[] }>({ schools: [], metrics: [] })

// View switch option roles simulation
const availableRoles = [
  { value: 'principal', label: 'Kepala Sekolah (Ops/Akademik/Keuangan)' },
  { value: 'treasurer', label: 'Bendahara (Finansial & SPP)' },
  { value: 'vice_principal_curriculum', label: 'Wakasek Kurikulum (Akademik & Rapor)' },
  { value: 'foundation', label: 'Yayasan (Konsolidasi Unit Sekolah)' }
]
const currentRole = ref('principal')

// Sync period with selectedDate
watch(selectedDate, (newVal) => {
  if (newVal && newVal.length >= 7) {
    period.value = newVal.slice(0, 7)
  }
})

// Watch role / period change to reload dashboard
watch([currentRole, period, selectedDate], () => {
  loadDashboard()
  saveUserPreferences()
})

const saveUserPreferences = async () => {
  if (!selectedSchoolId.value || currentRole.value === 'foundation') return
  try {
    await updatePreferences(selectedSchoolId.value, currentRole.value, {
      hidden_cards: [],
      pinned_cards: [],
      default_school_id: selectedSchoolId.value
    })
  } catch (err) {
    console.error('Gagal menyimpan preferensi layout:', err)
  }
}

const loadDashboard = async (forceRecalculate = false) => {
  const isFoundation = currentRole.value === 'foundation'
  
  if (!isFoundation && !selectedSchoolId.value) return
  
  loading.value = true
  
  try {
    if (isFoundation) {
      if (forceRecalculate) {
        for (const s of schools.value) {
          await recalculateMetric(s.id, 'acad.report.readiness').catch(() => {})
          await recalculateMetric(s.id, 'acad.teacher.lagging').catch(() => {})
          await recalculateMetric(s.id, 'fin.collect.month').catch(() => {})
          await recalculateMetric(s.id, 'growth.occupancy').catch(() => {})
        }
      }

      // 1. Fetch Consolidated metrics for Foundation
      const fId = selectedFoundationId.value || (foundations.value[0]?.id || '')
      if (fId) {
        const keys = [
          'att.students.today',
          'att.teachers.today',
          'fin.collect.month',
          'acad.report.readiness',
          'growth.occupancy',
          'fdn.school.health'
        ]
        const res = await fetchConsolidatedMetrics(fId, keys, period.value)
        consolidatedData.value = res.data || { schools: [], metrics: [] }
      }
      metrics.value = []
      briefing.value = { textHtml: '', actions: [] }
    } else {
      const schoolId = selectedSchoolId.value

      if (forceRecalculate) {
        await recalculateMetric(schoolId, 'acad.report.readiness').catch(() => {})
        await recalculateMetric(schoolId, 'acad.teacher.lagging').catch(() => {})
        await recalculateMetric(schoolId, 'growth.occupancy').catch(() => {})
        await recalculateMetric(schoolId, 'fin.collect.month').catch(() => {})
        await recalculateMetric(schoolId, 'fin.aging').catch(() => {})
      }

      // 1. Fetch Catalog
      const catRes = await fetchCatalog(schoolId, currentRole.value)
      catalog.value = catRes.data || []

      // 2. Determine metric keys to load based on role
      let keys: string[] = []
      if (currentRole.value === 'principal') {
        keys = [
          'att.students.today',
          'att.teachers.today',
          'sched.vacancy.today',
          'fin.cash.today',
          'fin.collect.month',
          'acad.report.readiness',
          'growth.occupancy'
        ]
      } else if (currentRole.value === 'treasurer') {
        keys = [
          'fin.cash.today',
          'fin.collect.month',
          'fin.recon.gateway',
          'fin.aging'
        ]
      } else if (currentRole.value === 'vice_principal_curriculum') {
        keys = [
          'acad.report.readiness',
          'acad.teacher.lagging',
          'acad.students.watch'
        ]
      }

      // Filter keys actually in catalog to avoid 404
      const catalogKeys = new Set(catalog.value.map((c) => c.metric_key))
      const validKeys = keys.filter((k) => catalogKeys.has(k))

      // 3. Fetch Metrics batch
      if (validKeys.length > 0) {
        const metRes = await fetchMetrics(schoolId, validKeys, period.value, currentRole.value, selectedDate.value)
        metrics.value = metRes.data || []
      } else {
        metrics.value = []
      }

      // 4. Fetch Briefing
      const briefRes = await fetchBriefing(schoolId, currentRole.value)
      briefing.value = briefRes.data || { textHtml: '', actions: [] }

      // 5. Fetch custom thresholds
      if (['principal', 'super_admin'].includes(currentRole.value)) {
        const threshRes = await fetchThresholds(schoolId)
        thresholds.value = threshRes.data || []
      }

      // 6. Fetch work reminders if curriculum
      if (currentRole.value === 'vice_principal_curriculum') {
        const remRes = await fetchWorkReminders(schoolId)
        reminders.value = remRes.data || []
      }
    }
  } catch (err: any) {
    console.error('Gagal memuat data dashboard:', err)
    toast.error(err.message || 'Gagal memuat dashboard', 'Error')
  } finally {
    loading.value = false
  }
}

const handleRecalculate = async (key: string) => {
  if (!selectedSchoolId.value) return
  recalculatingKeys.value[key] = true
  
  try {
    await recalculateMetric(selectedSchoolId.value, key)
    toast.success('Kalkulasi ulang metrik selesai.', 'Sukses')
    await loadDashboard()
  } catch (err: any) {
    console.error('Gagal menghitung ulang metrik:', err)
    toast.error(err.message || 'Gagal menghitung ulang', 'Gagal')
  } finally {
    recalculatingKeys.value[key] = false
  }
}

const handleSaveThreshold = async (threshold: any) => {
  if (!selectedSchoolId.value) return
  savingThreshold.value = true

  try {
    await updateThresholds(selectedSchoolId.value, threshold)
    toast.success('Ambang batas berhasil diperbarui.', 'Sukses')
    await loadDashboard()
  } catch (err: any) {
    console.error('Gagal menyimpan ambang batas:', err)
    toast.error(err.message || 'Gagal menyimpan', 'Error')
  } finally {
    savingThreshold.value = false
  }
}

const handleSendReminder = async (payload: { recipient_id: string; metric_key: string; message_body: string; phone?: string }) => {
  if (!selectedSchoolId.value) return
  sendingReminder.value = true

  try {
    // 1. Log to database to register cooldown
    await remindTeacher(selectedSchoolId.value, {
      recipient_id: payload.recipient_id,
      metric_key: payload.metric_key,
      message_body: payload.message_body
    })

    toast.success('Pengingat tercatat di sistem.', 'Sukses')
    
    // Refresh to lock the UI button in cooldown
    await loadDashboard()

    // 2. Open WhatsApp fallback link
    if (payload.phone) {
      const waUrl = `https://web.whatsapp.com/send?phone=${payload.phone}&text=${encodeURIComponent(payload.message_body)}`
      window.open(waUrl, '_blank')
    }
  } catch (err: any) {
    console.error('Gagal mengirim/mencatat pengingat:', err)
    toast.error(err.message || 'Gagal mengirim pengingat', 'Gagal')
  } finally {
    sendingReminder.value = false
  }
}

const handleAction = (route: string) => {
  navigateTo(route)
}

const handleExportPdf = async () => {
  if (!selectedSchoolId.value) return
  exportingPdf.value = true
  try {
    const blob: any = await exportPdf(selectedSchoolId.value, currentRole.value, period.value, selectedDate.value)
    
    // Create download link in browser
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    
    // Find school name helper
    const activeSchool = schools.value.find(s => s.id === selectedSchoolId.value)
    const schoolNameStr = activeSchool ? activeSchool.name.toLowerCase().replace(/\s+/g, '-') : 'sekolah'
    
    link.setAttribute('download', `laporan-eksekutif-${schoolNameStr}-${currentRole.value}-${selectedDate.value}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.success('Laporan PDF berhasil diunduh.', 'Sukses')
  } catch (err: any) {
    console.error('Gagal mengekspor PDF:', err)
    toast.error(err.message || 'Gagal mengekspor PDF dashboard.', 'Gagal')
  } finally {
    exportingPdf.value = false
  }
}

// Initial setup
onMounted(async () => {
  // Set default view based on user role if eligible
  if (user.value && ['treasurer'].includes(user.value.role)) {
    currentRole.value = 'treasurer'
  } else if (user.value && ['vice_principal_curriculum'].includes(user.value.role)) {
    currentRole.value = 'vice_principal_curriculum'
  }
  
  if (user.value?.role === 'super_admin') {
    await fetchFoundations()
    if (foundations.value.length > 0) {
      selectedFoundationId.value = foundations.value[0].id
      await fetchSchools(selectedFoundationId.value)
      
      const exists = schools.value.some(s => s.id === currentSchoolId.value)
      if (currentSchoolId.value && exists) {
        selectedSchoolId.value = currentSchoolId.value
      } else if (schools.value.length > 0) {
        selectedSchoolId.value = schools.value[0].id
      }
    }
  } else {
    selectedSchoolId.value = currentSchoolId.value || ''
    // Try to pre-populate selectedFoundationId
    if (user.value?.school_id) {
      await fetchFoundations()
      if (foundations.value.length > 0) {
        selectedFoundationId.value = foundations.value[0].id
      }
    }
  }
  
  // Try to load user preference if school is set
  if (selectedSchoolId.value) {
    try {
      const prefRes = await fetchPreferences(selectedSchoolId.value, currentRole.value)
      if (prefRes && prefRes.data) {
        if (prefRes.data.default_school_id) {
          selectedSchoolId.value = prefRes.data.default_school_id
        }
        if (prefRes.data.variant) {
          currentRole.value = prefRes.data.variant
        }
      }
    } catch (err) {
      console.warn('Gagal memuat preferensi layout:', err)
    }
  }

  loadDashboard()
})

// Watch school ID change
watch(selectedSchoolId, (newVal) => {
  if (newVal) {
    currentSchoolId.value = newVal
    loadDashboard()
  }
})

watch(selectedFoundationId, async (newVal) => {
  if (newVal) {
    if (user.value?.role === 'super_admin') {
      await fetchSchools(newVal)
      if (schools.value.length > 0) {
        selectedSchoolId.value = schools.value[0].id
      } else {
        selectedSchoolId.value = ''
      }
    }
    if (currentRole.value === 'foundation') {
      loadDashboard()
    }
  }
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
    <!-- Top Filter & Selector Banner -->
    <DashboardTopbar
      v-model:role="currentRole"
      v-model:date="selectedDate"
      :roles="availableRoles"
      :loading="loading"
      :exportingPdf="exportingPdf"
      @refresh="loadDashboard(true)"
      @export-pdf="handleExportPdf"
    />

    <!-- Super Admin & Foundation School Filter -->
    <div v-if="user?.role === 'super_admin' || currentRole === 'foundation'" class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm animate-in fade-in duration-200">
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Yayasan</label>
        <select v-model="selectedFoundationId" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600">
          <option 
            v-for="f in foundations" 
            :key="f.id" 
            :value="f.id"
            class="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 font-semibold"
          >
            {{ f.name }}
          </option>
        </select>
      </div>
      <div v-if="currentRole !== 'foundation'" class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600">
          <option 
            v-for="s in schools" 
            :key="s.id" 
            :value="s.id"
            class="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 font-semibold"
          >
            {{ s.name }} ({{ s.level }})
          </option>
        </select>
      </div>
    </div>

    <!-- Main Content Panel based on selected simulator role -->
    <div v-if="loading && metrics.length === 0 && consolidatedData.schools.length === 0" class="flex flex-col items-center justify-center py-20 space-y-4">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">Memuat metrik eksekutif...</p>
    </div>

    <div v-else>
      <PrincipalDashboard
        v-if="currentRole === 'principal'"
        :schoolId="selectedSchoolId"
        :briefing="briefing"
        :metrics="metrics"
        :thresholds="thresholds"
        :catalog="catalog"
        :userName="user?.full_name || ''"
        :recalculatingKeys="recalculatingKeys"
        :savingThreshold="savingThreshold"
        @recalculate="handleRecalculate"
        @save-threshold="handleSaveThreshold"
        @action="handleAction"
      />

      <TreasurerDashboard
        v-else-if="currentRole === 'treasurer'"
        :briefing="briefing"
        :metrics="metrics"
        :userName="user?.full_name || ''"
        :recalculatingKeys="recalculatingKeys"
        :sendingReminder="sendingReminder"
        @recalculate="handleRecalculate"
        @send-reminder="handleSendReminder"
        @action="handleAction"
      />

      <CurriculumDashboard
        v-else-if="currentRole === 'vice_principal_curriculum'"
        :briefing="briefing"
        :metrics="metrics"
        :reminders="reminders"
        :userName="user?.full_name || ''"
        :recalculatingKeys="recalculatingKeys"
        :sendingReminder="sendingReminder"
        @recalculate="handleRecalculate"
        @send-reminder="handleSendReminder"
        @action="handleAction"
      />

      <FoundationDashboard
        v-else-if="currentRole === 'foundation'"
        :consolidatedData="consolidatedData"
        :loading="loading"
      />
    </div>
  </div>
</template>
