<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Award, ArrowLeft, Trophy, HeartHandshake, ShieldAlert, Sparkles } from 'lucide-vue-next'
import { BaseCard, BaseButton } from '@eduraport/ui'
import { useParent } from '../../composables/useParent'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_token')
      if (!token.value) return navigateTo('/login')
    }
  ]
})

const { fetchMyChildren, myChildren, fetchGrades, fetchBehavior } = useParent()

const selectedChildId = ref('')
const activeTab = ref<'akademik' | 'sikap' | 'bk'>('akademik')
const gradeType = ref<string>('all')
const loading = ref(true)

const gradesData = ref<any>({ grades: [], ranking: null })
const behaviorData = ref<any>({ bk_points: null, attitude_records: [] })

const loadData = async () => {
  if (!selectedChildId.value) return
  loading.value = true
  try {
    const typeParam = gradeType.value === 'all' ? undefined : gradeType.value
    const [grades, behavior] = await Promise.all([
      fetchGrades(selectedChildId.value, undefined, typeParam),
      fetchBehavior(selectedChildId.value)
    ])
    gradesData.value = grades
    behaviorData.value = behavior
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchMyChildren()
  if (myChildren.value.length > 0) {
    selectedChildId.value = myChildren.value[0].student_id
    await loadData()
  } else {
    loading.value = false
  }
})

watch([selectedChildId, gradeType], () => {
  loadData()
})

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200'
  if (score >= 70) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200'
  return 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200'
}
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-violet-600 transition">
          <ArrowLeft :size="18" />
        </NuxtLink>
        <div>
          <h2 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Award class="text-violet-600" :size="24" />
            Nilai, Sikap & Kedisiplinan
          </h2>
          <p class="text-xs text-slate-500">Pantau capaian akademik, ranking kelas, dan catatan perilaku anak</p>
        </div>
      </div>

      <!-- Child Selector -->
      <div v-if="myChildren.length > 1" class="w-48">
        <select v-model="selectedChildId" class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-violet-600">
          <option v-for="c in myChildren" :key="c.student_id" :value="c.student_id">
            {{ c.student_name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-slate-200 dark:border-zinc-800 gap-6 text-xs font-bold">
      <button
        @click="activeTab = 'akademik'"
        :class="[
          'pb-3 border-b-2 transition flex items-center gap-2',
          activeTab === 'akademik' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'
        ]"
      >
        <Trophy :size="16" /> Nilai Akademik & Ranking
      </button>
      <button
        @click="activeTab = 'sikap'"
        :class="[
          'pb-3 border-b-2 transition flex items-center gap-2',
          activeTab === 'sikap' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'
        ]"
      >
        <HeartHandshake :size="16" /> Penilaian Sikap
      </button>
      <button
        @click="activeTab = 'bk'"
        :class="[
          'pb-3 border-b-2 transition flex items-center gap-2',
          activeTab === 'bk' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'
        ]"
      >
        <ShieldAlert :size="16" /> Poin Kedisiplinan & BK
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <!-- TAB 1: AKADEMIK & RANKING -->
      <div v-if="activeTab === 'akademik'" class="space-y-6">
        <!-- Ranking Banner -->
        <div v-if="gradesData.ranking" class="bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-indigo-500/10 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-3 bg-amber-500 text-white rounded-xl shadow-md">
              <Trophy :size="24" />
            </div>
            <div>
              <p class="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">Peringkat Kelas</p>
              <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100">
                Peringkat {{ gradesData.ranking.posisi }} dari {{ gradesData.ranking.total_siswa }} Siswa
              </h3>
            </div>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-slate-500 uppercase">Rata-Rata Nilai</p>
            <p class="text-2xl font-black text-violet-600">{{ Number(gradesData.ranking.rata_rata || 0).toFixed(1) }}</p>
          </div>
        </div>

        <!-- Grade Type Filter Tabs -->
        <div class="flex gap-2 text-xs">
          <button
            v-for="type in [
              { key: 'all', label: 'Semua Nilai' },
              { key: 'harian', label: 'Tugas & Harian' },
              { key: 'uts', label: 'UTS' },
              { key: 'uas', label: 'UAS' }
            ]"
            :key="type.key"
            @click="gradeType = type.key"
            :class="[
              'px-3 py-1.5 rounded-lg font-semibold transition',
              gradeType === type.key ? 'bg-violet-600 text-white' : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
            ]"
          >
            {{ type.label }}
          </button>
        </div>

        <!-- Grades Table / Cards -->
        <div v-if="gradesData.grades?.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseCard v-for="(g, idx) in gradesData.grades" :key="idx" class="hover:border-violet-500 transition">
            <div class="flex justify-between items-center">
              <div>
                <h4 class="font-bold text-slate-900 dark:text-zinc-100 text-sm">{{ g.subject_name }}</h4>
                <p class="text-[10px] text-slate-400 mt-0.5">Rata-rata kumulatif</p>
              </div>
              <span
                :class="[
                  'text-base font-black px-3 py-1 rounded-xl border',
                  getScoreColor(Number(g.average_score || 0))
                ]"
              >
                {{ Number(g.average_score || 0).toFixed(1) }}
              </span>
            </div>
          </BaseCard>
        </div>

        <div v-else class="text-center py-12 text-slate-400 text-xs bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
          Belum ada rekap nilai untuk kategori ini.
        </div>
      </div>

      <!-- TAB 2: PENILAIAN SIKAP -->
      <div v-else-if="activeTab === 'sikap'" class="space-y-4">
        <div v-if="behaviorData.attitude_records?.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseCard v-for="(rec, idx) in behaviorData.attitude_records" :key="idx">
            <div class="flex justify-between items-start mb-2">
              <h4 class="font-bold text-slate-900 dark:text-zinc-100 text-sm">{{ rec.component_name || 'Aspek Sikap' }}</h4>
              <span class="text-xs font-black px-2.5 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 rounded-lg">
                Predikat: {{ rec.grade_letter || 'A' }}
              </span>
            </div>
            <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed italic">
              "{{ rec.notes || 'Menunjukkan sikap yang sangat santun, disiplin, dan bertanggung jawab.' }}"
            </p>
            <p class="text-[10px] text-slate-400 mt-2">Mata Pelajaran: {{ rec.subject_name || 'Umum' }}</p>
          </BaseCard>
        </div>

        <div v-else class="text-center py-12 text-slate-400 text-xs bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
          Belum ada rekaman penilaian sikap untuk semester ini.
        </div>
      </div>

      <!-- TAB 3: POIN KEDISIPLINAN & BK -->
      <div v-else-if="activeTab === 'bk'" class="space-y-6">
        <BaseCard stripe class="border-t-4 border-t-indigo-500">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Poin Kedisiplinan Siswa</p>
              <h3 class="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">
                {{ behaviorData.bk_points?.total || 100 }} / 100 Poin
              </h3>
            </div>
            <span class="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 rounded-full">
              Status Perilaku Baik
            </span>
          </div>

          <!-- Visual Progress Bar -->
          <div class="w-full bg-slate-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
            <div
              class="h-full bg-emerald-500 transition-all duration-500"
              :style="{ width: `${Math.min(100, behaviorData.bk_points?.total || 100)}%` }"
            ></div>
          </div>
        </BaseCard>

        <!-- Catatan Pelanggaran / Penghargaan -->
        <BaseCard>
          <h4 class="font-bold text-slate-900 dark:text-zinc-100 text-sm mb-3">Riwayat Catatan Kedisiplinan</h4>
          <div v-if="behaviorData.bk_points?.history?.length > 0" class="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
            <div v-for="h in behaviorData.bk_points.history" :key="h.id" class="py-2.5 flex justify-between items-center">
              <div>
                <p class="font-bold text-slate-800 dark:text-zinc-200">{{ h.rule_name || 'Catatan Kedisiplinan' }}</p>
                <p class="text-[10px] text-slate-400">{{ h.incident_date }} &bull; {{ h.notes || '-' }}</p>
              </div>
              <span class="font-bold text-rose-600">{{ h.points_applied }} Poin</span>
            </div>
          </div>
          <p v-else class="text-xs text-slate-400 py-4 text-center">Tidak ada catatan pelanggaran. Siswa tertib dan mematuhi tata tertib sekolah.</p>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
