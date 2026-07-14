<script setup lang="ts">
import { 
  Plus, 
  Smartphone, 
  Wifi, 
  ShieldAlert, 
  AlertTriangle,
  Loader2,
  X,
  FileText
} from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useWaDevices } from '../../../composables/useWaDevices'
import { useToast } from '../../../composables/useToast'

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
const { 
  loading, 
  devices, 
  fetchDevices, 
  addDevice, 
  deleteDevice, 
  pauseDevice, 
  resumeDevice, 
  repairDevice,
  fetchRoutingRules,
  saveRoutingRule,
  fetchTemplates,
  saveTemplate,
  fetchGroupMappings,
  saveGroupMapping,
  fetchGroupsFromDevice,
  bypassWarmup
} = useWaDevices()

const toast = useToast()


// UI state
const showAddModal = ref(false)
const showDisclaimer = ref(false)
const disclaimerAccepted = ref(false)

const newDeviceForm = reactive({
  driver: 'unofficial' as 'unofficial' | 'official',
  display_name: '',
  phone_number_id: '',
  waba_id: '',
  token: ''
})

const stats = computed(() => {
  const total = devices.value.length
  const connected = devices.value.filter(d => d.connected || d.status === 'connected').length
  const official = devices.value.filter(d => d.driver === 'official').length
  const unofficial = devices.value.filter(d => d.driver === 'unofficial').length
  return { total, connected, official, unofficial }
})

onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    await loadData()
  }
})

watch(selectedFoundationId, (newVal) => onFoundationChange(newVal))

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await loadData()
  } else {
    devices.value = []
  }
})

const loadData = async () => {
  if (!selectedSchoolId.value) return
  try {
    await fetchDevices(selectedSchoolId.value)
  } catch (err: any) {
    toast.error(err.message || 'Gagal memuat daftar perangkat WA.')
  }
}

const handleAddClick = () => {
  if (devices.value.length >= 3) {
    toast.warning('Maksimal 3 perangkat diperbolehkan per sekolah.')
    return
  }
  showAddModal.value = true
}

const handleSelectDriver = (driver: 'unofficial' | 'official') => {
  newDeviceForm.driver = driver
  if (driver === 'unofficial') {
    showDisclaimer.value = true
  }
}

const confirmDisclaimer = () => {
  if (!disclaimerAccepted.value) {
    toast.warning('Anda harus menyetujui disclaimer risiko terlebih dahulu.')
    return
  }
  showDisclaimer.value = false
}

const cancelDisclaimer = () => {
  showDisclaimer.value = false
  newDeviceForm.driver = 'official' // Fallback or reset
}

const handleSaveDevice = async () => {
  if (newDeviceForm.driver === 'unofficial' && !disclaimerAccepted.value) {
    toast.warning('Anda harus menyetujui disclaimer untuk menggunakan driver unofficial.')
    return
  }

  const payload: any = {
    driver: newDeviceForm.driver,
    display_name: newDeviceForm.display_name
  }

  if (newDeviceForm.driver === 'official') {
    if (!newDeviceForm.phone_number_id || !newDeviceForm.waba_id || !newDeviceForm.token) {
      toast.warning('Semua kredensial official wajib diisi.')
      return
    }
    payload.official_credentials = {
      phone_number_id: newDeviceForm.phone_number_id,
      waba_id: newDeviceForm.waba_id,
      token: newDeviceForm.token
    }
  } else {
    payload.disclaimer_accepted = true
  }

  try {
    const res = await addDevice(selectedSchoolId.value, payload)
    if (res.success) {
      toast.success('Perangkat berhasil ditambahkan.')
      showAddModal.value = false
      
      // Reset form
      newDeviceForm.display_name = ''
      newDeviceForm.phone_number_id = ''
      newDeviceForm.waba_id = ''
      newDeviceForm.token = ''
      disclaimerAccepted.value = false

      // If unofficial, redirect to QR pairing page immediately
      if (payload.driver === 'unofficial') {
        navigateTo(`/wa/devices/${res.data.id}/qr?schoolId=${selectedSchoolId.value}`)
      } else {
        await loadData()
      }
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal menambahkan perangkat.')
  }
}

const handlePause = async (id: string) => {
  try {
    await pauseDevice(selectedSchoolId.value, id)
    toast.success('Perangkat dinonaktifkan sementara.')
    await loadData()
  } catch (err: any) {
    toast.error(err.message || 'Gagal menonaktifkan perangkat.')
  }
}

const handleResume = async (id: string) => {
  try {
    await resumeDevice(selectedSchoolId.value, id)
    toast.success('Perangkat diaktifkan kembali.')
    await loadData()
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengaktifkan kembali perangkat.')
  }
}

const handleRepair = async (id: string) => {
  try {
    await repairDevice(selectedSchoolId.value, id)
    toast.success('Membuka halaman pairing QR.')
    navigateTo(`/wa/devices/${id}/qr?schoolId=${selectedSchoolId.value}`)
  } catch (err: any) {
    toast.error(err.message || 'Gagal menginisiasi re-pair.')
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus perangkat ini? Sesi koneksi akan dihapus permanen.')) {
    return
  }
  try {
    await deleteDevice(selectedSchoolId.value, id)
    toast.success('Perangkat berhasil dihapus.')
    await loadData()
  } catch (err: any) {
    toast.error(err.message || 'Gagal menghapus perangkat.')
  }
}

// Bypass Warmup Stage State & Handlers
const showBypassModal = ref(false)
const bypassDeviceId = ref('')
const bypassRiskAccepted = ref(false)
const resendingBypass = ref(false)

const handleBypassWarmupClick = (deviceId: string) => {
  bypassDeviceId.value = deviceId
  bypassRiskAccepted.value = false
  showBypassModal.value = true
}

const handleConfirmBypass = async () => {
  if (!bypassRiskAccepted.value) {
    toast.error('Anda harus mencentang persetujuan disclaimer risiko.')
    return
  }
  
  resendingBypass.value = true
  try {
    const res = await bypassWarmup(selectedSchoolId.value, bypassDeviceId.value)
    if (res.success) {
      toast.success('Bypass pemanasan sukses. Perangkat kini berstatus Mature.')
      showBypassModal.value = false
      await loadData()
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengaktifkan bypass pemanasan.')
  } finally {
    resendingBypass.value = false
  }
}

import { useClass } from '../../../composables/useClass'

const { classes, fetchClasses } = useClass()

// Tab state
const activeTab = ref('devices')
const tabs = [
  { id: 'devices', name: 'Perangkat' },
  { id: 'routing', name: 'Aturan Routing' },
  { id: 'groups', name: 'Grup WhatsApp' },
  { id: 'templates', name: 'Template Pesan' },
  { id: 'logs', name: 'Log Pengiriman' }
]

// Data states
const routingRules = ref<any[]>([])
const templates = ref<any[]>([])
const groupMappings = ref<any[]>([])

// Fetching lists
const loadRoutingRules = async () => {
  if (!selectedSchoolId.value) return
  try {
    const res = await fetchRoutingRules(selectedSchoolId.value)
    if (res.success) {
      routingRules.value = res.data
    }
  } catch (err: any) {
    toast.error('Gagal memuat aturan routing.')
  }
}

const loadTemplates = async () => {
  if (!selectedSchoolId.value) return
  try {
    const res = await fetchTemplates(selectedSchoolId.value)
    if (res.success) {
      templates.value = res.data
    }
  } catch (err: any) {
    toast.error('Gagal memuat template.')
  }
}

const loadGroupMappings = async () => {
  if (!selectedSchoolId.value) return
  try {
    const res = await fetchGroupMappings(selectedSchoolId.value)
    if (res.success) {
      groupMappings.value = res.data
    }
  } catch (err: any) {
    toast.error('Gagal memuat pemetaan grup.')
  }
}

// Notification types reference
const notificationTypes = [
  { id: 'ppdb_registration', name: 'Pendaftaran PPDB (Wali Murid)', desc: 'Pemberitahuan bukti pendaftaran sukses dikirim ke orang tua' },
  { id: 'ppdb_new_applicant_alert', name: 'Alert Pendaftar PPDB Baru (Panitia)', desc: 'Pengingat otomatis bagi panitia/TU bahwa ada siswa baru mendaftar' },
  { id: 'ppdb_announcement', name: 'Pengumuman Kelulusan PPDB', desc: 'Pengumuman hasil penerimaan siswa baru' },
  { id: 'attendance_alert', name: 'Absensi Harian Siswa', desc: 'Notifikasi ketidakhadiran siswa harian' },
  { id: 'billing_invoice', name: 'Tagihan SPP / Keuangan', desc: 'Pemberitahuan tagihan SPP bulanan' },
  { id: 'billing_receipt', name: 'Kuitansi Pembayaran SPP', desc: 'Kuitansi bukti bayar tagihan keuangan' },
  { id: 'grade_published', name: 'Raport / Nilai Rapor Ready', desc: 'Pemberitahuan hasil ujian / rapor siap' },
  { id: 'otp', name: 'OTP Keamanan / Login', desc: 'Kode OTP masuk akun (OTP Darurat)' }
]

// Edit States
const editingRule = ref<any>(null)
const editingTemplate = ref<any>(null)
const editingMapping = ref<any>(null)
const selectedDeviceForGroups = ref('')
const fetchedGroups = ref<any[]>([])
const fetchingGroups = ref(false)

const startEditRule = (typeId: string) => {
  const existing = routingRules.value.find(r => r.notification_type === typeId)
  editingRule.value = {
    notification_type: typeId,
    target: existing?.target || 'personal',
    driver: existing?.driver || 'auto',
    priority: existing?.priority || 'normal',
    fallback_enabled: existing?.fallback_enabled !== false,
    fallback_sla_minutes: existing?.fallback_sla_minutes || 60,
    pinned_device_id: existing?.pinned_device_id || '',
    pinned_group_mapping_id: existing?.pinned_group_mapping_id || ''
  }
}

const handleSaveRule = async () => {
  if (!editingRule.value) return
  try {
    const res = await saveRoutingRule(selectedSchoolId.value, editingRule.value)
    if (res.success) {
      toast.success('Aturan routing berhasil disimpan.')
      editingRule.value = null
      await loadRoutingRules()
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan aturan routing.')
  }
}

const startEditTemplate = (typeId: string) => {
  const existing = templates.value.find(t => t.notification_type === typeId)
  editingTemplate.value = {
    notification_type: typeId,
    body: existing?.body || '',
    is_active: existing?.is_active !== false
  }
}

const handleSaveTemplateState = async () => {
  if (!editingTemplate.value) return
  try {
    const res = await saveTemplate(selectedSchoolId.value, editingTemplate.value)
    if (res.success) {
      toast.success('Template pesan berhasil disimpan.')
      editingTemplate.value = null
      await loadTemplates()
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan template pesan.')
  }
}

// Fetch group list from actual WhatsApp device connection
const handleFetchGroups = async () => {
  if (!selectedDeviceForGroups.value) {
    toast.warning('Pilih perangkat yang aktif terlebih dahulu.')
    return
  }
  fetchingGroups.value = true
  fetchedGroups.value = []
  try {
    const res = await fetchGroupsFromDevice(selectedSchoolId.value, selectedDeviceForGroups.value)
    if (res.success) {
      fetchedGroups.value = res.data
      toast.success(`Berhasil memuat ${res.data.length} grup WhatsApp.`)
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengambil grup dari perangkat. Pastikan perangkat online.')
  } finally {
    fetchingGroups.value = false
  }
}

const startEditMapping = (group: any) => {
  const existing = groupMappings.value.find(m => m.group_jid === group.jid)
  editingMapping.value = {
    device_id: selectedDeviceForGroups.value,
    group_jid: group.jid,
    group_name: group.name,
    member_count: group.memberCount || 0,
    map_type: existing?.map_type || 'class',
    class_id: existing?.class_id || '',
    role: existing?.role || '',
    is_active: existing?.is_active !== false
  }
}

const handleSaveMappingState = async () => {
  if (!editingMapping.value) return
  try {
    const res = await saveGroupMapping(selectedSchoolId.value, editingMapping.value)
    if (res.success) {
      toast.success('Pemetaan grup WhatsApp berhasil disimpan.')
      editingMapping.value = null
      await loadGroupMappings()
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan pemetaan grup.')
  }
}

// Load additional tabs data when tab changes
watch(activeTab, async (newTab) => {
  if (newTab === 'routing') {
    await loadRoutingRules()
  } else if (newTab === 'groups') {
    await loadGroupMappings()
    await fetchClasses(selectedSchoolId.value)
  } else if (newTab === 'templates') {
    await loadTemplates()
  }
})
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500 pb-16">
    <!-- Header / Selectors -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div class="space-y-2">
        <h2 class="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
          <Smartphone class="text-violet-600 dark:text-violet-400" :size="30" />
          Perangkat WhatsApp Gateway
        </h2>
        <p class="text-slate-500 dark:text-zinc-400 text-xs font-medium max-w-xl">
          Kelola nomor WhatsApp pengirim untuk notifikasi resmi sekolah. Mendukung multi-device resmi Meta (Official) dan scan QR (Unofficial).
        </p>
      </div>

      <!-- School Switcher -->
      <div class="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div class="space-y-1.5 w-full sm:w-48">
          <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Yayasan</label>
          <select 
            v-model="selectedFoundationId" 
            class="w-full text-xs font-semibold rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 p-2 text-slate-700 dark:text-zinc-300"
          >
            <option v-for="f in foundations" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>

        <div class="space-y-1.5 w-full sm:w-48">
          <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Unit Sekolah</label>
          <select 
            v-model="selectedSchoolId" 
            class="w-full text-xs font-semibold rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 p-2 text-slate-700 dark:text-zinc-300"
          >
            <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }} ({{ s.level }})</option>
          </select>
        </div>

        <BaseButton 
          v-if="selectedSchoolId"
          variant="primary" 
          class="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs h-9"
          @click="handleAddClick"
        >
          <Plus :size="16" />
          Tambah
        </BaseButton>
      </div>
    </div>

    <!-- Stats Dashboard Section -->
    <div v-if="selectedSchoolId" class="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <BaseCard stripe class="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Perangkat</p>
            <h3 class="text-xl md:text-2xl font-black mt-1 text-slate-900 dark:text-zinc-100">
              {{ stats.total }} <span class="text-xs text-slate-400 font-bold">/ 3</span>
            </h3>
          </div>
          <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
            <Smartphone :size="16" />
          </div>
        </div>
      </BaseCard>

      <BaseCard stripe class="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tersambung (Online)</p>
            <h3 class="text-xl md:text-2xl font-black mt-1 text-emerald-500">
              {{ stats.connected }}
            </h3>
          </div>
          <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500">
            <Wifi :size="16" />
          </div>
        </div>
      </BaseCard>

      <BaseCard stripe class="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Driver Official</p>
            <h3 class="text-xl md:text-2xl font-black mt-1 text-violet-500">
              {{ stats.official }}
            </h3>
          </div>
          <div class="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center text-violet-500">
            <Smartphone :size="16" />
          </div>
        </div>
      </BaseCard>

      <BaseCard stripe class="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Driver Unofficial</p>
            <h3 class="text-xl md:text-2xl font-black mt-1 text-amber-500">
              {{ stats.unofficial }}
            </h3>
          </div>
          <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500">
            <Smartphone :size="16" />
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Tabs Navigation -->
    <div v-if="selectedSchoolId" class="flex border-b border-slate-200 dark:border-slate-800 gap-4 mt-6">
      <button 
        v-for="t in tabs" 
        :key="t.id"
        @click="activeTab = t.id"
        :class="[
          'px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[2px]',
          activeTab === t.id 
            ? 'border-violet-600 text-violet-600 dark:text-violet-400 font-extrabold' 
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 hover:dark:text-zinc-200'
        ]"
      >
        {{ t.name }}
      </button>
    </div>

    <!-- Perangkat Tab content -->
    <div v-if="selectedSchoolId && activeTab === 'devices'" class="space-y-6">
      <!-- Empty State -->
      <div 
        v-if="!loading && devices.length === 0" 
        class="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4"
      >
        <div class="w-16 h-16 rounded-full bg-slate-50 dark:bg-zinc-800/80 flex items-center justify-center text-slate-400">
          <Smartphone :size="32" />
        </div>
        <div class="space-y-1">
          <h4 class="font-bold text-slate-900 dark:text-zinc-100">Belum Ada Perangkat Terdaftar</h4>
          <p class="text-xs text-slate-500 dark:text-zinc-400 max-w-sm">
            Tambahkan perangkat baru menggunakan QR Code Baileys atau Cloud API resmi untuk mulai mengirim notifikasi WA.
          </p>
        </div>
        <BaseButton variant="primary" @click="handleAddClick">
          Tambah Perangkat Pertama
        </BaseButton>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading && devices.length === 0" class="flex items-center justify-center py-20">
        <Loader2 class="animate-spin text-violet-600" :size="36" />
      </div>

      <!-- Devices Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WaDeviceCard 
          v-for="device in devices" 
          :key="device.id" 
          :device="device"
          @pause="handlePause"
          @resume="handleResume"
          @repair="handleRepair"
          @delete="handleDelete"
          @bypass-warmup="handleBypassWarmupClick"
        />
      </div>
    </div>

    <!-- Routing Rules Tab -->
    <div v-else-if="selectedSchoolId && activeTab === 'routing'" class="space-y-6">
      <BaseCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-black text-slate-900 dark:text-zinc-100">Konfigurasi Jalur Pengiriman (Routing Rules)</h3>
          </div>
        </template>

        <div class="divide-y divide-slate-100 dark:divide-zinc-850">
          <div v-for="type in notificationTypes" :key="type.id" class="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="space-y-1">
              <h4 class="text-xs font-black text-slate-900 dark:text-zinc-100">{{ type.name }}</h4>
              <p class="text-[10px] text-slate-500 dark:text-zinc-400">{{ type.desc }}</p>
              
              <!-- Display resolved rule details if set -->
              <div class="flex flex-wrap gap-2 mt-1">
                <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                  Target: {{ routingRules.find(r => r.notification_type === type.id)?.target || 'personal' }}
                </span>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400">
                  Driver: {{ routingRules.find(r => r.notification_type === type.id)?.driver || 'auto' }}
                </span>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
                  SLA: {{ routingRules.find(r => r.notification_type === type.id)?.fallback_sla_minutes || 180 }}m
                </span>
                <span v-if="routingRules.find(r => r.notification_type === type.id)?.pinned_device_id" class="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                  Pinned Device
                </span>
                <span v-if="routingRules.find(r => r.notification_type === type.id)?.pinned_group_mapping_id" class="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                  Pinned Group: {{ groupMappings.find(g => g.id === routingRules.find(r => r.notification_type === type.id)?.pinned_group_mapping_id)?.group_name || 'Spesifik' }}
                </span>
              </div>
            </div>

            <div>
              <BaseButton variant="secondary" size="sm" class="text-xs" @click="startEditRule(type.id)">
                Edit Aturan
              </BaseButton>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Edit Routing Rule Modal -->
      <BaseModal :show="!!editingRule" title="Edit Aturan Routing" size="md" @close="editingRule = null">
        <div v-if="editingRule" class="space-y-4 py-2">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500">Target Penerima</label>
            <select v-model="editingRule.target" class="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
              <option value="personal">Personal (Nomor Pribadi / Orang Tua)</option>
              <option value="group">Group WhatsApp (Grup Kelas / Staff)</option>
              <option value="both">Keduanya (Personal & Group)</option>
              <option value="off">Mute / Nonaktifkan Notifikasi</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500">Pilihan Jalur Driver</label>
            <select v-model="editingRule.driver" class="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
              <option value="auto">Auto (Prioritaskan Official, fallback Unofficial)</option>
              <option value="unofficial">Unofficial (Baileys scan QR)</option>
              <option value="official">Official (Meta Cloud API)</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500">Prioritas Pesan</label>
            <select v-model="editingRule.priority" class="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
              <option value="critical">Critical (OTP / Urgent)</option>
              <option value="high">High (Kehadiran / Keuangan)</option>
              <option value="normal">Normal (Informasi Rapor)</option>
              <option value="low">Low (Pengumuman Bulk)</option>
            </select>
          </div>

          <div class="flex items-center gap-2 py-2">
            <input type="checkbox" id="fallback_enabled" v-model="editingRule.fallback_enabled" class="rounded border-slate-350 text-violet-600 focus:ring-violet-500" />
            <label for="fallback_enabled" class="text-xs font-bold text-slate-600 dark:text-zinc-400">Aktifkan Fallback Lintas Saluran (In-App / SMS)</label>
          </div>

          <div v-if="editingRule.fallback_enabled" class="space-y-1">
            <label class="text-xs font-bold text-slate-500">SLA Batas Waktu Fallback (Menit)</label>
            <BaseInput type="number" v-model="editingRule.fallback_sla_minutes" class="w-full text-xs" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500">Kunci Perangkat Pengirim (Pinned Device)</label>
            <select v-model="editingRule.pinned_device_id" class="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
              <option value="">Auto (Gunakan perangkat yang aktif secara acak)</option>
              <option v-for="d in devices" :key="d.id" :value="d.id">{{ d.display_name }} ({{ d.phone_number || d.driver }})</option>
            </select>
          </div>

          <div v-if="editingRule.target === 'group' || editingRule.target === 'both'" class="space-y-1">
            <label class="text-xs font-bold text-slate-500">Kunci Grup WhatsApp Tujuan (Pinned Group)</label>
            <select v-model="editingRule.pinned_group_mapping_id" class="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
              <option value="">Kirim ke Semua Grup (Default/Sistem)</option>
              <option v-for="g in groupMappings" :key="g.id" :value="g.id">
                {{ g.group_name }} ({{ g.map_type === 'role' ? 'Peran: ' + g.role : 'Kelas ID: ' + g.class_id }})
              </option>
            </select>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <BaseButton variant="secondary" @click="editingRule = null">Batal</BaseButton>
            <BaseButton variant="primary" class="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold" @click="handleSaveRule">Simpan</BaseButton>
          </div>
        </div>
      </BaseModal>
    </div>

    <!-- WhatsApp Groups Tab -->
    <div v-else-if="selectedSchoolId && activeTab === 'groups'" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Current mappings -->
        <div class="lg:col-span-2 space-y-6">
          <BaseCard>
            <template #header>
              <h3 class="text-sm font-black text-slate-900 dark:text-zinc-100">Pemetaan Grup WhatsApp</h3>
            </template>
            <div v-if="groupMappings.length === 0" class="py-12 text-center text-xs text-slate-400">
              Belum ada grup WhatsApp yang dipetakan ke Kelas atau Peran.
            </div>
            <div v-else class="divide-y divide-slate-100 dark:divide-zinc-800">
              <div v-for="map in groupMappings" :key="map.id" class="py-3 flex items-center justify-between gap-4">
                <div class="space-y-1">
                  <p class="text-xs font-bold text-slate-900 dark:text-zinc-100">{{ map.group_name }}</p>
                  <p class="text-[10px] text-slate-400">{{ map.group_jid }} • {{ map.member_count }} Anggota</p>
                  <div class="flex gap-2">
                    <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400">
                      Tipe: {{ map.map_type === 'class' ? 'Kelas' : 'Peran' }}
                    </span>
                    <span v-if="map.map_type === 'class'" class="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                      Kelas: {{ classes.find(c => c.id === map.class_id)?.name || map.class_id }}
                    </span>
                    <span v-else class="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                      Peran: {{ map.role }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Right: Fetch device groups -->
        <div class="space-y-6">
          <BaseCard>
            <template #header>
              <h3 class="text-sm font-black text-slate-900 dark:text-zinc-100">Ambil Grup dari HP</h3>
            </template>
            <div class="space-y-4">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Perangkat Aktif</label>
                <select v-model="selectedDeviceForGroups" class="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200">
                  <option value="">-- Pilih Perangkat --</option>
                  <option v-for="d in devices.filter(x => x.connected || x.status === 'connected')" :key="d.id" :value="d.id">
                    {{ d.display_name }} ({{ d.phone_number }})
                  </option>
                </select>
              </div>

              <BaseButton variant="primary" class="w-full justify-center flex gap-2" :loading="fetchingGroups" @click="handleFetchGroups">
                Ambil Daftar Grup
              </BaseButton>

              <div v-if="fetchedGroups.length > 0" class="border-t border-slate-100 dark:border-zinc-800 pt-4 space-y-3 max-h-96 overflow-y-auto pr-1">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grup yang Ditemukan ({{ fetchedGroups.length }})</p>
                <div v-for="group in fetchedGroups" :key="group.jid" class="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div class="space-y-0.5 truncate">
                    <p class="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">{{ group.name }}</p>
                    <p class="text-[9px] text-slate-400">{{ group.memberCount }} Anggota</p>
                  </div>
                  <BaseButton variant="secondary" size="sm" class="text-[10px] px-2 py-1 h-7" @click="startEditMapping(group)">
                    Petakan
                  </BaseButton>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>

      <!-- Edit Group Mapping Modal -->
      <BaseModal :show="!!editingMapping" title="Petakan Grup WhatsApp" size="md" @close="editingMapping = null">
        <div v-if="editingMapping" class="space-y-4 py-2">
          <div class="space-y-1">
            <p class="text-xs font-bold text-slate-500">Nama Grup: <span class="text-slate-850 dark:text-zinc-200 font-extrabold">{{ editingMapping.group_name }}</span></p>
            <p class="text-[10px] text-slate-400">JID: {{ editingMapping.group_jid }}</p>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500">Tipe Pemetaan</label>
            <select v-model="editingMapping.map_type" class="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
              <option value="class">Kelas (Ditujukan khusus untuk kelas tertentu)</option>
              <option value="role">Peran / Posisi (Guru, TU, Wali Kelas, dll)</option>
            </select>
          </div>

          <div v-if="editingMapping.map_type === 'class'" class="space-y-1">
            <label class="text-xs font-bold text-slate-500">Pilih Kelas</label>
            <select v-model="editingMapping.class_id" class="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
              <option value="">-- Pilih Kelas --</option>
              <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }} ({{ c.grade_level }})</option>
            </select>
          </div>

          <div v-if="editingMapping.map_type === 'role'" class="space-y-1">
            <label class="text-xs font-bold text-slate-500">Nama Peran / Posisi</label>
            <select v-model="editingMapping.role" class="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
              <option value="">-- Pilih Peran --</option>
              <option value="teacher">Semua Guru</option>
              <option value="tu">Tata Usaha (Staff)</option>
              <option value="principal">Kepala Sekolah</option>
            </select>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <BaseButton variant="secondary" @click="editingMapping = null">Batal</BaseButton>
            <BaseButton variant="primary" class="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold" @click="handleSaveMappingState">Simpan</BaseButton>
          </div>
        </div>
      </BaseModal>
    </div>

    <!-- Message Templates Tab -->
    <div v-else-if="selectedSchoolId && activeTab === 'templates'" class="space-y-6">
      <BaseCard>
        <template #header>
          <h3 class="text-sm font-black text-slate-900 dark:text-zinc-100">Editor Template Pesan WhatsApp</h3>
        </template>

        <div class="divide-y divide-slate-100 dark:divide-zinc-800">
          <div v-for="type in notificationTypes" :key="type.id" class="py-4 space-y-3">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h4 class="text-xs font-black text-slate-900 dark:text-zinc-100">{{ type.name }}</h4>
                <p class="text-[10px] text-slate-500 dark:text-zinc-400">{{ type.desc }}</p>
              </div>
              <BaseButton variant="secondary" size="sm" class="text-xs" @click="startEditTemplate(type.id)">
                Edit Template
              </BaseButton>
            </div>

            <!-- Current Template Preview Box -->
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-slate-800/80">
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Isi Template saat ini:</p>
              <pre class="text-[11px] font-mono text-slate-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{{ templates.find(t => t.notification_type === type.id)?.body || 'Belum dikonfigurasi (menggunakan default sistem).' }}</pre>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Edit Template Modal -->
      <BaseModal :show="!!editingTemplate" title="Edit Template Pesan WA" size="lg" @close="editingTemplate = null">
        <div v-if="editingTemplate" class="space-y-4 py-2">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500">Format Template Pesan</label>
            <textarea 
              v-model="editingTemplate.body" 
              rows="8"
              class="w-full text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 leading-relaxed focus:ring-2 focus:ring-violet-500"
              placeholder="Contoh: {Halo|Hai|Selamat pagi} {{name}}, tagihan SPP Anda sebesar {{amount}}..."
            ></textarea>
          </div>

          <div class="p-3 bg-violet-50 dark:bg-violet-950/20 rounded-xl border border-violet-100 dark:border-violet-900/50 space-y-2">
            <h5 class="text-[10px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">Panduan Penggunaan Placeholders</h5>
            <ul class="text-[10px] text-violet-600 dark:text-violet-300 list-disc list-inside space-y-1">
              <li>Gunakan variabel format double-curly braces untuk mengganti data reaktif (misalnya: <code class="bg-violet-100 dark:bg-violet-900/40 px-1 py-0.5 rounded font-mono text-[9px] font-bold">{{name}}</code> atau <code class="bg-violet-100 dark:bg-violet-900/40 px-1 py-0.5 rounded font-mono text-[9px] font-bold">{{class}}</code>).</li>
              <li>Gunakan sintaks spin (spintax) agar redaksi pesan berbeda-beda demi menghindari banned WhatsApp: <code class="bg-violet-100 dark:bg-violet-900/40 px-1 py-0.5 rounded font-mono text-[9px] font-bold">{Halo|Hai|Selamat Pagi}</code>.</li>
            </ul>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <BaseButton variant="secondary" @click="editingTemplate = null">Batal</BaseButton>
            <BaseButton variant="primary" class="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold" @click="handleSaveTemplateState">Simpan</BaseButton>
          </div>
        </div>
      </BaseModal>
    </div>

    <!-- Log Pengiriman Tab content -->
    <div v-else-if="selectedSchoolId && activeTab === 'logs'" class="space-y-6">
      <WaLogs :school-id="selectedSchoolId" />
    </div>

    <!-- No School Selected Warning -->
    <div 
      v-else
      class="flex flex-col items-center justify-center py-16 bg-slate-50 dark:bg-zinc-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center"
    >
      <ShieldAlert class="text-slate-400 mb-4" :size="40" />
      <h4 class="font-bold text-slate-800 dark:text-zinc-200">Pilih Unit Sekolah</h4>
      <p class="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mt-1 leading-normal">
        Silakan pilih Yayasan dan Unit Sekolah di sudut kanan atas untuk mengelola perangkat WhatsApp Gateway.
      </p>
    </div>

    <!-- Add Device Modal -->
    <BaseModal :show="showAddModal" title="Tambah Perangkat Baru" size="md" @close="showAddModal = false">
      <div class="space-y-6 py-2">
        <!-- Choose Driver Card Grid -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Metode Driver</label>
          <div class="grid grid-cols-2 gap-4">
            <!-- Unofficial (Baileys) -->
            <button 
              type="button"
              class="p-4 rounded-xl border-2 text-left space-y-2 transition-all"
              :class="newDeviceForm.driver === 'unofficial' 
                ? 'border-amber-500 bg-amber-500/5' 
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'"
              @click="handleSelectDriver('unofficial')"
            >
              <Smartphone class="text-amber-500" :size="24" />
              <div>
                <h5 class="font-bold text-slate-900 dark:text-zinc-100 text-sm leading-snug">Unofficial (QR Code)</h5>
                <p class="text-[10px] text-slate-500 mt-1 leading-normal">Gratis. Scan QR dari nomor sekolah. Mendukung kirim ke grup.</p>
              </div>
            </button>

            <!-- Official (Cloud API) -->
            <button 
              type="button"
              class="p-4 rounded-xl border-2 text-left space-y-2 transition-all"
              :class="newDeviceForm.driver === 'official' 
                ? 'border-violet-500 bg-violet-500/5' 
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'"
              @click="handleSelectDriver('official')"
            >
              <Smartphone class="text-violet-500" :size="24" />
              <div>
                <h5 class="font-bold text-slate-900 dark:text-zinc-100 text-sm leading-snug">Official (Meta API)</h5>
                <p class="text-[10px] text-slate-500 mt-1 leading-normal">Resmi Meta. Butuh setup FB App. Hanya kirim personal.</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Name Input -->
        <BaseInput 
          v-model="newDeviceForm.display_name"
          label="Nama Perangkat / Label"
          placeholder="Contoh: WA Sekolah SD Utama"
          required
        />

        <!-- Official Kredensial Form -->
        <div v-if="newDeviceForm.driver === 'official'" class="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h6 class="text-xs font-bold text-slate-900 dark:text-zinc-200">Meta Cloud API Credentials</h6>
          
          <BaseInput 
            v-model="newDeviceForm.phone_number_id"
            label="Phone Number ID"
            placeholder="Contoh: 1048293740294"
            required
          />

          <BaseInput 
            v-model="newDeviceForm.waba_id"
            label="WhatsApp Business Account (WABA) ID"
            placeholder="Contoh: 849382048592"
            required
          />

          <BaseInput 
            v-model="newDeviceForm.token"
            label="Permanent System User Token"
            placeholder="Token akses Meta Permanent"
            type="password"
            required
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <BaseButton variant="outline" @click="showAddModal = false">
            Batal
          </BaseButton>
          <BaseButton variant="primary" @click="handleSaveDevice">
            {{ newDeviceForm.driver === 'unofficial' ? 'Generate QR' : 'Simpan Perangkat' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Disclaimer Modal -->
    <BaseModal :show="showDisclaimer" title="Disclaimer Penggunaan Driver Unofficial" size="md" :close-on-outside-click="false" @close="cancelDisclaimer">
      <div class="space-y-5 py-2">
        <div class="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex gap-3 text-xs leading-relaxed">
          <AlertTriangle class="flex-shrink-0 mt-0.5" :size="18" />
          <div>
            <span class="font-bold">PERINGATAN PENTING:</span>
            Driver Unofficial menggunakan automasi web (Baileys) yang melanggar Ketentuan Layanan (ToS) WhatsApp. Nomor WhatsApp Anda memiliki risiko diblokir (banned) permanen oleh Meta.
          </div>
        </div>

        <div class="text-xs text-slate-600 dark:text-zinc-400 space-y-2 leading-relaxed">
          <p>
            Dengan mengaktifkan driver ini, sekolah Anda menyetujui bahwa:
          </p>
          <ul class="list-disc pl-5 space-y-1.5 font-medium">
            <li>Risiko pemblokiran nomor sepenuhnya merupakan tanggung jawab sekolah.</li>
            <li>Sistem EduRaport menyediakan limitasi pemanasan (warm-up) dan jeda acak untuk mitigasi, namun tidak menghilangkan risiko blokir 100%.</li>
            <li>Notifikasi kritis (seperti tagihan jatuh tempo, OTP, dll) memiliki SLA fallback otomatis ke email/in-app bila koneksi terputus.</li>
            <li>Anda wajib menggunakan nomor cadangan/nomor khusus sekolah yang tidak digunakan untuk kepentingan pribadi krusial.</li>
          </ul>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <input 
            id="disclaimer"
            v-model="disclaimerAccepted"
            type="checkbox"
            class="w-4 h-4 rounded text-violet-600 border-slate-300 focus:ring-violet-500"
          />
          <label for="disclaimer" class="text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer">
            Saya memahami risiko dan menyetujui ketentuan di atas.
          </label>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <BaseButton variant="outline" @click="cancelDisclaimer">
            Kembali ke Official
          </BaseButton>
          <BaseButton variant="primary" :disabled="!disclaimerAccepted" @click="confirmDisclaimer">
            Setujui & Lanjutkan
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Bypass Warmup Warning Modal -->
    <BaseModal :show="showBypassModal" title="⚠️ Peringatan Kritis: Bypass Pemanasan Perangkat" size="md" @close="showBypassModal = false">
      <div class="space-y-5 py-2">
        <div class="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl text-amber-800 dark:text-amber-300">
          <AlertTriangle class="flex-shrink-0 mt-0.5" :size="20" />
          <div class="text-xs space-y-1">
            <h4 class="font-bold">Melompati Masa Pemanasan Sangat Berisiko!</h4>
            <p class="leading-normal">
              WhatsApp (Meta) memantau secara ketat nomor baru yang langsung mengirim pesan massal tanpa pemanasan. Tindakan mem-bypass batas ini meningkatkan risiko nomor sekolah Anda diblokir secara permanen oleh Meta.
            </p>
          </div>
        </div>

        <div class="text-xs text-slate-600 dark:text-zinc-400 space-y-2">
          <p class="font-bold text-slate-800 dark:text-zinc-200">Dengan melanjutkan, Anda memahami konsekuensi berikut:</p>
          <ul class="list-disc pl-5 space-y-1.5 font-medium leading-normal">
            <li>Nomor WhatsApp Anda dapat terdeteksi sebagai akun spam dan dibanned seketika.</li>
            <li>Sistem EduRaport akan menonaktifkan pembatasan kuota bertahap harian untuk perangkat ini.</li>
            <li>Kerugian akibat nomor diblokir (kehilangan chat history, nomor tidak dapat digunakan lagi) sepenuhnya menjadi tanggung jawab pihak sekolah.</li>
          </ul>
        </div>

        <div class="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <input 
            id="bypass-risk"
            v-model="bypassRiskAccepted"
            type="checkbox"
            class="w-4 h-4 rounded text-violet-600 border-slate-300 focus:ring-violet-500"
          />
          <label for="bypass-risk" class="text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer select-none">
            Saya setuju untuk menanggung risiko pemblokiran nomor secara penuh.
          </label>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <BaseButton variant="outline" @click="showBypassModal = false">
            Batalkan
          </BaseButton>
          <BaseButton 
            variant="danger" 
            class="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            :disabled="!bypassRiskAccepted || resendingBypass" 
            @click="handleConfirmBypass"
          >
            <Loader2 v-if="resendingBypass" class="animate-spin inline mr-1" :size="14" />
            Saya Paham Risiko, Aktifkan Bypass
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
