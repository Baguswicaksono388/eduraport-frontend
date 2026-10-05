<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Users, AlertCircle, FileText, CalendarCheck, Smile, DollarSign, ArrowRight } from 'lucide-vue-next'
import { BaseCard, BaseButton } from '@eduraport/ui'
import { useAuth } from '../../../composables/useAuth'
import { useParent } from '../../../composables/useParent'

const { user } = useAuth()
const { fetchParentDashboard } = useParent()

const loading = ref(true)
const dashboardData = ref<any>(null)
const selectedChildId = ref<string>('')

onMounted(async () => {
  if (user.value?.id) {
    const data = await fetchParentDashboard(user.value.id)
    if (data) {
      dashboardData.value = data
      if (data.students && data.students.length > 0) {
        selectedChildId.value = data.students[0].id
      }
    }
    loading.value = false
  }
})

// Filter data based on selected child
const attendance = computed(() => {
  if (!dashboardData.value || !selectedChildId.value) return null
  return dashboardData.value.attendance_summary?.find((a: any) => a.student_id === selectedChildId.value)
})

const mood = computed(() => {
  if (!dashboardData.value || !selectedChildId.value) return null
  return dashboardData.value.latest_moods?.find((m: any) => m.student_id === selectedChildId.value)
})

const bills = computed(() => {
  if (!dashboardData.value || !selectedChildId.value) return []
  return dashboardData.value.billing_summary?.filter((b: any) => b.student_id === selectedChildId.value) || []
})

const reports = computed(() => {
  if (!dashboardData.value || !selectedChildId.value) return []
  return dashboardData.value.latest_reports?.filter((r: any) => r.student_id === selectedChildId.value) || []
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="!dashboardData || !dashboardData.students?.length" class="text-center py-12 bg-white/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
      <Users class="mx-auto text-slate-300 dark:text-zinc-700 mb-3" :size="40" />
      <p class="text-sm font-semibold text-slate-700 dark:text-zinc-300">Belum ada data anak yang terhubung</p>
      <p class="text-xs text-slate-500 mt-1">Silakan hubungi pihak sekolah untuk menghubungkan akun Anda.</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Child Selection -->
      <div v-if="dashboardData.students.length > 1" class="flex flex-col gap-1.5 md:w-1/3">
        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Pilih Anak</label>
        <select v-model="selectedChildId" class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-violet-600 text-slate-900 dark:text-zinc-100">
          <option v-for="student in dashboardData.students" :key="student.id" :value="student.id">
            {{ student.full_name }}
          </option>
        </select>
      </div>

      <!-- Widgets Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Attendance Summary -->
        <BaseCard stripe class="border-t-4 border-t-emerald-500">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CalendarCheck :size="20" />
            </div>
            <h3 class="font-bold text-slate-900 dark:text-zinc-100">Kehadiran (30 Hari)</h3>
          </div>
          <div v-if="attendance" class="grid grid-cols-2 gap-4 text-center">
            <div class="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
              <p class="text-[10px] font-bold text-slate-500 uppercase">Hadir</p>
              <p class="text-2xl font-black text-emerald-600 mt-1">{{ attendance.present || 0 }}</p>
            </div>
            <div class="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
              <p class="text-[10px] font-bold text-slate-500 uppercase">Absen</p>
              <p class="text-2xl font-black text-rose-600 mt-1">{{ attendance.absent || 0 }}</p>
            </div>
          </div>
          <div v-else class="text-xs text-slate-500">Data belum tersedia.</div>
        </BaseCard>

        <!-- Mood Check-in -->
        <BaseCard stripe class="border-t-4 border-t-amber-500">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <Smile :size="20" />
            </div>
            <h3 class="font-bold text-slate-900 dark:text-zinc-100">Mood Terakhir</h3>
          </div>
          <div v-if="mood" class="text-center py-2">
            <div class="text-4xl mb-2">{{ mood.emoji || '😊' }}</div>
            <p class="text-sm font-semibold text-slate-800 dark:text-zinc-200">{{ mood.label || 'Senang' }}</p>
            <p class="text-[10px] text-slate-500 mt-1">Dicatat pada {{ new Date(mood.created_at).toLocaleDateString('id-ID') }}</p>
          </div>
          <div v-else class="text-xs text-slate-500">Belum ada check-in mood.</div>
        </BaseCard>

        <!-- Outstanding Bills -->
        <BaseCard stripe class="border-t-4 border-t-rose-500">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
                <DollarSign :size="20" />
              </div>
              <h3 class="font-bold text-slate-900 dark:text-zinc-100">Tagihan Aktif</h3>
            </div>
          </div>
          <div v-if="bills.length > 0" class="space-y-3">
            <div v-for="bill in bills" :key="bill.id" class="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2 last:border-0 last:pb-0">
              <div>
                <p class="text-xs font-bold text-slate-800 dark:text-zinc-200">{{ bill.description }}</p>
                <p class="text-[9px] text-rose-500 mt-0.5">Jatuh Tempo: {{ new Date(bill.due_date).toLocaleDateString('id-ID') }}</p>
              </div>
              <p class="text-sm font-black text-rose-600">Rp {{ bill.amount?.toLocaleString('id-ID') }}</p>
            </div>
          </div>
          <div v-else class="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-lg text-xs font-semibold">
            <AlertCircle :size="16" />
            Tidak ada tagihan tertunggak.
          </div>
        </BaseCard>
      </div>

      <!-- Latest Reports List -->
      <div class="mt-8">
        <h3 class="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <FileText class="text-violet-600 dark:text-violet-400" :size="20" />
          Rapor Digital Terbaru
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseCard v-for="report in reports" :key="report.id" class="hover:border-violet-500 hover:shadow-md transition-all group">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold text-slate-900 dark:text-zinc-100 text-base">{{ report.title }}</h4>
                <p class="text-xs text-slate-500 mt-1">Semester {{ report.semester }} &bull; {{ report.academic_year }}</p>
                
                <div class="mt-3">
                  <span class="inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
                    :class="[
                      report.status === 'APPROVED_BY_PARENT' 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-100 dark:border-amber-800'
                    ]"
                  >
                    {{ report.status === 'APPROVED_BY_PARENT' ? 'Ditandatangani' : 'Menunggu TTD Anda' }}
                  </span>
                </div>
              </div>
              <NuxtLink :to="`/parent/report/${report.id}?studentId=${selectedChildId}`" class="p-2 bg-slate-50 dark:bg-zinc-900 text-slate-400 group-hover:text-violet-600 group-hover:bg-violet-50 dark:group-hover:bg-violet-900/30 rounded-lg transition-colors">
                <ArrowRight :size="20" />
              </NuxtLink>
            </div>
          </BaseCard>

          <div v-if="reports.length === 0" class="col-span-full py-8 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
            <p class="text-sm font-semibold text-slate-500 dark:text-zinc-400">Belum ada rapor digital yang diterbitkan.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
