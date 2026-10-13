<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Users, AlertCircle, FileText, CalendarCheck, Smile, DollarSign, ArrowRight,
  Clock, MessageSquare, FileEdit, Wallet, BookMarked, Bell, ShieldCheck, Award
} from 'lucide-vue-next'
import { BaseCard, BaseButton } from '@eduraport/ui'
import { useAuth } from '../../../composables/useAuth'
import { useParent } from '../../../composables/useParent'
import AiChatbotModal from '../../parent/AiChatbotModal.vue'

const { user } = useAuth()
const { fetchParentDashboard } = useParent()

const loading = ref(true)
const dashboardData = ref<any>(null)
const selectedChildId = ref<string>('')

const studentsList = computed(() => {
  if (!dashboardData.value?.students) return []
  return dashboardData.value.students.map((s: any) => {
    const prof = s.profile || s
    return {
      id: prof.student_id || prof.id || s.student_id || s.id,
      name: prof.student_name || prof.full_name || prof.name || s.student_name || s.full_name || 'Siswa',
      school_name: prof.school_name || s.school_name || '',
      class_name: prof.class_name || s.class_name || '',
      attendance_summary: s.attendance_summary,
      latest_moods: s.latest_moods,
      billing_summary: s.billing_summary,
      latest_reports: s.latest_reports,
      raw: s
    }
  })
})

onMounted(async () => {
  if (user.value?.id) {
    const data = await fetchParentDashboard(user.value.id)
    if (data) {
      dashboardData.value = data
      const list = studentsList.value
      if (list && list.length > 0) {
        // Restore active child from localStorage if available
        const savedChildId = localStorage.getItem('parent_active_child_id')
        const found = list.find((c: any) => c.id === savedChildId)
        selectedChildId.value = found ? found.id : list[0].id
      }
    }
    loading.value = false
  }
})

const selectChild = (childId: string) => {
  selectedChildId.value = childId
  localStorage.setItem('parent_active_child_id', childId)
}

const activeStudent = computed(() => {
  if (!studentsList.value.length || !selectedChildId.value) return null
  return studentsList.value.find((s: any) => s.id === selectedChildId.value) || studentsList.value[0]
})

// Filter data based on selected child
const attendance = computed(() => {
  if (activeStudent.value?.attendance_summary) return activeStudent.value.attendance_summary
  if (dashboardData.value?.attendance_summary) {
    return dashboardData.value.attendance_summary.find((a: any) => a.student_id === selectedChildId.value)
  }
  return null
})

const mood = computed(() => {
  if (activeStudent.value?.latest_moods?.length) return activeStudent.value.latest_moods[0]
  if (dashboardData.value?.latest_moods) {
    return dashboardData.value.latest_moods.find((m: any) => m.student_id === selectedChildId.value)
  }
  return null
})

const bills = computed(() => {
  if (activeStudent.value?.billing_summary) return activeStudent.value.billing_summary
  if (dashboardData.value?.billing_summary) {
    return dashboardData.value.billing_summary.filter((b: any) => b.student_id === selectedChildId.value)
  }
  return []
})

const reports = computed(() => {
  if (activeStudent.value?.latest_reports) return activeStudent.value.latest_reports
  if (dashboardData.value?.latest_reports) {
    return dashboardData.value.latest_reports.filter((r: any) => r.student_id === selectedChildId.value)
  }
  return []
})

const quickActions = [
  { label: 'Kehadiran', to: '/parent/attendance', icon: CalendarCheck, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
  { label: 'Nilai & Sikap', to: '/parent/grades', icon: Award, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' },
  { label: 'Tagihan SPP', to: '/parent/bills', icon: DollarSign, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
  { label: 'Jadwal Pelajaran', to: '/parent/schedule', icon: Clock, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
  { label: 'Pesan Guru', to: '/parent/messages', icon: MessageSquare, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
  { label: 'Ajukan Izin', to: '/parent/leave', icon: FileEdit, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
  { label: 'Dompet Kantin', to: '/parent/wallet', icon: Wallet, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  { label: 'Tahfidz Pesantren', to: '/parent/pesantren', icon: BookMarked, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
  { label: 'Janji Temu PTM', to: '/parent/meetings', icon: CalendarCheck, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40' },
  { label: 'Pengumuman', to: '/parent/announcements', icon: Bell, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40' },
  { label: 'Notifikasi', to: '/parent/notification-preferences', icon: Bell, color: 'text-slate-600 bg-slate-100 dark:bg-zinc-800' },
  { label: 'Log Keamanan', to: '/parent/security-log', icon: ShieldCheck, color: 'text-slate-600 bg-slate-100 dark:bg-zinc-800' }
]
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
      <!-- Child Switcher Pills (FE-02) -->
      <div class="space-y-2">
        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Pilih Profil Putra/Putri Anda</label>
        <div class="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            v-for="student in studentsList"
            :key="student.id"
            @click="selectChild(student.id)"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border shrink-0',
              selectedChildId === student.id
                ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-500/25'
                : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-violet-300'
            ]"
          >
            <div class="w-2 h-2 rounded-full" :class="selectedChildId === student.id ? 'bg-amber-300' : 'bg-slate-300'"></div>
            <span>{{ student.name }}</span>
            <span v-if="student.class_name" class="text-[10px] opacity-75 font-normal">({{ student.class_name }})</span>
          </button>
        </div>
      </div>

      <!-- Quick Action Bar -->
      <div class="space-y-2">
        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Menu & Akses Cepat</label>
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          <NuxtLink
            v-for="action in quickActions"
            :key="action.to"
            :to="action.to"
            class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-violet-500 p-3 rounded-2xl flex flex-col items-center justify-center text-center group hover:shadow-md transition-all"
          >
            <div :class="['p-2.5 rounded-xl mb-2 group-hover:scale-110 transition-transform', action.color]">
              <component :is="action.icon" :size="20" />
            </div>
            <span class="text-[11px] font-bold text-slate-800 dark:text-zinc-200 line-clamp-1 group-hover:text-violet-600 transition">
              {{ action.label }}
            </span>
          </NuxtLink>
        </div>
      </div>

      <!-- Widgets Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Attendance Summary -->
        <BaseCard stripe class="border-t-4 border-t-emerald-500">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <CalendarCheck :size="20" />
              </div>
              <h3 class="font-bold text-slate-900 dark:text-zinc-100">Kehadiran (30 Hari)</h3>
            </div>
            <NuxtLink to="/parent/attendance" class="text-xs font-bold text-emerald-600 hover:underline">
              Detail &rarr;
            </NuxtLink>
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
            <NuxtLink to="/parent/bills" class="text-xs font-bold text-rose-600 hover:underline">
              Bayar &rarr;
            </NuxtLink>
          </div>
          <div v-if="bills.length > 0" class="space-y-3">
            <div v-for="bill in bills" :key="bill.id" class="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2 last:border-0 last:pb-0">
              <div>
                <p class="text-xs font-bold text-slate-800 dark:text-zinc-200">{{ bill.title || bill.description || bill.name || 'Tagihan Sekolah' }}</p>
                <p class="text-[9px] text-rose-500 mt-0.5">Jatuh Tempo: {{ bill.due_date ? new Date(bill.due_date).toLocaleDateString('id-ID') : '-' }}</p>
              </div>
              <p class="text-sm font-black text-rose-600">Rp {{ Number(bill.amount || bill.remaining_amount || 0).toLocaleString('id-ID') }}</p>
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
                <h4 class="font-bold text-slate-900 dark:text-zinc-100 text-base">{{ report.title || `Rapor Semester ${report.semester || ''}` }}</h4>
                <p class="text-xs text-slate-500 mt-1">Semester {{ report.semester }} &bull; {{ report.academic_year || report.academic_year_id || '' }}</p>
                
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

    <!-- AI Chatbot FAB & Modal (FE-17) -->
    <AiChatbotModal :studentId="selectedChildId" :studentName="activeStudent?.name" />
  </div>
</template>
