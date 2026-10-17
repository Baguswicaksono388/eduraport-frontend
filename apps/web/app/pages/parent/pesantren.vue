<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import {
  BookMarked,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  HeartHandshake,
  Award,
  Clock,
  Sun,
  Moon,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Star,
  ChevronRight,
  Calendar,
  Printer,
  RefreshCw
} from 'lucide-vue-next'
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

const { fetchMyChildren, myChildren, fetchPesantrenProgress } = useParent()

const selectedChildId = ref('')
const loading = ref(true)
const refreshing = ref(false)
const pesantrenData = ref<any>(null)
const activeTab = ref<'tahfidz' | 'ibadah' | 'halaqah'>('tahfidz')

const activeChild = computed(() => {
  return myChildren.value.find((c: any) => c.student_id === selectedChildId.value) || myChildren.value[0]
})

const loadData = async () => {
  if (!selectedChildId.value) return
  loading.value = true
  try {
    pesantrenData.value = await fetchPesantrenProgress(selectedChildId.value)
  } catch (err) {
    console.error('Failed to load pesantren progress', err)
  } finally {
    loading.value = false
  }
}

const handleRefresh = async () => {
  if (!selectedChildId.value) return
  refreshing.value = true
  try {
    pesantrenData.value = await fetchPesantrenProgress(selectedChildId.value)
  } finally {
    refreshing.value = false
  }
}

const printReport = () => {
  if (typeof window !== 'undefined') {
    window.print()
  }
}

onMounted(async () => {
  await fetchMyChildren()
  if (myChildren.value && myChildren.value.length > 0) {
    selectedChildId.value = myChildren.value[0].student_id
    await loadData()
  } else {
    loading.value = false
  }
})

watch(selectedChildId, () => {
  loadData()
})

const ibadahList = computed(() => {
  const ibadah = pesantrenData.value?.ibadah
  if (!ibadah) return []
  if (ibadah.items && Array.isArray(ibadah.items) && ibadah.items.length > 0) {
    return ibadah.items.map((item: any) => ({
      key: item.id,
      label: item.name,
      type: item.category === 'fardhu'
        ? 'Fardhu Berjamaah'
        : item.category === 'sunnah'
        ? 'Sunnah Muakkadah'
        : item.category === 'tahfidz'
        ? 'Al-Qur\'an'
        : 'Adab & Karakter',
      done: !!item.done,
      icon: item.category === 'fardhu' ? Sun : item.category === 'sunnah' ? Moon : BookOpen
    }))
  }

  const raw = ibadah.today_status || {}
  return Object.keys(raw).map(k => ({
    key: k,
    label: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    type: 'Amalan Santri',
    done: !!raw[k],
    icon: Sun
  }))
})
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
    <!-- Top Bar Navigation & Title -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-zinc-800">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/"
          class="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-700 transition shadow-sm"
          title="Kembali ke Beranda"
        >
          <ArrowLeft :size="18" />
        </NuxtLink>
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
              Modul Pesantren
            </span>
            <span class="text-xs text-slate-400 dark:text-zinc-500">Mutaaba'ah & Tahfidz</span>
          </div>
          <h1 class="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mt-0.5">
            <BookMarked class="text-emerald-600 dark:text-emerald-400" :size="24" />
            Laporan Progres Santri
          </h1>
        </div>
      </div>

      <!-- Action & Child Switcher -->
      <div class="flex items-center gap-2.5">
        <div v-if="myChildren && myChildren.length > 1" class="w-48">
          <select
            v-model="selectedChildId"
            class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm transition"
          >
            <option v-for="c in myChildren" :key="c.student_id" :value="c.student_id">
              {{ c.student_name }}
            </option>
          </select>
        </div>

        <button
          type="button"
          @click="handleRefresh"
          :disabled="refreshing"
          class="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 transition shadow-sm disabled:opacity-50"
          title="Muat Ulang Data"
        >
          <RefreshCw :size="16" :class="{ 'animate-spin': refreshing }" />
        </button>

        <button
          type="button"
          @click="printReport"
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold rounded-xl transition shadow-sm"
          title="Cetak Laporan"
        >
          <Printer :size="15" />
          <span>Cetak</span>
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-24 space-y-4">
      <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs text-slate-500 dark:text-zinc-400 font-medium">Memuat data santri & mutaaba'ah...</p>
    </div>

    <template v-else-if="pesantrenData">
      <!-- Islamic Modern Hero Ribbon -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-teal-900 to-emerald-950 text-white p-5 md:p-6 shadow-lg border border-emerald-700/40">
        <!-- Background decorative ambient circles -->
        <div class="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div class="absolute right-32 -bottom-12 w-40 h-40 bg-teal-400/10 rounded-full blur-xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                <Sparkles :size="12" class="text-amber-300" />
                Asrama Santri & Tahfidz
              </span>
              <span class="text-xs text-emerald-200/80">Semester Berjalan 2026/2027</span>
            </div>
            <h2 class="text-2xl md:text-3xl font-extrabold tracking-tight">
              {{ pesantrenData.student_name || activeChild?.student_name }}
            </h2>
            <p class="text-xs md:text-sm text-emerald-100/80 max-w-xl leading-relaxed">
              Target Kurikulum Pondok: Khatam 30 Juz Al-Qur'an dengan standar tajwid riwayat Hafsh 'an 'Ashim dan istiqomah sholat fardhu berjamaah.
            </p>
          </div>

          <!-- Quick Metric Badges -->
          <div class="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <div class="bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-2.5 rounded-xl text-center min-w-[90px]">
              <span class="block text-[10px] text-emerald-200 uppercase font-semibold">Capaian</span>
              <span class="text-xl md:text-2xl font-black text-amber-300">
                {{ pesantrenData.tahfidz?.completion_percentage || 0 }}%
              </span>
            </div>
            <div class="bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-2.5 rounded-xl text-center min-w-[90px]">
              <span class="block text-[10px] text-emerald-200 uppercase font-semibold">Kelancaran</span>
              <span class="text-base md:text-lg font-extrabold text-white">
                {{ pesantrenData.tahfidz?.fluency_level || 'Mutqin' }}
              </span>
            </div>
            <div class="bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-2.5 rounded-xl text-center min-w-[90px]">
              <span class="block text-[10px] text-emerald-200 uppercase font-semibold">Ibadah</span>
              <span class="text-xl md:text-2xl font-black text-emerald-300">
                {{ pesantrenData.ibadah?.weekly_compliance_percentage || 0 }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs (Accessible & Modern) -->
      <div class="flex border-b border-slate-200 dark:border-zinc-800 space-x-1 md:space-x-2">
        <button
          type="button"
          @click="activeTab = 'tahfidz'"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition cursor-pointer',
            activeTab === 'tahfidz'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:border-slate-300'
          ]"
        >
          <BookMarked :size="16" />
          <span>Hafalan Al-Qur'an (Tahfidz)</span>
          <span class="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-extrabold">
            Juz {{ pesantrenData.tahfidz?.current_juz }}
          </span>
        </button>

        <button
          type="button"
          @click="activeTab = 'ibadah'"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition cursor-pointer',
            activeTab === 'ibadah'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:border-slate-300'
          ]"
        >
          <Clock :size="16" />
          <span>Mutaaba'ah Ibadah</span>
          <span class="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 font-extrabold">
            {{ pesantrenData.ibadah?.weekly_compliance_percentage }}%
          </span>
        </button>

        <button
          type="button"
          @click="activeTab = 'halaqah'"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition cursor-pointer',
            activeTab === 'halaqah'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:border-slate-300'
          ]"
        >
          <UserCheck :size="16" />
          <span>Pembimbing & Halaqah</span>
        </button>
      </div>

      <!-- TAB 1: TAHFIDZ AL-QUR'AN -->
      <div v-show="activeTab === 'tahfidz'" class="space-y-6">
        <!-- Main Tahfidz Card -->
        <BaseCard stripe class="border-t-4 border-t-emerald-600">
          <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 mb-2">
                <Award :size="12" />
                Target Wisuda Tahfidz: Juz {{ pesantrenData.tahfidz?.target_juz || 30 }}
              </span>
              <h3 class="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-100">
                Juz {{ pesantrenData.tahfidz?.current_juz }} &bull; Surah {{ pesantrenData.tahfidz?.current_surah }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                <span>Predikat Kelancaran: <strong class="text-emerald-600 dark:text-emerald-400 font-extrabold">{{ pesantrenData.tahfidz?.fluency_level || 'Mutqin' }}</strong></span>
                <span class="text-slate-300 dark:text-zinc-700">&bull;</span>
                <span>Nilai Tasmi' Terakhir: <strong class="text-slate-800 dark:text-zinc-200 font-extrabold">{{ pesantrenData.tahfidz?.last_test_score }}/100</strong></span>
                <span class="text-slate-300 dark:text-zinc-700">&bull;</span>
                <span>Ayat Terselesaikan: <strong class="text-slate-800 dark:text-zinc-200 font-extrabold">{{ pesantrenData.tahfidz?.total_verses_memorized || 420 }} / {{ pesantrenData.tahfidz?.total_target_verses || 564 }}</strong></span>
              </p>
            </div>

            <div class="text-left md:text-right p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
              <p class="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                {{ pesantrenData.tahfidz?.completion_percentage }}%
              </p>
              <p class="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-1">Capaian Keseluruhan Target</p>
            </div>
          </div>

          <!-- Interactive Progress Bar -->
          <div class="space-y-1.5 mb-6">
            <div class="flex justify-between text-xs text-slate-600 dark:text-zinc-400 font-semibold">
              <span>Progres Keseluruhan Juz 30</span>
              <span>{{ pesantrenData.tahfidz?.total_verses_memorized || 420 }} / {{ pesantrenData.tahfidz?.total_target_verses || 564 }} Ayat</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-zinc-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-zinc-700/50">
              <div
                class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 shadow-sm"
                :style="{ width: `${pesantrenData.tahfidz?.completion_percentage || 0}%` }"
              ></div>
            </div>
          </div>

          <!-- 30 Juz Milestone Visual Tracker Grid -->
          <div class="p-4 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-100 dark:border-zinc-800 mb-6">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <BookOpen :size="14" class="text-emerald-600 dark:text-emerald-400" />
                Peta 30 Juz Al-Qur'an
              </h4>
              <div class="flex items-center gap-3 text-[10px]">
                <span class="flex items-center gap-1 text-slate-600 dark:text-zinc-400">
                  <span class="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span> Mutqin / Selesai
                </span>
                <span class="flex items-center gap-1 text-slate-600 dark:text-zinc-400">
                  <span class="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block ring-2 ring-amber-400/40"></span> Sedang Berjalan
                </span>
                <span class="flex items-center gap-1 text-slate-400 dark:text-zinc-600">
                  <span class="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-zinc-800 inline-block"></span> Belum
                </span>
              </div>
            </div>

            <!-- Grid 1-30 -->
            <div class="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-1.5 text-center">
              <div
                v-for="j in 30"
                :key="j"
                :class="[
                  'py-1.5 rounded-lg text-[10px] font-bold transition select-none flex flex-col items-center justify-center',
                  j === (pesantrenData.tahfidz?.current_juz || 30)
                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 shadow-sm scale-105'
                    : j < (pesantrenData.tahfidz?.current_juz || 30)
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-200/70 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600'
                ]"
                :title="`Juz ${j}`"
              >
                <span>J{{ j }}</span>
              </div>
            </div>
          </div>

          <!-- Ustadz Recommendation & Verified Stamp -->
          <div class="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 relative">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                Ust
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-slate-900 dark:text-zinc-100">Catatan Ustadz Pengampu Tahfidz</span>
                  <span class="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                    <ShieldCheck :size="10" /> Terverifikasi
                  </span>
                </div>
                <p class="text-xs italic text-slate-700 dark:text-zinc-300 leading-relaxed">
                  "{{ pesantrenData.tahfidz?.ustadz_notes || 'Alhamdulillah bacaan makhraj tajwid sangat baik. Perlu ditingkatkan muroja\'ah surah-surah terdahulu menjelang ujian tasmi\' akbar.' }}"
                </p>
              </div>
            </div>
          </div>

          <!-- History Setoran Tasmi' -->
          <div class="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-black text-sm text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                <TrendingUp :size="16" class="text-emerald-600 dark:text-emerald-400" />
                Riwayat Setoran Hafalan & Tasmi'
              </h4>
              <span class="text-[11px] font-semibold text-slate-400">3 Setoran Terakhir</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                    <th class="py-2.5 px-3">Tanggal</th>
                    <th class="py-2.5 px-3">Surah & Ayat</th>
                    <th class="py-2.5 px-3 text-center">Nilai Angka</th>
                    <th class="py-2.5 px-3 text-right">Status Setoran</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                  <tr
                    v-for="(h, idx) in pesantrenData.tahfidz?.history"
                    :key="idx"
                    class="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition"
                  >
                    <td class="py-3 px-3 text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar :size="13" class="text-slate-400" />
                      {{ h.date }}
                    </td>
                    <td class="py-3 px-3 text-slate-900 dark:text-zinc-100 font-bold">
                      {{ h.surah }}
                    </td>
                    <td class="py-3 px-3 text-center font-black text-emerald-600 dark:text-emerald-400">
                      {{ h.score }}
                    </td>
                    <td class="py-3 px-3 text-right whitespace-nowrap">
                      <span class="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {{ h.status }} (Mumtaz)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- TAB 2: MUTABA'AH IBADAH -->
      <div v-show="activeTab === 'ibadah'" class="space-y-6">
        <BaseCard stripe class="border-t-4 border-t-indigo-600">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg inline-block">
                  Kedisiplinan Asrama
                </span>
                <span class="text-xs text-slate-400">Pembaruan Hari Ini</span>
              </div>
              <h3 class="text-lg md:text-xl font-black text-slate-900 dark:text-zinc-100 mt-1">
                Pemantauan Ibadah Harian Santri
              </h3>
              <p class="text-xs text-slate-500 dark:text-zinc-400">
                Pencatatan sholat fardhu berjamaah di masjid dan amalan yaumiyyah pesantren
              </p>
            </div>

            <div class="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 p-3 rounded-xl shrink-0">
              <div class="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                {{ pesantrenData.ibadah?.weekly_compliance_percentage }}%
              </div>
              <div>
                <p class="text-xs font-bold text-slate-900 dark:text-zinc-100">Kepatuhan Mingguan</p>
                <p class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 :size="11" /> Sangat Istiqomah
                </p>
              </div>
            </div>
          </div>

          <!-- Uzur Syar'i / Izin Notice if excused -->
          <div
            v-if="pesantrenData.ibadah?.is_excused"
            class="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-amber-800 dark:text-amber-300"
          >
            <AlertCircle :size="18" class="shrink-0 text-amber-600 dark:text-amber-400" />
            <div class="text-xs">
              <span class="font-bold">Status Khusus: </span>
              Santriwati tercatat sedang dalam masa <strong>Uzur Syar'i (Haid / Sakit)</strong> pada hari ini, sehingga kewajiban sholat fardhu tidak dihitung sebagai pelanggaran kedisiplinan.
            </div>
          </div>

          <!-- Daily Ibadah Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div
              v-for="item in ibadahList"
              :key="item.key"
              class="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-400/50 transition shadow-xs flex flex-col justify-between space-y-3"
            >
              <div class="flex items-start justify-between">
                <div>
                  <span class="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                    {{ item.type }}
                  </span>
                  <h5 class="font-bold text-xs text-slate-800 dark:text-zinc-100 mt-0.5">
                    {{ item.label }}
                  </h5>
                </div>
                <div class="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                  <component :is="item.icon" :size="14" />
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px]">
                <span class="text-slate-400 flex items-center gap-1 text-[10px]">
                  <Clock :size="11" /> {{ item.time }}
                </span>
                <span
                  v-if="item.done"
                  class="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md text-[10px]"
                >
                  <CheckCircle2 :size="12" /> Terlaksana
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 font-semibold text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-[10px]"
                >
                  Belum Ada
                </span>
              </div>
            </div>
          </div>

          <!-- Musyrif Asrama Note -->
          <div class="p-4 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 flex items-start gap-3">
            <div class="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 rounded-xl shrink-0">
              <HeartHandshake :size="18" />
            </div>
            <div>
              <p class="text-xs font-bold text-slate-900 dark:text-zinc-100">Catatan Musyrif & Pembina Asrama</p>
              <p class="text-xs text-slate-600 dark:text-zinc-400 italic mt-0.5">
                "{{ pesantrenData.ibadah?.notes || 'Istiqomah sholat berjamaah di shaf depan masjid pondok. Kedisiplinan bangun qiyamullail sangat terpuji.' }}"
              </p>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- TAB 3: HALAQAH & USTADZ PEMBIMBING -->
      <div v-show="activeTab === 'halaqah'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Halaqah Details Card -->
          <BaseCard stripe class="border-t-4 border-t-amber-500">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                <BookOpen :size="20" />
              </div>
              <div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-zinc-100">Halaqah Tahfidz & Tilawah</h4>
                <p class="text-xs text-slate-400">Kelompok Halaqah Imam Ashim</p>
              </div>
            </div>

            <div class="space-y-3 text-xs text-slate-600 dark:text-zinc-300">
              <div class="flex justify-between py-2 border-b border-slate-100 dark:border-zinc-800">
                <span class="text-slate-400">Ustadz Pembimbing</span>
                <span class="font-bold text-slate-800 dark:text-zinc-200">Ust. Ahmad Al-Hafizh</span>
              </div>
              <div class="flex justify-between py-2 border-b border-slate-100 dark:border-zinc-800">
                <span class="text-slate-400">Jadwal Setoran Harian</span>
                <span class="font-bold text-slate-800 dark:text-zinc-200">Ba'da Subuh & Ba'da Ashar</span>
              </div>
              <div class="flex justify-between py-2 border-b border-slate-100 dark:border-zinc-800">
                <span class="text-slate-400">Metode Talaqqi</span>
                <span class="font-bold text-slate-800 dark:text-zinc-200">Sabaq, Sabqi, & Manzil</span>
              </div>
              <div class="flex justify-between py-2">
                <span class="text-slate-400">Lokasi Halaqah</span>
                <span class="font-bold text-slate-800 dark:text-zinc-200">Serambi Masjid Kampus Putri</span>
              </div>
            </div>
          </BaseCard>

          <!-- Tips for Parents at Home -->
          <BaseCard stripe class="border-t-4 border-t-emerald-600">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                <Sparkles :size="20" />
              </div>
              <div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-zinc-100">Dukungan Orang Tua di Rumah</h4>
                <p class="text-xs text-slate-400">Tips membersamai santri saat liburan</p>
              </div>
            </div>

            <ul class="space-y-2.5 text-xs text-slate-600 dark:text-zinc-300 list-disc list-inside">
              <li>Sempatkan menyimak muroja'ah santri minimal 1 lembar setiap selesai sholat Maghrib.</li>
              <li>Ajak santri sholat fardhu berjamaah di masjid terdekat saat sedang cuti / libur asrama.</li>
              <li>Berikan apresiasi dan motivasi atas setiap ayat dan surah baru yang telah dihafalkan.</li>
              <li>Hindari distraksi gadget / gawai berlebihan yang dapat melemahkan hafalan Qur'an.</li>
            </ul>
          </BaseCard>
        </div>
      </div>
    </template>
  </div>
</template>
