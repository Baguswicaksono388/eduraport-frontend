<script setup lang="ts">
import { computed } from 'vue'
import BriefingHero from '../BriefingHero.vue'
import GaugeChart from '../GaugeChart.vue'
import TeacherLaggingCard from './TeacherLaggingCard.vue'

const props = defineProps<{
  briefing: { textHtml: string; actions: Array<{ label: string; route: string }> }
  metrics: any[]
  reminders: any[]
  userName: string
  recalculatingKeys: Record<string, boolean>
  sendingReminder: boolean
}>()

const emit = defineEmits<{
  (e: 'recalculate', key: string): void
  (e: 'action', route: string): void
  (e: 'send-reminder', payload: { recipient_id: string; metric_key: string; message_body: string; phone?: string }): void
}>()

// 1. Fetch Readiness metric (value & classes progress)
const readinessMetric = computed(() => props.metrics.find((x) => x.metric_key === 'acad.report.readiness'))
const readinessVal = computed(() => {
  return readinessMetric.value ? Number(readinessMetric.value.value) : 0
})
const classesProgress = computed(() => {
  return readinessMetric.value?.payload?.classes || []
})

// 2. Fetch Lagging teachers
const laggingMetric = computed(() => props.metrics.find((x) => x.metric_key === 'acad.teacher.lagging'))
const laggingTeachers = computed(() => {
  return laggingMetric.value?.payload || []
})

// 3. Fetch Watchlist students
const watchMetric = computed(() => props.metrics.find((x) => x.metric_key === 'acad.students.watch'))
const watchlist = computed(() => {
  return watchMetric.value?.payload || []
})
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

    <!-- Main Curriculum Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Left & Middle: Academics Gauge + Class progress details -->
      <div class="lg:col-span-2 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          
          <!-- Gauge Chart Column -->
          <div class="md:col-span-2 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-zinc-800 pb-6 md:pb-0 md:pr-6">
            <h3 class="text-xs font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider mb-4 text-center">
              Kesiapan Raport Semester
            </h3>
            <GaugeChart :value="readinessVal" label="Kesiapan Total" />
            <p class="text-[10px] text-slate-400 font-semibold text-center mt-4 max-w-xs leading-relaxed">
              Persentase akumulasi pengisian nilai kognitif, afektif, dan ekstrakurikuler yang telah difinalisasi oleh semua guru mapel.
            </p>
          </div>

          <!-- Classes Progress List Column -->
          <div class="md:col-span-3 space-y-4 md:pl-2">
            <h3 class="text-xs font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
              Progres Nilai per Kelas
            </h3>
            
            <div class="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              <div v-for="c in classesProgress" :key="c.class_id" class="space-y-1 animate-in fade-in duration-300">
                <div class="flex justify-between text-xs font-extrabold text-slate-700 dark:text-zinc-300">
                  <span>Kelas {{ c.name }}</span>
                  <span :class="c.pct >= 100 ? 'text-emerald-500' : c.pct >= 60 ? 'text-amber-500' : 'text-rose-500'">{{ c.pct }}%</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-500" 
                    :class="c.pct >= 100 ? 'bg-emerald-500' : c.pct >= 60 ? 'bg-amber-500' : 'bg-rose-500'"
                    :style="`width: ${c.pct}%`"
                  ></div>
                </div>
              </div>

              <div v-if="classesProgress.length === 0" class="text-center py-6 text-slate-400 italic">
                Tidak ada data progres kelas.
              </div>
            </div>
          </div>
        </div>

        <!-- Student Watchlist Card -->
        <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 class="text-xs font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
              Siswa Perlu Perhatian Akademik (Watchlist)
            </h3>
            <p class="text-[10px] text-slate-400 font-semibold mt-0.5">
              Siswa terdeteksi dengan performa menurun atau tingkat absensi (Sakit/Izin/Alpha) berlebih.
            </p>
          </div>
          
          <div class="divide-y divide-slate-100 dark:divide-zinc-800 max-h-64 overflow-y-auto pr-1">
            <div v-for="s in watchlist" :key="s.student_id" class="py-3 flex items-center justify-between gap-4 text-xs">
              <div>
                <p class="font-bold text-slate-700 dark:text-zinc-200">{{ s.name }}</p>
                <p class="text-[10px] text-slate-400">Kelas {{ s.class }}</p>
              </div>
              <div class="text-right">
                <span 
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase shadow-sm border"
                  :class="{
                    'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50': s.severity === 'high',
                    'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50': s.severity === 'medium',
                    'bg-slate-50 text-slate-500 border-slate-100 dark:bg-zinc-850 dark:text-zinc-400 dark:border-zinc-800': s.severity === 'low'
                  }"
                >
                  {{ s.reason }}
                </span>
              </div>
            </div>
            
            <div v-if="watchlist.length === 0" class="text-center py-8 text-slate-400 italic font-semibold">
              Semua siswa berada dalam performa akademik normal.
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Lagging Teachers WhatsApp Panel -->
      <div class="space-y-6">
        <TeacherLaggingCard
          :laggingTeachers="laggingTeachers"
          :reminders="reminders"
          :sending="sendingReminder"
          @send-reminder="emit('send-reminder', $event)"
        />
      </div>

    </div>
  </div>
</template>
