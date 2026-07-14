<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Send
} from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal } from '@eduraport/ui'
import { useWaDevices } from '../../composables/useWaDevices'
import { useToast } from '../../composables/useToast'

import { usePagination } from '../../composables/usePagination'

const props = defineProps<{
  schoolId: string
}>()

const { fetchMessages, resendMessage } = useWaDevices()
const toast = useToast()

const loading = ref(false)
const resendingId = ref<string | null>(null)
const logs = ref<any[]>([])
const activeFilter = ref('')
const searchInput = ref('')
const searchDebounce = ref('')

const { page, itemPerPage } = usePagination(10)
const logsMeta = ref<any>(null)

// Modal states for message preview
const selectedMessage = ref<any | null>(null)

const statusTypes = [
  { id: '', name: 'Semua Status' },
  { id: 'sent', name: 'Terkirim' },
  { id: 'delivered', name: 'Diterima' },
  { id: 'read', name: 'Dibaca' },
  { id: 'queued', name: 'Mengantre' },
  { id: 'sending', name: 'Mengirim' },
  { id: 'failed', name: 'Gagal' },
  { id: 'skipped', name: 'Dilewati (Skip)' }
]

const notificationTypesMap: Record<string, string> = {
  ppdb_registration: 'Pendaftaran PPDB (Wali)',
  ppdb_new_applicant_alert: 'Alert PPDB (Panitia)',
  ppdb_announcement: 'Pengumuman PPDB',
  attendance_alert: 'Absensi Harian',
  billing_invoice: 'Tagihan SPP',
  billing_receipt: 'Kuitansi SPP',
  grade_published: 'Publikasi Rapor',
  otp: 'OTP Login'
}

const getNotificationLabel = (type: string) => {
  return notificationTypesMap[type] || type
}

const loadLogs = async () => {
  if (!props.schoolId) return
  loading.value = true
  try {
    const res = await fetchMessages(props.schoolId, {
      page: page.value,
      itemPerPage: itemPerPage.value,
      status: activeFilter.value || undefined,
      search: searchDebounce.value || undefined
    })
    if (res.success) {
      logs.value = res.data.data
      logsMeta.value = {
        page: res.data.page,
        item_per_page: res.data.item_per_page,
        total_item: res.data.total_item,
        total_page: res.data.total_page,
        list_pagination: res.data.list_pagination
      }
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal memuat log riwayat pesan.')
  } finally {
    loading.value = false
  }
}

const handleResend = async (msg: any) => {
  if (resendingId.value) return
  resendingId.value = msg.id
  try {
    const res = await resendMessage(props.schoolId, msg.id)
    if (res.success) {
      toast.success('Pesan berhasil dimasukkan kembali ke antrean untuk dikirim ulang.')
      await loadLogs()
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengirim ulang pesan.')
  } finally {
    resendingId.value = null
  }
}

const viewMessageBody = (msg: any) => {
  selectedMessage.value = msg
}

// Watchers for reloading logs on filter change
watch(activeFilter, () => {
  page.value = 1
  loadLogs()
})

let debounceTimeout: any
watch(searchInput, (newVal) => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    searchDebounce.value = newVal
    page.value = 1
    loadLogs()
  }, 500)
})

watch(() => props.schoolId, () => {
  page.value = 1
  loadLogs()
})

watch([page, itemPerPage], () => {
  loadLogs()
})

onMounted(() => {
  loadLogs()
})

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Filter Toolbar -->
    <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
      <!-- Search Input -->
      <div class="relative flex-1 max-w-md">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search :size="16" />
        </span>
        <input 
          v-model="searchInput"
          type="text"
          placeholder="Cari nomor target atau isi pesan..."
          class="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
        />
      </div>

      <!-- Filters & Refresh -->
      <div class="flex items-center gap-3">
        <!-- Status Filter Select -->
        <select 
          v-model="activeFilter"
          class="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900 p-2.5 text-slate-700 dark:text-zinc-300 shadow-sm"
        >
          <option v-for="st in statusTypes" :key="st.id" :value="st.id">{{ st.name }}</option>
        </select>

        <!-- Refresh Button -->
        <BaseButton 
          variant="secondary"
          class="h-10 w-10 flex items-center justify-center p-0 rounded-xl"
          @click="loadLogs"
          :disabled="loading"
        >
          <RefreshCw :size="16" :class="{ 'animate-spin': loading }" />
        </BaseButton>
      </div>
    </div>

    <!-- Table Card -->
    <BaseCard class="overflow-hidden bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="border-b border-slate-100 dark:border-zinc-800 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              <th class="p-4">Penerima (Target)</th>
              <th class="p-4">Tipe</th>
              <th class="p-4">Isi Pesan</th>
              <th class="p-4">Tanggal Antre</th>
              <th class="p-4">Status</th>
              <th class="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-zinc-800 text-xs">
            <!-- Loading Row -->
            <tr v-if="loading && logs.length === 0">
              <td colspan="6" class="p-8 text-center text-slate-400 dark:text-zinc-500">
                <RefreshCw class="animate-spin inline mr-2 text-violet-500" :size="16" />
                Memuat riwayat pengiriman...
              </td>
            </tr>

            <!-- Empty Row -->
            <tr v-else-if="logs.length === 0">
              <td colspan="6" class="p-12 text-center text-slate-400 dark:text-zinc-500 leading-normal">
                Belum ada log pesan yang cocok dengan kriteria pencarian/filter.
              </td>
            </tr>

            <!-- Log Rows -->
            <tr 
              v-for="msg in logs" 
              :key="msg.id"
              class="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors"
            >
              <!-- Target Receiver -->
              <td class="p-4 font-semibold text-slate-800 dark:text-zinc-200">
                <span class="block text-[11px] font-mono select-all">{{ msg.target }}</span>
                <span class="text-[9px] text-slate-400 block font-normal">Kind: {{ msg.target_kind }}</span>
              </td>

              <!-- Notification Type -->
              <td class="p-4 font-medium text-slate-700 dark:text-zinc-300">
                {{ getNotificationLabel(msg.notification_type) }}
              </td>

              <!-- Body Rendered preview -->
              <td class="p-4 max-w-xs md:max-w-sm truncate text-slate-500 dark:text-zinc-400">
                {{ msg.body_rendered || '(Tidak ada konten teks / media saja)' }}
              </td>

              <!-- Queued Date -->
              <td class="p-4 text-slate-500 dark:text-zinc-400">
                {{ formatDate(msg.queued_at) }}
              </td>

              <!-- Status Badge -->
              <td class="p-4">
                <div class="inline-flex flex-col gap-1 items-start">
                  <span 
                    class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider block"
                    :class="[
                      msg.status === 'sent' || msg.status === 'delivered' || msg.status === 'read'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : msg.status === 'queued' || msg.status === 'sending'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : msg.status === 'failed'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-500/10 text-slate-500 dark:text-zinc-400'
                    ]"
                  >
                    {{ msg.status }}
                  </span>

                  <!-- Error Reason Trigger -->
                  <span 
                    v-if="msg.status === 'failed' && msg.skip_or_fail_reason"
                    class="text-[9px] text-rose-500 font-medium max-w-[150px] truncate block"
                    :title="msg.skip_or_fail_reason"
                  >
                    Err: {{ msg.skip_or_fail_reason }}
                  </span>
                  <span 
                    v-else-if="msg.status === 'skipped' && msg.skip_or_fail_reason"
                    class="text-[9px] text-slate-400 font-medium max-w-[150px] truncate block"
                    :title="msg.skip_or_fail_reason"
                  >
                    {{ msg.skip_or_fail_reason }}
                  </span>
                </div>
              </td>

              <!-- Actions -->
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <!-- View Preview Action -->
                  <BaseButton 
                    variant="secondary" 
                    size="sm"
                    class="p-1.5 h-8 w-8 rounded-lg flex items-center justify-center border-slate-100 dark:border-slate-800"
                    title="Detail Pesan"
                    @click="viewMessageBody(msg)"
                  >
                    <Eye :size="14" />
                  </BaseButton>

                  <!-- Resend Action -->
                  <BaseButton 
                    v-if="msg.status !== 'sent' && msg.status !== 'delivered' && msg.status !== 'read'"
                    variant="outline" 
                    size="sm"
                    class="px-2.5 py-1 text-[10px] font-bold border-violet-200 hover:bg-violet-50 dark:border-violet-900/50 hover:dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 h-8 flex items-center gap-1"
                    @click="handleResend(msg)"
                    :disabled="resendingId === msg.id"
                  >
                    <RefreshCw 
                      v-if="resendingId === msg.id" 
                      class="animate-spin" 
                      :size="10" 
                    />
                    <Send v-else :size="10" />
                    Kirim Ulang
                  </BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <AppPagination
        v-if="logsMeta"
        v-model:page="page"
        v-model:itemPerPage="itemPerPage"
        :totalItem="logsMeta.total_item"
        :totalPage="logsMeta.total_page"
        :listPagination="logsMeta.list_pagination"
        class="p-4 border-t border-slate-100 dark:border-zinc-800"
      />
    </BaseCard>

    <!-- Message Detail Preview Modal -->
    <BaseModal 
      :show="!!selectedMessage" 
      title="Detail & Konten Pesan WhatsApp" 
      size="md" 
      @close="selectedMessage = null"
    >
      <div v-if="selectedMessage" class="space-y-4 py-2">
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-slate-400 font-bold block text-[10px] uppercase">Penerima</span>
            <span class="font-bold text-slate-800 dark:text-zinc-200 select-all font-mono">{{ selectedMessage.target }}</span>
          </div>
          <div>
            <span class="text-slate-400 font-bold block text-[10px] uppercase">Waktu Antre</span>
            <span class="font-semibold text-slate-800 dark:text-zinc-200">{{ formatDate(selectedMessage.queued_at) }}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-slate-400 font-bold block text-[10px] uppercase">Status Pengiriman</span>
            <span class="font-bold uppercase tracking-wider text-[10px]" :class="[
              selectedMessage.status === 'sent' || selectedMessage.status === 'delivered' || selectedMessage.status === 'read' ? 'text-emerald-500' :
              selectedMessage.status === 'failed' ? 'text-rose-500' : 'text-amber-500'
            ]">{{ selectedMessage.status }}</span>
          </div>
          <div>
            <span class="text-slate-400 font-bold block text-[10px] uppercase">Percobaan Kirim (Retries)</span>
            <span class="font-semibold text-slate-800 dark:text-zinc-200">{{ selectedMessage.retry_count }} / 2</span>
          </div>
        </div>

        <div v-if="selectedMessage.skip_or_fail_reason" class="p-3 bg-rose-500/5 border border-rose-500/10 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex gap-2">
          <AlertCircle class="flex-shrink-0 mt-0.5" :size="16" />
          <div>
            <span class="font-bold block">Penyebab Gagal / Dilewati:</span>
            {{ selectedMessage.skip_or_fail_reason }}
          </div>
        </div>

        <!-- Rendered text body message -->
        <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Isi Pesan Terkirim</label>
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 font-mono text-[11px] text-slate-700 dark:text-zinc-300 border border-slate-100 dark:border-slate-800/80 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {{ selectedMessage.body_rendered || '(Tidak ada konten teks / media saja)' }}
          </div>
        </div>

        <!-- Media URL if exists -->
        <div v-if="selectedMessage.media_url" class="space-y-1">
          <label class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">URL Lampiran Media</label>
          <a 
            :href="selectedMessage.media_url" 
            target="_blank"
            class="text-xs text-violet-600 dark:text-violet-400 underline font-semibold truncate block"
          >
            {{ selectedMessage.media_url }}
          </a>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <BaseButton variant="outline" @click="selectedMessage = null">
            Tutup
          </BaseButton>
          <BaseButton 
            v-if="selectedMessage.status !== 'sent' && selectedMessage.status !== 'delivered' && selectedMessage.status !== 'read'"
            variant="primary" 
            class="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold"
            @click="handleResend(selectedMessage)"
            :disabled="resendingId === selectedMessage.id"
          >
            Kirim Ulang Sekarang
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
