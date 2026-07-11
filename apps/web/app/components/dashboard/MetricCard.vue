<script setup lang="ts">
import { AlertTriangle, RefreshCw, ArrowUpRight, Zap } from 'lucide-vue-next'

const props = defineProps<{
  metric: {
    metric_key: string
    display_name: string
    value: number
    payload: any
    freshness: string
    is_alarm_triggered: boolean
    drill_route?: string | null
    quick_action?: string | null
  }
  recalculating: boolean
}>()

const emit = defineEmits<{
  (e: 'recalculate', key: string): void
  (e: 'action', route: string): void
}>()

// Format metric values nicely
const formattedValue = computed(() => {
  const key = props.metric.metric_key
  const val = props.metric.value

  if (props.metric.payload?.not_submitted) {
    return 'Belum Diisi'
  }

  if (key.includes('cash') || key.includes('arrears') || key.includes('subhonor')) {
    return `Rp ${val.toLocaleString('id-ID')}`
  }
  if (key.includes('collect') || key.includes('readiness') || key.includes('occupancy') || key.includes('attendance') || key.includes('.att.')) {
    return `${val}%`
  }
  return String(val)
})

const freshnessLabel = computed(() => {
  const f = props.metric.freshness
  if (f === 'live') return 'Real-time'
  if (f.startsWith('snapshot')) return `Snapshot ${f.split(' ')[1] || ''}`
  return f
})
</script>

<template>
  <div
    class="bg-white dark:bg-zinc-900 border rounded-xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md flex flex-col justify-between h-full animate-in fade-in duration-300"
    :class="[
      metric.is_alarm_triggered || metric.payload?.not_submitted
        ? 'border-rose-300 dark:border-rose-950 bg-rose-50/10' 
        : 'border-slate-200 dark:border-zinc-800'
    ]"
  >
    <!-- Alarm Header Indicator -->
    <div v-if="metric.is_alarm_triggered || metric.payload?.not_submitted" class="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>

    <div class="space-y-4">
      <div class="flex items-start justify-between">
        <div>
          <span class="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500 block">
            {{ freshnessLabel }}
          </span>
          <h3 class="text-xs font-bold text-slate-700 dark:text-zinc-300 line-clamp-1 mt-0.5">
            {{ metric.display_name }}
          </h3>
        </div>
        
        <!-- Warning Icon -->
        <span
          v-if="metric.is_alarm_triggered || metric.payload?.not_submitted"
          class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-500 animate-pulse"
          title="Kehadiran belum diisi / alarm terpicu"
        >
          <AlertTriangle :size="13" />
        </span>
      </div>

      <!-- Main Value display -->
      <div>
        <h4 class="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100" :class="{ 'text-rose-500': metric.payload?.not_submitted }">
          {{ formattedValue }}
        </h4>
      </div>

      <!-- Metadata / Custom payload rendering -->
      <div class="text-[11px] text-slate-500 dark:text-zinc-400 space-y-1 bg-slate-50/50 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-900">
        <!-- Student attendance detail -->
        <template v-if="metric.metric_key === 'att.students.today' && metric.payload">
          <div v-if="metric.payload.not_submitted" class="text-rose-500 font-bold text-[10px] leading-tight">
            ⚠ {{ metric.payload.message }}
          </div>
          <template v-else>
            <div class="flex justify-between font-semibold">
              <span>Siswa Masuk:</span>
              <span>{{ metric.payload.attended_students }} / {{ metric.payload.total_students }}</span>
            </div>
            <div v-if="metric.payload.anomalies && metric.payload.anomalies.length > 0" class="text-rose-500 font-bold mt-1 text-[10px] leading-tight">
              ⚠ {{ metric.payload.anomalies[0] }}
            </div>
          </template>
        </template>

        <!-- Teacher attendance detail -->
        <template v-if="metric.metric_key === 'att.teachers.today' && metric.payload">
          <div v-if="metric.payload.not_submitted" class="text-rose-500 font-bold text-[10px] leading-tight">
            ⚠ {{ metric.payload.message }}
          </div>
          <template v-else>
            <div class="flex justify-between font-semibold">
              <span>Hadir:</span>
              <span>{{ metric.payload.present }} / {{ metric.payload.total }}</span>
            </div>
            <div v-if="metric.payload.izin && metric.payload.izin.length > 0" class="mt-1 space-y-0.5">
              <div v-for="(i, idx) in metric.payload.izin" :key="idx" class="text-[10px] font-bold"
                :class="{
                  'text-amber-500': ['SAKIT', 'IZIN'].includes(i.j),
                  'text-rose-500': i.j === 'ALPHA',
                  'text-indigo-500': i.j === 'DINAS'
                }"
              >
                {{ i.j }}: {{ i.n }}
              </div>
            </div>
          </template>
        </template>

        <template v-if="metric.metric_key === 'fin.collect.month' && metric.payload">
          <div class="flex justify-between font-semibold">
            <span>Sudah Bayar:</span>
            <span>Rp {{ Number(metric.payload.collected || 0).toLocaleString('id-ID') }}</span>
          </div>
          <div class="flex justify-between font-semibold text-[10px] text-slate-400">
            <span>Target Total:</span>
            <span>Rp {{ Number(metric.payload.billed || 0).toLocaleString('id-ID') }}</span>
          </div>
        </template>

        <!-- Vacancy details -->
        <template v-if="metric.metric_key === 'sched.vacancy.today' && Array.isArray(metric.payload)">
          <div class="flex justify-between font-semibold">
            <span>Total Kelas Kosong:</span>
            <span>{{ metric.value }}</span>
          </div>
          <div v-if="metric.payload.length > 0" class="mt-1 space-y-0.5 max-h-16 overflow-y-auto pr-1">
            <div v-for="(v, i) in metric.payload.slice(0, 3)" :key="i" class="text-[9px] truncate" :class="v.s === 'red' ? 'text-rose-500 font-bold' : 'text-slate-400'">
              {{ v.t }} ({{ v.rawStatus.toUpperCase() }})
            </div>
          </div>
        </template>

        <!-- Default fallback payload details -->
        <template v-if="!['att.students.today', 'att.teachers.today', 'fin.collect.month', 'sched.vacancy.today'].includes(metric.metric_key)">
          <div v-if="metric.payload && typeof metric.payload === 'object' && Object.keys(metric.payload).length > 0" class="space-y-0.5">
            <div v-for="(val, k) in metric.payload" :key="k" class="flex justify-between text-[10px]">
              <span class="capitalize text-slate-400 font-bold">{{ k.replace('_', ' ') }}:</span>
              <span class="font-bold text-slate-700 dark:text-zinc-300 truncate max-w-[120px]">{{ typeof val === 'object' ? '...' : val }}</span>
            </div>
          </div>
          <div v-else class="text-slate-400 text-center py-1 italic font-semibold">
            Tidak ada detail tambahan
          </div>
        </template>
      </div>
    </div>

    <!-- Actions Footer -->
    <div class="flex items-center gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-zinc-900 justify-between">
      <!-- Recalculate button -->
      <button
        @click="emit('recalculate', metric.metric_key)"
        :disabled="recalculating"
        class="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors disabled:opacity-50"
      >
        <RefreshCw :class="{ 'animate-spin': recalculating }" :size="12" />
        <span>Hitung Ulang</span>
      </button>

      <!-- Action link -->
      <button
        v-if="metric.drill_route"
        @click="emit('action', metric.drill_route)"
        class="inline-flex items-center gap-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline"
      >
        <span>Detail</span>
        <ArrowUpRight :size="11" />
      </button>
    </div>
  </div>
</template>
