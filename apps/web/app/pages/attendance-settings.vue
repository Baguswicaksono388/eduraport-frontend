<script setup lang="ts">
import { Settings, Save, Clock, HelpCircle, Loader2 } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseInput } from '@eduraport/ui'
import { useApi } from '../composables/useApi'
import { useSchoolContext } from '../composables/useSchoolContext'

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

const { fetcher } = useApi()
const { isSchoolLocked, selectedFoundationId, selectedSchoolId, foundations, schools, initContext, onFoundationChange } = useSchoolContext()

const isLoading = ref(true)
const isSaving = ref(false)

const ruleForm = reactive({
  id: '',
  school_id: '',
  scope_type: 'school',
  days: '1,2,3,4,5,6',
  check_in_start: '06:00',
  on_time_until: '07:15',
  late_tolerance_min: 0,
  absent_cutoff: '10:00',
  check_out_enabled: false,
  check_out_from: '14:00',
  is_active: true
})

onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    await fetchTimeRules(schoolId)
  } else {
    isLoading.value = false
  }
})

watch(selectedFoundationId, (newVal) => {
  onFoundationChange(newVal)
})

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await fetchTimeRules(newVal)
  }
})

const fetchTimeRules = async (schoolId: string) => {
  isLoading.value = true
  // Reset ID for switching school context properly
  ruleForm.id = ''
  
  try {
    const res: any = await fetcher(`/school/${schoolId}/attendance/attendance-time-rules`)
    if (res && res.data && res.data.length > 0) {
      const rule = res.data[0]
      Object.assign(ruleForm, {
        id: rule.id || '',
        school_id: rule.school_id,
        scope_type: rule.scope_type,
        days: rule.days,
        check_in_start: rule.check_in_start,
        on_time_until: rule.on_time_until,
        late_tolerance_min: rule.late_tolerance_min,
        absent_cutoff: rule.absent_cutoff || '10:00',
        check_out_enabled: rule.check_out_enabled,
        check_out_from: rule.check_out_from || '14:00',
        is_active: rule.is_active
      })
    } else {
      // Data kosong (belum pernah disetting)
      ruleForm.school_id = schoolId
    }
  } catch (error) {
    console.error('Failed to fetch time rules:', error)
  } finally {
    isLoading.value = false
  }
}

const saveTimeRules = async () => {
  if (!selectedSchoolId.value) return
  isSaving.value = true
  try {
    const payload = [{ ...ruleForm, school_id: selectedSchoolId.value }]
    if (!payload[0].id) {
      delete payload[0].id
    }
    await fetcher(`/school/${selectedSchoolId.value}/attendance/attendance-time-rules`, {
      method: 'PUT',
      body: payload
    })
    useNuxtApp().$toast?.success('Pengaturan jam masuk berhasil disimpan')
    await fetchTimeRules(selectedSchoolId.value) // re-fetch to get new ID
  } catch (error) {
    console.error('Failed to save time rules:', error)
    useNuxtApp().$toast?.error('Gagal menyimpan pengaturan')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <Settings class="text-violet-400" :size="28" />
          Pengaturan Absensi
        </h1>
        <p class="text-slate-400 mt-1">Konfigurasi jam masuk, toleransi keterlambatan, dan fitur absensi lainnya.</p>
      </div>
    </div>

    <!-- Context Selector for Super Admin -->
    <BaseCard v-if="!isSchoolLocked" class="p-4 bg-slate-100/50 dark:bg-zinc-900/50 border-dashed border-slate-300 dark:border-zinc-800">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Foundation Selection -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 pl-1">Yayasan</label>
          <select v-model="selectedFoundationId" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option v-for="f in foundations" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>

        <!-- School Selection -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 pl-1">Unit Sekolah</label>
          <select v-model="selectedSchoolId" class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
            <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }} ({{ s.level }})</option>
          </select>
        </div>
      </div>
    </BaseCard>

    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <Loader2 class="w-8 h-8 text-violet-500 animate-spin" />
    </div>

    <div v-else-if="!selectedSchoolId" class="flex flex-col justify-center items-center py-20 text-slate-400">
      <Settings class="w-12 h-12 mb-4 opacity-20" />
      <p>Silakan pilih Unit Sekolah terlebih dahulu.</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BaseCard class="p-6">
        <div class="flex items-center gap-2 mb-6">
          <Clock class="text-violet-400" :size="20" />
          <h2 class="text-lg font-semibold text-white">Jam Absensi Utama (Sekolah)</h2>
        </div>

        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Mulai Absen Masuk</label>
            <BaseInput 
              v-model="ruleForm.check_in_start"
              type="time"
              placeholder="06:00"
            />
            <p class="text-xs text-slate-500 mt-1">Jam paling awal siswa diperbolehkan melakukan absen masuk.</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Maksimal Tepat Waktu</label>
            <BaseInput 
              v-model="ruleForm.on_time_until"
              type="time"
              placeholder="07:15"
            />
            <p class="text-xs text-slate-500 mt-1">Batas waktu absensi dihitung tepat waktu. Lewat dari jam ini akan tercatat "Terlambat".</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Jam Mulai Absen Pulang</label>
            <BaseInput 
              v-model="ruleForm.check_out_from"
              type="time"
              placeholder="14:00"
            />
            <p class="text-xs text-slate-500 mt-1">Siswa bisa absen pulang setelah jam ini.</p>
          </div>

          <div class="pt-4 flex justify-end border-t border-slate-700/50">
            <BaseButton 
              variant="primary" 
              @click="saveTimeRules"
              :disabled="isSaving"
              class="gap-2"
            >
              <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              {{ isSaving ? 'Menyimpan...' : 'Simpan Pengaturan' }}
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6 bg-slate-800/30 border-dashed border-slate-700 h-fit">
        <div class="flex items-start gap-3 text-sm text-slate-400">
          <HelpCircle class="text-violet-400 shrink-0 mt-0.5" :size="20" />
          <div>
            <p class="text-slate-200 font-medium mb-1">Informasi</p>
            <ul class="list-disc pl-4 space-y-1 mt-2 text-xs">
              <li>Pengaturan di atas berlaku untuk seluruh siswa di sekolah.</li>
              <li>Jika siswa scan QR setelah lewat dari "Maksimal Tepat Waktu", notifikasi ke WhatsApp orang tua otomatis menggunakan pesan <strong class="text-amber-400">Terlambat</strong>.</li>
              <li>Sistem akan menghitung selisih menit keterlambatan (Late Minutes) secara otomatis.</li>
            </ul>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
