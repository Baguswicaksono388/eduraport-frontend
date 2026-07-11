<script setup lang="ts">
import { ref, computed } from 'vue'
import { Settings, Mail } from 'lucide-vue-next'
import BriefingHero from '../BriefingHero.vue'
import GaugeChart from '../GaugeChart.vue'
import MetricCard from '../MetricCard.vue'
import AlarmCard from '../AlarmCard.vue'
import ThresholdSettingsModal from '../ThresholdSettingsModal.vue'
import DigestConfigModal from '../DigestConfigModal.vue'

const props = defineProps<{
  schoolId: string
  briefing: { textHtml: string; actions: Array<{ label: string; route: string }> }
  metrics: any[]
  thresholds: any[]
  catalog: any[]
  userName: string
  recalculatingKeys: Record<string, boolean>
  savingThreshold: boolean
}>()

const emit = defineEmits<{
  (e: 'recalculate', key: string): void
  (e: 'action', route: string): void
  (e: 'save-threshold', threshold: any): void
}>()

// Modal states
const isThresholdModalOpen = ref(false)
const isDigestModalOpen = ref(false)

// Academics progress metric
const acadReadinessVal = computed(() => {
  const m = props.metrics.find((x) => x.metric_key === 'acad.report.readiness')
  return m ? Number(m.value) : 0
})

// Occupancy metric
const occupancyVal = computed(() => {
  const m = props.metrics.find((x) => x.metric_key === 'growth.occupancy')
  return m ? Number(m.value) : 0
})

// Filter out structural metrics for standard grid cards
const gridMetrics = computed(() => {
  const skip = ['acad.report.readiness', 'growth.occupancy']
  return props.metrics.filter((m) => !skip.includes(m.metric_key))
})
</script>

<template>
  <div class="space-y-6">
    <!-- Quick Config Strip -->
    <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-200/60 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
      <div class="space-y-0.5">
        <h4 class="text-xs font-bold text-slate-700 dark:text-zinc-200">Panel Kontrol Konfigurasi</h4>
        <p class="text-[10px] text-slate-400 font-semibold">Atur ambang batas toleransi data dan penjadwalan laporan otomatis.</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="isThresholdModalOpen = true"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-all shadow-sm"
        >
          <Settings :size="13" class="text-slate-400" />
          Konfigurasi Alarm
        </button>
        <button
          @click="isDigestModalOpen = true"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-md shadow-violet-600/10"
        >
          <Mail :size="13" />
          Jadwalkan Laporan (Digest)
        </button>
      </div>
    </div>

    <!-- Briefing Narrative -->
    <BriefingHero
      :textHtml="briefing.textHtml"
      :actions="briefing.actions"
      :userName="userName"
      @action="emit('action', $event)"
    />

    <!-- Highlight Gauges -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Academics readiness gauge -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col items-center justify-between">
        <h3 class="text-xs font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider mb-2">
          Kesiapan Kelengkapan Nilai Rapor
        </h3>
        <GaugeChart :value="acadReadinessVal" label="Progress Pengisian" />
        <p class="text-[10px] text-slate-400 font-semibold text-center mt-3 max-w-xs">
          Rata-rata persentase input dan finalisasi nilai oleh guru mata pelajaran di seluruh kelas.
        </p>
      </div>

      <!-- School Occupancy gauge -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col items-center justify-between">
        <h3 class="text-xs font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider mb-2">
          Okupansi / Kapasitas Daya Tampung Siswa
        </h3>
        <GaugeChart :value="occupancyVal" label="Kapasitas Terisi" />
        <p class="text-[10px] text-slate-400 font-semibold text-center mt-3 max-w-xs">
          Rasio perbandingan jumlah siswa aktif terhadap kuota daya tampung maksimum kelas.
        </p>
      </div>
    </div>

    <!-- Main Operational Metric Cards Grid & Sidebar layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <h3 class="text-sm font-black tracking-tight text-slate-800 dark:text-zinc-200">
          Metrik Operasional Utama
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="m in gridMetrics" :key="m.metric_key">
            <MetricCard
              :metric="m"
              :recalculating="!!recalculatingKeys[m.metric_key]"
              @recalculate="emit('recalculate', $event)"
              @action="emit('action', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Alarm limits config side panel -->
      <div class="space-y-4">
        <h3 class="text-sm font-black tracking-tight text-slate-800 dark:text-zinc-200">
          Aturan Alarm
        </h3>
        <AlarmCard
          :thresholds="thresholds"
          :catalog="catalog"
          :saving="savingThreshold"
          @save="emit('save-threshold', $event)"
        />
      </div>
    </div>

    <!-- Modals -->
    <ThresholdSettingsModal
      v-model:isOpen="isThresholdModalOpen"
      :thresholds="thresholds"
      :catalog="catalog"
      :saving="savingThreshold"
      @save-threshold="emit('save-threshold', $event)"
    />

    <DigestConfigModal
      v-model:isOpen="isDigestModalOpen"
      :schoolId="schoolId"
      :catalog="catalog"
    />
  </div>
</template>
