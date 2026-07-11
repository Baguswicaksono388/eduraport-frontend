<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { X, Check, Trash2, Mail, Send, Calendar, Clock, Plus, Info, ToggleLeft, ToggleRight } from 'lucide-vue-next'
import { useDashboard } from '../../composables/useDashboard'
import { useToast } from '../../composables/useToast'

const props = defineProps<{
  isOpen: boolean
  schoolId: string
  catalog: any[]
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
}>()

const {
  fetchDigests,
  createDigest,
  updateDigest,
  deleteDigest,
  sendDigestNow
} = useDashboard()

const toast = useToast()

// Tab navigation state
const activeTab = ref<'list' | 'form'>('list')
const digests = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const sendingId = ref<string | null>(null)
const editingId = ref<string | null>(null)

// Form fields
const form = ref({
  name: '',
  channel: 'in_app',
  schedule_type: 'daily',
  schedule_time: '07:00',
  schedule_day: '',
  recipient_roles: [] as string[],
  metric_keys: [] as string[],
  is_active: true
})

const weekdayList = [
  { value: '1', label: 'Senin' },
  { value: '2', label: 'Selasa' },
  { value: '3', label: 'Rabu' },
  { value: '4', label: 'Kamis' },
  { value: '5', label: 'Jumat' },
  { value: '6', label: 'Sabtu' },
  { value: '7', label: 'Minggu' }
]

const rolesList = [
  { value: 'principal', label: 'Kepala Sekolah' },
  { value: 'vice_principal_curriculum', label: 'Wakasek Kurikulum' },
  { value: 'treasurer', label: 'Bendahara' }
]

// Fetch Digests
const loadDigests = async () => {
  if (!props.schoolId) return
  loading.value = true
  try {
    const res = await fetchDigests(props.schoolId)
    digests.value = res.data || []
  } catch (err: any) {
    toast.error(err.message || 'Gagal memuat daftar digest', 'Error')
  } finally {
    loading.value = false
  }
}

// Reset form
const resetForm = () => {
  editingId.value = null
  form.value = {
    name: '',
    channel: 'in_app',
    schedule_type: 'daily',
    schedule_time: '07:00',
    schedule_day: '',
    recipient_roles: ['principal'],
    metric_keys: props.catalog.slice(0, 3).map(c => c.metric_key),
    is_active: true
  }
}

// Open modal handler
const close = () => {
  emit('update:isOpen', false)
}

// Switch tabs and reset
const setTab = (tab: 'list' | 'form') => {
  activeTab.value = tab
  if (tab === 'form' && !editingId.value) {
    resetForm()
  }
}

// On component load
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadDigests()
    setTab('list')
  }
})

// Toggle role selection
const toggleRole = (roleVal: string) => {
  const idx = form.value.recipient_roles.indexOf(roleVal)
  if (idx > -1) {
    form.value.recipient_roles.splice(idx, 1)
  } else {
    form.value.recipient_roles.push(roleVal)
  }
}

// Toggle metric selection
const toggleMetric = (key: string) => {
  const idx = form.value.metric_keys.indexOf(key)
  if (idx > -1) {
    form.value.metric_keys.splice(idx, 1)
  } else {
    form.value.metric_keys.push(key)
  }
}

// Save or Update Digest
const handleSave = async () => {
  if (!form.value.name.trim()) {
    toast.error('Nama digest tidak boleh kosong', 'Validasi')
    return
  }
  if (form.value.metric_keys.length === 0) {
    toast.error('Pilih minimal satu metrik laporan', 'Validasi')
    return
  }

  saving.value = true
  try {
    const payload = {
      ...form.value,
      // Format schedule_day constraints
      schedule_day: form.value.schedule_type === 'daily' ? null : form.value.schedule_day
    }

    if (editingId.value) {
      await updateDigest(props.schoolId, editingId.value, payload)
      toast.success('Jadwal digest berhasil diperbarui', 'Sukses')
    } else {
      await createDigest(props.schoolId, payload)
      toast.success('Jadwal digest baru berhasil dibuat', 'Sukses')
    }
    
    await loadDigests()
    setTab('list')
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan digest', 'Error')
  } finally {
    saving.value = false
  }
}

// Edit Digest
const handleEdit = (digest: any) => {
  editingId.value = digest.id
  form.value = {
    name: digest.name,
    channel: digest.channel || 'in_app',
    schedule_type: digest.schedule_type || 'daily',
    schedule_time: digest.schedule_time ? digest.schedule_time.slice(0, 5) : '07:00',
    schedule_day: digest.schedule_day || '',
    recipient_roles: Array.isArray(digest.recipient_roles) ? [...digest.recipient_roles] : [],
    metric_keys: Array.isArray(digest.metric_keys) ? [...digest.metric_keys] : [],
    is_active: digest.is_active !== undefined ? !!digest.is_active : true
  }
  activeTab.value = 'form'
}

// Delete Digest
const handleDelete = async (id: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus jadwal digest ini?')) return
  try {
    await deleteDigest(props.schoolId, id)
    toast.success('Jadwal digest berhasil dihapus', 'Sukses')
    await loadDigests()
  } catch (err: any) {
    toast.error(err.message || 'Gagal menghapus digest', 'Error')
  }
}

// Toggle Digest Active Status directly
const handleToggleActive = async (digest: any) => {
  try {
    const newActive = !digest.is_active
    await updateDigest(props.schoolId, digest.id, {
      ...digest,
      is_active: newActive
    })
    digest.is_active = newActive
    toast.success(`Digest di-${newActive ? 'aktifkan' : 'nonaktifkan'}`, 'Sukses')
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengubah status', 'Error')
  }
}

// Send Digest Now (Test execution)
const handleSendNow = async (id: string) => {
  sendingId.value = id
  try {
    const res = await sendDigestNow(props.schoolId, id)
    toast.success(res.message || 'Digest berhasil dikirim', 'Sukses')
    await loadDigests()
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengirim digest', 'Gagal')
  } finally {
    sendingId.value = null
  }
}

// Get display label for metrics keys
const getMetricName = (key: string) => {
  const m = props.catalog.find(c => c.metric_key === key)
  return m ? m.display_name : key
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300" @click="close"></div>

    <div class="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-violet-600">
            <Mail :size="18" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-800 dark:text-zinc-100">
              Laporan Ringkasan Eksekutif (Digests)
            </h3>
            <p class="text-[10px] text-slate-400 font-semibold">
              Jadwalkan pengiriman rekapitulasi data sekolah secara berkala ke penerima.
            </p>
          </div>
        </div>
        <button @click="close" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 transition-all">
          <X :size="16" />
        </button>
      </div>

      <!-- Tabs Navigation -->
      <div class="flex px-6 border-b border-slate-100 dark:border-zinc-800">
        <button 
          @click="setTab('list')" 
          class="px-4 py-3.5 text-xs font-bold transition-all border-b-2"
          :class="[activeTab === 'list' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-600']"
        >
          Daftar Jadwal Digest
        </button>
        <button 
          @click="setTab('form')" 
          class="px-4 py-3.5 text-xs font-bold transition-all border-b-2"
          :class="[activeTab === 'form' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-600']"
        >
          {{ editingId ? 'Sunting Jadwal' : '+ Tambah Jadwal' }}
        </button>
      </div>

      <!-- Tab Content: LIST -->
      <div v-if="activeTab === 'list'" class="p-6 space-y-4 flex-1">
        <div v-if="loading" class="flex justify-center py-12">
          <div class="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div v-else-if="digests.length === 0" class="flex flex-col items-center justify-center py-16 text-slate-400">
          <Info :size="32" class="mb-2 text-slate-300" />
          <p class="text-xs font-semibold">Belum ada jadwal digest yang dikonfigurasi.</p>
          <button @click="setTab('form')" class="mt-4 px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/10">
            Jadwalkan Digest Pertama
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            v-for="d in digests" 
            :key="d.id"
            class="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-950/10 hover:border-slate-200 dark:hover:border-zinc-700 flex flex-col justify-between transition-all"
          >
            <div>
              <div class="flex items-start justify-between gap-2">
                <h4 class="text-xs font-bold text-slate-700 dark:text-zinc-200">{{ d.name }}</h4>
                <button 
                  @click="handleToggleActive(d)"
                  class="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-all"
                >
                  <ToggleRight v-if="d.is_active" class="text-emerald-500" :size="24" />
                  <ToggleLeft v-else :size="24" />
                </button>
              </div>

              <!-- Metadata info -->
              <div class="mt-3 space-y-1.5 text-[10px] text-slate-400 font-semibold">
                <div class="flex items-center gap-1.5">
                  <Calendar :size="11" />
                  <span>Jadwal: {{ d.schedule_type.toUpperCase() }} ({{ d.schedule_time.slice(0, 5) }})</span>
                  <span v-if="d.schedule_day" class="ml-1">• Hari ke-{{ d.schedule_day }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Mail :size="11" />
                  <span>Metode: {{ d.channel === 'in_app' ? 'Notifikasi In-App' : 'Email' }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Info :size="11" />
                  <span>Penerima: {{ (d.recipient_roles || []).join(', ') }}</span>
                </div>
              </div>
            </div>

            <!-- Card Actions -->
            <div class="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
              <!-- Send Now action -->
              <button 
                @click="handleSendNow(d.id)"
                :disabled="sendingId === d.id"
                class="flex items-center gap-1 text-[10px] font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-all"
              >
                <Send :size="10" />
                {{ sendingId === d.id ? 'Mengirim...' : 'Kirim Sekarang' }}
              </button>

              <div class="flex items-center gap-2">
                <button 
                  @click="handleEdit(d)"
                  class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-[10px] font-bold text-slate-600 dark:text-zinc-300 transition-all"
                >
                  Sunting
                </button>
                <button 
                  @click="handleDelete(d.id)"
                  class="p-1 rounded text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-all"
                >
                  <Trash2 :size="12" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Content: FORM -->
      <div v-if="activeTab === 'form'" class="p-6 space-y-4 flex-1">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Left fields -->
          <div class="space-y-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nama Jadwal Laporan</label>
              <input 
                type="text" 
                v-model="form.name" 
                placeholder="Contoh: Laporan Harian Kepala Sekolah"
                class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none focus:border-violet-600"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Saluran</label>
                <select 
                  v-model="form.channel" 
                  class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none focus:border-violet-600"
                >
                  <option value="in_app">Notifikasi In-App</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Frekuensi</label>
                <select 
                  v-model="form.schedule_type" 
                  class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none focus:border-violet-600"
                >
                  <option value="daily">Harian</option>
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Clock :size="11" /> Waktu Pengiriman
                </label>
                <input 
                  type="time" 
                  v-model="form.schedule_time" 
                  class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-1.5 text-xs font-semibold outline-none focus:border-violet-600"
                />
              </div>

              <div v-if="form.schedule_type === 'weekly'" class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hari Pengiriman</label>
                <select 
                  v-model="form.schedule_day" 
                  class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none focus:border-violet-600"
                >
                  <option v-for="w in weekdayList" :key="w.value" :value="w.value">{{ w.label }}</option>
                </select>
              </div>

              <div v-else-if="form.schedule_type === 'monthly'" class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tanggal Pengiriman</label>
                <select 
                  v-model="form.schedule_day" 
                  class="bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold outline-none focus:border-violet-600"
                >
                  <option v-for="d in 28" :key="d" :value="String(d)">Tanggal {{ d }}</option>
                </select>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Penerima Laporan (Jabatan)</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="r in rolesList"
                  :key="r.value"
                  type="button"
                  @click="toggleRole(r.value)"
                  class="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border"
                  :class="[
                    form.recipient_roles.includes(r.value)
                      ? 'bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-900 text-violet-600 dark:text-violet-400'
                      : 'bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 hover:border-slate-300'
                  ]"
                >
                  {{ r.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Right side: Select indicators -->
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pilih Mutu/Metrik Laporan</label>
            <div class="border border-slate-100 dark:border-zinc-800 rounded-xl p-3 bg-slate-50/30 dark:bg-zinc-950/20 max-h-[280px] overflow-y-auto space-y-2">
              <div 
                v-for="c in catalog" 
                :key="c.metric_key"
                @click="toggleMetric(c.metric_key)"
                class="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all border"
                :class="[
                  form.metric_keys.includes(c.metric_key)
                    ? 'border-violet-200 bg-violet-50/20 dark:border-violet-950/40 dark:bg-violet-950/10'
                    : 'border-transparent hover:bg-slate-100/50 dark:hover:bg-zinc-800/40'
                ]"
              >
                <input 
                  type="checkbox" 
                  :checked="form.metric_keys.includes(c.metric_key)"
                  class="rounded border-slate-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-600 w-3.5 h-3.5"
                />
                <div>
                  <h5 class="text-[11px] font-bold text-slate-700 dark:text-zinc-200 leading-tight">{{ c.display_name }}</h5>
                  <p class="text-[9px] text-slate-400 font-medium leading-normal">{{ c.metric_key }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer for Form -->
        <div class="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
          <button 
            @click="setTab('list')" 
            class="px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 transition-all"
          >
            Batal
          </button>
          <button 
            @click="handleSave"
            :disabled="saving"
            class="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 transition-all shadow-md shadow-violet-600/15"
          >
            <Check :size="12" />
            {{ saving ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Jadwalkan Digest') }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
