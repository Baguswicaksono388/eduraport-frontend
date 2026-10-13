<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Clock, ArrowLeft, BookOpen, MapPin, UserCheck, Calendar } from 'lucide-vue-next'
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

const { fetchMyChildren, myChildren, fetchSchedule } = useParent()

const selectedChildId = ref('')
const loading = ref(true)
const scheduleData = ref<Record<string, any[]>>({})

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

// Get today's day name in Indonesian
const getTodayName = () => {
  const dayIndex = new Date().getDay()
  const map = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  return map[dayIndex]
}

const activeDay = ref(getTodayName() === 'Minggu' ? 'Senin' : getTodayName())

const loadSchedule = async () => {
  if (!selectedChildId.value) return
  loading.value = true
  try {
    scheduleData.value = await fetchSchedule(selectedChildId.value)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchMyChildren()
  if (myChildren.value.length > 0) {
    selectedChildId.value = myChildren.value[0].student_id
    await loadSchedule()
  } else {
    loading.value = false
  }
})

const isCurrentLive = (day: string, startTime: string, endTime: string) => {
  if (day.toLowerCase() !== getTodayName().toLowerCase()) return false
  const now = new Date()
  const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return nowStr >= startTime && nowStr <= endTime
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
            <Clock class="text-indigo-600" :size="24" />
            Jadwal Pelajaran
          </h2>
          <p class="text-xs text-slate-500">Jadwal mata pelajaran dan ruang kelas mingguan</p>
        </div>
      </div>

      <!-- Child Selector -->
      <div v-if="myChildren.length > 1" class="w-48">
        <select v-model="selectedChildId" @change="loadSchedule" class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-violet-600">
          <option v-for="c in myChildren" :key="c.student_id" :value="c.student_id">
            {{ c.student_name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Day Navigation Tabs -->
    <div class="flex gap-2 overflow-x-auto scrollbar-none pb-1">
      <button
        v-for="day in days"
        :key="day"
        @click="activeDay = day"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0',
          activeDay === day
            ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
            : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:border-slate-300'
        ]"
      >
        <span>{{ day }}</span>
        <span v-if="day.toLowerCase() === getTodayName().toLowerCase()" class="w-2 h-2 rounded-full bg-emerald-400"></span>
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-3">
      <div v-if="scheduleData[activeDay]?.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BaseCard
          v-for="item in scheduleData[activeDay]"
          :key="item.id"
          stripe
          :class="isCurrentLive(activeDay, item.start_time, item.end_time) ? 'border-t-4 border-t-emerald-500 shadow-md ring-2 ring-emerald-500/20' : ''"
        >
          <div class="flex justify-between items-start mb-2">
            <div>
              <span
                v-if="isCurrentLive(activeDay, item.start_time, item.end_time)"
                class="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 mb-1 animate-pulse"
              >
                Sedang Berlangsung (LIVE)
              </span>
              <h3 class="font-bold text-slate-900 dark:text-zinc-100 text-base">
                {{ item.subject_name }}
              </h3>
            </div>
            <span class="text-xs font-black text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2.5 py-1 rounded-lg">
              {{ item.start_time }} - {{ item.end_time }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-zinc-400 mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <div class="flex items-center gap-1.5">
              <UserCheck :size="14" class="text-slate-400 shrink-0" />
              <span class="truncate">{{ item.teacher_name || 'Guru Pengampu' }}</span>
            </div>
            <div class="flex items-center gap-1.5 justify-end">
              <MapPin :size="14" class="text-slate-400 shrink-0" />
              <span>Ruang {{ item.room || 'Kelas' }}</span>
            </div>
          </div>
        </BaseCard>
      </div>

      <div v-else class="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
        <BookOpen class="mx-auto text-slate-400 mb-2" :size="36" />
        <p class="text-sm font-bold text-slate-800 dark:text-zinc-200">Tidak ada jadwal pelajaran di hari {{ activeDay }}</p>
        <p class="text-xs text-slate-400 mt-1">Hari libur atau kegiatan ekstrakurikuler di luar jam pelajaran.</p>
      </div>
    </div>
  </div>
</template>
