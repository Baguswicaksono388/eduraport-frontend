<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ShieldCheck, ArrowLeft, Globe, Monitor, Smartphone, Clock, ShieldAlert } from 'lucide-vue-next'
import { BaseCard } from '@eduraport/ui'
import { useParent } from '../../composables/useParent'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_token')
      if (!token.value) return navigateTo('/login')
    }
  ]
})

const { fetchAccessLogs } = useParent()

const loading = ref(true)
const logs = ref<any[]>([])

const loadLogs = async () => {
  loading.value = true
  try {
    const res = await fetchAccessLogs(1, 20)
    logs.value = res.data || []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
})

const getActionLabel = (action: string) => {
  const map: Record<string, string> = {
    login: 'Login Berhasil',
    sign_rapor: 'Tanda Tangan Rapor Digital',
    pay_bill: 'Pembayaran Tagihan SPP',
    submit_leave_request: 'Pengajuan Surat Izin',
    book_meeting: 'Booking Pertemuan Guru (PTM)',
    cancel_meeting: 'Pembatalan Jadwal PTM'
  }
  return map[action] || action
}
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
    <div class="flex items-center gap-3">
      <NuxtLink to="/" class="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-violet-600 transition">
        <ArrowLeft :size="18" />
      </NuxtLink>
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <ShieldCheck class="text-emerald-500" :size="24" />
          Log Keamanan & Riwayat Akses
        </h2>
        <p class="text-xs text-slate-500">Audit trail aktivitas akun, alamat IP, dan perangkat yang digunakan</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-3">
      <div v-if="logs.length > 0" class="space-y-2.5">
        <BaseCard v-for="log in logs" :key="log.id" class="p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 rounded-lg">
                <ShieldCheck :size="18" />
              </div>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-zinc-100 text-xs">
                  {{ getActionLabel(log.action) }}
                </h4>
                <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span class="flex items-center gap-1">
                    <Globe :size="12" /> IP: {{ log.ip_address || '127.0.0.1' }}
                  </span>
                  <span>&bull;</span>
                  <span class="truncate max-w-[200px] md:max-w-md">
                    {{ log.user_agent || 'Browser Web' }}
                  </span>
                </div>
              </div>
            </div>

            <span class="text-[10px] text-slate-400 font-semibold shrink-0">
              {{ new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </div>
        </BaseCard>
      </div>

      <div v-else class="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
        <ShieldCheck class="mx-auto text-emerald-500 mb-2" :size="36" />
        <p class="text-sm font-bold text-slate-800 dark:text-zinc-200">Tidak ada aktivitas mencurigakan</p>
        <p class="text-xs text-slate-400 mt-1">Semua aktivitas akun tercatat secara aman.</p>
      </div>
    </div>
  </div>
</template>
