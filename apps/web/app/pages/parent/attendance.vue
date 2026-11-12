<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { CalendarCheck, ChevronLeft, ChevronRight, ArrowLeft, LogIn, LogOut } from 'lucide-vue-next'
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

const { fetchMyChildren, myChildren, fetchAttendance } = useParent()

const selectedChildId = ref('')
const currentMonth = ref(new Date().toISOString().slice(0, 7))
const activeActivityTab = ref<'school' | 'shalat' | 'extracurricular'>('school')
const loading = ref(true)
const attendanceData = ref<any>(null)

const activeChild = computed(() => {
  return myChildren.value.find((c: any) => c.student_id === selectedChildId.value) || myChildren.value[0]
})

const dailyRecords = computed(() => {
  return attendanceData.value?.records || attendanceData.value?.chart || []
})

const summaryStats = computed(() => {
  const s = attendanceData.value?.summary || {}
  return {
    hadir: s.hadir ?? s.present ?? 0,
    sakit: s.sakit ?? s.sick ?? 0,
    izin: s.izin ?? s.excused ?? 0,
    alpha: s.alpha ?? s.absent ?? 0,
  }
})

const shalatItems = computed(() => attendanceData.value?.shalat_items || [])
const shalatRecords = computed(() => attendanceData.value?.shalat_records || [])
const extracurricularRecords = computed(() => attendanceData.value?.extracurricular_records || [])

const formatTime = (val?: string | Date | null) => {
  if (!val) return '-'
  return new Date(val).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  })
}

const loadAttendance = async () => {
  if (!selectedChildId.value) return
  loading.value = true
  try {
    const res = await fetchAttendance(selectedChildId.value, currentMonth.value, 'daily')
    attendanceData.value = res
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchMyChildren()
  if (myChildren.value.length > 0) {
    selectedChildId.value = myChildren.value[0].student_id
    await loadAttendance()
  } else {
    loading.value = false
  }
})

watch([selectedChildId, currentMonth], () => {
  loadAttendance()
})

const changeMonth = (delta: number) => {
  const [yearStr, monthStr] = currentMonth.value.split('-')
  const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1 + delta, 1)
  currentMonth.value = date.toISOString().slice(0, 7)
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
            <CalendarCheck class="text-emerald-500" :size="24" />
            Rekap Kehadiran Siswa
          </h2>
          <p class="text-xs text-slate-500">Pantau absensi berangkat &amp; pulang sekolah, shalat, serta ekstrakurikuler</p>
        </div>
      </div>

      <!-- Child Selector if multiple children -->
      <div v-if="myChildren.length > 1" class="w-48">
        <select v-model="selectedChildId" class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-violet-600">
          <option v-for="c in myChildren" :key="c.student_id" :value="c.student_id">
            {{ c.student_name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Month Navigation -->
    <div class="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
      <button @click="changeMonth(-1)" class="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 transition">
        <ChevronLeft :size="20" />
      </button>
      <div class="text-center">
        <p class="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
          {{ new Date(currentMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) }}
        </p>
        <p class="text-[10px] text-slate-500">{{ activeChild?.student_name || 'Siswa' }} &bull; {{ activeChild?.class_name || 'Kelas' }}</p>
      </div>
      <button @click="changeMonth(1)" class="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 transition">
        <ChevronRight :size="20" />
      </button>
    </div>

    <!-- Activity Sub-Tabs -->
    <div class="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3 overflow-x-auto">
      <button
        type="button"
        data-testid="parent-tab-school"
        @click="activeActivityTab = 'school'"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap',
          activeActivityTab === 'school'
            ? 'bg-violet-600 text-white shadow-sm'
            : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
        ]"
      >
        🏫 Harian Sekolah ({{ dailyRecords.length }})
      </button>
      <button
        type="button"
        data-testid="parent-tab-shalat"
        @click="activeActivityTab = 'shalat'"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap',
          activeActivityTab === 'shalat'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
        ]"
      >
        🕌 Shalat &amp; Mutaba'ah ({{ shalatRecords.length }})
      </button>
      <button
        type="button"
        data-testid="parent-tab-ekstra"
        @click="activeActivityTab = 'extracurricular'"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap',
          activeActivityTab === 'extracurricular'
            ? 'bg-sky-600 text-white shadow-sm'
            : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
        ]"
      >
        ⚽ Ekstrakurikuler ({{ extracurricularRecords.length }})
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <template v-else-if="activeActivityTab === 'school'">
      <!-- Summary Badges -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <BaseCard stripe class="border-t-4 border-t-emerald-500 text-center">
          <p class="text-[10px] font-bold uppercase text-slate-500">Hadir</p>
          <p class="text-3xl font-black text-emerald-600 mt-1">{{ summaryStats.hadir }}</p>
          <span class="text-[9px] text-slate-400">Hari</span>
        </BaseCard>

        <BaseCard stripe class="border-t-4 border-t-blue-500 text-center">
          <p class="text-[10px] font-bold uppercase text-slate-500">Sakit</p>
          <p class="text-3xl font-black text-blue-600 mt-1">{{ summaryStats.sakit }}</p>
          <span class="text-[9px] text-slate-400">Hari</span>
        </BaseCard>

        <BaseCard stripe class="border-t-4 border-t-amber-500 text-center">
          <p class="text-[10px] font-bold uppercase text-slate-500">Izin</p>
          <p class="text-3xl font-black text-amber-600 mt-1">{{ summaryStats.izin }}</p>
          <span class="text-[9px] text-slate-400">Hari</span>
        </BaseCard>

        <BaseCard stripe class="border-t-4 border-t-rose-500 text-center">
          <p class="text-[10px] font-bold uppercase text-slate-500">Alpha / Tanpa Ket.</p>
          <p class="text-3xl font-black text-rose-600 mt-1">{{ summaryStats.alpha }}</p>
          <span class="text-[9px] text-slate-400">Hari</span>
        </BaseCard>
      </div>

      <!-- Detail Daily Attendance List -->
      <BaseCard>
        <h3 class="font-bold text-slate-900 dark:text-zinc-100 text-base mb-4">Riwayat Absensi Harian</h3>

        <div v-if="dailyRecords.length > 0" class="divide-y divide-slate-100 dark:divide-zinc-800">
          <div v-for="item in dailyRecords" :key="item.id || item.date" class="py-3 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'w-3 h-3 rounded-full shrink-0',
                  item.status === 'hadir' || item.status === 'present' ? 'bg-emerald-500' :
                  item.status === 'sakit' || item.status === 'sick' ? 'bg-blue-500' :
                  item.status === 'izin' || item.status === 'excused' ? 'bg-amber-500' : 'bg-rose-500'
                ]"
              ></span>
              <div>
                <p class="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  {{ new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) }}
                </p>
                <div class="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                  <span v-if="item.check_in_time" class="inline-flex items-center gap-1 font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    <LogIn :size="11" /> Masuk: {{ formatTime(item.check_in_time) }}
                  </span>
                  <span v-if="item.check_out_time" class="inline-flex items-center gap-1 font-mono text-amber-700 dark:text-amber-400 font-semibold">
                    <LogOut :size="11" /> Pulang: {{ formatTime(item.check_out_time) }}
                  </span>
                  <span v-if="!item.check_in_time && !item.check_out_time">{{ String(item.date).slice(0, 10) }}</span>
                </div>
              </div>
            </div>

            <span
              :class="[
                'text-[10px] font-bold uppercase px-2.5 py-1 rounded-full',
                item.status === 'hadir' || item.status === 'present' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' :
                item.status === 'sakit' || item.status === 'sick' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40' :
                item.status === 'izin' || item.status === 'excused' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
              ]"
            >
              {{ item.status }}
            </span>
          </div>
        </div>

        <div v-else class="text-center py-12 text-slate-400 text-xs">
          Belum ada rekaman kehadiran untuk bulan ini.
        </div>
      </BaseCard>
    </template>

    <!-- Shalat / Mutabaah Tab -->
    <template v-else-if="activeActivityTab === 'shalat'">
      <BaseCard>
        <h3 class="font-bold text-slate-900 dark:text-zinc-100 text-base mb-4">Riwayat Mutaba'ah Shalat Harian</h3>

        <div v-if="shalatRecords.length > 0" class="divide-y divide-slate-100 dark:divide-zinc-800">
          <div v-for="rec in shalatRecords" :key="rec.id || rec.date" class="py-3 space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {{ new Date(rec.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) }}
              </p>
              <span v-if="rec.is_excused" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40">
                🌸 Uzur Syar'i
              </span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="item in shalatItems"
                :key="item.id"
                :class="[
                  'px-2 py-0.5 rounded-lg text-[10px] font-bold border',
                  rec.check_data?.[item.id]
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800'
                ]"
              >
                {{ rec.check_data?.[item.id] ? '✓' : '·' }} {{ item.name }}
              </span>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-slate-400 text-xs">
          Belum ada catatan shalat / mutaba'ah pada bulan ini.
        </div>
      </BaseCard>
    </template>

    <!-- Extracurricular Tab -->
    <template v-else-if="activeActivityTab === 'extracurricular'">
      <BaseCard>
        <h3 class="font-bold text-slate-900 dark:text-zinc-100 text-base mb-4">Riwayat Kehadiran Ekstrakurikuler</h3>

        <div v-if="extracurricularRecords.length > 0" class="divide-y divide-slate-100 dark:divide-zinc-800">
          <div v-for="rec in extracurricularRecords" :key="rec.id" class="py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold text-slate-900 dark:text-zinc-100">
                ⚽ {{ rec.extracurricular_name }}
              </p>
              <p class="text-[11px] text-slate-500 mt-0.5">
                {{ new Date(rec.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) }}
                <span v-if="rec.check_in_time" class="ml-2 font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                  Masuk: {{ formatTime(rec.check_in_time) }}
                </span>
                <span v-if="rec.check_out_time" class="ml-2 font-mono text-amber-700 dark:text-amber-400 font-semibold">
                  Pulang: {{ formatTime(rec.check_out_time) }}
                </span>
              </p>
            </div>
            <span
              :class="[
                'text-[10px] font-bold uppercase px-2.5 py-1 rounded-full',
                rec.status === 'hadir' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' :
                rec.status === 'sakit' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40' :
                rec.status === 'izin' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
              ]"
            >
              {{ rec.status }}
            </span>
          </div>
        </div>

        <div v-else class="text-center py-12 text-slate-400 text-xs">
          Belum ada kehadiran ekstrakurikuler pada bulan ini.
        </div>
      </BaseCard>
    </template>
  </div>
</template>
