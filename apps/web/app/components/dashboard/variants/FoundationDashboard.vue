<script setup lang="ts">
import { computed } from 'vue'
import { Building2, TrendingUp, ShieldCheck, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  consolidatedData: {
    schools: Array<{ id: string; name: string }>
    metrics: Array<{
      metric_key: string
      value: number
      schools: Array<{ school_id: string; school_name: string; value: number; payload: any }>
    }>
  }
  loading: boolean
}>()

const schoolRows = computed(() => {
  const schools = props.consolidatedData?.schools || []
  const metrics = props.consolidatedData?.metrics || []
  
  return schools.map((s: any) => {
    const findValue = (key: string) => {
      const m = metrics.find((x: any) => x.metric_key === key)
      const sm = m?.schools?.find((su: any) => su.school_id === s.id)
      return sm ? sm.value : 0
    }
    
    const findPayload = (key: string) => {
      const m = metrics.find((x: any) => x.metric_key === key)
      const sm = m?.schools?.find((su: any) => su.school_id === s.id)
      return sm ? sm.payload : null
    }

    const healthPayload = findPayload('fdn.school.health')
    const badge = healthPayload?.badge || 'Sehat'

    return {
      id: s.id,
      name: s.name,
      studentAtt: findValue('att.students.today'),
      teacherAtt: findValue('att.teachers.today'),
      collectSpp: findValue('fin.collect.month'),
      readiness: findValue('acad.report.readiness'),
      occupancy: findValue('growth.occupancy'),
      healthBadge: badge
    }
  })
})

const getMetricValue = (key: string) => {
  const m = props.consolidatedData?.metrics?.find((x) => x.metric_key === key)
  return m ? m.value : 0
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Greeting for Yayasan -->
    <div class="bg-gradient-to-r from-violet-600 to-indigo-700 dark:from-violet-900 dark:to-indigo-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
      <div class="space-y-2 relative z-10">
        <h2 class="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2.5">
          <Building2 :size="24" class="text-violet-200" />
          Selamat Datang, Pengurus Yayasan
        </h2>
        <p class="text-xs md:text-sm text-violet-100 font-semibold max-w-2xl leading-relaxed">
          Dashboard Konsolidasi Yayasan menyajikan performa agregat dari seluruh unit sekolah yang Anda naungi. Pantau kehadiran, finansial, dan kelengkapan akademik secara terpadu.
        </p>
      </div>
      <div class="flex items-center gap-2.5 bg-white/10 px-4 py-2.5 rounded-xl border border-white/15 backdrop-blur-sm self-start md:self-auto">
        <ShieldCheck :size="18" class="text-emerald-300" />
        <span class="text-xs font-bold uppercase tracking-wider">Status Konsolidasi Aktif</span>
      </div>
    </div>

    <!-- Consolidated Aggregated Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      <!-- SPP Collectibility -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
        <span class="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500 block">Kolektibilitas SPP Yayasan</span>
        <h4 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-zinc-100">
          {{ getMetricValue('fin.collect.month') }}%
        </h4>
        <p class="text-[10px] text-slate-400 font-semibold leading-relaxed">
          Rata-rata rasio tagihan SPP bulanan terbayar di seluruh unit sekolah.
        </p>
      </div>

      <!-- Student Attendance -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
        <span class="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500 block">Rata-rata Kehadiran Siswa</span>
        <h4 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-zinc-100">
          {{ getMetricValue('att.students.today') }}%
        </h4>
        <p class="text-[10px] text-slate-400 font-semibold leading-relaxed">
          Tingkat kehadiran siswa harian terpadu dari seluruh kelas dan unit sekolah.
        </p>
      </div>

      <!-- Report Readiness -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
        <span class="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500 block">Kesiapan Rapor Yayasan</span>
        <h4 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-zinc-100">
          {{ getMetricValue('acad.report.readiness') }}%
        </h4>
        <p class="text-[10px] text-slate-400 font-semibold leading-relaxed">
          Persentase kelengkapan penginputan nilai raport yang telah difinalisasi guru.
        </p>
      </div>

      <!-- Growth Occupancy -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
        <span class="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500 block">Rasio Okupansi Kelas</span>
        <h4 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-zinc-100">
          {{ getMetricValue('growth.occupancy') }}%
        </h4>
        <p class="text-[10px] text-slate-400 font-semibold leading-relaxed">
          Rasio keterisian kapasitas tampung ruang kelas dibanding total kapasitas terdaftar.
        </p>
      </div>

    </div>

    <!-- School Unit Performance Comparison Table -->
    <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden space-y-4">
      <div class="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h3 class="text-sm font-black tracking-tight text-slate-800 dark:text-zinc-200">
            Perbandingan Kinerja Antar Unit Sekolah
          </h3>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">
            Komparasi metriks operasional, finansial, dan kesehatan sekolah secara real-time.
          </p>
        </div>
        <TrendingUp class="text-violet-500 hidden sm:block" :size="20" />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs min-w-[700px]">
          <thead>
            <tr class="border-b border-slate-100 dark:border-zinc-800 text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider bg-slate-50/50 dark:bg-zinc-950/20">
              <th class="py-3.5 px-5">Nama Unit Sekolah</th>
              <th class="py-3.5 px-5">Kehadiran Siswa</th>
              <th class="py-3.5 px-5">Kehadiran Guru</th>
              <th class="py-3.5 px-5">Kolektibilitas SPP</th>
              <th class="py-3.5 px-5">Kesiapan Rapor</th>
              <th class="py-3.5 px-5">Okupansi Kelas</th>
              <th class="py-3.5 px-5 text-center">Status Kesehatan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/80">
            <tr v-for="r in schoolRows" :key="r.id" class="hover:bg-slate-50/50 dark:hover:bg-zinc-850/30 transition-colors">
              <td class="py-3.5 px-5 font-bold text-slate-700 dark:text-zinc-200">{{ r.name }}</td>
              <td class="py-3.5 px-5 font-extrabold" :class="r.studentAtt >= 90 ? 'text-slate-600 dark:text-zinc-300' : 'text-rose-500'">
                {{ r.studentAtt }}%
              </td>
              <td class="py-3.5 px-5 font-extrabold" :class="r.teacherAtt >= 95 ? 'text-slate-600 dark:text-zinc-300' : 'text-amber-500'">
                {{ r.teacherAtt }}%
              </td>
              <td class="py-3.5 px-5 font-extrabold" :class="r.collectSpp >= 80 ? 'text-slate-600 dark:text-zinc-300' : 'text-rose-500'">
                {{ r.collectSpp }}%
              </td>
              <td class="py-3.5 px-5 font-extrabold" :class="r.readiness >= 75 ? 'text-slate-600 dark:text-zinc-300' : 'text-amber-500'">
                {{ r.readiness }}%
              </td>
              <td class="py-3.5 px-5 font-extrabold" :class="r.occupancy >= 80 ? 'text-slate-600 dark:text-zinc-300' : 'text-amber-500'">
                {{ r.occupancy }}%
              </td>
              <td class="py-3.5 px-5 text-center">
                <span 
                  class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase shadow-sm border"
                  :class="{
                    'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50': r.healthBadge === 'Sehat',
                    'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50': r.healthBadge === 'Perlu perhatian',
                    'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50': r.healthBadge === 'Prioritas'
                  }"
                >
                  <AlertCircle v-if="r.healthBadge !== 'Sehat'" :size="9" />
                  <span>{{ r.healthBadge }}</span>
                </span>
              </td>
            </tr>

            <tr v-if="schoolRows.length === 0" class="text-center py-8 text-slate-400 italic">
              <td colspan="7" class="py-8">Tidak ada data unit sekolah.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
