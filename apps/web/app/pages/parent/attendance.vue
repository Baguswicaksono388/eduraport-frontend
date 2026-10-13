<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { CalendarCheck, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle, Clock, ArrowLeft } from 'lucide-vue-next'
import { BaseCard, BaseButton } from '@eduraport/ui'
import { useParent } from '../../composables/useParent'
import { useAuth } from '../../composables/useAuth'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_token')
      if (!token.value) return navigateTo('/login')
    }
  ]
})

const { user } = useAuth()
const { fetchMyChildren, myChildren, fetchAttendance } = useParent()

const selectedChildId = ref('')
const currentMonth = ref(new Date().toISOString().slice(0, 7))
const loading = ref(true)
const attendanceData = ref<any>(null)

const activeChild = computed(() => {
  return myChildren.value.find((c: any) => c.student_id === selectedChildId.value) || myChildren.value[0]
})

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
          <p class="text-xs text-slate-500">Pantau absensi harian dan rekap kehadiran bulanan</p>
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

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <!-- Summary Badges -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <BaseCard stripe class="border-t-4 border-t-emerald-500 text-center">
          <p class="text-[10px] font-bold uppercase text-slate-500">Hadir</p>
          <p class="text-3xl font-black text-emerald-600 mt-1">{{ attendanceData?.summary?.hadir || 0 }}</p>
          <span class="text-[9px] text-slate-400">Hari</span>
        </BaseCard>

        <BaseCard stripe class="border-t-4 border-t-blue-500 text-center">
          <p class="text-[10px] font-bold uppercase text-slate-500">Sakit</p>
          <p class="text-3xl font-black text-blue-600 mt-1">{{ attendanceData?.summary?.sakit || 0 }}</p>
          <span class="text-[9px] text-slate-400">Hari</span>
        </BaseCard>

        <BaseCard stripe class="border-t-4 border-t-amber-500 text-center">
          <p class="text-[10px] font-bold uppercase text-slate-500">Izin</p>
          <p class="text-3xl font-black text-amber-600 mt-1">{{ attendanceData?.summary?.izin || 0 }}</p>
          <span class="text-[9px] text-slate-400">Hari</span>
        </BaseCard>

        <BaseCard stripe class="border-t-4 border-t-rose-500 text-center">
          <p class="text-[10px] font-bold uppercase text-slate-500">Alpha / Tanpa Ket.</p>
          <p class="text-3xl font-black text-rose-600 mt-1">{{ attendanceData?.summary?.alpha || 0 }}</p>
          <span class="text-[9px] text-slate-400">Hari</span>
        </BaseCard>
      </div>

      <!-- Detail Daily Attendance List -->
      <BaseCard>
        <h3 class="font-bold text-slate-900 dark:text-zinc-100 text-base mb-4">Riwayat Absensi Harian</h3>
        
        <div v-if="attendanceData?.chart?.length > 0" class="divide-y divide-slate-100 dark:divide-zinc-800">
          <div v-for="item in attendanceData.chart" :key="item.date" class="py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'w-3 h-3 rounded-full',
                  item.status === 'hadir' || item.status === 'present' ? 'bg-emerald-500' :
                  item.status === 'sakit' || item.status === 'sick' ? 'bg-blue-500' :
                  item.status === 'izin' || item.status === 'excused' ? 'bg-amber-500' : 'bg-rose-500'
                ]"
              ></span>
              <div>
                <p class="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  {{ new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) }}
                </p>
                <p class="text-[10px] text-slate-500">{{ item.date }}</p>
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
  </div>
</template>
