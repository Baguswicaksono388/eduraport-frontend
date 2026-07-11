<script setup lang="ts">
import { MessageSquare, Calendar, ChevronRight, TrendingUp, AlertTriangle } from 'lucide-vue-next'
import BriefingHero from '../BriefingHero.vue'
import SparkLine from '../SparkLine.vue'
import MetricCard from '../MetricCard.vue'

const props = defineProps<{
  briefing: { textHtml: string; actions: Array<{ label: string; route: string }> }
  metrics: any[]
  userName: string
  recalculatingKeys: Record<string, boolean>
  sendingReminder: boolean
}>()

const emit = defineEmits<{
  (e: 'recalculate', key: string): void
  (e: 'action', route: string): void
  (e: 'send-reminder', payload: { recipient_id: string; metric_key: string; message_body: string; phone?: string }): void
}>()

// 1. Fetch SPP Inflow Trends
const collectMetric = computed(() => props.metrics.find((x) => x.metric_key === 'fin.collect.month'))
const trendData = computed(() => {
  return collectMetric.value?.payload?.tren || [70, 75, 80, 82, 85, 82]
})

// 2. Fetch Aging buckets
const agingMetric = computed(() => props.metrics.find((x) => x.metric_key === 'fin.aging'))
const agingBuckets = computed(() => {
  return agingMetric.value?.payload?.buckets || [
    { key: 'b30', label: '1 bulan', amount: 35000000, students: 25 },
    { key: 'b90', label: '2-3 bulan', amount: 24250000, students: 12 },
    { key: 'b90p', label: '>3 bulan', amount: 15000000, students: 5 }
  ]
})

// 3. Top arrears student list
const topArrears = computed(() => {
  return agingMetric.value?.payload?.top_arrears || []
})

// 4. Trigger direct WA reminder with backend logging
const handleWaReminder = (student: any) => {
  const amountStr = student.outstanding.toLocaleString('id-ID')
  const phone = student.phone || '628123456789' // fallback
  const msg = `Halo Bapak/Ibu dari ${student.name} (${student.class}). Kami menginfokan terdapat kewajiban SPP yang belum terselesaikan sebesar Rp ${amountStr}. Mohon segera melakukan pembayaran. Terima kasih.`

  emit('send-reminder', {
    recipient_id: student.student_id, // Save student reference
    metric_key: 'fin.arrears.top',
    message_body: msg,
    phone // Passed along to open URL in browser
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Briefing Narrative -->
    <BriefingHero
      :textHtml="briefing.textHtml"
      :actions="briefing.actions"
      :userName="userName"
      @action="emit('action', $event)"
    />

    <!-- Financial Cash and Collectibility Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="m in metrics.filter(x => ['fin.cash.today', 'fin.collect.month', 'fin.recon.gateway'].includes(x.metric_key))" :key="m.metric_key">
        <MetricCard
          :metric="m"
          :recalculating="!!recalculatingKeys[m.metric_key]"
          @recalculate="emit('recalculate', $event)"
          @action="emit('action', $event)"
        />
      </div>
    </div>

    <!-- Trend & Arrears section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left side: Sparkline Inflow Trend & Aging Brackets -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Cash inflow trend -->
        <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xs font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
                Tren Kolektibilitas Bulanan
              </h3>
              <p class="text-lg font-bold text-slate-800 dark:text-zinc-100 mt-0.5">
                Grafik Kolektibilitas SPP (6 Bulan Terakhir)
              </p>
            </div>
            <TrendingUp class="text-violet-500" :size="20" />
          </div>

          <!-- Sparkline rendering -->
          <div class="flex items-center justify-center py-4 bg-slate-50/50 dark:bg-zinc-950/20 rounded-lg border border-slate-100 dark:border-zinc-900/60">
            <SparkLine :data="trendData" :width="380" :height="80" strokeColor="#8b5cf6" fillColor="#c084fc" />
          </div>
        </div>

        <!-- Aging Brackets -->
        <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 class="text-xs font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
            Umur Piutang Tagihan (Aging Brackets)
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="b in agingBuckets"
              :key="b.key"
              class="border border-slate-100 dark:border-zinc-800 p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-950/20 space-y-2"
            >
              <span class="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                Tunggakan {{ b.label }}
              </span>
              <h4 class="text-lg font-black text-slate-800 dark:text-zinc-100">
                Rp {{ b.amount.toLocaleString('id-ID') }}
              </h4>
              <p class="text-[10px] font-bold text-slate-500">
                Tersebar di {{ b.students }} siswa
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side: Top Arrears List -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
        <div class="space-y-4">
          <div>
            <h3 class="text-xs font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
              10 Siswa Tunggakan Terbesar
            </h3>
            <p class="text-[10px] text-slate-400 font-semibold mt-0.5">
              Gunakan pengingat manual untuk menghubungi orang tua siswa via WhatsApp.
            </p>
          </div>

          <!-- Arrears Table -->
          <div class="divide-y divide-slate-100 dark:divide-zinc-800 max-h-96 overflow-y-auto pr-1">
            <div
              v-for="s in topArrears"
              :key="s.student_id"
              class="py-3 flex items-center justify-between gap-4 text-xs"
            >
              <div>
                <p class="font-bold text-slate-700 dark:text-zinc-200">
                  {{ s.name }}
                </p>
                <p class="text-[10px] text-slate-400">Kelas: {{ s.class }}</p>
              </div>

              <div class="text-right space-y-1">
                <p class="font-extrabold text-slate-900 dark:text-zinc-100">
                  Rp {{ s.outstanding.toLocaleString('id-ID') }}
                </p>
                
                <button
                  @click="handleWaReminder(s)"
                  :disabled="sendingReminder"
                  class="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded text-[10px] font-bold shadow-sm"
                >
                  <MessageSquare :size="10" />
                  <span>Ingatkan WA</span>
                </button>
              </div>
            </div>

            <div v-if="topArrears.length === 0" class="text-center py-6 text-slate-400 italic">
              Tidak ada data tunggakan terdeteksi.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
